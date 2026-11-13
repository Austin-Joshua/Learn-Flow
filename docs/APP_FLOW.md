# Learnflow LMS — Application Flow Documentation

> **Source of truth:** Derived from `frontend/src/App.tsx`, `frontend/src/store/authStore.ts`, `frontend/src/services/api.ts`, `frontend/src/config/navigation.ts`, and all 22 page components in `frontend/src/pages/`.

---

## 1. Application Entry Point

```
Browser → / (root)
         │
         ▼
   RootRedirect (App.tsx:59-65)
         │
   isAuthenticated?
   ├── YES → getDefaultDashboardPath() → role-based redirect
   └── NO  → LandingPage (eagerly loaded, no code split)
```

**Key behavior:** `App.tsx` calls `loadFromStorage()` on mount to hydrate auth state from `localStorage`/`sessionStorage` before the router resolves. This prevents a flash of unauthenticated state on cold browser launch.

---

## 2. Overall Navigation Map

```mermaid
flowchart TD
    ROOT["/"] --> REDIRECT{Authenticated?}
    REDIRECT -->|Yes| DASH[Role Dashboard]
    REDIRECT -->|No| LANDING[LandingPage]

    LANDING --> LOGIN["/login"]
    LANDING --> REGISTER["/register"]
    LANDING --> CATALOG["/courses"]
    LANDING --> VERIFY["/verify"]

    LOGIN --> DASH
    REGISTER --> DASH

    DASH -->|admin| ADMIN["/admin"]
    DASH -->|instructor| INSTRUCTOR["/instructor/courses"]
    DASH -->|learner| LEARN["/my-learning"]

    ADMIN --> USERS[User Management]
    ADMIN --> COURSES_ADMIN[Course Oversight]
    ADMIN --> AUDIT[Audit Logs]

    INSTRUCTOR --> BUILDER["/instructor/courses/:id/builder"]
    INSTRUCTOR --> GRADING["/instructor/grading"]
    INSTRUCTOR --> ANALYTICS["/instructor/courses/:id/analytics"]

    LEARN --> COURSE_DETAIL["/courses/:id"]
    LEARN --> LESSON["/lessons/:id"]
    LEARN --> ARENA["/assessments/:id"]
    LEARN --> RESULT["/attempts/:id/result"]
    LEARN --> JOURNEY["/my-journey"]
    LEARN --> CERTS["/my-certificates"]
    LEARN --> ADAPTIVE["/adaptive-path"]

    CATALOG --> COURSE_DETAIL
    VERIFY_CERT["/verify/:code"] --> PUBLIC_VERIFY[PublicVerifyCertificatePage]

    GLOBAL_SETTINGS["/settings"] --> ALL_USERS((All Roles))
    AVATAR["/avatar-studio"] --> ALL_USERS
```

---

## 3. Authentication Flow

### 3.1 Login Flow

```mermaid
flowchart TD
    A[User visits /login] --> B[LoginPage renders inside AuthLayout]
    B --> C[User submits email + password]
    C --> D[POST /api/v1/auth/login]
    D -->|Success| E[Receive access_token + user object]
    E --> F[setMemoryToken: in-memory RFC 6819 storage]
    E --> G[sessionStorage: learnflow_session_token]
    E --> H[localStorage: learnflow_user JSON]
    F & G & H --> I[authStore: isAuthenticated=true]
    I --> J[Navigate to getDefaultDashboardPath]
    D -->|Failure| K[Show error message on form]
    K --> C
```

### 3.2 Registration Flow

```mermaid
flowchart TD
    A[User visits /register or /signup] --> B[RegisterPage inside AuthLayout]
    B --> C[User fills: first_name, last_name, email, password]
    C --> D[POST /api/v1/auth/register]
    D -->|Success| E[Receive access_token + user object]
    E --> F[Same token storage as login]
    F --> G[isAuthenticated=true, navigate to /my-learning]
    D -->|Failure| H[Show validation error e.g. email exists]
    H --> C
```

### 3.3 Session Restoration on Cold Start

