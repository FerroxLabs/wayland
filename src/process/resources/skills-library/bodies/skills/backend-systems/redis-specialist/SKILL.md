---
name: redis-specialist
description: |
  Comprehensive Redis expertise covering all data structures (strings, hashes, lists, sets, sorted sets, streams), pub/sub messaging, Lua scripting, Redis Cluster architecture, Sentinel high availability, persistence strategies (RDB/AOF), memory optimization techniques, and common application patterns including caching, sessions, rate limiting, leaderboards, and distributed locking.
  Use when the user asks about redis specialist, redis specialist best practices, or needs guidance on redis specialist implementation.
  Do NOT use when the user needs a different specialized skill or is asking about an unrelated technology domain.
license: Apache-2.0
metadata:
  author: foundry-skills
  version: "1.0.0"
  tags: "database sql optimization"
  category: "backend-systems"
  subcategory: "database"
  depends: ""
  disclaimer: "none"
  difficulty: "intermediate"
---

# Redis Specialist

## Core Philosophy

Redis is an in-memory data structure server, not just a cache. Its strength lies in its rich data structures and atomic operations. The key to Redis mastery is choosing the right data structure for each problem and understanding the memory, performance, and persistence trade-offs.

## Data Structures and Commands

### Strings

The most basic type. Stores text, integers, floats, or binary data up to 512MB.

```redis
-- Basic operations
SET user:1:name "Alice" EX 3600        -- set with 1-hour TTL
GET user:1:name                         -- get
MSET k1 "v1" k2 "v2" k3 "v3"          -- multi-set (atomic)
MGET k1 k2 k3                          -- multi-get

-- Atomic counters
INCR page:views:home                    -- increment by 1 (creates if not exists)
INCRBY inventory:sku:abc -1             -- decrement stock
INCRBYFLOAT account:balance:42 -29.99   -- float arithmetic

-- Conditional set
SET lock:resource "owner1" NX EX 30     -- set only if not exists (distributed lock)
SET cache:key "data" XX                 -- set only if exists (update only)

-- Bit operations
SETBIT user:1:features 3 1              -- feature flag at bit position 3
GETBIT user:1:features 3
BITCOUNT user:1:features                -- count set bits
BITOP AND result key1 key2              -- bitwise AND across keys
```

### Hashes

Maps of field-value pairs. Ideal for objects.

```redis
-- Store a user object
HSET user:1 name "Alice" email "alice@example.com" login_count 0
HGET user:1 name
HGETALL user:1
HMGET user:1 name email

-- Atomic field operations
HINCRBY user:1 login_count 1
HDEL user:1 deprecated_field
HEXISTS user:1 email
HLEN user:1

-- Scan fields (for large hashes)
HSCAN user:1 0 MATCH "pref_*" COUNT 100
```

**Memory optimization:** Hashes with fewer fields than `hash-max-ziplist-entries` (default 128) and values shorter than `hash-max-ziplist-value` (default 64 bytes) use ziplist encoding, which is extremely memory-efficient.

### Lists

Ordered sequences. Excellent for queues, activity feeds, and bounded collections.

```redis
-- Queue pattern (FIFO)
LPUSH queue:emails '{"to":"alice@example.com","subject":"Welcome"}'
RPOP queue:emails                       -- pop from right (FIFO)
BRPOP queue:emails 30                   -- blocking pop with 30s timeout

-- Reliable queue (RPOPLPUSH)
RPOPLPUSH queue:emails queue:processing -- atomically move to processing queue

-- Activity feed (bounded list)
LPUSH feed:user:1 '{"action":"posted","id":"123"}'
LTRIM feed:user:1 0 99                  -- keep only last 100 items
LRANGE feed:user:1 0 19                 -- get latest 20 items

-- Stack (LIFO)
LPUSH stack:undo "action1"
LPOP stack:undo
```

### Sets

Unordered collections of unique elements. Great for membership testing and set operations.

