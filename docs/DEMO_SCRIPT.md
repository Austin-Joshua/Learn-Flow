# Learnflow LMS — Evaluator Demonstration Script (7–8 Minutes)

This script provides an exact, step-by-step walkthrough for evaluators and reviewers. It demonstrates all primary roles, the sequential progression engine, autograding across all four question types, assignment submission and grading, certificate verification, administrative auditing, and key security edge cases.

---

## 0. Institutional Demo Personas & Credentials

All accounts are pre-seeded in the database via `scripts/seed_demo.py` and accessible via 1-click auto-fill buttons on the login screen (`/login`):

| Role | Email | Password | Primary Mission |
| :--- | :--- | :--- | :--- |
| **Learner / Student (Primary)** | `learner@learnflow.edu` | *(See README)* | Experience sequential progression, take assessments, submit assignments, and earn certificates. |
| **Learner (At-Risk Demo)** | `struggling.learner@learnflow.edu` | *(See README)* | Demonstrates explainable at-risk flags (low score, behind pace, missed deadlines). |
| **Faculty / Instructor** | `instructor@learnflow.edu` | *(See README)* | Author curricula, configure completion criteria, inspect at-risk cohort analytics, and grade assignments. |
| **Department Head (HOD)** | `hod@learnflow.edu` | *(See README)* | Review department course health, student completion velocity, at-risk student counts, and grading turnaround times. |
| **Platform Administrator** | `admin@learnflow.edu` | *(See README)* | Manage user roles, inspect append-only SHA-256 audit logs, and administer certificate revocation. |

---

## 1. Learner Journey & Sequential Progression (2.5 Minutes)

### Step 1: Sign In as Student
1. Open the browser to `http://localhost:5173/login`.
2. Click the **"Learner (Student)"** 1-click persona button (or type credentials from the README table).
3. Click **"Sign In"**. You arrive at `/my-learning`.

### Step 2: Inspect Sequential Journey Mountain
1. In the sidebar, click **"My Journey"** (`/my-journey`).
2. Observe the interactive mountain trail:
   - **Course 1 (System Design & Distributed Architecture):** Displays as completed ($100\%$) with an earned diploma badge.
   - **Course 2 (Advanced React & TypeScript Patterns):** Displays as active in progress ($50\%$), with Module 1 completed and Module 2 unlocked.
   - **Course 4 (Cloud-Native Infrastructure):** Displays as newly enrolled ($0\%$) at basecamp.
3. Observe the assessment waypoint cards on the journey trail:
   - Shows assessment status with direct action buttons: **"Take Assessment"**, **"Resume"**, or **"View Result"**, or disabled with plain locked reasons.
4. Click on Course 2 to open its Course Detail page (`/courses/advanced-react-typescript-patterns`).

### Step 3: Course Detail, Assessments & Lesson Resources
1. On the course detail page, review the sections:
   - **Curriculum Accordion:** Shows module progression. Module 1 is completed; Module 2 is unlocked.
   - **Assessments Section:** Displays course quizzes with title, time limit, passing score, attempts used/allowed, best score, and current status.
   - **Assignments Section:** Displays required assignments with due dates, maximum points, allowed file types, submission status, and instructor feedback.
   - **Completion & Certificate Panel:** Displays live progress against course completion criteria (minimum lesson percentage, required assessments with passing score, and required assignments) with an active **"Claim Certificate"** button once eligible.
2. Click on a lesson to launch the **Lesson Player** (`/courses/:id/lessons/:id`).
3. Note the **Resources** tab/panel in the lesson player:
   - Displays instructor-provided downloadable reference materials (e.g. *Distributed Systems Architecture Reference Cheat Sheet*).
   - Clicking download requests a short-lived authorized download URL via `/api/v1/lessons/:id/resources/:id/download`.
4. Inspect the **Account Settings** page (`/settings`) by clicking your profile avatar in the header to review profile details, active roles, and theme preferences.