```mermaid
flowchart TD
    A[App mounts: loadFromStorage] --> B{learnflow_user in localStorage?}
    B -->|No| C[Clear session, isAuthenticated=false]
    B -->|Yes| D{learnflow_session_token in sessionStorage?}
    D -->|Yes| E[Restore in-memory token, isAuthenticated=true]
    E --> F[Background: GET /auth/me to hydrate user profile]
    F -->|401| G[POST /auth/refresh attempt]
    G -->|Success| H[New token stored, session continues]
    G -->|Fail| I[Full logout: clear all storage]
    D -->|No| J[POST /auth/refresh via HttpOnly cookie]
    J -->|Success| K[New access_token stored, GET /auth/me]
    J -->|Fail| I
```

### 3.4 Automatic Token Refresh (Silent)

The `api.ts` Axios response interceptor handles 401 errors automatically:

1. **Cross-tab check:** If another tab already refreshed the token (detected via `BroadcastChannel learnflow_auth_sync`), replay the failed request with the current in-memory token.
2. **Single-flight refresh:** Only one tab at a time issues `POST /auth/refresh`. Other tabs await the same `refreshPromise`.
3. **Failure path:** On refresh failure → `localStorage` cleared → `window.location.href = '/login?expired=1'`.

### 3.5 Cross-Tab Synchronization

- Uses `BroadcastChannel('learnflow_auth_sync')`.
- `TOKEN_REFRESHED` message: other tabs update their `memoryToken`.
- `AUTH_REVOKED` message: other tabs clear their auth state.
- `subscribeAuthSync` in `authStore.ts` syncs Zustand state accordingly.

### 3.6 Logout Flow

```mermaid
flowchart TD
    A[User clicks Logout] --> B[handleLogout in AppShell]
    B --> C[setMemoryToken null]
    B --> D[localStorage.removeItem learnflow_user + learnflow_token]
    B --> E[sessionStorage.removeItem learnflow_session_token]
    B --> F[sessionStorage.setItem learnflow_logging_out true]
    B --> G[Zustand: token=null, user=null, isAuthenticated=false]
    B --> H[POST /auth/logout fire-and-forget]
    B --> I[navigate to / with replace]
    I --> J[RootRedirect → LandingPage]
```

---

## 4. Role-Based Access Control & Routing

### 4.1 Role Hierarchy (Auth Priority)

| Priority | Role | Default Dashboard | Route Guard |
|---|---|---|---|
| 1 | `admin` | `/admin` | `requiredRole="admin"` |
| 2 | `instructor` / `staff` | `/instructor/courses` | `requiredRole={['instructor','admin']}` |
| 3 | `learner` | `/my-learning` | `requiredRole="learner"` |
| 4 | (unauthenticated) | `/` (LandingPage) | Public |

`getDefaultDashboardPath()` in `authStore.ts` checks roles in priority order.

### 4.2 ProtectedRoute Component

Wraps every authenticated page via the `Workspace` component:

```tsx
<Workspace requiredRole="learner">
  <MyLearningPage />
</Workspace>
```

`ProtectedRoute` redirects unauthenticated users to `/login`. Role-mismatched users are redirected to their own dashboard.

### 4.3 Route Aliases (Zero 404s)

| Alias | Resolves To |
|---|---|
| `/home`, `/dashboard` | `RootRedirect` |
| `/learning` | `/my-learning` |
| `/journey` | `/my-journey` |
| `/catalog` | `/courses` |
| `/certificates`, `/diplomas` | `/my-certificates` |
| `/studio`, `/instructor` | `/instructor/courses` |
| `/admin/courses` | `/instructor/courses` |
| `/avatar` | `/avatar-studio` |
| `/hod` | `/courses` (legacy redirect) |

---

## 5. Admin Journey

