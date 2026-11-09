"""
Learnflow LMS - Course Catalog Expansion Seed Script
Seeds realistic, comprehensive courses across:
- Data Structures & Algorithms
- Object-Oriented Programming (OOP)
- Cloud Computing & Distributed Architecture
- Operating Systems & Kernel Architecture
- Programming Languages: C, Python, Java (Beginner to Masterclass)
"""
import uuid
import logging
from sqlalchemy.orm import Session
from app.core.database import SessionLocal
from app.models.user import User
from app.models.course import Course, CourseConcept
from app.models.curriculum import Module, Lesson
from app.models.enrollment import Enrollment

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("seed_expanded_courses")

COURSES_DATA = [
    {
        "title": "C Systems Programming & Memory Architecture",
        "slug": "c-programming-systems",
        "description": "Master foundational and low-level C: pointer arithmetic, manual memory management with malloc/free, GCC/Clang optimization, and POSIX system calls.",
        "difficulty": "beginner",
        "thumbnail_url": "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=60",
        "domain": "Programming Languages",
        "modules": [
            {
                "title": "Module 1: C Toolchain, Syntax & Memory Model",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 The GCC/Clang Toolchain, Preprocessor & Header Guards",
                        "duration_minutes": 25,
                        "content": (
                            "# C Compilation Pipeline & Header Invariants\n\n"
                            "C compiles through four distinct stages: Preprocessing (`cpp`), Compilation (`cc1`), "
                            "Assembly (`as`), and Linking (`ld`).\n\n"
                            "```c\n"
                            "#ifndef BUFFER_POOL_H\n"
                            "#define BUFFER_POOL_H\n\n"
                            "#include <stddef.h>\n"
                            "#include <stdint.h>\n\n"
                            "typedef struct {\n"
                            "    uint8_t *data;\n"
                            "    size_t capacity;\n"
                            "    size_t length;\n"
                            "} BufferPool;\n\n"
                            "BufferPool* buffer_create(size_t capacity);\n"
                            "void buffer_destroy(BufferPool *buf);\n\n"
                            "#endif // BUFFER_POOL_H\n"
                            "```\n\n"
                            "**Key Engineering Takeaway**: Always protect header files against double-inclusion using idempotent preprocessor guards."
                        )
                    },
                    {
                        "title": "1.2 Primitive Data Types, Memory Alignment & Bitwise Operators",
                        "duration_minutes": 30,
                        "content": (
                            "# Memory Alignment & Padding in C Structs\n\n"
                            "Modern CPU architectures read memory at aligned word boundaries (4-byte or 8-byte).\n\n"
                            "```c\n"
                            "// 12 bytes on 64-bit systems due to padding\n"
                            "struct Unaligned {\n"
                            "    char a;     // 1 byte\n"
                            "    // 3 bytes padding\n"
                            "    int b;      // 4 bytes\n"
                            "    char c;     // 1 byte\n"
                            "    // 3 bytes padding\n"
                            "};\n\n"
                            "// 8 bytes: optimized packing\n"
                            "struct Optimized {\n"
                            "    int b;      // 4 bytes\n"
                            "    char a;     // 1 byte\n"
                            "    char c;     // 1 byte\n"
                            "    // 2 bytes padding\n"
                            "};\n"
                            "```\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: Pointers, Memory Allocation & Buffer Safety",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 Pointer Arithmetic, Void Pointers & Function Callbacks",
                        "duration_minutes": 35,
                        "content": (
                            "# Pointer Arithmetic and Generic Callbacks in C\n\n"
                            "Pointers store virtual addresses. Adding `1` to `int *p` increments the address by `sizeof(int)` (4 bytes).\n\n"
                            "```c\n"
                            "void generic_sort(void *base, size_t nitems, size_t size, int (*compar)(const void *, const void *));\n"
                            "```\n"
                        )
                    },
                    {
                        "title": "2.2 Dynamic Allocation: malloc, calloc, realloc & Valgrind Detection",
                        "duration_minutes": 40,
                        "content": (
                            "# Heap Allocation Invariants & Leak Defense\n\n"
                            "Every call to `malloc()` or `calloc()` must be paired with exactly one `free()`. Double-free and use-after-free vulnerabilities cause critical exploits.\n"
                        )
                    }
                ]
            }
        ]
    },
    {
        "title": "Python 3: From Idiomatic Basics to Async Concurrency",
        "slug": "python-masterclass-core-to-concurrency",
        "description": "Comprehensive Python engineering: object model, protocols, generators, metaclasses, decorators, GIL internals, multiprocessing, and asyncio high-throughput event loops.",
        "difficulty": "intermediate",
        "thumbnail_url": "https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=60",
        "domain": "Programming Languages",
        "modules": [
            {
                "title": "Module 1: The Python Data Model & Idiomatic Protocol Patterns",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 Dunder Methods & Protocol-Driven Polymorphism",
                        "duration_minutes": 25,
                        "content": (
                            "# Python Data Model: Dunder Protocols\n\n"
                            "In Python, behavior is customized through special methods (`__repr__`, `__len__`, `__getitem__`).\n\n"
                            "```python\n"
                            "class Vector:\n"
                            "    __slots__ = ('x', 'y')\n"
                            "    def __init__(self, x: float, y: float):\n"
                            "        self.x = x\n"
                            "        self.y = y\n"
                            "    def __add__(self, other: 'Vector') -> 'Vector':\n"
                            "        return Vector(self.x + other.x, self.y + other.y)\n"
                            "```\n"
                        )
                    },
                    {
                        "title": "1.2 Generators, Iterators & Memory-Efficient Pipelines",
                        "duration_minutes": 30,
                        "content": (
                            "# Lazy Stream Processing with Python Generators\n\n"
                            "Generators maintain execution state without loading millions of records into memory.\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: High-Concurrency AsyncIO & Multiprocessing Architecture",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 The Global Interpreter Lock (GIL) & Process Boundaries",
                        "duration_minutes": 35,
                        "content": (
                            "# GIL Mechanics & CPU-Bound Concurrency\n\n"
                            "Python's GIL allows only one thread to execute Python bytecode at a time. CPU-bound workloads require `multiprocessing` or native C-extensions.\n"
                        )
                    },
                    {
                        "title": "2.2 AsyncIO Coroutines, Task Groups & Non-Blocking I/O",
                        "duration_minutes": 40,
                        "content": (
                            "# Asynchronous Event Loops in Modern Python\n\n"
                            "```python\n"
                            "import asyncio\n\n"
                            "async def fetch_telemetry(sensor_id: int) -> dict:\n"
                            "    await asyncio.sleep(0.05)\n"
                            "    return {'sensor': sensor_id, 'status': 'nominal'}\n\n"
                            "async def main():\n"
                            "    async with asyncio.TaskGroup() as tg:\n"
                            "        tasks = [tg.create_task(fetch_telemetry(i)) for i in range(100)]\n"
                            "```\n"
                        )
                    }
                ]
            }
        ]
    },
    {
        "title": "Java Enterprise Architecture & JVM Internals",
        "slug": "java-enterprise-jvm-internals",
        "description": "Deep dive into the Java platform: type-safe Generics, HotSpot JVM memory layout, Garbage Collection (G1/ZGC), Spring Boot microservices, and Project Loom Virtual Threads.",
        "difficulty": "advanced",
        "thumbnail_url": "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=60",
        "domain": "Programming Languages",
        "modules": [
            {
                "title": "Module 1: Generics Invariants, Collections & Streams",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 Type Erasure, Wildcards (PECS) & Generic Bounds",
                        "duration_minutes": 30,
                        "content": (
                            "# Java Generics & The PECS Principle\n\n"
                            "Producer Extends, Consumer Super: `<? extends T>` allows reading from a collection; `<? super T>` allows writing to it.\n"
                        )
                    },
                    {
                        "title": "1.2 Parallel Streams, Spliterators & ForkJoinPool",
                        "duration_minutes": 35,
                        "content": (
                            "# High-Throughput Data Processing with ForkJoinPool\n\n"
                            "Java parallel streams partition work across CPU cores using work-stealing algorithms.\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: HotSpot JVM Memory Layout & Modern Garbage Collection",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 JVM Memory Areas: Heap, Stack, Metaspace & JIT Compilation",
                        "duration_minutes": 40,
                        "content": (
                            "# HotSpot JVM Architecture: C1/C2 JIT & Tiered Compilation\n\n"
                            "Bytecode execution transitions from interpreter to C1 compiler, then to C2 compiler via profiling counters.\n"
                        )
                    },
                    {
                        "title": "2.2 ZGC and G1 Garbage Collectors: Sub-Millisecond Pauses",
                        "duration_minutes": 45,
                        "content": (
                            "# Low-Latency Garbage Collection in Java\n\n"
                            "ZGC utilizes colored pointers and load barriers to achieve concurrent compaction with pause times under 1ms regardless of heap size.\n"
                        )
                    }
                ]
            }
        ]
    },
    {
        "title": "Data Structures & Algorithmic Analysis",
        "slug": "data-structures-algorithms-analysis",
        "description": "Foundational computer science: asymptotic Big-O analysis, self-balancing AVL/Red-Black trees, graph traversals (Dijkstra/A*), dynamic programming, and amortized complexity.",
        "difficulty": "intermediate",
        "thumbnail_url": "https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=60",
        "domain": "Data Structures & Algorithms",
        "modules": [
            {
                "title": "Module 1: Linear Data Structures & Amortized Complexity",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 Amortized Analysis & Dynamic Array Resizing",
                        "duration_minutes": 25,
                        "content": (
                            "# Asymptotic Big-O & Amortized Doubling\n\n"
                            "When an array doubles its capacity upon filling, individual insertions take $O(1)$ amortized time.\n"
                        )
                    },
                    {
                        "title": "1.2 Sentinel Linked Lists & Circular Ring Buffers",
                        "duration_minutes": 30,
                        "content": (
                            "# Lock-Free Ring Buffers & Cache Locality\n\n"
                            "Ring buffers avoid dynamic allocation overhead by overwriting a fixed memory segment with head and tail pointers.\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: Trees, Graphs & Dynamic Programming",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 Balanced Binary Search Trees: AVL & Red-Black Invariants",
                        "duration_minutes": 40,
                        "content": (
                            "# Self-Balancing Trees: Rotations & Search Guarantees\n\n"
                            "AVL trees enforce a height difference of at most 1, guaranteeing strict $O(\\log N)$ lookup performance.\n"
                        )
                    },
                    {
                        "title": "2.2 Shortest Path Algorithms: Dijkstra, Bellman-Ford & A*",
                        "duration_minutes": 45,
                        "content": (
                            "# Weighted Graph Traversal & Heuristic Search\n\n"
                            "Dijkstra uses a min-priority queue to resolve shortest paths in $O((V + E) \\log V)$ time.\n"
                        )
                    }
                ]
            }
        ]
    },
    {
        "title": "Object-Oriented Programming & Clean Architecture",
        "slug": "oop-principles-design-patterns",
        "description": "Clean object orientation: Encapsulation, Polymorphism, SOLID principles, GoF design patterns (Factory, Strategy, Observer, Decorator), and Domain-Driven Design.",
        "difficulty": "beginner",
        "thumbnail_url": "https://images.unsplash.com/photo-1516116211227-bbc03a2901db?w=800&auto=format&fit=crop&q=60",
        "domain": "Software Architecture",
        "modules": [
            {
                "title": "Module 1: The Core Pillars & The Composition Invariant",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 Encapsulation, State Validation & Class Invariants",
                        "duration_minutes": 20,
                        "content": (
                            "# Protecting Invariants Through Encapsulation\n\n"
                            "Objects must guarantee that internal state can never be mutated into an invalid configuration from outside callers.\n"
                        )
                    },
                    {
                        "title": "1.2 Composition Over Inheritance: Defending Against Fragile Base Classes",
                        "duration_minutes": 25,
                        "content": (
                            "# The Composition Over Inheritance Principle\n\n"
                            "Deep inheritance hierarchies create tight coupling. Favor composition through interfaces and delegate references.\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: SOLID Principles & Essential GoF Patterns",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 The SOLID Framework in Real-World Code",
                        "duration_minutes": 35,
                        "content": (
                            "# The SOLID Architectural Principles\n\n"
                            "- **S**: Single Responsibility Principle\n"
                            "- **O**: Open/Closed Principle\n"
                            "- **L**: Liskov Substitution Principle\n"
                            "- **I**: Interface Segregation Principle\n"
                            "- **D**: Dependency Inversion Principle\n"
                        )
                    },
                    {
                        "title": "2.2 Strategy, Observer & Factory Patterns in Practice",
                        "duration_minutes": 40,
                        "content": (
                            "# Gang of Four Patterns: Decoupling Behavioral Logic\n\n"
                            "The Strategy pattern encapsulates interchangeable algorithms behind a uniform interface, allowing runtime swapping.\n"
                        )
                    }
                ]
            }
        ]
    },
    {
        "title": "Operating Systems: Kernel Architecture & Process Scheduling",
        "slug": "operating-systems-kernel-architecture",
        "description": "Inside modern operating systems: CPU context switching, preemptive schedulers (CFS), virtual memory paging, TLB caches, interrupt handling, and Ext4/ZFS storage inodes.",
        "difficulty": "advanced",
        "thumbnail_url": "https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=60",
        "domain": "Systems & Low-Level",
        "modules": [
            {
                "title": "Module 1: Hardware Privilege Rings, Traps & Process Scheduling",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 Ring 0 vs Ring 3: Syscalls, Interrupts & Traps",
                        "duration_minutes": 30,
                        "content": (
                            "# Dual-Mode CPU Operation: Kernel Mode Transitions\n\n"
                            "When an application executes `read()` or `write()`, CPU triggers a trap instruction switching hardware privilege from Ring 3 to Ring 0.\n"
                        )
                    },
                    {
                        "title": "1.2 Linux Completely Fair Scheduler (CFS) & Red-Black Runqueues",
                        "duration_minutes": 35,
                        "content": (
                            "# The Completely Fair Scheduler (CFS)\n\n"
                            "CFS tracks virtual runtime (`vruntime`) for each runnable process using a balanced Red-Black tree to guarantee proportional fairness.\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: Virtual Memory, Multi-Level Paging & File System Inodes",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 4-Level Page Tables, MMU Hardware & TLB Shootdowns",
                        "duration_minutes": 40,
                        "content": (
                            "# Virtual Memory Translation Dynamics\n\n"
                            "Virtual addresses are translated by the Memory Management Unit (MMU) using page tables cached in Translation Lookaside Buffers (TLB).\n"
                        )
                    },
                    {
                        "title": "2.2 File System Architecture: Inodes, Extents & Journaling",
                        "duration_minutes": 45,
                        "content": (
                            "# Inode Data Structures & Crash Consistency\n\n"
                            "Inodes store file metadata (permissions, timestamps, extent pointers) decoupled from human-readable directory filenames.\n"
                        )
                    }
                ]
            }
        ]
    },
    {
        "title": "Cloud Computing: Architecting Resilient Microservices",
        "slug": "cloud-computing-architecture",
        "description": "Architecting modern cloud solutions: IaaS/PaaS/SaaS trade-offs, multi-AZ high availability, serverless event-driven lambdas, API gateways, and multi-region disaster recovery.",
        "difficulty": "intermediate",
        "thumbnail_url": "https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=60",
        "domain": "Cloud & Infrastructure",
        "modules": [
            {
                "title": "Module 1: Cloud Service Models, Elasticity & Global Networking",
                "order_index": 1,
                "lessons": [
                    {
                        "title": "1.1 IaaS, PaaS, and Serverless: Architectural Trade-Offs",
                        "duration_minutes": 25,
                        "content": (
                            "# Cloud Compute Paradigms & Operational Burden\n\n"
                            "Balancing infrastructural control against managed operational overhead: VMs vs Containers vs Serverless Functions.\n"
                        )
                    },
                    {
                        "title": "1.2 Global VPCs, Subnets, Internet Gateways & NAT Traversal",
                        "duration_minutes": 30,
                        "content": (
                            "# Cloud Network Topology & Security Boundaries\n\n"
                            "Designing isolated private subnets with egress-only NAT gateways to defend database tiers from direct internet exposure.\n"
                        )
                    }
                ]
            },
            {
                "title": "Module 2: High Availability, Auto-Scaling & Multi-Region Resiliency",
                "order_index": 2,
                "lessons": [
                    {
                        "title": "2.1 Multi-AZ Deployment, Health Checks & Target Group Probes",
                        "duration_minutes": 35,
                        "content": (
                            "# Fault-Tolerant Application Load Balancing\n\n"
                            "Distributing traffic across isolated physical availability zones with automated health-check draining and zero-downtime rolling deploys.\n"
                        )
                    },
                    {
                        "title": "2.2 Disaster Recovery Architectures: RTO, RPO & Active-Active Replication",
                        "duration_minutes": 40,
                        "content": (
                            "# Formulating Recovery Time (RTO) and Recovery Point (RPO) Objectives\n\n"
                            "Comparing Backup & Restore, Pilot Light, Warm Standby, and Multi-Site Active/Active cross-region architectures.\n"
                        )
                    }
                ]
            }
        ]
    }
]

