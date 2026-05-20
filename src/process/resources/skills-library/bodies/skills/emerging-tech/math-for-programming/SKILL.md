---
name: math-for-programming
description: |
  Guides essential mathematics for competitive programming including number theory, combinatorics, computational geometry, modular arithmetic, and probability
  Use when the user asks about math for programming, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of math for programming or requires a different specialized skill.
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

# Math for Programming

You are an expert competitive programming math coach. You guide programmers through the essential mathematical foundations needed for contests: number theory, modular arithmetic, combinatorics, computational geometry, probability, and linear algebra, with efficient implementations and proofs of correctness.


## When to Use

**Use this skill when:**
- User asks about math for programming techniques or best practices
- User needs guidance on math for programming concepts
- User wants to implement or improve their approach to math for programming

**Do NOT use when:**
- The request falls outside the scope of math for programming
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Modular Arithmetic

### Core Operations

```cpp
const int MOD = 1e9 + 7;

long long mod(long long x) {
    return ((x % MOD) + MOD) % MOD;  // Handle negative
}

long long add(long long a, long long b) {
    return (a + b) % MOD;
}

long long sub(long long a, long long b) {
    return ((a - b) % MOD + MOD) % MOD;
}

long long mul(long long a, long long b) {
    return (a % MOD) * (b % MOD) % MOD;
}
```

### Modular Exponentiation

```cpp
// a^b mod m using binary exponentiation
// Time: O(log b)
long long power(long long a, long long b, long long m = MOD) {
    long long result = 1;
    a %= m;
    while (b > 0) {
        if (b & 1) result = result * a % m;
        a = a * a % m;
        b >>= 1;
    }
    return result;
}
```

### Modular Inverse

```cpp
// Modular inverse using Fermat's little theorem (p must be prime)
// a^(-1) = a^(p-2) mod p
// Time: O(log p)
long long modInverse(long long a, long long p = MOD) {
    return power(a, p - 2, p);
}

// Modular division: a / b mod p
long long modDiv(long long a, long long b, long long p = MOD) {
    return mul(a, modInverse(b, p));
}

// Extended Euclidean Algorithm (works for non-prime modulus)
// Returns gcd(a, b), and sets x, y such that a*x + b*y = gcd(a, b)
long long extgcd(long long a, long long b, long long &x, long long &y) {
    if (b == 0) {
        x = 1; y = 0;
        return a;
    }
    long long x1, y1;
    long long g = extgcd(b, a % b, x1, y1);
    x = y1;
    y = x1 - (a / b) * y1;
    return g;
}
```

## Number Theory

### Sieve of Eratosthenes

```cpp
// Find all primes up to n
// Time: O(n log log n), Space: O(n)
vector<bool> sieve(int n) {
    vector<bool> is_prime(n + 1, true);
    is_prime[0] = is_prime[1] = false;
    for (int i = 2; (long long)i * i <= n; i++) {
        if (is_prime[i]) {
            for (int j = i * i; j <= n; j += i)
                is_prime[j] = false;
        }
    }
    return is_prime;
}

// Linear sieve: also finds smallest prime factor
// Time: O(n), Space: O(n)
vector<int> linearSieve(int n) {
    vector<int> spf(n + 1, 0);  // smallest prime factor
    vector<int> primes;
    for (int i = 2; i <= n; i++) {
        if (spf[i] == 0) {
            spf[i] = i;
            primes.push_back(i);
        }
        for (int p : primes) {
            if (p > spf[i] || (long long)i * p > n) break;
            spf[i * p] = p;
        }
    }
    return spf;
}
```

### Prime Factorization

```cpp
// Factorize n into prime factors
// Time: O(sqrt(n))
map<int, int> factorize(int n) {
    map<int, int> factors;
    for (int d = 2; (long long)d * d <= n; d++) {
        while (n % d == 0) {
            factors[d]++;
            n /= d;
        }
    }
    if (n > 1) factors[n]++;
    return factors;
}

// Factorize using precomputed SPF (smallest prime factor)
// Time: O(log n) per factorization
map<int, int> factorizeSPF(int n, vector<int>& spf) {
    map<int, int> factors;
    while (n > 1) {
        factors[spf[n]]++;
        n /= spf[n];
    }
    return factors;
}
```

### GCD and LCM

```cpp
// GCD using built-in
long long gcd(long long a, long long b) {
    return __gcd(a, b);  // Or use std::gcd in C++17
}

long long lcm(long long a, long long b) {
    return a / gcd(a, b) * b;  // Divide first to prevent overflow
}
```

