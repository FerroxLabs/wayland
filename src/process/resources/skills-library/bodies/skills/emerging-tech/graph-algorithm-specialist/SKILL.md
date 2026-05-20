---
name: graph-algorithm-specialist
description: |
  Guides graph algorithm mastery including BFS, DFS, shortest paths, minimum spanning trees, topological sort, and cycle detection with implementation patterns
  Use when the user asks about graph algorithm specialist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of graph algorithm specialist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming guide beginner-friendly testing analysis networking parenting"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Graph Algorithm Specialist

You are an expert competitive programming coach specializing in graph algorithms. You guide programmers through graph representations, BFS, DFS, shortest path algorithms, minimum spanning trees, topological sorting, cycle detection, and advanced graph techniques with rigorous complexity analysis.


## When to Use

**Use this skill when:**
- User asks about graph algorithm specialist techniques or best practices
- User needs guidance on graph algorithm specialist concepts
- User wants to implement or improve their approach to graph algorithm specialist

**Do NOT use when:**
- The request falls outside the scope of graph algorithm specialist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Graph Representation

### Adjacency List (Preferred for Sparse Graphs)

```cpp
// Unweighted graph
vector<vector<int>> adj(n);
adj[u].push_back(v);
adj[v].push_back(u);  // Undirected

// Weighted graph
vector<vector<pair<int,int>>> adj(n);  // {neighbor, weight}
adj[u].push_back({v, w});
```

### Representation Comparison

| Representation | Space | Edge Query | Iterate Neighbors | Best For |
|---------------|-------|------------|-------------------|----------|
| Adjacency List | O(V+E) | O(degree) | O(degree) | Sparse graphs |
| Adjacency Matrix | O(V^2) | O(1) | O(V) | Dense, small V |
| Edge List | O(E) | O(E) | O(E) | Kruskal, sorting edges |

## Breadth-First Search (BFS)

### Standard BFS (Shortest Path in Unweighted Graph)

```cpp
// Time: O(V + E), Space: O(V)
vector<int> bfs(vector<vector<int>>& adj, int src) {
    int n = adj.size();
    vector<int> dist(n, -1);
    queue<int> q;
    dist[src] = 0;
    q.push(src);
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) {
                dist[v] = dist[u] + 1;
                q.push(v);
            }
        }
    }
    return dist;
}
```

### Multi-Source BFS

```cpp
// BFS from multiple sources simultaneously
// Time: O(V + E), Space: O(V)
vector<int> multiSourceBFS(vector<vector<int>>& adj, vector<int>& sources) {
    int n = adj.size();
    vector<int> dist(n, -1);
    queue<int> q;
    for (int s : sources) { dist[s] = 0; q.push(s); }
    while (!q.empty()) {
        int u = q.front(); q.pop();
        for (int v : adj[u]) {
            if (dist[v] == -1) { dist[v] = dist[u] + 1; q.push(v); }
        }
    }
    return dist;
}
```

### 0-1 BFS (Edges with Weight 0 or 1)

```cpp
// Time: O(V + E), Space: O(V)
vector<int> bfs01(vector<vector<pair<int,int>>>& adj, int src) {
    int n = adj.size();
    vector<int> dist(n, INT_MAX);
    deque<int> dq;
    dist[src] = 0;
    dq.push_front(src);
    while (!dq.empty()) {
        int u = dq.front(); dq.pop_front();
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                if (w == 0) dq.push_front(v);
                else dq.push_back(v);
            }
        }
    }
    return dist;
}
```

## Depth-First Search (DFS)

### Iterative DFS (Avoids Stack Overflow)

```cpp
// Time: O(V + E), Space: O(V)
void dfs_iterative(vector<vector<int>>& adj, int src) {
    int n = adj.size();
    vector<bool> visited(n, false);
    stack<int> st;
    st.push(src);
    while (!st.empty()) {
        int u = st.top(); st.pop();
        if (visited[u]) continue;
        visited[u] = true;
        for (int v : adj[u])
            if (!visited[v]) st.push(v);
    }
}
```

### DFS with Entry/Exit Times

```cpp
// For subtree queries. Time: O(V + E)
int timer = 0;
vector<int> tin, tout;

void dfs(vector<vector<int>>& adj, int u, int parent) {
    tin[u] = timer++;
    for (int v : adj[u])
        if (v != parent) dfs(adj, v, u);
    tout[u] = timer++;
}

bool isAncestor(int u, int v) {
    return tin[u] <= tin[v] && tout[v] <= tout[u];
}
```

### Connected Components

```cpp
// Time: O(V + E), Space: O(V)
int countComponents(int n, vector<vector<int>>& adj) {
    vector<bool> visited(n, false);
    int components = 0;
    function<void(int)> dfs = [&](int u) {
        visited[u] = true;
        for (int v : adj[u]) if (!visited[v]) dfs(v);
    };
    for (int i = 0; i < n; i++)
        if (!visited[i]) { dfs(i); components++; }
    return components;
}
```

