import '@testing-library/jest-dom/vitest';

// Polyfill window.HTMLElement.prototype.scrollIntoView for JSDOM
if (typeof window !== 'undefined' && window.HTMLElement) {
  window.HTMLElement.prototype.scrollIntoView = () => {};
}


