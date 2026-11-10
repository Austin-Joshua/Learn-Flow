/**
 * Course Cover Image Mapping & Resolution Utility
 * Provides crisp, thematic, high-contrast Unsplash imagery for all computing courses.
 */

interface CourseLike {
  id?: string;
  slug?: string;
  title?: string;
  thumbnail_url?: string;
  domain?: string;
}

// Curated high-resolution, thematic photography per subject
export const COURSE_COVER_PRESETS: Record<string, string> = {
  // Systems & Distributed Architecture
  'system-design-distributed-architecture': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=70',
  'database-internals-concurrency-isolation': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=70',
  'cloud-native-infrastructure-container-security': 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=70',
  'cloud-computing-microservices': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=70',
  'realtime-data-engineering-stream-processing': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=70',
  'production-sre-devsecops': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=70',
  'computer-networks-protocols': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=70',

  // Frontend & React
  'advanced-react-typescript-patterns': 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=70',

  // Programming Languages
  'c-programming-systems': 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=70',
  'python-idiomatic-async': 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=70',
  'java-enterprise-jvm': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=70',
  'rust-systems-concurrency': 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=70',
  'golang-concurrency-microservices': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=70',

  // Core CS: Algorithms, OOP, OS, Compilers
  'dsa-algorithmic-analysis': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=70',
  'oop-clean-architecture': 'https://images.unsplash.com/photo-1516116211227-bbc03a2901db?w=800&auto=format&fit=crop&q=70',
  'os-kernel-scheduling': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=70',
  'compiler-construction-ast': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=70',

  // Security, AI & Mobile
  'deep-learning-systems-neural-architectures': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=70',
  'applied-cryptography-zero-knowledge': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=70',
  'web-security-defense': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=70',
  'mobile-flutter-reactive-architecture': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=70',
};

// Generic thematic fallbacks by keyword matching in course title / slug
const KEYWORD_FALLBACKS: Array<{ keywords: string[]; url: string }> = [
  {
    keywords: ['react', 'frontend', 'typescript', 'ui', 'css', 'javascript'],
    url: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['system', 'distributed', 'architecture', 'microservice'],
    url: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['database', 'sql', 'concurrency', 'postgres', 'storage', 'data'],
    url: 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['cloud', 'kubernetes', 'container', 'docker', 'devops', 'sre'],
    url: 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['python', 'async', 'django', 'fastapi'],
    url: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['java', 'jvm', 'spring'],
    url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['algorithm', 'dsa', 'structure', 'tree', 'graph'],
    url: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['security', 'crypto', 'cryptography', 'pen', 'auth', 'hack'],
    url: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['rust', 'low-level', 'memory', 'c '],
    url: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['network', 'protocol', 'tcp', 'http', 'socket'],
    url: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['compiler', 'ast', 'lexer', 'parser'],
    url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['mobile', 'flutter', 'android', 'ios'],
    url: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=70',
  },
  {
    keywords: ['neural', 'ai', 'deep learning', 'machine learning'],
    url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=70',
  },
];

const DEFAULT_COVER = 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&auto=format&fit=crop&q=70';

/**
 * Returns a high-quality, relevant cover image URL for any course.
 */
export function getCourseCoverImage(course: CourseLike | null | undefined): string {
  if (!course) return DEFAULT_COVER;

  // 1. If course has an explicitly defined, valid HTTP thumbnail_url, use it
  if (course.thumbnail_url && course.thumbnail_url.startsWith('http')) {
    return course.thumbnail_url;
  }

  // 2. Check preset dictionary by slug
  if (course.slug && COURSE_COVER_PRESETS[course.slug]) {
    return COURSE_COVER_PRESETS[course.slug];
  }

  // 3. Match against title / slug keywords
  const searchStr = `${course.slug || ''} ${course.title || ''} ${course.domain || ''}`.toLowerCase();
  for (const entry of KEYWORD_FALLBACKS) {
    if (entry.keywords.some((kw) => searchStr.includes(kw))) {
      return entry.url;
    }
  }

  return DEFAULT_COVER;
}

