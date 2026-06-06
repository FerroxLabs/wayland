---
name: string-algorithm-specialist
description: |
  Guides string algorithm mastery including KMP pattern matching, suffix arrays, string hashing, trie-based matching, and Z-algorithm with complexity analysis
  Use when the user asks about string algorithm specialist, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of string algorithm specialist or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming guide beginner-friendly"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# String Algorithm Specialist

You are an expert competitive programming coach specializing in string algorithms. You guide programmers through KMP pattern matching, Z-algorithm, suffix arrays, string hashing, trie-based matching, Aho-Corasick, and Manacher's algorithm, with implementation patterns, complexity proofs, and problem-solving strategies.


## When to Use

**Use this skill when:**
- User asks about string algorithm specialist techniques or best practices
- User needs guidance on string algorithm specialist concepts
- User wants to implement or improve their approach to string algorithm specialist

**Do NOT use when:**
- The request falls outside the scope of string algorithm specialist
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Algorithm Selection Guide

| Problem | Algorithm | Time | Space |
|---------|-----------|------|-------|
| Single pattern search | KMP / Z-algorithm | O(n + m) | O(m) |
| Multiple pattern search | Aho-Corasick | O(n + m + matches) | O(m * SIGMA) |
| Substring equality | String hashing | O(1) per query | O(n) |
| All suffixes sorted | Suffix array | O(n log n) | O(n) |
| Longest palindrome | Manacher's | O(n) | O(n) |
| Prefix matching | Trie | O(L) per query | O(total_chars) |
| Longest repeated substring | Suffix array + LCP | O(n log n) | O(n) |

## KMP (Knuth-Morris-Pratt)

### Failure Function (Prefix Function)

```cpp
// Compute prefix function (failure function)
// pi[i] = length of longest proper prefix of s[0..i] that is also a suffix
// Time: O(n), Space: O(n)

vector<int> computePrefix(const string& s) {
    int n = s.size();
    vector<int> pi(n, 0);

    for (int i = 1; i < n; i++) {
        int j = pi[i - 1];
        while (j > 0 && s[i] != s[j])
            j = pi[j - 1];
        if (s[i] == s[j])
            j++;
        pi[i] = j;
    }
    return pi;
}
```

### KMP Pattern Matching

```cpp
// Find all occurrences of pattern in text
// Time: O(n + m), Space: O(m)
// Returns starting indices of all matches

vector<int> kmpSearch(const string& text, const string& pattern) {
    string combined = pattern + "#" + text;  // '#' not in alphabet
    vector<int> pi = computePrefix(combined);
    vector<int> matches;

    int m = pattern.size();
    for (int i = m + 1; i < (int)combined.size(); i++) {
        if (pi[i] == m) {
            matches.push_back(i - 2 * m);  // Start index in text
        }
    }
    return matches;
}

```

### KMP Applications

```cpp
// 1. Minimum period of a string
// Period = n - pi[n-1] if n % period == 0
int minPeriod(const string& s) {
    vector<int> pi = computePrefix(s);
    int n = s.size();
    int period = n - pi[n - 1];
    return (n % period == 0) ? period : n;
}

// 2. Count occurrences of each prefix in the string
// Time: O(n)
vector<int> prefixCounts(const string& s) {
    int n = s.size();
    vector<int> pi = computePrefix(s);
    vector<int> cnt(n + 1, 0);

    for (int i = 0; i < n; i++)
        cnt[pi[i]]++;

    // Propagate: prefix of length pi[i] also appears
    for (int i = n - 1; i > 0; i--)
        cnt[pi[i - 1]] += cnt[i];

    // Each prefix of length i appears at least once (itself)
    for (int i = 1; i <= n; i++)
        cnt[i]++;

    return cnt;
}
```

## Z-Algorithm

### Z-Array Construction

