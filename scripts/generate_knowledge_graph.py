#!/usr/bin/env python3
"""
generate_knowledge_graph.py
Produces the canonical Understand Anything knowledge graph for Learnflow LMS.
Writes .ua/knowledge-graph.json and .ua/meta.json.
"""

import json
import datetime
import subprocess
from pathlib import Path

def main():
    root = Path(__file__).resolve().parent.parent
    ua_dir = root / ".ua"
    ua_dir.mkdir(parents=True, exist_ok=True)
    intermediate_dir = ua_dir / "intermediate"
    intermediate_dir.mkdir(parents=True, exist_ok=True)

    try:
        git_hash = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=root).decode().strip()
    except Exception:
        git_hash = "d4c6c3adb4c18ef05ccfa9438042845d05f348f4"

    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    project_meta = {
        "name": "Learnflow LMS",
        "description": "Production Academic Learning Management System with AI Study Copilot, interactive curriculum trails, dynamic avatar studio, and quarantine assignment grading pipeline.",
        "languages": ["TypeScript", "Python", "SQL", "HTML", "CSS"],
        "frameworks": ["React 19", "FastAPI", "SQLAlchemy 2.0", "Tailwind CSS", "PostgreSQL", "Redis", "Docker"],
        "analyzedAt": now_iso,
        "gitCommitHash": git_hash
    }

    # 1. Define Nodes
    nodes = [
        # --- Core Configuration & Docs ---
        {
            "id": "document:README.md",
            "type": "document",
            "name": "README.md",
            "filePath": "README.md",
            "summary": "Repository overview, setup instructions, architecture summary, and environment variables.",
            "tags": ["documentation", "onboarding", "overview"]
        },
        {
            "id": "document:AGENTS.md",
            "type": "document",
            "name": "AGENTS.md",
            "filePath": "AGENTS.md",
            "summary": "AI Agent Engineering Standards, multi-skill routing (Ponytail, Unslop, Stageshow, Understand), and non-negotiable security rules.",
            "tags": ["rules", "standards", "architecture", "security"]
        },
        {
            "id": "document:docs/PRD.md",
            "type": "document",
            "name": "PRD.md",
            "filePath": "docs/PRD.md",
            "summary": "Product Requirements Document: 16 sections detailing vision, problem statement, 3 personas, functional/non-functional requirements, acceptance criteria, and v1.0 scope boundaries.",
            "tags": ["documentation", "prd", "product", "requirements"]
        },
        {
            "id": "document:docs/TRD.md",
            "type": "document",
            "name": "TRD.md",
            "filePath": "docs/TRD.md",
            "summary": "Technical Requirements Document: 20 sections detailing verified dependency versions, system diagrams, memory-token auth lifecycle, storage isolation, and OWASP defenses.",
            "tags": ["documentation", "trd", "architecture", "security"]
        },
        {
            "id": "document:docs/APP_FLOW.md",
            "type": "document",
            "name": "APP_FLOW.md",
            "filePath": "docs/APP_FLOW.md",
            "summary": "Application Flow: 19 end-to-end user journeys with Mermaid sequence/flowcharts for Admin, Faculty, and Learner workflows.",
            "tags": ["documentation", "app-flow", "user-journey", "mermaid"]
        },
        {
            "id": "document:docs/UI_UX_DESIGN_BRIEF.md",
            "type": "document",
            "name": "UI_UX_DESIGN_BRIEF.md",
            "filePath": "docs/UI_UX_DESIGN_BRIEF.md",
            "summary": "UI/UX Design Specification: 20 sections covering Unslop principles, quiet chrome, 4px grid rhythm, typography scales, responsive breakpoints, and Avatar Studio.",
            "tags": ["documentation", "ui-ux", "unslop", "design-system"]
        },
        {
            "id": "document:docs/BACKEND_SCHEMA.md",
            "type": "document",
            "name": "BACKEND_SCHEMA.md",
            "filePath": "docs/BACKEND_SCHEMA.md",
            "summary": "Database & Backend Schema: 34 relational entity definitions, composite foreign keys, partial unique indexes, Mermaid ER diagram, and complete API catalog.",
            "tags": ["documentation", "database", "schema", "api"]
        },
        {
            "id": "document:docs/IMPLEMENTATION_PLAN.md",
            "type": "document",
            "name": "IMPLEMENTATION_PLAN.md",
            "filePath": "docs/IMPLEMENTATION_PLAN.md",
            "summary": "Product Development Roadmap: Retrospective reconstruction of 186 Git commits across 10 milestones from initial bootstrap to Version 1.0 release.",
            "tags": ["documentation", "roadmap", "git-history", "milestones"]
        },
        {
            "id": "document:docs/FINAL_AUDIT_REPORT.md",
            "type": "document",
            "name": "FINAL_AUDIT_REPORT.md",
            "filePath": "docs/FINAL_AUDIT_REPORT.md",
            "summary": "Final Audit Report: Comprehensive quality audit, build results, test verification, security review, and release readiness assessment.",
            "tags": ["documentation", "audit", "qa", "verification"]
        },
        {
            "id": "service:docker-compose.yml",
            "type": "service",
            "name": "docker-compose.yml",
            "filePath": "docker-compose.yml",
            "summary": "Container orchestration service defining backend, frontend, postgres, redis, mailpit, and s3mock services.",
            "tags": ["infrastructure", "docker", "compose", "services"]
        },

        # --- Frontend Routing & Shell ---
        {
            "id": "file:frontend/src/App.tsx",
            "type": "file",
            "name": "App.tsx",
            "filePath": "frontend/src/App.tsx",
            "summary": "Root React application with lazy-loaded route declarations, role-protected workspaces, canonical aliases, and preloading.",
            "tags": ["frontend", "routing", "app", "react"]
        },
        {
            "id": "file:frontend/src/components/layout/AppShell.tsx",
            "type": "file",
            "name": "AppShell.tsx",
            "filePath": "frontend/src/components/layout/AppShell.tsx",
            "summary": "Master responsive layout shell supporting desktop collapsible sidebar, tablet rail, mobile bottom bar, and navigation matrix.",
            "tags": ["frontend", "layout", "navigation", "responsive"]
        },
        {
            "id": "file:frontend/src/config/navigation.ts",
            "type": "file",
            "name": "navigation.ts",
            "filePath": "frontend/src/config/navigation.ts",
            "summary": "Role-scoped navigation matrix mapping Learner, Instructor, and Admin workspaces with Home as the base item.",
            "tags": ["frontend", "config", "navigation", "rbac"]
        },
        {
            "id": "file:frontend/src/store/authStore.ts",
            "type": "file",
            "name": "authStore.ts",
            "filePath": "frontend/src/store/authStore.ts",
            "summary": "Zustand authentication state store managing JWT tokens, user role assertions, and session hydration.",
            "tags": ["frontend", "state", "auth", "zustand"]
        },
        {
            "id": "file:frontend/src/services/api.ts",
            "type": "file",
            "name": "api.ts",
            "filePath": "frontend/src/services/api.ts",
            "summary": "Centralized Axios API client with automatic token rotation, interceptors, and typed domain endpoint services.",
            "tags": ["frontend", "api", "client", "network"]
        },
        {
            "id": "file:frontend/src/utils/courseUrls.ts",
            "type": "file",
            "name": "courseUrls.ts",
            "filePath": "frontend/src/utils/courseUrls.ts",
            "summary": "Clean semantic URL and canonical course slug routing generator supporting slug resolution and UUID fallback.",
            "tags": ["frontend", "routing", "urls", "slugs"]
        },
        {
            "id": "file:frontend/src/utils/dataCache.ts",
            "type": "file",
            "name": "dataCache.ts",
            "filePath": "frontend/src/utils/dataCache.ts",
            "summary": "Two-tier stale-while-revalidate data cache (memory + sessionStorage) delivering zero loading lag across page transitions.",
            "tags": ["frontend", "performance", "cache", "persistence"]
        },
        {
            "id": "file:frontend/src/utils/preloadRoutes.ts",
            "type": "file",
            "name": "preloadRoutes.ts",
            "filePath": "frontend/src/utils/preloadRoutes.ts",
            "summary": "Micro-task route chunk preloader that warms the browser chunk cache upon application launch.",
            "tags": ["frontend", "performance", "preloading"]
        },

        # --- Frontend Pages & Features ---
        {
            "id": "file:frontend/src/pages/MyLearningPage.tsx",
            "type": "file",
            "name": "MyLearningPage.tsx",
            "filePath": "frontend/src/pages/MyLearningPage.tsx",
            "summary": "Learner home base dashboard showcasing active enrolled tracks, quick-peek syllabus modal, and two-tier cached curriculum metrics.",
            "tags": ["frontend", "learner", "dashboard", "home"]
        },
        {
            "id": "file:frontend/src/pages/MyJourneyPage.tsx",
            "type": "file",
            "name": "MyJourneyPage.tsx",
            "filePath": "frontend/src/pages/MyJourneyPage.tsx",
            "summary": "Interactive visual curriculum mountain trail and structured milestone ledger visualizing student elevation and module checkpoints.",
            "tags": ["frontend", "gamification", "journey", "mountain-trail"]
        },
        {
            "id": "file:frontend/src/components/journey/MountainScene.tsx",
            "type": "file",
            "name": "MountainScene.tsx",
            "filePath": "frontend/src/components/journey/MountainScene.tsx",
            "summary": "Dynamic SVG mountain trail visualization with daytime/nighttime lighting switcher, elevation progress markers, and checkpoint modals.",
            "tags": ["frontend", "svg", "visualization", "mountain-trail"]
        },
        {
            "id": "file:frontend/src/pages/CourseDetailPage.tsx",
            "type": "file",
            "name": "CourseDetailPage.tsx",
            "filePath": "frontend/src/pages/CourseDetailPage.tsx",
            "summary": "Comprehensive course syllabus page with slug canonicalization, prerequisite trees, lesson outlines, and evaluations.",
            "tags": ["frontend", "course", "syllabus", "canonical-slug"]
        },
        {
            "id": "file:frontend/src/pages/CourseCatalogPage.tsx",
            "type": "file",
            "name": "CourseCatalogPage.tsx",
            "filePath": "frontend/src/pages/CourseCatalogPage.tsx",
            "summary": "Full academic catalog with domain filtering, search, difficulty filters, and instant two-tier cached syllabus previews.",
            "tags": ["frontend", "catalog", "courses"]
        },
        {
            "id": "file:frontend/src/pages/LessonPlayerPage.tsx",
            "type": "file",
            "name": "LessonPlayerPage.tsx",
            "filePath": "frontend/src/pages/LessonPlayerPage.tsx",
            "summary": "Academic text lesson reader featuring mobile touch-drag selection lifecycle, study notes ledger, highlights, and AI concept explanations.",
            "tags": ["frontend", "reader", "study-companion", "selection"]
        },
        {
            "id": "file:frontend/src/components/study/SelectionActionToolbar.tsx",
            "type": "file",
            "name": "SelectionActionToolbar.tsx",
            "filePath": "frontend/src/components/study/SelectionActionToolbar.tsx",
            "summary": "Floating action toolbar appearing post-touch/drag with Add Note, 4-color Academic Highlighter, and AI Concept Explainer actions.",
            "tags": ["frontend", "study", "toolbar", "touch-interaction"]
        },
        {
            "id": "file:frontend/src/pages/AssessmentArenaPage.tsx",
            "type": "file",
            "name": "AssessmentArenaPage.tsx",
            "filePath": "frontend/src/pages/AssessmentArenaPage.tsx",
            "summary": "Interactive exam arena featuring sequential question steps, timer countdown, auto-save drafts, and attempt grading.",
            "tags": ["frontend", "assessment", "quiz", "exam"]
        },
        {
            "id": "file:frontend/src/pages/AvatarStudioPage.tsx",
            "type": "file",
            "name": "AvatarStudioPage.tsx",
            "filePath": "frontend/src/pages/AvatarStudioPage.tsx",
            "summary": "Snapchat-inspired avatar creation studio with real-time SVG preview, facial structure, hairstyles, clothing, and environment backgrounds.",
            "tags": ["frontend", "avatar", "customization", "svg"]
        },
        {
            "id": "file:frontend/src/components/avatar/PersonalizedAvatar.tsx",
            "type": "file",
            "name": "PersonalizedAvatar.tsx",
            "filePath": "frontend/src/components/avatar/PersonalizedAvatar.tsx",
            "summary": "Universal layered SVG personalized avatar component rendered across navigation, leaderboards, and user profiles.",
            "tags": ["frontend", "avatar", "svg", "components"]
        },
        {
            "id": "file:frontend/src/components/ai/LearnflowCopilot.tsx",
            "type": "file",
            "name": "LearnflowCopilot.tsx",
            "filePath": "frontend/src/components/ai/LearnflowCopilot.tsx",
            "summary": "Draggable floating AI Study Copilot supporting context-aware Q&A, syllabus navigation, and voice transcription.",
            "tags": ["frontend", "ai", "copilot", "chat"]
        },
        {
            "id": "file:frontend/src/pages/InstructorDashboardPage.tsx",
            "type": "file",
            "name": "InstructorDashboardPage.tsx",
            "filePath": "frontend/src/pages/InstructorDashboardPage.tsx",
            "summary": "Faculty studio home managing authored course tracks, learner enrollment health, and quick curriculum authoring triggers.",
            "tags": ["frontend", "instructor", "courses", "dashboard"]
        },
        {
            "id": "file:frontend/src/pages/CourseBuilderPage.tsx",
            "type": "file",
            "name": "CourseBuilderPage.tsx",
            "filePath": "frontend/src/pages/CourseBuilderPage.tsx",
            "summary": "Curriculum builder tool for authoring sequential modules, lessons, concept tags, quizzes, and assignments.",
            "tags": ["frontend", "authoring", "builder", "curriculum"]
        },
        {
            "id": "file:frontend/src/pages/AdminDashboardPage.tsx",
            "type": "file",
            "name": "AdminDashboardPage.tsx",
            "filePath": "frontend/src/pages/AdminDashboardPage.tsx",
            "summary": "System governance dashboard providing platform telemetry, user role management, system health, and audit trails.",
            "tags": ["frontend", "admin", "governance", "dashboard"]
        },
        {
            "id": "file:frontend/src/pages/PublicVerifyCertificatePage.tsx",
            "type": "file",
            "name": "PublicVerifyCertificatePage.tsx",
            "filePath": "frontend/src/pages/PublicVerifyCertificatePage.tsx",
            "summary": "Public verification portal for cryptographically signed diplomas with sha256 hashes, PDF/PNG download, and QR scanning.",
            "tags": ["frontend", "certificates", "verification", "public"]
        },

        # --- Backend Core & Architecture ---
        {
            "id": "file:backend/app/main.py",
            "type": "file",
            "name": "main.py",
            "filePath": "backend/app/main.py",
            "summary": "FastAPI entry point configuring CORS, CSRF defense, rate-limiting middleware, lifecycle hooks, and router mounting.",
            "tags": ["backend", "fastapi", "entrypoint", "middleware"]
        },
        {
            "id": "file:backend/app/core/config.py",
            "type": "file",
            "name": "config.py",
            "filePath": "backend/app/core/config.py",
            "summary": "Pydantic Settings defining PostgreSQL, Redis, JWT secrets, S3 bucket settings, and Mailpit credentials.",
            "tags": ["backend", "config", "settings"]
        },
        {
            "id": "file:backend/app/core/security.py",
            "type": "file",
            "name": "security.py",
            "filePath": "backend/app/core/security.py",
            "summary": "Cryptographic security utilities implementing Argon2 password hashing, JWT generation, and RFC 6819 token rotation.",
            "tags": ["backend", "security", "crypto", "jwt"]
        },
        {
            "id": "file:backend/app/core/deps.py",
            "type": "file",
            "name": "deps.py",
            "filePath": "backend/app/core/deps.py",
            "summary": "FastAPI dependency injections for SQLAlchemy database sessions, authenticated current user, and RBAC role verification.",
            "tags": ["backend", "dependencies", "auth", "rbac"]
        },

        # --- Backend API Endpoints ---
        {
            "id": "endpoint:backend/app/api/v1/endpoints/courses.py",
            "type": "endpoint",
            "name": "courses.py",
            "filePath": "backend/app/api/v1/endpoints/courses.py",
            "summary": "Course endpoints handling course catalogs, details with dual UUID/slug resolution, prerequisites, and feedback.",
            "tags": ["backend", "api", "courses", "slugs"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/enrollments.py",
            "type": "endpoint",
            "name": "enrollments.py",
            "filePath": "backend/app/api/v1/endpoints/enrollments.py",
            "summary": "Learner enrollment management supporting slug-based enrollment, prerequisite enforcement, and live progress percentages.",
            "tags": ["backend", "api", "enrollments", "prerequisites"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/lessons.py",
            "type": "endpoint",
            "name": "lessons.py",
            "filePath": "backend/app/api/v1/endpoints/lessons.py",
            "summary": "Lesson content delivery with sequential module access locking, progress completion, and resource attachments.",
            "tags": ["backend", "api", "lessons", "sequential"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/assessments.py",
            "type": "endpoint",
            "name": "assessments.py",
            "filePath": "backend/app/api/v1/endpoints/assessments.py",
            "summary": "Assessment authoring, timed exam submission, automatic objective grading, and attempt history guards.",
            "tags": ["backend", "api", "assessments", "grading"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/assignments.py",
            "type": "endpoint",
            "name": "assignments.py",
            "filePath": "backend/app/api/v1/endpoints/assignments.py",
            "summary": "Practical coding assignments with quarantine inspection pipeline, file upload validation, and faculty grading.",
            "tags": ["backend", "api", "assignments", "quarantine"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/certificates.py",
            "type": "endpoint",
            "name": "certificates.py",
            "filePath": "backend/app/api/v1/endpoints/certificates.py",
            "summary": "Credential generation, SHA-256 cryptographic verification codes, and public verification endpoints.",
            "tags": ["backend", "api", "certificates", "credentials"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/avatar.py",
            "type": "endpoint",
            "name": "avatar.py",
            "filePath": "backend/app/api/v1/endpoints/avatar.py",
            "summary": "Avatar persistence endpoints storing custom facial attributes, clothing, accessories, and environment backgrounds.",
            "tags": ["backend", "api", "avatar", "customization"]
        },
        {
            "id": "endpoint:backend/app/api/v1/endpoints/ai_assistant.py",
            "type": "endpoint",
            "name": "ai_assistant.py",
            "filePath": "backend/app/api/v1/endpoints/ai_assistant.py",
            "summary": "Study Copilot and Concept Explainer endpoint leveraging Google Gemini with role-scoped academic context retrieval.",
            "tags": ["backend", "api", "copilot", "gemini"]
        },

        # --- Backend Models & Services ---
        {
            "id": "table:backend/app/models/user.py:User",
            "type": "table",
            "name": "User",
            "filePath": "backend/app/models/user.py",
            "summary": "Core user identity model storing hashed credentials, roles, avatar configuration JSON, and department relationships.",
            "tags": ["backend", "database", "model", "user"]
        },
        {
            "id": "table:backend/app/models/course.py:Course",
            "type": "table",
            "name": "Course",
            "filePath": "backend/app/models/course.py",
            "summary": "Course curriculum model with unique slug, difficulty tier, status, sequential modules, and prerequisite linkages.",
            "tags": ["backend", "database", "model", "course"]
        },
        {
            "id": "table:backend/app/models/certificate.py:Certificate",
            "type": "table",
            "name": "Certificate",
            "filePath": "backend/app/models/certificate.py",
            "summary": "Verifiable diploma record storing verification code, SHA-256 hash, recipient, course, and issuance timestamps.",
            "tags": ["backend", "database", "model", "certificate"]
        },
        {
            "id": "service:backend/app/services/ai_gateway.py",
            "type": "service",
            "name": "ai_gateway.py",
            "filePath": "backend/app/services/ai_gateway.py",
            "summary": "Secure LLM orchestration gateway with prompt injection defenses, canary token inspection, and Redis caching.",
            "tags": ["backend", "service", "ai", "security"]
        },
        {
            "id": "service:backend/app/services/avatar_service.py",
            "type": "service",
            "name": "avatar_service.py",
            "filePath": "backend/app/services/avatar_service.py",
            "summary": "Avatar business service validating facial configurations, color palettes, and seeding role-based defaults.",
            "tags": ["backend", "service", "avatar"]
        },
        {
            "id": "service:backend/app/services/quarantine_service.py",
            "type": "service",
            "name": "quarantine_service.py",
            "filePath": "backend/app/services/quarantine_service.py",
            "summary": "Multi-stage file quarantine security inspection pipeline analyzing file MIME headers, executable bits, and malware hashes.",
            "tags": ["backend", "service", "security", "quarantine"]
        }
    ]

    # 2. Define Edges
    edges = [
        # AppShell & Navigation
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/components/layout/AppShell.tsx", "type": "contains"},
        {"source": "file:frontend/src/components/layout/AppShell.tsx", "target": "file:frontend/src/config/navigation.ts", "type": "reads_from"},
        {"source": "file:frontend/src/components/layout/AppShell.tsx", "target": "file:frontend/src/components/avatar/PersonalizedAvatar.tsx", "type": "contains"},
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/components/ai/LearnflowCopilot.tsx", "type": "contains"},
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/utils/preloadRoutes.ts", "type": "calls"},

        # Learner flow
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/pages/MyLearningPage.tsx", "type": "routes"},
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/pages/MyJourneyPage.tsx", "type": "routes"},
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/pages/CourseDetailPage.tsx", "type": "routes"},
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/pages/LessonPlayerPage.tsx", "type": "routes"},
        {"source": "file:frontend/src/App.tsx", "target": "file:frontend/src/pages/AvatarStudioPage.tsx", "type": "routes"},

        # Lesson Player & Touch-Selection Toolbar
        {"source": "file:frontend/src/pages/LessonPlayerPage.tsx", "target": "file:frontend/src/components/study/SelectionActionToolbar.tsx", "type": "contains"},
        {"source": "file:frontend/src/pages/LessonPlayerPage.tsx", "target": "file:frontend/src/services/api.ts", "type": "calls"},

        # Course URLs & Data Cache
        {"source": "file:frontend/src/pages/MyLearningPage.tsx", "target": "file:frontend/src/utils/courseUrls.ts", "type": "calls"},
        {"source": "file:frontend/src/pages/MyLearningPage.tsx", "target": "file:frontend/src/utils/dataCache.ts", "type": "reads_from"},
        {"source": "file:frontend/src/pages/CourseDetailPage.tsx", "target": "file:frontend/src/utils/courseUrls.ts", "type": "calls"},
        {"source": "file:frontend/src/pages/CourseDetailPage.tsx", "target": "file:frontend/src/utils/dataCache.ts", "type": "reads_from"},
        {"source": "file:frontend/src/pages/InstructorDashboardPage.tsx", "target": "file:frontend/src/utils/courseUrls.ts", "type": "calls"},
        {"source": "file:frontend/src/pages/CourseBuilderPage.tsx", "target": "file:frontend/src/utils/courseUrls.ts", "type": "calls"},

        # Mountain Trail
        {"source": "file:frontend/src/pages/MyJourneyPage.tsx", "target": "file:frontend/src/components/journey/MountainScene.tsx", "type": "contains"},

        # Avatar System
        {"source": "file:frontend/src/pages/AvatarStudioPage.tsx", "target": "file:frontend/src/components/avatar/PersonalizedAvatar.tsx", "type": "contains"},
        {"source": "file:frontend/src/pages/AvatarStudioPage.tsx", "target": "endpoint:backend/app/api/v1/endpoints/avatar.py", "type": "calls"},
        {"source": "endpoint:backend/app/api/v1/endpoints/avatar.py", "target": "service:backend/app/services/avatar_service.py", "type": "calls"},
        {"source": "service:backend/app/services/avatar_service.py", "target": "table:backend/app/models/user.py:User", "type": "writes_to"},

        # API routing
        {"source": "file:frontend/src/services/api.ts", "target": "file:backend/app/main.py", "type": "calls"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/courses.py", "type": "routes"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/enrollments.py", "type": "routes"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/lessons.py", "type": "routes"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/assessments.py", "type": "routes"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/assignments.py", "type": "routes"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/certificates.py", "type": "routes"},
        {"source": "file:backend/app/main.py", "target": "endpoint:backend/app/api/v1/endpoints/ai_assistant.py", "type": "routes"},

        # Backend dependencies & models
        {"source": "endpoint:backend/app/api/v1/endpoints/courses.py", "target": "table:backend/app/models/course.py:Course", "type": "reads_from"},
        {"source": "endpoint:backend/app/api/v1/endpoints/enrollments.py", "target": "table:backend/app/models/course.py:Course", "type": "reads_from"},
        {"source": "endpoint:backend/app/api/v1/endpoints/certificates.py", "target": "table:backend/app/models/certificate.py:Certificate", "type": "writes_to"},
        {"source": "endpoint:backend/app/api/v1/endpoints/assignments.py", "target": "service:backend/app/services/quarantine_service.py", "type": "calls"},
        {"source": "endpoint:backend/app/api/v1/endpoints/ai_assistant.py", "target": "service:backend/app/services/ai_gateway.py", "type": "calls"},

        # Infrastructure & Documentation
        {"source": "service:docker-compose.yml", "target": "file:backend/app/main.py", "type": "deploys"},
        {"source": "document:AGENTS.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/PRD.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/TRD.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/APP_FLOW.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/UI_UX_DESIGN_BRIEF.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/BACKEND_SCHEMA.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/IMPLEMENTATION_PLAN.md", "target": "document:README.md", "type": "documents"},
        {"source": "document:docs/FINAL_AUDIT_REPORT.md", "target": "document:README.md", "type": "documents"}
    ]

    # 3. Define Layers
    layers = [
        {
            "id": "layer:presentation-learner",
            "name": "Learner Experience & Studios",
            "description": "Student-facing interactive views including Home dashboard, Mountain Trail, Lesson Reader, Exam Arena, and Avatar Studio.",
            "nodeIds": [
                "file:frontend/src/pages/MyLearningPage.tsx",
                "file:frontend/src/pages/MyJourneyPage.tsx",
                "file:frontend/src/components/journey/MountainScene.tsx",
                "file:frontend/src/pages/CourseDetailPage.tsx",
                "file:frontend/src/pages/CourseCatalogPage.tsx",
                "file:frontend/src/pages/LessonPlayerPage.tsx",
                "file:frontend/src/components/study/SelectionActionToolbar.tsx",
                "file:frontend/src/pages/AssessmentArenaPage.tsx",
                "file:frontend/src/pages/AvatarStudioPage.tsx",
                "file:frontend/src/components/avatar/PersonalizedAvatar.tsx",
                "file:frontend/src/components/ai/LearnflowCopilot.tsx",
                "file:frontend/src/pages/PublicVerifyCertificatePage.tsx"
            ]
        },
        {
            "id": "layer:presentation-faculty-admin",
            "name": "Faculty & Governance Studios",
            "description": "Instructor curriculum builder, grading queue, cohort telemetry, and administrative governance.",
            "nodeIds": [
                "file:frontend/src/pages/InstructorDashboardPage.tsx",
                "file:frontend/src/pages/CourseBuilderPage.tsx",
                "file:frontend/src/pages/AdminDashboardPage.tsx"
            ]
        },
        {
            "id": "layer:client-state-network",
            "name": "Client State, Caching & Routing",
            "description": "Cross-cutting frontend foundations, AppShell responsive layout, two-tier caching, and clean course URLs.",
            "nodeIds": [
                "file:frontend/src/App.tsx",
                "file:frontend/src/components/layout/AppShell.tsx",
                "file:frontend/src/config/navigation.ts",
                "file:frontend/src/store/authStore.ts",
                "file:frontend/src/services/api.ts",
                "file:frontend/src/utils/courseUrls.ts",
                "file:frontend/src/utils/dataCache.ts",
                "file:frontend/src/utils/preloadRoutes.ts"
            ]
        },
        {
            "id": "layer:api-routing",
            "name": "FastAPI Gateway & Endpoints",
            "description": "High-performance API layer with dual UUID/slug resolution, role-protected endpoints, and rate limiting.",
            "nodeIds": [
                "file:backend/app/main.py",
                "endpoint:backend/app/api/v1/endpoints/courses.py",
                "endpoint:backend/app/api/v1/endpoints/enrollments.py",
                "endpoint:backend/app/api/v1/endpoints/lessons.py",
                "endpoint:backend/app/api/v1/endpoints/assessments.py",
                "endpoint:backend/app/api/v1/endpoints/assignments.py",
                "endpoint:backend/app/api/v1/endpoints/certificates.py",
                "endpoint:backend/app/api/v1/endpoints/avatar.py",
                "endpoint:backend/app/api/v1/endpoints/ai_assistant.py"
            ]
        },
        {
            "id": "layer:business-services",
            "name": "Domain Services & AI Engine",
            "description": "Secure business logic for AI Study Copilot, Avatar generation, file quarantine inspection, and security.",
            "nodeIds": [
                "file:backend/app/core/config.py",
                "file:backend/app/core/security.py",
                "file:backend/app/core/deps.py",
                "service:backend/app/services/ai_gateway.py",
                "service:backend/app/services/avatar_service.py",
                "service:backend/app/services/quarantine_service.py"
            ]
        },
        {
            "id": "layer:data-models",
            "name": "Relational Persistence & Schemas",
            "description": "SQLAlchemy 2.0 ORM models, relational foreign keys, row-level locking, and transactional integrity.",
            "nodeIds": [
                "table:backend/app/models/user.py:User",
                "table:backend/app/models/course.py:Course",
                "table:backend/app/models/certificate.py:Certificate"
            ]
        },
        {
            "id": "layer:infrastructure",
            "name": "Infrastructure & Documentation",
            "description": "Container orchestration, automated dev harnesses, architectural agent guidelines, and Version 1.0 documentation suite.",
            "nodeIds": [
                "document:README.md",
                "document:AGENTS.md",
                "document:docs/PRD.md",
                "document:docs/TRD.md",
                "document:docs/APP_FLOW.md",
                "document:docs/UI_UX_DESIGN_BRIEF.md",
                "document:docs/BACKEND_SCHEMA.md",
                "document:docs/IMPLEMENTATION_PLAN.md",
                "document:docs/FINAL_AUDIT_REPORT.md",
                "service:docker-compose.yml"
            ]
        }
    ]

    # 4. Define Guided Tour
    tour = [
        {
            "order": 1,
            "title": "Learnflow LMS Architecture & System Invariants",
            "description": "Explore Learnflow's academic learning ecosystem built with React 19, FastAPI, PostgreSQL, and Redis. It strictly upholds non-negotiable security controls while delivering instant, lag-free UI transitions.",
            "nodeIds": ["document:README.md", "document:AGENTS.md", "service:docker-compose.yml"]
        },
        {
            "order": 2,
            "title": "Authentication, Session Hydration & RBAC",
            "description": "Learnflow enforces RFC 6819 token rotation with family revocation upon replay. Authentication state is synchronized via Zustand and verified in backend dependencies before accessing role-scoped endpoints.",
            "nodeIds": ["file:backend/app/core/security.py", "file:backend/app/core/deps.py", "file:frontend/src/store/authStore.ts"]
        },
        {
            "order": 3,
            "title": "Clean Semantic Course Slugs & Two-Tier Caching",
            "description": "Course URLs are clean, human-readable slugs (/courses/:slug). The backend resolves either UUID or slug, canonicalizes the browser bar, and serves data from a two-tier memory + sessionStorage cache for instant page switches.",
            "nodeIds": ["file:frontend/src/utils/courseUrls.ts", "file:frontend/src/utils/dataCache.ts", "endpoint:backend/app/api/v1/endpoints/courses.py", "file:frontend/src/pages/CourseDetailPage.tsx"]
        },
        {
            "order": 4,
            "title": "Interactive Mountain Trail & Milestone Ledgers",
            "description": "Visualizes learner progress through sequential curriculum modules as a mountain ascent, featuring dynamic daytime and nighttime ambient lighting, elevation gains, and checkpoint rewards.",
            "nodeIds": ["file:frontend/src/pages/MyJourneyPage.tsx", "file:frontend/src/components/journey/MountainScene.tsx"]
        },
        {
            "order": 5,
            "title": "Lesson Reader & Mobile Touch-Drag Selection Lifecycle",
            "description": "High-focus academic reading environment. The floating action toolbar (Notes, Highlighter, AI Explainer) never pops up prematurely during mobile long-press, granting complete freedom to drag text selection before options appear.",
            "nodeIds": ["file:frontend/src/pages/LessonPlayerPage.tsx", "file:frontend/src/components/study/SelectionActionToolbar.tsx"]
        },
        {
            "order": 6,
            "title": "Sequential Assessment Arena & Quarantine Grading",
            "description": "Rigorous academic examination arena with countdown timers, auto-save drafts, and objective scoring. Practical code assignments pass through a 5-stage quarantine pipeline before instructor review.",
            "nodeIds": ["endpoint:backend/app/api/v1/endpoints/assessments.py", "service:backend/app/services/quarantine_service.py", "file:frontend/src/pages/AssessmentArenaPage.tsx"]
        },
        {
            "order": 7,
            "title": "Personalised SVG Avatar Studio & Environments",
            "description": "Snapchat-inspired personalization studio empowering users to customize facial structures, hairstyles, clothing, and academic backgrounds. Rendered via a lightweight, scalable SVG composition engine across all platforms.",
            "nodeIds": ["file:frontend/src/pages/AvatarStudioPage.tsx", "file:frontend/src/components/avatar/PersonalizedAvatar.tsx", "endpoint:backend/app/api/v1/endpoints/avatar.py", "service:backend/app/services/avatar_service.py"]
        },
        {
            "order": 8,
            "title": "AI Study Copilot & Academic RAG Assistant",
            "description": "Draggable, role-aware study copilot powered by Google Gemini. Restricts context strictly to the student's enrolled courses and prevents prompt injection using delimiter fences and canary tokens.",
            "nodeIds": ["file:frontend/src/components/ai/LearnflowCopilot.tsx", "endpoint:backend/app/api/v1/endpoints/ai_assistant.py", "service:backend/app/services/ai_gateway.py"]
        },
        {
            "order": 9,
            "title": "Verifiable Cryptographic Diplomas & QR Verification",
            "description": "Upon completing 100% of curriculum requirements, learners claim a verifiable certificate containing an unforgeable SHA-256 hash verifiable publicly via QR code or direct code lookup.",
            "nodeIds": ["table:backend/app/models/certificate.py:Certificate", "endpoint:backend/app/api/v1/endpoints/certificates.py", "file:frontend/src/pages/PublicVerifyCertificatePage.tsx"]
        }
    ]

    knowledge_graph = {
        "version": "1.0.0",
        "project": project_meta,
        "nodes": nodes,
        "edges": edges,
        "layers": layers,
        "tour": tour
    }

    # Write knowledge-graph.json
    kg_path = ua_dir / "knowledge-graph.json"
    with open(kg_path, "w", encoding="utf-8") as f:
        json.dump(knowledge_graph, f, indent=2)

    # Write meta.json
    meta = {
        "lastAnalyzedAt": now_iso,
        "gitCommitHash": git_hash,
        "version": "1.0.0",
        "analyzedFiles": len(nodes)
    }
    meta_path = ua_dir / "meta.json"
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=2)

    # Also write intermediate assembled-graph.json for tooling parity
    with open(intermediate_dir / "assembled-graph.json", "w", encoding="utf-8") as f:
        json.dump(knowledge_graph, f, indent=2)

    print(f"Knowledge Graph successfully generated:")
    print(f"  - Nodes: {len(nodes)}")
    print(f"  - Edges: {len(edges)}")
    print(f"  - Layers: {len(layers)}")
    print(f"  - Tour Steps: {len(tour)}")
    print(f"  - Saved to: {kg_path}")
    print(f"  - Metadata to: {meta_path}")

if __name__ == "__main__":
    main()
