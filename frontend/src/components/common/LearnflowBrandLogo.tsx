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
  badge = 'LMS',
  subtitle,
}) => {
  return (
    <div className={`flex items-center ${className}`}>
      {/* Light Mode: Official Black Wordmark Logo Image */}
      <div className="flex flex-col dark:hidden">
        <div className="flex items-center space-x-2">
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
        {subtitle && (
          <span className="text-[11px] font-mono text-slate-600 pl-0.5">
            {subtitle}
          </span>
        )}
      </div>

      {/* Dark Mode: Official White Wordmark Logo Image */}
      <div className="hidden dark:flex flex-col">
        <div className="flex items-center space-x-2">
          <img
            src="/learnflow-logo-dark.png"
            alt="Learnflow"
            className={imgClassName}
          />
          {badge && (
            <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0082fb]/20 text-[#3aa0ff] border border-[#0082fb]/40">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <span className="text-[11px] font-mono text-slate-400 pl-0.5">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
};

export default LearnflowBrandLogo;