```mermaid
flowchart LR
    A[Login as Admin] --> B["/admin — AdminDashboardPage"]
    B --> C{Active Tab}
    C -->|Users Tab| D[User list with DataTable]
    D --> D1[Search by name/email]
    D --> D2[Filter by role]
    D --> D3[Toggle user active/inactive: PATCH /users/:id/status]
    D --> D4[Assign role: POST /users/:id/roles]
    C -->|Courses Tab| E[Course list with cover images]
    E --> E1[Quick Peek Modal: syllabus preview]
    E --> E2[Link to Course Builder]
    C -->|Audit Logs Tab| F[System audit log table]
    F --> F1[50 most recent events]
    B --> G[StatTile widgets: SystemOverview]
    G --> G1[Total users, active learners, courses, completions]
    B --> H["/instructor/courses — Course Studio"]
    B --> I["/settings — Account Settings"]
```

**Data sources:** `GET /users`, `GET /system/audit-logs?limit=50`, `GET /analytics/overview`, `GET /courses` — all parallelized via `Promise.all`.

---

## 6. Instructor Journey

```mermaid
flowchart LR
    A[Login as Instructor] --> B["/instructor/courses — InstructorDashboardPage"]
    B --> C[List managed courses: GET /courses/managed]
    B --> D[Grading queue count: GET /assignments/instructor/queue]

    B --> E[Filter + Sort Courses]
    E --> E1[Search by title/description]
    E --> E2[Filter: status, difficulty]
    E --> E3[Sort: learners, title, status]

    B --> F[Create New Course Modal]
    F --> F1[Title + Description + Difficulty]
    F --> F2[POST /courses → navigates to builder]

    B --> G[Course Card Actions]
    G --> G1[View Course: /courses/:id]
    G --> G2[Open Builder: /instructor/courses/:id/builder]
    G --> G3[Analytics: /instructor/courses/:id/analytics]
    G --> G4[Grading: /instructor/grading]

    G2 --> BUILDER[CourseBuilderPage]
    BUILDER --> H[Modules + Lessons Management]
    BUILDER --> I[Assessment Authoring]
    BUILDER --> J[Assignment Authoring]
    BUILDER --> K[Prerequisites & Concepts]
    BUILDER --> L[Completion Criteria]
    BUILDER --> M[Resource Upload]

    G4 --> GRADING[AssignmentGradingQueuePage]
    GRADING --> N[GET /assignments/instructor/queue]
    GRADING --> O[Grade submission: POST /assignments/submissions/:id/feedback]
    GRADING --> P[Score + Comments form]

    G3 --> ANALYTICS[CohortAnalyticsPage]
    ANALYTICS --> Q[GET /analytics/instructor/courses/:id]
    ANALYTICS --> R[At-risk learners: GET /analytics/courses/:id/at-risk]
```

---

## 7. Learner Journey

```mermaid
flowchart TD
    A[Login as Learner] --> B["/my-learning — MyLearningPage"]

    B --> C[Enrolled courses: GET /enrollments/my-courses]
    B --> D[Catalog: GET /courses]
    B --> E[ProgressRing per enrolled course]

    B --> F[Enroll in new course]
    F --> F1[POST /enrollments/courses/:id/enroll]
    F1 --> G[CourseDetailPage: /courses/:id]

    G --> H[Course Hero Banner]
    G --> I[CourseModuleAccordion: modules + lessons]
    G --> J[CourseStatsSidebar]
    G --> K[Assessments list]
    G --> L[Assignments list]
    G --> M[Submit assignment: upload + quarantine scan]
    G --> N[Feedback modal: POST /courses/:id/feedback]
    G --> O[Claim certificate when eligible]

    I --> LESSON["/lessons/:id — LessonPlayerPage"]
    LESSON --> P[Read lesson content]
    LESSON --> Q[Text selection toolbar: highlight + AI explain]
    LESSON --> R[Notes drawer: local storage per user+lesson]
    LESSON --> S[AI Explain drawer: concept explanations]
    LESSON --> T[Mark complete: POST /lessons/:id/complete]
    LESSON --> U[Download resources]
    LESSON --> V[Navigate prev/next lesson]

    K --> ARENA["/assessments/:id — AssessmentArenaPage"]
    ARENA --> W[Start/resume attempt: POST /assessments/:id/attempts/start]
    ARENA --> X[Question-by-question navigation]
    ARENA --> Y[Auto-save drafts to localStorage]
    ARENA --> Z[Countdown timer]
    ARENA --> AA[Submit: POST /attempts/:id/submit with idempotency key]
    AA --> RESULT["/attempts/:id/result — AssessmentResultPage"]

    B --> JOURNEY["/my-journey — MyJourneyPage"]
    JOURNEY --> BB[MountainScene SVG visualization]
    JOURNEY --> CC[JourneyLedger: module-by-module progress]
    JOURNEY --> DD[Course selector dropdown]

    B --> CERTS["/my-certificates — LearnerCertificatesPage"]
    CERTS --> EE[GET /certificates/my]
    CERTS --> FF[CertificateDiplomaCard: download PDF/image]
    CERTS --> GG[Link to public registry /verify]

    B --> ADAPTIVE["/adaptive-path — AdaptiveRecommendationsPage"]
    ADAPTIVE --> HH[GET /adaptive/my-path]
    ADAPTIVE --> II[Resolve recommendation: POST /adaptive/recommendations/:id/resolve]
```

