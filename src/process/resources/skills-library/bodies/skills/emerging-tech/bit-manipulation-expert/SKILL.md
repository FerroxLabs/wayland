---
name: bit-manipulation-expert
description: |
  Competitive programming bit manipulation mastery covering fundamental bit tricks, bitmask dynamic programming, XOR properties and applications, subset enumeration over bitmasks, bitwise optimization techniques, and practical contest applications for problems involving sets, states, and combinatorial optimization.
  Use when the user asks about bit manipulation expert, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of bit manipulation expert or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming checklist beginner-friendly python game-design"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Bit Manipulation Expert

You are an expert competitive programmer specializing in bit manipulation techniques. You can identify when problems have bitwise solutions, apply bitmask DP for state-space optimization, exploit XOR properties for elegant solutions, and use bit tricks to achieve constant-factor speedups that matter in tight time limits.


## When to Use

**Use this skill when:**
- User asks about bit manipulation expert techniques or best practices
- User needs guidance on bit manipulation expert concepts
- User wants to implement or improve their approach to bit manipulation expert

**Do NOT use when:**
- The request falls outside the scope of bit manipulation expert
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Problem context:** Share the problem statement or describe the problem you are working on.
2. **Constraints:** What are N, M, and time/memory limits?
3. **Current approach:** Do you have a solution that is too slow, or are you starting from scratch?
4. **Language:** C++, Python, Java, or other? (bit manipulation is most natural in C++)
5. **Contest or practice?** Are you under time pressure or learning?

---

## Fundamental Bit Operations

### Core Operations Reference

```cpp
// Setting, clearing, toggling, checking bits
int set_bit(int x, int i)    { return x | (1 << i); }
int clear_bit(int x, int i)  { return x & ~(1 << i); }
int toggle_bit(int x, int i) { return x ^ (1 << i); }
bool has_bit(int x, int i)   { return (x >> i) & 1; }

// Lowest set bit operations
int lowest_set_bit(int x)    { return x & (-x); }       // isolate lowest 1
int clear_lowest_bit(int x)  { return x & (x - 1); }    // turn off lowest 1
int set_lowest_zero(int x)   { return x | (x + 1); }    // turn on lowest 0

// Counting
int popcount(int x)           { return __builtin_popcount(x); }
int leading_zeros(int x)      { return __builtin_clz(x); }
int trailing_zeros(int x)     { return __builtin_ctz(x); }
int highest_bit_pos(int x)    { return 31 - __builtin_clz(x); }

// For 64-bit: use __builtin_popcountll, __builtin_clzll, __builtin_ctzll
```

### Essential Bit Identities

```
Property                    | Expression           | Example (x=1010)
----------------------------|----------------------|------------------
x is power of 2             | x & (x-1) == 0       | 1000 & 0111 = 0 ✓
Rightmost differing bit     | x ^ y                | -
All 1s up to bit i          | (1 << i) - 1         | (1<<3)-1 = 0111
Bits i through j (inclusive) | ((1<<(j-i+1))-1)<<i | -
Sign of integer             | x >> 31              | (or 63 for long long)
Absolute value              | (x ^ (x>>31)) - (x>>31) | -
Min without branch          | y ^ ((x^y) & -(x<y)) | -
Max without branch          | x ^ ((x^y) & -(x<y)) | -
Swap without temp           | a^=b; b^=a; a^=b;   | -
Check if opposite signs     | (x ^ y) < 0          | -
```

---

## XOR Properties and Applications

### Key XOR Properties

```
1. Self-inverse: a ^ a = 0
2. Identity: a ^ 0 = a
3. Commutative: a ^ b = b ^ a
4. Associative: (a ^ b) ^ c = a ^ (b ^ c)
5. No carry: XOR is addition without carry (GF(2) arithmetic)

Consequence: XOR of all elements cancels pairs
  [a, b, a, c, b] → XOR = c (all paired elements cancel)
```

### Classic XOR Problems

```cpp
// Find the single unique number (all others appear twice)
// Time: O(n), Space: O(1)
int findUnique(vector<int>& nums) {
    int result = 0;
    for (int x : nums) result ^= x;
    return result;
}

// Find TWO unique numbers (all others appear twice)
int findTwoUnique(vector<int>& nums) {
    int xor_all = 0;
    for (int x : nums) xor_all ^= x;
    // xor_all = a ^ b (the two unique numbers)

    // Find any bit where a and b differ
    int diff_bit = xor_all & (-xor_all);  // lowest set bit

    // Partition into two groups by that bit
    int group1 = 0, group2 = 0;
    for (int x : nums) {
        if (x & diff_bit) group1 ^= x;
        else group2 ^= x;
    }
    // group1 = a, group2 = b
}

// XOR from 0 to n (pattern repeats every 4)
int xorUpTo(int n) {
    switch (n % 4) {
        case 0: return n;
        case 1: return 1;
        case 2: return n + 1;
        case 3: return 0;
    }
}

// XOR of range [L, R]
int xorRange(int L, int R) {
    return xorUpTo(R) ^ xorUpTo(L - 1);
}
```

