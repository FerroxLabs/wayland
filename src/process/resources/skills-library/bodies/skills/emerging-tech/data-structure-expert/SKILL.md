---
name: data-structure-expert
description: |
  Guides advanced data structure mastery including segment trees, Fenwick trees, tries, union-find, sparse tables, and their applications in competitive programming
  Use when the user asks about data structure expert, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of data structure expert or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming guide beginner-friendly analysis parenting"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Data Structure Expert

You are an expert competitive programming coach specializing in advanced data structures. You guide programmers through segment trees, Fenwick trees (BIT), tries, union-find (DSU), sparse tables, and their variants, with implementation patterns, complexity analysis, and application guidance.


## When to Use

**Use this skill when:**
- User asks about data structure expert techniques or best practices
- User needs guidance on data structure expert concepts
- User wants to implement or improve their approach to data structure expert

**Do NOT use when:**
- The request falls outside the scope of data structure expert
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Data Structure Selection Guide

| Query Type | Update | Structure | Build | Query | Update |
|-----------|--------|-----------|-------|-------|--------|
| Range sum/min/max | Point | Fenwick Tree | O(n) | O(log n) | O(log n) |
| Range sum/min/max | Range | Segment Tree + Lazy | O(n) | O(log n) | O(log n) |
| Range min/max | None | Sparse Table | O(n log n) | O(1) | N/A |
| Prefix XOR/string | N/A | Trie | O(n*L) | O(L) | O(L) |
| Connectivity | Union | Union-Find (DSU) | O(n) | O(alpha(n)) | O(alpha(n)) |
| Ordered statistics | Insert/Delete | Order Statistics Tree | N/A | O(log n) | O(log n) |

## Segment Tree

### Basic Segment Tree (Point Update, Range Query)

```cpp
// Segment tree for range sum queries with point updates
// Time: O(n) build, O(log n) query and update
// Space: O(4n)

class SegTree {
    vector<long long> tree;
    int n;

    void build(vector<int>& arr, int node, int lo, int hi) {
        if (lo == hi) {
            tree[node] = arr[lo];
            return;
        }
        int mid = (lo + hi) / 2;
        build(arr, 2*node, lo, mid);
        build(arr, 2*node+1, mid+1, hi);
        tree[node] = tree[2*node] + tree[2*node+1];
    }

    void update(int node, int lo, int hi, int pos, long long val) {
        if (lo == hi) {
            tree[node] = val;
            return;
        }
        int mid = (lo + hi) / 2;
        if (pos <= mid) update(2*node, lo, mid, pos, val);
        else update(2*node+1, mid+1, hi, pos, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }

    long long query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;  // Out of range
        if (l <= lo && hi <= r) return tree[node];  // Fully inside
        int mid = (lo + hi) / 2;
        return query(2*node, lo, mid, l, r) +
               query(2*node+1, mid+1, hi, l, r);
    }

public:
    SegTree(vector<int>& arr) : n(arr.size()), tree(4 * arr.size()) {
        build(arr, 1, 0, n - 1);
    }

    void update(int pos, long long val) { update(1, 0, n-1, pos, val); }
    long long query(int l, int r) { return query(1, 0, n-1, l, r); }
};
```

### Segment Tree with Lazy Propagation (Range Update)

```cpp
// Range add update, range sum query
// Time: O(log n) per operation
// Space: O(4n)

class LazySegTree {
    vector<long long> tree, lazy;
    int n;

    void push_down(int node, int lo, int hi) {
        if (lazy[node] != 0) {
            int mid = (lo + hi) / 2;
            apply(2*node, lo, mid, lazy[node]);
            apply(2*node+1, mid+1, hi, lazy[node]);
            lazy[node] = 0;
        }
    }

    void apply(int node, int lo, int hi, long long val) {
        tree[node] += val * (hi - lo + 1);
        lazy[node] += val;
    }

    void update(int node, int lo, int hi, int l, int r, long long val) {
        if (r < lo || hi < l) return;
        if (l <= lo && hi <= r) {
            apply(node, lo, hi, val);
            return;
        }
        push_down(node, lo, hi);
        int mid = (lo + hi) / 2;
        update(2*node, lo, mid, l, r, val);
        update(2*node+1, mid+1, hi, l, r, val);
        tree[node] = tree[2*node] + tree[2*node+1];
    }

    long long query(int node, int lo, int hi, int l, int r) {
        if (r < lo || hi < l) return 0;
        if (l <= lo && hi <= r) return tree[node];
        push_down(node, lo, hi);
        int mid = (lo + hi) / 2;
        return query(2*node, lo, mid, l, r) +
               query(2*node+1, mid+1, hi, l, r);
    }

public:
    LazySegTree(int sz) : n(sz), tree(4*sz, 0), lazy(4*sz, 0) {}

    LazySegTree(vector<int>& arr) : n(arr.size()), tree(4*arr.size(), 0),
                                     lazy(4*arr.size(), 0) {
        function<void(int,int,int)> build = [&](int node, int lo, int hi) {
            if (lo == hi) { tree[node] = arr[lo]; return; }
            int mid = (lo + hi) / 2;
            build(2*node, lo, mid);
            build(2*node+1, mid+1, hi);
            tree[node] = tree[2*node] + tree[2*node+1];
        };
        build(1, 0, n-1);
    }

    void update(int l, int r, long long val) { update(1, 0, n-1, l, r, val); }
    long long query(int l, int r) { return query(1, 0, n-1, l, r); }
};
```

