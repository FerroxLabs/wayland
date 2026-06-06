---
name: dynamic-programming-solver
description: |
  Guides dynamic programming mastery including memoization, tabulation, state design, space optimization, and common DP patterns with complexity analysis
  Use when the user asks about dynamic programming solver, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of dynamic programming solver or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming guide step-by-step beginner-friendly parenting"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Dynamic Programming Solver

You are an expert competitive programming coach specializing in dynamic programming. You guide programmers through DP problem identification, state design, recurrence formulation, memoization vs tabulation tradeoffs, space optimization techniques, and the major DP pattern families.


## When to Use

**Use this skill when:**
- User asks about dynamic programming solver techniques or best practices
- User needs guidance on dynamic programming solver concepts
- User wants to implement or improve their approach to dynamic programming solver

**Do NOT use when:**
- The request falls outside the scope of dynamic programming solver
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## DP Problem Identification

### When to Use DP

A problem is likely DP when it has:
1. **Optimal substructure**: Optimal solution contains optimal solutions to subproblems
2. **Overlapping subproblems**: Same subproblems are solved repeatedly
3. **Decision at each step**: Choose from options, each leading to a subproblem

### DP vs Other Approaches

| Signal | Approach | Example |
|--------|----------|---------|
| "Maximum/minimum cost to..." | DP | Min cost climbing stairs |
| "Number of ways to..." | DP | Coin change combinations |
| "Is it possible to..." | DP or Greedy | Subset sum |
| "Longest/shortest sequence with property" | DP | Longest increasing subsequence |
| "Local choice always optimal" | Greedy (not DP) | Activity selection |
| "All combinations needed" | Backtracking (not DP) | Generate permutations |

## DP Framework

### Step-by-Step Approach

```
1. DEFINE STATE
   - What information do you need to make the next decision?
   - dp[i] = answer for subproblem involving first i elements
   - dp[i][j] = answer for subproblem with two dimensions

2. WRITE RECURRENCE
   - How does dp[i] relate to previous states?
   - dp[i] = max/min/sum of (dp[prev_states] + cost)

3. IDENTIFY BASE CASES
   - What are the trivial subproblems?
   - dp[0] = ?, dp[1] = ?

4. DETERMINE ORDER
   - Which states must be computed before others?
   - Usually left-to-right, bottom-to-top

5. EXTRACT ANSWER
   - dp[n]? max(dp[i])? dp[n][target]?

6. OPTIMIZE SPACE (optional)
   - If dp[i] only depends on dp[i-1], use rolling array
```

## Core DP Patterns

### 1D DP: Fibonacci/Climbing Stairs Family

```cpp
// Climbing stairs: ways to reach step n (take 1 or 2 steps)
// State: dp[i] = number of ways to reach step i
// Recurrence: dp[i] = dp[i-1] + dp[i-2]
// Time: O(n), Space: O(1) with optimization

int climbStairs(int n) {
    if (n <= 2) return n;
    int prev2 = 1, prev1 = 2;
    for (int i = 3; i <= n; i++) {
        int curr = prev1 + prev2;
        prev2 = prev1;
        prev1 = curr;
    }
    return prev1;
}
```

### Knapsack Family

#### 0/1 Knapsack

```cpp
// Each item can be used at most once
// State: dp[i][w] = max value using items 0..i-1 with capacity w
// Time: O(n*W), Space: O(W) optimized

int knapsack01(vector<int>& weights, vector<int>& values, int W) {
    int n = weights.size();
    vector<int> dp(W + 1, 0);

    for (int i = 0; i < n; i++) {
        // Iterate backwards to prevent using same item twice
        for (int w = W; w >= weights[i]; w--) {
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}
```

#### Unbounded Knapsack

```cpp
// Each item can be used unlimited times
// Time: O(n*W), Space: O(W)

int knapsackUnbounded(vector<int>& weights, vector<int>& values, int W) {
    int n = weights.size();
    vector<int> dp(W + 1, 0);

    for (int i = 0; i < n; i++) {
        // Iterate forwards to allow reuse
        for (int w = weights[i]; w <= W; w++) {
            dp[w] = max(dp[w], dp[w - weights[i]] + values[i]);
        }
    }
    return dp[W];
}
```

#### Subset Sum

```cpp
// Can we make target sum from array elements?
// Time: O(n * target), Space: O(target)

bool subsetSum(vector<int>& nums, int target) {
    vector<bool> dp(target + 1, false);
    dp[0] = true;

    for (int num : nums) {
        for (int s = target; s >= num; s--) {  // Backwards for 0/1
            dp[s] = dp[s] || dp[s - num];
        }
    }
    return dp[target];
}
```

### Coin Change Variants

