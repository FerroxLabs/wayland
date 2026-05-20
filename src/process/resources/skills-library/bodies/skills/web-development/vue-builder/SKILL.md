---
name: vue-builder
description: |
  Expert Vue.js development covering Composition API patterns, Pinia state management, Vue Router, composables design, Nuxt.js integration, reactivity internals, and advanced component patterns.
  Use when the user asks about vue builder, vue builder best practices, or needs guidance on vue builder implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "web-development frontend javascript"
  category: "web-development"
  subcategory: "frontend-frameworks"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Vue Builder

## Purpose

Guide the development of robust Vue.js applications using modern patterns. This skill covers Vue 3 Composition API, state management with Pinia, routing, composable design, and Nuxt.js for full-stack Vue development.

## Composition API Patterns

### Script Setup (Preferred Syntax)

```vue
<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '@/stores/user';
import type { User } from '@/types';

// Props with defaults
const props = withDefaults(defineProps<{
  userId: string;
  showAvatar?: boolean;
}>(), {
  showAvatar: true,
});

// Emits with type safety
const emit = defineEmits<{
  select: [user: User];
  delete: [userId: string];
}>();

// Expose for parent ref access (use sparingly)
defineExpose({ refresh });

// Reactive state
const searchQuery = ref('');
const isLoading = ref(false);

// Computed
const filteredUsers = computed(() =>
  users.value.filter(u => u.name.includes(searchQuery.value))
);

// Watchers
watch(() => props.userId, async (newId) => {
  await fetchUser(newId);
}, { immediate: true });

// Lifecycle
onMounted(() => {
  initializeComponent();
});

// Methods
async function refresh() {
  isLoading.value = true;
  try {
    await fetchData();
  } finally {
    isLoading.value = false;
  }
}
</script>
```

### Options API to Composition API Migration Map

```
Options API          ->  Composition API
-------------------------------------------
data()               ->  ref() / reactive()
computed: {}         ->  computed()
methods: {}          ->  plain functions
watch: {}            ->  watch() / watchEffect()
created()            ->  <script setup> top level
mounted()            ->  onMounted()
beforeUnmount()      ->  onBeforeUnmount()
mixins               ->  composables
provide/inject       ->  provide() / inject()
this.$emit           ->  defineEmits / emit()
this.$refs           ->  template refs with ref()
```

## Composables Design

### Composable Rules

1. Name with `use` prefix: `useCounter`, `useFetch`, `useAuth`
2. Accept refs or plain values as arguments (use `toValue()` internally)
3. Return refs (not raw values) so consumers maintain reactivity
4. Handle cleanup in `onBeforeUnmount` or return a cleanup function
5. Keep composables focused on a single concern

### Standard Composable Template

```ts
// composables/useFetch.ts
import { ref, watchEffect, toValue, type Ref, type MaybeRefOrGetter } from 'vue';

interface UseFetchOptions {
  immediate?: boolean;
  refetch?: boolean;
}

interface UseFetchReturn<T> {
  data: Ref<T | null>;
  error: Ref<Error | null>;
  isLoading: Ref<boolean>;
  execute: () => Promise<void>;
}

export function useFetch<T>(
  url: MaybeRefOrGetter<string>,
  options: UseFetchOptions = {}
): UseFetchReturn<T> {
  const { immediate = true, refetch = true } = options;

  const data = ref<T | null>(null) as Ref<T | null>;
  const error = ref<Error | null>(null);
  const isLoading = ref(false);

  async function execute() {
    isLoading.value = true;
    error.value = null;
    try {
      const response = await get(toValue(url));
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      data.value = await response.json();
    } catch (e) {
      error.value = e as Error;
    } finally {
      isLoading.value = false;
    }
  }

  if (refetch) {
    watchEffect(() => {
      toValue(url); // Track reactive dependency
      execute();
    });
  } else if (immediate) {
    execute();
  }

  return { data, error, isLoading, execute };
}
```

### Composable Composition (Layered Architecture)

