---
name: computational-geometry-solver
description: |
  Competitive programming computational geometry expertise covering convex hull algorithms, line segment intersection, sweep line techniques, polygon operations, Voronoi diagrams, closest pair, half-plane intersection, and robust geometric predicates with practical contest implementations.
  Use when the user asks about computational geometry solver, related techniques, best practices, or needs guidance in this domain.
  Do NOT use when the request is outside the scope of computational geometry solver or requires a different specialized skill.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "advanced competitive-programming beginner-friendly testing"
  category: "emerging-tech"
  subcategory: "competitive-programming"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Computational Geometry Solver

You are an expert competitive programmer specializing in computational geometry. You implement geometrically correct, numerically robust solutions for contest problems involving points, lines, polygons, convex hulls, sweep line algorithms, and spatial queries.


## When to Use

**Use this skill when:**
- User asks about computational geometry solver techniques or best practices
- User needs guidance on computational geometry solver concepts
- User wants to implement or improve their approach to computational geometry solver

**Do NOT use when:**
- The request falls outside the scope of computational geometry solver
- User needs a different specialized skill for their specific situation
- The topic requires professional consultation beyond general guidance

## Questions to Ask the User First

1. **Problem statement:** Share the exact problem description.
2. **Coordinate constraints:** Integer or floating-point coordinates? What range?
3. **Precision requirements:** If floating-point, what epsilon or precision is needed?
4. **Time limit and N:** How many points/segments? What is the time limit?
5. **Specific technique:** Do you know which algorithm is needed, or need help identifying it?

---

## Geometric Primitives

### Point and Vector Operations

```cpp
typedef long long ll;
typedef double ld;

struct Point {
    ll x, y;
    Point(ll x = 0, ll y = 0) : x(x), y(y) {}
    Point operator+(const Point& p) const { return {x + p.x, y + p.y}; }
    Point operator-(const Point& p) const { return {x - p.x, y - p.y}; }
    Point operator*(ll t) const { return {x * t, y * t}; }
    ll dot(const Point& p) const { return x * p.x + y * p.y; }
    ll cross(const Point& p) const { return x * p.y - y * p.x; }
    ll norm2() const { return x * x + y * y; }
    ld norm() const { return sqrtl(norm2()); }
    bool operator<(const Point& p) const {
        return x < p.x || (x == p.x && y < p.y);
    }
    bool operator==(const Point& p) const { return x == p.x && y == p.y; }
};

// Cross product of vectors (B-A) and (C-A)
// > 0: C is left of AB (counter-clockwise)
// = 0: collinear
// < 0: C is right of AB (clockwise)
ll cross(Point A, Point B, Point C) {
    return (B - A).cross(C - A);
}

// Signed area of triangle (2x actual area for integer coords)
ll signedArea2(Point A, Point B, Point C) {
    return cross(A, B, C);
}
```

### Orientation and Collinearity

```cpp
// Returns: +1 (CCW), -1 (CW), 0 (collinear)
int orientation(Point A, Point B, Point C) {
    ll v = cross(A, B, C);
    if (v > 0) return 1;   // counter-clockwise
    if (v < 0) return -1;  // clockwise
    return 0;               // collinear
}

// Check if point P lies on segment AB
bool onSegment(Point A, Point B, Point P) {
    return orientation(A, B, P) == 0 &&
           min(A.x, B.x) <= P.x && P.x <= max(A.x, B.x) &&
           min(A.y, B.y) <= P.y && P.y <= max(A.y, B.y);
}
```

---

## Line Segment Intersection

### Segment-Segment Intersection Test

```cpp
// Do segments AB and CD intersect?
bool segmentsIntersect(Point A, Point B, Point C, Point D) {
    int d1 = orientation(C, D, A);
    int d2 = orientation(C, D, B);
    int d3 = orientation(A, B, C);
    int d4 = orientation(A, B, D);

    // General case: segments straddle each other
    if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
        ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0)))
        return true;

    // Collinear cases
    if (d1 == 0 && onSegment(C, D, A)) return true;
    if (d2 == 0 && onSegment(C, D, B)) return true;
    if (d3 == 0 && onSegment(A, B, C)) return true;
    if (d4 == 0 && onSegment(A, B, D)) return true;

    return false;
}
```

