---
name: competitive-debugging-master
description: |
  Competitive programming debugging mastery covering stress testing with random test generators, systematic edge case identification, time and memory optimization techniques, common bug patterns in contest code, binary search on test cases, and strategies for debugging under contest time pressure.
  Use when the user asks about competitive debugging master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of competitive debugging master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming stress-management checklist template beginner-friendly python testing"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "advanced"
---

# Competitive Debugging Master

You are an expert competitive programmer specializing in debugging contest solutions. You systematically find bugs using stress testing, identify edge cases that break solutions, optimize code for tight time limits, and apply disciplined debugging strategies that work under contest pressure.


## When to Use

**Use this skill when:**
- User asks about competitive debugging master techniques or best practices
- User needs guidance on competitive debugging master concepts
- User wants to implement or improve their approach to competitive debugging master

**Do NOT use when:**
- The request falls outside the scope of competitive debugging master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Problem and solution:** Share both the problem statement and your current code.
2. **Symptom:** Wrong Answer, Time Limit Exceeded, Runtime Error, or Memory Limit Exceeded?
3. **Test cases:** Does it pass the sample cases? Do you have a failing test case?
4. **Approach:** Describe your algorithm -- I need to understand your intended logic.
5. **Contest context:** Are you under time pressure, or is this practice?

---

## Debugging Decision Tree

```
Symptom?
├── Wrong Answer (WA)
│   ├── Fails on samples? → Logic error, re-read problem statement
│   ├── Passes samples, fails on submit?
│   │   ├── Build stress test → Find smallest failing case
│   │   ├── Check edge cases (N=0, N=1, all same, max values)
│   │   └── Check integer overflow, off-by-one, array bounds
│   └── Passes most but not all?
│       └── Likely corner case or overflow on large inputs
│
├── Time Limit Exceeded (TLE)
│   ├── Wrong complexity? → Rethink algorithm
│   ├── Right complexity but slow constant? → Optimize I/O, data structures
│   └── Borderline? → Constant factor optimization (see section below)
│
├── Runtime Error (RE)
│   ├── Array out of bounds → Check array sizes, loop bounds
│   ├── Division by zero → Add guards
│   ├── Stack overflow → Increase stack or convert recursion to iteration
│   └── Null/invalid access → Check edge cases (empty input)
│
└── Memory Limit Exceeded (MLE)
    ├── Too many allocations → Use arrays instead of vectors/maps
    ├── Oversized array → Reduce dimensions or use sparse structure
    └── Recursion depth → Convert to iterative
```

---

## Stress Testing Framework

### The Gold Standard: Brute Force vs Optimized

```cpp
// stress_test.cpp -- Find smallest failing test case
#include <bits/stdc++.h>
using namespace std;

// Your optimized solution
int solve(vector<int>& a) {
    // ... your algorithm ...
}

// Brute force (definitely correct, possibly slow)
int brute(vector<int>& a) {
    // ... O(N^2) or O(N^3) simple approach ...
}

// Random test generator
vector<int> generate(mt19937& rng, int maxN, int maxVal) {
    int n = rng() % maxN + 1;
    vector<int> a(n);
    for (int& x : a) x = rng() % (2 * maxVal + 1) - maxVal;
    return a;
}

int main() {
    mt19937 rng(42);  // fixed seed for reproducibility

    for (int test = 1; test <= 1000000; test++) {
        vector<int> a = generate(rng, 10, 100);  // small cases first

        int expected = brute(a);
        int actual = solve(a);

        if (expected != actual) {
            cout << "FAILED on test " << test << endl;
            cout << "Input: ";
            for (int x : a) cout << x << " ";
            cout << endl;
            cout << "Expected: " << expected << endl;
            cout << "Actual: " << actual << endl;
            return 1;
        }

        if (test % 10000 == 0) {
            cerr << "Passed " << test << " tests" << endl;
        }
    }
    cout << "All tests passed!" << endl;
}
```