### XOR Basis (Linear Algebra over GF(2))

```cpp
// Find maximum XOR subset using Gaussian elimination
struct XORBasis {
    long long basis[60] = {};  // for numbers up to 2^60
    int sz = 0;

    void insert(long long x) {
        for (int i = 59; i >= 0; i--) {
            if (!(x >> i & 1)) continue;
            if (!basis[i]) {
                basis[i] = x;
                sz++;
                return;
            }
            x ^= basis[i];
        }
        // x became 0: linearly dependent, skip
    }

    long long maxXor() {
        long long result = 0;
        for (int i = 59; i >= 0; i--) {
            result = max(result, result ^ basis[i]);
        }
        return result;
    }

    bool canRepresent(long long x) {
        for (int i = 59; i >= 0; i--) {
            if (x >> i & 1) x ^= basis[i];
        }
        return x == 0;
    }
};

// Applications:
// - Maximum XOR of any subset of numbers
// - Count distinct XOR values achievable
// - Check if target XOR is reachable from given set
```

---

## Bitmask Dynamic Programming

### When to Use Bitmask DP

```
Indicators:
- N is small (typically N <= 20, sometimes up to 24)
- Problem involves subsets, permutations, or assignments
- State is which elements have been "used" or "visited"
- Brute force would be O(N!) but bitmask DP is O(2^N * N)

Time complexity: O(2^N * f(N)) where f(N) is per-state work
Space complexity: O(2^N) or O(2^N * N)

N=15: 2^15 = 32,768 states (fast)
N=20: 2^20 = 1,048,576 states (feasible)
N=24: 2^24 = 16,777,216 states (tight but possible)
N=28: 2^28 = 268M states (usually too much)
```

### Traveling Salesman Problem (TSP)

```cpp
// Classic bitmask DP: O(2^N * N^2)
// dp[mask][i] = minimum cost to visit cities in 'mask', ending at city i

int tsp(vector<vector<int>>& dist, int n) {
    int FULL = (1 << n) - 1;
    vector<vector<int>> dp(1 << n, vector<int>(n, INT_MAX));

    dp[1][0] = 0;  // Start at city 0

    for (int mask = 1; mask < (1 << n); mask++) {
        for (int u = 0; u < n; u++) {
            if (dp[mask][u] == INT_MAX) continue;
            if (!(mask & (1 << u))) continue;  // u must be in mask

            for (int v = 0; v < n; v++) {
                if (mask & (1 << v)) continue;  // v must NOT be in mask
                int newMask = mask | (1 << v);
                dp[newMask][v] = min(dp[newMask][v],
                                     dp[mask][u] + dist[u][v]);
            }
        }
    }

    // Find minimum cost to return to start
    int ans = INT_MAX;
    for (int u = 0; u < n; u++) {
        if (dp[FULL][u] != INT_MAX) {
            ans = min(ans, dp[FULL][u] + dist[u][0]);
        }
    }
    return ans;
}
```

### Assignment Problem (Hungarian via Bitmask DP)

```cpp
// Assign N workers to N jobs, minimize total cost
// dp[mask] = minimum cost to assign jobs in 'mask'
// Worker i handles the i-th assigned job

int assignmentDP(vector<vector<int>>& cost, int n) {
    vector<int> dp(1 << n, INT_MAX);
    dp[0] = 0;

    for (int mask = 0; mask < (1 << n); mask++) {
        if (dp[mask] == INT_MAX) continue;
        int worker = __builtin_popcount(mask);  // which worker is next
        if (worker >= n) continue;

        for (int job = 0; job < n; job++) {
            if (mask & (1 << job)) continue;  // job already assigned
            int newMask = mask | (1 << job);
            dp[newMask] = min(dp[newMask], dp[mask] + cost[worker][job]);
        }
    }
    return dp[(1 << n) - 1];
}
```

### Subset Sum / Counting with Bitmasks

```cpp
// Iterate over all subsets of a given mask
void enumerateSubsets(int mask) {
    for (int sub = mask; sub > 0; sub = (sub - 1) & mask) {
        // 'sub' is a subset of 'mask'
        process(sub);
    }
    // remember to the empty subset (sub = 0) if needed
}
// Total iterations across all masks: O(3^N) by inclusion-exclusion

// Sum over subsets (SOS DP / Zeta Transform)
// For each mask, compute sum of f[sub] for all sub that are subsets of mask
// O(2^N * N) instead of O(3^N)
void sosDP(vector<int>& f, int n) {
    for (int i = 0; i < n; i++) {
        for (int mask = 0; mask < (1 << n); mask++) {
            if (mask & (1 << i)) {
                f[mask] += f[mask ^ (1 << i)];
            }
        }
    }
}

// Applications of SOS DP:
// - Count pairs where a & b = 0 (a is subset of complement of b)
// - Maximum AND/OR of pairs
// - Inclusion-exclusion over subsets
```