## Fenwick Tree (Binary Indexed Tree)

### Basic Fenwick Tree

```cpp
// Point update, prefix sum query
// Time: O(log n) per operation, O(n) build
// Space: O(n)

class FenwickTree {
    vector<long long> bit;
    int n;

public:
    FenwickTree(int n) : n(n), bit(n + 1, 0) {}

    FenwickTree(vector<int>& arr) : n(arr.size()), bit(arr.size() + 1, 0) {
        for (int i = 0; i < n; i++)
            update(i, arr[i]);
    }

    // Add val to position i (0-indexed)
    void update(int i, long long val) {
        for (i++; i <= n; i += i & (-i))
            bit[i] += val;
    }

    // Sum of arr[0..i] (0-indexed, inclusive)
    long long prefix(int i) {
        long long sum = 0;
        for (i++; i > 0; i -= i & (-i))
            sum += bit[i];
        return sum;
    }

    // Sum of arr[l..r] (inclusive)
    long long query(int l, int r) {
        return prefix(r) - (l > 0 ? prefix(l - 1) : 0);
    }
};
```

## Trie

### String Trie

```cpp
// Insert and search strings
// Time: O(L) per operation where L = string length
// Space: O(SIGMA * total_chars), SIGMA = alphabet size

struct TrieNode {
    int children[26];
    int count;       // Number of words ending here
    int prefix_count; // Number of words with this prefix
    TrieNode() : count(0), prefix_count(0) {
        fill(children, children + 26, -1);
    }
};

class Trie {
    vector<TrieNode> nodes;

public:
    Trie() { nodes.emplace_back(); }

    void insert(const string& s) {
        int cur = 0;
        for (char c : s) {
            int idx = c - 'a';
            if (nodes[cur].children[idx] == -1) {
                nodes[cur].children[idx] = nodes.size();
                nodes.emplace_back();
            }
            cur = nodes[cur].children[idx];
            nodes[cur].prefix_count++;
        }
        nodes[cur].count++;
    }

    int search(const string& s) {
        int cur = 0;
        for (char c : s) {
            int idx = c - 'a';
            if (nodes[cur].children[idx] == -1) return 0;
            cur = nodes[cur].children[idx];
        }
        return nodes[cur].count;
    }

    int countPrefix(const string& prefix) {
        int cur = 0;
        for (char c : prefix) {
            int idx = c - 'a';
            if (nodes[cur].children[idx] == -1) return 0;
            cur = nodes[cur].children[idx];
        }
        return nodes[cur].prefix_count;
    }
};
```

### Binary Trie (Maximum XOR)

```cpp
// Find maximum XOR of x with any element in the set
// Time: O(BITS) per operation
// Space: O(n * BITS)

class BinaryTrie {
    struct Node {
        int children[2] = {-1, -1};
        int count = 0;
    };
    vector<Node> nodes;
    static const int BITS = 30;

public:
    BinaryTrie() { nodes.emplace_back(); }

    void insert(int num) {
        int cur = 0;
        for (int i = BITS - 1; i >= 0; i--) {
            int bit = (num >> i) & 1;
            if (nodes[cur].children[bit] == -1) {
                nodes[cur].children[bit] = nodes.size();
                nodes.emplace_back();
            }
            cur = nodes[cur].children[bit];
            nodes[cur].count++;
        }
    }

    // Maximum XOR of x with any inserted number
    int maxXor(int x) {
        int cur = 0, result = 0;
        for (int i = BITS - 1; i >= 0; i--) {
            int bit = (x >> i) & 1;
            int want = 1 - bit;  // We want the opposite bit

            if (nodes[cur].children[want] != -1 &&
                nodes[nodes[cur].children[want]].count > 0) {
                result |= (1 << i);
                cur = nodes[cur].children[want];
            } else {
                cur = nodes[cur].children[bit];
            }
            if (cur == -1) break;
        }
        return result;
    }
};
```

## Union-Find (Disjoint Set Union)

### Union-Find with Size and Rollback

```cpp
// Union-Find with path compression and union by rank
// Time: O(alpha(n)) amortized per operation
// Space: O(n)

class DSU {
    vector<int> parent, rank_, size_;

public:
    DSU(int n) : parent(n), rank_(n, 0), size_(n, 1) {
        iota(parent.begin(), parent.end(), 0);
    }

    int find(int x) {
        if (parent[x] != x)
            parent[x] = find(parent[x]);  // Path compression
        return parent[x];
    }

    bool unite(int x, int y) {
        x = find(x); y = find(y);
        if (x == y) return false;
        if (rank_[x] < rank_[y]) swap(x, y);
        parent[y] = x;
        size_[x] += size_[y];
        if (rank_[x] == rank_[y]) rank_[x]++;
        return true;
    }

    bool connected(int x, int y) { return find(x) == find(y); }
    int getSize(int x) { return size_[find(x)]; }
    int components() {
        int cnt = 0;
        for (int i = 0; i < (int)parent.size(); i++)
            if (find(i) == i) cnt++;
        return cnt;
    }
};
```

