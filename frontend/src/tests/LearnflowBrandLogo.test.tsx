import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { LearnflowBrandLogo } from '../components/common/LearnflowBrandLogo';

describe('LearnflowBrandLogo', () => {
  it('renders light mode and dark mode official image logos', () => {
    const { container } = render(<LearnflowBrandLogo subtitle="Academic LMS Platform" />);

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);

    const lightImg = container.querySelector('img[src="/learnflow-logo-light.png"]');
    expect(lightImg).toBeTruthy();
    expect(lightImg?.getAttribute('alt')).toBe('Learnflow');

    const darkImg = container.querySelector('img[src="/learnflow-logo-dark.png"]');
    expect(darkImg).toBeTruthy();
    expect(darkImg?.getAttribute('alt')).toBe('Learnflow');

    const text = container.textContent;
    expect(text).toContain('Academic LMS Platform');
    expect(text).toContain('LMS');
  });
});