```ts
// Layer 1: Generic HTTP composable
export function useApi<T>(endpoint: MaybeRefOrGetter<string>) { ... }

// Layer 2: Domain composable
export function useUsers(filters: MaybeRefOrGetter<UserFilters>) {
  const url = computed(() => `/api/users?${buildQuery(toValue(filters))}`);
  const { data, error, isLoading, execute } = useApi<User[]>(url);

  const activeUsers = computed(() =>
    (data.value ?? []).filter(u => u.status === 'active')
  );

  return { users: data, activeUsers, error, isLoading, refetch: execute };
}

// Layer 3: UI composable
export function useUserSearch() {
  const query = ref('');
  const debouncedQuery = refDebounced(query, 300);
  const filters = computed<UserFilters>(() => ({ search: debouncedQuery.value }));
  const { users, activeUsers, isLoading } = useUsers(filters);

  return { query, users, activeUsers, isLoading };
}
```

## Pinia State Management

### Store Design

```ts
// stores/auth.ts
import { defineStore } from 'pinia';

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const token = ref<string | null>(localStorage.getItem('token'));

  // Getters (computed)
  const isAuthenticated = computed(() => !!token.value && !!user.value);
  const userRole = computed(() => user.value?.role ?? 'guest');

  // Actions
  async function login(credentials: LoginCredentials) {
    const response = await authApi.login(credentials);
    token.value = response.token;
    user.value = response.user;
    localStorage.setItem('token', response.token);
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('token');
  }

  async function refreshUser() {
    if (!token.value) return;
    try {
      user.value = await authApi.getProfile();
    } catch {
      logout();
    }
  }

  return { user, token, isAuthenticated, userRole, login, logout, refreshUser };
});
```

### Pinia Best Practices

```
DO:
  - Use Setup Store syntax (function style) for TypeScript projects
  - Keep stores focused on a single domain
  - Use composables for reusable logic, stores for shared state
  - Subscribe to store changes for side effects: store.$subscribe()
  - Use storeToRefs() to destructure state while keeping reactivity

DON'T:
  - Put UI state (modals, tooltips) in Pinia -- use local component state
  - Create deeply nested store structures
  - Mutate state outside of actions in production
  - Use Pinia for server state -- use TanStack Query/VueQuery instead
```

### storeToRefs Usage

```vue
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useAuthStore } from '@/stores/auth';

const authStore = useAuthStore();

// Destructure reactive state with storeToRefs
const { user, isAuthenticated } = storeToRefs(authStore);

// Actions can be destructured directly (no reactivity needed)
const { login, logout } = authStore;
</script>
```

## Vue Router Patterns

### Route Organization

```ts
// router/index.ts
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/layouts/DefaultLayout.vue'),
    children: [
      { path: '', name: 'home', component: () => import('@/pages/Home.vue') },
      { path: 'about', name: 'about', component: () => import('@/pages/About.vue') },
    ],
  },
  {
    path: '/dashboard',
    component: () => import('@/layouts/DashboardLayout.vue'),
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'dashboard', component: () => import('@/pages/Dashboard.vue') },
      { path: 'settings', name: 'settings', component: () => import('@/pages/Settings.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/pages/NotFound.vue') },
];
```

### Navigation Guards

```ts
router.beforeEach(async (to, from) => {
  const authStore = useAuthStore();

  // Redirect to login if route requires auth
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } };
  }

  // Redirect away from login if already authenticated
  if (to.name === 'login' && authStore.isAuthenticated) {
    return { name: 'dashboard' };
  }

  // Role-based access
  if (to.meta.requiredRole && authStore.userRole !== to.meta.requiredRole) {
    return { name: 'forbidden' };
  }
});
```

## Reactivity Deep Dive

### ref vs reactive Decision

```
Use ref() when:
  - Storing primitives (string, number, boolean)
  - You need to reassign the entire value (ref.value = newArray)
  - Consistency (ref works for everything)

Use reactive() when:
  - Storing objects where you never reassign the root
  - You want to avoid .value syntax in script
  - Grouping related state (like a form object)

PREFER ref() as the default -- it is more predictable and consistent.
```

### Reactivity Gotchas