## Shortest Path Algorithms

### Dijkstra's Algorithm

```cpp
// Non-negative weights. Time: O((V + E) log V)
vector<long long> dijkstra(vector<vector<pair<int,int>>>& adj, int src) {
    int n = adj.size();
    vector<long long> dist(n, LLONG_MAX);
    priority_queue<pair<long long,int>, vector<pair<long long,int>>, greater<>> pq;
    dist[src] = 0;
    pq.push({0, src});
    while (!pq.empty()) {
        auto [d, u] = pq.top(); pq.pop();
        if (d > dist[u]) continue;
        for (auto [v, w] : adj[u]) {
            if (dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                pq.push({dist[v], v});
            }
        }
    }
    return dist;
}
```

### Bellman-Ford Algorithm

```cpp
// Handles negative weights, detects negative cycles
// Time: O(V * E), Space: O(V)
struct Edge { int from, to, weight; };

pair<vector<long long>, bool> bellmanFord(int n, vector<Edge>& edges, int src) {
    vector<long long> dist(n, LLONG_MAX);
    dist[src] = 0;
    for (int i = 0; i < n - 1; i++) {
        bool updated = false;
        for (auto& [u, v, w] : edges) {
            if (dist[u] != LLONG_MAX && dist[u] + w < dist[v]) {
                dist[v] = dist[u] + w;
                updated = true;
            }
        }
        if (!updated) break;
    }
    bool hasNegCycle = false;
    for (auto& [u, v, w] : edges)
        if (dist[u] != LLONG_MAX && dist[u] + w < dist[v]) { hasNegCycle = true; break; }
    return {dist, hasNegCycle};
}
```

### Floyd-Warshall (All-Pairs)

```cpp
// Time: O(V^3), Space: O(V^2)
void floydWarshall(vector<vector<long long>>& dist, int n) {
    for (int k = 0; k < n; k++)
        for (int i = 0; i < n; i++)
            for (int j = 0; j < n; j++)
                if (dist[i][k] != LLONG_MAX && dist[k][j] != LLONG_MAX)
                    dist[i][j] = min(dist[i][j], dist[i][k] + dist[k][j]);
}
```

### Algorithm Selection Guide

| Algorithm | Weights | Negative | Time | Use When |
|-----------|---------|----------|------|----------|
| BFS | Unweighted | N/A | O(V+E) | Unit weights |
| 0-1 BFS | 0 or 1 | No | O(V+E) | Binary weights |
| Dijkstra | Non-negative | No | O((V+E)logV) | General positive |
| Bellman-Ford | Any | Yes (detects) | O(VE) | Negative weights |
| Floyd-Warshall | Any | Yes (detects) | O(V^3) | Small V, all-pairs |

## Minimum Spanning Tree

### Kruskal's Algorithm (Edge-based)

```cpp
// Time: O(E log E), Space: O(V)
class UnionFind {
    vector<int> parent, rank_;
public:
    UnionFind(int n) : parent(n), rank_(n, 0) { iota(parent.begin(), parent.end(), 0); }
    int find(int x) { return parent[x] == x ? x : parent[x] = find(parent[x]); }
    bool unite(int x, int y) {
        int px = find(x), py = find(y);
        if (px == py) return false;
        if (rank_[px] < rank_[py]) swap(px, py);
        parent[py] = px;
        if (rank_[px] == rank_[py]) rank_[px]++;
        return true;
    }
};

long long kruskal(int n, vector<tuple<int,int,int>>& edges) {
    sort(edges.begin(), edges.end());
    UnionFind uf(n);
    long long mstWeight = 0;
    int edgeCount = 0;
    for (auto [w, u, v] : edges) {
        if (uf.unite(u, v)) {
            mstWeight += w;
            if (++edgeCount == n - 1) break;
        }
    }
    return mstWeight;
}
```

### Prim's Algorithm (Vertex-based)

```cpp
// Time: O((V + E) log V), Space: O(V)
long long prim(vector<vector<pair<int,int>>>& adj) {
    int n = adj.size();
    vector<bool> inMST(n, false);
    priority_queue<pair<int,int>, vector<pair<int,int>>, greater<>> pq;
    pq.push({0, 0});
    long long mstWeight = 0;
    int count = 0;
    while (!pq.empty() && count < n) {
        auto [w, u] = pq.top(); pq.pop();
        if (inMST[u]) continue;
        inMST[u] = true;
        mstWeight += w;
        count++;
        for (auto [v, wt] : adj[u])
            if (!inMST[v]) pq.push({wt, v});
    }
    return mstWeight;
}
```

## Topological Sort

### Kahn's Algorithm (BFS-based)

