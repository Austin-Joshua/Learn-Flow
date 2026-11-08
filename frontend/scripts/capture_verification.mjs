import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

const THEMES = ['light', 'dark'];

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000/api/v1';
const OUT_DIR = path.resolve('screenshots/verification');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const CREDENTIALS = {
  learner: { email: 'learner@learnflow.edu', password: 'LearnerPass123!' },
  instructor: { email: 'instructor@learnflow.edu', password: 'InstructorPass123!' },
  hod: { email: 'hod@learnflow.edu', password: 'HodPass123!' },
  admin: { email: 'admin@learnflow.edu', password: 'AdminPass123!' },
};

function resetRateLimit() {
  try {
    execSync('docker exec learnflow-backend python -c "from app.core.rate_limit import auth_rate_limiter; auth_rate_limiter.reset_all()"', { stdio: 'ignore' });
  } catch {}
}

async function loginFresh(role) {
  resetRateLimit();
  const creds = CREDENTIALS[role];
  if (!creds) throw new Error(`Unknown role: ${role}`);

  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(creds),
  });

  if (!res.ok) {
    throw new Error(`Fresh login failed for ${role} (${creds.email}): ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  if (!setCookie) {
    throw new Error(`Login response did not return Set-Cookie header for ${role}`);
  }

  // Extract raw refresh token from cookie
  const match = setCookie.match(/refresh_token=([^;]+)/);
  const refreshToken = match ? match[1] : null;

  return {
    user: data.user,
    accessToken: data.access_token,
    refreshToken,
  };
}

const TARGETS = [
  {
    page: 'my_learning',
    path: '/my-learning',
    role: 'learner',
    expectedText: /My Enrolled Courses/i,
  },
  {
    page: 'course_detail',
    path: '/courses/b5fcdaca-0e5c-4c06-8533-ccddbf3e0b05',
    role: 'learner',
    expectedText: /Full-Stack System Design/i,
  },
  {
    page: 'lesson_player',
    path: '/lessons/6bad1518-b0d8-474a-896d-9a4cac8ac4a4',
    role: 'learner',
    expectedText: /PostgreSQL B-Tree Index Optimization/i,
  },
  {
    page: 'assessment_arena',
    path: '/assessments/c186fdb6-5272-4872-b3d9-9c29da5472e0',
    role: 'learner',
    expectedText: /Midterm Assessment/i,
  },
  {
    page: 'journey',
    path: '/my-journey',
    role: 'learner',
    expectedText: /My Learning Journey/i,
  },
  {
    page: 'instructor_dashboard',
    path: '/instructor/courses',
    role: 'instructor',
    expectedText: /Instructor Studio/i,
  },
  {
    page: 'grading_queue',
    path: '/instructor/grading',
    role: 'instructor',
    expectedText: /Assignment Grading Queue/i,
  },
  {
    page: 'hod_dashboard',
    path: '/hod',
    role: 'hod',
    expectedText: /Head of Department/i,
  },
  {
    page: 'admin_dashboard',
    path: '/admin',
    role: 'admin',
    expectedText: /Admin Portal & Security Audit/i,
  },
];

async function captureAll() {
  console.log('====================================================');
  console.log('Starting Real Verification Screenshots Capture');
  console.log(`Targets: ${TARGETS.length} pages x ${VIEWPORTS.length} viewports x ${THEMES.length} themes = ${TARGETS.length * VIEWPORTS.length * THEMES.length} captures`);
  console.log('====================================================\n');

  const browser = await chromium.launch({ headless: true });
  const capturedFiles = [];

  try {
    for (const theme of THEMES) {
      for (const vp of VIEWPORTS) {
        console.log(`\n>>> Viewport: ${vp.name} | Theme: ${theme} <<<`);

        for (const t of TARGETS) {
          // 1. Fresh login inside each context to avoid refresh-token replay revocation
          const auth = await loginFresh(t.role);

          const context = await browser.newContext({
            viewport: { width: vp.width, height: vp.height },
            colorScheme: theme,
          });

          // 2. Seed cookie for both /api/v1/auth and root
          if (auth.refreshToken) {
            await context.addCookies([
              {
                name: 'refresh_token',
                value: auth.refreshToken,
                domain: 'localhost',
                path: '/api/v1/auth',
                httpOnly: true,
                sameSite: 'Lax',
              },
              {
                name: 'refresh_token',
                value: auth.refreshToken,
                domain: 'localhost',
                path: '/',
                httpOnly: true,
                sameSite: 'Lax',
              },
            ]);
          }

          const page = await context.newPage();

          // 3. Seed localStorage for user and theme
          await page.addInitScript(({ user, themePref }) => {
            window.localStorage.setItem('learnflow_user', JSON.stringify(user));
            window.localStorage.setItem('learnflow-theme', themePref);
            if (themePref === 'dark') {
              document.documentElement.classList.add('dark');
            } else {
              document.documentElement.classList.remove('dark');
            }
          }, { user: auth.user, themePref: theme });

          const targetUrl = `${BASE_URL}${t.path}`;
          try {
            await page.goto(targetUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
            // Wait for expected header or content to render
            await page.getByText(t.expectedText).first().waitFor({ state: 'attached', timeout: 15000 });
            await page.waitForTimeout(600); // Allow auth refresh, DOM animations & progress rings to settle

            // 4. Assertions: Fail loudly if redirected to /login or expected content is missing
            const currentUrl = page.url();
            if (currentUrl.includes('/login')) {
              throw new Error(`CRITICAL FAILURE: Page '${t.page}' redirected to /login! Session was rejected.`);
            }

            const pageContent = await page.textContent('body');
            if (t.expectedText && !t.expectedText.test(pageContent)) {
              throw new Error(`CRITICAL FAILURE: Expected text pattern '${t.expectedText}' not matched in '${t.page}'`);
            }

            // Verify navigation shell exists (sidebar, rail, or bottom tab bar)
            const hasShell = await page.locator('nav, aside, [role="navigation"]').count();
            if (hasShell === 0) {
              throw new Error(`CRITICAL FAILURE: AppShell navigation elements missing on page '${t.page}'`);
            }

            // 5. Save screenshot
            const filename = `${t.page}_${vp.name}_${theme}.png`;
            const filepath = path.join(OUT_DIR, filename);
            await page.screenshot({ path: filepath, fullPage: false });
            console.log(`  ✓ Captured: ${filename}`);
            capturedFiles.push({ page: t.page, viewport: vp.name, theme, filename, filepath });

          } catch (err) {
            console.error(`  ✗ FAILED: ${t.page} [${vp.name}, ${theme}]:`, err.message);
            throw err;
          } finally {
            await context.close();
          }
        }
      }
    }

    console.log(`\nSuccessfully captured ${capturedFiles.length} verification screenshots!`);

    // 6. Byte Hash Uniqueness Verification
    console.log('\n--- Verifying Screenshot Byte Hashes ---');
    const hashes = new Map(); // hash -> file metadata
    const duplicates = [];

    for (const item of capturedFiles) {
      const buffer = fs.readFileSync(item.filepath);
      const hash = crypto.createHash('sha256').update(buffer).digest('hex');
      item.hash = hash;

      if (hashes.has(hash)) {
        const existing = hashes.get(hash);
        // If two DIFFERENT pages have identical screenshot hash, it means one is broken (e.g. redirected to login)
        if (existing.page !== item.page) {
          duplicates.push({
            hash,
            fileA: existing.filename,
            pageA: existing.page,
            fileB: item.filename,
            pageB: item.page,
          });
        }
      } else {
        hashes.set(hash, item);
      }
    }

    if (duplicates.length > 0) {
      console.error('\nCRITICAL COLLISION ERROR: Different pages produced identical screenshot hashes:');
      for (const d of duplicates) {
        console.error(`  - Hash ${d.hash.slice(0, 16)}...: '${d.fileA}' (${d.pageA}) === '${d.fileB}' (${d.pageB})`);
      }
      throw new Error(`Byte hash collision detected between ${duplicates.length} distinct pages.`);
    }

    console.log(`All ${capturedFiles.length} screenshots verified. 0 cross-page byte hash collisions detected!`);
    console.log(`Unique SHA-256 hashes generated: ${hashes.size} / ${capturedFiles.length}`);

  } finally {
    await browser.close();
  }
}

captureAll().catch((err) => {
  console.error('\nFATAL ERROR in capture_verification:', err);
  process.exit(1);
});
