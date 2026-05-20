---
name: android-developer
description: |
  Expert Android/Kotlin development covering Jetpack Compose, MVVM architecture, Room database, Retrofit/OkHttp, Coroutines/Flow, WorkManager, Navigation component, Hilt dependency injection, ProGuard, and Play Store guidelines.
  Use when the user asks about android developer, android developer best practices, or needs guidance on android developer implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "mobile best-practices kotlin"
  category: "software-engineering"
  subcategory: "mobile-development"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Android Developer

## Overview

This skill provides comprehensive expertise in building modern Android applications using Kotlin. It covers Jetpack Compose UI development, clean architecture with MVVM, data persistence with Room, networking with Retrofit, reactive programming with Coroutines and Flow, background processing, dependency injection with Hilt, code shrinking, and Play Store compliance.

## Project Architecture

### Clean Architecture with MVVM

```
app/
├── di/                          # Hilt modules
│   ├── AppModule.kt
│   ├── NetworkModule.kt
│   └── DatabaseModule.kt
├── data/
│   ├── local/
│   │   ├── dao/                 # Room DAOs
│   │   ├── entity/              # Room entities
│   │   └── AppDatabase.kt
│   ├── remote/
│   │   ├── api/                 # Retrofit interfaces
│   │   ├── dto/                 # Data transfer objects
│   │   └── interceptor/         # OkHttp interceptors
│   └── repository/              # Repository implementations
├── domain/
│   ├── model/                   # Business models
│   ├── repository/              # Repository interfaces
# ... (condensed) ...
│       ├── home/
│       │   ├── HomeScreen.kt
│       │   └── HomeViewModel.kt
│       ├── detail/
│       └── settings/
├── util/                        # Extension functions, helpers
└── MyApplication.kt             # @HiltAndroidApp
```

## Jetpack Compose

### Screen with ViewModel Integration

```kotlin
@Composable
fun ProductListScreen(
    viewModel: ProductListViewModel = hiltViewModel(),
    onProductClick: (String) -> Unit,
) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Products") },
                actions = {
                    IconButton(onClick = viewModel::refresh) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    # ... (condensed) ...
                    onRetry = viewModel::refresh,
                    modifier = Modifier.padding(padding)
                )
            }
        }
    }
}
```

### Custom Composable Components

```kotlin
@Composable
fun ProductCard(
    product: Product,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            AsyncImage(
                model = ImageRequest.Builder(LocalContext.current)
                    .data(product.imageUrl)
                    # ... (condensed) ...
                    style = MaterialTheme.typography.bodyLarge,
                    color = MaterialTheme.colorScheme.primary,
                )
            }
        }
    }
}
```

## MVVM ViewModel

```kotlin
@HiltViewModel
class ProductListViewModel @Inject constructor(
    private val getProductsUseCase: GetProductsUseCase,
    private val savedStateHandle: SavedStateHandle,
) : ViewModel() {

    private val _uiState = MutableStateFlow<ProductUiState>(ProductUiState.Loading)
    val uiState: StateFlow<ProductUiState> = _uiState.asStateFlow()

    private val categoryId: String = savedStateHandle["categoryId"] ?: "all"

    init {
        loadProducts()
    }

    fun refresh() {
        loadProducts()
    }
# ... (condensed) ...
}

sealed interface ProductUiState {
    data object Loading : ProductUiState
    data class Success(val products: List<Product>) : ProductUiState
    data class Error(val message: String) : ProductUiState
}
```

## Room Database

### Entity, DAO, and Database

```kotlin
// Entity
@Entity(tableName = "products")
data class ProductEntity(
    @PrimaryKey val id: String,
    val name: String,
    val description: String,
    val price: Double,
    @ColumnInfo(name = "image_url") val imageUrl: String?,
    @ColumnInfo(name = "category_id") val categoryId: String,
    @ColumnInfo(name = "updated_at") val updatedAt: Long = System.currentTimeMillis(),
)

// DAO
@Dao
interface ProductDao {
    @Query("SELECT * FROM products ORDER BY name ASC")
    fun observeAll(): Flow<List<ProductEntity>>

    # ... (condensed) ...
    exportSchema = true,
)
@TypeConverters(Converters::class)
abstract class AppDatabase : RoomDatabase() {
    abstract fun productDao(): ProductDao
    abstract fun categoryDao(): CategoryDao
}
```

## Retrofit / OkHttp Networking

### API Interface and Configuration

```kotlin
// API interface
interface ProductApi {
    @GET("products")
    suspend fun getProducts(
        @Query("category") categoryId: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
    ): ApiResponse<List<ProductDto>>

    @GET("products/{id}")
    suspend fun getProduct(@Path("id") id: String): ApiResponse<ProductDto>

    @POST("products")
    suspend fun createProduct(@Body product: CreateProductRequest): ApiResponse<ProductDto>

    @Multipart
    @POST("products/{id}/image")
    suspend fun uploadImage(
        # ... (condensed) ...
        .build()

    @Provides
    @Singleton
    fun provideProductApi(retrofit: Retrofit): ProductApi =
        retrofit.create(ProductApi::class.java)
}
```

## Coroutines and Flow

### Repository with Offline-First Pattern

```kotlin
class ProductRepositoryImpl @Inject constructor(
    private val api: ProductApi,
    private val dao: ProductDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO,
) : ProductRepository {

    supersede fun getProducts(categoryId: String): Flow<List<Product>> = flow {
        // Emit cached data first
        emitAll(
            dao.observeByCategory(categoryId).map { entities ->
                entities.map { it.toDomain() }
            }
        )
    }.onStart {
        // Trigger network refresh in background
        try {
            val response = withContext(dispatcher) {
                api.getProducts(categoryId)
            # ... (condensed) ...
            }.recoverCatching {
                // Fallback to cache
                dao.getById(id)?.toDomain()
                    ?: throw ProductNotFoundException(id)
            }
        }
}
```

