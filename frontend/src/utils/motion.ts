/**
 * Centralized motion tokens and transition configurations for Learnflow LMS.
 * 
 * Design Principles:
 * - 120ms hover interactions
 * - 200ms layout / state / accordion transitions
 * - 500ms max for path / ring stroke fills
 * - Standard ease-out curve [0, 0, 0.2, 1]
 * - Strictly respects prefers-reduced-motion
 */

export const motionTokens = {
  duration: {
    hover: 0.12,   // 120ms
    state: 0.2,    // 200ms
    fill: 0.5,     // 500ms
  },
  ease: [0, 0, 0.2, 1] as const,
  transition: {
    hover: { duration: 0.12, ease: [0, 0, 0.2, 1] },
    state: { duration: 0.2, ease: [0, 0, 0.2, 1] },
    fill: { duration: 0.5, ease: [0, 0, 0.2, 1] },
  },
};

export const accordionVariants = {
  collapsed: {
    opacity: 0,
    height: 0,
    overflow: 'hidden',
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },
  expanded: {
    opacity: 1,
    height: 'auto',
    overflow: 'visible',
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },
};

export const fadeVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2, ease: [0, 0, 0.2, 1] },
  },
};

