---
name: algorithm-pattern-master
description: |
  Guides mastery of core algorithmic patterns including sliding window, two pointers, binary search, greedy, and backtracking with complexity analysis
  Use when the user asks about algorithm pattern master, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of algorithm pattern master or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming template guide beginner-friendly quick-reference testing analysis"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Algorithm Pattern Master

You are an expert competitive programming coach specializing in algorithmic patterns. You guide programmers through the essential patterns that appear repeatedly in contests and interviews: sliding window, two pointers, binary search on answer, greedy algorithms, and backtracking, with rigorous complexity analysis and implementation techniques.


## When to Use

**Use this skill when:**
- User asks about algorithm pattern master techniques or best practices
- User needs guidance on algorithm pattern master concepts
- User wants to implement or improve their approach to algorithm pattern master

**Do NOT use when:**
- The request falls outside the scope of algorithm pattern master
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Pattern Recognition Framework

### When to Apply Each Pattern

| Problem Signal | Pattern | Complexity |
|---------------|---------|------------|
| Contiguous subarray, max/min length | Sliding Window | O(n) |
| Sorted array, pair finding | Two Pointers | O(n) |
| Monotonic answer, feasibility check | Binary Search on Answer | O(n log V) |
| Local optimal leads to global optimal | Greedy | O(n log n) |
| All combinations, permutations | Backtracking | O(2^n) or O(n!) |
| Range queries, prefix property | Prefix Sums | O(n) build, O(1) query |
| Interval scheduling, overlap | Sorting + Sweep | O(n log n) |

## Sliding Window

### Fixed-Size Window

```cpp
// Maximum sum of subarray of size k
// Time: O(n), Space: O(1)
int maxSumSubarray(vector<int>& arr, int k) {
    int n = arr.size();
    if (n < k) return -1;

    int windowSum = 0;
    for (int i = 0; i < k; i++)
        windowSum += arr[i];

    int maxSum = windowSum;
    for (int i = k; i < n; i++) {
        windowSum += arr[i] - arr[i - k];  // Slide: add right, remove left
        maxSum = max(maxSum, windowSum);
    }
    return maxSum;
}
```

### Variable-Size Window (Shrinkable)

```cpp
// Longest substring with at most k distinct characters
// Time: O(n), Space: O(k)
int longestKDistinct(string& s, int k) {
    unordered_map<char, int> freq;
    int left = 0, maxLen = 0;

    for (int right = 0; right < (int)s.size(); right++) {
        freq[s[right]]++;

        // Shrink window until constraint satisfied
        while ((int)freq.size() > k) {
            freq[s[left]]--;
            if (freq[s[left]] == 0)
                freq.erase(s[left]);
            left++;
        }

        maxLen = max(maxLen, right - left + 1);
    }
    return maxLen;
}
```

### Sliding Window with Monotonic Deque

```cpp
// Maximum in each window of size k
// Time: O(n), Space: O(k)
vector<int> maxSlidingWindow(vector<int>& nums, int k) {
    deque<int> dq;  // Indices, front = max element index
    vector<int> result;

    for (int i = 0; i < (int)nums.size(); i++) {
        // Remove elements outside window
        while (!dq.empty() && dq.front() <= i - k)
            dq.pop_front();

        // Maintain decreasing order: remove smaller elements from back
        while (!dq.empty() && nums[dq.back()] <= nums[i])
            dq.pop_back();

        dq.push_back(i);

        if (i >= k - 1)
            result.push_back(nums[dq.front()]);
    }
    return result;
}
```

## Two Pointers

### Opposite Direction (Two Sum on Sorted)

```cpp
// Two sum in sorted array
// Time: O(n), Space: O(1)
pair<int,int> twoSumSorted(vector<int>& arr, int target) {
    int lo = 0, hi = (int)arr.size() - 1;
    while (lo < hi) {
        int sum = arr[lo] + arr[hi];
        if (sum == target) return {lo, hi};
        else if (sum < target) lo++;
        else hi--;
    }
    return {-1, -1};  // Not found
}
```

### Same Direction (Fast/Slow)

```cpp
// Remove duplicates from sorted array in-place
// Time: O(n), Space: O(1)
int removeDuplicates(vector<int>& nums) {
    if (nums.empty()) return 0;
    int slow = 0;
    for (int fast = 1; fast < (int)nums.size(); fast++) {
        if (nums[fast] != nums[slow]) {
            slow++;
            nums[slow] = nums[fast];
        }
    }
    return slow + 1;
}

// Cycle detection (Floyd's algorithm)
// Time: O(n), Space: O(1)
bool hasCycle(ListNode* head) {
    ListNode *slow = head, *fast = head;
    while (fast && fast->next) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```

### Three Pointers (Three Sum)

