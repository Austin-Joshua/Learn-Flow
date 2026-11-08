import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const VIEWPORTS = [
  { name: '390x844', width: 390, height: 844 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
];

const BASE_URL = 'http://localhost:5173';
const API_URL = 'http://localhost:8000/api/v1';
const OUT_DIR = path.resolve('screenshots/verification');

if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function loginUser(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    throw new Error(`Login failed for ${email}: ${res.statusText}`);
  }
  const data = await res.json();
  const setCookie = res.headers.get('set-cookie');
  return { ...data, setCookie };
}

async function run() {
  console.log('Starting verification screenshot capture...');
  const browser = await chromium.launch({ headless: true });

  // 1. Fetch authentication credentials
  const learnerAuth = await loginUser('learner@learnflow.edu', 'LearnerPass123!');
  const instructorAuth = await loginUser('instructor@learnflow.edu', 'InstructorPass123!');
  const hodAuth = await loginUser('hod@learnflow.edu', 'HodPass123!');
  const adminAuth = await loginUser('admin@learnflow.edu', 'AdminPass123!');

  const courseId = 'ff7c2330-d87c-4c20-a264-f213031d9fa0';
  const lessonId = 'af726e42-73bd-4cc4-a2ca-66e3d717475d';
  const assessmentId = '990060d6-9aa7-4711-bc3e-a1f73449dbe9';

  const targets = [
    { page: 'landing', path: '/', auth: null },
    { page: 'catalog', path: '/courses', auth: null },
    { page: 'login', path: '/login', auth: null },
    { page: 'course_detail', path: `/courses/${courseId}`, auth: learnerAuth },
    { page: 'my_learning', path: '/my-learning', auth: learnerAuth },
    { page: 'journey', path: '/my-journey', auth: learnerAuth },
    { page: 'lesson_player', path: `/lessons/${lessonId}`, auth: learnerAuth },
    { page: 'assessment_arena', path: `/assessments/${assessmentId}`, auth: learnerAuth },
    { page: 'instructor_dashboard', path: '/instructor/courses', auth: instructorAuth },
    { page: 'grading_queue', path: '/instructor/grading', auth: instructorAuth },
    { page: 'hod_dashboard', path: '/hod', auth: hodAuth },
    { page: 'admin_dashboard', path: '/admin', auth: adminAuth },
  ];

  for (const vp of VIEWPORTS) {
    console.log(`\n--- Capturing viewport: ${vp.name} ---`);
    for (const t of targets) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
      });

      const page = await context.newPage();

      // If auth required, seed localStorage and cookie
      if (t.auth) {
        await page.addInitScript(({ user }) => {
          window.localStorage.setItem('learnflow_user', JSON.stringify(user));
        }, { user: t.auth.user });

        // Add refresh token cookie if available
        if (t.auth.setCookie) {
          const cookieParts = t.auth.setCookie.split(';')[0].split('=');
          if (cookieParts.length === 2) {
            await context.addCookies([{
              name: cookieParts[0].trim(),
              value: cookieParts[1].trim(),
              domain: 'localhost',
              path: '/',
              httpOnly: true,
            }]);
          }
        }
      }

      const url = `${BASE_URL}${t.path}`;
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 15000 });
        await page.waitForTimeout(600); // allow animations/progress rings to stabilize

        const filename = `${t.page}_${vp.name}.png`;
        const filepath = path.join(OUT_DIR, filename);
        await page.screenshot({ path: filepath, fullPage: false });
        console.log(`Saved verification: ${filename}`);
      } catch (err) {
        console.error(`Failed ${t.page} at ${vp.name}:`, err.message);
      } finally {
        await context.close();
      }
    }
  }

  await browser.close();
  console.log('\nVerification screenshots capture complete!');
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});

