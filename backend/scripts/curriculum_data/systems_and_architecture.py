"""
Curriculum content for Systems, Databases, Operating Systems & Cloud Architecture.
"""

SYSTEMS_AND_ARCHITECTURE_COURSES = [
    {
        "slug": "system-design-distributed-architecture",
        "title": "Full-Stack System Design & Distributed Architecture",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: High-Performance Data Access & Indexing",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 PostgreSQL B-Tree Index Optimization & Query Execution Plans",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 PostgreSQL B-Tree Index Optimization & Query Execution Plans

## 1. Executive Architectural Overview
In high-throughput relational databases, raw disk and memory page retrieval dominates latency. When a query scans an unindexed table of 10 million rows, the database engine must execute a **Sequential Scan (`Seq Scan`)**, reading thousands of 8KB disk blocks into the shared buffer pool. At scale, this saturates NVMe IOPS, triggers cache evictions, and causes request latency to spike exponentially.

To guarantee bounded lookup latency, relational engines rely on balanced multi-way search trees (B-Trees). A PostgreSQL B-Tree index maintains ordered key-pointer pairs with a shallow depth of $O(\\log_B N)$, where the branching factor $B$ is typically several hundred keys per page.

```
       +------------------------------------+
       |       Root B-Tree Node (8KB)       |
       |  [Key: 1000]   |   [Key: 5000]     |
       +-------+-----------------+----------+
               |                 |
       +-------v-------+  +------v--------+
       | Internal Node |  | Internal Node |
       +-------+-------+  +------+--------+
               |                 |
       +-------v-------+  +------v--------+
       | Leaf Node Ptr |  | Leaf Node Ptr |
       | -> Heap Tuple |  | -> Heap Tuple |
       +---------------+  +---------------+
```

---

## 2. Deep Technical Mechanics: The Leftmost Prefix Rule & Index Selection
When creating composite (multi-column) indexes, column ordering is strictly directional. Consider an index defined as:

```sql
CREATE INDEX idx_tenant_status_created 
ON audit_events (tenant_id, status, created_at DESC);
```

### The Leftmost Prefix Invariant
- **Matching Query:** `WHERE tenant_id = 't_123' AND status = 'active'` traverses the tree efficiently because the leading columns are provided.
- **Range Query Traversal:** `WHERE tenant_id = 't_123' AND created_at > NOW() - INTERVAL '1 day'` can only binary search on `tenant_id`. Because `status` is skipped, `created_at` cannot be used to narrow the index search path; instead, all index entries for `tenant_id = 't_123'` must be scanned sequentially.
- **Total Index Miss:** `WHERE status = 'active'` cannot use the index at all.

---

## 3. Production Implementation: Analyzing Execution Plans
Never deploy an index without inspecting runtime cost using `EXPLAIN (ANALYZE, BUFFERS, TIMING)`.

```sql
-- Production Inspection Script
EXPLAIN (ANALYZE, BUFFERS, VERBOSE)
SELECT id, tenant_id, payload, created_at
FROM audit_events
WHERE tenant_id = 'tenant_01h9z'
  AND status = 'PENDING'
ORDER BY created_at DESC
LIMIT 50;
```

### Deciphering the Execution Plan Nodes
1. **`Seq Scan on audit_events`**: Full table scan. High buffer reads. Immediate alert in production.
2. **`Bitmap Index Scan` + `Bitmap Heap Scan`**: The engine finds matching Tuple IDs (TIDs) in the index, sorts them physically by disk block in memory to minimize random disk head movement, and fetches pages in batch. Ideal for medium selectivity (1% - 15% of table).
3. **`Index Scan`**: Walks the leaf pages directly and fetches heap pages one by one. Optimal for high selectivity (0.01% of table).
4. **`Index Only Scan`**: The query retrieves *all* projected columns directly from the index tuple (via `INCLUDE` clauses). Zero heap fetches occur if the PostgreSQL Visibility Map confirms all tuples on the page are visible to all transactions.

---

## 4. Production War Story: The Stripe Black Friday Heap Bottleneck
During a peak processing period, payment verification queries experienced a 400ms latency degradation despite an existing index on `(merchant_id, created_at)`. Query inspection revealed that although an `Index Scan` was executed, high table bloat caused by continuous `UPDATE` statements invalidated the visibility map. Every index lookup required a secondary fetch to the table heap just to evaluate transaction snapshot visibility.

**The Fix:** Introducing a covering index with `INCLUDE (amount, currency, status)` allowed queries to execute pure `Index Only Scans`, dropping p99 latency from 420ms to 4.2ms.

---

## 5. Comparative Trade-Off Matrix

| Scan Strategy | Heap Access Required | Memory Footprint | Best Concurrency Scenario |
| :--- | :--- | :--- | :--- |
| **Sequential Scan** | 100% of blocks | Low (ring buffer) | Bulk analytics over entire dataset |
| **Bitmap Heap Scan** | Partial (batch blocks) | Medium (TID bitmap) | Medium selectivity (~5-20% rows) |
| **B-Tree Index Scan** | Row-by-row random heap | Low | Highly selective key-value lookups |
| **Index Only Scan** | None (Visibility Map) | Low | High-frequency read queries with covering attributes |

---

## 6. Daily Engineering Mental Model
- Always order composite index columns: `(High Cardinality Equality, Low Cardinality Equality, Range/Ordering Column)`.
- Monitor index bloat with `pg_stat_user_indexes`. An unvacuumed index wastes buffer pool memory and degrades cache hit ratios.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Concurrency Control, Advisory Locks & ACID Transactions",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Concurrency Control, Advisory Locks & ACID Transactions

## 1. Executive Architectural Overview
In high-concurrency microservices, race conditions on shared financial or inventory state are catastrophic. When two concurrent requests simultaneously check account balance and deduct funds, naive application-level checks lead to the classic **Double Spend Anomaly**.

To preserve ACID consistency without degrading overall system throughput, distributed architects must understand the precise boundary between PostgreSQL row-level locks (`FOR UPDATE`), pessimistic advisory mutexes, and optimistic concurrency version tokens.

---

## 2. Locking Primitives & Deadlock Dynamics

```
Transaction A:                          Transaction B:
BEGIN;                                  BEGIN;
SELECT * FROM accounts                  SELECT * FROM accounts
WHERE id = 1 FOR UPDATE;                WHERE id = 2 FOR UPDATE;
  [Acquires Lock on Row 1]                [Acquires Lock on Row 2]

SELECT * FROM accounts                  SELECT * FROM accounts
WHERE id = 2 FOR UPDATE;                WHERE id = 1 FOR UPDATE;
  [BLOCKED waiting for Trans B]           [DEADLOCK DETECTED! ABORT]
```

### PostgreSQL Advisory Locks: Application-Level Mutexes
Row locks require a physical database row to exist. But what if you need to serialize the *initial creation* of an organization, or prevent concurrent billing invoice generation where no row exists yet?

PostgreSQL provides **Advisory Locks** (`pg_advisory_xact_lock(bigint)`): in-memory locking handles managed entirely by PostgreSQL's lock manager that automatically release at transaction commit or rollback.

---

## 3. Production Implementation: Resilient Ledger Debit

```python
import hashlib
from sqlalchemy import text
from sqlalchemy.orm import Session

def execute_idempotent_account_transfer(
    db: Session,
    sender_id: str,
    recipient_id: str,
    amount_cents: int,
    idempotency_key: str
) -> bool:
    \"\"\"
    Executes a financial transfer with strict deadlock prevention and row-level locking.
    Deadlock Prevention Invariant: Always acquire row locks in deterministic ascending ID order.
    \"\"\"
    # 1. Deterministic lock ordering prevents cycle deadlocks
    ordered_ids = sorted([sender_id, recipient_id])
    
    # 2. Convert idempotency key to 64-bit signed integer for Postgres advisory lock
    lock_id = int(hashlib.sha256(idempotency_key.encode()).hexdigest()[:15], 16) - (1 << 63)

    with db.begin():
        # Acquire advisory transaction lock for the idempotency token
        db.execute(text("SELECT pg_advisory_xact_lock(:lock_id)"), {"lock_id": lock_id})

        # Lock rows in deterministic ascending sequence
        accounts = db.execute(
            text(\"\"\"
                SELECT id, balance_cents 
                FROM ledger_accounts 
                WHERE id IN (:id1, :id2) 
                ORDER BY id ASC 
                FOR UPDATE
            \"\"\"),
            {"id1": ordered_ids[0], "id2": ordered_ids[1]}
        ).fetchall()

        account_map = {row.id: row.balance_cents for row in accounts}
        
        if account_map.get(sender_id, 0) < amount_cents:
            raise ValueError("Insufficient balance in source account.")

        # Execute atomic state transitions
        db.execute(
            text("UPDATE ledger_accounts SET balance_cents = balance_cents - :amt WHERE id = :id"),
            {"amt": amount_cents, "id": sender_id}
        )
        db.execute(
            text("UPDATE ledger_accounts SET balance_cents = balance_cents + :amt WHERE id = :id"),
            {"amt": amount_cents, "id": recipient_id}
        )

    return True
```

---

## 4. Failure Modes & Anti-Patterns
1. **Locking During Long Remote HTTP Calls:** Never hold a database row lock while calling an external payment gateway (e.g. Stripe or PayPal). If the external API hangs for 15 seconds, your database connection pool will exhaust immediately.
2. **Non-Deterministic Lock Order:** Locking Row A then Row B in worker 1, while locking Row B then Row A in worker 2, guarantees deadlocks under load.
3. **Implicit Lock Escalation:** In databases like SQL Server, thousands of row locks can escalate into an exclusive table lock. PostgreSQL does *not* escalate row locks to page/table locks, but large update transactions still consume lock table shared memory.

---

## 5. Daily Engineering Checklist
- [ ] Are locks acquired in deterministic lexicographical order?
- [ ] Are long-running network operations strictly separated from database transaction blocks?
- [ ] Is an advisory lock used when validating unique state transitions before row insertion?
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Scalable Caching & Cache Invalidation",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Cache-Aside Pattern, Stampede Mitigation & Singleflight",
                        "duration_minutes": 25,
                        "content_body": """# 2.1 Cache-Aside Pattern, Stampede Mitigation & Singleflight

## 1. Executive Architectural Overview
A primary database can typically sustain 5,000 to 20,000 queries per second before connection saturation and disk contention occur. In high-traffic systems handling hundreds of thousands of requests per second, an in-memory caching tier (e.g. Redis or Memcached) is an absolute necessity.

However, naive caching implementations suffer from catastrophic failure modes under load—most notably the **Cache Stampede (Thundering Herd)** problem.

---

## 2. Anatomy of a Cache Stampede

```
1. Key 'user:profile:100' expires in Redis.
2. 5,000 concurrent client requests arrive at 08:00:00.001.
3. All 5,000 requests find Cache MISS simultaneously.
4. All 5,000 threads execute the heavy SQL query against PostgreSQL.
5. PostgreSQL connection pool saturates; CPU spikes to 100%; database crashes.
```

```
                     +----------------------------+
                     | Incoming 5,000 Req / sec   |
                     +--------------+-------------+
                                    |
                            [Cache MISS]
                                    |
                     +--------------v-------------+
                     | Singleflight Mutex Barrier |
                     +--------------+-------------+
                                    |
                       Only 1 Leader Request Goes
                                    |
                     +--------------v-------------+
                     |  PostgreSQL Database Query |
                     +--------------+-------------+
                                    |
                      Leader populates Redis Cache
                                    |
                 All 4,999 Waiting Requests Receive Result
```

---

## 3. Production Implementation: Redis Cache-Aside with Singleflight Invalidation

```python
import time
import json
import redis
from typing import Callable, Any, Optional

class CacheManager:
    def __init__(self, redis_client: redis.Redis):
        self.r = redis_client
        self._in_flight = {}  # Local process lock registry

    def get_or_set(
        self,
        key: str,
        ttl_seconds: int,
        fetcher: Callable[[], Any],
        probabilistic_early_expiration: bool = True
    ) -> Any:
        # 1. Attempt fast read from Redis
        cached = self.r.get(key)
        if cached:
            data = json.loads(cached)
            # Probabilistic Early Expiration (XFetch algorithm)
            if probabilistic_early_expiration and "expiry" in data:
                time_remaining = data["expiry"] - time.time()
                # If less than 10% TTL remains, background refresh
                if time_remaining < (ttl_seconds * 0.1):
                    self._async_refresh(key, ttl_seconds, fetcher)
            return data["payload"]

        # 2. Stampede Barrier using Redis SET NX (Distributed Mutex)
        lock_key = f"lock:{key}"
        acquired = self.r.set(lock_key, "1", nx=True, ex=5)

        if acquired:
            try:
                # Leader thread fetches authoritative data from primary DB
                fresh_val = fetcher()
                envelope = {
                    "payload": fresh_val,
                    "expiry": time.time() + ttl_seconds
                }
                self.r.setex(key, ttl_seconds, json.dumps(envelope))
                return fresh_val
            finally:
                self.r.delete(lock_key)
        else:
            # Follower threads sleep briefly and re-read from cache
            time.sleep(0.05)
            fallback = self.r.get(key)
            if fallback:
                return json.loads(fallback)["payload"]
            return fetcher()

    def _async_refresh(self, key: str, ttl: int, fetcher: Callable):
        # Dispatched to background worker queue to keep user path zero-latency
        pass
```

---

## 4. Production War Story: Netflix Global Title Catalog Invalidation
When Netflix released high-profile series worldwide, millions of smart TVs requested identical show metadata simultaneously. Expired cache keys immediately caused database thundering herds.

To solve this, Netflix implemented **XFetch (Probabilistic Early Expiration)**. Instead of allowing a key to expire abruptly, clients compute a probability distribution based on the execution time of the read query:
$$\Delta \cdot \beta \cdot \ln(\text{rand}()) > \text{time\_remaining}$$
The heavier the database query $\Delta$, the earlier the background system refreshes the cache before any client observes an expired key.

---

## 5. Daily Engineering Checklist
- [ ] Is every cache TTL jittered by $\pm 10\%$ to prevent simultaneous expiration of bulk-inserted keys?
- [ ] Are cache misses protected by a singleflight mutex or distributed `SET NX` guard?
- [ ] Is serialized payload size monitored to avoid Redis network socket saturation?
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Distributed Cache Invalidation, Redis Cluster & Sharding",
                        "duration_minutes": 25,
                        "content_body": """# 2.2 Distributed Cache Invalidation, Redis Cluster & Sharding

## 1. Executive Architectural Overview
When working with multi-node caching clusters, horizontal partitioning (sharding) determines which physical server holds a given key. Simple modulo hashing (`hash(key) % N`) fails catastrophically when nodes are added or removed, as nearly 100% of keys map to new servers, causing a complete cache wipe and database overload.

To solve this, enterprise distributed systems utilize **Consistent Hashing** with virtual nodes and **Redis Cluster Hash Slots**.

```
                [Node A: Slots 0 - 5460]
                       /        \\
                      /          \\
[Node C: Slots 10923-16383] ---- [Node B: Slots 5461 - 10922]
```

---

## 2. The 16,384 Hash Slot Mechanism
Redis Cluster partitions keyspace into exactly 16,384 logical hash slots:
$$\text{Slot} = \text{CRC16}(\text{key}) \pmod{16384}$$

### Hash Tags: Co-Locating Related Data
When executing multi-key transactions (`MGET`, `EVAL` Lua scripts), all keys must reside on the same cluster node. Redis supports **Hash Tags**:
- `user:{user_991}:profile`
- `user:{user_991}:orders`
Because only the string inside `{...}` is hashed, both keys are guaranteed to map to the exact same hash slot and physical node!

---

## 3. Production Invalidation Patterns
1. **TTL-Only (Eventual Consistency):** Tolerates stale reads up to the TTL window.
2. **Write-Through / Cache-Evict on Update:** Primary database commit is immediately followed by `redis.delete(key)`. Always prefer *deletion* over *mutation* to prevent race conditions between competing writes.
3. **Change-Data-Capture (CDC) Invalidation:** A Debezium Kafka connector listens to the database WAL and publishes invalidation messages to Redis instances asynchronously.

---

## 4. Key Takeaways
- Always delete cache entries on update rather than updating them in place.
- Use Hash Tags `{...}` whenever multi-key operations or transactions are required in Redis Cluster.
"""
                    }
                ]
            },
            {
                "order_index": 3,
                "title": "Module 3: Event-Driven Systems & Transactional Outbox",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "3.1 Asynchronous Event Publishing & At-Least-Once Delivery",
                        "duration_minutes": 25,
                        "content_body": """# 3.1 Asynchronous Event Publishing & At-Least-Once Delivery

## 1. Executive Architectural Overview
Direct synchronous HTTP calls between microservices create fragile, tightly coupled architectures. If Service A calls Service B, which calls Service C, the overall availability is the product of their individual availabilities:
$$A_{\\text{total}} = A_A \\times A_B \\times A_C$$
If each service boasts 99.9% uptime, the composite system guarantees only 99.7% availability, with cascading latency.

Event-Driven Architecture (EDA) replaces synchronous coupling with durable, asynchronous message brokers (e.g. Apache Kafka, RabbitMQ, AWS SQS), guaranteeing **temporal decoupling** and **load leveling**.

---

## 2. Messaging Guarantees: At-Least-Once vs Exactly-Once
In distributed networks subject to packet loss and network partitions, physical brokers deliver messages using **At-Least-Once Semantics**. A consumer may process an order, but if the network acknowledgment (ACK) drops, the broker will redeliver the event.

```
+------------+       Publish Event        +---------------+
|  Producer  | -------------------------> | Message Broker|
+------------+                            +-------+-------+
                                                  |
                                            Deliver Event
                                                  |
                                          +-------v-------+
                                          |   Consumer    |
                                          | (Processes)   |
                                          +-------+-------+
                                                  |
                                            ACK Dropped!
                                            (Network Cut)
                                                  |
                                          Broker Retries!
                                                  |
                                          +-------v-------+
                                          | Consumer Sees |
                                          | Duplicate Msg |
                                          +---------------+
```

**Non-Negotiable Rule:** Every consumer in an event-driven system MUST be strictly **idempotent**.

---

## 3. Production Implementation: Idempotent Consumer Pattern

```python
from sqlalchemy.orm import Session
from sqlalchemy import text

def process_payment_settled_event(db: Session, event: dict):
    event_id = event["event_id"]
    order_id = event["data"]["order_id"]
    amount = event["data"]["amount"]

    with db.begin():
        # 1. Atomic Dedup Ledger Check
        inserted = db.execute(
            text(\"\"\"
                INSERT INTO processed_events (event_id, handler_name, processed_at)
                VALUES (:event_id, 'order_fulfiller', NOW())
                ON CONFLICT (event_id) DO NOTHING
            \"\"\"),
            {"event_id": event_id}
        ).rowcount

        # If rowcount is 0, this event was already processed. Discard safely!
        if inserted == 0:
            return  # Idempotent skip

        # 2. Execute business mutation
        db.execute(
            text("UPDATE orders SET status = 'PAID' WHERE id = :order_id"),
            {"order_id": order_id}
        )
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "3.2 Transactional Outbox Pattern & CDC Debezium Pipeline",
                        "duration_minutes": 30,
                        "content_body": """# 3.2 Transactional Outbox Pattern & CDC Debezium Pipeline

## 1. The Dual-Write Problem
Consider an application that updates a user record and publishes an event to Kafka:

```python
# THE DUAL-WRITE DISASTER
db.commit()             # Step 1: Database Updated
kafka.send("UserPaid")  # Step 2: What if network crashes or broker is down here?
```
If the server crashes between Step 1 and Step 2, the database has persisted the payment, but downstream inventory, shipping, and email services will never know. State consistency is broken.

Conversely, if you publish to Kafka first, and the database transaction fails and rollbacks, you have published a phantom event for an order that does not exist.

---

## 2. The Transactional Outbox Architecture
To achieve atomic database mutation and event publishing without distributed 2-Phase Commit protocols, we store events in an `outbox` table *within the exact same relational database transaction*.

```
+-----------------------------------------------------------------------+
| Single PostgreSQL ACID Transaction                                    |
|                                                                       |
|  1. UPDATE orders SET status = 'PAID' WHERE id = :id;                 |
|  2. INSERT INTO outbox (aggregate_type, event_type, payload) VALUES   |
|     ('order', 'OrderPaid', '{"id": 123, "amount": 99.00}');          |
|                                                                       |
|  COMMIT; (Atomic - Both succeed or both rollback)                     |
+-----------------------------------------------------------------------+
                                |
                    PostgreSQL Write-Ahead Log (WAL)
                                |
               +----------------v---------------+
               | Debezium CDC Connector (Kafka) |
               +----------------+---------------+
                                |
                        Streams to Kafka
```

---

## 3. Production Implementation: Outbox Schema & Debezium Configuration

```sql
CREATE TABLE outbox_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aggregate_type VARCHAR(64) NOT NULL,
    aggregate_id VARCHAR(128) NOT NULL,
    event_type VARCHAR(128) NOT NULL,
    payload JSONB NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for legacy polling relay fallbacks
CREATE INDEX idx_outbox_unprocessed ON outbox_events (created_at);
```

Using Change Data Capture (CDC) with Debezium, Kafka connects directly to PostgreSQL's logical decoding replication slot. Zero application polling is required; Debezium streams committed WAL changes directly into Kafka topics with sub-millisecond latency.
"""
                    }
                ]
            },
            {
                "order_index": 4,
                "title": "Module 4: ACID Transaction Boundaries & Distributed Consensus",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "4.1 Two-Phase Commit (2PC) vs Saga Orchestration",
                        "duration_minutes": 30,
                        "content_body": """# 4.1 Two-Phase Commit (2PC) vs Saga Orchestration

## 1. Executive Architectural Overview
When a business operation spans multiple sovereign microservices (e.g., Order Service, Payment Service, Inventory Service), maintaining atomic all-or-nothing transactions across separate physical databases is one of the hardest challenges in software engineering.

Historically, distributed systems used **Two-Phase Commit (2PC)**. Modern scalable architectures have replaced 2PC with **Saga Orchestration**.

---

## 2. Why Two-Phase Commit Fails at Modern Scale
In 2PC, a centralized coordinator manages two phases:
1. **Prepare Phase:** Coordinator asks all participants: "Can you commit?" Each node acquires local database locks and responds YES.
2. **Commit Phase:** If all respond YES, coordinator writes commit record and sends COMMIT.

### The Blocking Flaw
If the coordinator crashes after the Prepare Phase, all participant databases remain indefinitely locked, holding open database connections and blocking all concurrent traffic on those rows. 2PC favors Consistency over Availability (CP in CAP theorem), making it unsuitable for high-throughput internet applications.

---

## 3. The Saga Pattern: Choreography vs Orchestration
A Saga decomposes a distributed transaction into a sequence of local transactions. Each local transaction updates its database and publishes an event. If a step fails, the Saga executes **Compensating Transactions** that undo previous steps in reverse order.

```
[Order Created] 
      |
      v
[Debit Customer Account] ---> (Failed: Insufficient Funds)
      |                                  |
      v                                  v
[Reserve Warehouse Stock]       [Compensating Action: Cancel Order & Notify User]
```

### Saga Orchestrator Pattern
Using an Orchestrator (such as Temporal or an explicit state machine) eliminates circular dependencies and provides clear visibility into workflow execution state.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "4.2 Raft Consensus Algorithm & Leader Quorums",
                        "duration_minutes": 30,
                        "content_body": """# 4.2 Raft Consensus Algorithm & Leader Quorums

## 1. Executive Architectural Overview
Distributed systems like etcd, CockroachDB, Kafka (KRaft), and Kubernetes require nodes to agree on a sequence of state machine operations even when individual nodes crash or network partitions occur.

The **Raft Consensus Algorithm** achieves consensus through replicated logs and strong leader election:

```
Nodes in Cluster: 5
Quorum Required:  ceil((5 + 1) / 2) = 3 nodes

+----------+        Heartbeats / Log Entries       +----------+
| Follower | <----------------------------------- |  LEADER  |
+----------+                                      +----+-----+
                                                       |
+----------+                                           |
| Follower | <-----------------------------------------+
+----------+
```

---

## 2. Key Raft Sub-Protocols
1. **Leader Election:** If a follower receives no heartbeat within a randomized election timeout (150ms - 300ms), it transitions to *Candidate*, increments the term, votes for itself, and requests votes.
2. **Log Replication:** Only the elected leader accepts client writes. The leader appends the entry to its log and sends `AppendEntries` RPCs to followers.
3. **Commit Rule:** Once a log entry is replicated across a strict **Quorum Majority** ($> N/2$), the leader commits the entry and applies it to its state machine.

---

## 3. Split-Brain Defense
If a 5-node cluster partitions into $\{N_1, N_2\}$ and $\{N_3, N_4, N_5\}$:
- The partition with 2 nodes cannot form a quorum ($2 < 3$) and rejects all client writes.
- The partition with 3 nodes maintains majority quorum and continues processing safely.
Split-brain inconsistency is physically impossible under Raft invariants.
"""
                    }
                ]
            },
            {
                "order_index": 5,
                "title": "Module 5: Distributed Observability & Chaos Engineering",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "5.1 Distributed Tracing & OpenTelemetry Spans",
                        "duration_minutes": 25,
                        "content_body": """# 5.1 Distributed Tracing & OpenTelemetry Spans

## 1. Executive Architectural Overview
In monolithic systems, stack traces identify the exact function where an exception occurred. In microservices, a single client request triggers 30 RPC calls across 12 services. Without distributed context propagation, debugging a 3-second latency spike is nearly impossible.

Distributed Tracing tracks the lifecycle of a request as it flows across network boundaries using the **W3C Trace Context Standard**.

---

## 2. W3C Trace Context Propagation
Every outgoing HTTP or gRPC request injects the `traceparent` header:

```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
              |                  |                                |    |
           Version            Trace ID                        Parent Span Flags
```

- **Trace ID (16 bytes):** Globally unique identifier shared by all spans within the request graph.
- **Span ID (8 bytes):** Unique identifier for a specific unit of work (e.g., executing an SQL query or calling Redis).

---

## 3. Production Implementation: OpenTelemetry Instrumentation

```python
from opentelemetry import trace
from opentelemetry.trace import Status, StatusCode

tracer = trace.get_tracer("payment_service")

def execute_fraud_check(user_id: str, amount_cents: int) -> bool:
    with tracer.start_as_current_span("fraud_engine.evaluate") as span:
        span.set_attribute("user.id", user_id)
        span.set_attribute("payment.amount_cents", amount_cents)
        
        try:
            is_suspicious = evaluate_ml_risk_score(user_id, amount_cents)
            span.set_attribute("fraud.result", "flagged" if is_suspicious else "cleared")
            return is_suspicious
        except Exception as e:
            span.record_exception(e)
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "5.2 Chaos Engineering & Latency Injection in Microservices",
                        "duration_minutes": 25,
                        "content_body": """# 5.2 Chaos Engineering & Latency Injection in Microservices

## 1. Executive Architectural Overview
Systems don't fail when things are running normally; they fail when rare combinations of network degradation, packet drops, and thread pool exhaustion collide. **Chaos Engineering** is the discipline of experimenting on a system in production to build confidence in its capability to withstand turbulent conditions.

---

## 2. The Fallacies of Distributed Computing
Every resilient architecture must guard against these core assumptions:
1. *The network is reliable.* (It is not; timeouts and dropped packets are continuous.)
2. *Latency is zero.* (It varies wildly under load.)
3. *Bandwidth is infinite.*

---

## 3. Circuit Breaker Mechanics: Preventing Cascading Collapses
When an external dependency becomes slow, calling threads queue up, exhausting worker thread pools and taking down the calling service.

```
       [Normal Operation: CLOSED]
             |
             | Failure Rate > 50%
             v
       [Fault Detected: OPEN] ---> Immediately fail-fast without calling remote API!
             |
             | Wait Sleep Window (e.g. 10s)
             v
       [Probe Health: HALF-OPEN]
             |
      +------+------+
      |             |
   Success        Failure
      |             |
      v             v
   [CLOSED]       [OPEN]
```
"""
                    }
                ]
            },
            {
                "order_index": 6,
                "title": "Module 6: Capstone Architecture Defense & Final Review",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "6.1 High-Scale Distributed Architecture Defense",
                        "duration_minutes": 35,
                        "content_body": """# 6.1 High-Scale Distributed Architecture Defense

## 1. Synthesis of System Design Principles
Throughout this curriculum, we examined the foundational trade-offs governing modern high-scale software systems. To defend an enterprise architecture before a technical review board, engineers must articulate decisions using quantitative trade-offs rather than buzzwords.

---

## 2. Architectural Blueprint: 500,000 QPS Real-Time Platform

```
[Clients]
   | (HTTP/3, QUIC, TLS 1.3)
   v
[Global Anycast CDN / Cloudflare]
   |
   v
[L7 Envoy API Gateway (Rate Limiting, mTLS, JWT)]
   |
   +---> [Stateless Services (Kubernetes HPA, Auto-scaling)]
            |
            +---> [Redis Cluster (Cache-Aside, Singleflight Barrier)]
            |
            +---> [Primary PostgreSQL (Partitioned, Connection Pooled with PgBouncer)]
            |        |
            |        v (Logical CDC Replication)
            |     [Debezium -> Kafka Cluster]
            |        |
            |        +---> [Elasticsearch / ClickHouse Analytics]
            |        +---> [Async Outbox Workers]
```

---

## 3. The 5 Core Tenets of Resilient Distributed Systems
1. **Stateless Compute:** Keep business logic nodes completely stateless so any instance can be killed without data loss.
2. **Explicit Timeouts & Deadlines:** Every network socket read and database query must possess an explicit deadline.
3. **Idempotent Consumers:** Treat every incoming webhook and queue event as potentially duplicated.
4. **Partitioning Over Monolithic Storage:** Shard datasets horizontally by tenant or hash range before table sizes exceed physical RAM.
5. **Observability as a First-Class Citizen:** Telemetry traces, structured JSON logs, and metric counters must be written concurrently with business logic.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "database-internals-concurrency-isolation",
        "title": "Database Internals & Concurrency Control",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Storage Engines & Write-Ahead Logs",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Write-Ahead Logging (WAL) & Crash Recovery Protocols",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Write-Ahead Logging (WAL) & Crash Recovery Protocols

## 1. Executive Architectural Overview
How does a database guarantee durability ($D$ in ACID) without flushing modified 8KB data pages to disk on every single transaction commit? Modifying table heap pages causes random disk I/O, which would choke storage controllers to a standstill.

The solution is the **Write-Ahead Log (WAL)** (also known as the redo log). Before any in-memory page in the shared buffer pool is modified, an append-only log record describing the delta is written sequentially to disk. Sequential disk writes operate at bare-metal bus speeds (gigabytes per second).

---

## 2. The ARIES Recovery Algorithm
When a database server suddenly loses power and reboots, it restores consistent state using the three passes of the **ARIES (Algorithms for Recovery and Isolation Exploiting Semantics)** protocol:

```
[Crash Point]
      |
      v
1. Analysis Pass:
   Scans the WAL forward from the latest checkpoint to identify:
   - Dirty pages in memory at the time of the crash
   - Active transactions that never committed (loser transactions)
      |
      v
2. Redo Pass:
   Replays all logged changes forward from the oldest unwritten page LSN.
   Restores database state to the exact microsecond before the crash.
      |
      v
3. Undo Pass:
   Scans backward and reverses changes made by uncommitted loser transactions,
   writing Compensation Log Records (CLRs) to guarantee idempotence.
```

---

## 3. Log Sequence Numbers (LSN) Invariant
Every WAL record has a monotonically increasing 64-bit integer called a **Log Sequence Number (LSN)**. Every database disk page header contains the LSN of the last update applied to it (`page_lsn`).

**The WAL Invariant Rule:** A buffer manager is physically forbidden from flushing a dirty page to disk until the WAL has been flushed up to that page's `page_lsn`:
$$\text{flushed\_wal\_lsn} \ge \text{page\_lsn}$$
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 B-Tree vs LSM-Tree (Log-Structured Merge-Tree) Internals",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 B-Tree vs LSM-Tree (Log-Structured Merge-Tree) Internals

## 1. Executive Architectural Overview
Database storage architectures are divided into two fundamental philosophies:
1. **Update-in-Place (B-Trees):** Optimized for low-latency read performance (PostgreSQL, MySQL InnoDB, SQLite).
2. **Append-Only / Merge (LSM-Trees):** Optimized for massive write throughput and compression (RocksDB, Cassandra, Google Bigtable, ScyllaDB).

---

## 2. Anatomy of an LSM-Tree (Log-Structured Merge-Tree)

```
[Write Operations]
       |
       +---> Append to WAL on Disk (Crash Recovery)
       |
       +---> Insert into MemTable (In-Memory Red-Black Tree or SkipList)
                 |
                 | When MemTable reaches ~64MB
                 v
             [Flush to Disk: SSTable Level 0]
                 |
                 | Background Compaction
                 v
             [SSTable Level 1 (Sorted, Non-Overlapping Keys)]
                 |
                 v
             [SSTable Level 2]
```

### SSTable (Sorted String Table) Mechanics
- Immutable sequential disk files.
- Keys are strictly sorted.
- Includes an in-memory sparse index and a **Bloom Filter** to eliminate disk reads for keys that do not exist.

---

## 3. Comparison Matrix: B-Tree vs LSM-Tree

| Metric | B-Tree Engine | LSM-Tree Engine |
| :--- | :--- | :--- |
| **Write Amplification** | High (overwrites entire 8KB/16KB page) | Lower sequential writes, background compaction |
| **Read Latency** | Ultra-fast ($O(\\log N)$ single page lookup) | Slower (must search MemTable + Bloom filters across SSTable levels) |
| **Space Efficiency** | Lower (fragmentation & page fill factors) | High (dense sequential packing & compression) |
| **Hardware Fit** | Fast random-access NVMe SSDs | High-ingest write workloads, distributed logs |
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Isolation Anomalies & Serializable Transactions",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 SSI (Serializable Snapshot Isolation) Mechanics",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 SSI (Serializable Snapshot Isolation) Mechanics

## 1. Executive Architectural Overview
The SQL-92 isolation standard defines levels: Read Uncommitted, Read Committed, Repeatable Read, and Serializable. However, standard Snapshot Isolation (SI) still permits **Write Skew Anomalies**, where two concurrent transactions read disjoint data sets, make overlapping logical decisions, and commit an invalid state.

PostgreSQL's **Serializable Snapshot Isolation (SSI)** achieves true serializability without locking readers or writers by tracking dependency graphs in memory.

---

## 2. The Write Skew Anomaly Explained
Consider two on-call doctors in a hospital system. The invariant states: *At least one doctor must remain on call at all times.*

```
Initial State: Dr. Alice = ON_CALL, Dr. Bob = ON_CALL

Transaction 1 (Alice goes off duty):
  SELECT count(*) FROM doctors WHERE on_call = true; -- Returns 2 (Valid!)
  UPDATE doctors SET on_call = false WHERE name = 'Alice';

Transaction 2 (Bob goes off duty simultaneously):
  SELECT count(*) FROM doctors WHERE on_call = true; -- Returns 2 (Valid!)
  UPDATE doctors SET on_call = false WHERE name = 'Bob';

Both Transactions COMMIT under standard Snapshot Isolation!
Final State: ZERO doctors on call! Invariant VIOLATED.
```

---

## 3. How SSI Detects Serialization Failures (SIREAD Locks)
SSI introduces ephemeral in-memory markers called **SIREAD locks** (predicate locks). When Transaction 2 modifies a record that was previously evaluated in Transaction 1's read snapshot, a dangerous structure in the serialization dependency graph ($rw$-antidependency cycle) is detected.

The database automatically aborts one of the transactions with SQL error `40001: could not serialize access due to read/write dependencies among transactions`.

**Production Engineering Rule:** In `SERIALIZABLE` mode, applications must wrap transactions in an automated retry loop.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 MVCC (Multi-Version Concurrency Control) & Vacuuming",
                        "duration_minutes": 25,
                        "content_body": """# 2.2 MVCC (Multi-Version Concurrency Control) & Vacuuming

## 1. Executive Architectural Overview
In traditional locking databases, readers block writers and writers block readers. **Multi-Version Concurrency Control (MVCC)** guarantees that *readers never block writers, and writers never block readers*.

When a row is updated in PostgreSQL, the old tuple is NOT overwritten. Instead, the engine writes a brand-new version of the row with updated transaction visibility headers (`xmin`, `xmax`).

---

## 2. Tuple Visibility Headers
Every physical heap tuple stores internal MVCC metadata:
- `xmin`: The Transaction ID (XID) of the transaction that inserted the row.
- `xmax`: The Transaction ID of the transaction that deleted or updated the row (0 if live).

When a transaction starts with snapshot `100:100:`, it sees only tuples where `xmin < 100` and `xmax` is either uncommitted or $> 100$.

---

## 3. Table Bloat & The Autovacuum Daemon
Because deleted and updated rows remain physically on disk as **dead tuples**, tables will grow indefinitely unless cleaned up.

```
+-------------------------------------------------------+
| PostgreSQL Table Heap Page (8KB)                      |
|                                                       |
| [Tuple 1: Live]  [Tuple 2: DEAD]  [Tuple 3: Live]    |
+-------------------------------------------------------+
                           |
                      VACUUM Runs
                           |
+--------------------------v----------------------------+
| [Tuple 1: Live]  [Free Space Available] [Tuple 3: Live]|
+-------------------------------------------------------+
```

`VACUUM` marks dead tuple space as reusable for future inserts. If autovacuum cannot keep up with high write volume, database performance drops and indexes balloon in size.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "cloud-native-infrastructure-container-security",
        "title": "Cloud-Native Infrastructure & Container Security",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Container Runtime Primitives",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Linux Namespaces, Cgroups, and Capabilities",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Linux Namespaces, Cgroups, and Capabilities

## 1. Executive Architectural Overview
Containers are not lightweight virtual machines. There is no hypervisor, no virtual BIOS, and no guest kernel. A container is simply an ordinary Linux host process wrapped in isolation primitives provided directly by the Linux kernel:
1. **Namespaces:** Determines what the process can *see*.
2. **Control Groups (cgroups):** Determines how much the process can *use*.
3. **Linux Capabilities:** Determines what the process can *do*.

---

## 2. The 7 Core Linux Namespaces

```
Linux Kernel
  |-- PID Namespace:   Process virtualization (Container process becomes PID 1)
  |-- NET Namespace:   Isolated virtual network interfaces, routing tables, port bindings
  |-- MNT Namespace:   Isolated mount points and root filesystem pivot (pivot_root)
  |-- IPC Namespace:   Isolated POSIX message queues & shared memory segments
  |-- UTS Namespace:   Isolated hostname and domain name
  |-- USER Namespace:  Maps container root (UID 0) to an unprivileged host UID (e.g. UID 10001)
  |-- CGROUP Namespace: Virtualized view of cgroup controller hierarchies
```

---

## 3. Control Groups v2 (cgroups): Preventing the OOM Killer
Without cgroups, a memory leak in a single container consumes all host RAM, triggering the Linux kernel Out-Of-Memory (OOM) killer to randomly terminate critical system processes.

```bash
# Inspecting cgroup limits in production Linux
cat /sys/fs/cgroup/memory.max
# Displays maximum memory limit in bytes before cgroup throttling or SIGKILL
```

### Memory Throttling vs Hard Kills
- `memory.high`: Triggers asynchronous memory reclamation and throttles process execution.
- `memory.max`: Hard ceiling. If surpassed and memory cannot be reclaimed, kernel executes `OOM-kill` with exit code `137`.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Seccomp BPF Profiling & Read-Only Root Filesystems",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Seccomp BPF Profiling & Read-Only Root Filesystems

## 1. Executive Architectural Overview
The Linux kernel exposes over 400 system calls (syscalls). An ordinary web service requires fewer than 50 (such as `read`, `write`, `epoll_wait`, `socket`). Allowing a compromised container to invoke dangerous syscalls like `ptrace`, `bpf`, or `mount` enables container breakouts and kernel exploits.

---

## 2. Seccomp (Secure Computing Mode) Filters
Seccomp uses Berkeley Packet Filter (BPF) bytecode to inspect syscall arguments in kernel space before executing the command.

```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "exit_group", "epoll_wait", "futex"],
      "action": "SCMP_ACT_ALLOW"
    }
  ]
}
```

---

## 3. Production Hardening: Read-Only Root Filesystems
Attackers gaining Remote Code Execution (RCE) typically download and execute binary payloads in `/tmp` or overwrite system libraries.

```yaml
# Kubernetes Pod Security Context Hardening
securityContext:
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  runAsUser: 10001
  allowPrivilegeEscalation: false
  capabilities:
    drop:
      - ALL
```
By enforcing `readOnlyRootFilesystem: true` and mounting an ephemeral memory-backed `emptyDir` for `/tmp`, attackers cannot persist malware to disk.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Kubernetes Scheduling & Zero-Trust Service Mesh",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Kube-Scheduler Bin-Packing & Affinity Rules",
                        "duration_minutes": 25,
                        "content_body": """# 2.1 Kube-Scheduler Bin-Packing & Affinity Rules

## 1. Executive Architectural Overview
The Kubernetes scheduler (`kube-scheduler`) assigns unscheduled Pods to optimal worker nodes through a two-stage algorithm:
1. **Filtering (Predicates):** Filters out nodes that fail hard requirements (e.g., insufficient CPU/memory, taint mismatches).
2. **Scoring (Priorities):** Scores eligible nodes to find the best placement using bin-packing algorithms to minimize resource fragmentation.

---

## 2. Pod Anti-Affinity: High Availability Guarantee
Never run two replicas of a critical microservice on the same physical host or availability zone.

```yaml
affinity:
  podAntiAffinity:
    requiredDuringSchedulingIgnoredDuringExecution:
      - labelSelector:
          matchExpressions:
            - key: app
              operator: In
              values: ["payment-service"]
        topologyKey: "topology.kubernetes.io/zone"
```
This rule guarantees that if an entire AWS availability zone experiences power loss, your payment service retains quorum across remaining zones.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Mutual TLS (mTLS) with Envoy & SPIFFE Identities",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 Mutual TLS (mTLS) with Envoy & SPIFFE Identities

## 1. Executive Architectural Overview
In traditional perimeter security ("castle-and-moat"), once an attacker bypasses the corporate firewall, the internal network is completely unencrypted. **Zero-Trust Architecture** dictates that all internal service-to-service traffic must be authenticated, authorized, and encrypted.

Service meshes (e.g. Istio, Linkerd) deploy an **Envoy Proxy sidecar** alongside each application container to handle bidirectional mTLS transparently.

---

## 2. SPIFFE Identity Verification
Every workload receives a cryptographically verifiable SPIFFE ID embedded in an X.509 certificate SAN (Subject Alternative Name):
`spiffe://cluster.local/ns/production/sa/payment-service`

When Service A calls Service B:
1. Envoy sidecars execute a mutual TLS handshake.
2. Both sidecars verify certificate signatures against the cluster Root CA.
3. Envoy enforces fine-grained Layer 7 authorization policies before forwarding the request to the application port.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "operating-systems-kernel-architecture",
        "title": "Operating Systems: Kernel Architecture & Process Scheduling",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Hardware Privilege Rings, Traps & Process Scheduling",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Ring 0 vs Ring 3: Syscalls, Interrupts & Traps",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Ring 0 vs Ring 3: Syscalls, Interrupts & Traps

## 1. Executive Architectural Overview
Modern x86-64 and ARM CPUs enforce hardware privilege boundaries to protect memory integrity. In x86 architecture, these boundaries are represented by four privilege rings:
- **Ring 0 (Kernel Mode):** Unrestricted access to hardware, MMU page tables, device I/O ports, and privileged CPU control registers (CR0, CR3).
- **Ring 3 (User Mode):** Restricted environment where user applications execute. Direct hardware access is forbidden.

```
+----------------------------------------------------+
|  User Space (Ring 3)                               |
|  Web Server, PostgreSQL, Python Runtime            |
+-------------------------+--------------------------+
                          |
             `syscall` instruction / Trap
                          |
+-------------------------v--------------------------+
|  Kernel Space (Ring 0)                             |
|  Virtual Memory, CFS Scheduler, Device Drivers     |
+----------------------------------------------------+
```

---

## 2. The Mechanics of a System Call
When an application invokes `write(1, buf, len)`:
1. The standard library places arguments into designated CPU registers (`%rdi`, `%rsi`, `%rdx`).
2. The syscall number (e.g., `1` for `sys_write`) is loaded into `%rax`.
3. The CPU executes the `syscall` assembly instruction.
4. The CPU hardware switches from Ring 3 to Ring 0, saves the user-space Instruction Pointer (`%rip`) and Stack Pointer (`%rsp`), and jumps to the kernel's `system_call_entry` vector table.
5. After validation and execution, the kernel returns via `sysret`, restoring Ring 3 privilege.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Linux Completely Fair Scheduler (CFS) & Red-Black Runqueues",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Linux Completely Fair Scheduler (CFS) & Red-Black Runqueues

## 1. Executive Architectural Overview
How does an operating system allocate CPU cores fairly among thousands of concurrent threads without starving background jobs? The default Linux CPU scheduler is the **Completely Fair Scheduler (CFS)**.

Instead of traditional priority slots or fixed quantum slices, CFS models an "ideal multi-tasking CPU" where each process receives an equal share of compute time proportional to its `nice` priority weight.

---

## 2. Virtual Runtime (`vruntime`) & Red-Black Trees
CFS tracks execution using a metric called **virtual runtime (`vruntime`)**:
$$\\Delta \\text{vruntime} = \\Delta \\text{real\_time} \\times \\frac{\\text{NICE\_0\_LOAD}}{\\text{process\_weight}}$$

All runnable tasks are organized in a self-balancing **Red-Black Tree** ordered by `vruntime`:

```
                 [Task C: vruntime = 45ms]
                        /         \\
     [Task A: vruntime = 20ms]    [Task E: vruntime = 80ms]
             /
  [Leftmost Node: Min vruntime = 12ms]
         |
    CFS Picks Next Task!
```

- CFS always picks the **leftmost node** (the process with the lowest `vruntime`).
- As the process runs, its `vruntime` increases, and it is re-inserted into the tree.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Virtual Memory, Multi-Level Paging & File System Inodes",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 4-Level Page Tables, MMU Hardware & TLB Shootdowns",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 4-Level Page Tables, MMU Hardware & TLB Shootdowns

## 1. Executive Architectural Overview
User applications do not access physical RAM directly; they interact exclusively with **Virtual Addresses**. The hardware Memory Management Unit (MMU) translates virtual addresses to physical memory addresses via multi-level page tables.

---

## 2. 4-Level Paging (x86-64 Architecture)
A 64-bit virtual address is split into indices for four hierarchical tables:
1. **PGD (Page Global Directory):** 9 bits
2. **P4D / PUD (Page Upper Directory):** 9 bits
3. **PMD (Page Middle Directory):** 9 bits
4. **PTE (Page Table Entry):** 9 bits
5. **Page Offset:** 12 bits (representing a standard 4KB physical page)

```
Virtual Address (48-bit Canonical):
[9 bits: PGD] -> [9 bits: PUD] -> [9 bits: PMD] -> [9 bits: PTE] -> [12 bits Offset: Physical RAM]
```

### The Translation Lookaside Buffer (TLB)
Walking a 4-level page table requires four separate RAM fetches for every memory access. To eliminate this overhead, CPUs maintain a high-speed hardware cache called the **Translation Lookaside Buffer (TLB)**.

**TLB Shootdowns:** When a process alters memory mapping across multiple CPU cores, an Inter-Processor Interrupt (IPI) must be sent to flush stale TLB entries across all cores, introducing measurable synchronization latency.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 File System Architecture: Inodes, Extents & Journaling",
                        "duration_minutes": 25,
                        "content_body": """# 2.2 File System Architecture: Inodes, Extents & Journaling

## 1. Executive Architectural Overview
A file name is simply a human-readable pointer in a directory table. The actual metadata of a file on a Linux filesystem (such as ext4 or XFS) is represented by an **Index Node (inode)**.

---

## 2. Inode Structure & Extent Allocation
An inode contains:
- File size, ownership, access permissions, timestamps (`atime`, `mtime`, `ctime`).
- Pointers to physical storage blocks.

Modern filesystems use **Extents** rather than individual block pointers. An extent represents a contiguous range of physical blocks (e.g., "Blocks 5,000 to 5,512"), dramatically shrinking inode metadata size and enabling blazing-fast sequential disk streaming.

---

## 3. Filesystem Journaling: Preventing Corruption
When writing to a file, three operations must complete:
1. Data blocks written to disk.
2. Inode updated with new file size.
3. Allocation bitmap updated to mark blocks as used.

If power fails halfway through, the filesystem becomes corrupt. **Journaling filesystems** write all metadata updates to an append-only journal first, ensuring instant crash consistency on reboot without requiring an hours-long `fsck` scan.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "cloud-computing-architecture",
        "title": "Cloud Computing: Architecting Resilient Microservices",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Cloud Service Models, Elasticity & Global Networking",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 IaaS, PaaS, and Serverless: Architectural Trade-Offs",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 IaaS, PaaS, and Serverless: Architectural Trade-Offs

## 1. Executive Architectural Overview
Cloud engineering is the discipline of selecting the optimal abstraction tier for each workload:
- **IaaS (Infrastructure as a Service - AWS EC2):** Full control over OS kernel, network stack, and disk configuration. High operational overhead.
- **PaaS (Platform as a Service - Google Cloud Run, AWS App Runner):** Container-centric deployment without server management. Automated OS patching.
- **FaaS / Serverless (AWS Lambda):** Event-triggered execution, scale-to-zero economics, but susceptible to cold-start latencies and connection pooling limits.

---

## 2. Decision Matrix: When to Pick Which Model

| Architectural Attribute | IaaS (VMs) | PaaS (Containers) | Serverless (FaaS) |
| :--- | :--- | :--- | :--- |
| **Startup Latency** | Minutes | Seconds | Milliseconds (Warm) / ~300ms (Cold) |
| **Stateful Capabilities** | High (local NVMe, daemon processes) | Medium | Strictly Stateless |
| **Connection Pooling** | Persistent native pools | Persistent native pools | Requires External Proxy (e.g. AWS RDS Proxy) |
| **Cost at Idle** | Fixed continuous hourly cost | Low / Scale to 1 | Pure $0 scale-to-zero |
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Global VPCs, Subnets, Internet Gateways & NAT Traversal",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Global VPCs, Subnets, Internet Gateways & NAT Traversal

## 1. Executive Architectural Overview
Enterprise cloud architectures isolate workloads within a **Virtual Private Cloud (VPC)**. A secure VPC enforces the **3-Tier Subnet Topology**:
1. **Public Subnet:** Hosts public load balancers and NAT Gateways. Direct route to Internet Gateway (`0.0.0.0/0 -> igw`).
2. **Private Application Subnet:** Hosts backend microservices and container workers. Outbound internet access routes through the NAT Gateway. Inbound direct internet traffic is physically impossible.
3. **Database / Data Tier Subnet:** Completely isolated. Zero outbound internet routes. Accessible only from application subnets via security group rules.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: High Availability, Auto-Scaling & Multi-Region Resiliency",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Multi-AZ Deployment, Health Checks & Target Group Probes",
                        "duration_minutes": 25,
                        "content_body": """# 2.1 Multi-AZ Deployment, Health Checks & Target Group Probes

## 1. Executive Architectural Overview
Single-data-center deployments cannot guarantee 99.99% availability. High Availability (HA) requires distributing workloads across at least three distinct physical Availability Zones (AZs) connected by ultra-low-latency redundant fiber optics (< 1ms).

---

## 2. Health Check Probe Design
Load balancers monitor target group instances using periodic HTTP probes. Poorly designed health checks cause cascading cluster outages:
- **Liveness Probes:** Verifies the process is alive. If failed, container runtime restarts the process.
- **Readiness Probes:** Verifies the process can accept traffic (e.g. cache warm, DB connection pool healthy). If failed, load balancer stops routing traffic to the instance without killing it.

**Critical Anti-Pattern:** Never include a downstream database ping in a shallow liveness probe. If the database experiences a momentary hiccup, all application containers will fail liveness simultaneously and enter a restart loop!
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Disaster Recovery Architectures: RTO, RPO & Active-Active Replication",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 Disaster Recovery Architectures: RTO, RPO & Active-Active Replication

## 1. Executive Architectural Overview
Disaster recovery planning evaluates two non-negotiable metrics:
- **RTO (Recovery Time Objective):** Maximum tolerable downtime before the system is restored.
- **RPO (Recovery Point Objective):** Maximum tolerable data loss measured in time (e.g., 5 minutes of transactions).

---

## 2. Disaster Recovery Strategy Spectrum

```
Low Cost / High RTO & RPO                         Zero Downtime / Zero Data Loss
      |                                                        |
[Backup & Restore] -> [Pilot Light] -> [Warm Standby] -> [Multi-Region Active-Active]
```

### Multi-Region Active-Active Architecture
In Active-Active topologies, traffic from Americas, EMEA, and APAC routes to the nearest cloud region via Geo-DNS or Anycast BGP. Databases utilize multi-region masterless replication or conflict-free replicated data types (CRDTs) to resolve concurrent regional mutations without global locking.
"""
                    }
                ]
            }
        ]
    }
]

