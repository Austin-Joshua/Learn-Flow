import React from 'react';
import { Quote, Sparkles } from 'lucide-react';

const TESTIMONIALS = [
  {
    quote: 'I shipped to a real product module in my first fortnight. Nothing here felt like busywork built to keep interns occupied.',
    author: 'Vijayalakshmi',
    role: 'Full Stack Development',
    cohort: 'Cohort 01',
  },
  {
    quote: 'The code review culture is the part I did not expect. Every PR came back with reasoning and invariant checks, not just approvals.',
    author: 'Sakthi S',
    role: 'Software Development',
    cohort: 'Cohort 01',
  },
  {
    quote: 'I came in knowing React and left understanding how a product actually gets decided, scoped, and released into high-load production.',
    author: 'Srinath L',
    role: 'Front End Development',
    cohort: 'Cohort 01',
  },
  {
    quote: 'Being handed ownership of the timed arena feature this early was daunting, and it is the reason I improved as fast as I did.',
    author: 'Selvi P',
    role: 'Backend Development',
    cohort: 'Cohort 02',
  },
  {
    quote: 'Working on the models behind a live product is nothing like a course project. The constraints and latency requirements are what taught me.',
    author: 'Jayashri',
    role: 'AI & Machine Learning',
    cohort: 'Cohort 03',
  },
  {
    quote: 'Weekly demos meant my work was visible to the whole company. It kept the standard high and the feedback loop immediate.',
    author: 'Hari Haran',
    role: 'Full Stack Development',
    cohort: 'Cohort 02',
  },
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-b border-white/10">
      <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
        <span className="text-label font-mono uppercase tracking-widest text-[#0082fb] bg-[#0082fb]/10 px-3 py-1 rounded-full border border-[#0082fb]/20">
          Impact · Student &amp; Intern Voice
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold text-[#f2f5f9] tracking-tight">
          What our engineers &amp; interns say.
        </h2>
        <p className="text-sm sm:text-base text-[#8a94a6] leading-relaxed">
          Reviews from the developers, learners, and interns who built alongside us in production.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, idx) => (
          <div
            key={idx}
            className="p-6 rounded-2xl bg-[#06080c] border border-white/5 hover:border-[#0082fb]/30 transition-all duration-300 flex flex-col justify-between"
          >
            <div className="space-y-4">
              <Quote className="w-5 h-5 text-[#3aa0ff] opacity-40" />
              <p className="text-xs sm:text-sm text-[#f2f5f9] leading-relaxed italic">
                &ldquo;{t.quote}&rdquo;
              </p>
            </div>

            <div className="pt-6 mt-6 border-t border-white/5 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-[#f2f5f9] block">{t.author}</span>
                <span className="text-label font-mono text-[#8a94a6]">{t.role}</span>
              </div>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-[#0082fb]/10 text-[#3aa0ff] border border-[#0082fb]/20">
                {t.cohort}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