---

## Bitmask Optimization Tricks

### Profile-Based DP (Broken Profile)

```cpp
// Grid problems where N is large but M is small (e.g., tiling N x M grid)
// State: bitmask of M columns in current row boundary
// N rows x 2^M states

// Example: Count ways to tile N x M grid with dominoes
// dp[row][mask] = number of ways to fill rows 0..row with boundary 'mask'
// mask bit i = 1 means column i has a vertical domino sticking into next row
```

### Meet-in-the-Middle

```cpp
// When N is too large for 2^N but feasible for 2 * 2^(N/2)
// Split set in half, enumerate subsets of each half, combine

// Example: Subset sum closest to target, N=40
// 2^40 is too large, but 2^20 * 2 = 2M is fine

void meetInMiddle(vector<int>& a, long long target) {
    int n = a.size();
    int half = n / 2;

    // Generate all subset sums for first half
    vector<long long> left;
    for (int mask = 0; mask < (1 << half); mask++) {
        long long sum = 0;
        for (int i = 0; i < half; i++)
            if (mask & (1 << i)) sum += a[i];
        left.push_back(sum);
    }
    sort(left.begin(), left.end());

    // For each subset sum of second half, binary search in left
    long long best = LLONG_MAX;
    for (int mask = 0; mask < (1 << (n - half)); mask++) {
        long long sum = 0;
        for (int i = 0; i < n - half; i++)
            if (mask & (1 << i)) sum += a[half + i];

        // Find closest match in left array
        auto it = lower_bound(left.begin(), left.end(), target - sum);
        if (it != left.end())
            best = min(best, abs(*it + sum - target));
        if (it != left.begin())
            best = min(best, abs(*prev(it) + sum - target));
    }
}
```

---

## Bitwise Tricks for Speed

### Compiler Intrinsics (C++)

```cpp
// These compile to single CPU instructions -- O(1) and fast

__builtin_popcount(x)     // Count 1-bits (popcnt instruction)
__builtin_clz(x)          // Count leading zeros
__builtin_ctz(x)          // Count trailing zeros
__builtin_parity(x)       // 1 if odd number of 1-bits

// GCC specific: 128-bit integers for large bitmasks
__int128 mask;  // Up to 128 bits (use custom bitset for more)

// For N > 64, use bitset<N>:
bitset<200> bs;
bs.set(42);
bs.count();  // popcount
bs &= other; // bitwise AND
```

### Iteration Patterns

```cpp
// Iterate over all set bits in a mask
for (int x = mask; x; x &= x - 1) {
    int bit = __builtin_ctz(x);  // position of lowest set bit
    // process bit
}

// Generate all masks with exactly k bits set from n bits
// (Gosper's hack)
void generateKSubsets(int n, int k) {
    int mask = (1 << k) - 1;  // smallest mask with k bits
    while (mask < (1 << n)) {
        process(mask);
        // Gosper's hack: next combination
        int c = mask & -mask;
        int r = mask + c;
        mask = (((r ^ mask) >> 2) / c) | r;
    }
}

// Enumerate all submasks including empty set
for (int sub = mask; ; sub = (sub - 1) & mask) {
    process(sub);
    if (sub == 0) break;
}
```

---

## Contest Problem Patterns

| Pattern | Bitmask Technique | Complexity | N limit |
|---------|------------------|------------|---------|
| TSP / Hamiltonian path | dp[mask][last] | O(2^N * N^2) | ~20 |
| Assignment problem | dp[mask] with popcount for worker | O(2^N * N) | ~20 |
| Set cover | dp[mask] = min sets to cover mask | O(2^N * M) | ~20 |
| Steiner tree | dp[mask][node] on graph | O(3^k * N + 2^k * N^2) | k~15 |
| Game theory (Sprague-Grundy) | Grundy values with bitmask states | Varies | ~20 |
| Subset convolution | Ranked Mobius transform | O(2^N * N^2) | ~20 |
| Maximum weight closure | Bitmask + flow or DP | O(2^N * N) | ~20 |
| Profile DP (grid) | Bitmask of column boundary | O(rows * 2^cols) | cols~15 |

### Problem Recognition Checklist

```
□ Is N <= 20-24? → Consider bitmask DP
□ Does the problem involve subsets or assignments? → Bitmask DP
□ Can states be represented as which items are "used"? → Bitmask DP
□ Is the answer XOR of something? → Check XOR properties
□ Does the problem involve finding unique/missing elements? → XOR cancellation
□ Is there a parity constraint? → XOR or bit counting
□ Does N up to 40 need subset enumeration? → Meet in the middle
□ Grid with small width? → Profile/broken-profile DP
```


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to bit manipulation expert
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Bit Manipulation Expert Analysis

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

**Input:** "Help me with bit manipulation expert for my current situation"

**Output:**

Based on your situation, here is a structured approach to bit manipulation expert:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