### shell Stress Test (Separate Files)

```shell
#!shell-interpreter
# stress-test script - compare two solutions
g++ -O2 solve.cpp -o solve
g++ -O2 brute.cpp -o brute
g++ -O2 gen.cpp -o gen

for i in $(seq 1 10000); do
    ./gen $i > input.txt          # seed = test number
    ./solve < input.txt > out1.txt
    ./brute < input.txt > out2.txt
    if ! diff -q out1.txt out2.txt > ./dev/null 2>&1; then
        echo "MISMATCH on test $i"
        echo "Input:"
        cat input.txt
        echo "Expected:"
        cat out2.txt
        echo "Got:"
        cat out1.txt
        exit 1
    fi
done
echo "All tests passed!"
```

### Random Test Generator Patterns

```cpp
// gen.cpp - takes seed as command-line argument
#include <bits/stdc++.h>
using namespace std;

int main(int argc, char* argv[]) {
    mt19937 rng(atoi(argv[1]));

    // Array of integers
    int n = rng() % 10 + 1;
    cout << n << "\n";
    for (int i = 0; i < n; i++)
        cout << (rng() % 201 - 100) << " \n"[i == n-1];

    // Tree (random parent for each node)
    int n = rng() % 10 + 2;
    cout << n << "\n";
    for (int i = 2; i <= n; i++) {
        int parent = rng() % (i - 1) + 1;
        cout << parent << " " << i << "\n";
    }

    // Random permutation
    int n = rng() % 10 + 1;
    vector<int> perm(n);
    iota(perm.begin(), perm.end(), 1);
    shuffle(perm.begin(), perm.end(), rng);
    cout << n << "\n";
    for (int x : perm) cout << x << " ";
    cout << "\n";

    // Random graph (N nodes, M edges, no self-loops, no multi-edges)
    int n = rng() % 8 + 2, m = rng() % (n*(n-1)/2) + 1;
    set<pair<int,int>> edges;
    while ((int)edges.size() < m) {
        int u = rng() % n + 1, v = rng() % n + 1;
        if (u != v) edges.insert({min(u,v), max(u,v)});
    }
    cout << n << " " << m << "\n";
    for (auto [u,v] : edges) cout << u << " " << v << "\n";
}
```

---

## Edge Case Checklist

### Universal Edge Cases

```
□ N = 0 (empty input)
□ N = 1 (single element)
□ N = 2 (minimum for pairwise operations)
□ All elements identical
□ Already sorted (ascending)
□ Reverse sorted (descending)
□ Maximum values (1e9, 1e18)
□ Minimum values (negative, zero)
□ Negative numbers (if allowed)
□ Answer is zero
□ Answer requires 64-bit integer
```

### Data Structure Specific

```
Arrays:
□ Single element array
□ Two elements (swap needed?)
□ All same values
□ Sorted / reverse sorted
□ Maximum size with extreme values

Trees:
□ Single node
□ Linear chain (degenerate tree, depth = N)
□ Star graph (one root, N-1 leaves)
□ Complete binary tree
□ Disconnected (if not guaranteed connected)

Graphs:
□ No edges (isolated nodes)
□ Complete graph
□ Single path
□ Self-loops (if allowed)
□ Disconnected components
□ Negative weight edges/cycles

Strings:
□ Empty string
□ Single character
□ All same character ("aaaa")
□ Palindrome
□ Maximum length
```

### Numeric Edge Cases

```
Integer overflow checkpoints:
□ Multiplication of two 32-bit ints → need 64-bit (>2e9)
□ Sum of N values each up to 1e9, N up to 2e5 → need 64-bit (>2e14)
□ Square of distance (1e9 squared = 1e18, fits in long long)
□ Product of three values → may need __int128 or modular arithmetic

Modular arithmetic:
□ Subtraction can go negative: use (a - b + MOD) % MOD
□ Division requires modular inverse, not regular division
□ Intermediate products can overflow before mod: use (ll)a * b % MOD

Floating point:
□ Comparison: use eps = 1e-9, not ==
□ Large values lose precision: 1e15 + 1.0 == 1e15 in double
□ atan2(0, 0) is defined but may cause issues
```

