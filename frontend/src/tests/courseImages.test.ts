import { describe, it, expect } from 'vitest';
import {
  getCourseCoverImage,
  getCourseInitials,
  getCourseFallbackSvg,
  handleCourseImageError,
} from '../utils/courseImages';

describe('courseImages Utility & Fallback System', () => {
  it('extracts two-letter initials cleanly from single- and multi-word titles', () => {
    expect(getCourseInitials('Distributed Systems & Architecture')).toBe('DS');
    expect(getCourseInitials('Advanced React Patterns')).toBe('AR');
    expect(getCourseInitials('Algorithms')).toBe('AL');
    expect(getCourseInitials('')).toBe('CS');
  });

  it('generates a solid, local SVG data URI fallback without gradients', () => {
    const uri = getCourseFallbackSvg('Database Systems');
    expect(uri.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(uri).toContain('fill="%230f172a"'); // Solid dark slate background
    expect(uri).not.toContain('linearGradient'); // Strictly no gradient
    expect(uri).not.toContain('radialGradient'); // Strictly no gradient
    expect(uri).toContain('DS'); // Initials
  });

  it('replaces broken image source with solid fallback on load error', () => {
    const img = document.createElement('img');
    img.src = 'https://images.unsplash.com/non-existent-broken-image.jpg';
    img.alt = 'Compilers & Synthesizers';

    const mockEvent = {
      currentTarget: img,
    } as unknown as React.SyntheticEvent<HTMLImageElement>;

    handleCourseImageError(mockEvent, 'Compilers & Synthesizers');

    expect(img.src.startsWith('data:image/svg+xml;utf8,')).toBe(true);
    expect(img.src).toContain('CS');
    expect(img.onerror).toBeNull();
  });

  it('resolves preset Unsplash URLs when online, keeping cover images optional and external', () => {
    const url = getCourseCoverImage({ slug: 'c-programming-systems' });
    expect(url).toContain('images.unsplash.com');
  });
});