```cpp
// Three numbers summing to zero
// Time: O(n^2), Space: O(1) ignoring output
vector<vector<int>> threeSum(vector<int>& nums) {
    sort(nums.begin(), nums.end());
    vector<vector<int>> result;
    int n = nums.size();

    for (int i = 0; i < n - 2; i++) {
        if (i > 0 && nums[i] == nums[i-1]) continue;  // Skip duplicates

        int lo = i + 1, hi = n - 1;
        while (lo < hi) {
            int sum = nums[i] + nums[lo] + nums[hi];
            if (sum == 0) {
                result.push_back({nums[i], nums[lo], nums[hi]});
                while (lo < hi && nums[lo] == nums[lo+1]) lo++;
                while (lo < hi && nums[hi] == nums[hi-1]) hi--;
                lo++; hi--;
            } else if (sum < 0) lo++;
            else hi--;
        }
    }
    return result;
}
```

## Binary Search on Answer

### Template: Minimize Maximum

```cpp
// Binary search on answer: find minimum value that satisfies condition
// Time: O(n * log(search_space))
int binarySearchOnAnswer(vector<int>& arr, int target) {
    int lo = MIN_POSSIBLE_ANSWER;
    int hi = MAX_POSSIBLE_ANSWER;

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (feasible(arr, mid, target)) {
            hi = mid;       // mid works, try smaller
        } else {
            lo = mid + 1;   // mid too small
        }
    }
    return lo;  // Minimum feasible answer
}
```

### Example: Split Array Largest Sum

```cpp
// Split array into m subarrays minimizing the largest subarray sum
// Time: O(n * log(sum - max)), Space: O(1)
int splitArray(vector<int>& nums, int m) {
    // Search space: [max_element, total_sum]
    int lo = *max_element(nums.begin(), nums.end());
    int hi = accumulate(nums.begin(), nums.end(), 0);

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;

        // Can we split into <= m parts with max sum <= mid?
        int parts = 1, currentSum = 0;
        for (int num : nums) {
            if (currentSum + num > mid) {
                parts++;
                currentSum = num;
            } else {
                currentSum += num;
            }
        }

        if (parts <= m)
            hi = mid;   // Feasible, try smaller
        else
            lo = mid + 1;
    }
    return lo;
}
```

### Example: Koko Eating Bananas

```cpp
// Minimum eating speed to finish all piles in h hours
// Time: O(n * log(max_pile)), Space: O(1)
int minEatingSpeed(vector<int>& piles, int h) {
    int lo = 1;
    int hi = *max_element(piles.begin(), piles.end());

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;

        // Calculate hours needed at speed mid
        long long hours = 0;
        for (int p : piles)
            hours += (p + mid - 1) / mid;  // Ceiling division

        if (hours <= h)
            hi = mid;
        else
            lo = mid + 1;
    }
    return lo;
}
```

## Greedy Algorithms

### Activity Selection / Interval Scheduling

```cpp
// Maximum non-overlapping intervals
// Time: O(n log n), Space: O(1)
int maxNonOverlapping(vector<pair<int,int>>& intervals) {
    // Sort by end time (greedy choice: earliest finish first)
    sort(intervals.begin(), intervals.end(),
         [](auto& a, auto& b) { return a.second < b.second; });

    int count = 1;
    int lastEnd = intervals[0].second;

    for (int i = 1; i < (int)intervals.size(); i++) {
        if (intervals[i].first >= lastEnd) {
            count++;
            lastEnd = intervals[i].second;
        }
    }
    return count;
}
```

### Greedy Proof Template

```
To prove a greedy algorithm is optimal:

1. Greedy Choice Property:
   Show that making the locally optimal choice
   does not prevent reaching a globally optimal solution.

   Proof by exchange argument:
   - Take any optimal solution OPT
   - Show you can modify OPT to include the greedy choice
   - The modified solution is still optimal

2. Optimal Substructure:
   Show that after making the greedy choice,
   the remaining subproblem has the same structure
   and can be solved optimally by the same greedy approach.
```

### Jump Game (Greedy Reach)

```cpp
// Can you reach the last index?
// Time: O(n), Space: O(1)
bool canJump(vector<int>& nums) {
    int maxReach = 0;
    for (int i = 0; i <= maxReach && i < (int)nums.size(); i++) {
        maxReach = max(maxReach, i + nums[i]);
    }
    return maxReach >= (int)nums.size() - 1;
}

// Minimum jumps to reach end
// Time: O(n), Space: O(1)
int minJumps(vector<int>& nums) {
    int jumps = 0, currentEnd = 0, farthest = 0;
    for (int i = 0; i < (int)nums.size() - 1; i++) {
        farthest = max(farthest, i + nums[i]);
        if (i == currentEnd) {
            jumps++;
            currentEnd = farthest;
        }
    }
    return jumps;
}
```

## Backtracking

### General Template

```cpp
// Backtracking template
void backtrack(State& state, vector<Result>& results,
               Candidates& candidates, int start) {
    if (isComplete(state)) {
        results.push_back(state);
        return;
    }

    for (int i = start; i < candidates.size(); i++) {
        if (!isValid(state, candidates[i])) continue;

        // Make choice
        state.add(candidates[i]);

        // Recurse
        backtrack(state, results, candidates, i + 1);  // i+1 for combinations
        // backtrack(state, results, candidates, i);    // i for reuse
        // backtrack(state, results, candidates, 0);    // 0 for permutations

        // Undo choice
        state.remove(candidates[i]);
    }
}
```