### Step 4: Edge Case Demonstration — Out-of-Order / Locked Module Access
1. In the browser address bar, directly attempt to jump to an uncompleted lesson or locked assessment URL out-of-order on an incomplete course.
2. Notice that the backend returns an authoritative **HTTP 403 Forbidden** error naming the exact module or lesson prerequisite that must be completed first. Client-side URL tampering is authoritatively rejected by the backend!

---

## 2. Interactive Timed Assessment Arena (2.0 Minutes)

### Step 1: Launch Examination
1. Navigate to `/courses/system-design-distributed-architecture`.
2. Scroll to **Midterm Assessment: Concurrency & Storage Architecture** and click **"Take Assessment"** (or view prior result if already completed).
3. Note the sticky **Timed Assessment Arena** header with the server-synchronized countdown timer.

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
   - *Answer:* Type `TCP` (or `Transmission Control Protocol`). Notice that punctuation and casing are normalized while technical symbols (`C++`, `.NET`, `HTTP/2`) are preserved.

### Step 3: Submit & Review Instant Diagnostics
1. Click **"Submit Assessment"**.
2. Confirm submission. The atomic autograding pipeline evaluates all answers, calculates the score, and displays the **Assessment Result Page**.
3. Observe the concept-level diagnostic breakdown showing strengths in relational indexing and caching, along with adaptive lesson review links for any missed questions.
4. Note that answer keys and correct solution flags are strictly concealed on student-facing views.

---

## 3. Learner Assignment End-to-End Quarantine Flow (1.0 Minute)

1. Return to `/courses/system-design-distributed-architecture` and locate the **"Distributed Rate Limiter Implementation & Benchmark"** assignment.
2. Click **"Submit Assignment"**.
3. Select a `.pdf` or `.zip` file under the 10 MB limit.
4. Observe the client-side validation for MIME type and file size.
5. Click **"Submit Assignment"**:
   - The frontend requests a presigned upload URL from `POST /api/v1/assignments/:id/upload-url`.
   - The file payload uploads directly to the isolated S3 **quarantine** bucket (`quarantine/...`).
   - The client invokes `POST /api/v1/assignments/:id/submit` with the returned `file_id`.
   - Server-side file inspection validates MIME type, extension, magic bytes, and path traversal defenses before safely promoting the file to clean storage.
6. The UI updates to show the submission status, submission timestamp, and instructor feedback once graded.
7. Sign out from the learner account.

---

## 4. Faculty Studio, Builder & Cohort Analytics (1.5 Minutes)

### Step 1: Sign In as Instructor
1. On `/login`, click the **"Instructor (Faculty)"** 1-click persona button.
2. Click **"Sign In"**. You arrive at `/instructor/courses`.

### Step 2: Course Builder Authoring & Completion Criteria
1. Click **"Manage Course"** or **"Curriculum Builder"** on any owned course.
2. Notice the comprehensive authoring capabilities:
   - **Assessment Authoring:** Create assessments with title, time limit (minutes), passing score percentage, and maximum attempts.
   - **Question Authoring:** Add questions across all 4 types (Single Choice, Multiple Choice, True/False, Short Answer with accepted variants), points, and concept tags. Real-time form validation ensures single-choice has exactly one correct answer, multiple-choice has at least one, and true/false has two valid options.
   - **Assignment Authoring:** Create assignments with title, description instructions, due date, max points, and allowed extensions (`pdf,zip,tar.gz`).
   - **Lesson Resource Attachments:** Upload downloadable resources directly to lessons via presigned S3 upload.
   - **Configurable Completion Criteria:** Set minimum lesson completion %, required assessments with passing score thresholds, and required assignments. Bumping criteria creates a versioned snapshot that protects existing issued certificates.
   - **Guarded Deletions:** Attempting to delete modules, lessons, or assessments with active learner attempts or submissions is safely rejected with clear explanatory feedback.