### Intersection Point (Floating Point)

```cpp
// Find intersection point of lines through AB and CD
// Returns false if parallel
bool lineIntersection(Point A, Point B, Point C, Point D, Point& result) {
    ld a1 = B.y - A.y, b1 = A.x - B.x;
    ld c1 = a1 * A.x + b1 * A.y;
    ld a2 = D.y - C.y, b2 = C.x - D.x;
    ld c2 = a2 * C.x + b2 * C.y;
    ld det = a1 * b2 - a2 * b1;
    if (abs(det) < 1e-9) return false;  // parallel
    result.x = (c1 * b2 - c2 * b1) / det;
    result.y = (a1 * c2 - a2 * c1) / det;
    return true;
}
```

---

## Convex Hull

### Andrew's Monotone Chain (O(N log N))

```cpp
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
    hull.pop_back();  // remove last point (duplicate of first)
    return hull;
}

// Note: Use < 0 instead of <= 0 to keep collinear points on hull edges
```

### Convex Hull Applications

```cpp
// Area of convex polygon (Shoelace formula)
ld polygonArea(vector<Point>& poly) {
    ll area2 = 0;
    int n = poly.size();
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        area2 += poly[i].cross(poly[j]);
    }
    return abs(area2) / 2.0;
}

// Rotating calipers: diameter of convex polygon (furthest pair)
// O(N) after convex hull
ld convexDiameter(vector<Point>& hull) {
    int n = hull.size();
    if (n <= 1) return 0;
    if (n == 2) return (hull[0] - hull[1]).norm();

    int j = 1;
    ld maxDist = 0;
    for (int i = 0; i < n; i++) {
        Point edge = hull[(i+1)%n] - hull[i];
        while (edge.cross(hull[(j+1)%n] - hull[j]) > 0)
            j = (j + 1) % n;
        maxDist = max(maxDist, (hull[i] - hull[j]).norm());
        maxDist = max(maxDist, (hull[(i+1)%n] - hull[j]).norm());
    }
    return maxDist;
}

// Point in convex polygon: O(log N) with binary search
bool inConvexPolygon(vector<Point>& hull, Point P) {
    int n = hull.size();
    if (n < 3) return false;

    // Check if P is on the correct side of first and last edges
    if (cross(hull[0], hull[1], P) < 0) return false;
    if (cross(hull[0], hull[n-1], P) > 0) return false;

    // Binary search for the sector containing P
    int lo = 1, hi = n - 1;
    while (hi - lo > 1) {
        int mid = (lo + hi) / 2;
        if (cross(hull[0], hull[mid], P) >= 0) lo = mid;
        else hi = mid;
    }
    return cross(hull[lo], hull[hi], P) >= 0;
}
```

---

## Sweep Line Algorithms

### Line Sweep for Closest Pair of Points

```cpp
// O(N log N) closest pair using sweep line
ld closestPair(vector<Point>& pts) {
    sort(pts.begin(), pts.end());  // sort by x

    set<pair<ll,ll>> active;  // sorted by (y, x) for sweep
    ld best = 1e18;
    int left = 0;

    for (int i = 0; i < (int)pts.size(); i++) {
        ld d = best;
        // Remove points too far left
        while (pts[i].x - pts[left].x > d) {
            active.erase({pts[left].y, pts[left].x});
            left++;
        }

        // Check nearby points in active set (within y range)
        auto lo = active.lower_bound({(ll)(pts[i].y - d), LLONG_MIN});
        auto hi = active.upper_bound({(ll)(pts[i].y + d), LLONG_MAX});

        for (auto it = lo; it != hi; it++) {
            ld dist = (Point(it->second, it->first) - pts[i]).norm();
            best = min(best, dist);
        }
        active.insert({pts[i].y, pts[i].x});
    }
    return best;
}
```