```redis
-- Tag/category membership
SADD article:1:tags "redis" "database" "nosql"
SISMEMBER article:1:tags "redis"        -- O(1) membership test
SMEMBERS article:1:tags                 -- all members
SCARD article:1:tags                    -- count

-- Set operations (e.g., mutual friends)
SADD user:1:friends "alice" "bob" "charlie"
SADD user:2:friends "bob" "charlie" "diana"
SINTER user:1:friends user:2:friends    -- {"bob", "charlie"}
SUNION user:1:friends user:2:friends    -- all unique friends
SDIFF user:1:friends user:2:friends     -- friends of user:1 not in user:2

-- Random elements
SRANDMEMBER article:1:tags 2            -- 2 random tags (without removal)
SPOP lottery:entries 1                  -- random removal (lottery draw)
```

### Sorted Sets

Sets with a score for each member. Enables ranking, range queries, and priority queues.

```redis
-- Leaderboard
ZADD leaderboard 1500 "player:alice" 1200 "player:bob" 1800 "player:charlie"
ZREVRANGE leaderboard 0 9 WITHSCORES   -- top 10 (highest score first)
ZREVRANK leaderboard "player:alice"     -- rank of alice (0-indexed)
ZSCORE leaderboard "player:alice"       -- score of alice
ZINCRBY leaderboard 50 "player:alice"   -- add 50 points

-- Range queries
ZRANGEBYSCORE leaderboard 1000 2000 WITHSCORES LIMIT 0 10
ZCOUNT leaderboard 1000 2000           -- count in score range

-- Priority queue
ZADD tasks:priority 1 "critical-task" 5 "normal-task" 10 "low-task"
ZPOPMIN tasks:priority                  -- pop lowest score (highest priority)
BZPOPMIN tasks:priority 30             -- blocking version

-- Time-based sliding window
ZADD rate:user:1 1710500000 "req1" 1710500001 "req2"
ZREMRANGEBYSCORE rate:user:1 0 (1710499900  -- remove entries older than window
ZCARD rate:user:1                            -- count requests in window
```

### Streams

Append-only log data structure. Redis's answer to Kafka-style messaging.

## Pub/Sub

```redis
-- Subscriber
SUBSCRIBE channel:notifications
PSUBSCRIBE channel:*                    -- pattern subscribe

-- Publisher
PUBLISH channel:notifications '{"type":"alert","message":"Server CPU high"}'

-- Note: Pub/Sub messages are fire-and-skip. Use Streams for persistent messaging.
```

## Lua Scripting

Lua scripts execute atomically on the server, replacing the need for WATCH/MULTI/EXEC in complex scenarios.

```lua
-- Rate limiter script (sliding window)
-- KEYS[1] = rate limit key
-- ARGV[1] = window in seconds, ARGV[2] = max requests, ARGV[3] = current timestamp
local key = KEYS[1]
local window = tonumber(ARGV[1])
local max_requests = tonumber(ARGV[2])
local now = tonumber(ARGV[3])

-- Remove expired entries
redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

-- Count current requests
local current = redis.call('ZCARD', key)

if current < max_requests then
    redis.call('ZADD', key, now, now .. ':' .. math.random(1000000))
    redis.call('EXPIRE', key, window)
    return 1  -- allowed
else
    return 0  -- rate limited
end
```

```javascript
// Node.js usage -- load script and run via EVALSHA
const script = fs.readFileSync('rate_limit.lua', 'utf8');
const sha = await redis.scriptLoad(script);

const allowed = await redis.evalsha(sha, {
  keys: [`rate:${userId}`],
  arguments: ['60', '100', Date.now().toString()]
});
```

```lua
-- Compare-and-swap script
local key = KEYS[1]
local expected = ARGV[1]
local new_value = ARGV[2]
local ttl = tonumber(ARGV[3])

local current = redis.call('GET', key)
if current == expected then
    if ttl > 0 then
        redis.call('SET', key, new_value, 'EX', ttl)
    else
        redis.call('SET', key, new_value)
    end
    return 1
else
    return 0
end
```

## Redis Cluster

### Architecture

Redis Cluster uses hash slots (16384 total). Each key is mapped to a slot via `CRC16(key) mod 16384`. Each node owns a subset of slots.

```shell
# Minimum 3 master nodes + 3 replicas for production
redis-cli --cluster create \
  node1:6379 node2:6379 node3:6379 \
  node4:6379 node5:6379 node6:6379 \
  --cluster-replicas 1
```

### Hash Tags for Multi-Key Operations