### Step 3: Grade Pending Submissions
1. In the sidebar, click **"Grading Queue"** (`/instructor/grading`).
2. Locate the student submission from Ada Lovelace.
3. Click **"Review & Grade"**.
4. In the grading drawer, enter a numeric rubric score (e.g. `94.0`) and qualitative feedback:
   > *"Exemplary engineering: boundary conditions, clock skew defenses, and benchmark graphs are rigorous."*
5. Click **"Submit Final Grade"**. The grade and audit trail are atomically persisted.

### Step 4: Explainable At-Risk Learners in Cohort Analytics
1. Navigate to `/instructor/courses/:id/analytics` (or click **"Analytics"** on the course card).
2. Scroll to the **"Learners Needing Academic Support"** panel.
3. Observe Charles Babbage (`struggling.learner@learnflow.edu`) flagged with clear, explainable academic factors:
   - **Behind Expected Pace:** Enrollment older than 7 days with $< 25\%$ progress.
   - **Failed Assessment Attempt:** Score below the $70\%$ passing threshold.
   - **Missed Assignment Deadlines:** Unsubmitted assignment past its due date.
4. Sign out from the instructor account.

---

## 5. Certificate Issuance, Public Verification & Revocation (1.0 Minute)

### Step 1: Claim Certificate
1. Sign back in as **Learner** (`learner@learnflow.edu`).
2. Navigate to `/courses/system-design-distributed-architecture`.
3. Because all lessons, the midterm assessment, and the assignment are completed ($100\%$ completion), click **"Claim Official Certificate"**.
4. The system mints the certificate, signs it using HMAC-SHA256, stores a versioned criteria snapshot, generates a PDF diploma, and assigns an institutional code (e.g. `LF-8e4b7c12f0...`).
5. In the sidebar, navigate to **"Credentials"** (`/my-certificates`). Click **"Copy Verification Token"**.

### Step 2: Public Institutional Verification
1. Sign out and return to the public landing page (`/`).
2. Click **"Verification"** in the top navbar to navigate to `/verify`.
3. Paste the valid token and click **"Verify"**.
4. Observe the verified credential badge displaying:
   - Status: **VALID & ACTIVE**
   - Recipient: **Ada Lovelace**
   - Course: **Full-Stack System Design & Distributed Architecture**
   - Signature: **Cryptographically Valid HMAC-SHA256**
   - Revocation Check: **Clean (Not Revoked)**

### Step 3: Revocation Verification
1. On the same verification page (`/verify`), test the pre-seeded revoked diploma:
   - Paste token: `LF-REVOKED9999DEMO`
   - Click **"Verify"**.
2. Observe the clear revoked badge:
   - Status: **REVOKED**
   - Revocation Reason: **Academic integrity violation: unauthorized code sharing detected during audit.**
   - Verified via: Server-side cryptographic ledger validation.

---

## 6. Academic Leadership & Administration Governance (0.5 Minute)

### Step 1: HOD Department Oversight
1. Sign in as **Department Head** (`hod@learnflow.edu`).
2. Navigate to `/hod`.
3. View the **Department of Computer Science & Engineering** dashboard:
   - Review departmental course completion velocities and student cohort health.
   - Inspect the **At-Risk Students Count** summary card (data-minimized: aggregates student count without exposing private student identities).
   - Review faculty workload metrics displaying course assignments without exposing personal email addresses.

### Step 2: Administrator Governance & Audit Ledger
1. Sign in as **Platform Administrator** (`admin@learnflow.edu`).
2. Navigate to `/admin`.
3. Scroll to the **Cryptographic Audit Stream**.
4. Inspect the append-only audit ledger chained with SHA-256 hashes, recording all recent student logins, assessment starts, grading outcomes, and certificate issuance events with timestamps and IP addresses.

---

**End of Demonstration.** (Total elapsed time: ~7.5 minutes).