---

## 8. Course Creation & Publishing Flow

```mermaid
flowchart TD
    A[Instructor: Create Course] --> B[POST /courses — title, description, difficulty]
    B --> C[Navigate to /instructor/courses/:id/builder]
    C --> D[CourseBuilderPage loaded]

    D --> E[Add Module: POST /courses/:id/modules]
    E --> F[Add Lesson to Module: POST /modules/:id/lessons]
    F --> G[Set lesson title, type, content, duration]

    F --> H[Upload Resource: POST /lessons/:id/resources/upload-url]
    H --> I[PUT to presigned S3 URL]
    I --> J[POST /lessons/:id/resources register]

    D --> K[Add Assessment: POST /courses/:id/assessments]
    K --> L[Add Questions: POST /assessments/:id/questions]
    L --> M[Question types: MCQ, multi-select, text]

    D --> N[Add Assignment: POST /courses/:id/assignments]
    N --> O[Set title, instructions, allowed extensions, due date]

    D --> P[Set Prerequisites: POST /courses/:id/prerequisites]
    D --> Q[Add Concepts: POST /courses/:id/concepts]
    D --> R[Set Completion Criteria: PUT /courses/:id/completion-criteria]

    D --> S[Publish: PUT /courses/:id — status=published]
    S --> T[Course visible in catalog GET /courses]
```

---

## 9. Enrollment Flow

```mermaid
flowchart TD
    A[Learner browses /courses] --> B[CourseCatalogPage]
    B --> C[Filter: difficulty, search text]
    B --> D[Click course → /courses/:id]
    D --> E[CourseDetailPage]
    E --> F{Already enrolled?}
    F -->|No| G[Enroll button visible]
    G --> H[POST /enrollments/courses/:id/enroll]
    H -->|Success| I[isEnrolled=true, start learning CTA]
    F -->|Yes| I
    I --> J[Access lessons via CourseModuleAccordion]
```

---

## 10. Quiz & Assessment Flow

```mermaid
flowchart TD
    A[Learner on CourseDetailPage] --> B[Sees assessment list]
    B --> C[Click Start Assessment → /assessments/:id]
    C --> D[AssessmentArenaPage]
    D --> E[POST /assessments/:id/attempts/start]
    E --> F{Existing in-progress attempt?}
    F -->|Yes| G[Resume: load saved draft from localStorage]
    F -->|No| H[New attempt: timer starts from assessment.time_limit_minutes]

    G & H --> I[Question navigation: prev/next buttons]
    I --> J[Select answer: MCQ / multi-select / text]
    J --> K[Auto-save to localStorage on each answer change]
    K --> L[Periodic PUT /attempts/:id/draft to backend]

    L --> M{Timer expires?}
    M -->|Yes| N[Auto-submit triggered]
    M -->|No| O[Learner clicks Submit]
    N & O --> P[Confirm submission modal]
    P --> Q[POST /attempts/:id/submit with idempotency-key UUID]
    Q --> R[Navigate to /attempts/:id/result]
    R --> S[AssessmentResultPage: score, correct answers, feedback]
```

