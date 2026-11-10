"""
Curriculum content for Programming Languages: C, Python, Java, Rust, and Go.
"""

PROGRAMMING_LANGUAGES_COURSES = [
    {
        "slug": "c-programming-systems",
        "title": "C Systems Programming & Memory Architecture",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: C Toolchain, Syntax & Memory Model",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 The GCC/Clang Toolchain, Preprocessor & Header Guards",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 The GCC/Clang Toolchain, Preprocessor & Header Guards

## 1. Executive Architectural Overview
Unlike managed runtime environments (Python, Java, Node.js) that execute bytecode atop virtual machines, C compiles directly to native CPU machine instructions. Understanding the C compilation pipeline is mandatory for diagnosing linking errors, memory alignment bugs, and undefined behavior.

---

## 2. The 4-Stage Compilation Pipeline

```
[source.c]
    |
    v (Stage 1: Preprocessing - `cpp`)
[source.i]  <- Macros expanded, comments stripped, #include headers inlined
    |
    v (Stage 2: Compilation - `cc1` / Clang frontend)
[source.s]  <- Generates architecture-specific Assembly instructions (x86_64 or ARM64)
    |
    v (Stage 3: Assembly - `as`)
[source.o]  <- Generates ELF/Mach-O Relocatable Object File (binary machine code)
    |
    v (Stage 4: Linking - `ld` / `lld`)
[executable / libc.so] <- Resolves external symbol tables and combines object files
```

---

## 3. Production Implementation: Robust Header Guards & Struct Layout

```c
#ifndef LEARNFLOW_BUFFER_POOL_H
#define LEARNFLOW_BUFFER_POOL_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/**
 * High-performance circular buffer pool header.
 * Demonstrates explicit memory layout and 64-bit word alignment.
 */
typedef struct {
    uint8_t *data;          /* 8 bytes: 64-bit pointer to physical heap buffer */
    size_t capacity;        /* 8 bytes: Total capacity in bytes */
    size_t head;            /* 8 bytes: Read index offset */
    size_t tail;            /* 8 bytes: Write index offset */
    uint32_t flags;         /* 4 bytes: Operational state flags */
    uint8_t _padding[4];    /* 4 bytes: Explicit padding to preserve 8-byte word alignment */
} BufferPool;

BufferPool* buffer_pool_create(size_t capacity);
bool buffer_pool_write(BufferPool *pool, const uint8_t *src, size_t len);
void buffer_pool_destroy(BufferPool *pool);

#ifdef __cplusplus
}
#endif

#endif /* LEARNFLOW_BUFFER_POOL_H */
```

---

## 4. Key Takeaways & Daily Practice
- Always protect C headers with idempotent preprocessor guards.
- Use `extern "C"` when writing library headers intended to be linked by C++ compilers.
- Inspect preprocessor output using `gcc -E main.c` to debug macro expansion anomalies.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Primitive Data Types, Memory Alignment & Bitwise Operators",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Primitive Data Types, Memory Alignment & Bitwise Operators

## 1. Executive Architectural Overview
In modern 64-bit architectures, the CPU memory bus reads RAM in 8-byte (64-bit) aligned chunks. Accessing an unaligned multi-byte variable requires the memory controller to perform two separate memory bus cycles and execute bit-shifts, degrading throughput or causing hardware faults on architectures like ARM or SPARC.

---

## 2. Structure Padding & Memory Alignment

```c
// UNOPTIMIZED: Total size = 12 bytes on 32-bit / 16 bytes on 64-bit
struct Unoptimized {
    char a;       // 1 byte
    // 3 bytes padding inserted by compiler
    int32_t b;    // 4 bytes
    char c;       // 1 byte
    // 7 bytes padding on 64-bit systems
};

// OPTIMIZED: Total size = 8 bytes
struct Optimized {
    int32_t b;    // 4 bytes
    char a;       // 1 byte
    char c;       // 1 byte
    char _pad[2]; // 2 bytes padding to align to 4-byte boundary
};
```

---

## 3. High-Performance Bitwise State Flags

```c
#include <stdio.h>
#include <stdint.h>

#define FLAG_ACTIVE    (1U << 0)  // 0001
#define FLAG_ENCRYPTED (1U << 1)  // 0010
#define FLAG_COMPRESSED(1U << 2)  // 0100
#define FLAG_DIRTY     (1U << 3)  // 1000

static inline void set_flag(uint32_t *state, uint32_t flag) {
    *state |= flag;
}

static inline void clear_flag(uint32_t *state, uint32_t flag) {
    *state &= ~flag;
}

static inline int has_flag(uint32_t state, uint32_t flag) {
    return (state & flag) != 0;
}
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Pointers, Memory Allocation & Buffer Safety",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Pointer Arithmetic, Void Pointers & Function Callbacks",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 Pointer Arithmetic, Void Pointers & Function Callbacks

## 1. Executive Architectural Overview
A pointer is a variable that stores a physical or virtual memory address. In C, pointer arithmetic is inherently scaled by `sizeof(*ptr)`. Adding `1` to an `int32_t *p` increments the physical address by 4 bytes. Adding `1` to a `double *p` increments by 8 bytes.

---

## 2. Generic Algorithms with `void*` and Function Callbacks

```c
#include <stddef.h>
#include <stdint.h>
#include <string.h>

/**
 * Generic binary search implementing type-agnostic memory traversal.
 */
void* generic_bsearch(
    const void *key,
    const void *base,
    size_t nmemb,
    size_t size,
    int (*compar)(const void *, const void *)
) {
    size_t l = 0;
    size_t r = nmemb;

    while (l < r) {
        size_t mid = l + (r - l) / 2;
        // Pointer arithmetic on char* byte boundaries
        const void *mid_elem = (const char *)base + (mid * size);
        int cmp = compar(key, mid_elem);

        if (cmp == 0) {
            return (void *)mid_elem;
        } else if (cmp < 0) {
            r = mid;
        } else {
            l = mid + 1;
        }
    }
    return NULL;
}
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Dynamic Memory: malloc, free, Arena Allocators & Valgrind Analysis",
                        "duration_minutes": 35,
                        "content_body": """# 2.2 Dynamic Memory: malloc, free, Arena Allocators & Valgrind Analysis

## 1. Executive Architectural Overview
Dynamic memory management with `malloc` and `free` queries the kernel via `brk()` or `mmap()` to allocate heap memory. However, high-frequency granular allocations cause heap fragmentation and lock contention across multi-threaded applications.

In performance-critical systems (game engines, network switches, database query executors), engineers use **Region-Based Memory Management (Arena Allocators)**.

---

## 2. Production Arena Allocator Implementation

```c
#include <stdlib.h>
#include <stdint.h>
#include <stddef.h>
#include <assert.h>

typedef struct {
    uint8_t *buffer;
    size_t capacity;
    size_t offset;
} MemoryArena;

MemoryArena* arena_create(size_t capacity) {
    MemoryArena *arena = (MemoryArena*)malloc(sizeof(MemoryArena));
    arena->buffer = (uint8_t*)malloc(capacity);
    arena->capacity = capacity;
    arena->offset = 0;
    return arena;
}

void* arena_alloc(MemoryArena *arena, size_t size, size_t alignment) {
    // Calculate 64-bit aligned offset
    size_t current_addr = (size_t)(arena->buffer + arena->offset);
    size_t aligned_addr = (current_addr + (alignment - 1)) & ~(alignment - 1);
    size_t new_offset = (aligned_addr - (size_t)arena->buffer) + size;

    if (new_offset > arena->capacity) {
        return NULL; // Out of arena memory
    }

    arena->offset = new_offset;
    return (void*)aligned_addr;
}

void arena_reset(MemoryArena *arena) {
    // Instantaneous O(1) deallocation of all objects in the arena
    arena->offset = 0;
}

void arena_destroy(MemoryArena *arena) {
    free(arena->buffer);
    free(arena);
}
```

By freeing the entire arena in a single $O(1)$ operation, memory leaks and double-free vulnerabilities are physically eliminated.
"""
                    }
                ]
            },
            {
                "order_index": 3,
                "title": "Module 3: POSIX System Calls & I/O Multiplexing",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "3.1 File Descriptors, open(), read(), write() & Non-Blocking I/O",
                        "duration_minutes": 30,
                        "content_body": """# 3.1 File Descriptors, open(), read(), write() & Non-Blocking I/O

## 1. Everything is a File Descriptor in POSIX
On Unix-like operating systems, files, network sockets, named pipes (FIFOs), and terminals are represented as non-negative integer **File Descriptors (FDs)** pointing into the per-process kernel file descriptor table.

```
FD 0: Standard Input (stdin)
FD 1: Standard Output (stdout)
FD 2: Standard Error (stderr)
FD 3+: Network sockets, disk files, event FDs
```

---

## 2. Non-Blocking I/O and `O_NONBLOCK`
In standard blocking I/O, `read(fd, buf, len)` puts the calling thread to sleep if no data is available on the socket. In non-blocking mode, the call returns immediately with `-1` and sets `errno = EAGAIN` or `EWOULDBLOCK`, allowing a single thread to service thousands of active network connections.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "3.2 epoll vs select: Event-Driven Network Servers in C",
                        "duration_minutes": 35,
                        "content_body": """# 3.2 epoll vs select: Event-Driven Network Servers in C

## 1. The C10K Problem
In 1999, the classic `select()` system call became the primary bottleneck for internet servers. `select()` takes an array of file descriptors and walks through all $N$ descriptors linearly in $O(N)$ time on every single event loop iteration.

Linux introduced **`epoll`** ($O(1)$ event notifications) to solve this:

```
select() / poll():
- Linear O(N) scan across all monitored file descriptors on every wake-up.
- Copies descriptor list from user space to kernel space every call.

epoll (epoll_create, epoll_ctl, epoll_wait):
- In-kernel Red-Black Tree stores registered FDs.
- Kernel device drivers append active events to a Ready List (Doubly Linked List).
- epoll_wait() returns ONLY file descriptors that have pending I/O in O(1) time!
```
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "python-masterclass-core-to-concurrency",
        "title": "Python 3: From Idiomatic Basics to Async Concurrency",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: The Python Data Model & Idiomatic Protocol Patterns",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Dunder Methods & Protocol-Driven Polymorphism",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 Dunder Methods & Protocol-Driven Polymorphism

## 1. Executive Architectural Overview
Python is not just an object-oriented language; it is a **Protocol-Driven** language. The Python interpreter interacts with objects through standardized double-underscore ("dunder") methods forming the **Python Data Model**.

When you write `len(collection)`, the interpreter does not inspect an attribute. It invokes `type(collection).__len__(collection)`, which reads the internal PyVarObject `ob_size` in $O(1)$ time in CPython.

---

## 2. Production Implementation: Idiomatic Vector Space

```python
import math
from typing import Iterator

class Vector2D:
    \"\"\"
    Immutable mathematical vector demonstrating the core Python Data Model protocols:
    - Representation: __repr__, __str__
    - Arithmetic: __add__, __mul__, __abs__
    - Truthiness: __bool__
    - Sequence & Hashing: __len__, __getitem__, __hash__, __eq__
    \"\"\"
    __slots__ = ("_x", "_y")  # Eliminates per-instance __dict__ to reduce memory by 60%

    def __init__(self, x: float, y: float) -> None:
        object.__setattr__(self, "_x", float(x))
        object.__setattr__(self, "_y", float(y))

    @property
    def x(self) -> float:
        return self._x

    @property
    def y(self) -> float:
        return self._y

    def __repr__(self) -> str:
        return f"Vector2D(x={self._x!r}, y={self._y!r})"

    def __add__(self, other: object) -> "Vector2D":
        if not isinstance(other, Vector2D):
            return NotImplemented
        return Vector2D(self._x + other._x, self._y + other._y)

    def __abs__(self) -> float:
        return math.hypot(self._x, self._y)

    def __bool__(self) -> bool:
        return bool(self._x or self._y)

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Vector2D):
            return NotImplemented
        return self._x == other._x and self._y == other._y

    def __hash__(self) -> int:
        return hash((self._x, self._y))
```

### The `__slots__` Memory Optimization
In CPython, every object stores dynamic attributes in a dictionary (`__dict__`). Using `__slots__` replaces the dictionary with a fixed-size C array of pointers, dropping memory overhead from ~152 bytes to ~48 bytes per instance.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Generators, Iterators & Memory-Efficient Pipelines",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Generators, Iterators & Memory-Efficient Pipelines

## 1. Executive Architectural Overview
Loading a 50GB audit log into a Python list (`[line for line in file]`) causes an instant Out-Of-Memory crash. Python **Generators** implement the Iterator Protocol (`__iter__`, `__next__`) using lazy evaluation, maintaining $O(1)$ memory consumption regardless of input dataset size.

---

## 2. Production Pipeline: Processing High-Volume Streaming Data

```python
import gzip
import json
from typing import Generator, Dict, Any

def stream_compressed_logs(filepath: str) -> Generator[str, None, None]:
    \"\"\"Reads lines lazily from a gzip file with bounded 64KB buffer.\"\"\"
    with gzip.open(filepath, mode="rt", encoding="utf-8") as f:
        for line in f:
            yield line.strip()

def parse_security_events(lines: Generator[str, None, None]) -> Generator[Dict[str, Any], None, None]:
    \"\"\"Parses JSON and filters invalid lines without loading whole file into RAM.\"\"\"
    for raw in lines:
        try:
            record = json.loads(raw)
            if record.get("event_type") == "AUTH_FAILURE":
                yield record
        except json.JSONDecodeError:
            continue

# Usage in pipeline
logs = stream_compressed_logs("/var/log/audit.log.gz")
failures = parse_security_events(logs)
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: High-Concurrency AsyncIO & Multiprocessing Architecture",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 The Global Interpreter Lock (GIL) & Process Boundaries",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 The Global Interpreter Lock (GIL) & Process Boundaries

## 1. Executive Architectural Overview
In CPython, the **Global Interpreter Lock (GIL)** is a mutual exclusion lock that prevents multiple native OS threads from executing Python bytecode simultaneously. The GIL was implemented to ensure thread-safe reference counting in CPython's memory management.

---

## 2. When to Use What Concurrency Model

| Workload Type | Bottleneck | Optimal Python Solution |
| :--- | :--- | :--- |
| **I/O-Bound** (HTTP requests, DB queries, Redis) | Network / Sockets | `asyncio` / ThreadPoolExecutor |
| **CPU-Bound** (Image resizing, ML inference, Cryptography) | CPU Cores | `multiprocessing` / ProcessPoolExecutor |

### Bypassing the GIL for CPU-Bound Calculations
To utilize all 64 cores on a server for CPU-bound computations, use `concurrent.futures.ProcessPoolExecutor`, which forks separate OS processes with independent memory spaces and independent GIL instances.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 AsyncIO Coroutines, Task Groups & Non-Blocking I/O",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 AsyncIO Coroutines, Task Groups & Non-Blocking I/O

## 1. Executive Architectural Overview
`asyncio` provides single-threaded cooperative multitasking using an event loop built atop OS primitives (`epoll` on Linux, `kqueue` on macOS). Unlike threads, where the OS preemptively context-switches execution, coroutines explicitly yield control back to the event loop using `await`.

---

## 2. Python 3.11+ Structured Concurrency with `asyncio.TaskGroup`

```python
import asyncio
import httpx
from typing import List, Dict, Any

async def fetch_user_data(client: httpx.AsyncClient, user_id: str) -> Dict[str, Any]:
    resp = await client.get(f"https://api.internal/users/{user_id}", timeout=2.0)
    resp.raise_for_status()
    return resp.json()

async def aggregate_dashboard(user_ids: List[str]) -> List[Dict[str, Any]]:
    \"\"\"
    Structured concurrency pattern: If any single fetch fails,
    TaskGroup automatically cancels all remaining in-flight tasks!
    \"\"\"
    results = []
    async with httpx.AsyncClient() as client:
        async with asyncio.TaskGroup() as tg:
            tasks = [tg.create_task(fetch_user_data(client, uid)) for uid in user_ids]

        # All tasks completed successfully
        results = [t.result() for t in tasks]
    return results
```
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "java-enterprise-jvm-internals",
        "title": "Java Enterprise Architecture & JVM Internals",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Generics Invariants, Collections & Streams",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Type Erasure, Wildcards (PECS) & Generic Bounds",
                        "duration_minutes": 25,
                        "content_body": """# 1.1 Type Erasure, Wildcards (PECS) & Generic Bounds

## 1. Executive Architectural Overview
Java Generics were introduced in Java 5 to provide compile-time type safety while maintaining binary backwards compatibility with legacy JVM bytecode. To accomplish this, the compiler applies **Type Erasure**: all generic type parameters (like `List<String>`) are replaced with their upper bound (or `Object`) in bytecode.

---

## 2. The PECS Invariant (Producer Extends, Consumer Super)
- Use `? extends T` when you only **READ** (produce) items from the collection.
- Use `? super T` when you only **WRITE** (consume) items into the collection.

```java
public class CollectionsUtility {
    /**
     * Copies elements from src to dest with rigorous generic bounds.
     * src PRODUCES elements (? extends T)
     * dest CONSUMES elements (? super T)
     */
    public static <T> void copy(List<? super T> dest, List<? extends T> src) {
        for (T item : src) {
            dest.add(item);
        }
    }
}
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Parallel Streams, Spliterators & ForkJoinPool",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Parallel Streams, Spliterators & ForkJoinPool

## 1. Executive Architectural Overview
Java's `parallelStream()` splits collections across available CPU cores using the common **ForkJoinPool** (`ForkJoinPool.commonPool()`).

---

## 2. The Common Pool Contention Trap
By default, all parallel streams across your entire enterprise JVM application share the exact same `ForkJoinPool.commonPool()`. If a single parallel stream executes blocking I/O (such as calling a remote database or external REST API), it exhausts common pool worker threads and starves all other application components!

**Rule of Thumb:** Never execute blocking I/O inside standard parallel streams. Use a dedicated custom `ForkJoinPool` or virtual threads (Project Loom).
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: HotSpot JVM Memory Layout & Modern Garbage Collection",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 JVM Memory Areas: Heap, Stack, Metaspace & JIT Compilation",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 JVM Memory Areas: Heap, Stack, Metaspace & JIT Compilation

## 1. Executive Architectural Overview
The Java Virtual Machine (JVM) partitions memory into distinct regions with specific lifecycle guarantees:
- **JVM Stack:** Thread-private. Stores stack frames containing local primitive variables and object references.
- **Heap Memory:** Shared across all threads. Stores all instantiated class objects and arrays.
- **Metaspace:** Native memory storing class metadata, method bytecode, and the constant pool (replaces Java 7 PermGen).
- **Code Cache:** Native memory storing JIT-compiled native x86 machine instructions.

---

## 2. JIT Compilation: C1 (Client) vs C2 (Server) Compilers
The HotSpot JVM interprets bytecode initially. As methods execute repeatedly ("hot spots"), the JIT compiler compiles them to native machine code:
1. **Tier 1-3 (C1 Compiler):** Fast compilation with basic profiling.
2. **Tier 4 (C2 Compiler):** Deep optimization: method inlining, loop unrolling, branch prediction optimization, and **Escape Analysis**.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 ZGC and G1 Garbage Collectors: Sub-Millisecond Pauses",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 ZGC and G1 Garbage Collectors: Sub-Millisecond Pauses

## 1. Executive Architectural Overview
Traditional garbage collectors (Parallel GC, CMS) caused multi-second Stop-The-World (STW) pauses when collecting large heaps (100GB+), causing financial systems to drop network connections. Modern JVM garbage collectors (**G1GC** and **ZGC**) achieve concurrent garbage collection with sub-millisecond pauses.

---

## 2. ZGC: The Colored Pointer Architecture
ZGC achieves $< 1\\text{ms}$ pause times regardless of whether the heap is 16GB or 16TB using **Colored Pointers** and **Load Barriers**:
- 4 bits of a 64-bit reference address are used as metadata flags (`Marked0`, `Marked1`, `Remapped`).
- When application threads read an object reference, the JIT-injected Load Barrier checks the color bit and relocates the object concurrently in memory without pausing application execution!
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "rust-systems-concurrency",
        "title": "Rust Systems Programming & Concurrency Without Data Races",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: The Rust Ownership Model & Lifetimes",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 Ownership Invariants, Move Semantics & Copy vs Clone",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 Ownership Invariants, Move Semantics & Copy vs Clone

## 1. Executive Architectural Overview
Languages typically guarantee memory safety through either manual pointer management (C/C++, susceptible to buffer overflows and use-after-free) or runtime Garbage Collection (Go, Java, Python, causing latency spikes).

Rust achieves memory safety at compile-time with **Zero Runtime Overhead** through its **Ownership System**.

---

## 2. The 3 Invariants of Rust Ownership
1. Each value in Rust has an owner variable.
2. There can only be one owner at a time.
3. When the owner goes out of scope, the value is dropped immediately (`Drop` trait).

```rust
fn main() {
    let s1 = String::from("learnflow");
    let s2 = s1; // MOVE! Ownership transfers to s2. s1 is invalidated.

    // println!("{}", s1); // COMPILE ERROR: borrow of moved value: `s1`
    println!("{}", s2);   // VALID
}
```

### Copy vs Clone
- **`Copy`:** Bitwise shallow copy for types stored entirely on the stack (`i32`, `bool`, `[u8; 32]`). Occurs implicitly.
- **`Clone`:** Explicit deep heap duplication (`s1.clone()`). Requires deliberate memory allocation.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Exclusive Mutable Borrowing (&mut T) & Non-Lexical Lifetimes",
                        "duration_minutes": 30,
                        "content_body": """# 1.2 Exclusive Mutable Borrowing (&mut T) & Non-Lexical Lifetimes

## 1. The Aliasing XOR Mutability Rule
Rust enforces the fundamental concurrency invariant at compile time:
$$\\text{Shared References (\\&T)} \\oplus \\text{Exclusive Mutable Reference (\\&mut T)}$$

You may have:
- Any number of immutable references (`&T`) to a resource, **OR**
- Exactly one mutable reference (`&mut T`), but **NEVER BOTH** simultaneously!

This single rule mathematically guarantees the physical impossibility of **Data Races** in safe Rust.

---

## 2. Non-Lexical Lifetimes (NLL) in Practice
Prior to Rust 2018, references were strictly bound to their enclosing lexical scope braces `{ ... }`. Modern Rust uses Non-Lexical Lifetimes (NLL), where the borrow checker calculates lifetimes based on the Control Flow Graph (CFG):

```rust
fn main() {
    let mut data = vec![1, 2, 3];

    let ref_immut = &data[0];
    println!("Read value: {}", ref_immut);
    // Under NLL, ref_immut's lifetime ENDS HERE because it is never read again!

    // Therefore, taking a mutable borrow here is 100% VALID:
    data.push(4);
    println!("Updated length: {}", data.len());
}
```

---

## 3. The Iterator Invalidation Trap Eliminated
In C++, pushing to a vector while iterating over it causes undefined behavior (dangling pointers after reallocation). In Rust, attempting this triggers a compile-time rejection:

```rust
let mut v = vec![1, 2, 3];
for item in &v {
    // v.push(99); // COMPILE ERROR: cannot borrow `v` as mutable because it is also borrowed as immutable
}
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: Concurrency, Atomics & Unsafe Rust",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 Send and Sync Traits, Mutex Guards & Thread Spawning",
                        "duration_minutes": 30,
                        "content_body": """# 2.1 Send and Sync Traits, Mutex Guards & Thread Spawning

## 1. Fearless Concurrency: Send and Sync Traits
Rust's type system encodes thread safety into two foundational auto-traits:
- **`Send`:** Safe to transfer ownership of the type across thread boundaries.
- **`Sync`:** Safe to share references (`&T`) to the type across multiple threads (`T: Sync` implies `&T: Send`).

Types like `Rc<T>` (non-atomic reference counting) do not implement `Send`, making it impossible to pass them to other threads at compile time! Use `Arc<T>` (Atomic Reference Counting) instead.

---

## 2. Production Implementation: Thread-Safe State Store

```rust
use std::sync::{Arc, Mutex};
use std::thread;

pub struct SharedCounter {
    count: Arc<Mutex<u64>>,
}

impl SharedCounter {
    pub fn new() -> Self {
        Self { count: Arc::new(Mutex::new(0)) }
    }

    pub fn increment_parallel(&self, worker_count: usize) {
        let mut handles = Vec::with_capacity(worker_count);

        for _ in 0..worker_count {
            let counter_clone = Arc::clone(&self.count);
            handles.push(thread::spawn(move || {
                // RAII MutexGuard automatically unlocks when going out of scope
                let mut lock = counter_clone.lock().expect("Poisoned mutex");
                *lock += 1;
            }));
        }

        for handle in handles {
            handle.join().expect("Thread panicked");
        }
    }
}
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Lock-Free Queues with Atomic CAS (Compare-And-Swap)",
                        "duration_minutes": 35,
                        "content_body": """# 2.2 Lock-Free Queues with Atomic CAS (Compare-And-Swap)

## 1. Executive Architectural Overview
Under high contention, standard OS mutexes force threads into kernel sleep states, causing context switch overhead (~1-2 microseconds). **Lock-Free Concurrency** uses CPU hardware atomic instructions (`LOCK CMPXCHG` on x86) to synchronize state without locking.

---

## 2. Compare-And-Swap (CAS) Mechanics
An atomic CAS operation checks if the memory location contains an expected value. If true, it writes the new value in a single atomic hardware cycle; if false, it fails, allowing the caller to retry in a loop.

```rust
use std::sync::atomic::{AtomicUsize, Ordering};

pub struct LockFreeCounter {
    value: AtomicUsize,
}

impl LockFreeCounter {
    pub fn new() -> Self {
        Self { value: AtomicUsize::new(0) }
    }

    pub fn increment(&self) -> usize {
        let mut current = self.value.load(Ordering::Relaxed);
        loop {
            let new_val = current + 1;
            match self.value.compare_exchange_weak(
                current,
                new_val,
                Ordering::AcqRel,
                Ordering::Acquire,
            ) {
                Ok(_) => return new_val,
                Err(actual) => current = actual, // CAS failed due to concurrent update; retry
            }
        }
    }
}
```
"""
                    }
                ]
            }
        ]
    },
    {
        "slug": "golang-concurrency-microservices",
        "title": "High-Concurrency Go (Golang) Microservices",
        "modules": [
            {
                "order_index": 1,
                "title": "Module 1: Goroutine Scheduling & Channel Invariants",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "1.1 The M:N Work-Stealing Go Scheduler & Preemption",
                        "duration_minutes": 30,
                        "content_body": """# 1.1 The M:N Work-Stealing Go Scheduler & Preemption

## 1. Executive Architectural Overview
Standard OS threads require a fixed stack allocation of 1MB to 8MB. Spawning 100,000 OS threads would exhaust physical server memory instantly.

Go achieves massive concurrency through its **M:N Work-Stealing Runtime Scheduler**, which multiplexes $M$ green goroutines onto $N$ physical OS threads. A goroutine starts with an initial stack of just **2KB**, dynamically growing and shrinking on demand.

---

## 2. The GMP Model

```
   [G: Goroutine]
          |
   [P: Logical Processor (GOMAXPROCS)]  <- Holds local runqueue of 256 goroutines
          |
   [M: OS Machine Thread]               <- Scheduled on physical CPU cores
```

### Work-Stealing Invariant
When a Logical Processor $P$ exhausts its local runqueue, it steals half the runnable goroutines from another processor's queue, maintaining 100% core utilization.
"""
                    },
                    {
                        "order_index": 2,
                        "title": "1.2 Select Multiplexing, Buffered vs Unbuffered Channels & Deadlock Prevention",
                        "duration_minutes": 25,
                        "content_body": """# 1.2 Select Multiplexing, Buffered vs Unbuffered Channels & Deadlock Prevention

## 1. CSP: Communicating Sequential Processes
Go follows the CSP philosophy: *"Do not communicate by sharing memory; instead, share memory by communicating."*

---

## 2. Channel Semantics
- **Unbuffered Channel (`make(chan int)`):** Synchronous handoff. The sender blocks until the receiver is ready.
- **Buffered Channel (`make(chan int, 100)`):** Asynchronous up to capacity. Sender only blocks when the buffer is completely full.

```go
package main

import (
    "context"
    "fmt"
    "time"
)

func WorkerWithTimeout(ctx context.Context, ch <-chan string) error {
    for {
        select {
        case <-ctx.Done():
            return ctx.Err() // Clean shutdown without leaking goroutines
        case msg, ok := <-ch:
            if !ok {
                return nil // Channel closed gracefully
            }
            fmt.Println("Processed:", msg)
        case <-time.After(500 * time.Millisecond):
            fmt.Println("Idle heart-beat")
        }
    }
}
```
"""
                    }
                ]
            },
            {
                "order_index": 2,
                "title": "Module 2: gRPC, Protobuf Serialization & Context Deadlines",
                "lessons": [
                    {
                        "order_index": 1,
                        "title": "2.1 High-Throughput Binary Serialization with Protocol Buffers",
                        "duration_minutes": 25,
                        "content_body": """# 2.1 High-Throughput Binary Serialization with Protocol Buffers

## 1. Executive Architectural Overview
JSON serialization is human-readable but computationally expensive: parsing ASCII strings, escaping quotes, and transmitting verbose dictionary keys wastes CPU cycles and network bandwidth.

**Protocol Buffers (Protobuf)** encodes structured data using compact binary **Varints** and field tags:
- 5x to 10x smaller payload sizes than equivalent JSON.
- 10x faster serialization and deserialization speeds.
- Strict backwards and forwards compatibility through field numbering tags.

---

## 2. Production Protobuf Schema & Go Code Generation

```protobuf
syntax = "proto3";

package billing.v1;
option go_package = "github.com/learnflow/gen/billing/v1;billingv1";

message InvoiceRequest {
  string invoice_id = 1;
  int64 amount_cents = 2;
  string currency = 3;
}

message InvoiceResponse {
  bool settled = 1;
  int64 timestamp_epoch_ms = 2;
}

service BillingService {
  rpc SettleInvoice (InvoiceRequest) returns (InvoiceResponse);
}
```
"""
                    },
                    {
                        "order_index": 2,
                        "title": "2.2 Context Propagation, Cancellation Trees & Deadline Exceeded Defense",
                        "duration_minutes": 30,
                        "content_body": """# 2.2 Context Propagation, Cancellation Trees & Deadline Exceeded Defense

## 1. Executive Architectural Overview
In microservices, if a user closes their browser tab, all downstream database queries, RPC calls, and background jobs should terminate immediately to avoid wasting compute resources.

Go's `context.Context` propagates deadlines, cancellation signals, and request-scoped values across API boundaries and goroutine trees.

---

## 2. Production Implementation: Bounded Timeout & Client Cancellation

```go
package main

import (
    "context"
    "database/sql"
    "time"
)

func QueryAccountBalance(ctx context.Context, db *sql.DB, accountID string) (int64, error) {
    // 1. Create child context with hard 2.5 second ceiling
    queryCtx, cancel := context.WithTimeout(ctx, 2500*time.Millisecond)
    defer cancel()

    var balance int64
    // 2. QueryContext automatically aborts the PostgreSQL query if context is cancelled!
    err := db.QueryRowContext(queryCtx, 
        "SELECT balance_cents FROM accounts WHERE id = $1", 
        accountID,
    ).Scan(&balance)

    if err != nil {
        return 0, err
    }
    return balance, nil
}
```
"""
                    }
                ]
            }
        ]
    }
]