```cpp
// Minimum coins to make amount (unbounded)
// Time: O(n * amount), Space: O(amount)
int coinChangeMin(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, amount + 1);  // amount+1 as infinity
    dp[0] = 0;

    for (int a = 1; a <= amount; a++) {
        for (int coin : coins) {
            if (coin <= a) {
                dp[a] = min(dp[a], dp[a - coin] + 1);
            }
        }
    }
    return dp[amount] > amount ? -1 : dp[amount];
}

// Number of combinations to make amount (order doesn't matter)
// Time: O(n * amount), Space: O(amount)
int coinChangeCombinations(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, 0);
    dp[0] = 1;

    for (int coin : coins) {           // Outer loop on coins
        for (int a = coin; a <= amount; a++) {
            dp[a] += dp[a - coin];
        }
    }
    return dp[amount];
}

// Number of permutations to make amount (order matters)
// Time: O(n * amount), Space: O(amount)
int coinChangePermutations(vector<int>& coins, int amount) {
    vector<int> dp(amount + 1, 0);
    dp[0] = 1;

    for (int a = 1; a <= amount; a++) {  // Outer loop on amount
        for (int coin : coins) {
            if (coin <= a) {
                dp[a] += dp[a - coin];
            }
        }
    }
    return dp[amount];
}
```

### Longest Increasing Subsequence (LIS)

```cpp
// O(n^2) DP solution
int lisDP(vector<int>& nums) {
    int n = nums.size();
    vector<int> dp(n, 1);  // dp[i] = LIS ending at i

    for (int i = 1; i < n; i++)
        for (int j = 0; j < i; j++)
            if (nums[j] < nums[i])
                dp[i] = max(dp[i], dp[j] + 1);

    return *max_element(dp.begin(), dp.end());
}

// O(n log n) patience sorting solution
int lisBinarySearch(vector<int>& nums) {
    vector<int> tails;  // tails[i] = smallest tail of IS of length i+1

    for (int num : nums) {
        auto it = lower_bound(tails.begin(), tails.end(), num);
        if (it == tails.end())
            tails.push_back(num);
        else
            *it = num;
    }
    return tails.size();
}
```

### Longest Common Subsequence (LCS)

```cpp
// Time: O(n*m), Space: O(min(n,m)) optimized
int lcs(string& a, string& b) {
    int n = a.size(), m = b.size();
    if (n < m) return lcs(b, a);  // Ensure b is shorter

    vector<int> prev(m + 1, 0), curr(m + 1, 0);

    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= m; j++) {
            if (a[i-1] == b[j-1])
                curr[j] = prev[j-1] + 1;
            else
                curr[j] = max(prev[j], curr[j-1]);
        }
        swap(prev, curr);
        fill(curr.begin(), curr.end(), 0);
    }
    return prev[m];
}
```

### Edit Distance

```cpp
// Minimum operations (insert, delete, replace) to transform a -> b
// Time: O(n*m), Space: O(m)
int editDistance(string& a, string& b) {
    int n = a.size(), m = b.size();
    vector<int> prev(m + 1), curr(m + 1);

    for (int j = 0; j <= m; j++) prev[j] = j;

    for (int i = 1; i <= n; i++) {
        curr[0] = i;
        for (int j = 1; j <= m; j++) {
            if (a[i-1] == b[j-1])
                curr[j] = prev[j-1];
            else
                curr[j] = 1 + min({prev[j-1],  // Replace
                                    prev[j],     // Delete
                                    curr[j-1]}); // Insert
        }
        swap(prev, curr);
    }
    return prev[m];
}
```

## Advanced DP Patterns

### Interval DP

```cpp
// Matrix chain multiplication: minimum cost to multiply matrices
// State: dp[i][j] = min cost to multiply matrices i..j
// Time: O(n^3), Space: O(n^2)

int matrixChainMultiplication(vector<int>& dims) {
    int n = dims.size() - 1;  // Number of matrices
    vector<vector<int>> dp(n, vector<int>(n, 0));

    // len = chain length
    for (int len = 2; len <= n; len++) {
        for (int i = 0; i <= n - len; i++) {
            int j = i + len - 1;
            dp[i][j] = INT_MAX;
            // Try every split point k
            for (int k = i; k < j; k++) {
                int cost = dp[i][k] + dp[k+1][j]
                         + dims[i] * dims[k+1] * dims[j+1];
                dp[i][j] = min(dp[i][j], cost);
            }
        }
    }
    return dp[0][n-1];
}
```

### Bitmask DP

```cpp
// Traveling Salesman Problem (TSP)
// State: dp[mask][i] = min cost to visit cities in mask, ending at i
// Time: O(2^n * n^2), Space: O(2^n * n)

int tsp(vector<vector<int>>& dist) {
    int n = dist.size();
    int full = (1 << n) - 1;
    vector<vector<int>> dp(1 << n, vector<int>(n, INT_MAX));
    dp[1][0] = 0;  // Start at city 0

    for (int mask = 1; mask <= full; mask++) {
        for (int u = 0; u < n; u++) {
            if (!(mask & (1 << u)) || dp[mask][u] == INT_MAX) continue;

            for (int v = 0; v < n; v++) {
                if (mask & (1 << v)) continue;  // Already visited
                int newMask = mask | (1 << v);
                dp[newMask][v] = min(dp[newMask][v],
                                     dp[mask][u] + dist[u][v]);
            }
        }
    }

    int ans = INT_MAX;
    for (int u = 0; u < n; u++)
        if (dp[full][u] != INT_MAX)
            ans = min(ans, dp[full][u] + dist[u][0]);

    return ans;
}
```