### Sweep Line for Segment Intersections (Bentley-Ottmann Simplified)

```
Algorithm overview:
1. Create events for each segment: LEFT endpoint and RIGHT endpoint
2. Sort events by x-coordinate
3. Maintain a balanced BST of active segments ordered by y at sweep line
4. When inserting a segment, check intersection with neighbors above/below
5. When removing a segment, check if its former neighbors now intersect

Simplified for contest use:
- If you just need to count/detect any intersection among N segments
- Use the sweep + neighbor check approach
- For all intersections: full Bentley-Ottmann with intersection events
```

### Sweep Line for Area of Union of Rectangles

```cpp
// Coordinate compression + sweep line + segment tree
// Events: rectangle left edges (add) and right edges (remove)
// Segment tree tracks covered length along y-axis

struct Event {
    int x, y1, y2, type;  // type: +1 (open), -1 (close)
};

// Segment tree node tracks:
// count: number of full covers
// covered_length: total y-length currently covered
ll areaUnionRectangles(vector<Event>& events, vector<int>& ys) {
    sort(events.begin(), events.end(), [](auto& a, auto& b) {
        return a.x < b.x || (a.x == b.x && a.type > b.type);
    });

    // Build segment tree on compressed y-coordinates
    // For each event, update segment tree and compute covered y-length
    // Area += covered_length * (next_x - current_x)
    // ... (segment tree implementation)
}
```

---

## Polygon Operations

### Point in Polygon (General, O(N))

```cpp
// Winding number method (works for all simple polygons)
// Returns true if point P is inside polygon
bool pointInPolygon(vector<Point>& poly, Point P) {
    int n = poly.size();
    int winding = 0;

    for (int i = 0; i < n; i++) {
        Point A = poly[i], B = poly[(i+1)%n];
        if (A.y <= P.y) {
            if (B.y > P.y && cross(A, B, P) > 0) winding++;
        } else {
            if (B.y <= P.y && cross(A, B, P) < 0) winding--;
        }
    }
    return winding != 0;
}

// Ray casting (simpler, same result for simple polygons)
bool pointInPolygonRayCast(vector<Point>& poly, Point P) {
    int n = poly.size();
    bool inside = false;
    for (int i = 0, j = n - 1; i < n; j = i++) {
        if ((poly[i].y > P.y) != (poly[j].y > P.y) &&
            P.x < (poly[j].x - poly[i].x) * (P.y - poly[i].y) /
                   (ld)(poly[j].y - poly[i].y) + poly[i].x)
            inside = !inside;
    }
    return inside;
}
```

### Polygon Area and Centroid

```cpp
// Signed area (positive if CCW, negative if CW)
ld signedArea(vector<Point>& poly) {
    ll area2 = 0;
    int n = poly.size();
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        area2 += poly[i].x * (ll)poly[j].y - poly[j].x * (ll)poly[i].y;
    }
    return area2 / 2.0;
}

// Centroid of simple polygon
Point centroid(vector<Point>& poly) {
    int n = poly.size();
    ld cx = 0, cy = 0, area = 0;
    for (int i = 0; i < n; i++) {
        int j = (i + 1) % n;
        ld cross = poly[i].x * (ld)poly[j].y - poly[j].x * (ld)poly[i].y;
        cx += (poly[i].x + poly[j].x) * cross;
        cy += (poly[i].y + poly[j].y) * cross;
        area += cross;
    }
    area /= 2;
    return {(ll)(cx / (6 * area)), (ll)(cy / (6 * area))};
}
```

---

## Half-Plane Intersection

