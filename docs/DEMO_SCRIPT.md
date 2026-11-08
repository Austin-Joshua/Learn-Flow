# Learnflow LMS — Evaluator Demonstration Script (7–8 Minutes)

This script provides an exact, step-by-step walkthrough for evaluators and reviewers. It demonstrates all primary roles, the sequential progression engine, autograding across all four question types, assignment submission and grading, certificate verification, administrative auditing, and key security edge cases.

---

## 0. Institutional Demo Personas & Credentials

All accounts are pre-seeded in the database and accessible via 1-click auto-fill buttons on the login screen (`/login`):

| Role | Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- |
| **Learner / Student** | `learner@learnflow.edu` | `LearnerPass123!` | Experience sequential progression, take assessments, submit assignments, and earn certificates. |
| **Faculty / Instructor** | `instructor@learnflow.edu` | `InstructorPass123!` | Author curricula, inspect cohort analytics, and grade student assignment submissions. |
| **Department Head (HOD)** | `hod@learnflow.edu` | `HodPass123!` | Review department course health, student completion velocity, and faculty grading SLAs. |
| **Platform Administrator** | `admin@learnflow.edu` | `AdminPass123!` | Manage user roles, inspect append-only SHA-256 audit logs, and administer certificates. |

---

## 1. Learner Journey & Sequential Progression (2.5 Minutes)

### Step 1: Sign In as Student
1. Open the browser to `http://localhost:5173/login`.
2. Click the **"Learner (Student)"** 1-click persona button (or type `learner@learnflow.edu` / `LearnerPass123!`).
3. Click **"Sign In"**. You arrive at `/my-learning`.

### Step 2: Inspect Sequential Journey Mountain
1. In the sidebar (or bottom bar on mobile), click **"My Journey"** (`/my-journey`).
2. Observe the interactive mountain trail:
   - **Course 1 (System Design):** Displays as completed ($100\%$) with an earned diploma badge.
   - **Course 2 (Advanced React):** Displays as active in progress ($50\%$), with Module 1 completed and Module 2 unlocked.
   - **Course 4 (Cloud-Native):** Displays as newly enrolled ($0\%$) at basecamp.
3. Click on the active Course 2 card to navigate to its Course Detail page (`/courses/advanced-react-typescript-patterns`).

### Step 3: Edge Case Demonstration — Out-of-Order / Locked Module Access
1. Scroll down to the curriculum accordion.
2. Observe that **Module 1 (React 19 Concurrency)** is completed ($1/1$ lessons).
3. Observe that **Module 2 (Type-Safe State Architecture)** is unlocked because Module 1 was completed.
4. Open the browser address bar and directly attempt to jump to an uncompleted lesson or locked assessment URL out-of-order, or click on a locked element if sequential locking is enabled on an uncompleted course.
5. Notice that the backend returns an authoritative **HTTP 403 Forbidden** error naming the exact module or lesson prerequisite that must be completed first. Client-side URL tampering is authoritatively rejected by the backend!

---

## 2. Interactive Timed Assessment Arena (2.0 Minutes)

### Step 1: Launch Examination
1. Navigate to `/courses/system-design-distributed-architecture`.
2. Scroll to **Midterm Assessment: Concurrency & Storage Architecture** and click **"Take Assessment"** (`/assessments/...`).
3. Note the sticky **Secure Timed Assessment Arena** header with the server-synchronized countdown timer.

### Step 2: Experience All Four Autograded Question Types
The midterm assessment incorporates all 4 autograded question types supported by the evaluation engine:
1. **Single Choice (Question 1):**
   - *Prompt:* "Which scan type in PostgreSQL execution plans confirms that all requested query columns were resolved directly from the index without reading the table heap?"
   - *Answer:* Select **"Index Only Scan"**.
2. **Multiple Choice with Partial Credit (Question 2):**
   - *Prompt:* "Which of the following techniques mitigate cache stampede (thundering herd) when a popular key expires? (Select all that apply)"
   - *Answer:* Select **"Locking/Mutex on cache miss before database query"**, **"Probabilistic early expiration (XFetch algorithm)"**, and **"Pre-warming cache asynchronously in background workers"**. (Leave "Setting all cache TTLs to expire at midnight simultaneously" unchecked).
3. **True / False (Question 3):**
   - *Prompt:* "PostgreSQL transaction-level advisory locks (`pg_advisory_xact_lock`) are automatically released upon transaction COMMIT or ROLLBACK."
   - *Answer:* Select **"True"**.