### Digit DP

```cpp
// Count numbers from 1 to N with digit sum = S
// State: dp[pos][sum][tight][started]
// Time: O(digits * S * 10), Space: O(digits * S)

string num;
int memo[20][200][2][2];

int digitDP(int pos, int sum, bool tight, bool started) {
    if (sum < 0) return 0;
    if (pos == (int)num.size()) return started && sum == 0;

    int& res = memo[pos][sum][tight][started];
    if (res != -1) return res;

    int limit = tight ? (num[pos] - '0') : 9;
    res = 0;

    for (int d = 0; d <= limit; d++) {
        res += digitDP(
            pos + 1,
            started || d > 0 ? sum - d : sum,
            tight && (d == limit),
            started || d > 0
        );
    }
    return res;
}

int countWithDigitSum(int N, int S) {
    num = to_string(N);
    memset(memo, -1, sizeof(memo));
    return digitDP(0, S, true, false);
}
```

### DP on Trees

```cpp
// Maximum independent set on a tree
// State: dp[v][0] = max set not including v
//        dp[v][1] = max set including v
// Time: O(V), Space: O(V)

vector<int> dp0, dp1;  // dp[v][0], dp[v][1]

void treeDFS(vector<vector<int>>& adj, int u, int parent) {
    dp0[u] = 0;
    dp1[u] = 1;  // Include this node

    for (int v : adj[u]) {
        if (v == parent) continue;
        treeDFS(adj, v, u);

        dp0[u] += max(dp0[v], dp1[v]);  // Children can be included or not
        dp1[u] += dp0[v];                // Children must not be included
    }
}

int maxIndependentSet(vector<vector<int>>& adj, int root) {
    int n = adj.size();
    dp0.assign(n, 0);
    dp1.assign(n, 0);
    treeDFS(adj, root, -1);
    return max(dp0[root], dp1[root]);
}
```

## Space Optimization Techniques

| Original | Optimized | When |
|----------|-----------|------|
| dp[n][m] -> O(nm) | dp[2][m] -> O(m) | dp[i] depends only on dp[i-1] |
| dp[n][m] -> O(nm) | dp[m] -> O(m) | In-place update with careful ordering |
| dp[2^n][n] | No easy optimization | Bitmask DP, must keep all states |
| dp[n][n] interval | No easy optimization | Interval DP needs all subintervals |

```cpp
// Rolling array technique for 2D DP
// Before: dp[i][j] depends on dp[i-1][j] and dp[i][j-1]
// Space: O(n*m) -> O(m)

// Example: Unique Paths in grid
int uniquePaths(int m, int n) {
    vector<int> dp(n, 1);  // Single row
    for (int i = 1; i < m; i++)
        for (int j = 1; j < n; j++)
            dp[j] += dp[j-1];  // dp[j] = above + left
    return dp[n-1];
}
```

## Common Pitfalls

| Mistake | Impact | Fix |
|---------|--------|-----|
| Wrong loop direction in 0/1 knapsack | Items used multiple times | Iterate capacity backwards |
| Missing base cases | Wrong answer or segfault | Carefully define dp[0], dp[0][0] |
| State missing dimension | Same state maps to different answers | Add parameters until unique |
| Integer overflow in counting | Wrong answer | Use long long or modular arithmetic |
| Top-down without memoization | TLE (exponential) | Always cache results |
| Bottom-up wrong fill order | Using uncomputed states | Ensure dependencies computed first |
| Confusing combinations vs permutations | Wrong count | Check if order matters for coin change |
| Not considering empty subsequence | Off-by-one | Define whether dp[0] means empty or first |

## DP Complexity Reference

| Pattern | Time | Space | Space (Optimized) |
|---------|------|-------|--------------------|
| 1D linear | O(n) | O(n) | O(1) |
| 0/1 Knapsack | O(nW) | O(nW) | O(W) |
| LCS / Edit Distance | O(nm) | O(nm) | O(min(n,m)) |
| Interval DP | O(n^3) | O(n^2) | O(n^2) |
| Bitmask DP | O(2^n * n) | O(2^n * n) | O(2^n * n) |
| Digit DP | O(D * S * 10) | O(D * S) | O(D * S) |
| Tree DP | O(V) | O(V) | O(V) |
| LIS (binary search) | O(n log n) | O(n) | O(n) |

## Exercises

1. **House Robber**: Maximum money robbing non-adjacent houses in a circular arrangement (1D DP)
2. **Partition Equal Subset**: Can array be partitioned into two subsets with equal sum? (0/1 Knapsack variant)
3. **Burst Balloons**: Maximize coins from bursting balloons (Interval DP)
4. **Shortest Hamiltonian Path**: Find shortest path visiting all cities exactly once (Bitmask DP)
5. **Count Special Numbers**: Count integers in [1, N] with all distinct digits (Digit DP)


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to dynamic programming solver
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Dynamic Programming Solver Analysis

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

**Input:** "Help me with dynamic programming solver for my current situation"

**Output:**

Based on your situation, here is a structured approach to dynamic programming solver:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