```cpp
// Z[i] = length of longest substring starting at i that matches a prefix of s
// Z[0] is undefined (or set to n)
// Time: O(n), Space: O(n)

vector<int> zFunction(const string& s) {
    int n = s.size();
    vector<int> z(n, 0);
    int l = 0, r = 0;

    for (int i = 1; i < n; i++) {
        if (i < r)
            z[i] = min(r - i, z[i - l]);

        while (i + z[i] < n && s[z[i]] == s[i + z[i]])
            z[i]++;

        if (i + z[i] > r) {
            l = i;
            r = i + z[i];
        }
    }
    return z;
}

// Pattern matching using Z-algorithm
vector<int> zSearch(const string& text, const string& pattern) {
    string combined = pattern + "$" + text;
    vector<int> z = zFunction(combined);
    vector<int> matches;
    int m = pattern.size();

    for (int i = m + 1; i < (int)combined.size(); i++) {
        if (z[i] == m)
            matches.push_back(i - m - 1);
    }
    return matches;
}
```

## String Hashing

### Polynomial Rolling Hash

```cpp
// Double hashing to minimize collisions
// Time: O(n) build, O(1) per query
// Space: O(n)

struct StringHash {
    static const long long MOD1 = 1e9 + 7, MOD2 = 1e9 + 9;
    static const long long BASE1 = 131, BASE2 = 137;

    vector<long long> h1, h2, pw1, pw2;
    int n;

    StringHash(const string& s) : n(s.size()), h1(n+1), h2(n+1),
                                   pw1(n+1), pw2(n+1) {
        pw1[0] = pw2[0] = 1;
        h1[0] = h2[0] = 0;

        for (int i = 0; i < n; i++) {
            h1[i+1] = (h1[i] * BASE1 + s[i]) % MOD1;
            h2[i+1] = (h2[i] * BASE2 + s[i]) % MOD2;
            pw1[i+1] = pw1[i] * BASE1 % MOD1;
            pw2[i+1] = pw2[i] * BASE2 % MOD2;
        }
    }

    // Hash of s[l..r] inclusive (0-indexed)
    pair<long long, long long> query(int l, int r) {
        long long hash1 = (h1[r+1] - h1[l] * pw1[r-l+1] % MOD1 + MOD1 * 2) % MOD1;
        long long hash2 = (h2[r+1] - h2[l] * pw2[r-l+1] % MOD2 + MOD2 * 2) % MOD2;
        return {hash1, hash2};
    }

    // Check if s[l1..r1] == s[l2..r2]
    bool equal(int l1, int r1, int l2, int r2) {
        return query(l1, r1) == query(l2, r2);
    }
};
```

### Hashing Applications

Use `StringHash::query()` to count distinct substrings of length k (insert all `query(i, i+k-1)` into a set). For longest common substring, binary search on length with hash-set intersection: O(n log n).

## Suffix Array

### O(n log n) Construction

```cpp
// Suffix array: sorted array of all suffix starting positions
// Time: O(n log n), Space: O(n)

vector<int> buildSuffixArray(const string& s) {
    int n = s.size();
    vector<int> sa(n), rank_(n), tmp(n);

    // Initial ranking by first character
    iota(sa.begin(), sa.end(), 0);
    for (int i = 0; i < n; i++) rank_[i] = s[i];

    for (int k = 1; k < n; k <<= 1) {
        // Sort by (rank[i], rank[i+k])
        auto cmp = [&](int a, int b) {
            if (rank_[a] != rank_[b]) return rank_[a] < rank_[b];
            int ra = a + k < n ? rank_[a + k] : -1;
            int rb = b + k < n ? rank_[b + k] : -1;
            return ra < rb;
        };
        sort(sa.begin(), sa.end(), cmp);

        // Recompute ranks
        tmp[sa[0]] = 0;
        for (int i = 1; i < n; i++)
            tmp[sa[i]] = tmp[sa[i-1]] + (cmp(sa[i-1], sa[i]) ? 1 : 0);
        rank_ = tmp;

        if (rank_[sa[n-1]] == n - 1) break;  // All ranks unique
    }
    return sa;
}
```

### LCP Array (Kasai's Algorithm)

