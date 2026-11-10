/**
 * Course Cover Image Mapping & Resolution Utility
 * Provides thematic imagery for computing courses. Cover images are external
 * (Unsplash) and optional. If network is unavailable or an external image fails
 * to load, a local flat initials tile (solid background, no gradient) is displayed automatically.
 */

export interface CourseLike {
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

  // 50 Expanded New Courses Presets
  'nextjs-server-components-edge': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=70',
  'vue3-enterprise-architecture': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=70',
  'webassembly-browser-runtimes': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=70',
  'micro-frontend-module-federation': 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=70',
  'modern-css-design-systems': 'https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?w=800&auto=format&fit=crop&q=70',
  'fullstack-graphql-federation': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=70',
  'apache-kafka-event-streaming': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=70',
  'redis-internals-distributed-caching': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=70',
  'distributed-consensus-raft-paxos': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=70',
  'grpc-protobuf-microservices': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=70',
  'cassandra-wide-column-storage': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=70',
  'domain-driven-design-event-sourcing': 'https://images.unsplash.com/photo-1516116211227-bbc03a2901db?w=800&auto=format&fit=crop&q=70',
  'high-throughput-queues-rabbitmq': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=70',
  'kubernetes-production-operators': 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800&auto=format&fit=crop&q=70',
  'terraform-multicloud-iac': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=70',
  'distributed-observability-opentelemetry': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=70',
  'service-mesh-istio-envoy': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?w=800&auto=format&fit=crop&q=70',
  'linux-ebpf-packet-filtering': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=70',
  'aws-solutions-architecture-zero-trust': 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=70',
  'cicd-gitops-argocd-actions': 'https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?w=800&auto=format&fit=crop&q=70',
  'large-language-models-transformers': 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=800&auto=format&fit=crop&q=70',
  'rag-vector-databases-pipeline': 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=800&auto=format&fit=crop&q=70',
  'production-mlops-feature-stores': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=70',
  'computer-vision-pytorch-cnn': 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?w=800&auto=format&fit=crop&q=70',
  'apache-spark-distributed-analytics': 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=70',
  'snowflake-modern-data-warehousing': 'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?w=800&auto=format&fit=crop&q=70',
  'reinforcement-learning-q-learning-ppo': 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=70',
  'databricks-lakehouse-delta-lake': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=70',
  'binary-exploitation-rop-chains': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=70',
  'reverse-engineering-ghidra-ida': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=70',
  'applied-cryptographic-engineering-ecc': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=70',
  'cloud-security-posture-iam-hardening': 'https://images.unsplash.com/photo-1563986768609-322da13575f3?w=800&auto=format&fit=crop&q=70',
  'network-penetration-testing-recon': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=800&auto=format&fit=crop&q=70',
  'ssdlc-threat-modeling-stride': 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800&auto=format&fit=crop&q=70',
  'ios-development-swift-swiftui': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=70',
  'android-native-kotlin-compose': 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=800&auto=format&fit=crop&q=70',
  'react-native-turbomodules-jsi': 'https://images.unsplash.com/photo-1551650975-87deedd944c3?w=800&auto=format&fit=crop&q=70',
  'crossplatform-cpp-mobile-engines': 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800&auto=format&fit=crop&q=70',
  'embedded-c-arm-cortex-m': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=70',
  'riscv-hardware-architecture': 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?w=800&auto=format&fit=crop&q=70',
  'freertos-kernel-scheduling': 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&auto=format&fit=crop&q=70',
  'linux-kernel-device-drivers': 'https://images.unsplash.com/photo-1629654297299-c8506221ca97?w=800&auto=format&fit=crop&q=70',
  'low-latency-systems-kernel-bypass': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=70',
  'embedded-rust-microcontrollers': 'https://images.unsplash.com/photo-1504639725590-34d0984388bd?w=800&auto=format&fit=crop&q=70',
  'discrete-mathematics-for-cs': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=70',
  'formal-methods-tla-plus': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=70',
  'abstract-algebra-cryptography': 'https://images.unsplash.com/photo-1509228468518-180dd4864904?w=800&auto=format&fit=crop&q=70',
  'virtualization-hypervisors-kvm': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=70',
  'database-query-optimizer-cost-models': 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800&auto=format&fit=crop&q=70',
  'quantum-computing-qiskit-circuits': 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=70',
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

/**
 * Derives a clean two-letter uppercase acronym from a course title.
 */
export function getCourseInitials(title?: string): string {
  if (!title) return 'CS';
  const words = title
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return 'CS';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/**
 * Generates a local SVG data URI fallback with a solid neutral background
 * (solid `#0f172a`, no gradient) and clean monospace initials.
 */
export function getCourseFallbackSvg(title?: string): string {
  const initials = getCourseInitials(title);
  const cleanTitle = (title || 'Course').replace(/[<>&"']/g, '');
  const displayTitle = cleanTitle.length > 28 ? `${cleanTitle.slice(0, 25)}...` : cleanTitle;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400"><rect width="100%" height="100%" fill="%230f172a"/><rect x="20" y="20" width="760" height="360" rx="12" fill="none" stroke="%231e293b" stroke-width="2"/><text x="50%" y="46%" dominant-baseline="middle" text-anchor="middle" fill="%23f1f5f9" font-family="ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace" font-size="64" font-weight="700" letter-spacing="4">${initials}</text><text x="50%" y="68%" dominant-baseline="middle" text-anchor="middle" fill="%2394a3b8" font-family="system-ui,-apple-system,sans-serif" font-size="18" font-weight="500">${displayTitle}</text></svg>`;

  return `data:image/svg+xml;utf8,${svg}`;
}

/**
 * Reusable image onError handler: replaces failed external Unsplash
 * image with the local solid initials fallback tile.
 */
export function handleCourseImageError(
  event: React.SyntheticEvent<HTMLImageElement>,
  title?: string
): void {
  const target = event.currentTarget;
  target.onerror = null;
  target.src = getCourseFallbackSvg(title || target.alt);
}