### Euler's Totient Function

```cpp
// phi(n) = count of integers in [1,n] coprime to n
// Time: O(sqrt(n))
int eulerTotient(int n) {
    int result = n;
    for (int p = 2; (long long)p * p <= n; p++) {
        if (n % p == 0) {
            while (n % p == 0) n /= p;
            result -= result / p;
        }
    }
    if (n > 1) result -= result / n;
    return result;
}

// Sieve for all totient values up to n
// Time: O(n log log n)
vector<int> totientSieve(int n) {
    vector<int> phi(n + 1);
    iota(phi.begin(), phi.end(), 0);
    for (int i = 2; i <= n; i++) {
        if (phi[i] == i) {  // i is prime
            for (int j = i; j <= n; j += i)
                phi[j] -= phi[j] / i;
        }
    }
    return phi;
}
```

## Combinatorics

### Precomputed Factorials and nCr

```cpp
// Precompute factorials for fast nCr
// Build: O(n), Query: O(1)

const int MAXN = 2e5 + 5;
long long fact[MAXN], inv_fact[MAXN];

void precompute_factorials() {
    fact[0] = 1;
    for (int i = 1; i < MAXN; i++)
        fact[i] = fact[i-1] * i % MOD;

    inv_fact[MAXN-1] = power(fact[MAXN-1], MOD - 2);
    for (int i = MAXN - 2; i >= 0; i--)
        inv_fact[i] = inv_fact[i+1] * (i+1) % MOD;
}

long long nCr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] % MOD * inv_fact[r] % MOD * inv_fact[n-r] % MOD;
}

long long nPr(int n, int r) {
    if (r < 0 || r > n) return 0;
    return fact[n] % MOD * inv_fact[n-r] % MOD;
}
```

### Combinatorial Identities

```
Key identities:
C(n, r) = C(n, n-r)                    (Symmetry)
C(n, r) = C(n-1, r-1) + C(n-1, r)     (Pascal's rule)
C(n, 0) + C(n, 1) + ... + C(n, n) = 2^n
C(n+1, r+1) = sum_{i=r}^{n} C(i, r)   (Hockey stick)

Catalan numbers: C_n = C(2n, n) / (n+1)
  - Valid parenthesizations
  - Binary trees with n nodes
  - Monotonic lattice paths

Stars and bars: Ways to put n indistinguishable balls
in k distinguishable boxes = C(n+k-1, k-1)

Inclusion-Exclusion:
|A1 ∪ A2 ∪ ... ∪ An| = Σ|Ai| - Σ|Ai∩Aj| + Σ|Ai∩Aj∩Ak| - ...
```

### Derangements

```cpp
// D(n) = number of permutations with no fixed points
// D(n) = (n-1) * (D(n-1) + D(n-2))
// Time: O(n)
long long derangements(int n) {
    if (n == 0) return 1;
    if (n == 1) return 0;
    vector<long long> d(n + 1);
    d[0] = 1; d[1] = 0;
    for (int i = 2; i <= n; i++)
        d[i] = (i - 1) * (d[i-1] + d[i-2]) % MOD;
    return d[n];
}
```

## Computational Geometry

### Point and Vector Operations

```cpp
using ld = long double;
const ld EPS = 1e-9;

struct Point {
    ld x, y;
    Point(ld x = 0, ld y = 0) : x(x), y(y) {}

    Point operator+(const Point& p) const { return {x + p.x, y + p.y}; }
    Point operator-(const Point& p) const { return {x - p.x, y - p.y}; }
    Point operator*(ld t) const { return {x * t, y * t}; }
    ld dot(const Point& p) const { return x * p.x + y * p.y; }
    ld cross(const Point& p) const { return x * p.y - y * p.x; }
    ld norm() const { return sqrt(x*x + y*y); }
    ld norm2() const { return x*x + y*y; }

    bool operator<(const Point& p) const {
        if (abs(x - p.x) > EPS) return x < p.x;
        return y < p.y;
    }
};

// Cross product of vectors OA and OB (positive = counterclockwise)
ld cross(Point O, Point A, Point B) {
    return (A - O).cross(B - O);
}

// Distance from point P to line through A and B
ld pointToLine(Point P, Point A, Point B) {
    return abs(cross(A, B, P)) / (B - A).norm();
}

// Distance from point P to segment AB
ld pointToSegment(Point P, Point A, Point B) {
    if ((B - A).dot(P - A) < EPS) return (P - A).norm();
    if ((A - B).dot(P - B) < EPS) return (P - B).norm();
    return pointToLine(P, A, B);
}
```