```cpp
// LCP array: lcp[i] = longest common prefix of sa[i] and sa[i-1]
// Time: O(n), Space: O(n)

vector<int> buildLCP(const string& s, const vector<int>& sa) {
    int n = s.size();
    vector<int> rank_(n), lcp(n, 0);

    for (int i = 0; i < n; i++) rank_[sa[i]] = i;

    int k = 0;
    for (int i = 0; i < n; i++) {
        if (rank_[i] == 0) { k = 0; continue; }
        int j = sa[rank_[i] - 1];
        while (i + k < n && j + k < n && s[i + k] == s[j + k])
            k++;
        lcp[rank_[i]] = k;
        if (k > 0) k--;
    }
    return lcp;
}
```

### Suffix Array Applications

```cpp
// 1. Count distinct substrings
// Total substrings = n*(n+1)/2, subtract LCP overlaps
long long countDistinctSubstrings(const string& s) {
    int n = s.size();
    auto sa = buildSuffixArray(s);
    auto lcp = buildLCP(s, sa);

    long long total = (long long)n * (n + 1) / 2;
    for (int i = 1; i < n; i++)
        total -= lcp[i];
    return total;
}

// 2. Longest repeated substring
string longestRepeated(const string& s) {
    auto sa = buildSuffixArray(s);
    auto lcp = buildLCP(s, sa);

    int maxLcp = 0, idx = 0;
    for (int i = 1; i < (int)s.size(); i++) {
        if (lcp[i] > maxLcp) {
            maxLcp = lcp[i];
            idx = sa[i];
        }
    }
    return s.substr(idx, maxLcp);
}

// 3. Pattern search in suffix array (binary search)
// Time: O(m log n) where m = pattern length
bool searchPattern(const string& text, const vector<int>& sa,
                   const string& pattern) {
    int lo = 0, hi = (int)sa.size() - 1;
    while (lo <= hi) {
        int mid = (lo + hi) / 2;
        string suffix = text.substr(sa[mid], pattern.size());
        if (suffix == pattern) return true;
        if (suffix < pattern) lo = mid + 1;
        else hi = mid - 1;
    }
    return false;
}
```

## Manacher's Algorithm

### Longest Palindromic Substring

```cpp
// Find longest palindrome centered at each position
// Time: O(n), Space: O(n)

vector<int> manacher(const string& s) {
    // Transform: "abc" -> "^#a#b#c#$"
    string t = "^#";
    for (char c : s) { t += c; t += '#'; }
    t += '$';

    int n = t.size();
    vector<int> p(n, 0);
    int c = 0, r = 0;  // Center and right boundary

    for (int i = 1; i < n - 1; i++) {
        int mirror = 2 * c - i;
        if (i < r)
            p[i] = min(r - i, p[mirror]);

        // Expand around center i
        while (t[i + p[i] + 1] == t[i - p[i] - 1])
            p[i]++;

        // Update center if expanded past right boundary
        if (i + p[i] > r) {
            c = i;
            r = i + p[i];
        }
    }

    // p[i] in transformed string = palindrome radius
    // For original string: longest palindrome at original index
    return p;
}

string longestPalindrome(const string& s) {
    auto p = manacher(s);
    int maxLen = 0, center = 0;
    for (int i = 1; i < (int)p.size() - 1; i++) {
        if (p[i] > maxLen) {
            maxLen = p[i];
            center = i;
        }
    }
    // Convert back to original indices
    int start = (center - maxLen - 1) / 2;
    return s.substr(start, maxLen);
}
```

## Aho-Corasick (Multi-Pattern Matching)

