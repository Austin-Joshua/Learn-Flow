"""
Curriculum content for Core Computer Science: DSA, OOP, Compilers, and Networks.
Comprehensive, textbook-grade daily reading material with complete code and architecture.
"""

COMPUTER_SCIENCE_CORE_COURSES = [
    {
        "slug": "dsa-algorithmic-analysis",
        "title": "Data Structures & Algorithmic Analysis",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Asymptotic Complexity & Dynamic Array Internals",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Big-O, Big-Theta, Big-Omega & Amortized Doubling Analysis",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Big-O, Big-Theta, Big-Omega & Amortized Doubling Analysis

## 1. Executive Theoretical Overview
Algorithmic analysis measures how time and memory requirements scale as input size $N \\to \\infty$, independent of specific hardware clock speeds:
- **$O(g(N))$ (Big-O):** Asymptotic upper bound (worst-case execution boundary).
- **$\\Omega(g(N))$ (Big-Omega):** Asymptotic lower bound (best-case execution boundary).
- **$\\Theta(g(N))$ (Big-Theta):** Asymptotically tight bound (both upper and lower).

---

## 2. Dynamic Array Geometric Resizing & Amortized $O(1)$
A dynamic array (e.g. Python `list`, C++ `std::vector`, Java `ArrayList`) allocates contiguous memory on the heap. When full, appending an element requires:
1. Allocating a new memory buffer of size $2N$.
2. Copying all $N$ existing elements to the new buffer ($O(N)$ work).
3. Deallocating the old buffer.

### The Accounting Proof for Amortized $O(1)$
Why does appending to a dynamic array still count as $O(1)$?
Consider starting from capacity 1 and inserting $N$ items. Resizing occurs at powers of 2:
$$\\text{Total Copy Operations} = 1 + 2 + 4 + 8 + \\dots + \\frac{N}{2} = N - 1$$
Adding the $N$ insertions yields $2N - 1$ total operations for $N$ appends:
$$\\text{Amortized Cost per Append} = \\frac{2N - 1}{N} < 2 = O(1)$$

---

## 3. Production Implementation: Custom Resizable Array in C

```c
#include <stdlib.h>
#include <stdio.h>
#include <assert.h>

typedef struct {
    int *data;
    size_t size;
    size_t capacity;
} Vector;

Vector* vector_create(size_t initial_capacity) {
    Vector *v = (Vector*)malloc(sizeof(Vector));
    v->size = 0;
    v->capacity = initial_capacity ? initial_capacity : 4;
    v->data = (int*)malloc(v->capacity * sizeof(int));
    return v;
}

void vector_push(Vector *v, int val) {
    if (v->size == v->capacity) {
        // Geometric doubling invariant prevents O(N^2) reallocation thrashing
        size_t new_cap = v->capacity * 2;
        int *new_data = (int*)realloc(v->data, new_cap * sizeof(int));
        assert(new_data != NULL);
        v->data = new_data;
        v->capacity = new_cap;
    }
    v->data[v->size++] = val;
}

void vector_free(Vector *v) {
    free(v->data);
    free(v);
}
```

---

## 4. Key Takeaways & Daily Mental Model
- Always prefer geometric doubling ($2\\times$ or $1.5\\times$) over arithmetic growth ($N + K$). Arithmetic growth results in $O(N^2)$ cumulative copying cost.
- Pre-allocate capacity when input size is known in advance via `reserve()` to avoid intermediate memory copies.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Cache Locality: Contiguous Arrays vs Pointer-Linked Nodes",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Cache Locality: Contiguous Arrays vs Pointer-Linked Nodes

## 1. Physical Hardware Realities: L1/L2 Cache Lines
On paper, a Linked List provides $O(1)$ insertion at the head, whereas an array requires $O(N)$ shifts. In modern hardware, however, traversing a linked list is up to **50x slower** than traversing an array of the same size.

Why? **CPU Cache Locality**:
- Modern CPUs fetch data from RAM in 64-byte chunks called **Cache Lines**.
- Contiguous arrays enjoy spatial locality: fetching `array[0]` automatically loads `array[1]` through `array[7]` into the ultra-fast L1 cache (latency ~1ns).
- In a Linked List, each node is allocated independently on the heap. Following `node.next` requires random memory access (latency ~60-100ns per node), causing continuous **L1 Cache Misses**.

```
Contiguous Array (Optimal Cache Utilization):
[Elem 0 | Elem 1 | Elem 2 | Elem 3 | Elem 4 | Elem 5 | Elem 6 | Elem 7]
<----------------------- 1 Single 64-byte Cache Line Fetch ---------------------->

Linked List (Scattered Heap Locations):
[Node 0] -> (RAM Miss!) -> [Node 1] -> (RAM Miss!) -> [Node 2]
```

---

## 2. Comparative Benchmark Matrix

| Feature | Dynamic Array (`std::vector`) | Doubly Linked List (`std::list`) |
| :--- | :--- | :--- |
| **Sequential Scan Latency** | Ultra-Fast (~1 cycle/elem via SIMD) | Slow (Stalls on pointer dereference) |
| **Per-Element Memory Overhead** | 0 bytes overhead | 16-24 bytes (`prev`, `next` pointers) |
| **Hardware Pre-fetching** | Automatic CPU Stream Pre-fetch | Fails completely due to random memory jumps |
| **Middle Insertion Cost** | $O(N)$ memory move | $O(1)$ once pointer is located, but finding is $O(N)$ |

---

## 3. Daily Engineering Takeaway
Default to arrays and contiguous vectors for 99% of data storage needs. Only reach for pointer-linked structures if node address stability is an absolute requirement.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Balanced Search Trees, Hash Maps & Graph Traversal",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Hash Table Collision Resolution: Open Addressing vs Chaining",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 Hash Table Collision Resolution: Open Addressing vs Chaining

## 1. Executive Architectural Overview
A Hash Table maps arbitrary keys to bucket indices using a hash function:
$$\\text{index} = \\text{hash}(\\text{key}) \\pmod{\\text{capacity}}$$
By the Pigeonhole Principle, collisions are mathematically inevitable.

---

## 2. Collision Strategies
1. **Separate Chaining (Java `HashMap`):** Each bucket is a linked list or red-black tree. Degradation under high load factor is graceful, but pointer chasing hurts cache locality.
2. **Open Addressing / Linear Probing (Python `dict`, Google SwissTable):** All entries reside directly in a contiguous array. On collision, probe subsequent slots (`index + 1`). Offers incredible CPU cache performance, but susceptible to primary clustering when load factor $> 0.7$.

```
Separate Chaining:
Bucket 0 -> [KeyA: ValA] -> [KeyB: ValB] -> NULL
Bucket 1 -> NULL
Bucket 2 -> [KeyC: ValC] -> NULL

Open Addressing (Linear Probing):
Slot 0: [KeyA: ValA]
Slot 1: [KeyB: ValB] (Placed here because Slot 0 collided!)
Slot 2: [KeyC: ValC]
```

---

## 3. Production Implementation: Robin Hood Hashing Principle
Robin Hood hashing is an open-addressing optimization: when inserting, if the incoming element has probed further from its ideal bucket than the element currently occupying the slot, the newcomer "steals from the rich and gives to the poor" by taking the slot and pushing the existing element forward. This minimizes search variance across all lookups.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Graph Shortest Path: Dijkstra, A* Heuristics & Priority Queues",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 Graph Shortest Path: Dijkstra, A* Heuristics & Priority Queues

## 1. Executive Architectural Overview
Shortest path calculation across weighted graphs is foundational to internet packet routing (OSPF), GPS navigation, and network latency optimization.

---

## 2. Dijkstra's Algorithm with Min-Heap
Using a binary min-heap priority queue, Dijkstra computes the single-source shortest path in $O((V + E) \\log V)$ time:

```python
import heapq
from typing import Dict, List, Tuple

def dijkstra(graph: Dict[str, List[Tuple[str, int]]], source: str) -> Dict[str, int]:
    \"\"\"
    Computes shortest distances from source to all reachable nodes.
    Invariant: Non-negative edge weights only.
    \"\"\"
    distances = {node: float("inf") for node in graph}
    distances[source] = 0
    pq = [(0, source)]  # (distance, node)

    while pq:
        curr_dist, u = heapq.heappop(pq)
        
        # If we found a shorter route to u already, skip stale heap entries
        if curr_dist > distances[u]:
            continue

        for v, weight in graph[u]:
            dist = curr_dist + weight
            if dist < distances[v]:
                distances[v] = dist
                heapq.heappush(pq, (dist, v))

    return distances
```

---

## 3. A* Search: Adding Goal-Directed Heuristics
Dijkstra explores radially in all directions like a circle. **A* Search** directs the search frontier toward the destination node by adding an admissible heuristic $h(n)$ (such as Euclidean straight-line distance):
$$f(n) = g(n) + h(n)$$
Where $g(n)$ is the exact cost from start to $n$, and $h(n)$ is the estimated remaining distance. This reduces explored search nodes by up to 90%.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "oop-principles-design-patterns",
        "title": "Object-Oriented Programming & Clean Architecture",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: The Core Pillars & The Composition Invariant",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Encapsulation, State Validation & Class Invariants",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 Encapsulation, State Validation & Class Invariants

## 1. Executive Architectural Overview
Encapsulation is not merely hiding variables behind getter and setter methods. Encapsulation is the architectural guarantee that an object **never enters an invalid state**. A class is a guardian of its invariants.

---

## 2. Defending Class Invariants in Production

```typescript
export class Money {
  private readonly cents: number;
  private readonly currency: string;

  constructor(cents: number, currency: string) {
    if (!Number.isInteger(cents) || cents < 0) {
      throw new Error("Money amount must be a non-negative integer.");
    }
    if (!/^[A-Z]{3}$/.test(currency)) {
      throw new Error("Invalid ISO-4217 currency code.");
    }
    this.cents = cents;
    this.currency = currency;
  }

  public add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new Error(`Cannot add mismatched currencies: ${this.currency} and ${other.currency}`);
    }
    return new Money(this.cents + other.cents, this.currency);
  }

  public getCents(): number {
    return this.cents;
  }
}
```

By making attributes `readonly` and returning new instances from mathematical operations, `Money` is an immutable Value Object that cannot be corrupted by concurrent callers.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Composition Over Inheritance: Defending Against Fragile Base Classes",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Composition Over Inheritance: Defending Against Fragile Base Classes

## 1. The Fragile Base Class Problem
Deep inheritance hierarchies (`class AdminUser extends StandardUser extends BaseUser extends Entity`) tightly couple child classes to implementation details of parent classes. An innocent change in a base class method silently breaks subclasses across the codebase.

---

## 2. The Composition Solution
Favor object composition (HAS-A) over class inheritance (IS-A). Inject behavior through explicit interfaces:

```typescript
// BAD INHERITANCE: Rigid and fragile
class LoggingReportGenerator extends BaseReportGenerator {
  // Inherits 40 methods it doesn't need
}

// CLEAN COMPOSITION: Pluggable and testable
interface Logger {
  log(msg: string): void;
}

interface Exporter {
  export(data: ReportData): Buffer;
}

export class CleanReportService {
  constructor(
    private readonly logger: Logger,
    private readonly exporter: Exporter
  ) {}

  public generate(data: ReportData): Buffer {
    this.logger.log("Generating report...");
    return this.exporter.export(data);
  }
}
```

---

## 3. Daily Mental Model
- Use inheritance only for true polymorphic substitutability (subtyping), never for mere code reuse.
- Keep inheritance trees shallow ($\le 2$ levels). If you need functionality, compose it as a dependency.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: SOLID Principles & Essential GoF Patterns",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 The SOLID Framework in Real-World Code",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 The SOLID Framework in Real-World Code

## 1. Executive Architectural Overview
The SOLID principles formulate guidelines for creating maintainable, decoupled object-oriented systems:
1. **Single Responsibility Principle (SRP):** A module should have one, and only one, reason to change.
2. **Open/Closed Principle (OCP):** Software entities should be open for extension, but closed for modification.
3. **Liskov Substitution Principle (LSP):** Subtypes must be substitutable for their base types without altering correctness.
4. **Interface Segregation Principle (ISP):** Clients should not be forced to depend upon interfaces they do not use.
5. **Dependency Inversion Principle (DIP):** High-level modules should depend on abstractions, not on concrete implementations.

---

## 2. Concrete DIP Violation & Refactoring

```typescript
// VIOLATION: High-level OrderProcessor depends on concrete MySQLConnection
class BadOrderProcessor {
  private db = new MySQLConnection();
}

// CLEAN DIP: High-level module depends on OrderRepository interface
interface OrderRepository {
  save(order: Order): Promise<void>;
}

class CleanOrderProcessor {
  constructor(private readonly repo: OrderRepository) {}
  
  async process(order: Order) {
    // Works with Postgres, DynamoDB, or In-Memory Mock during unit tests!
    await this.repo.save(order);
  }
}
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Strategy, Observer & Factory Patterns in Practice",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 Strategy, Observer & Factory Patterns in Practice

## 1. Executive Architectural Overview
Design patterns are battle-tested templates for solving recurring object-oriented problems:
- **Strategy Pattern:** Encapsulates interchangeable algorithms behind a shared interface, eliminating complex `switch/case` statements.
- **Observer Pattern:** Defines a one-to-many event notification system (foundation of event buses and state stores).
- **Factory Pattern:** Encapsulates complex object creation, decoupling caller code from concrete constructors.

---

## 2. Production Strategy Pattern for Payment Gateways

```typescript
export interface PaymentStrategy {
  charge(amountCents: number, currency: string): Promise<string>;
}

export class StripeStrategy implements PaymentStrategy {
  async charge(amountCents: number, currency: string): Promise<string> {
    return "stripe_ch_99218";
  }
}

export class PayPalStrategy implements PaymentStrategy {
  async charge(amountCents: number, currency: string): Promise<string> {
    return "paypal_tx_33819";
  }
}

export class CheckoutService {
  constructor(private strategy: PaymentStrategy) {}

  public setStrategy(strategy: PaymentStrategy) {
    this.strategy = strategy;
  }

  public async checkout(amountCents: number): Promise<string> {
    return this.strategy.charge(amountCents, "USD");
  }
}
```

---

## 3. Key Architectural Takeaways
- The Strategy Pattern completely eliminates brittle `if (type === 'STRIPE') ... else if (type === 'PAYPAL')` conditional branching.
- Adding a new payment provider (e.g. Apple Pay) requires creating a single new class implementing `PaymentStrategy`, respecting the Open/Closed Principle.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "compiler-construction-ast",
        "title": "Compiler Construction & Abstract Syntax Trees",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Lexical Analysis, Context-Free Grammars & Parsing",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Finite State Automata, Regex Tokenization & Error Recovery",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Finite State Automata, Regex Tokenization & Error Recovery

## 1. Executive Architectural Overview
A compiler translates high-level human-readable code into executable machine instructions. The first phase is **Lexical Analysis (Scanning)**, which transforms a raw stream of characters into a sequence of meaningful tokens:

```
"let x = 42 + y;" ---> [TOKEN_LET, TOKEN_IDENT("x"), TOKEN_ASSIGN, TOKEN_INT(42), TOKEN_PLUS, TOKEN_IDENT("y"), TOKEN_SEMICOLON]
```

Scanners are modeled mathematically as **Deterministic Finite Automata (DFA)**.

---

## 2. Production Scanner Implementation in Python

```python
import re
from typing import NamedTuple, Generator

class Token(NamedTuple):
    type: str
    value: str
    line: int
    column: int

TOKEN_SPEC = [
    ("NUMBER",   r"\\d+(\\.\\d*)?"),
    ("IDENT",    r"[A-Za-z_][A-Za-z0-9_]*"),
    ("ASSIGN",   r"="),
    ("PLUS",     r"\\+"),
    ("MINUS",    r"-"),
    ("LPAREN",   r"\\("),
    ("RPAREN",   r"\\)"),
    ("SKIP",     r"[ \\t]+"),
    ("NEWLINE",  r"\\n"),
    ("MISMATCH", r"."),
]

def tokenize(code: str) -> Generator[Token, None, None]:
    regex = "|".join(f"(?P<{name}>{pattern})" for name, pattern in TOKEN_SPEC)
    line_num = 1
    line_start = 0

    for mo in re.finditer(regex, code):
        kind = mo.lastgroup
        value = mo.group()
        col = mo.start() - line_start

        if kind == "NUMBER":
            yield Token(kind, value, line_num, col)
        elif kind == "IDENT":
            yield Token(kind, value, line_num, col)
        elif kind in {"ASSIGN", "PLUS", "MINUS", "LPAREN", "RPAREN"}:
            yield Token(kind, value, line_num, col)
        elif kind == "NEWLINE":
            line_num += 1
            line_start = mo.end()
        elif kind == "SKIP":
            continue
        elif kind == "MISMATCH":
            raise SyntaxError(f"Unexpected character {value!r} on line {line_num}:{col}")
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Recursive Descent Parsing & Pratt Top-Down Operator Precedence",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Recursive Descent Parsing & Pratt Top-Down Operator Precedence

## 1. Executive Architectural Overview
Parsing transforms linear token streams into hierarchical **Abstract Syntax Trees (AST)**. Parsing mathematical expressions with mixed operator precedence (`2 + 3 * 4`) is notoriously tricky using traditional recursive descent.

**Pratt Parsing (Top-Down Operator Precedence)** elegantly parses expressions by associating binding powers with token types:

```
Input: 2 + 3 * 4

Tree Output:
      (+)
     /   \\
   (2)   (*)
        /   \\
      (3)   (4)
```

Because `*` has a higher binding power than `+`, the Pratt parser nests the multiplication node beneath the addition node automatically without recursive backtracking.

---

## 2. Production Pratt Parsing Algorithm

```python
class PrattParser:
    def __init__(self, tokens):
        self.tokens = list(tokens)
        self.pos = 0

    def parse_expression(self, rbp=0):
        t = self.tokens[self.pos]
        self.pos += 1
        left = self.nud(t)

        while self.pos < len(self.tokens) and rbp < self.lbp(self.tokens[self.pos]):
            t = self.tokens[self.pos]
            self.pos += 1
            left = self.led(t, left)

        return left

    def lbp(self, token):
        if token.type == "PLUS": return 10
        if token.type == "STAR": return 20
        return 0
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: AST Traversal, Type Checking & LLVM IR Generation",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 AST Visitor Pattern & Semantic Symbol Tables",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 AST Visitor Pattern & Semantic Symbol Tables

## 1. Executive Architectural Overview
Once an AST is built, the compiler executes **Semantic Analysis**: verifying that variables are declared before use, enforcing type safety, and checking function arity.

The compiler tracks scope hierarchies using a **Symbol Table** and traverses AST nodes using the **Visitor Pattern**.

```
Global Scope Symbol Table:
  - print: FunctionType(Void, [String])
  - Math: ModuleType
       |
       +---> Function Scope (func compute):
               - x: Int32
               - result: Float64
```

---

## 2. Symbol Table Implementation with Lexical Scoping

```python
class SymbolTable:
    def __init__(self, parent=None):
        self.symbols = {}
        self.parent = parent

    def define(self, name: str, sym_type: str):
        if name in self.symbols:
            raise ValueError(f"Redeclaration of symbol '{name}' in same scope.")
        self.symbols[name] = sym_type

    def lookup(self, name: str):
        if name in self.symbols:
            return self.symbols[name]
        if self.parent:
            return self.parent.lookup(name)
        return None
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Static Single Assignment (SSA) Form & Basic Block Optimization",
                        "duration_minutes": 35,
                        "content_body": """# 2.2 Static Single Assignment (SSA) Form & Basic Block Optimization

## 1. Executive Architectural Overview
Modern optimizing compiler backends (LLVM, GCC) convert ASTs into **Static Single Assignment (SSA) Form**. In SSA, *every variable is assigned a value exactly once*.

```
Original Code:        SSA Form:
y = 1;                y1 = 1;
y = y + 2;            y2 = y1 + 2;
```

### The $\\phi$ (Phi) Function
When control flow branches merge (such as after an `if/else` statement), SSA introduces a $\\phi$ function:
$$y_3 = \\phi(y_1, y_2)$$
The $\\phi$ function selects $y_1$ or $y_2$ depending on which basic block executed prior to the merge point. This representation enables linear-time Dead Code Elimination and Constant Folding.

---

## 2. LLVM Intermediate Representation (IR)
LLVM IR represents universal, strongly typed, RISC-like assembly:
```llvm
define i32 @square(i32 %x) {
entry:
  %result = mul i32 %x, %x
  ret i32 %result
}
```
Target-independent optimizations run directly on this intermediate SSA representation before emitting native x86_64 or ARM64 assembly.
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "computer-networks-protocols",
        "title": "Computer Networks & High-Performance Protocols",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: The Transport Layer & TCP Congestion Control",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 TCP Connection Handshakes, Window Scaling & SYN Flood Defense",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 TCP Connection Handshakes, Window Scaling & SYN Flood Defense

## 1. Executive Architectural Overview
TCP (Transmission Control Protocol) transforms an unreliable, best-effort packet network (IP) into a reliable, ordered, duplex byte stream through sequence numbers, acknowledgments, and retransmission timers.

---

## 2. The 3-Way Handshake & SYN Floods
```
Client                      Server
  |                           |
  | -------- SYN ----------> | (Allocates TCB in SYN Queue)
  |                           |
  | <----- SYN-ACK --------- |
  |                           |
  | -------- ACK ----------> | (Moves to Accept Queue)
```

### SYN Cookies Defense
In a SYN flood attack, an attacker sends millions of SYN packets from spoofed IPs without returning the final ACK, exhausting the server's SYN queue memory.

**SYN Cookies:** When the SYN queue fills up, the Linux kernel stops allocating memory for half-open connections. Instead, it encodes connection metadata cryptographically into the initial sequence number of the SYN-ACK:
$$t = \\text{timestamp}, \\quad s = \\text{HMAC}(t, \\text{IPs}, \\text{ports})$$
When the client sends the final ACK, the server verifies the cookie and establishes the socket with zero pre-allocated state!
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Congestion Control: Reno, CUBIC & BBR Bottleneck Bandwidth",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Congestion Control: Reno, CUBIC & BBR Bottleneck Bandwidth

## 1. Executive Architectural Overview
If sending endpoints transmit data faster than network switches can buffer, packet drops and bufferbloat occur. Congestion control algorithms dynamically regulate transmission rates.

---

## 2. Loss-Based (CUBIC) vs Model-Based (BBR)
- **TCP CUBIC:** Loss-based. Ramps up sending window until packet loss occurs, causing massive bufferbloat in switch queues.
- **Google BBR (Bottleneck Bandwidth and RTT):** Measures the physical bottleneck bandwidth and minimum round-trip time directly. Delivers maximum network throughput with minimum queuing delay.
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Modern Web Protocols: HTTP/3, QUIC & Zero-RTT Handshakes",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 QUIC UDP Multiplexing & Eliminating Head-of-Line Blocking",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 QUIC UDP Multiplexing & Eliminating Head-of-Line Blocking

## 1. Executive Architectural Overview
HTTP/2 introduced stream multiplexing over a single TCP connection. However, it suffered from **TCP Head-of-Line (HoL) Blocking**: if a single packet belonging to Stream 1 was dropped, the OS kernel blocked ALL other streams (Stream 2, 3, 4) until the dropped packet was retransmitted.

---

## 2. HTTP/3 atop QUIC (UDP)
HTTP/3 runs atop **QUIC**, which replaces TCP with UDP in user space. In QUIC:
- Each stream is acknowledged independently.
- Packet loss on Stream 1 has zero impact on Stream 2!
- Connection IDs enable smooth connection migration when a mobile device switches from Wi-Fi to cellular data.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 TLS 1.3 Handshake Mechanics & Perfect Forward Secrecy (PFS)",
                        "duration_minutes": 25,
                        "content_body": """# 2.2 TLS 1.3 Handshake Mechanics & Perfect Forward Secrecy (PFS)

## 1. Executive Architectural Overview
TLS 1.3 reduces connection establishment latency from 2 Round Trips (2-RTT) down to **1-RTT** (and 0-RTT for resumed sessions).

```
Client                                              Server
  |                                                    |
  | -- ClientHello + KeyShare (ECDHE) ---------------> |
  |                                                    |
  | <-- ServerHello + KeyShare + EncryptedExtensions - |
  | <-- Certificate + CertificateVerify + Finished --- |
  |                                                    |
  | -- Finished + First Application HTTP Request ----> | (Connection Encrypted!)
```

---

## 2. Perfect Forward Secrecy (PFS) Invariant
TLS 1.3 mandates **Ephemeral Diffie-Hellman (ECDHE)** key exchange. Even if an adversary records all encrypted internet traffic today and steals the server's private RSA/ECDSA key 10 years from now, past session keys cannot be computed because ephemeral keys are discarded from memory immediately after the handshake.
"""
                    }
                ]
            }
        ]
    }
]