### Convex Hull

```cpp
// Andrew's monotone chain algorithm
// Time: O(n log n), Space: O(n)
vector<Point> convexHull(vector<Point> pts) {
    int n = pts.size();
    if (n < 3) return pts;
    sort(pts.begin(), pts.end());

    vector<Point> hull;

    // Lower hull
    for (auto& p : pts) {
        while (hull.size() >= 2 &&
               cross(hull[hull.size()-2], hull[hull.size()-1], p) <= 0)
            hull.pop_back();
        hull.push_back(p);
    }

    // Upper hull
    int lower_size = hull.size();
    for (int i = n - 2; i >= 0; i--) {
        while ((int)hull.size() > lower_size &&
               cross(hull[hull.size()-2], hull[hull.size()-1], pts[i]) <= 0)
            hull.pop_back();
        hull.push_back(pts[i]);
    }

    hull.pop_back();  // Remove duplicate of first point
    return hull;
}
```

### Polygon Area (Shoelace Formula)

```cpp
// Signed area of polygon (positive if counterclockwise)
// Time: O(n)
ld polygonArea(vector<Point>& pts) {
    ld area = 0;
    int n = pts.size();
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        area += pts[i].cross(pts[j]);
    }
    return area / 2.0;
}
```

## Matrix Exponentiation

### Fast Matrix Power

```cpp
// Matrix multiplication mod p
// Time: O(n^3) per multiplication, O(n^3 log k) for power
using Matrix = vector<vector<long long>>;

Matrix matmul(const Matrix& A, const Matrix& B) {
    int n = A.size();
    Matrix C(n, vector<long long>(n, 0));
    for (int i = 0; i < n; i++)
        for (int k = 0; k < n; k++)
            if (A[i][k])
                for (int j = 0; j < n; j++)
                    C[i][j] = (C[i][j] + A[i][k] * B[k][j]) % MOD;
    return C;
}

Matrix matpow(Matrix A, long long p) {
    int n = A.size();
    Matrix result(n, vector<long long>(n, 0));
    for (int i = 0; i < n; i++) result[i][i] = 1;  // Identity

    while (p > 0) {
        if (p & 1) result = matmul(result, A);
        A = matmul(A, A);
        p >>= 1;
    }
    return result;
}

// Example: Fibonacci in O(log n)
long long fibonacci(long long n) {
    if (n <= 1) return n;
    Matrix M = {{1, 1}, {1, 0}};
    Matrix result = matpow(M, n - 1);
    return result[0][0];
}
```

## Probability and Expected Value

### Linearity of Expectation

```
E[X + Y] = E[X] + E[Y]  (always, even if dependent)

Indicator variable trick:
E[count of events] = sum of P(each event)

Example: Expected number of fixed points in random permutation
E = sum_{i=1}^{n} P(pi(i) = i) = n * (1/n) = 1
```

### Geometric Distribution

```
X = number of trials until first success (p = success probability)
E[X] = 1/p
Var[X] = (1-p) / p^2

Example: Expected coin flips to get heads = 1/0.5 = 2
```

## Common Pitfalls

| Mistake | Impact | Fix |
|---------|--------|-----|
| Overflow in a * b % MOD | Wrong answer | Cast to long long before multiply |
| Not handling negative modulo | Wrong answer | Use ((x % MOD) + MOD) % MOD |
| Wrong inverse for composite modulus | Wrong answer | Use extended GCD, not Fermat |
| Floating point comparison | Unstable results | Use integer geometry when possible |
| Factorial overflow | Wrong answer | Precompute mod factorials |
| Off-by-one in nCr | Wrong answer | Check r <= n and r >= 0 |
| Division before multiplication | Precision loss (integers) | Multiply first, divide last |
| skipping modular inverse for division | Wrong answer | Never use / for modular division |

## Exercises

1. **Modular Inverse**: Compute C(10^6, 5 * 10^5) mod (10^9 + 7) using precomputed factorials
2. **Prime Counting**: Count primes up to 10^7 using a linear sieve, also find the sum of all primes
3. **Derangement Counting**: Find the number of permutations of n elements with exactly k fixed points
4. **Convex Hull Area**: Given n points, find the area of their convex hull
5. **Matrix Fibonacci**: Compute the n-th term of a linear recurrence a(n) = 2*a(n-1) + 3*a(n-2) for n up to 10^18


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to math for programming
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Math For Programming Analysis

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

**Input:** "Help me with math for programming for my current situation"

**Output:**

Based on your situation, here is a structured approach to math for programming:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
