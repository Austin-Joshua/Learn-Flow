import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import 'katex/dist/katex.min.css';
import {
  GraduationCap,
  TrendingUp,
  Compass,
  BookOpen,
  Award,
  CheckCircle,
  Copy,
  Check,
  ChevronRight,
  ExternalLink
} from 'lucide-react';

export interface ActionItem {
  label: string;
  path: string;
}

export interface ChatMessageData {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  suggested_actions?: ActionItem[];
  sources?: Array<{ title: string; course_title?: string; source_type: string; citation_ref: string }>;
  timestamp: string;
}

interface CopilotMessageContentProps {
  message: ChatMessageData;
  onNavigateAction?: (path: string) => void;
}

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

// Pre-process and normalize text so CommonMark always parses lists, headings, and formatting
const normalizeMessageContent = (text: string): string => {
  if (!text) return '';
  let cleaned = text.replace(/\r\n/g, '\n');

  // Ensure headings have blank lines around them and clean hashes
  cleaned = cleaned.replace(/(?:^|\n)(#{1,6})\s*([^\n]+)/g, (_match, hashes, title) => {
    const level = hashes.length <= 2 ? '##' : '###';
    return `\n\n${level} ${title.trim()}\n\n`;
  });

  // Ensure bullet points (-, *, •) have blank lines before them so they are recognized as lists
  cleaned = cleaned.replace(/([^\n])\n\s*[-*•]\s+/g, '$1\n\n- ');

  // Ensure numbered lists (1., 2.) have blank lines before them
  cleaned = cleaned.replace(/([^\n])\n\s*(\d+)\.\s+/g, '$1\n\n$2. ');

  return cleaned.trim();
};

const getNodeText = (node: React.ReactNode): string => {
  if (node === null || node === undefined || typeof node === 'boolean') return '';
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(getNodeText).join('');
  if (React.isValidElement(node) && (node.props as { children?: React.ReactNode })?.children) {
    return getNodeText((node.props as { children?: React.ReactNode }).children);
  }
  return '';
};

const CodeBlock: React.FC<{ language?: string; value: string }> = ({ language, value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard fallback
    }
  };

  return (
    <div className="my-2.5 rounded-xl border border-slate-700/80 bg-slate-950 text-slate-100 overflow-hidden shadow-xs">
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-[11px] font-mono text-slate-400 select-none">
        <span className="uppercase tracking-wider">{language || 'code'}</span>
        <button
          type="button"
          onClick={handleCopy}
          aria-label="Copy code to clipboard"
          className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] transition-colors cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3 whitespace-pre-wrap break-words overflow-x-hidden text-[11px] font-mono leading-relaxed text-slate-200">
        <code>{value}</code>
      </pre>
    </div>
  );
};