```redis
-- Keys with same hash tag go to same slot
SET {user:1}:profile "..."
SET {user:1}:settings "..."
-- Both keys hash on "user:1", so they are on the same node
-- Multi-key operations (MGET, pipelines) work within same hash tag
```

### Cluster Management

```redis
CLUSTER INFO                            -- cluster state
CLUSTER NODES                           -- node list with slot assignments
CLUSTER SLOTS                           -- slot-to-node mapping

-- Resharding (rebalancing slots)
redis-cli --cluster reshard node1:6379
redis-cli --cluster rebalance node1:6379

-- Adding/removing nodes
redis-cli --cluster add-node new-node:6379 existing-node:6379
redis-cli --cluster del-node node-id
```

## Sentinel (High Availability)

```
# sentinel.conf
sentinel monitor mymaster 192.168.1.10 6379 2    # quorum of 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
sentinel parallel-syncs mymaster 1

sentinel auth-pass mymaster your_password
```

Sentinel provides:
- **Monitoring**: Checks if master and replicas are working
- **Notification**: Alerts via API when something goes wrong
- **Automatic failover**: Promotes a replica to master if master fails
- **Configuration provider**: Clients connect to Sentinel to discover current master

## Persistence

### RDB (Snapshots)

```
# redis.conf
save 900 1        # snapshot if at least 1 key changed in 900 seconds
save 300 10       # snapshot if at least 10 keys changed in 300 seconds
save 60 10000     # snapshot if at least 10000 keys changed in 60 seconds

rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir [system-path]
```

**Pros:** Compact, fast restores, good for backups
**Cons:** Data loss between snapshots, fork() can be slow on large datasets

### AOF (Append-Only File)

```
# redis.conf
appendonly yes
appendfsync everysec     # fsync every second (recommended balance)
# appendfsync always     # fsync every write (safest, slowest)
# appendfsync no         # let OS decide (fastest, least safe)

auto-aof-rewrite-percentage 100    # rewrite when AOF doubles in size
auto-aof-rewrite-min-size 64mb
aof-use-rdb-preamble yes           # hybrid: RDB header + AOF tail (fastest recovery)
```

**Recommended production setup:** Enable both RDB and AOF with `aof-use-rdb-preamble yes` for the best combination of safety and recovery speed.

## Memory Optimization

### Key Design

```
# Bad: long, verbose keys waste memory
SET application:production:user:session:abc123def456 "..."

# Good: short but readable
SET s:abc123def456 "..."

# Use hash to group related small values (ziplist optimization)
HSET u:1 n "Alice" e "alice@ex.com" r "admin"
# vs individual keys (much more memory overhead per key)
```

### Memory Analysis

```redis
MEMORY USAGE key_name              -- bytes used by a single key
MEMORY DOCTOR                      -- memory health advice
INFO memory                        -- overall memory stats
DEBUG OBJECT key_name              -- encoding info

-- Find biggest keys
redis-cli --bigkeys                -- scan for large keys
redis-cli --memkeys --memkeys-samples 100  -- memory-based analysis
```

### Configuration for Memory Efficiency

```
# redis.conf
maxmemory 4gb
maxmemory-policy allkeys-lru       # eviction policy

# Ziplist thresholds (trade CPU for memory)
hash-max-ziplist-entries 128
hash-max-ziplist-value 64
list-max-ziplist-size -2           # 8KB per node
zset-max-ziplist-entries 128
zset-max-ziplist-value 64
set-max-intset-entries 512         # use intset for small integer-only sets
```

### Eviction Policies

| Policy | Description | Use Case |
|--------|-------------|----------|
| `noeviction` | Return error on writes when full | Critical data, no data loss |
| `allkeys-lru` | Evict least recently used | General-purpose cache |
| `allkeys-lfu` | Evict least frequently used | Cache with frequency matters |
| `volatile-lru` | LRU among keys with TTL | Mixed persistent + cache |
| `volatile-ttl` | Evict soonest-expiring keys | Time-sensitive cache |
| `allkeys-random` | Random eviction | Uniform access patterns |

## Common Application Patterns

### Caching Pattern (Cache-Aside)

