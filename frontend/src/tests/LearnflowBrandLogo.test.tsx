import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { LearnflowBrandLogo } from '../components/common/LearnflowBrandLogo';

describe('LearnflowBrandLogo', () => {
  it('renders clean official image logos without badge or subtitle by default', () => {
    const { container } = render(<LearnflowBrandLogo />);

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);

    const lightImg = container.querySelector('img[src="/learnflow-logo-light.png"]');
    expect(lightImg).toBeTruthy();
    expect(lightImg?.getAttribute('alt')).toBe('Learnflow');

    const darkImg = container.querySelector('img[src="/learnflow-logo-dark.png"]');
    expect(darkImg).toBeTruthy();
    expect(darkImg?.getAttribute('alt')).toBe('Learnflow');

    expect(container.textContent).toBe('');
  });

  it('renders optional badge and subtitle when explicitly provided', () => {
    const { container } = render(
      <LearnflowBrandLogo badge="LMS" subtitle="Academic LMS Platform" />
    );
    expect(container.textContent).toContain('LMS');
    expect(container.textContent).toContain('Academic LMS Platform');
  });
});
