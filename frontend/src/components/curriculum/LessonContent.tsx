import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { Copy, Check } from 'lucide-react';

export interface LessonHighlight {
  id: string;
  text: string;
  color: 'yellow' | 'green' | 'blue' | 'pink';
}

interface LessonContentProps {
  markdown: string;
  highlights?: LessonHighlight[];
  onRemoveHighlight?: (id: string) => void;
}

// Extend sanitize schema to safely allow KaTeX classes and MathML tags while neutralizing XSS vectors
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'style', 'ariaHidden'],
    mark: ['className', 'style', 'data-highlight-id'],
    annotation: ['encoding'],
  },
  tagNames: [
    ...(defaultSchema.tagNames || []),
    'math',
    'semantics',
    'mrow',
    'mi',
    'mo',
    'mn',
    'msup',
    'msub',
    'msubsup',
    'mfrac',
    'annotation',
    'span',
    'mark',
  ],
};

const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <div className="my-5 rounded-xl border border-slate-800 bg-slate-950 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 text-label font-mono text-slate-400 select-none">
        <span className="uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="inline-flex items-center space-x-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-4 whitespace-pre-wrap break-words overflow-x-hidden text-xs sm:text-sm font-mono leading-relaxed text-slate-200">
        <code>{value}</code>
      </pre>
    </div>
  );
};

const COLOR_STYLES: Record<string, string> = {
  yellow: 'bg-amber-200/80 dark:bg-amber-500/30 text-amber-950 dark:text-amber-100 border-amber-400',
  green: 'bg-emerald-200/80 dark:bg-emerald-500/30 text-emerald-950 dark:text-emerald-100 border-emerald-400',
  blue: 'bg-sky-200/80 dark:bg-sky-500/30 text-sky-950 dark:text-sky-100 border-sky-400',
  pink: 'bg-pink-200/80 dark:bg-pink-500/30 text-pink-950 dark:text-pink-100 border-pink-400',
};

const highlightTextNodes = (
  node: React.ReactNode,
  highlights: LessonHighlight[],
  onRemove?: (id: string) => void
): React.ReactNode => {
  if (!highlights || highlights.length === 0 || !node) return node;

  if (typeof node === 'string') {
    let parts: Array<{ text: string; highlight?: LessonHighlight }> = [{ text: node }];

    for (const h of highlights) {
      const cleanHText = h.text.trim();
      if (!cleanHText) continue;

      const newParts: Array<{ text: string; highlight?: LessonHighlight }> = [];
      for (const part of parts) {
        if (part.highlight) {
          newParts.push(part);
          continue;
        }

        const idx = part.text.toLowerCase().indexOf(cleanHText.toLowerCase());
        if (idx !== -1) {
          const before = part.text.slice(0, idx);
          const match = part.text.slice(idx, idx + cleanHText.length);
          const after = part.text.slice(idx + cleanHText.length);

          if (before) newParts.push({ text: before });
          newParts.push({ text: match, highlight: h });
          if (after) newParts.push({ text: after });
        } else {
          newParts.push(part);
        }
      }
      parts = newParts;
    }

    if (parts.length === 1 && !parts[0].highlight) {
      return node;
    }

    return (
      <>
        {parts.map((p, i) =>
          p.highlight ? (
            <mark
              key={i}
              onClick={() => onRemove?.(p.highlight!.id)}
              title="Click to remove highlight"
              className={`rounded px-1 py-0.5 border-b-2 cursor-pointer transition-all ${
                COLOR_STYLES[p.highlight.color] || COLOR_STYLES.yellow
              }`}
            >
              {p.text}
            </mark>
          ) : (
            p.text
          )
        )}
      </>
    );
  }

  if (React.isValidElement(node) && (node.props as { children?: React.ReactNode })?.children) {
    const children = (node.props as { children?: React.ReactNode }).children;
    return React.cloneElement(
      node as React.ReactElement<{ children?: React.ReactNode }>,
      {},
      React.Children.map(children, (child) => highlightTextNodes(child, highlights, onRemove))
    );
  }

  if (Array.isArray(node)) {
    return node.map((child, idx) => (
      <React.Fragment key={idx}>
        {highlightTextNodes(child, highlights, onRemove)}
      </React.Fragment>
    ));
  }

  return node;
};

export const LessonContent: React.FC<LessonContentProps> = ({
  markdown,
  highlights = [],
  onRemoveHighlight,
}) => {
  return (
    <div className="lesson-markdown prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema], rehypeKatex]}
        components={{
          p({ children, ...props }) {
            return (
              <p className="my-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300" {...props}>
                {highlightTextNodes(children, highlights, onRemoveHighlight)}
              </p>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="my-1.5" {...props}>
                {highlightTextNodes(children, highlights, onRemoveHighlight)}
              </li>
            );
          },
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '');
            const isInline = !match && !String(children).includes('\n');
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-sky-700 dark:text-sky-300 font-mono text-[0.875em] border border-slate-200 dark:border-slate-700"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <CodeBlock
                language={match ? match[1] : undefined}
                value={String(children).replace(/\n$/, '')}
              />
            );
          },
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith('http://') || href?.startsWith('https://');
            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className="text-sky-600 dark:text-sky-400 font-medium underline underline-offset-2 hover:text-sky-500 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          table({ children, ...props }) {
            return (
              <div className="my-6 w-full overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="w-full table-fixed divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-left font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-label font-mono"
                {...props}
              >
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="px-4 py-2.5 border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300" {...props}>
                {children}
              </td>
            );
          },
          h1({ children, ...props }) {
            return (
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-8 mb-4 tracking-tight" {...props}>
                {children}
              </h2>
            );
          },
          h2({ children, ...props }) {
            return (
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-6 mb-3 tracking-tight" {...props}>
                {children}
              </h3>
            );
          },
          h3({ children, ...props }) {
            return (
              <h4 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white mt-5 mb-2" {...props}>
                {children}
              </h4>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="my-4 ml-6 list-disc space-y-1.5 text-sm sm:text-base text-slate-700 dark:text-slate-300" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="my-4 ml-6 list-decimal space-y-1.5 text-sm sm:text-base text-slate-700 dark:text-slate-300" {...props}>
                {children}
              </ol>
            );
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="my-5 pl-4 border-l-4 border-sky-500 italic text-slate-600 dark:text-slate-400 bg-sky-50/50 dark:bg-sky-950/20 py-2 rounded-r-lg text-sm"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
};
