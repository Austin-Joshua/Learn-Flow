import React from 'react';
import { LearnflowLogo } from './LearnflowLogo';

export interface LearnflowBrandLogoProps {
  className?: string;
  imgClassName?: string;
  badge?: string;
  subtitle?: string;
}

export const LearnflowBrandLogo: React.FC<LearnflowBrandLogoProps> = ({
  className = '',
  imgClassName = 'h-8 sm:h-9 w-auto object-contain',
  badge = 'LMS',
  subtitle,
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light Mode: Official Wordmark Logo Image */}
      <div className="flex items-center space-x-2 dark:hidden">
        <img
          src="/learnflow-logo-light.png"
          alt="Learnflow"
          className={imgClassName}
        />
        {badge && (
          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-300">
            {badge}
          </span>
        )}
      </div>

      {/* Dark Mode: High-Contrast Illuminated Crest & Typography */}
      <div className="hidden dark:flex items-center space-x-3">
        <div className="w-10 h-10 rounded-xl bg-[#0082fb]/20 border border-[#0082fb]/40 flex items-center justify-center text-[#3aa0ff] glow-blue shadow-inner group-hover:scale-105 transition-transform">
          <LearnflowLogo className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center space-x-1.5">
            <span className="text-base sm:text-lg font-bold tracking-tight text-[#f2f5f9]">
              Learnflow
            </span>
            {badge && (
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0082fb]/20 text-[#3aa0ff] border border-[#0082fb]/40">
                {badge}
              </span>
            )}
          </div>
          {subtitle && (
            <span className="text-[11px] font-mono text-slate-400">
              {subtitle}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default LearnflowBrandLogo;

