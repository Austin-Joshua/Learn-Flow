"""
Curriculum content for Specialized Domains:
React/TypeScript, Deep Learning, Cryptography, Stream Processing, SRE, Web Security, and Mobile Flutter.
Comprehensive, textbook-grade daily reading material with complete code, diagrams, and failure modes.
"""

SPECIALIZED_DOMAINS_COURSES = [
    {
        "slug": "advanced-react-typescript-patterns",
        "title": "Advanced React & Modern TypeScript Patterns",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: React 19 Concurrency & Suspense",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 useTransition, useDeferredValue & Non-Blocking Updates",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 useTransition, useDeferredValue & Non-Blocking Updates

## 1. Executive Architectural Overview
Prior to React 18 and React 19 concurrent features, state updates were synchronous and un-interruptible. When filtering a large table with 10,000 items, computing the new virtual DOM locked the main browser thread for 100ms+, causing dropped animation frames and freezing user input typing.

React Concurrency introduces **Cooperative Scheduling**: rendering work is broken down into small units of work that can be paused, aborted, or yielded back to the browser to handle higher-priority user input.

---

## 2. Production Implementation: Responsive Filter with `useTransition`

```tsx
import React, { useState, useTransition } from 'react';

interface ProductRecord {
  id: string;
  name: string;
  category: string;
  priceCents: number;
}

export const HighThroughputProductSearch: React.FC<{ dataset: ProductRecord[] }> = ({ dataset }) => {
  const [query, setQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<ProductRecord[]>(dataset);
  const [isPending, startTransition] = useTransition();

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    
    // 1. Urgent priority: updates input field immediately with 0ms visual latency
    setQuery(nextVal);

    // 2. Non-blocking transition: React interrupts this if user types another letter!
    startTransition(() => {
      const lower = nextVal.toLowerCase();
      const nextFiltered = dataset.filter(item => 
        item.name.toLowerCase().includes(lower) || 
        item.category.toLowerCase().includes(lower)
      );
      setFilteredResults(nextFiltered);
    });
  };

  return (
    <div className="space-y-4">
      <input
        type="text"
        value={query}
        onChange={handleSearchChange}
        placeholder="Search products..."
        className="w-full px-4 py-2 border rounded-lg"
      />
      {isPending && <span className="text-xs text-sky-500 font-mono">Filtering records...</span>}
      <div className={isPending ? "opacity-60 transition-opacity" : "opacity-100"}>
        {filteredResults.slice(0, 50).map(p => (
          <div key={p.id} className="py-2 border-b">{p.name} - ${p.priceCents / 100}</div>
        ))}
      </div>
    </div>
  );
};
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 React Server Components (RSC) Architecture & Action Boundaries",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 React Server Components (RSC) Architecture & Action Boundaries

## 1. Executive Architectural Overview
Traditional Single Page Applications (SPAs) ship massive JavaScript bundles to the browser client. The client downloads 3MB of JS, renders empty loading spinners, and initiates a secondary cascade of REST/GraphQL API network waterfalls.

**React Server Components (RSC)** invert this paradigm: components execute exclusively on the server, querying databases directly with zero client JavaScript bundle cost.

---

## 2. Server vs Client Component Boundaries
- **Server Components (Default):** Zero bundle impact, direct access to server secrets and databases, no client interactivity (`useState`, `useEffect`).
- **Client Components (`'use client'`):** Hydrated on the client for interactive DOM event listeners and stateful UI.

```
[Browser Client]
       |
       | 1. HTTP Request
       v
[Next.js / Remix Server Runtime]
       |
       +---> [Server Component: Executes SQL / ORM directly]
       |        |
       |        v (Streams HTML + Flight JSON stream)
       +---> [Client Component Leaf Nodes hydrated in browser]
```

### Server Actions: Zero-Boilerplate Mutations
Server Actions allow frontend forms to invoke typed asynchronous server functions directly without manually declaring REST endpoints, serialization routes, or HTTP client boilerplate.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Type-Safe State Architecture & Polymorphism",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Discriminated Unions & Generics in Store Actions",
                        "duration_minutes": 25,
                        "content_body": """# 2.1 Discriminated Unions & Generics in Store Actions

## 1. Executive Architectural Overview
In state management, naive type representations frequently permit **Impossible UI States**:

```typescript
// THE IMPOSSIBLE STATE ANTI-PATTERN
interface BadState<T> {
  isLoading: boolean;
  data: T | null;
  error: Error | null;
}
// What does it mean if isLoading === true AND error !== null AND data !== null?
// The UI code becomes riddled with defensive nested ternaries!
```

---

## 2. The Discriminated Union Solution

```typescript
export type FetchState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

// TypeScript guarantees that when status === 'success', data is non-null!
export function renderState<T>(state: FetchState<T>) {
  switch (state.status) {
    case 'idle':
      return <div>Ready to load.</div>;
    case 'loading':
      return <div>Fetching data...</div>;
    case 'success':
      return <div>Loaded: {JSON.stringify(state.data)}</div>;
    case 'error':
      return <div>Error: {state.error.message}</div>;
  }
}
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Compound Component Patterns & Type-Safe Polymorphic Slots",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 Compound Component Patterns & Type-Safe Polymorphic Slots

## 1. Executive Architectural Overview
Building reusable enterprise design systems requires flexible composition without "prop-drilling hell". The **Compound Component Pattern** allows components to communicate implicitly through React Context while giving consumers full layout freedom.

---

## 2. Production Implementation: Type-Safe Accordion

```tsx
import React, { createContext, useContext, useState } from 'react';

interface AccordionContextType {
  openId: string | null;
  toggle: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

export const Accordion: React.FC<{ children: React.ReactNode }> & {
  Item: React.FC<{ id: string; children: React.ReactNode }>;
  Header: React.FC<{ children: React.ReactNode }>;
  Content: React.FC<{ children: React.ReactNode }>;
} = ({ children }) => {
  const [openId, setOpenId] = useState<string | null>(null);
  const toggle = (id: string) => setOpenId(prev => (prev === id ? null : id));

  return (
    <AccordionContext.Provider value={{ openId, toggle }}>
      <div className="border rounded-xl divide-y">{children}</div>
    </AccordionContext.Provider>
  );
};
```
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "deep-learning-systems-neural-architectures",
        "title": "Deep Learning Systems & Neural Architectures",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Attention Mechanisms & KV Cache Architecture",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Scaled Dot-Product Attention & FlashAttention Memory Bound Analysis",
                        "duration_minutes": 35,
                        "content_body": """# 1.1 Scaled Dot-Product Attention & FlashAttention Memory Bound Analysis

## 1. Executive Architectural Overview
The standard Transformer attention mechanism computes:
$$\\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right) V$$
For a sequence of length $N$, computing the intermediate attention matrix $S = QK^T$ requires $O(N^2)$ memory storage.

---

## 2. The IO Memory Wall & FlashAttention
GPU computation is bound not by FLOPS, but by High Bandwidth Memory (HBM) bandwidth. Standard attention reads and writes the $N \\times N$ matrix to GPU HBM multiple times during softmax computation.

**FlashAttention** utilizes **Tiling (Online Softmax)**:
- Loads blocks of $Q, K, V$ into the GPU's ultra-fast SRAM (~19TB/s).
- Computes softmax incrementally using the online rescaling trick without materializing the $N \\times N$ matrix in slow HBM.
- Drops peak memory consumption from quadratic $O(N^2)$ to linear $O(N)$.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Rotary Position Embeddings (RoPE) & PagedAttention Mechanics",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Rotary Position Embeddings (RoPE) & PagedAttention Mechanics

## 1. Key-Value (KV) Cache Bottleneck in LLM Serving
During autoregressive text generation, past tokens do not need to be recomputed, but their Key and Value tensors must be preserved in GPU memory. For large models (70B), the KV cache consumes up to 80% of total GPU VRAM.

---

## 2. PagedAttention Mechanics (vLLM Architecture)
Traditional serving frameworks pre-allocated contiguous memory for the maximum possible sequence length (e.g. 4096 tokens). If a prompt only generated 100 tokens, 97% of allocated VRAM was wasted in internal fragmentation.

**PagedAttention** mirrors operating system virtual memory paging:
- KV cache tensors are partitioned into non-contiguous physical memory blocks (typically 16 tokens per block).
- A logical block table translates logical token positions to physical GPU memory addresses.
- Drops memory waste from 60-80% down to under 4%, boosting LLM serving throughput by 2x to 4x.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Distributed Training & Model Sharding",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 ZeRO (Zero Redundancy Optimizer) Memory Partitioning",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 ZeRO (Zero Redundancy Optimizer) Memory Partitioning

## 1. Executive Architectural Overview
Training a 175-billion parameter model requires over 1.4 Terabytes of GPU memory. Standard Data Parallelism (DDP) replicates model parameters, gradients, and optimizer states across every GPU, wasting immense VRAM.

**ZeRO (Zero Redundancy Optimizer)** eliminates memory duplication across 3 stages:
- **ZeRO-1:** Partitions optimizer states (Adam momentum & variance) across GPUs (4x memory reduction).
- **ZeRO-2:** Partitions gradients across GPUs (8x memory reduction).
- **ZeRO-3:** Partitions model weights across GPUs, fetching layers on the fly via All-Gather operations.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Pipeline Parallelism, 3D Tensor Parallelism & All-Reduce Topologies",
                        "duration_minutes": 35,
                        "content_body": """# 2.2 Pipeline Parallelism, 3D Tensor Parallelism & All-Reduce Topologies

## 1. Executive Architectural Overview
Scaling training across thousands of GPUs combines three orthogonal parallelism axes (**3D Parallelism**):
1. **Tensor Parallelism (Megatron-LM):** Splits individual matrix multiplications across GPUs within the same NVLink node.
2. **Pipeline Parallelism:** Partitions model layers sequentially across nodes using micro-batching.
3. **Data Parallelism:** Distributes independent batches across distinct GPU clusters.

---

## 2. Ring All-Reduce Topology
In distributed gradient aggregation, naive centralized parameter servers saturate network bandwidth. **Ring All-Reduce** organizes $P$ GPUs into a logical ring:
- Each GPU communicates exclusively with its immediate successor and predecessor.
- Total data transmitted per GPU is strictly independent of cluster size: $2 \\times \\frac{P-1}{P} \\times \\text{ModelSize}$.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "applied-cryptography-zero-knowledge",
        "title": "Applied Cryptography & Zero-Knowledge Protocols",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Elliptic Curve Mechanics & ECDSA",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Elliptic Curve Discrete Logarithms & Point Multiplication",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Elliptic Curve Discrete Logarithms & Point Multiplication

## 1. Executive Mathematical Overview
Modern asymmetric cryptography relies on Weierstrass elliptic curves defined over a finite field $\\mathbb{F}_p$:
$$y^2 \\equiv x^3 + ax + b \\pmod p$$

Point addition ($P + Q$) and point doubling ($2P$) form an abelian group. Given a generator point $G$ and an integer scalar $k$, computing the public key $K = kG$ via double-and-add is computationally trivial ($O(\\log k)$).

However, given $K$ and $G$, computing the scalar $k$ (the **Elliptic Curve Discrete Logarithm Problem - ECDLP**) is computationally intractable with classical computers ($O(\\sqrt{p})$).
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Constant-Time Implementation & Side-Channel Attack Defense",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Constant-Time Implementation & Side-Channel Attack Defense

## 1. Side-Channel Attacks Explained
A cryptographic algorithm may be mathematically unbreakable, but if its execution time varies depending on whether a bit is `0` or `1`, an attacker monitoring CPU cache latency or power consumption can extract the private key.

---

## 2. Constant-Time Code Invariant
Never use conditional branching based on secret keys:

```c
// VULNERABLE: Leaks timing information based on secret bit
if (secret_bit == 1) {
    point_add(&R, &P);
}

// CONSTANT-TIME SAFE: Arithmetic masking executes identical CPU cycles
uint64_t mask = -(uint64_t)secret_bit; // 0x00000000 or 0xFFFFFFFF
R.x = (R.x & ~mask) | (P.x & mask);
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Zero-Knowledge Proofs & SNARKs",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Arithmetic Circuits, R1CS & QAP Formulations",
                        "duration_minutes": 35,
                        "content_body": """# 2.1 Arithmetic Circuits, R1CS & QAP Formulations

## 1. Executive Architectural Overview
A **Zero-Knowledge Proof (ZKP)** allows a Prover to convince a Verifier that a computational statement is true without revealing any secret input (witness).

Computation is converted into verifiable cryptographic equations through:
1. **Arithmetic Circuit:** Addition and multiplication gates over a finite field.
2. **R1CS (Rank-1 Constraint System):** System of vector equations $(A \\cdot s) \\times (B \\cdot s) = C \\cdot s$.
3. **QAP (Quadratic Arithmetic Program):** Polynomial representation verified via elliptic curve pairings.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Groth16 vs PLONK Proof Systems & Trusted Setups",
                        "duration_minutes": 35,
                        "content_body": """# 2.2 Groth16 vs PLONK Proof Systems & Trusted Setups

## 1. Executive Architectural Overview
Zero-Knowledge Succinct Non-Interactive Arguments of Knowledge (zk-SNARKs) allow verifiers to validate complex state transitions in milliseconds without re-executing computations. The design trade-offs between modern proving systems revolve around proof size, proving time, and setup ceremonies.

---

## 2. Comparative Architecture

| Proof System | Proof Size | Verification Time | Trusted Setup Type | Post-Quantum Safe |
| :--- | :--- | :--- | :--- | :--- |
| **Groth16** | 128 bytes (3 group elements) | ~2ms (3 pairings) | Circuit-specific Ceremony (Must re-run on any bugfix!) | No |
| **PLONK** | ~400-800 bytes | ~5ms | Universal and Updateable Setup (Run once for all circuits) | No |
| **STARKs** | ~40-100 KB | ~10-20ms | Transparent (No Trusted Setup, Collision-Resistant Hashes) | Yes |

---

## 3. Trusted Setup Ceremonies & Powers-of-Tau
In pairing-based SNARKs, generating the structured reference string (SRS) requires evaluating polynomials at a secret toxic waste trapdoor $\\tau$:
$$\\text{SRS} = \\{G, \\tau G, \\tau^2 G, \\dots, \\tau^d G\\}$$
If a single participant in a multi-party computation (MPC) ceremony discards their random share of $\\tau$, the ceremony is cryptographically secure. While Groth16 requires a new ceremony for every individual circuit modification, PLONK utilizes a universal SRS up to degree $d$.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "realtime-data-engineering-stream-processing",
        "title": "Real-Time Data Engineering & Stream Processing",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Distributed Partitioned Logs & Rebalance Protocols",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Append-Only Logs, Partition Routing, and Zero-Copy I/O",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Append-Only Logs, Partition Routing, and Zero-Copy I/O

## 1. Executive Architectural Overview
Apache Kafka and distributed event logs achieve gigabit-per-second throughput per node by relying on two architectural invariants:
1. **Sequential Append-Only Writes:** Sequential disk I/O avoids rotational and seek latencies, matching raw disk controller bandwidth.
2. **Zero-Copy Network Transfers (`sendfile` system call):** Data transfers directly from OS Page Cache to the network socket descriptor without being copied into user space memory.

```
Standard Read/Write:
Disk -> Kernel Page Cache -> User Space Buffer -> Socket Buffer -> Network NIC (4 Copies, 4 Context Switches)

Zero-Copy `sendfile`:
Disk -> Kernel Page Cache -----------------------------------------> Network NIC (Zero CPU Copies!)
```

---

## 2. Partition Key Routing
When a producer writes an event, partition assignment is determined by MurmurHash2:
$$\\text{partition} = \\text{toPositive}(\\text{murmur2}(\\text{key})) \\pmod{\\text{numPartitions}}$$
Providing a deterministic key (e.g. `user_id` or `order_id`) guarantees that all events for that specific entity are appended in strict chronological order to the same physical partition.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Consumer Group Rebalance Protocols & Sticky Assignors",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Consumer Group Rebalance Protocols & Sticky Assignors

## 1. Consumer Group Coordination
When consumer instances join or leave a consumer group, partitions must be reassigned across available workers. Traditional **Eager Rebalance** revoked all partitions from all consumers simultaneously, causing a Stop-The-World processing pause across the entire cluster.

---

## 2. Cooperative Sticky Assignors
Modern **Cooperative Sticky Assignors** execute rebalancing in two incremental phases:
1. Consumers continue processing un-migrated partitions without interruption.
2. Only the specific partitions moving between consumer instances are revoked and reassigned.

This eliminates 95% of consumer processing downtime during horizontal auto-scaling events or rolling pod deployments.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Stream Processing, Watermarks & State Stores",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Event-Time Processing, Watermarks & Late Data Handling",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 Event-Time Processing, Watermarks & Late Data Handling

## 1. Event Time vs Processing Time
In stream analytics, mobile network drops and intermittent client connectivity cause messages to arrive hours after they occurred. Window aggregations based on arrival time (Processing Time) produce skewed, invalid metrics.

---

## 2. Watermark Mechanics in Apache Flink
**Event-Time Processing** buckets events according to the timestamp embedded in the event itself. **Watermarks** provide a temporal heuristic asserting:
$$\\text{Watermark}(W): \\text{All events with event\_timestamp } t < W \\text{ are assumed to have arrived.}$$

When a watermark $W$ passes the end of a tumbling window $[10:00, 10:05)$, the stream engine triggers the window aggregation calculation. Late-arriving events that fall behind the watermark are either redirected to a Dead Letter Queue or processed via bounded allowed lateness state.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Exactly-Once Semantics (EOS) & Two-Phase Commit in Stream Engines",
                        "duration_minutes": 35,
                        "content_body": """# 2.2 Exactly-Once Semantics (EOS) & Two-Phase Commit in Stream Engines

## 1. Exactly-Once Processing Invariant
End-to-end exactly-once processing (e.g. Apache Flink, Kafka Streams) is achieved through distributed snapshotting (Chandy-Lamport algorithm) coupled with Two-Phase Commit transaction producers.

State checkpoints capture consistent distributed snapshots to durable storage (e.g. AWS S3), guaranteeing that on worker failure, stream offsets rewind to the exact point of the committed transaction without duplicate side-effects.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "production-sre-devsecops",
        "title": "Production Site Reliability Engineering & DevSecOps",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Service Level Objectives & Error Budgets",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 SLI/SLO Math, Multi-Window Multi-Burn Rate Alerts",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 SLI/SLO Math, Multi-Window Multi-Burn Rate Alerts

## 1. Executive SRE Overview
Site Reliability Engineering quantifies reliability through mathematical agreements:
- **SLI (Service Level Indicator):** A quantifiable metric of performance: $\\frac{\\text{Good Events}}{\\text{Total Valid Events}} \\times 100\\%$.
- **SLO (Service Level Objective):** Target reliability agreed with stakeholders (e.g., $99.9\\%$ over 30 days).
- **Error Budget:** Tolerable failure: $100\\% - \\text{SLO} = 0.1\\%$.

---

## 2. Multi-Window Multi-Burn Rate Alerting
Traditional threshold alerts trigger false positives during low-traffic nights. Multi-burn rate alerting measures how rapidly the error budget is being consumed over both short (1 hour) and long (6 hour) rolling windows.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Incident Command Systems & Post-Mortem Blameless Culture",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Incident Command Systems & Post-Mortem Blameless Culture

## 1. Blameless Post-Mortem Principles
Humans make mistakes when systems fail to provide adequate guardrails. Blameless post-mortems analyze root systemic causes—missing validation, unclear documentation, lack of automated rollbacks—rather than punishing individuals.

---

## 2. Standard Incident Command Roles
1. **Incident Commander (IC):** Drives the triage process, delegates tasks, and maintains overall situational awareness.
2. **Operations Lead:** Executes diagnostics, applies mitigation runbooks, and inspects metrics.
3. **Communications Lead:** Updates external status pages and internal executive stakeholders.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Automated Canary Deployments & Resilient Networking",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Canary Analysis, Statistical Mann-Whitney U Tests & Automated Rollbacks",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 Canary Analysis, Statistical Mann-Whitney U Tests & Automated Rollbacks

## 1. Automated Canary Analysis (ACA)
Deploying new code to 100% of servers at once invites catastrophic outages. Canary deployments route 2% of traffic to the new revision, using statistical tests (Mann-Whitney U) to compare error rates against the baseline version before auto-promoting.

```
[Incoming User Traffic]
           |
     [Envoy Router]
      /          \\
    98%           2%
    /              \\
[Baseline v1]    [Canary v2]
    |                 |
    +-----> [Statistical Metric Comparison] -----> (Anomaly Detected? Auto-Rollback in 10s!)
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Circuit Breakers, Exponential Backoff & Adaptive Jitter",
                        "duration_minutes": 25,
                        "content_body": """# 2.2 Circuit Breakers, Exponential Backoff & Adaptive Jitter

## 1. Full Jitter Exponential Backoff Formula
Retrying failed network requests without jitter causes synchronization spikes where thousands of clients retry at the exact same second:
$$t = \\text{rand}\\left(0, \\min(\\text{max\_backoff}, \\text{base} \\times 2^{\\text{attempt}})\\right)$$
Adding randomized full jitter distributes retries uniformly across the time horizon, allowing overloaded database and backend servers to recover gracefully.

---

## 2. Circuit Breaker State Transition Invariants
- **CLOSED:** Sockets execute normally. Errors increment failure counter.
- **OPEN:** If error threshold exceeds 50% over a 10-second sliding window, trip immediately to OPEN. Calls fail-fast in 0ms without hitting the downstream server!
- **HALF-OPEN:** After a 15-second cooldown, allow a single probe request. If successful, reset to CLOSED; if failed, return to OPEN.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "web-security-defense",
        "title": "Modern Web Security & Penetration Testing Protocols",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Injection Defenses & Web Application Boundaries",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Cross-Site Scripting (XSS) Defenses & Content Security Policy (CSP)",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Cross-Site Scripting (XSS) Defenses & Content Security Policy (CSP)

## 1. Executive Security Overview
Cross-Site Scripting (XSS) occurs when untrusted input is injected directly into browser DOM execution contexts without sanitization.

---

## 2. Content Security Policy (CSP) Level 3
A strict CSP blocks inline script execution and restricts script sources:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'nonce-rAnd0m123'; object-src 'none'; base-uri 'none';
```
Even if an attacker injects a `<script>` tag into the DOM, the browser refuses execution unless the tag contains the matching cryptographic nonce!
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 SQL Injection & Parameterized Query Mechanics",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 SQL Injection & Parameterized Query Mechanics

## 1. The Separation of Code and Data
SQL Injection occurs when user input is concatenated into the SQL statement string. Parameterized queries enforce physical separation in the database query parser: the query plan is compiled first, and user inputs are passed as inert data values that can never alter query syntax.

```python
# VULNERABLE: Direct string formatting allows SQL Injection
query = f"SELECT * FROM users WHERE email = '{email}'"

# SECURE: Prepared statement with bound parameter placeholders
query = "SELECT * FROM users WHERE email = :email"
db.execute(text(query), {"email": email})
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Modern Auth Hardening: CSRF, CORS & Session Hijacking",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Cross-Site Request Forgery (CSRF) & SameSite Cookie Semantics",
                        "duration_minutes": 25,
                        "content_body": """# 2.1 Cross-Site Request Forgery (CSRF) & SameSite Cookie Semantics

## 1. SameSite Cookie Invariants
By configuring authentication cookies with `SameSite=Lax` or `SameSite=Strict`, browsers withhold session cookies during cross-site POST requests initiated from malicious third-party origins, neutralizing CSRF attacks at the protocol level.

```http
Set-Cookie: access_token=eyJhb...; Path=/; HttpOnly; Secure; SameSite=Lax
```

---

## 2. Double-Submit Cookie Pattern
For Single Page Applications communicating via AJAX with microservices across distinct domains, the Double-Submit Cookie pattern pairs a cryptographic CSRF token in an HTTP header (`X-CSRF-Token`) with an unreadable cookie, verifying equality on every state-changing mutation.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 CORS Preflight Requests, Origin Headers & Token Rotation",
                        "duration_minutes": 25,
                        "content_body": """# 2.2 CORS Preflight Requests, Origin Headers & Token Rotation

## 1. Cross-Origin Resource Sharing (CORS) Security
CORS is not a security measure that protects the server; it is a browser mechanism that protects the client. Never configure `Access-Control-Allow-Origin: *` in combination with `Access-Control-Allow-Credentials: true`.

---

## 2. RFC 6819 Refresh Token Rotation
To defend against token theft, every time a client exchanges a refresh token for a new access token, the old refresh token is invalidated immediately and replaced with a fresh token. If an invalidated refresh token is ever presented again (replay detection), the entire token family is immediately revoked!
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "mobile-flutter-reactive-architecture",
        "title": "Mobile Engineering with Flutter & Reactive Architecture",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: The Flutter Rendering Pipeline & Widget Trees",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Widget, Element, and RenderObject Triplets",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Widget, Element, and RenderObject Triplets

## 1. Executive Architectural Overview
Flutter renders directly to the GPU via Skia / Impeller. The Flutter framework maintains three parallel trees:
1. **Widget Tree:** Immutable blueprints rebuilt on every state change.
2. **Element Tree:** Lifecycle manager that diffs widgets and preserves state.
3. **RenderObject Tree:** Handles actual layout constraints, geometry, and GPU draw calls.

```
[Widget: Container]  --->  [Element: ComponentElement]  --->  [RenderObject: RenderBox]
  (Rebuilt frequently)         (Retained in memory)              (Calculates pixels)
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Custom Painters, Layout Constraints & 120 FPS Rendering",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Custom Painters, Layout Constraints & 120 FPS Rendering

## 1. Flutter Layout Rule
*"Constraints go down. Sizes go up. Parent sets position."*

1. A parent passes BoxConstraints (min/max width, min/max height) to its child.
2. The child decides its own size within those boundaries.
3. The parent positions the child within the parent's coordinate space.

---

## 2. High-Performance Custom Painting
For charts and custom canvas rendering, subclassing `CustomPainter` allows direct commands to the GPU canvas. Always override `shouldRepaint` to return `false` unless the underlying telemetry model has mutated, preventing unnecessary 120 FPS frame drops.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: State Management & Offline-First Persistence",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Reactive Streams, BLoC Pattern & Optimistic UI Updates",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 Reactive Streams, BLoC Pattern & Optimistic UI Updates

## 1. The BLoC (Business Logic Component) Pattern
BLoC cleanly separates UI presentation from business logic using Dart asynchronous Streams (`StreamController`).

```dart
// Event In -> BLoC Transformation -> State Out
abstract class CartEvent {}
class AddItemEvent extends CartEvent { final Product item; AddItemEvent(this.item); }

abstract class CartState {}
class CartLoadedState extends CartState { final List<Product> items; CartLoadedState(this.items); }
```

---

## 2. Optimistic UI Updates
When a user marks a lesson as complete, the mobile UI updates the progress ring immediately (0ms latency), while an asynchronous background event streams to the backend server with automatic retry logic on network disconnection.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 SQLite / Isar Local Storage & Background Synchronization",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 SQLite / Isar Local Storage & Background Synchronization

## 1. Offline-First Mobile Invariant
Mobile apps must display immediately even in airplane mode. All remote API updates are written to a local database (SQLite/Isar) first, with background synchronization engines handling bi-directional replication and conflict resolution.

---

## 2. Conflict Resolution Strategies
When an offline device reconnects with edits that conflict with the server state, mobile engines apply **Last-Write-Wins (LWW)** using monotonic timestamps or **Operational Transformation (OT) / CRDTs** for collaborative text editing.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "live-verification-course-live-verify-0c7a1c",
        "title": "Live Verification Course live-verify-0c7a1c",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Automated Integration Verifications & Quality Gates",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 End-to-End Verification Pipeline & Integration Health",
                        "duration_minutes": 20,
                        "content_body": """# 1.1 End-to-End Verification Pipeline & Integration Health

## 1. Executive Overview
This lesson verifies the automated test harness, database transactional boundaries, and curriculum rendering pipeline within Learnflow LMS.

---

## 2. Continuous Quality Invariants
- Zero regression tolerance.
- Full type-safety across TypeScript and Python Pydantic schemas.
- Non-blocking asynchronous I/O across all API endpoints.
- Continuous automated integration testing with Dockerized PostgreSQL and Redis backends.
"""
                    }
                ]
            }
        ]
    }
]
