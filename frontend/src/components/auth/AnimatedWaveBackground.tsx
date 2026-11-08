import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedWaveBackgroundProps {
  isLightBrand?: boolean;
}

export const AnimatedWaveBackground: React.FC<AnimatedWaveBackgroundProps> = ({ isLightBrand = false }) => {
  return (
    <div
      className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0 transition-opacity"
      style={{ opacity: isLightBrand ? 0.4 : 0.25 }}
    >
      <svg
        viewBox="0 0 1440 320"
        className="absolute bottom-0 w-full h-auto"
        preserveAspectRatio="none"
      >
        <motion.path
          animate={{
            d: [
              'M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,149.3C672,149,768,203,864,218.7C960,235,1056,213,1152,186.7C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
              'M0,192L48,202.7C96,213,192,235,288,218.7C384,203,480,149,576,149.3C672,149,768,203,864,192C960,181,1056,107,1152,106.7C1248,107,1344,181,1392,218.7L1440,256L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
            ],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          fill={isLightBrand ? '#38bdf8' : '#ffffff'}
          fillOpacity={isLightBrand ? 0.35 : 0.2}
          style={{ transition: 'fill 0.3s ease' }}
        />
        <motion.path
          animate={{
            d: [
              'M0,224L48,213.3C96,203,192,181,288,181.3C384,181,480,203,576,213.3C672,224,768,224,864,213.3C960,203,1056,181,1152,160C1248,139,1344,117,1392,106.7L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
              'M0,160L48,176C96,192,192,224,288,202.7C384,181,480,107,576,101.3C672,96,768,160,864,197.3C960,235,1056,245,1152,229.3C1248,213,1344,171,1392,149.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z',
            ],
          }}
          transition={{
            duration: 16,
            repeat: Infinity,
            repeatType: 'mirror',
            ease: 'easeInOut',
          }}
          fill={isLightBrand ? '#0284c7' : '#ffffff'}
          fillOpacity={isLightBrand ? 0.2 : 0.1}
          style={{ transition: 'fill 0.3s ease' }}
        />
      </svg>
    </div>
  );
};