export const CopilotMessageContent: React.FC<CopilotMessageContentProps> = ({
  message,
  onNavigateAction
}) => {
  if (message.sender === 'user') {
    return <p className="whitespace-pre-wrap text-xs sm:text-[13px]">{message.text}</p>;
  }

  const normalizedContent = normalizeMessageContent(message.text);

  return (
    <div className="copilot-markdown space-y-2 text-xs sm:text-[13px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[[rehypeSanitize, sanitizeSchema], rehypeKatex]}
        components={{
          h1: ({ children }) => {
            const headingText = getNodeText(children).replace(/^[#\s]+/, '').trim();
            return (
              <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 pb-1 border-b border-slate-200 dark:border-white/10 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0082fb] shrink-0" />
                <span>{headingText}</span>
              </h2>
            );
          },
          h2: ({ children }) => {
            const headingText = getNodeText(children).replace(/^[#\s]+/, '').trim();
            return (
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2 pb-1 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-[#0082fb] shrink-0" />
                <span>{headingText}</span>
              </h3>
            );
          },
          h3: ({ children }) => {
            const headingText = getNodeText(children).replace(/^[#\s]+/, '').trim();
            const lower = headingText.toLowerCase();
            const isTrajectory = lower.includes('trajectory') || lower.includes('progress');
            const isRecommendation = lower.includes('recommend') || lower.includes('adaptive');
            const isArchitecture = lower.includes('architecture') || lower.includes('concurrency') || lower.includes('security');

            return (
              <h3 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-2 pb-1.5 border-b border-slate-200/80 dark:border-white/10 flex items-center gap-2">
                {isTrajectory ? (
                  <TrendingUp className="w-4 h-4 text-[#0082fb] shrink-0" />
                ) : isRecommendation ? (
                  <Compass className="w-4 h-4 text-purple-500 shrink-0" />
                ) : isArchitecture ? (
                  <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
                ) : (
                  <GraduationCap className="w-4 h-4 text-[#0082fb] shrink-0" />
                )}
                <span>{headingText}</span>
              </h3>
            );
          },
          h4: ({ children }) => {
            const headingText = getNodeText(children).replace(/^[#\s]+/, '').trim();
            return (
              <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5">
                {headingText}
              </h4>
            );
          },
          p: ({ children }) => {
            const rawText = getNodeText(children);

            // Verifiable Certificate Highlight Card
            const certMatch = rawText.match(/earned\s+(?:\*{1,2})?(\d+)(?:\*{1,2})?\s+verifiable\s+certificate/i);
            if (certMatch) {
              const count = certMatch[1];
              return (
                <div className="my-2.5 p-3 rounded-xl bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent border border-amber-500/30 flex items-center gap-3 text-amber-800 dark:text-amber-200 shadow-xs">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold">
                      {count} Verifiable Credential{count !== '1' ? 's' : ''} Earned
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Cryptographically verified on the HMAC-SHA256 academic ledger
                    </p>
                  </div>
                  {onNavigateAction && (
                    <button
                      type="button"
                      onClick={() => onNavigateAction('/my-certificates')}
                      className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 transition-colors cursor-pointer shrink-0"
                    >
                      View
                    </button>
                  )}
                </div>
              );
            }

            return (
              <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-200 mb-2 last:mb-0">
                {children}
              </p>
            );
          },
          ul: ({ children }) => (
            <ul className="space-y-1.5 my-2 list-none p-0">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="space-y-2 my-2 list-none p-0">
              {React.Children.map(children, (child, idx) => {
                if (!React.isValidElement(child)) return child;
                return React.cloneElement(child, { 'data-order-index': idx + 1 } as any);
              })}
            </ol>
          ),
          li: ({ children, ...props }: any) => {
            const orderIndex = props['data-order-index'];
            const text = getNodeText(children).trim();

            // Visual Progress Card Detection:
            // Matches: "- **Course Title**: 44.4% completed (In Progress)" or "Course: 50%"
            const progressMatch = text.match(/^(.*?):\s*([\d.]+)%(?:\s*completed)?(?:\s*\((.*?)\))?$/i);
            if (progressMatch) {
              const rawTitle = progressMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
              const pct = Math.min(100, Math.max(0, parseFloat(progressMatch[2])));
              const rawStatus = progressMatch[3] ? progressMatch[3].trim() : (pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Not Started');
              const isCompleted = rawStatus.toLowerCase().includes('completed') || pct >= 100;

              return (
                <li className="list-none my-1.5">
                  <div className="skeuo-card bg-slate-50/90 dark:bg-slate-900/90 p-2.5 rounded-xl border border-slate-200/80 dark:border-white/10 space-y-2 shadow-xs transition-all hover:border-[#0082fb]/40">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs text-slate-900 dark:text-white truncate">
                        {rawTitle}
                      </span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-semibold shrink-0 inline-flex items-center gap-1 ${
                        isCompleted 
                          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                          : pct > 0
                          ? 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30'
                          : 'bg-slate-200/60 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700'
                      }`}>
                        {isCompleted ? (
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                        ) : pct > 0 ? (
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse" />
                        ) : null}
                        <span>{rawStatus.replace(/^✓\s*/, '')}</span>
                      </span>
                    </div>

                    {/* Tactile Visual Progress Bar Track */}
                    <div className="flex items-center gap-2.5">
                      <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden shadow-inner relative">
                        <div 
                          style={{ width: `${pct}%` }}
                          className={`h-full rounded-full transition-all duration-700 ease-out ${
                            isCompleted 
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                              : 'bg-gradient-to-r from-sky-500 to-[#0082fb]'
                          }`}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 w-11 text-right shrink-0">
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </li>
              );
            }

            // Key-Value Metric Item Detection (e.g. "**Active User Accounts**: 5")
            const metricMatch = text.match(/^(.*?):\s*(\d+)$/);
            if (metricMatch && !text.includes('\n')) {
              const label = metricMatch[1].replace(/^\*\*|\*\*$/g, '').trim();
              const val = metricMatch[2];
              return (
                <li className="list-none my-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200/70 dark:border-white/5 text-xs">
                    <span className="text-slate-600 dark:text-slate-400 font-medium">{label}</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white px-2 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800">
                      {val}
                    </span>
                  </div>
                </li>
              );
            }

            // Numbered List Item with stylish badge
            if (orderIndex !== undefined) {
              return (
                <li className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2.5 my-1.5 leading-relaxed">
                  <span className="w-5 h-5 rounded-full bg-[#0082fb]/15 text-[#0082fb] dark:text-[#3aa0ff] font-bold text-[10px] font-mono flex items-center justify-center shrink-0 border border-[#0082fb]/30 mt-0.5 shadow-2xs">
                    {orderIndex}
                  </span>
                  <div className="flex-1 min-w-0">{children}</div>
                </li>
              );
            }

            // Standard Bullet Item with elegant gradient pip (No raw hyphens)
            return (
              <li className="text-xs text-slate-700 dark:text-slate-200 flex items-start gap-2 my-1 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-gradient-to-tr from-[#0082fb] to-cyan-400 mt-1.5 shrink-0 shadow-xs" />
                <div className="flex-1 min-w-0">{children}</div>
              </li>
            );
          },
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900 dark:text-white bg-sky-500/10 dark:bg-sky-400/15 text-sky-950 dark:text-sky-100 px-1 py-0.5 rounded border border-sky-500/20 tracking-tight inline-block my-0.2">
              {children}
            </strong>
          ),
          code: ({ inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            if (!inline && match) {
              return (
                <CodeBlock language={match[1]} value={String(children).replace(/\n$/, '')} />
              );
            }
            return (
              <code
                className="bg-slate-100 dark:bg-slate-800 text-sky-600 dark:text-sky-300 px-1.5 py-0.5 rounded font-mono text-[11px] border border-slate-200 dark:border-slate-700/60 break-all"
                {...props}
              >
                {children}
              </code>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="my-2 border-l-2 border-[#0082fb] bg-sky-50/40 dark:bg-sky-950/20 pl-3 py-1.5 rounded-r-lg text-xs italic text-slate-700 dark:text-slate-300">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-2.5 w-full overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
              <table className="w-full table-fixed text-[11px] text-left text-slate-700 dark:text-slate-300">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-slate-100 dark:bg-slate-900/90 px-2.5 py-1.5 font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-2.5 py-1.5 border-b border-slate-100 dark:border-slate-800/60 truncate">
              {children}
            </td>
          ),
        }}
      >
        {normalizedContent}
      </ReactMarkdown>

      {/* Visual Action Shortcut Pills */}
      {message.suggested_actions && message.suggested_actions.length > 0 && (
        <div className="mt-3 pt-2.5 border-t border-slate-200/70 dark:border-white/10 flex flex-wrap gap-1.5">
          {message.suggested_actions.map((act, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onNavigateAction?.(act.path)}
              className="skeuo-button-secondary inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-sky-700 dark:text-sky-300 hover:text-sky-800 dark:hover:text-sky-200 transition-colors cursor-pointer shadow-xs"
            >
              <span>{act.label}</span>
              <ChevronRight className="w-3 h-3 text-sky-500 shrink-0" />
            </button>
          ))}
        </div>
      )}

      {/* Verified Sources / References */}
      {message.sources && message.sources.length > 0 && (
        <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 flex-wrap text-[10px] text-slate-400 font-mono">
          <span className="font-semibold text-slate-500">Verified Sources:</span>
          {message.sources.map((s, idx) => (
            <span
              key={idx}
              className="bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 inline-flex items-center gap-1"
            >
              <BookOpen className="w-2.5 h-2.5 text-sky-500" />
              <span>{s.title}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