---

## Time Optimization Techniques

### Input/Output Speed

```cpp
// ALWAYS include these in competitive programming
ios::sync_with_stdio(false);
cin.tie(nullptr);

// For very large I/O (>1MB), use custom reader:
inline int readInt() {
    int x = 0, c = getchar_unlocked();
    bool neg = false;
    while (c < '0') { neg = (c == '-'); c = getchar_unlocked(); }
    while (c >= '0') { x = x * 10 + c - '0'; c = getchar_unlocked(); }
    return neg ? -x : x;
}

// Printf is faster than cout for formatted output
printf("%d\n", answer);  // faster than cout << answer << "\n";
```

### Data Structure Optimizations

```cpp
// Prefer array over vector when size is known
int a[200005];  // faster than vector<int> a(n)

// Prefer array over map/unordered_map
int cnt[1000005] = {};  // faster than map<int,int> .// Reserve vector capacity
vector<int> v;
v.reserve(n);  // avoid reallocations

// Use emplace_back instead of push_back for objects
v.emplace_back(x, y);  // construct in-place

// Sort comparison: pass by const reference
sort(a.begin(), a.end(), [](const auto& x, const auto& y) {
    return x.first < y.first;
});
```

### Algorithm-Level Optimizations

```cpp
// Binary search instead of linear search: O(N) → O(log N)
// Two pointers instead of nested loops: O(N^2) → O(N)
// Prefix sums instead of range queries: O(NQ) → O(N+Q)
// Sparse table instead of segment tree for static RMQ: lower constant

// Avoid unnecessary copies
for (const auto& x : vec) { ... }  // reference, not copy
// Not: for (auto x : vec) { ... } // copies each element

// Short-circuit evaluation
if (expensive_check && cheap_check) ...  // BAD
if (cheap_check && expensive_check) ...  // GOOD

// Bitset for boolean arrays (64x speedup for AND/OR/COUNT)
bitset<100005> visited;
// Instead of: bool visited[100005];
```

### Constant Factor Tricks

```cpp
// Cache-friendly access (iterate by rows, not columns)
// BAD: for (j) for (i) a[i][j]  -- cache miss every access
// GOOD: for (i) for (j) a[i][j]  -- sequential access

// __builtin functions (single CPU instruction)
__builtin_popcount(x);  // count bits
__builtin_clz(x);       // leading zeros (for log2)
__builtin_ctz(x);       // trailing zeros

// Pragmas for auto-vectorization (GCC)
#pragma GCC optimize("O2,unroll-loops")
#pragma GCC target("avx2,bmi,bmi2,popcnt")
```

---

## Common Bug Patterns

### The Bug Hall of Fame

```cpp
// 1. Integer overflow
int n = 200000;
int result = n * n;  // OVERFLOW! 4e10 > INT_MAX
long long result = (long long)n * n;  // correct

// 2. Off-by-one in binary search
// Wrong: while (lo < hi) with hi = n (should be n-1, or use lo <= hi)
int lo = 0, hi = n - 1;
while (lo <= hi) {
    int mid = lo + (hi - lo) / 2;  // avoid overflow in (lo+hi)/2
    if (check(mid)) hi = mid - 1;
    else lo = mid + 1;
}

// 3. Uninitialized variables / arrays
memset(dp, -1, sizeof dp);  // initialize DP array
// Or: fill(dp, dp + n, -1);

// 4. Wrong modular arithmetic
int ans = (a - b) % MOD;      // can be negative!
int ans = ((a - b) % MOD + MOD) % MOD;  // correct

// 5. Array size too small
int a[100005];  // N up to 1e5? Use 1e5 + 5 for safety
// Common mistake: graph with M edges needs adj list of size N, not M

// 6. skipping to reset between test cases
int t; cin >> t;
while (t--) {
    // MUST reset all global state here
    fill(visited, visited + n + 1, false);
    for (int i = 0; i <= n; i++) adj[i].clear();
}

// 7. Wrong comparison in sort
// Must be strict weak ordering: never return true for equal elements
sort(a, a+n, [](int x, int y) { return x <= y; });  // WRONG (undefined behavior)
sort(a, a+n, [](int x, int y) { return x < y; });   // correct
```

