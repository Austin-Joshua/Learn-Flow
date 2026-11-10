import React from 'react';
import { User } from '../../types';

export interface UserAvatarProps {
  user?: User | null;
  gender?: 'female' | 'male' | 'auto';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | number;
  className?: string;
  showStatus?: boolean;
  statusColor?: string;
  alt?: string;
}

const FEMALE_NAMES = new Set([
  'ada', 'grace', 'marie', 'curie', 'sarah', 'jane', 'emily', 'anna', 'alice',
  'sophia', 'emma', 'olivia', 'mia', 'clara', 'katherine', 'margaret', 'rosalind',
  'barbara', 'elizabeth', 'lovelace', 'hopper', 'mary', 'rachel', 'jennifer', 'laura'
]);

export const resolveAvatarGender = (user?: User | null, overrideGender?: 'female' | 'male' | 'auto'): 'female' | 'male' => {
  if (overrideGender && overrideGender !== 'auto') {
    return overrideGender;
  }

  // Check user object directly (synced from backend database column)
  if (user?.avatar_gender && (user.avatar_gender === 'female' || user.avatar_gender === 'male')) {
    return user.avatar_gender;
  }

  // Check localStorage preferences
  if (typeof window !== 'undefined') {
    try {
      const prefs = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
      if (prefs.gender === 'female' || prefs.gender === 'male') {
        return prefs.gender;
      }
      if (prefs.avatarGender === 'female' || prefs.avatarGender === 'male') {
        return prefs.avatarGender;
      }
    } catch {
      // ignore JSON parse error
    }
  }

  if (!user) return 'female'; // Default to female learner (Ada Lovelace)

  const firstName = (user.first_name || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();
  const fullName = (user.full_name || '').toLowerCase().trim();

  // Explicit check for default Learnflow personas
  if (email.includes('learner') || firstName.includes('ada') || fullName.includes('lovelace')) {
    return 'female';
  }
  if (email.includes('hod') || firstName.includes('grace') || fullName.includes('hopper')) {
    return 'female';
  }
  if (email.includes('instructor') || firstName.includes('linus') || fullName.includes('torvalds')) {
    return 'male';
  }
  if (email.includes('admin') || firstName.includes('alan') || fullName.includes('turing')) {
    return 'male';
  }

  // Check common female name set
  if (FEMALE_NAMES.has(firstName)) {
    return 'female';
  }

  // Default to female for student/learner, male otherwise
  return 'female';
};

const SIZE_MAP: Record<string, { px: number; statusSize: number }> = {
  xs: { px: 24, statusSize: 6 },
  sm: { px: 32, statusSize: 8 },
  md: { px: 40, statusSize: 10 },
  lg: { px: 48, statusSize: 12 },
  xl: { px: 64, statusSize: 14 },
  '2xl': { px: 80, statusSize: 16 },
};

/**
 * Female Scholar / Ada Lovelace Personalized Vector Avatar
 */
const FemaleScholarGraphic: React.FC<{ sizePx: number }> = ({ sizePx }) => (
  <svg
    viewBox="0 0 100 100"
    width={sizePx}
    height={sizePx}
    className="rounded-full shadow-inner select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="lf-female-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="50%" stopColor="#2563eb" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="lf-female-hair" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1c1917" />
        <stop offset="60%" stopColor="#292524" />
        <stop offset="100%" stopColor="#44403c" />
      </linearGradient>
      <linearGradient id="lf-female-skin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
      <linearGradient id="lf-female-jacket" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>

    {/* Backdrop circular canvas */}
    <rect width="100" height="100" rx="50" fill="url(#lf-female-bg)" />

    {/* Subtle celestial / scholarly halo */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255, 255, 255, 0.18)" strokeWidth="1.5" />

    {/* Back hair bun / volume */}
    <ellipse cx="50" cy="36" rx="28" ry="24" fill="url(#lf-female-hair)" />
    <circle cx="50" cy="22" r="14" fill="url(#lf-female-hair)" />
    {/* Hair ribbon knot / accent */}
    <path d="M46 22 C43 19, 39 19, 41 23 C43 26, 47 24, 46 22 Z" fill="#38bdf8" />
    <path d="M54 22 C57 19, 61 19, 59 23 C57 26, 53 24, 54 22 Z" fill="#38bdf8" />

    {/* Neck */}
    <rect x="44" y="56" width="12" height="15" rx="3" fill="#fdba74" />

    {/* Torso & Academic Coat / Jacket */}
    <path
      d="M24 96 C24 78, 33 68, 50 68 C67 68, 76 78, 76 96 Z"
      fill="url(#lf-female-jacket)"
    />

    {/* Crisp White Academic Collar */}
    <path d="M42 68 L50 82 L34 76 Z" fill="#ffffff" />
    <path d="M58 68 L50 82 L66 76 Z" fill="#f8fafc" />

    {/* Collegiate Sapphire Brooch / Pendant */}
    <circle cx="50" cy="80" r="3.2" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />

    {/* Face Base */}
    <ellipse cx="50" cy="46" rx="19" ry="20" fill="url(#lf-female-skin)" />

    {/* Cheeks subtle blush */}
    <ellipse cx="38" cy="52" rx="4" ry="2" fill="#fb7185" opacity="0.45" />
    <ellipse cx="62" cy="52" rx="4" ry="2" fill="#fb7185" opacity="0.45" />

    {/* Front Hair / Side Part & Elegantly Framed Bangs */}
    <path
      d="M31 38 C35 28, 65 28, 69 38 C68 45, 66 52, 65 54 C63 48, 61 40, 50 40 C39 40, 37 48, 35 54 C34 52, 32 45, 31 38 Z"
      fill="url(#lf-female-hair)"
    />
    {/* Left hair wave */}
    <path d="M31 40 C34 46, 35 56, 33 60 C30 52, 30 46, 31 40 Z" fill="url(#lf-female-hair)" />
    {/* Right hair wave */}
    <path d="M69 40 C66 46, 65 56, 67 60 C70 52, 70 46, 69 40 Z" fill="url(#lf-female-hair)" />

    {/* Intelligent Scholarly Glasses (Refined Wireframe) */}
    <rect x="36" y="42" width="11" height="8" rx="3.5" fill="none" stroke="#0f172a" strokeWidth="1.2" />
    <rect x="53" y="42" width="11" height="8" rx="3.5" fill="none" stroke="#0f172a" strokeWidth="1.2" />
    <path d="M47 45 L53 45" fill="none" stroke="#0f172a" strokeWidth="1.2" />

    {/* Eyes behind lenses */}
    <circle cx="41.5" cy="45.5" r="1.8" fill="#1c1917" />
    <circle cx="58.5" cy="45.5" r="1.8" fill="#1c1917" />
    <circle cx="42.2" cy="44.8" r="0.6" fill="#ffffff" />
    <circle cx="59.2" cy="44.8" r="0.6" fill="#ffffff" />

    {/* Eyebrows */}
    <path d="M36 39.5 Q41.5 38 46 39.5" fill="none" stroke="#292524" strokeWidth="1.2" strokeLinecap="round" />
    <path d="M54 39.5 Q58.5 38 64 39.5" fill="none" stroke="#292524" strokeWidth="1.2" strokeLinecap="round" />

    {/* Nose and Smile */}
    <path d="M50 48 L49.2 52.5 L51 52.5" fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
    <path d="M46 56 Q50 59 54 56" fill="none" stroke="#be123c" strokeWidth="1.2" strokeLinecap="round" />

    {/* Pearl Stud Earring */}
    <circle cx="31.5" cy="51" r="1.4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />
    <circle cx="68.5" cy="51" r="1.4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.4" />
  </svg>
);

/**
 * Male Scholar / Alan Turing / Linus Torvalds Personalized Vector Avatar
 */
const MaleScholarGraphic: React.FC<{ sizePx: number }> = ({ sizePx }) => (
  <svg
    viewBox="0 0 100 100"
    width={sizePx}
    height={sizePx}
    className="rounded-full shadow-inner select-none pointer-events-none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <linearGradient id="lf-male-bg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="50%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#0284c7" />
      </linearGradient>
      <linearGradient id="lf-male-hair" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="100%" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="lf-male-skin" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fed7aa" />
        <stop offset="100%" stopColor="#fcd34d" />
      </linearGradient>
      <linearGradient id="lf-male-suit" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#1e293b" />
      </linearGradient>
    </defs>

    {/* Backdrop circular canvas */}
    <rect width="100" height="100" rx="50" fill="url(#lf-male-bg)" />

    {/* Outer orbit boundary */}
    <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255, 255, 255, 0.16)" strokeWidth="1.5" />

    {/* Neck */}
    <rect x="43" y="55" width="14" height="16" rx="3" fill="#fdba74" />

    {/* Collegiate Suit & Shoulder Silhouette */}
    <path
      d="M22 96 C22 76, 32 66, 50 66 C68 66, 78 76, 78 96 Z"
      fill="url(#lf-male-suit)"
    />

    {/* White Collared Shirt */}
    <path d="M43 66 L50 80 L36 74 Z" fill="#ffffff" />
    <path d="M57 66 L50 80 L64 74 Z" fill="#f8fafc" />

    {/* Academic Azure Necktie */}
    <path d="M48 76 L52 76 L53.5 96 L46.5 96 Z" fill="#0284c7" />
    <polygon points="48,76 52,76 53,79 47,79" fill="#0369a1" />

    {/* Face Base */}
    <ellipse cx="50" cy="46" rx="19.5" ry="21" fill="url(#lf-male-skin)" />

    {/* Ears */}
    <ellipse cx="30" cy="47" rx="3" ry="5.5" fill="#fdb86b" />
    <ellipse cx="70" cy="47" rx="3" ry="5.5" fill="#fdb86b" />

    {/* Modern Scholar Side-Part Hair */}
    <path
      d="M30 40 C30 26, 68 22, 70 38 C70 42, 68 47, 68 47 C66 40, 64 36, 50 35 C38 35, 34 38, 30 40 Z"
      fill="url(#lf-male-hair)"
    />
    <path
      d="M30 40 C34 32, 45 30, 52 30 C62 30, 70 34, 71 42 C68 37, 62 34, 53 34 C44 34, 34 37, 30 40 Z"
      fill="#475569"
    />

    {/* Academic Glasses */}
    <rect x="36" y="42" width="11" height="8.5" rx="2.5" fill="none" stroke="#0f172a" strokeWidth="1.2" />
    <rect x="53" y="42" width="11" height="8.5" rx="2.5" fill="none" stroke="#0f172a" strokeWidth="1.2" />
    <path d="M47 45.5 L53 45.5" fill="none" stroke="#0f172a" strokeWidth="1.2" />

    {/* Eyes */}
    <circle cx="41.5" cy="46" r="1.8" fill="#0f172a" />
    <circle cx="58.5" cy="46" r="1.8" fill="#0f172a" />
    <circle cx="42.2" cy="45.2" r="0.6" fill="#ffffff" />
    <circle cx="59.2" cy="45.2" r="0.6" fill="#ffffff" />

    {/* Structured Eyebrows */}
    <path d="M35 39.5 L46 39.5" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M54 39.5 L65 39.5" stroke="#1e293b" strokeWidth="1.5" strokeLinecap="round" />

    {/* Nose and Confident Smile */}
    <path d="M50 48 L49.5 53 L51.5 53" fill="none" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />
    <path d="M45.5 57 Q50 59.5 54.5 57" fill="none" stroke="#991b1b" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  gender,
  size = 'md',
  className = '',
  showStatus = true,
  statusColor = '#10b981', // emerald-500
  alt,
}) => {
  const [tick, setTick] = React.useState(0);
  const [imgError, setImgError] = React.useState(false);

  React.useEffect(() => {
    const handleSync = () => {
      setImgError(false);
      setTick((t) => t + 1);
    };
    window.addEventListener('learnflow_user_updated', handleSync);
    return () => window.removeEventListener('learnflow_user_updated', handleSync);
  }, []);

  const sizeConfig = typeof size === 'number'
    ? { px: size, statusSize: Math.max(6, Math.round(size * 0.22)) }
    : SIZE_MAP[size] || SIZE_MAP.md;

  const resolvedGender = resolveAvatarGender(user, gender);
  const fullName = user?.full_name || (user?.first_name ? `${user.first_name} ${user.last_name || ''}` : 'Scholar');
  const avatarAlt = alt || `${fullName} Avatar (${resolvedGender})`;

  // Custom photo uploaded by the user
  const customAvatarUrl = React.useMemo(() => {
    if (user?.avatar_url) return user.avatar_url;
    if (typeof window !== 'undefined') {
      try {
        const prefs = JSON.parse(localStorage.getItem('learnflow_user_preferences') || '{}');
        return prefs.avatarUrl || null;
      } catch {
        return null;
      }
    }
    return null;
  }, [user, tick]);

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 rounded-full transition-transform duration-200 overflow-hidden ${className}`}
      style={{ width: sizeConfig.px, height: sizeConfig.px }}
      title={fullName}
      aria-label={avatarAlt}
    >
      {/* Custom Uploaded Photo or Graphical Scholar Avatar */}
      {customAvatarUrl && !imgError ? (
        <img
          src={customAvatarUrl}
          alt={avatarAlt}
          onError={() => setImgError(true)}
          className="w-full h-full object-cover rounded-full select-none"
        />
      ) : resolvedGender === 'female' ? (
        <FemaleScholarGraphic sizePx={sizeConfig.px} />
      ) : (
        <MaleScholarGraphic sizePx={sizeConfig.px} />
      )}

      {/* Online / Active Telemetry Status Dot */}
      {showStatus && (
        <span
          className="absolute bottom-0 right-0 rounded-full ring-2 ring-white dark:ring-[#06080c] shadow-xs z-10"
          style={{
            width: sizeConfig.statusSize,
            height: sizeConfig.statusSize,
            backgroundColor: statusColor,
          }}
          title="Active & Verified"
        />
      )}
    </div>
  );
};

export default UserAvatar;