### Subsets (Power Set)

```cpp
// Generate all subsets
// Time: O(2^n * n), Space: O(n) recursion depth
vector<vector<int>> subsets(vector<int>& nums) {
    vector<vector<int>> result;
    vector<int> current;

    function<void(int)> backtrack = [&](int start) {
        result.push_back(current);
        for (int i = start; i < (int)nums.size(); i++) {
            current.push_back(nums[i]);
            backtrack(i + 1);
            current.pop_back();
        }
    };

    backtrack(0);
    return result;
}
```

### N-Queens

```cpp
// Place N queens on N×N board with no attacks
// Time: O(N!), Space: O(N)
int totalNQueens(int n) {
    int count = 0;
    vector<bool> cols(n), diag1(2*n), diag2(2*n);

    function<void(int)> solve = [&](int row) {
        if (row == n) { count++; return; }

        for (int col = 0; col < n; col++) {
            if (cols[col] || diag1[row-col+n] || diag2[row+col])
                continue;

            cols[col] = diag1[row-col+n] = diag2[row+col] = true;
            solve(row + 1);
            cols[col] = diag1[row-col+n] = diag2[row+col] = false;
        }
    };

    solve(0);
    return count;
}
```

## Prefix Sums

### 1D and 2D Prefix Sums

```cpp
// 1D: Range sum query O(1) after O(n) preprocessing
class PrefixSum1D {
    vector<long long> prefix;
public:
    PrefixSum1D(vector<int>& arr) {
        int n = arr.size();
        prefix.resize(n + 1, 0);
        for (int i = 0; i < n; i++)
            prefix[i+1] = prefix[i] + arr[i];
    }

    // Sum of arr[l..r] inclusive
    long long query(int l, int r) {
        return prefix[r+1] - prefix[l];
    }
};

// 2D: Submatrix sum query O(1) after O(mn) preprocessing
class PrefixSum2D {
    vector<vector<long long>> prefix;
public:
    PrefixSum2D(vector<vector<int>>& mat) {
        int m = mat.size(), n = mat[0].size();
        prefix.assign(m+1, vector<long long>(n+1, 0));
        for (int i = 1; i <= m; i++)
            for (int j = 1; j <= n; j++)
                prefix[i][j] = mat[i-1][j-1] + prefix[i-1][j]
                              + prefix[i][j-1] - prefix[i-1][j-1];
    }

    // Sum of submatrix (r1,c1) to (r2,c2) inclusive
    long long query(int r1, int c1, int r2, int c2) {
        return prefix[r2+1][c2+1] - prefix[r1][c2+1]
             - prefix[r2+1][c1] + prefix[r1][c1];
    }
};
```

## Complexity Analysis Quick Reference

| Pattern | Time | Space | Key Insight |
|---------|------|-------|-------------|
| Sliding window (fixed) | O(n) | O(1) | Each element enters/leaves once |
| Sliding window (variable) | O(n) | O(k) | Left pointer never moves backward |
| Two pointers (sorted) | O(n) | O(1) | Total pointer moves = O(n) |
| Binary search on answer | O(n log V) | O(1) | V = search space range |
| Greedy + sort | O(n log n) | O(1) | Sort dominates |
| Backtracking (subsets) | O(2^n) | O(n) | Decision tree has 2^n leaves |
| Backtracking (permutations) | O(n!) | O(n) | n choices, then n-1, then n-2... |
| Prefix sums (1D) | O(n) / O(1) | O(n) | Build once, query O(1) |
| Prefix sums (2D) | O(mn) / O(1) | O(mn) | Inclusion-exclusion principle |

## Common Pitfalls

| Mistake | Impact | Fix |
|---------|--------|-----|
| Off-by-one in binary search | Infinite loop or wrong answer | Test with 1 and 2 element cases |
| Integer overflow in binary search | Undefined behavior | Use `lo + (hi - lo) / 2` |
| Not handling duplicates in two pointers | Duplicate triplets/pairs | Skip equal adjacent elements |
| Greedy without proof | Wrong answer on edge cases | Verify with exchange argument |
| Shrinking window when non-shrinkable needed | Incorrect answer | Identify which variant applies |
| Missing base case in backtracking | Infinite recursion | Always check termination first |

## Exercises

1. **Sliding Window**: Find the minimum window substring containing all characters of a target string
2. **Two Pointers**: Given a sorted array, find the number of pairs with difference exactly k
3. **Binary Search on Answer**: Given n books with pages[i], distribute among k students minimizing maximum pages
4. **Greedy**: Given arrival/departure times, find the minimum number of platforms needed at a station
5. **Backtracking**: Generate all valid parentheses combinations for n pairs


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to algorithm pattern master
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Algorithm Pattern Master Analysis

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

**Input:** "Help me with algorithm pattern master for my current situation"

**Output:**

Based on your situation, here is a structured approach to algorithm pattern master:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
