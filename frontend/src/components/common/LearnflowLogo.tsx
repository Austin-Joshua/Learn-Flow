import React from 'react';

export interface LearnflowLogoProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

export const LearnflowLogo: React.FC<LearnflowLogoProps> = ({
  size,
  className = '',
  ...props
}) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 196 124"
      fill="none"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
      {...props}
    >
      <line
        x1="27.5"
        y1="95.5"
        x2="167.5"
        y2="23.5"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
      />
      <circle
        cx="27.5"
        cy="95.5"
        r="19.5"
        stroke="currentColor"
        strokeWidth="9"
        fill="none"
      />
      <circle
        cx="97.5"
        cy="59.5"
        r="19.5"
        stroke="currentColor"
        strokeWidth="9"
        fill="none"
      />
      <circle
        cx="167.5"
        cy="23.5"
        r="20"
        fill="currentColor"
        stroke="none"
      />
    </svg>
  );
};

export default LearnflowLogo;