```python
async def get_user(user_id: str) -> dict:
    # Check cache first
    cached = await redis.get(f"user:{user_id}")
    if cached:
        return json.loads(cached)

    # Cache miss: get from database
    user = await db.users.find_one({"_id": user_id})
    if user:
        # Cache with TTL
        await redis.set(f"user:{user_id}", json.dumps(user), ex=3600)
    return user

async def update_user(user_id: str, data: dict):
    await db.users.update_one({"_id": user_id}, {"$set": data})
    # Invalidate cache (don't update -- avoids race conditions)
    await redis.delete(f"user:{user_id}")
```

### Session Storage

```python
import secrets

async def create_session(user_id: str, metadata: dict) -> str:
    session_id = secrets.token_urlsafe(32)
    session_data = {"user_id": user_id, **metadata, "created_at": time.time()}
    await redis.hset(f"sess:{session_id}", mapping=session_data)
    await redis.expire(f"sess:{session_id}", 86400)  # 24-hour TTL
    return session_id

async def get_session(session_id: str) -> dict | None:
    session = await redis.hgetall(f"sess:{session_id}")
    if session:
        await redis.expire(f"sess:{session_id}", 86400)  # sliding expiration
    return session or None
```

### Rate Limiting (Sliding Window)

```python
async def is_rate_limited(
    user_id: str,
    max_requests: int = 100,
    window_seconds: int = 60
) -> bool:
    key = f"rate:{user_id}"
    now = time.time()
    pipe = redis.pipeline()
    pipe.zremrangebyscore(key, 0, now - window_seconds)
    pipe.zadd(key, {f"{now}:{secrets.token_hex(4)}": now})
    pipe.zcard(key)
    pipe.expire(key, window_seconds)
    results = await pipe.execute()
    current_count = results[2]
    return current_count > max_requests
```

### Distributed Lock (Redlock Pattern)

```python
import uuid

async def acquire_lock(resource: str, ttl_ms: int = 10000) -> str | None:
    lock_id = str(uuid.uuid4())
    acquired = await redis.set(
        f"lock:{resource}", lock_id, nx=True, px=ttl_ms
    )
    return lock_id if acquired else None

async def release_lock(resource: str, lock_id: str) -> bool:
    # Use Lua script for atomic check-and-delete
    script = """
    if redis.call('GET', KEYS[1]) == ARGV[1] then
        return redis.call('DEL', KEYS[1])
    else
        return 0
    end
    """
    result = await redis.run_script(script, keys=[f"lock:{resource}"], args=[lock_id])
    return result == 1
```

### Leaderboard

## Performance Best Practices

1. **Pipeline commands**: Batch multiple commands to reduce round-trip latency
2. **Use appropriate data structures**: Sorted sets for ranking, hashes for objects, streams for logs
3. **Set TTLs on all cache keys**: Prevent memory leaks
4. **Monitor slow log**: `SLOWLOG GET 10` to find slow commands
5. **Avoid KEYS command in production**: Use SCAN instead
6. **Use connection pooling**: Maintain a pool of connections, do not create per-request
7. **Watch memory fragmentation**: `INFO memory` -- `mem_fragmentation_ratio` should be 1.0-1.5

## When to Use

**Use this skill when:**
- Designing or implementing redis specialist solutions
- Reviewing or improving existing redis specialist approaches
- Making architectural or implementation decisions about redis specialist
- Learning redis specialist patterns and best practices
- Troubleshooting redis specialist-related issues

**Do NOT use this skill when:**
- The question is about a fundamentally different technology domain
- A more specific sibling skill covers the exact topic needed
- The user needs a complete hands-on tutorial rather than expert guidance

## Output Format

```markdown
# Redis Specialist Analysis

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

**Input:** "Help me implement redis specialist for a medium-scale production application"

**Output:** A structured analysis covering current state assessment, recommended redis specialist approach with specific patterns, implementation roadmap with milestones, and risk mitigation strategies tailored to the application scale and constraints.

## Edge Cases

- **Legacy system integration:** When redis specialist must coexist with legacy approaches, provide a gradual migration path rather than a complete rewrite
- **Scale mismatch:** When the solution complexity exceeds the project scale, recommend a simpler approach and note when to revisit
- **Team skill gaps:** When the team lacks experience with the recommended approach, include learning resources and simpler alternatives
- **Conflicting requirements:** When constraints conflict (e.g., performance vs. maintainability), explicitly state the trade-off and recommend based on stated priorities
