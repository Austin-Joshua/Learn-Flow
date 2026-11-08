# Learnflow UI & Design System Guide

This guide documents the design system, typography, semantic color tokens, routing architecture, and reusable UI components across Learnflow LMS.

---

## 1. Colours & Semantic Tokens

Learnflow uses CSS variables defined in `frontend/src/index.css` mapped through `tailwind.config.js`. Avoid arbitrary hex colors or unmapped palette utility classes (such as hardcoded `indigo-*` or `sky-*` for brand elements).

### Token Reference Table

| Token | CSS Variable | Light Value | Dark Value | Usage |
| :--- | :--- | :--- | :--- | :--- |
| `accent` | `--color-accent` | `#0284c7` (Sky-600) | `#38bdf8` (Sky-400) | Primary actions, active links, progress highlights |
| `accent-hover` | `--color-accent-hover` | `#0369a1` (Sky-700) | `#0284c7` (Sky-600) | Hover state for accent buttons and active links |
| `accent-subtle` | `--color-accent-subtle` | `#f0f9ff` (Sky-50) | `rgba(2,132,199,0.15)` | Subtle tint backgrounds, active badge fills |
| `surface` | `--color-surface` | `#ffffff` | `#0f172a` (Slate-900) | Page content cards, input backgrounds, drawers |
| `surface-raised` | `--color-surface-raised` | `#f8fafc` (Slate-50) | `#1e293b` (Slate-800) | Modals, table headers, hover rows, toolbars |
| `border` | `--color-border` | `#e2e8f0` (Slate-200) | `#334155` (Slate-700) | Card dividers, input borders, structural rules |
| `ink` | `--color-ink` | `#0f172a` (Slate-900) | `#f8fafc` (Slate-50) | Primary headings, table text, card titles |
| `ink-muted` | `--color-ink-muted` | `#64748b` (Slate-500) | `#94a3b8` (Slate-400) | Secondary descriptions, timestamps, subtext |

### Status Colors
Status colors indicate domain-specific outcomes and remain fixed:
- **Success:** Emerald (`text-emerald-600`, `bg-emerald-50`, `border-emerald-200`) for passed assessments and issued certificates.
- **Warning:** Amber (`text-amber-600`, `bg-amber-50`, `border-amber-200`) for draft courses and review queues.
- **Danger:** Rose (`text-rose-600`, `bg-rose-50`, `border-rose-200`) for lockouts, failed attempts, and error banners.

---

## 2. Typography

The default typography stack is Inter (`font-sans`) for interfaces and JetBrains Mono (`font-mono`) for codes, timestamps, and certificates.

### Named Type Scale

| Utility Class | Size | Line Height | Tracking | Intended Usage |
| :--- | :--- | :--- | :--- | :--- |
| `text-meta` | 10px (`0.625rem`) | `0.875rem` | `tracking-wider` | Compact uppercase status tags, badge subtext, hash codes |
| `text-label` | 11px (`0.6875rem`) | `1rem` | `tracking-normal` | Form input labels, table column headers, metadata rows |
| `text-xs` | 12px (`0.75rem`) | `1rem` | `tracking-normal` | Body descriptions, card subtitles, button labels |
| `text-sm` | 14px (`0.875rem`) | `1.25rem` | `tracking-normal` | Standard body text, table cells, form inputs |
| `text-base` | 16px (`1rem`) | `1.5rem` | `tracking-tight` | Lead paragraphs, card titles, drawer headings |
| `text-lg` | 18px (`1.125rem`) | `1.75rem` | `tracking-tight` | Section sub-headers, metric callouts |
| `text-xl` | 20px (`1.25rem`) | `1.75rem` | `tracking-tight` | Section headers, modal titles |
| `text-2xl` | 24px (`1.5rem`) | `2rem` | `tracking-tight` | Standard page `<h1>` headings |
| `text-3xl` | 30px (`1.875rem`) | `2.25rem` | `tracking-tight` | Featured page headers, banner titles |
| `text-4xl` | 36px (`2.25rem`) | `2.5rem` | `tracking-tight` | Landing hero headings |

Do **not** use arbitrary arbitrary font sizes like `text-[11px]` or `text-[10px]`. Use `text-label` or `text-meta`.

---

## 3. Spacing & Layout Rules

Learnflow enforces a strict 4px grid (`1rem` = 16px, step = 4px):
- **Base Grid:** `p-1` (4px), `p-2` (8px), `p-3` (12px), `p-4` (16px), `p-6` (24px), `p-8` (32px), `p-10` (40px).
- **Minimum Interactive Target:** 44px height (`min-h-[44px]`) on buttons, selects, and links for touch accessibility (coarse pointers).
- **Max Width Standards:**
  - `max-w-7xl` (`1280px`): Full dashboard layouts, course catalogs, landing sections.
  - `max-w-6xl` (`1152px`): Learning journey trail, multi-column curriculum views.
  - `max-w-5xl` (`1024px`): Course builder, instructor queues, assessment arenas.
  - `max-w-2xl` / `max-w-xl`: Form flows, empty state dialogs, verification cards.

---

## 4. Navigation & Routes

Navigation governance is strictly declared in `frontend/src/config/navigation.ts` and validated via automated tests in `frontend/src/tests/navigationRoutes.test.ts`.

### Role Navigation Permissions