```cpp
// Find intersection of half-planes (convex polygon result)
// Each half-plane: left side of directed line from A to B
// O(N log N) using sorting + incremental construction

struct HalfPlane {
    Point p, d;  // point on line and direction vector
    ld angle;

    HalfPlane() {}
    HalfPlane(Point a, Point b) : p(a), d(b - a) {
        angle = atan2l(d.y, d.x);
    }
    bool operator<(const HalfPlane& h) const { return angle < h.angle; }
};

// Returns the convex polygon that is the intersection of all half-planes
// Empty vector if infeasible
vector<Point> halfPlaneIntersection(vector<HalfPlane>& planes) {
    sort(planes.begin(), planes.end());
    // Use deque-based incremental algorithm
    // Add planes one by one, maintaining valid intersection
    // Remove from front/back of deque when new plane makes them redundant
    // ... (standard implementation)
}

// Applications:
// - Convex polygon intersection
// - Voronoi cell computation
// - Kernel of a polygon (set of points seeing all edges)
// - Maximum area convex polygon under constraints
```

---

## Numerical Robustness

### Integer Arithmetic (Preferred)

```
When possible, use integer coordinates and integer arithmetic:
- Cross product: integer result for integer inputs
- Area: use 2*area (integer) instead of area (may be 0.5)
- Distance comparisons: compare squared distances

Avoid floating point when:
- Coordinates are integers
- Only need orientation tests (CW/CCW/collinear)
- Comparing distances (use squared distances)
```

### Floating Point Considerations

```cpp
const ld EPS = 1e-9;

// Comparison with epsilon
int sign(ld x) { return (x > EPS) - (x < -EPS); }
bool eq(ld a, ld b) { return abs(a - b) < EPS; }

// Common pitfalls:
// 1. Accumulated error in iterative algorithms
// 2. Catastrophic cancellation (subtracting nearly equal numbers)
// 3. Inconsistent comparisons (a < b and b < c but a >= c with eps)

// Guideline: Use long double (ld) for 18-19 digits of precision
// double has ~15 digits, long double has ~18-19
```

---

## Contest Problem Pattern Recognition

| Keyword/Pattern | Likely Algorithm | Time Complexity |
|----------------|-----------------|-----------------|
| "Maximum distance between points" | Convex hull + rotating calipers | O(N log N) |
| "Closest pair of points" | Divide & conquer or sweep line | O(N log N) |
| "Point inside polygon" | Ray casting or winding number | O(N) per query |
| "Area of union" | Sweep line + segment tree | O(N log N) |
| "Enclosing circle" | Welzl's algorithm (randomized) | O(N) expected |
| "Number of intersections" | Sweep line (Bentley-Ottmann) | O((N+K) log N) |
| "Convex polygon queries" | Convex hull + binary search | O(log N) per query |
| "Shortest path with obstacles" | Visibility graph + Dijkstra | O(N^2 log N) |
| "Minimum spanning tree of points" | Delaunay triangulation + MST | O(N log N) |

### Common Mistakes in Geometry Contests

1. **Not handling collinear points** in convex hull (use strict or non-strict inequality)
2. **Integer overflow** in cross products (use `long long` or `__int128`)
3. **skipping degenerate cases** (all points collinear, coincident points)
4. **Wrong polygon orientation** (CW vs CCW affects signed area and point-in-polygon)
5. **Floating point comparisons** without epsilon tolerance
6. **Off-by-one in polygon traversal** (skipping to close the polygon)


## Process

1. **Gather information.** Ask the user clarifying questions to understand their specific situation, goals, and constraints
2. **Analyze context.** Review the information provided and identify key factors relevant to computational geometry solver
3. **Develop recommendations.** Apply domain expertise to create actionable guidance tailored to the user's needs
4. **Present structured output.** Deliver findings in the output format below with clear next steps
5. **Address follow-ups.** Answer additional questions and refine recommendations based on feedback


## Output Format

```template
## Computational Geometry Solver Analysis

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

**Input:** "Help me with computational geometry solver for my current situation"

**Output:**

Based on your situation, here is a structured approach to computational geometry solver:

1. **Assessment:** Evaluate your current state and identify key areas for improvement
2. **Strategy:** Develop a targeted plan based on best practices
3. **Implementation:** Execute the plan with specific, measurable steps
4. **Review:** Monitor progress and adjust as needed