def seed_expanded_courses():
    db: Session = SessionLocal()
    try:
        instructor = db.query(User).filter(User.email == "instructor@learnflow.edu").first()
        if not instructor:
            logger.error("Instructor user not found.")
            return

        added_courses = 0
        for cdata in COURSES_DATA:
            existing = db.query(Course).filter(Course.slug == cdata["slug"]).first()
            if existing:
                logger.info(f"Course already exists: {cdata['title']}")
                continue

            course = Course(
                id=uuid.uuid4(),
                title=cdata["title"],
                slug=cdata["slug"],
                description=cdata["description"],
                difficulty=cdata["difficulty"],
                status="published",
                thumbnail_url=cdata["thumbnail_url"],
                instructor_id=instructor.id,
                sequential_modules=True
            )
            db.add(course)
            db.commit()
            db.refresh(course)

            for m_idx, mdata in enumerate(cdata["modules"], 1):
                mod = Module(
                    id=uuid.uuid4(),
                    course_id=course.id,
                    title=mdata["title"],
                    order_index=m_idx
                )
                db.add(mod)
                db.commit()
                db.refresh(mod)

                for l_idx, ldata in enumerate(mdata["lessons"], 1):
                    lesson = Lesson(
                        id=uuid.uuid4(),
                        course_id=course.id,
                        module_id=mod.id,
                        title=ldata["title"],
                        duration_minutes=ldata["duration_minutes"],
                        content_type="text",
                        content_body=ldata["content"],
                        order_index=l_idx
                    )
                    db.add(lesson)

            db.commit()
            added_courses += 1
            logger.info(f"Successfully seeded course: {cdata['title']}")

        logger.info(f"Seeding completed. Added {added_courses} new courses.")
    finally:
        db.close()

if __name__ == "__main__":
    seed_expanded_courses()