```cpp
// Search for multiple patterns simultaneously
// Build: O(sum of pattern lengths * SIGMA)
// Search: O(text length + matches)

struct AhoCorasick {
    static const int SIGMA = 26;

    struct Node {
        int children[SIGMA];
        int fail;       // Failure link
        int output;     // Pattern index (-1 if none)
        int dict_link;  // Dictionary suffix link
        Node() : fail(0), output(-1), dict_link(-1) {
            fill(children, children + SIGMA, -1);
        }
    };

    vector<Node> nodes;

    AhoCorasick() { nodes.emplace_back(); }

    void addPattern(const string& s, int id) {
        int cur = 0;
        for (char c : s) {
            int idx = c - 'a';
            if (nodes[cur].children[idx] == -1) {
                nodes[cur].children[idx] = nodes.size();
                nodes.emplace_back();
            }
            cur = nodes[cur].children[idx];
        }
        nodes[cur].output = id;
    }

    void build() {
        queue<int> q;
        // Initialize children of root
        for (int c = 0; c < SIGMA; c++) {
            if (nodes[0].children[c] == -1)
                nodes[0].children[c] = 0;
            else {
                nodes[nodes[0].children[c]].fail = 0;
                q.push(nodes[0].children[c]);
            }
        }

        while (!q.empty()) {
            int u = q.front(); q.pop();
            for (int c = 0; c < SIGMA; c++) {
                int v = nodes[u].children[c];
                if (v == -1) {
                    nodes[u].children[c] = nodes[nodes[u].fail].children[c];
                } else {
                    nodes[v].fail = nodes[nodes[u].fail].children[c];
                    nodes[v].dict_link = (nodes[nodes[v].fail].output != -1)
                        ? nodes[v].fail
                        : nodes[nodes[v].fail].dict_link;
                    q.push(v);
                }
            }
        }
    }

    // Search text for all patterns, returns {position, pattern_id} pairs
    vector<pair<int,int>> search(const string& text) {
        vector<pair<int,int>> matches;
        int cur = 0;

        for (int i = 0; i < (int)text.size(); i++) {
            cur = nodes[cur].children[text[i] - 'a'];

            // Check all patterns ending at position i
            int temp = cur;
            while (temp > 0) {
                if (nodes[temp].output != -1)
                    matches.push_back({i, nodes[temp].output});
                temp = nodes[temp].dict_link;
            }
        }
        return matches;
    }
};
```

## Complexity Comparison

| Algorithm | Preprocess | Search | Space | Use Case |
|-----------|-----------|--------|-------|----------|
| Brute force | O(1) | O(nm) | O(1) | Very short patterns |
| KMP | O(m) | O(n) | O(m) | Single pattern |
| Z-algorithm | O(n+m) | O(n+m) | O(n+m) | Single pattern, prefix queries |
| Rabin-Karp (hash) | O(n) | O(n) avg | O(n) | Multiple length patterns |
| Suffix array | O(n log n) | O(m log n) | O(n) | Many queries, all substrings |
| Aho-Corasick | O(total_m) | O(n + matches) | O(total_m) | Multiple patterns |
| Manacher | O(n) | N/A | O(n) | Palindromes |

## Common Pitfalls

| Mistake | Impact | Fix |
|---------|--------|-----|
| Hash collision not handled | Wrong answer | Use double hashing or verify matches |
| KMP: wrong failure function loop | Incorrect matching | Check `j = pi[j-1]` not `j = pi[j]` |
| Suffix array: comparing past string end | Undefined behavior | Append sentinel character ('$' < all) |
| Z-array: starting at i=0 | Z[0] = n (useless) | Start Z computation from i=1 |
| Aho-Corasick: missing dict_link | Missed pattern matches | Follow dict suffix links, not just fail |
| Single hash modulus | High collision rate | Use two moduli or verify with actual comparison |

## Exercises

1. **Period Detection**: Given a string, find its minimum period using KMP prefix function
2. **Distinct Substrings**: Count the number of distinct substrings using suffix array + LCP
3. **Multi-Pattern Search**: Given a text and 1000 patterns, find all occurrences using Aho-Corasick
4. **Longest Palindromic Substring**: Find the longest palindrome in a string using Manacher's algorithm
5. **Substring Comparison**: Given a string and Q queries (l1, r1, l2, r2), check if s[l1..r1] == s[l2..r2] using hashing in O(1) per query


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to string algorithm specialist
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## String Algorithm Specialist Analysis

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

**Input:** "Help me with string algorithm specialist for my current situation"

**Output:**

Based on your situation, here is a structured approach to string algorithm specialist:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
