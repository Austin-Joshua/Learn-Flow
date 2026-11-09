import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { LearnflowBrandLogo } from '../components/common/LearnflowBrandLogo';

describe('LearnflowBrandLogo', () => {
  it('renders light mode image logo and dark mode vector crest', () => {
    const { container } = render(<LearnflowBrandLogo subtitle="Academic LMS Platform" />);

    const img = container.querySelector('img');
    expect(img).toBeTruthy();
    expect(img?.getAttribute('src')).toBe('/learnflow-logo-light.png');
    expect(img?.getAttribute('alt')).toBe('Learnflow');

    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();

    const text = container.textContent;
    expect(text).toContain('Academic LMS Platform');
    expect(text).toContain('LMS');
  });
});

