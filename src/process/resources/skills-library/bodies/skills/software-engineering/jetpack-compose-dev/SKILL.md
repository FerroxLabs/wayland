---
name: jetpack-compose-dev
description: |
  Expert Android Jetpack Compose development covering declarative UI, state hoisting, Material 3 theming, type-safe navigation, lazy layouts, custom animations, ViewModel integration, side effects, accessibility, and production architecture patterns for modern Android apps.
  Use when the user asks about jetpack compose dev, jetpack compose dev best practices, or needs guidance on jetpack compose dev implementation.
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

# Jetpack Compose Developer

You are an expert Android developer specializing in Jetpack Compose. You guide developers through building production-quality Android applications using declarative UI, modern state management, Material Design 3, and recommended architecture patterns from the Android team.

## State Management

### State Hoisting Pattern

```kotlin
// Stateless composable - reusable and testable
@Composable
fun TaskItem(
    task: Task,
    onToggle: (Task) -> Unit,
    onDelete: (Task) -> Unit,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier.fillMaxWidth().padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(
            checked = task.isCompleted,
            onCheckedChange = { onToggle(task) }
        )
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = task.title,
                style = MaterialTheme.typography.bodyLarge,
                textDecoration = if (task.isCompleted) TextDecoration.LineThrough else null
            )
            task.dueDate?.let { date ->
                Text(
                    text = date.format(),
                    style = MaterialTheme.typography.bodySmall,
                    color = if (task.isOverdue) MaterialTheme.colorScheme.error
                            else MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
        IconButton(onClick = { onDelete(task) }) {
            Icon(Icons.Default.Delete, contentDescription = "Delete task")
        }
    }
}
```

### ViewModel with UiState

```kotlin
data class TaskListUiState(
    val tasks: List<Task> = emptyList(),
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val filterType: FilterType = FilterType.ALL
) {
    val filteredTasks: List<Task> get() = when (filterType) {
        FilterType.ALL -> tasks
        FilterType.PENDING -> tasks.filter { !it.isCompleted }
        FilterType.COMPLETED -> tasks.filter { it.isCompleted }
    }
    val completedCount: Int get() = tasks.count { it.isCompleted }
}

sealed interface TaskListEvent {
    data class ToggleTask(val task: Task) : TaskListEvent
    data class DeleteTask(val task: Task) : TaskListEvent
    data class SetFilter(val filter: FilterType) : TaskListEvent
    data object Refresh : TaskListEvent
}

@HiltViewModel
class TaskListViewModel @Inject constructor(
    private val repository: TaskRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(TaskListUiState())
    val uiState: StateFlow<TaskListUiState> = _uiState.asStateFlow()

    init { loadTasks() }

    fun onEvent(event: TaskListEvent) {
        when (event) {
            is TaskListEvent.ToggleTask -> toggleTask(event.task)
            is TaskListEvent.DeleteTask -> deleteTask(event.task)
            is TaskListEvent.SetFilter -> _uiState.update { it.copy(filterType = event.filter) }
            TaskListEvent.Refresh -> loadTasks()
        }
    }

    private fun loadTasks() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            repository.getTasks()
                .onSuccess { tasks ->
                    _uiState.update { it.copy(tasks = tasks, isLoading = false, errorMessage = null) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(isLoading = false, errorMessage = error.message) }
                }
        }
    }

    private fun toggleTask(task: Task) {
        viewModelScope.launch {
            val updated = task.copy(isCompleted = !task.isCompleted)
            repository.updateTask(updated)
            _uiState.update { state ->
                state.copy(tasks = state.tasks.map { if (it.id == task.id) updated else it })
            }
        }
    }

    private fun deleteTask(task: Task) {
        viewModelScope.launch {
            repository.deleteTask(task)
            _uiState.update { state ->
                state.copy(tasks = state.tasks.filter { it.id != task.id })
            }
        }
    }
}
```

### Collecting State in Compose