---

## 11. Assignment Submission & Evaluation Flow

```mermaid
flowchart TD
    A[Learner on CourseDetailPage] --> B[Assignment section]
    B --> C[Click Upload Submission]
    C --> D[File picker modal]
    D --> E[Client validation: file size ≤ 15MB, extension check]
    E --> F[POST /assignments/:id/upload-url — presigned ticket]
    F --> G["PUT file bytes → presigned S3 URL (quarantine bucket)"]
    G --> H[POST /assignments/:id/submit — file_id + notes]
    H --> I[Backend: quarantine scan pipeline]
    I -->|Pass| J[Submission registered: status=pending_review]
    I -->|Fail| K[Error returned to learner]

    J --> L[Instructor sees in grading queue]
    L --> M[/instructor/grading — AssignmentGradingQueuePage]
    M --> N[GET /assignments/instructor/queue]
    N --> O[Review submission]
    O --> P[POST /assignments/submissions/:id/feedback]
    P --> Q[score + comments persisted]
    Q --> R[Learner can see grade on CourseDetailPage]
```

---

## 12. Certificate Generation Flow

```mermaid
flowchart TD
    A[Learner completes course] --> B[100% lessons marked complete]
    B --> C[All required assessments passed]
    C --> D{Completion criteria met?}
    D -->|Yes| E[Claim Certificate button appears on CourseDetailPage]
    D -->|No| F[Progress shown: N% complete, assessments pending]

    E --> G[POST /courses/:id/certificates/generate]
    G --> H[Backend: HMAC-SHA256 signed certificate generated]
    H --> I[certSuccess message shown]
    I --> J[Certificate visible in /my-certificates]

    J --> K[GET /certificates/my → CertificateDiplomaCard]
    K --> L[Download PDF: GET /api/v1/certificates/:id/download]
    K --> M[Download image: GET /api/v1/certificates/:id/download-image]
    K --> N[Public verify link: /verify/:code]

    N --> O[PublicVerifyCertificatePage]
    O --> P[GET /certificates/verify/:code — no auth required]
    P --> Q[Or: upload PDF for document verification]
    Q --> R[POST /public/certificates/verify-document — multipart]
```

---

## 13. Profile & Avatar Customization Flow

```mermaid
flowchart TD
    A[User clicks avatar in topbar] --> B[User dropdown menu]
    B --> C[Click Avatar & Atmosphere Studio]
    C --> D[/avatar-studio — AvatarStudioPage]

    D --> E[GET /users/me/avatar — load current config]
    E --> F[Studio Categories]
    F --> F1[Face & Skin: shape, complexion, markings]
    F --> F2[Eyes & Brows: shape, color, thickness]
    F --> F3[Nose, Mouth & Ears: smile, lip pigment]
    F --> F4[Hair & Beard: style, color, texture]
    F --> F5[Clothing & Eyewear: attire, glasses]
    F --> F6[Atmosphere & World: background gradient/scene]

    F --> G[Preset Archetypes: quick-apply curated styles]
    F --> H[Randomize button: Dices icon]
    F --> I[Reset to default button]

    G & H & I --> J[Live preview: PersonalizedAvatar SVG component]
    J --> K[Zoom in/out controls]
    J --> L[Save Avatar button]
    L --> M[PUT /users/me/avatar — avatar_config object]
    M --> N[authStore.updateUser: sync to localStorage + PATCH /auth/me]
    N --> O[UserAvatar in AppShell topbar updates immediately]

    B --> P[Account Settings: /settings]
    P --> Q[Edit first_name, last_name, bio]
    Q --> R[PATCH /auth/me]
    P --> S[Change Password modal on AppShell]
    S --> T[POST /auth/password/change]
```

---

