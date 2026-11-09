import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import { LearnflowLogo } from '../components/common/LearnflowLogo';

describe('LearnflowLogo', () => {
  it('renders SVG with progression milestone geometry', () => {
    const { container } = render(<LearnflowLogo className="w-6 h-6 text-blue-500" />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    expect(svg?.getAttribute('viewBox')).toBe('0 0 196 124');
    expect(svg?.getAttribute('aria-hidden')).toBe('true');
    expect(svg?.classList.contains('w-6')).toBe(true);
    expect(svg?.classList.contains('h-6')).toBe(true);

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);

    const line = container.querySelector('line');
    expect(line).toBeTruthy();
    expect(line?.getAttribute('x1')).toBe('27.5');
    expect(line?.getAttribute('y1')).toBe('95.5');
    expect(line?.getAttribute('x2')).toBe('167.5');
    expect(line?.getAttribute('y2')).toBe('23.5');
  });

  it('supports explicit size prop', () => {
    const { container } = render(<LearnflowLogo size={32} />);
    const svg = container.querySelector('svg');
    expect(svg?.getAttribute('width')).toBe('32');
    expect(svg?.getAttribute('height')).toBe('32');
  });
});

