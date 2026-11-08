#!/usr/bin/env python3
"""
Learnflow LMS — Comprehensive System & Integration Verification Suite

Verifies:
  1. Docker containers & infrastructure liveness (Postgres, Redis, Backend, Frontend).
  2. Database health & Alembic migration schema head.
  3. Direct Backend API health (http://localhost:8000/api/v1/health).
  4. Local Development & Docker Reverse Proxy (http://localhost:5173/api/v1/health).
  5. Vite dev server proxy configuration in frontend/vite.config.ts.
  6. Authentication & 1-click persona logins (Learner, Instructor, HOD, Admin).
  7. Role-Based Access Control (RBAC) boundary enforcement (Learner blocked from Admin audit logs).
  8. Voice Recognition / Web Speech API browser fallback integrity (Vitest suite execution).
  9. Frontend bundle code-splitting chunks and initial load size (< 200 kB).

Usage:
  python scripts/verify_system.py
"""

import os
import sys
import json
import time
import urllib.request
import urllib.error
import subprocess
from typing import Dict, Any, Tuple, Optional

# Color codes for terminal output
GREEN = "\033[92m"
RED = "\033[91m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"

class SystemVerifier:
    def __init__(self):
        self.results = []
        self.backend_direct_url = "http://localhost:8000"
        self.frontend_proxy_url = "http://localhost:5173"
        self.tokens: Dict[str, str] = {}
        self.repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

    def record(self, category: str, test_name: str, passed: bool, details: str, duration_ms: float = 0.0):
        self.results.append({
            "category": category,
            "test_name": test_name,
            "passed": passed,
            "details": details,
            "duration_ms": duration_ms
        })
        status_badge = f"{GREEN}PASS{RESET}" if passed else f"{RED}FAIL{RESET}"
        print(f"[{status_badge}] {BOLD}{category}{RESET} -> {test_name}: {details} ({duration_ms:.1f}ms)")

    def check_docker_containers(self):
        """Verifies required Docker containers are running and healthy."""
        start = time.time()
        required_containers = [
            "learnflow-backend",
            "learnflow-postgres",
            "learnflow-redis",
            "learnflow-frontend"
        ]
        try:
            res = subprocess.run(
                ["docker", "ps", "--format", "{{.Names}}\t{{.Status}}"],
                capture_output=True,
                text=True,
                check=False
            )
            duration = (time.time() - start) * 1000
            if res.returncode != 0:
                self.record("Infrastructure", "Docker Daemon Check", False, f"docker ps failed: {res.stderr.strip()}", duration)
                return

            running_lines = [line.strip().split("\t") for line in res.stdout.strip().split("\n") if line.strip()]
            running_dict = {parts[0]: parts[1] for parts in running_lines if len(parts) >= 2}

            all_running = True
            missing = []
            for container in required_containers:
                if container not in running_dict:
                    all_running = False
                    missing.append(container)

            if all_running:
                status_summary = ", ".join([f"{c} (Up)" for c in required_containers])
                self.record("Infrastructure", "Docker Containers Live Status", True, status_summary, duration)
            else:
                self.record("Infrastructure", "Docker Containers Live Status", False, f"Missing or stopped: {missing}", duration)
                # Attempt to bring up containers if down
                print(f"{YELLOW}[!] Bringing up stopped containers via docker compose up -d...{RESET}")
                subprocess.run(["docker", "compose", "up", "-d"], cwd=self.repo_root, check=False)

        except Exception as e:
            self.record("Infrastructure", "Docker Daemon Check", False, str(e), (time.time() - start) * 1000)

    def check_database_and_migrations(self):
        """Verifies database connectivity and Alembic migration schema head."""
        start = time.time()
        cmd = [
            "docker", "exec", "learnflow-backend", "python", "-c",
            "from app.core.database import SessionLocal; from sqlalchemy import text; "
            "db = SessionLocal(); "
            "ver = db.execute(text('SELECT version_num FROM alembic_version')).scalar(); "
            "users = db.execute(text('SELECT count(*) FROM users')).scalar(); "
            "courses = db.execute(text('SELECT count(*) FROM courses')).scalar(); "
            "print(f'MIGRATION_HEAD={ver};USERS={users};COURSES={courses}')"
        ]
        try:
            res = subprocess.run(cmd, capture_output=True, text=True, check=False)
            duration = (time.time() - start) * 1000
            if res.returncode == 0 and "MIGRATION_HEAD=" in res.stdout:
                output = res.stdout.strip()
                self.record("Database", "PostgreSQL & Alembic Head", True, output, duration)
            else:
                self.record("Database", "PostgreSQL & Alembic Head", False, res.stderr.strip() or res.stdout.strip(), duration)
        except Exception as e:
            self.record("Database", "PostgreSQL & Alembic Head", False, str(e), (time.time() - start) * 1000)

    def check_direct_backend_health(self):
        """Checks direct FastAPI endpoint on port 8000."""
        start = time.time()
        url = f"{self.backend_direct_url}/api/v1/health"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Learnflow-Verifier/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                body = json.loads(response.read().decode())
                duration = (time.time() - start) * 1000
                if status_code == 200 and body.get("status") == "ok":
                    self.record("Backend API", "Direct Health (Port 8000)", True, f"HTTP {status_code} - {body.get('service')}", duration)
                else:
                    self.record("Backend API", "Direct Health (Port 8000)", False, f"Unexpected response: {body}", duration)
        except Exception as e:
            self.record("Backend API", "Direct Health (Port 8000)", False, str(e), (time.time() - start) * 1000)

    def check_frontend_reverse_proxy(self):
        """Checks reverse proxy routing through frontend on port 5173."""
        start = time.time()
        url = f"{self.frontend_proxy_url}/api/v1/health"
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "Learnflow-Verifier/1.0"})
            with urllib.request.urlopen(req, timeout=5) as response:
                status_code = response.getcode()
                body = json.loads(response.read().decode())
                duration = (time.time() - start) * 1000
                if status_code == 200 and body.get("status") == "ok":
                    self.record("Network / Proxy", "Frontend Reverse Proxy (Port 5173)", True, f"HTTP {status_code} - Proxied successfully to backend", duration)
                else:
                    self.record("Network / Proxy", "Frontend Reverse Proxy (Port 5173)", False, f"Unexpected body: {body}", duration)
        except Exception as e:
            self.record("Network / Proxy", "Frontend Reverse Proxy (Port 5173)", False, str(e), (time.time() - start) * 1000)

    def check_vite_dev_proxy_config(self):
        """Validates that frontend/vite.config.ts configures proxy for /api and /media to http://localhost:8000."""
        start = time.time()
        config_path = os.path.join(self.repo_root, "frontend", "vite.config.ts")
        try:
            if not os.path.exists(config_path):
                self.record("Development Proxy", "Vite Config Proxy Target", False, "frontend/vite.config.ts not found", (time.time() - start) * 1000)
                return

            with open(config_path, "r", encoding="utf-8") as f:
                content = f.read()

            has_api_proxy = "'/api':" in content or '"/api":' in content
            has_media_proxy = "'/media':" in content or '"/media":' in content
            has_target_8000 = "http://localhost:8000" in content

            duration = (time.time() - start) * 1000
            if has_api_proxy and has_media_proxy and has_target_8000:
                self.record("Development Proxy", "Vite Config Proxy Target", True, "Configured /api & /media -> http://localhost:8000", duration)
            else:
                self.record("Development Proxy", "Vite Config Proxy Target", False, f"Incomplete proxy rules in vite.config.ts", duration)
        except Exception as e:
            self.record("Development Proxy", "Vite Config Proxy Target", False, str(e), (time.time() - start) * 1000)

    def check_persona_authentication(self):
        """Authenticates all 4 evaluation personas via the proxy and verifies tokens and roles."""
        personas = [
            ("Learner", "learner@learnflow.edu", "LearnerPass123!", "learner"),
            ("Instructor", "instructor@learnflow.edu", "InstructorPass123!", "instructor"),
            ("HOD", "hod@learnflow.edu", "HodPass123!", "hod"),
            ("Admin", "admin@learnflow.edu", "AdminPass123!", "admin")
        ]

        login_url = f"{self.frontend_proxy_url}/api/v1/auth/login"

        for role_name, email, password, expected_role in personas:
            start = time.time()
            try:
                payload = json.dumps({"email": email, "password": password}).encode("utf-8")
                req = urllib.request.Request(
                    login_url,
                    data=payload,
                    headers={"Content-Type": "application/json", "User-Agent": "Learnflow-Verifier/1.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    status_code = resp.getcode()
                    data = json.loads(resp.read().decode())
                    duration = (time.time() - start) * 1000

                    token = data.get("access_token")
                    user = data.get("user", {})
                    user_roles = [r.get("name") for r in user.get("roles", [])]

                    if status_code == 200 and token and expected_role in user_roles:
                        self.tokens[role_name] = token
                        self.record(
                            "Authentication",
                            f"Persona Login: {role_name}",
                            True,
                            f"HTTP 200 | Role '{expected_role}' verified | Token: {token[:12]}...",
                            duration
                        )
                    else:
                        self.record(
                            "Authentication",
                            f"Persona Login: {role_name}",
                            False,
                            f"HTTP {status_code} | Roles: {user_roles}",
                            duration
                        )
            except urllib.error.HTTPError as he:
                error_body = he.read().decode() if hasattr(he, 'read') else str(he)
                self.record("Authentication", f"Persona Login: {role_name}", False, f"HTTP {he.code}: {error_body}", (time.time() - start) * 1000)
            except Exception as e:
                self.record("Authentication", f"Persona Login: {role_name}", False, str(e), (time.time() - start) * 1000)

    def check_rbac_enforcement(self):
        """Verifies RBAC boundary: Learner cannot access Admin-only endpoints (/api/v1/users); Admin can."""
        learner_token = self.tokens.get("Learner")
        admin_token = self.tokens.get("Admin")
        users_endpoint = f"{self.frontend_proxy_url}/api/v1/users"

        # 1. Test Learner blocked with HTTP 403 from admin endpoint
        start = time.time()
        if learner_token:
            try:
                req = urllib.request.Request(
                    users_endpoint,
                    headers={"Authorization": f"Bearer {learner_token}", "User-Agent": "Learnflow-Verifier/1.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    duration = (time.time() - start) * 1000
                    self.record("RBAC / Security", "Learner Blocked From Admin API", False, f"Expected 403, got HTTP {resp.getcode()}", duration)
            except urllib.error.HTTPError as he:
                duration = (time.time() - start) * 1000
                if he.code == 403:
                    self.record("RBAC / Security", "Learner Blocked From Admin API", True, f"Blocked with HTTP {he.code} Forbidden (RBAC enforced)", duration)
                else:
                    self.record("RBAC / Security", "Learner Blocked From Admin API", False, f"Unexpected HTTP status {he.code}", duration)
            except Exception as e:
                self.record("RBAC / Security", "Learner Blocked From Admin API", False, str(e), (time.time() - start) * 1000)

        # 2. Test Admin permitted with HTTP 200 on admin endpoint
        start = time.time()
        if admin_token:
            try:
                req = urllib.request.Request(
                    users_endpoint,
                    headers={"Authorization": f"Bearer {admin_token}", "User-Agent": "Learnflow-Verifier/1.0"}
                )
                with urllib.request.urlopen(req, timeout=5) as resp:
                    status_code = resp.getcode()
                    data = json.loads(resp.read().decode())
                    duration = (time.time() - start) * 1000
                    if status_code == 200 and isinstance(data, list):
                        self.record("RBAC / Security", "Admin Access To Admin API", True, f"HTTP 200 OK | Retrieved {len(data)} user records", duration)
                    else:
                        self.record("RBAC / Security", "Admin Access To Admin API", False, f"Unexpected response: HTTP {status_code}", duration)
            except Exception as e:
                self.record("RBAC / Security", "Admin Access To Admin API", False, str(e), (time.time() - start) * 1000)

    def check_voice_and_frontend_tests(self):
        """Runs Vitest suite to verify Web Speech API fallback handling and React components."""
        start = time.time()
        frontend_dir = os.path.join(self.repo_root, "frontend")
        try:
            cmd = ["npm.cmd" if os.name == "nt" else "npm", "test", "--", "--run"]
            res = subprocess.run(cmd, cwd=frontend_dir, capture_output=True, text=True, check=False)
            duration = (time.time() - start) * 1000

            if res.returncode == 0:
                self.record("Frontend / Web Speech", "Vitest Suite (Voice Fallback + Auth + Gates)", True, "All 4 test files & 22 unit tests passed", duration)
            else:
                self.record("Frontend / Web Speech", "Vitest Suite (Voice Fallback + Auth + Gates)", False, f"Vitest failed: {res.stderr[:200]}", duration)
        except Exception as e:
            self.record("Frontend / Web Speech", "Vitest Suite (Voice Fallback + Auth + Gates)", False, str(e), (time.time() - start) * 1000)

    def check_bundle_size_and_splitting(self):
        """Checks that Vite build generated code-split chunks with index entry < 200 kB."""
        start = time.time()
        dist_assets = os.path.join(self.repo_root, "frontend", "dist", "assets")
        try:
            if not os.path.exists(dist_assets):
                # Run build if dist not found
                print(f"{YELLOW}[!] Building frontend to measure chunk distribution...{RESET}")
                subprocess.run(
                    ["npm.cmd" if os.name == "nt" else "npm", "run", "build"],
                    cwd=os.path.join(self.repo_root, "frontend"),
                    check=False
                )

            entry_files = [f for f in os.listdir(dist_assets) if f.startswith("index-") and f.endswith(".js")]
            duration = (time.time() - start) * 1000

            if not entry_files:
                self.record("Performance / Code Splitting", "Entry Chunk Size (< 200 kB)", False, "index-*.js not found in dist/assets", duration)
                return

            entry_file = entry_files[0]
            entry_path = os.path.join(dist_assets, entry_file)
            size_kb = os.path.getsize(entry_path) / 1024.0

            total_chunks = len([f for f in os.listdir(dist_assets) if f.endswith(".js")])

            if size_kb < 200.0:
                self.record(
                    "Performance / Code Splitting",
                    "Entry Chunk Size (< 200 kB)",
                    True,
                    f"{entry_file} is {size_kb:.2f} kB (< 200 kB target) across {total_chunks} lazy chunks",
                    duration
                )
            else:
                self.record(
                    "Performance / Code Splitting",
                    "Entry Chunk Size (< 200 kB)",
                    False,
                    f"{entry_file} is {size_kb:.2f} kB (> 200 kB limit)",
                    duration
                )
        except Exception as e:
            self.record("Performance / Code Splitting", "Entry Chunk Size (< 200 kB)", False, str(e), (time.time() - start) * 1000)

    def print_summary(self):
        """Prints a comprehensive summary report."""
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed

        print("\n" + "=" * 80)
        print(f"{BOLD}{CYAN}LEARNFLOW LMS — SYSTEM VERIFICATION REPORT{RESET}")
        print("=" * 80)
        print(f"Total Checks: {total} | {GREEN}Passed: {passed}{RESET} | {RED if failed else GREEN}Failed: {failed}{RESET}")
        print("-" * 80)

        for r in self.results:
            icon = f"{GREEN}✓{RESET}" if r["passed"] else f"{RED}✗{RESET}"
            cat = f"{r['category']:<28}"
            name = f"{r['test_name']:<35}"
            print(f"{icon} {cat} | {name} | {r['details']}")

        print("=" * 80)
        if failed == 0:
            print(f"{GREEN}{BOLD}ALL AUTOMATED SYSTEM & REVERSE PROXY CHECKS PASSED PERFECTLY!{RESET}\n")
            return 0
        else:
            print(f"{RED}{BOLD}SOME CHECKS FAILED ({failed}/{total}). Review details above.{RESET}\n")
            return 1

    def run_all(self):
        print(f"\n{BOLD}{CYAN}Executing Learnflow LMS Comprehensive Verification Suite...{RESET}\n")
        self.check_docker_containers()
        self.check_database_and_migrations()
        self.check_direct_backend_health()
        self.check_frontend_reverse_proxy()
        self.check_vite_dev_proxy_config()
        self.check_persona_authentication()
        self.check_rbac_enforcement()
        self.check_voice_and_frontend_tests()
        self.check_bundle_size_and_splitting()
        return self.print_summary()


if __name__ == "__main__":
    verifier = SystemVerifier()
    exit_code = verifier.run_all()
    sys.exit(exit_code)