```cpp
// Time: O(V + E). If order.size() < n, graph has a cycle.
vector<int> topologicalSort(int n, vector<vector<int>>& adj) {
    vector<int> indegree(n, 0);
    for (int u = 0; u < n; u++)
        for (int v : adj[u]) indegree[v]++;
    queue<int> q;
    for (int i = 0; i < n; i++)
        if (indegree[i] == 0) q.push(i);
    vector<int> order;
    while (!q.empty()) {
        int u = q.front(); q.pop();
        order.push_back(u);
        for (int v : adj[u])
            if (--indegree[v] == 0) q.push(v);
    }
    return order;
}
```

### DFS-based Topological Sort

```cpp
// Reverse post-order. Time: O(V + E)
vector<int> topoSortDFS(int n, vector<vector<int>>& adj) {
    vector<int> order, state(n, 0);
    bool hasCycle = false;
    function<void(int)> dfs = [&](int u) {
        if (hasCycle) return;
        state[u] = 1;
        for (int v : adj[u]) {
            if (state[v] == 1) { hasCycle = true; return; }
            if (state[v] == 0) dfs(v);
        }
        state[u] = 2;
        order.push_back(u);
    };
    for (int i = 0; i < n; i++) if (state[i] == 0) dfs(i);
    reverse(order.begin(), order.end());
    return order;
}
```

## Cycle Detection

### Directed Graph (DFS Coloring)

```cpp
// Time: O(V + E)
bool hasCycleDirected(int n, vector<vector<int>>& adj) {
    vector<int> color(n, 0);
    function<bool(int)> dfs = [&](int u) -> bool {
        color[u] = 1;
        for (int v : adj[u]) {
            if (color[v] == 1) return true;
            if (color[v] == 0 && dfs(v)) return true;
        }
        color[u] = 2;
        return false;
    };
    for (int i = 0; i < n; i++)
        if (color[i] == 0 && dfs(i)) return true;
    return false;
}
```

### Undirected Graph (Union-Find)

```cpp
// Time: O(E * alpha(V))
bool hasCycleUndirected(int n, vector<pair<int,int>>& edges) {
    UnionFind uf(n);
    for (auto [u, v] : edges)
        if (uf.find(u) == uf.find(v)) return true;
        else uf.unite(u, v);
    return false;
}
```

## Strongly Connected Components (Kosaraju)

```cpp
// Time: O(V + E)
vector<vector<int>> kosaraju(int n, vector<vector<int>>& adj) {
    vector<bool> visited(n, false);
    vector<int> order;
    function<void(int)> dfs1 = [&](int u) {
        visited[u] = true;
        for (int v : adj[u]) if (!visited[v]) dfs1(v);
        order.push_back(u);
    };
    for (int i = 0; i < n; i++) if (!visited[i]) dfs1(i);

    vector<vector<int>> radj(n);
    for (int u = 0; u < n; u++)
        for (int v : adj[u]) radj[v].push_back(u);

    fill(visited.begin(), visited.end(), false);
    vector<vector<int>> sccs;
    function<void(int, vector<int>&)> dfs2 = [&](int u, vector<int>& comp) {
        visited[u] = true;
        comp.push_back(u);
        for (int v : radj[u]) if (!visited[v]) dfs2(v, comp);
    };
    for (int i = n - 1; i >= 0; i--) {
        int u = order[i];
        if (!visited[u]) { sccs.push_back({}); dfs2(u, sccs.back()); }
    }
    return sccs;
}
```

## Common Pitfalls

| Mistake | Fix |
|---------|-----|
| Dijkstra with negative weights | Use Bellman-Ford |
| Not skipping stale entries in Dijkstra | Check `d > dist[u]` |
| DFS recursion on large graphs | Use iterative DFS for V > 10^5 |
| Integer overflow in distances | Use `long long` |
| skipping disconnected graphs | Loop over all vertices as sources |
| Not resetting between test cases | Clear all arrays |

## Exercises

1. **Bipartite Check**: Determine if graph is bipartite using BFS coloring
2. **Shortest Path Reconstruction**: Modify Dijkstra to return the actual path
3. **Course Schedule**: Find valid ordering via topological sort
4. **Network Delay**: Find time for signal to reach all nodes (Dijkstra, return max)
5. **Bridge Detection**: Find bridges using DFS with low-link values


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to graph algorithm specialist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Graph Algorithm Specialist Analysis

### Assessment
[Key findings and observations]

### Recommendations
1. [Primary recommendation]
2. [Secondary recommendation]
3. [Additional suggestions]

### Action Items
- [ ] [First action step]
- [ ] [Second action step]
- [ ] [Follow-up task]
```


## Edge Cases

- **Incomplete information:** Ask clarifying questions before proceeding with recommendations
- **Conflicting requirements:** Prioritize the most critical constraint and note trade-offs
- **Out of scope requests:** Redirect to appropriate specialized skill or professional resource
- **Beginner vs advanced:** Adjust depth and terminology based on user's experience level


## Example

**Input:** "Help me with graph algorithm specialist for my current situation"

**Output:**

Based on your situation, here is a structured approach to graph algorithm specialist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
