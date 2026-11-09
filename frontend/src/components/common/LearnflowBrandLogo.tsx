import React from 'react';

export interface LearnflowBrandLogoProps {
  className?: string;
  imgClassName?: string;
  badge?: string;
  subtitle?: string;
}

export const LearnflowBrandLogo: React.FC<LearnflowBrandLogoProps> = ({
  className = '',
  imgClassName = 'h-8 sm:h-9 w-auto object-contain',
  badge,
  subtitle,
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light Mode: Official Black Wordmark Logo Image */}
      <img
        src="/learnflow-logo-light.png"
        alt="Learnflow"
        className={`${imgClassName} block dark:hidden`}
      />

      {/* Dark Mode: Official White Wordmark Logo Image */}
      <img
        src="/learnflow-logo-dark.png"
        alt="Learnflow"
        className={`${imgClassName} hidden dark:block`}
      />

      {badge && (
        <span className="ml-2 text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-sky-100 text-sky-700 border border-sky-300 dark:bg-[#0082fb]/20 dark:text-[#3aa0ff] dark:border-[#0082fb]/40">
          {badge}
        </span>
      )}
      {subtitle && (
        <span className="text-[11px] font-mono text-slate-600 dark:text-slate-400 pl-0.5">
          {subtitle}
        </span>
      )}
    </div>
  );
};

export default LearnflowBrandLogo;