```kotlin
@Composable
fun TaskListScreen(viewModel: TaskListViewModel = hiltViewModel()) {
    val uiState by viewModel.uiState.collectAsStateWithLifecycle()
    TaskListContent(uiState = uiState, onEvent = viewModel::onEvent)
}

@Composable
fun TaskListContent(
    uiState: TaskListUiState,
    onEvent: (TaskListEvent) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(title = { Text("Tasks (${uiState.completedCount}/${uiState.tasks.size})") })
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when {
                uiState.isLoading && uiState.tasks.isEmpty -> {
                    CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                }
                uiState.tasks.isEmpty -> {
                    EmptyState(icon = Icons.Default.CheckCircle, title = "No tasks yet")
                }
                else -> {
                    TaskList(
                        tasks = uiState.filteredTasks,
                        onToggle = { onEvent(TaskListEvent.ToggleTask(it)) },
                        onDelete = { onEvent(TaskListEvent.DeleteTask(it)) }
                    )
                }
            }
        }
    }
}
```

## Navigation with Type Safety

```kotlin
// Define routes as serializable classes
@Serializable data object TaskList
@Serializable data class TaskDetail(val taskId: String)
@Serializable data object Settings

@Composable
fun AppNavHost(
    navController: NavHostController = rememberNavController(),
    modifier: Modifier = Modifier
) {
    NavHost(navController = navController, startDestination = TaskList, modifier = modifier) {
        composable<TaskList> {
            TaskListScreen(
                onTaskClick = { task -> navController.navigate(TaskDetail(task.id)) },
                onSettingsClick = { navController.navigate(Settings) }
            )
        }
        composable<TaskDetail> { backStackEntry ->
            val route = backStackEntry.toRoute<TaskDetail>()
            TaskDetailScreen(taskId = route.taskId, onBack = { navController.popBackStack() })
        }
        composable<Settings> {
            SettingsScreen(onBack = { navController.popBackStack() })
        }
    }
}
```

## Material 3 Theming

```kotlin
@Composable
fun TaskAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }
    MaterialTheme(colorScheme = colorScheme, typography = AppTypography, shapes = AppShapes, content = content)
}

val AppTypography = Typography(
    headlineLarge = TextStyle(fontWeight = FontWeight.Bold, fontSize = 28.sp, lineHeight = 36.sp),
    bodyLarge = TextStyle(fontWeight = FontWeight.Normal, fontSize = 16.sp, lineHeight = 24.sp)
)

val AppShapes = Shapes(
    small = RoundedCornerShape(8.dp),
    medium = RoundedCornerShape(12.dp),
    large = RoundedCornerShape(16.dp)
)
```

## Lazy Layouts

```kotlin
@Composable
fun TaskList(
    tasks: List<Task>,
    onToggle: (Task) -> Unit,
    onDelete: (Task) -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        state = rememberLazyListState(),
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(items = tasks, key = { it.id }) { task ->
            TaskItem(
                task = task, onToggle = onToggle, onDelete = onDelete,
                modifier = Modifier.animateItem()
            )
        }
    }
}
```

## Animations

### Animated Visibility and Content Transitions

```kotlin
@Composable
fun ExpandableCard(title: String, content: @Composable () -> Unit) {
    var expanded by rememberSaveable { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth().animateContentSize(
            animationSpec = spring(dampingRatio = Spring.DampingRatioMediumBouncy, stiffness = Spring.StiffnessLow)
        )
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth().clickable { expanded = !expanded },
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(title, style = MaterialTheme.typography.titleMedium)
                Icon(
                    imageVector = if (expanded) Icons.Default.ExpandLess else Icons.Default.ExpandMore,
                    contentDescription = if (expanded) "Collapse" else "Expand"
                )
            }
            AnimatedVisibility(
                visible = expanded,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically()
            ) {
                Column(modifier = Modifier.padding(top = 12.dp)) { content() }
            }
        }
    }
}
```

## Side Effects

| Effect | Use Case |
|--------|----------|
| `LaunchedEffect(key)` | Run suspend function when key changes |
| `DisposableEffect(key)` | Set up and tear down resources (listeners, callbacks) |
| `SideEffect` | Publish Compose state to non-Compose code every recomposition |
| `rememberCoroutineScope()` | Launch coroutines from event handlers (not composition) |
| `derivedStateOf` | Compute derived values that only update when inputs change |
| `snapshotFlow` | Convert Compose State into a Flow |
| `rememberUpdatedState` | Reference latest value without restarting effect |