### Weighted Union-Find

```cpp
// Union-Find with weights (potential/distance from root)
// Useful for problems like "is A heavier than B?"

class WeightedDSU {
    vector<int> parent, rank_;
    vector<long long> weight;  // weight[x] = distance from x to parent[x]

public:
    WeightedDSU(int n) : parent(n), rank_(n, 0), weight(n, 0) {
        iota(parent.begin(), parent.end(), 0);
    }

    pair<int, long long> find(int x) {
        if (parent[x] == x) return {x, 0};
        auto [root, w] = find(parent[x]);
        parent[x] = root;
        weight[x] += w;
        return {root, weight[x]};
    }

    // Unite x and y with relation: weight(y) - weight(x) = w
    bool unite(int x, int y, long long w) {
        auto [rx, wx] = find(x);
        auto [ry, wy] = find(y);
        if (rx == ry) return (wy - wx) == w;  // Check consistency

        w = w + wx - wy;  // Adjust for root distances
        if (rank_[rx] < rank_[ry]) { swap(rx, ry); w = -w; }
        parent[ry] = rx;
        weight[ry] = w;
        if (rank_[rx] == rank_[ry]) rank_[rx]++;
        return true;
    }

    // Distance from x to y (if connected)
    long long dist(int x, int y) {
        auto [rx, wx] = find(x);
        auto [ry, wy] = find(y);
        if (rx != ry) return LLONG_MAX;  // Not connected
        return wy - wx;
    }
};
```

## Sparse Table

### Range Minimum Query (RMQ)

```cpp
// Build: O(n log n), Query: O(1), Space: O(n log n)
// Idempotent operations only (min, max, gcd, AND, OR)

class SparseTable {
    vector<vector<int>> table;
    vector<int> log2_floor;
    int n;

public:
    SparseTable(vector<int>& arr) : n(arr.size()) {
        int K = __lg(n) + 1;
        table.assign(K, vector<int>(n));
        log2_floor.resize(n + 1);

        for (int i = 2; i <= n; i++)
            log2_floor[i] = log2_floor[i/2] + 1;

        table[0] = arr;
        for (int k = 1; k < K; k++)
            for (int i = 0; i + (1 << k) <= n; i++)
                table[k][i] = min(table[k-1][i],
                                  table[k-1][i + (1 << (k-1))]);
    }

    // Minimum of arr[l..r] inclusive
    int query(int l, int r) {
        int k = log2_floor[r - l + 1];
        return min(table[k][l], table[k][r - (1 << k) + 1]);
    }
};
```

## Comparison: Segment Tree vs Fenwick vs Sparse Table

| Feature | Segment Tree | Fenwick Tree | Sparse Table |
|---------|-------------|--------------|--------------|
| Build | O(n) | O(n log n) | O(n log n) |
| Point query | O(log n) | O(log n) | O(1) |
| Range query | O(log n) | O(log n) | O(1) |
| Point update | O(log n) | O(log n) | N/A |
| Range update | O(log n) with lazy | With tricks | N/A |
| Space | O(4n) | O(n) | O(n log n) |
| Code complexity | High | Low | Low |
| Operations | Any associative | Invertible only | Idempotent only |
| Constant factor | Medium | Small | Tiny |

## Common Pitfalls

| Mistake | Impact | Fix |
|---------|--------|-----|
| Segment tree size 2n instead of 4n | Buffer overflow | Always allocate 4n |
| 0-indexed vs 1-indexed confusion | Off-by-one errors | Pick one convention, stick to it |
| Missing push_down in lazy seg tree | Stale data | Push down before any recursive call |
| Fenwick for non-invertible ops | Wrong answers | Use segment tree for min/max |
| Path compression with rollback | Incorrect rollback | Use union by rank only for rollback |
| Sparse table for sum queries | Wrong answer (not idempotent) | Use prefix sums or Fenwick tree |
| Trie with fixed array children | MLE on large alphabet | Use map or hash map for children |

## Exercises

1. **Range Queries**: Implement a segment tree with range add updates and range sum queries using lazy propagation
2. **Inversion Count**: Count inversions using a Fenwick tree (process elements right to left)
3. **Maximum XOR Subarray**: Find max XOR subarray using prefix XOR + binary trie
4. **Dynamic Connectivity**: Use Union-Find for online "add edge" and connectivity queries
5. **K-th Smallest in Range**: Use a persistent segment tree to find k-th smallest in arr[l..r]


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to data structure expert
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Data Structure Expert Analysis

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

**Input:** "Help me with data structure expert for my current situation"

**Output:**

Based on your situation, here is a structured approach to data structure expert:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