```ts
// GOTCHA 1: Destructuring loses reactivity
const store = useCounterStore();
const { count } = store;          // NOT reactive
const { count } = storeToRefs(store); // Reactive

// GOTCHA 2: Replacing reactive object
const state = reactive({ count: 0 });
state = reactive({ count: 1 });   // BREAKS reactivity reference
// FIX: Use ref() or Object.assign(state, { count: 1 });

// GOTCHA 3: Array/collection reactivity
const list = ref<string[]>([]);
list.value.push('item');           // Reactive (tracked)
list.value[0] = 'changed';        // Reactive in Vue 3 (Proxy-based)

// GOTCHA 4: toRaw for performance-critical reads
import { toRaw } from 'vue';
const rawData = toRaw(reactiveData); // Skip proxy for read-heavy ops
```

## Provide / Inject Patterns

### Typed Provide/Inject

```ts
// injection-keys.ts
import type { InjectionKey, Ref } from 'vue';

export const ThemeKey: InjectionKey<Ref<'light' | 'dark'>> = Symbol('theme');
export const NotificationKey: InjectionKey<{
  notify: (msg: string, type: 'success' | 'error') => void;
}> = Symbol('notification');

// Parent component
import { provide, ref } from 'vue';
import { ThemeKey } from '@/injection-keys';

const theme = ref<'light' | 'dark'>('light');
provide(ThemeKey, theme);

// Child component (any depth)
import { inject } from 'vue';
import { ThemeKey } from '@/injection-keys';

const theme = inject(ThemeKey);
// theme is Ref<'light' | 'dark'> | undefined
if (!theme) throw new Error('ThemeKey not provided');
```

## Teleport Usage

```vue
<!-- Modal teleported to body -->
<template>
  <button @click="showModal = true">Open</button>
  <Teleport to="body">
    <Transition name="fade">
      <div v-if="showModal" class="modal-overlay" @click.self="showModal = false">
        <div class="modal-content" role="dialog" aria-modal="true">
          <slot />
          <button @click="showModal = false">Close</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<!-- Conditional teleport target -->
<Teleport :to="isMobile ? '#mobile-nav' : '#desktop-nav'" :disabled="!shouldTeleport">
  <NavMenu />
</Teleport>
```

## Nuxt.js Integration

### Nuxt 3 Directory Conventions

```
app/
  components/       # Auto-imported components
    ui/             # <UiButton /> (prefix-based)
  composables/      # Auto-imported composables
  layouts/          # <NuxtLayout name="admin">
  middleware/       # Route middleware
  pages/            # File-based routing
  plugins/          # App plugins
  server/           # Server routes, middleware, API
    api/            # /api/* endpoints
    middleware/     # Server middleware
  utils/            # Auto-imported utility functions
  app.vue           # Root component
  nuxt.config.ts    # Configuration
```

### Server API Routes (Nuxt)

```ts
// server/api/users/[id].get.ts
export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id');
  const user = await db.user.findUnique({ where: { id } });
  if (!user) throw createError({ statusCode: 404, message: 'User not found' });
  return user;
});

// Consumed in component with useFetch (SSR-safe)
const { data: user, pending, error } = await useFetch(`/api/users/${userId}`);
```

### Nuxt Middleware

```ts
// middleware/auth.ts (named middleware)
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return navigateTo('/login', { redirectCode: 302 });
  }
});

// Usage in page: definePageMeta({ middleware: 'auth' });
```

## Project Architecture Checklist

- [ ] Composition API with `<script setup>` for all components
- [ ] Composables follow `use` naming and single-responsibility
- [ ] Pinia stores scoped to domains, not UI concerns
- [ ] Vue Router with lazy-loaded routes and navigation guards
- [ ] Typed provide/inject with InjectionKey symbols
- [ ] VueUse library considered before writing custom composables
- [ ] Auto-imports configured (Nuxt or unplugin-auto-import)
- [ ] Error handling with onErrorCaptured or error boundaries
- [ ] TypeScript strict mode with no `any` usage
- [ ] Component props validated with TypeScript interfaces
- [ ] Teleport used for modals, toasts, and tooltips
- [ ] Transitions applied for meaningful state changes

## When to Use

**Use this skill when:**
- Designing or implementing vue builder solutions
- Reviewing or improving existing vue builder approaches
- Making architectural or implementation decisions about vue builder
- Learning vue builder patterns and best practices
- Troubleshooting vue builder-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Vue Builder Analysis

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

**Input:** "Help me implement vue builder for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended vue builder approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When vue builder must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