### Practical Side Effect Examples

```kotlin
@Composable
fun SearchScreen(viewModel: SearchViewModel = hiltViewModel()) {
    var query by rememberSaveable { mutableStateOf("") }

    // Debounced search: restarts when query changes
    LaunchedEffect(query) {
        if (query.length >= 2) {
            delay(300)
            viewModel.search(query)
        }
    }

    // Scroll-based pagination
    val listState = rememberLazyListState()
    val shouldLoadMore by remember {
        derivedStateOf {
            val lastVisible = listState.layoutInfo.visibleItemsInfo.lastOrNull()?.index ?: 0
            lastVisible >= listState.layoutInfo.totalItemsCount - 5
        }
    }
    LaunchedEffect(shouldLoadMore) {
        if (shouldLoadMore) viewModel.loadNextPage()
    }
}
```

## Accessibility

```kotlin
@Composable
fun AccessibleTaskRow(task: Task, onToggle: () -> Unit, modifier: Modifier = Modifier) {
    Row(
        modifier = modifier.fillMaxWidth()
            .semantics(mergeDescendants = true) {
                stateDescription = if (task.isCompleted) "Completed" else "Pending"
                contentDescription = buildString {
                    append(task.title)
                    task.dueDate?.let { append(", due ${it.format()}") }
                    if (task.isCompleted) append(", completed")
                }
            }
            .toggleable(value = task.isCompleted, onValueChange = { onToggle() }, role = Role.Checkbox)
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Checkbox(checked = task.isCompleted, onCheckedChange = null, modifier = Modifier.clearAndSetSemantics { })
        Spacer(modifier = Modifier.width(12.dp))
        Text(text = task.title, style = MaterialTheme.typography.bodyLarge)
    }
}
```

## Testing Compose UI

```kotlin
@HiltAndroidTest
class TaskListScreenTest {
    @get:Rule val composeRule = createAndroidComposeRule<ComponentActivity>()

    @Test
    fun tasksAreDisplayed() {
        val tasks = listOf(
            Task(id = "1", title = "Buy groceries", isCompleted = false),
            Task(id = "2", title = "Walk the dog", isCompleted = true)
        )
        composeRule.setContent {
            TaskAppTheme {
                TaskListContent(uiState = TaskListUiState(tasks = tasks), onEvent = {})
            }
        }
        composeRule.onNodeWithText("Buy groceries").assertIsDisplayed()
        composeRule.onNodeWithText("Walk the dog").assertIsDisplayed()
        composeRule.onNodeWithText("Tasks (1/2)").assertIsDisplayed()
    }

    @Test
    fun emptyStateShown_whenNoTasks() {
        composeRule.setContent {
            TaskAppTheme {
                TaskListContent(uiState = TaskListUiState(tasks = emptyList()), onEvent = {})
            }
        }
        composeRule.onNodeWithText("No tasks yet").assertIsDisplayed()
    }
}
```

## Production Checklist

- [ ] Hoist state out of composables for testability and reuse
- [ ] Use `collectAsStateWithLifecycle` for all Flow collection in Compose
- [ ] Provide stable keys to all `LazyColumn`/`LazyVerticalGrid` items
- [ ] Apply `Modifier.animateItem()` for list add/remove animations
- [ ] Use Material 3 color roles, not hardcoded colors
- [ ] Support dynamic color on Android 12+ with graceful fallback
- [ ] Merge semantics and provide content descriptions for accessibility
- [ ] Use `derivedStateOf` for expensive computations on state
- [ ] Test UI with Compose test rules using stateless screen composables
- [ ] Handle configuration changes with `rememberSaveable`
- [ ] Use type-safe navigation with serializable route classes
- [ ] Profile recomposition with Layout Inspector and composition tracing

## When to Use

**Use this skill when:**
- Designing or implementing jetpack compose dev solutions
- Reviewing or improving existing jetpack compose dev approaches
- Making architectural or implementation decisions about jetpack compose dev
- Learning jetpack compose dev patterns and best practices
- Troubleshooting jetpack compose dev-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Jetpack Compose Dev Analysis

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

**Input:** "Help me implement jetpack compose dev for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended jetpack compose dev approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When jetpack compose dev must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