## WorkManager for Background Tasks

```kotlin
@HiltWorker
class SyncWorker @AssistedInject constructor(
    @Assisted context: Context,
    @Assisted params: WorkerParameters,
    private val repository: ProductRepository,
) : CoroutineWorker(context, params) {

    supersede suspend fun doWork(): Result {
        return try {
            repository.syncPendingChanges()
            Result.success()
        } catch (e: Exception) {
            if (runAttemptCount < 3) {
                Result.retry()
            } else {
                Result.failure(workDataOf("error" to e.message))
            }
        }
    # ... (condensed) ...
                "product_sync",
                ExistingPeriodicWorkPolicy.KEEP,
                request,
            )
        }
    }
}
```

## Navigation Component with Compose

```kotlin
// Routes
@Serializable data object Home
@Serializable data object Search
@Serializable data class ProductDetail(val productId: String)
@Serializable data class CategoryProducts(val categoryId: String, val title: String)

// NavHost
@Composable
fun AppNavigation(navController: NavHostController = rememberNavController()) {
    NavHost(navController = navController, startDestination = Home) {
        composable<Home> {
            HomeScreen(
                onProductClick = { id -> navController.navigate(ProductDetail(id)) },
                onCategoryClick = { id, title ->
                    navController.navigate(CategoryProducts(id, title))
                },
                onSearchClick = { navController.navigate(Search) },
            )
        # ... (condensed) ...
                title = args.title,
                onProductClick = { id -> navController.navigate(ProductDetail(id)) },
                onBack = { navController.popBackStack() },
            )
        }
    }
}
```

## Hilt Dependency Injection

```kotlin
@HiltAndroidApp
class MyApplication : Application()

// App-level module
@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideAppDatabase(@ApplicationContext context: Context): AppDatabase =
        Room.databaseBuilder(context, AppDatabase::class.java, "myapp.db")
            .addMigrations(MIGRATION_2_3)
            .build()

    @Provides
    fun provideProductDao(db: AppDatabase): ProductDao = db.productDao()
}
# ... (condensed) ...
// Use case injection
class GetProductsUseCase @Inject constructor(
    private val repository: ProductRepository,
) {
    operator fun invoke(categoryId: String): Flow<List<Product>> =
        repository.getProducts(categoryId)
}
```

## ProGuard / R8 Configuration

```proguard
# proguard-rules.pro

# Keep data classes used with Moshi/Gson
-keep class com.myapp.data.remote.dto.** { *; }
-keep class com.myapp.data.local.entity.** { *; }

# Moshi
-keepclassmembers class * {
    @com.squareup.moshi.Json <fields>;
}
-keep @com.squareup.moshi.JsonQualifier @interface *

# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-keepclassmembers,allowshrinking,allowobfuscation interface * {
    @retrofit2.http.* <methods>;
}
# ... (condensed) ...
-keepclassmembers class * implements android.os.Parcelable {
    public static final ** CREATOR;
}

# Debugging - keep source file names and line numbers
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile
```

## Play Store Guidelines Summary

### Common Rejection Reasons

| Issue | Policy | Prevention |
|-------|--------|------------|
| Crashes on review device | Functionality | Test on Pixel devices and various API levels |
| Missing privacy policy | User Data | Link privacy policy in Store listing and in-app |
| Deceptive behavior | Deceptive Behavior | App must do what listing describes |
| Inappropriate content | Content | Implement content rating questionnaire honestly |
| Background battery drain | Background Limits | Use WorkManager, respect Doze mode |
| Excessive permissions | Permissions | Request only what you need, explain why |
| Missing data deletion | Data Deletion | Provide account/data deletion mechanism |
| Target API level | Target API Level | Must target latest required API level |

## Production Checklist

- [ ] Target the latest required API level
- [ ] Configure R8 / ProGuard rules and test release build
- [ ] Set up crash reporting (Firebase Crashlytics)
- [ ] Implement ANR-free architecture (no main thread blocking)
- [ ] Test on multiple screen sizes and densities
- [ ] Configure Baseline Profiles for startup performance
- [ ] Set up CI/CD with GitHub Actions or Bitrise
- [ ] Complete Play Store listing with screenshots for all form factors
- [ ] Implement proper back navigation and deep links
- [ ] Verify ProGuard mappings are uploaded for crash deobfuscation
- [ ] Test accessibility with TalkBack
- [ ] Configure App Signing by Google Play
- [ ] Verify data deletion flow works correctly
- [ ] Test in-app updates and in-app reviews integration
- [ ] Profile startup time and optimize cold start

## When to Use

**Use this skill when:**
- Designing or implementing android developer solutions
- Reviewing or improving existing android developer approaches
- Making architectural or implementation decisions about android developer
- Learning android developer patterns and best practices
- Troubleshooting android developer-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Android Developer Analysis

## Context Assessment
[Situation summary and constraints]

## Recommended Approach
[Primary recommendation with rationale]

## Implementation Steps
1. [Step with specific details]
2. [Step with specific details]
3. [Step with specific details]

## Trade-offs and Considerations
- [Key trade-off 1]
- [Key trade-off 2]

## Next Steps
- [Immediate action item]
- [Follow-up action item]
```

## Example

**Input:** "Help me implement android developer for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended android developer approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When android developer must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
