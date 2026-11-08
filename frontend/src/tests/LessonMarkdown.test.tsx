import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LessonContent } from '../components/curriculum/LessonContent';

describe('LessonContent Markdown & Math Renderer', () => {
  it('renders standard markdown elements correctly', () => {
    const markdown = `
# Main Heading
This is a **bold** and *italic* text.

- Item 1
- Item 2

> Important note blockquote
`;
    render(<LessonContent markdown={markdown} />);
    expect(screen.getByText('Main Heading')).toBeInTheDocument();
    expect(screen.getByText('bold')).toBeInTheDocument();
    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Important note blockquote')).toBeInTheDocument();
  });

  it('renders tables properly with styled headers', () => {
    const markdown = `
| Index Type | Time Complexity | Use Case |
| :--- | :--- | :--- |
| B-Tree | O(log N) | Equality & Range |
| Hash | O(1) | Equality only |
`;
    render(<LessonContent markdown={markdown} />);
    expect(screen.getByText('Index Type')).toBeInTheDocument();
    expect(screen.getByText('B-Tree')).toBeInTheDocument();
    expect(screen.getByText('O(log N)')).toBeInTheDocument();
  });

  it('renders code blocks with language and copy button', () => {
    const markdown = `
\`\`\`sql
SELECT * FROM users WHERE tenant_id = 42;
\`\`\`
`;
    render(<LessonContent markdown={markdown} />);
    expect(screen.getByText(/sql/i)).toBeInTheDocument();
    expect(screen.getByText(/SELECT \* FROM users/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /copy code to clipboard/i })).toBeInTheDocument();
  });

  it('renders inline math notation using KaTeX', () => {
    const markdown = 'The balance depth is $O(\\log N)$ in a balanced B-Tree.';
    const { container } = render(<LessonContent markdown={markdown} />);
    // KaTeX outputs math span or mathml elements
    expect(container.querySelector('.katex') || container.querySelector('math')).not.toBeNull();
  });

  it('neutralizes malicious XSS vectors and script injection', () => {
    const maliciousMarkdown = `
# Safe Heading

<script>window.__pwned = true;</script>

Safe normal text paragraph.

[Malicious Link](javascript:alert('xss'))
`;
    const { container } = render(<LessonContent markdown={maliciousMarkdown} />);

    // Script tag must be stripped / never executed
    expect(container.querySelector('script')).toBeNull();

    // Javascript: protocol in links must be stripped
    const link = container.querySelector('a');
    if (link) {
      const href = link.getAttribute('href');
      expect(href === null || !href.toLowerCase().startsWith('javascript:')).toBe(true);
    }

    expect(screen.getByText('Safe Heading')).toBeInTheDocument();
    expect(screen.getByText(/Safe normal text paragraph/i)).toBeInTheDocument();
  });
});
