import React, { useEffect, useState } from 'react';

export interface ProgressRingProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  label?: string;
  showValue?: boolean;
  subtext?: string;
  className?: string;
}

export const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 80,
  strokeWidth,
  label,
  showValue = true,
  subtext,
  className = '',
}) => {
  const [displayedValue, setDisplayedValue] = useState<number>(0);

  // Default stroke width proportional to size
  const stroke = strokeWidth || Math.max(3, Math.round(size / 11));
  const radius = (size - stroke) / 2;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;

  const clampedValue = Math.min(100, Math.max(0, value));

  useEffect(() => {
    // Animate smoothly on mount and when value changes
    const timer = setTimeout(() => {
      setDisplayedValue(clampedValue);
    }, 20);
    return () => clearTimeout(timer);
  }, [clampedValue]);

  const offset = circumference - (displayedValue / 100) * circumference;
  const roundedPercent = Math.round(clampedValue);

  // Font sizing relative to ring diameter
  const fontSize = Math.max(10, Math.round(size * 0.24));
  const subtextSize = Math.max(8, Math.round(size * 0.11));

  return (
    <div
      className={`inline-flex flex-col items-center justify-center relative ${className}`}
      role="progressbar"
      aria-valuenow={roundedPercent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `${roundedPercent}% complete`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90 select-none"
      >
        {/* Track circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          className="text-slate-200 dark:text-slate-800"
        />

        {/* Progress indicator circle */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="text-sky-600 dark:text-sky-400 motion-safe:transition-[stroke-dashoffset] motion-safe:duration-500 motion-safe:ease-out"
        />
      </svg>

      {/* Centered Content */}
      {showValue && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center select-none pointer-events-none"
          style={{ width: size, height: size }}
        >
          <span
            className="font-bold text-slate-900 dark:text-white tabular-nums tracking-tight leading-none"
            style={{ fontSize: `${fontSize}px` }}
          >
            {roundedPercent}%
          </span>
          {subtext && size >= 70 && (
            <span
              className="font-mono text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-wider leading-none"
              style={{ fontSize: `${subtextSize}px` }}
            >
              {subtext}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

