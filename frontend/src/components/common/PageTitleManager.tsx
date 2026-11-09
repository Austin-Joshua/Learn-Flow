import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

interface TitlePattern {
  pattern: RegExp;
  title: string;
}

const TITLE_PATTERNS: TitlePattern[] = [
  { pattern: /^\/$/, title: 'Learnflow | Academic Learning & Assessment Platform' },
  { pattern: /^\/login/, title: 'Learnflow | Sign In' },
  { pattern: /^\/(register|signup)/, title: 'Learnflow | Create Account' },
  { pattern: /^\/my-learning/, title: 'Learnflow | Student Portal & Enrolled Courses' },
  { pattern: /^\/my-journey/, title: 'Learnflow | Mountain Trail Progress' },
  { pattern: /^\/courses\/[^/]+$/, title: 'Learnflow | Course Curriculum' },
  { pattern: /^\/courses/, title: 'Learnflow | Computing Curriculum Catalog' },
  { pattern: /^\/lessons\/[^/]+/, title: 'Learnflow | Lesson Player' },
  { pattern: /^\/assessments\/[^/]+/, title: 'Learnflow | Timed Assessment Arena' },
  { pattern: /^\/attempts\/[^/]+\/result/, title: 'Learnflow | Assessment Results' },
  { pattern: /^\/my-certificates/, title: 'Learnflow | Credentials & Certificates' },
  { pattern: /^\/adaptive-path/, title: 'Learnflow | Adaptive Learning Path' },
  { pattern: /^\/instructor\/courses\/[^/]+\/builder/, title: 'Learnflow | Course & Assessment Builder' },
  { pattern: /^\/instructor\/courses\/[^/]+\/analytics/, title: 'Learnflow | Cohort Analytics' },
  { pattern: /^\/instructor\/courses/, title: 'Learnflow | Faculty Course Studio' },
  { pattern: /^\/instructor\/grading/, title: 'Learnflow | Assignment Grading Queue' },
  { pattern: /^\/hod/, title: 'Learnflow | Department Oversight' },
  { pattern: /^\/admin/, title: 'Learnflow | System Governance' },
  { pattern: /^\/settings/, title: 'Learnflow | Account Settings' },
  { pattern: /^\/verify/, title: 'Learnflow | Public Certificate Verification' },
];

export const PageTitleManager: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    const match = TITLE_PATTERNS.find((item) => item.pattern.test(location.pathname));
    if (match) {
      document.title = match.title;
    } else {
      document.title = 'Learnflow';
    }
  }, [location.pathname]);

  return null;
};

