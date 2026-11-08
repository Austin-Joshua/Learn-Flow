import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import { Copy, Check } from 'lucide-react';

interface LessonContentProps {
  markdown: string;
}

// Extend sanitize schema to safely allow KaTeX classes and MathML tags while neutralizing XSS vectors
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    '*': [...(defaultSchema.attributes?.['*'] || []), 'className', 'style'],
    span: [...(defaultSchema.attributes?.span || []), 'className', 'style', 'ariaHidden'],
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
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/80 text-[11px] font-mono text-slate-400 select-none">
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
      <pre className="p-4 overflow-x-auto text-xs sm:text-sm font-mono leading-relaxed text-slate-200">
        <code>{value}</code>
      </pre>
    </div>
  );
};

export const LessonContent: React.FC<LessonContentProps> = ({ markdown }) => {
  return (
    <div className="lesson-markdown prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-sans leading-relaxed">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema], rehypeKatex]}
        components={{
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
              <div className="my-6 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800 text-xs sm:text-sm" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th
                className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 text-left font-semibold text-slate-700 dark:text-slate-200 uppercase tracking-wider text-[11px] font-mono"
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
          p({ children, ...props }) {
            return (
              <p className="my-4 text-sm sm:text-base leading-relaxed text-slate-700 dark:text-slate-300" {...props}>
                {children}
              </p>
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