| Role | Accessible Navigation Paths |
| :--- | :--- |
| `learner` | `/my-learning`, `/my-journey`, `/courses`, `/adaptive`, `/my-certificates`, `/verify` |
| `instructor` | `/instructor/courses`, `/instructor/queue`, `/courses`, `/verify` |
| `hod` | `/hod`, `/hod/analytics`, `/courses`, `/verify` |
| `admin` | `/admin`, `/instructor/courses`, `/hod/analytics`, `/courses`, `/verify` |

### Shell Wrapping (`ShellRouteWrapper`)
Public routes (`/courses`, `/courses/:id`, `/verify`, `/verify/:code`) use `ShellRouteWrapper`:
- When signed in: renders inside the authenticated role `AppShell` with full sidebar and user profile.
- When signed out: renders with clean public top chrome (`Navbar`) and educational `Footer`.

---

## 5. How to Add a New Page

Follow this 5-step checklist when introducing a new route or screen:

1. **Create the Page Component:**
   Place the view under `frontend/src/pages/MyNewPage.tsx`. Keep the root file under 350 lines by extracting sub-components into `frontend/src/components/<domain>/`.

2. **Register the Route in `App.tsx`:**
   - If the page is public/dual-access: wrap in `<ShellRouteWrapper><MyNewPage /></ShellRouteWrapper>`.
   - If the page is protected: wrap in `<ProtectedRoute requiredRole={['role']}><AppShell><MyNewPage /></AppShell></ProtectedRoute>`.

3. **Add Navigation Entry in `config/navigation.ts`:**
   Add to `ROLE_NAVIGATION_MAP[role]` with appropriate `label`, `path`, `icon`, and `isPrimaryMobile`.

4. **Verify Backend Authorization:**
   Ensure corresponding FastAPI endpoints in `backend/app/api/v1/endpoints/` enforce `require_role([...])`.

5. **Update Navigation Tests:**
   Add test assertions to `frontend/src/tests/navigationRoutes.test.ts` to ensure path declarations, roles, and route links match.

---

## 6. UI Component Catalogue (`src/components/ui`)

All primitives are exported from `frontend/src/components/ui/index.ts`.

### Button
Interactive button with 4 variants, 2 sizes, loading spinner, and WCAG minimum touch target.
```tsx
import { Button } from '../components/ui';

<Button variant="primary" size="md" isLoading={saving} onClick={handleSave}>
  Save Changes
</Button>
<Button variant="secondary" size="sm">Cancel</Button>
<Button variant="danger" size="md">Delete Course</Button>
<Button variant="ghost" size="sm">Dismiss</Button>
```

### Input
Accessible text/password/email input with label, helper hint, error state, and focus ring.
```tsx
import { Input } from '../components/ui';

<Input
  label="Institutional Email"
  type="email"
  placeholder="learner@learnflow.edu"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={emailError}
  hint="Must be your active campus email address."
  required
/>
```

### Select
Themed select dropdown matching standard input heights and focus styling.
```tsx
import { Select } from '../components/ui';

<Select
  label="Academic Difficulty"
  value={difficulty}
  onChange={(e) => setDifficulty(e.target.value)}
  options={[
    { value: 'beginner', label: 'Beginner' },
    { value: 'intermediate', label: 'Intermediate' },
    { value: 'advanced', label: 'Advanced' },
  ]}
/>
```

### Textarea
Themed multi-line input for rubrics, descriptions, and feedback.
```tsx
import { Textarea } from '../components/ui';

<Textarea
  label="Assignment Feedback"
  rows={4}
  value={feedback}
  onChange={(e) => setFeedback(e.target.value)}
  placeholder="Provide constructive feedback based on the scoring rubric..."
/>
```

### Card
Standard bordered surface container with quiet elevation and rounded corners.
```tsx
import { Card } from '../components/ui';

<Card className="p-6">
  <h3 className="text-base font-bold text-ink">Module Details</h3>
  <p className="text-xs text-ink-muted mt-1">Review lesson prerequisites.</p>
</Card>
```

### Badge
Compact categorical tag with standard status color mapping.
```tsx
import { Badge } from '../components/ui';

<Badge variant="accent">Sequential</Badge>
<Badge variant="success">Completed</Badge>
<Badge variant="warning">In Review</Badge>
<Badge variant="danger">Locked</Badge>
<Badge variant="neutral">Draft</Badge>
```

### PageHeader
Standardized header component featuring breadcrumb tag, page title, description, and action slot.
```tsx
import { PageHeader } from '../components/ui';
import { Compass } from 'lucide-react';

<PageHeader
  tag="Interactive Mountain Trail"
  tagIcon={Compass}
  title="My Learning Journey"
  description="Climb through sequential modules from base camp to verified diploma summit."
  action={<Button variant="primary">Browse Catalog</Button>}
/>
```

### StatTile
Data metric tile for admin, HOD, and instructor analytics dashboards.
```tsx
import { StatTile } from '../components/ui';
import { Users } from 'lucide-react';

<StatTile
  title="Active Enrolled Students"
  value="1,420"
  subtitle="+12% from last term"
  icon={Users}
  trend={{ direction: 'up', label: '12%' }}
/>
```

### EmptyState
Standard empty state graphic, message, and call-to-action button.
```tsx
import { EmptyState } from '../components/ui';
import { BookOpen } from 'lucide-react';

<EmptyState
  icon={BookOpen}
  title="No Enrolled Courses"
  description="You have not enrolled in any active courses yet. Browse the catalog to begin."
  actionLabel="Explore Catalog"
  onAction={() => navigate('/courses')}
/>
```

### Spinner
Accessible loading indicator matching standard sizes.
```tsx
import { Spinner } from '../components/ui';

<Spinner size="md" />
```