---

## Binary Search on Test Case Size

```
When you have a failing test case that's too large to debug:

1. Verify it actually fails: run and confirm WA/RE
2. Binary search on input size:
   - Take first N/2 elements → still fails? Recurse on smaller
   - Doesn't fail? Take first 3N/4 elements → ...
3. For structured input (trees, graphs):
   - Remove leaf nodes one at a time
   - Remove edges one at a time
   - Check if failure persists after each removal
4. Goal: find the SMALLEST input that triggers the bug
```

```python
# Automated test case minimizer
import subprocess

def run_solution(input_data):
    result = subprocess.run(['./solve'], input=input_data,
                          capture_output=True, text=True, timeout=5)
    return result.stdout.strip()

def run_brute(input_data):
    result = subprocess.run(['./brute'], input=input_data,
                          capture_output=True, text=True, timeout=30)
    return result.stdout.strip()

def minimize(elements):
    """Binary search to find minimal failing subset."""
    if len(elements) <= 1:
        return elements

    mid = len(elements) // 2
    left = elements[:mid]
    right = elements[mid:]

    # Try just left half
    test_input = format_input(left)
    if run_solution(test_input) != run_brute(test_input):
        return minimize(left)

    # Try just right half
    test_input = format_input(right)
    if run_solution(test_input) != run_brute(test_input):
        return minimize(right)

    # Need elements from both halves -- try removing one at a time
    for i in range(len(elements)):
        reduced = elements[:i] + elements[i+1:]
        test_input = format_input(reduced)
        if run_solution(test_input) != run_brute(test_input):
            return minimize(reduced)

    return elements  # all elements needed
```

---

## Debugging Under Time Pressure

### The 5-Minute Rule

```
In a contest, if your solution gets WA:

Minute 0-1: Re-read the problem statement carefully
  - Did you misunderstand the output format?
  - Are there constraints you missed?
  - 1-indexed vs 0-indexed?

Minute 1-3: Check the obvious
  - Integer overflow (use long long everywhere if unsure)
  - Array bounds (add +5 to all array sizes)
  - Uninitialized variables
  - Multiple test cases: are you resetting state?

Minute 3-5: Run stress test
  - Write 30-second brute force
  - Write 30-second generator
  - Run 10,000 small cases
  - If mismatch found, print minimal failing case and debug

If no bug found in 5 minutes: MOVE TO ANOTHER PROBLEM
Come back with fresh eyes later.
```

### Pre-Contest Debugging Template

```cpp
// template.cpp -- compile with: g++ -O2 -Wall -Wextra -DLOCAL
#include <bits/stdc++.h>
using namespace std;

#ifdef LOCAL
#define dbg(x) cerr << #x << " = " << (x) << endl
#define dbgv(v) { cerr << #v << " = ["; for(auto& x:v) cerr << x << ","; cerr << "]" << endl; }
#else
#define dbg(x)
#define dbgv(v)
#endif

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    // Solution here
    // Use dbg(variable) freely -- stripped in submission

    return 0;
}
```



## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to competitive debugging master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Competitive Debugging Master Analysis

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

**Input:** "Help me with competitive debugging master for my current situation"

**Output:**

Based on your situation, here is a structured approach to competitive debugging master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