4. **Symbol-Preserving Short Answer (Question 4):**
   - *Prompt:* "What transport layer protocol delivers HTTP/2 multiplexed streams over a single reliable connection?"
   - *Answer:* Type `TCP` (or `Transmission Control Protocol`). Notice that punctuation and casing are normalized while technical symbols are preserved.

### Step 3: Submit & Review Instant Diagnostics
1. Click **"Submit Assessment"**.
2. Confirm submission. The atomic autograding pipeline evaluates all answers, calculates the score, and displays the **Assessment Result Page**.
3. Observe the concept-level diagnostic breakdown showing strengths in relational indexing and caching, along with adaptive lesson review links for any missed questions.

---

## 3. Assignment Submission & Quarantine Pipeline (1.0 Minute)

1. Return to `/courses/system-design-distributed-architecture` and locate the **"Distributed Rate Limiter Implementation & Benchmark"** assignment.
2. Click **"Submit Assignment"**.
3. Upload a sample `.pdf` or `.zip` file.
4. **Behind the scenes:** The file is initially uploaded via presigned URL to the isolated S3 **quarantine** bucket. Upon submission confirmation, the backend file inspector verifies magic bytes, ensures no executable headers or path-traversal sequences exist, and safely promotes the file to clean storage.
5. In the top navigation bar, click the user profile icon and select **"Sign Out"**.

---

## 4. Faculty Studio & Rubric Grading (1.0 Minute)

### Step 1: Sign In as Instructor
1. On `/login`, click the **"Instructor (Faculty)"** 1-click persona button.
2. Click **"Sign In"**. You arrive at `/instructor/courses`.

### Step 2: Grade Pending Submissions
1. In the sidebar, click **"Grading Queue"** (`/instructor/grading`).
2. Locate the student submission from Ada Lovelace.
3. Click **"Review & Grade"**.
4. In the grading drawer, enter a numeric rubric score (e.g. `95.0`) and qualitative feedback:
   > *"Excellent benchmark analysis demonstrating token-bucket concurrency bounds and sliding-window Redis Lua script execution under high load."*
5. Click **"Submit Final Grade"**. The grade and audit trail are atomically persisted.
6. Sign out from the instructor account.

---

## 5. Certificate Issuance & Public Verification (1.0 Minute)

### Step 1: Claim Certificate
1. Sign back in as **Learner** (`learner@learnflow.edu`).
2. Navigate to `/courses/system-design-distributed-architecture`.
3. Because all lessons, the midterm assessment, and the assignment are passed ($100\%$ completion), click **"Claim Official Certificate"**.
4. The system mints the certificate, signs it using HMAC-SHA256, generates a branded PDF diploma, and assigns an institutional token (e.g. `LF-8e4b7c12f0...`).
5. In the sidebar, navigate to **"Credentials"** (`/my-certificates`). Click **"Copy Verification Token"**.

### Step 2: Public Institutional Verification
1. Sign out and return to the public landing page (`/`).
2. Scroll to the **"Instant Public Certificate Verification"** section at the bottom (or click **"Verification"** in the top navbar to reach `/verify`).
3. Paste the token into the input field and click **"Verify"**.
4. Observe the verified credential badge displaying:
   - Status: **VALID & ACTIVE**
   - Recipient: **Ada Lovelace**
   - Course: **Full-Stack System Design & Distributed Architecture**
   - Signature: **Cryptographically Valid HMAC-SHA256**
   - Revocation Check: **Clean (Not Revoked)**

---

## 6. Academic Leadership & Administration Governance (0.5 Minute)

### Step 1: HOD Department Oversight
1. Sign in as **Department Head** (`hod@learnflow.edu`).
2. Navigate to `/hod`.
3. View the **Department of Computer Science & Engineering** dashboard:
   - Review departmental course completion velocities and student cohort health.
   - Note data minimization: faculty workload metrics display course assignments without exposing faculty personal email addresses.

### Step 2: Administrator Governance & Audit Ledger
1. Sign in as **Platform Administrator** (`admin@learnflow.edu`).
2. Navigate to `/admin`.
3. Scroll to the **Cryptographic Audit Stream**.
4. Inspect the append-only audit ledger chained with SHA-256 hashes, recording all recent student logins, assessment starts, grading outcomes, and certificate issuance events with timestamps and IP addresses.

---

**End of Demonstration.** (Total elapsed time: ~7.5 minutes).