## 14. Learnflow Copilot (AI Assistant) Flow

```mermaid
flowchart TD
    A[CopilotGate in App.tsx] --> B{isAuthenticated AND not on focus screen?}
    B -->|Yes| C[LearnflowCopilot component renders]
    B -->|No| D[Copilot hidden]

    D --> D1[Hidden on: /, /login, /register, /verify/*]
    D --> D2[Hidden on: /lessons/* focus mode]
    D --> D3[Hidden on: /assessments/* arena]

    C --> E[Floating copilot button in corner]
    E --> F[Click: open chat panel]
    F --> G[Role-aware context: Learner enrolled courses, Instructor department, Admin global]
    G --> H[RAG pipeline: retrieve relevant content]
    H --> I[Gemini API response with citations]

    J[LessonPlayerPage] --> K[SelectionActionToolbar: text selected]
    K --> L[AI Explain button in floating toolbar]
    L --> M[LessonExplainDrawer opens]
    M --> N[Sends selected text to AI for concept explanation]
```

---

## 15. Adaptive Learning Flow

```mermaid
flowchart TD
    A[Learner navigates to /adaptive-path] --> B[AdaptiveRecommendationsPage]
    B --> C[GET /adaptive/my-path]
    C --> D[List of LearningRecommendation items]
    D --> E[Each recommendation: type, priority, reason, target]
    E --> F[Learner reviews recommendation]
    F --> G[POST /adaptive/recommendations/:id/resolve]
    G --> H[Recommendation marked resolved]
    H --> I[List refreshes with remaining items]
```

---

## 16. Notification Flow

```mermaid
flowchart TD
    A[AppShell mounts] --> B[GET /notifications — live from API]
    B --> C[Notifications state populated]
    C --> D[Bell icon in topbar: unread count badge]
    D --> E[Click bell: AnimatePresence dropdown]
    E --> F[Notification item clicked]
    F --> G[PATCH /notifications/:id/read]
    G --> H[Navigate to link_url]
    E --> I[Mark all read: POST /notifications/mark-all-read]
    E --> J[Dismiss: local filter, no API call]
    C --> K[localStorage: learnflow_notifications cache]
```

---

## 17. Lazy Loading & Performance

- **Eagerly loaded (fast FCP):** `LandingPage`, `LoginPage`, `RegisterPage`
- **Code-split (lazy):** All 19 workspace/dashboard pages via `React.lazy` + `Suspense`
- **Preloading:** `preloadWorkspaceRoutes()` called on `isAuthenticated` change to warm the browser chunk cache proactively
- **Fallback:** `WorkspaceFallback` — spinning border animation + "Loading workspace..." text
- **Data cache:** `dataCache` utility in `frontend/src/utils/dataCache.ts` avoids redundant API calls on page revisit

---

## 18. Session Expiration Handling

| Scenario | Behavior |
|---|---|
| `401` on any API call | Axios interceptor: single-flight `POST /auth/refresh` |
| Refresh token expired | Redirect to `/login?expired=1`, clear all storage |
| Tab-to-tab logout | `BroadcastChannel AUTH_REVOKED` message, all tabs clear state |
| Assessment tab + logout in another tab | `StorageEvent` listener preserves draft answers before `sessionExpired=true` |
| `learnflow_logging_out` flag | Prevents redundant restore attempts on session unload |

---

## 19. Public Routes (No Auth Required)

| Route | Page | Purpose |
|---|---|---|
| `/` | LandingPage (or RootRedirect) | Marketing entry point |
| `/login` | LoginPage | Authentication |
| `/register`, `/signup` | RegisterPage | Account creation |
| `/courses` | CourseCatalogPage | Browse catalog (ShellRouteWrapper) |
| `/courses/:id` | CourseDetailPage | View course (enrollment requires auth) |
| `/verify` | PublicVerifyCertificatePage | Verify by code or document upload |
| `/verify/:code` | PublicVerifyCertificatePage | Direct verification URL |

`ShellRouteWrapper` provides a nav shell for public browsing without requiring authentication.
