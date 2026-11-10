import React from 'react';
import { AvatarConfig, DEFAULT_AVATAR_CONFIG } from '../../types/avatar';

interface PersonalizedAvatarProps {
  config?: Partial<AvatarConfig> | null;
  size?: number | string;
  className?: string;
  showBackground?: boolean;
}

/**
 * High-Polish Modular SVG Avatar Engine
 * Renders an expressive, scalable, Snapchat Bitmoji-inspired academic avatar.
 */
export const PersonalizedAvatar: React.FC<PersonalizedAvatarProps> = ({
  config: partialConfig,
  size = 100,
  className = '',
  showBackground = true,
}) => {
  // Merge partial with defaults
  const cfg: AvatarConfig = {
    ...DEFAULT_AVATAR_CONFIG,
    ...(partialConfig || {}),
  };

  const skin = cfg.skinTone || '#fed7aa';
  const hair = cfg.hairColor || '#1c1917';
  const eyes = cfg.eyeColor || '#1e3a8a';
  const brows = cfg.eyebrowColor || hair;
  const beard = cfg.facialHairColor || hair;
  const clothes = cfg.clothingColor || '#0284c7';
  const glasses = cfg.glassesColor || '#0f172a';
  const lips = cfg.lipColor || '#be123c';

  // Unique deterministic gradient ID prefix to avoid SVG collision across multiple instances
  const gid = React.useId().replace(/:/g, '');

  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`select-none pointer-events-none rounded-full overflow-hidden ${className}`}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* --- Background Gradients --- */}
        <linearGradient id={`${gid}-bg-collegiate`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="60%" stopColor="#0284c7" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-sunset`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c0519" />
          <stop offset="50%" stopColor="#be123c" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-nebula`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#09090b" />
          <stop offset="55%" stopColor="#581c87" />
          <stop offset="100%" stopColor="#2563eb" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-emerald`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#022c22" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-obsidian`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#030712" />
          <stop offset="60%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-solar`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#78350f" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#fef08a" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-alpine`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c1a2e" />
          <stop offset="50%" stopColor="#1e3a8a" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-library`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#271306" />
          <stop offset="60%" stopColor="#78350f" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-cyber`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#0369a1" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-starlight`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#020617" />
          <stop offset="60%" stopColor="#172554" />
          <stop offset="100%" stopColor="#60a5fa" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-studio`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="60%" stopColor="#64748b" />
          <stop offset="100%" stopColor="#cbd5e1" />
        </linearGradient>

        <linearGradient id={`${gid}-bg-cherry`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4c0519" />
          <stop offset="60%" stopColor="#db2777" />
          <stop offset="100%" stopColor="#fbcfe8" />
        </linearGradient>

        {/* --- Anatomical Shading Gradients --- */}
        <linearGradient id={`${gid}-skin-grad`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={skin} stopOpacity="1" />
          <stop offset="100%" stopColor={skin} stopOpacity="0.88" />
        </linearGradient>

        <linearGradient id={`${gid}-hair-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={hair} />
          <stop offset="100%" stopColor={hair} stopOpacity="0.85" />
        </linearGradient>

        <linearGradient id={`${gid}-cloth-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={clothes} />
          <stop offset="100%" stopColor={clothes} stopOpacity="0.85" />
        </linearGradient>
      </defs>

      {/* ========================================================================= */}
      {/* 1. BACKGROUND & ENVIRONMENT LAYER                                         */}
      {/* ========================================================================= */}
      {showBackground && (
        <g id="avatar-background">
          {/* Main Backdrop Disc */}
          <rect
            width="100"
            height="100"
            rx="50"
            fill={
              cfg.backgroundId === 'sunset_horizon'
                ? `url(#${gid}-bg-sunset)`
                : cfg.backgroundId === 'deep_nebula'
                ? `url(#${gid}-bg-nebula)`
                : cfg.backgroundId === 'emerald_aurora'
                ? `url(#${gid}-bg-emerald)`
                : cfg.backgroundId === 'royal_obsidian'
                ? `url(#${gid}-bg-obsidian)`
                : cfg.backgroundId === 'solar_amber'
                ? `url(#${gid}-bg-solar)`
                : cfg.backgroundId === 'alpine_mountain'
                ? `url(#${gid}-bg-alpine)`
                : cfg.backgroundId === 'oxford_library'
                ? `url(#${gid}-bg-library)`
                : cfg.backgroundId === 'cyber_grid'
                ? `url(#${gid}-bg-cyber)`
                : cfg.backgroundId === 'starlight_night'
                ? `url(#${gid}-bg-starlight)`
                : cfg.backgroundId === 'studio_gray'
                ? `url(#${gid}-bg-studio)`
                : cfg.backgroundId === 'cherry_blossom'
                ? `url(#${gid}-bg-cherry)`
                : `url(#${gid}-bg-collegiate)`
            }
          />

          {/* Environment-Specific Atmospheric Vectors */}
          {cfg.backgroundId === 'alpine_mountain' && (
            <g opacity="0.35">
              <polygon points="12,100 35,48 58,100" fill="#ffffff" />
              <polygon points="42,100 68,38 94,100" fill="#cbd5e1" />
              <polygon points="35,48 31,58 39,58" fill="#ffffff" opacity="0.8" />
              <polygon points="68,38 63,50 73,50" fill="#ffffff" opacity="0.8" />
            </g>
          )}

          {cfg.backgroundId === 'oxford_library' && (
            <g opacity="0.22" stroke="#ffffff" strokeWidth="0.8">
              <line x1="15" y1="20" x2="85" y2="20" />
              <line x1="15" y1="36" x2="85" y2="36" />
              <rect x="22" y="22" width="5" height="14" fill="#ffffff" />
              <rect x="29" y="24" width="4" height="12" fill="#ffffff" />
              <rect x="35" y="22" width="6" height="14" fill="#ffffff" />
              <rect x="62" y="23" width="5" height="13" fill="#ffffff" />
              <rect x="69" y="22" width="6" height="14" fill="#ffffff" />
            </g>
          )}

          {cfg.backgroundId === 'cyber_grid' && (
            <g opacity="0.35" stroke="#38bdf8" strokeWidth="0.6" fill="none">
              <line x1="0" y1="30" x2="100" y2="30" strokeDasharray="3,3" />
              <line x1="0" y1="50" x2="100" y2="50" strokeDasharray="3,3" />
              <line x1="0" y1="70" x2="100" y2="70" strokeDasharray="3,3" />
              <circle cx="25" cy="30" r="1.5" fill="#38bdf8" />
              <circle cx="75" cy="50" r="1.5" fill="#38bdf8" />
              <circle cx="50" cy="70" r="1.5" fill="#38bdf8" />
            </g>
          )}

          {cfg.backgroundId === 'starlight_night' && (
            <g opacity="0.8" fill="#ffffff">
              <circle cx="22" cy="18" r="1" />
              <circle cx="78" cy="16" r="1.2" />
              <circle cx="85" cy="32" r="0.8" />
              <circle cx="15" cy="40" r="0.8" />
              <path d="M72 12 Q74 15 72 18 Q77 17 76 13 Z" fill="#fef08a" opacity="0.9" />
            </g>
          )}

          {cfg.backgroundId === 'cherry_blossom' && (
            <g opacity="0.45" fill="#fbcfe8">
              <ellipse cx="20" cy="22" rx="3" ry="1.8" transform="rotate(25 20 22)" />
              <ellipse cx="80" cy="25" rx="3.5" ry="2" transform="rotate(-35 80 25)" />
              <ellipse cx="70" cy="45" rx="2.5" ry="1.5" transform="rotate(15 70 45)" />
              <ellipse cx="25" cy="55" rx="3" ry="1.8" transform="rotate(-20 25 55)" />
            </g>
          )}

          {/* Celestial / Subtle Vignette Outer Border Ring */}
          <circle cx="50" cy="50" r="47.5" fill="none" stroke="rgba(255, 255, 255, 0.2)" strokeWidth="1.2" />
        </g>
      )}

      {/* ========================================================================= */}
      {/* 2. BACK HAIR LAYER (Volume falling behind head & shoulders)               */}
      {/* ========================================================================= */}
      <g id="avatar-back-hair">
        {cfg.hairStyle === 'sleek_bun' && (
          <>
            <ellipse cx="50" cy="36" rx="28" ry="24" fill={hair} />
            <circle cx="50" cy="21" r="14" fill={hair} />
            <circle cx="50" cy="21" r="11" fill={`url(#${gid}-hair-grad)`} />
          </>
        )}

        {cfg.hairStyle === 'ponytail' && (
          <>
            <ellipse cx="50" cy="38" rx="26" ry="22" fill={hair} />
            <path d="M48 24 C62 20, 76 32, 78 52 C74 46, 68 34, 52 32 Z" fill={hair} />
          </>
        )}

        {cfg.hairStyle === 'long_waves' && (
          <path
            d="M23 44 C18 60, 22 84, 28 88 C34 84, 32 68, 30 50 Z M77 44 C82 60, 78 84, 72 88 C66 84, 68 68, 70 50 Z"
            fill={hair}
          />
        )}

        {cfg.hairStyle === 'straight_layers' && (
          <path
            d="M24 45 L22 86 L32 84 L30 50 Z M76 45 L78 86 L68 84 L70 50 Z"
            fill={hair}
          />
        )}

        {cfg.hairStyle === 'curly_afro' && (
          <ellipse cx="50" cy="38" rx="33" ry="29" fill={hair} />
        )}

        {cfg.hairStyle === 'braids' && (
          <g fill={hair}>
            <ellipse cx="50" cy="36" rx="28" ry="24" />
            <rect x="22" y="48" width="6" height="38" rx="3" />
            <rect x="72" y="48" width="6" height="38" rx="3" />
          </g>
        )}
      </g>

      {/* ========================================================================= */}
      {/* 3. NECK & THORAX BASE                                                     */}
      {/* ========================================================================= */}
      <g id="avatar-neck">
        <rect x="43" y="55" width="14" height="17" rx="3" fill={skin} />
        {/* Subtle Chin Shadow on Neck */}
        <path d="M43 55 Q50 61 57 55 Z" fill="#000000" opacity="0.12" />
      </g>

      {/* ========================================================================= */}
      {/* 4. BODY & CLOTHING LAYER                                                  */}
      {/* ========================================================================= */}
      <g id="avatar-clothing">
        {/* Base Torso Silhouette */}
        <path d="M22 98 C22 76, 32 66, 50 66 C68 66, 78 76, 78 98 Z" fill={`url(#${gid}-cloth-grad)`} />

        {/* Clothing Style Accents */}
        {cfg.clothingStyle === 'casual_tee' && (
          <g>
            {/* Crewneck Collar */}
            <path d="M42 66 Q50 74 58 66" fill="none" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          </g>
        )}

        {cfg.clothingStyle === 'oxford' && (
          <g>
            {/* White Collar Points */}
            <path d="M42 66 L50 79 L35 73 Z" fill="#ffffff" />
            <path d="M58 66 L50 79 L65 73 Z" fill="#f8fafc" />
            {/* Placket Seam */}
            <line x1="50" y1="79" x2="50" y2="98" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" />
          </g>
        )}

        {cfg.clothingStyle === 'hoodie' && (
          <g>
            {/* Kangaroo Hoodie Collar Rib */}
            <path d="M38 66 Q50 78 62 66" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="3.5" />
            <path d="M40 66 Q50 76 60 66" fill="none" stroke="#ffffff" strokeWidth="1.5" />
            {/* Drawstrings */}
            <line x1="46" y1="73" x2="45" y2="84" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
            <line x1="54" y1="73" x2="55" y2="84" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          </g>
        )}

        {cfg.clothingStyle === 'blazer' && (
          <g>
            {/* Crisp Inner White Shirt */}
            <polygon points="44,66 50,82 56,66" fill="#ffffff" />
            {/* Lapels */}
            <path d="M32 72 L44 86 L32 98 Z" fill={clothes} />
            <path d="M68 72 L56 86 L68 98 Z" fill={clothes} />
            <path d="M34 68 L48 86 L43 86 Z" fill="rgba(0,0,0,0.18)" />
            <path d="M66 68 L52 86 L57 86 Z" fill="rgba(0,0,0,0.18)" />
            {/* Brooch / Pin */}
            <circle cx="36" cy="80" r="1.8" fill="#38bdf8" />
          </g>
        )}

        {cfg.clothingStyle === 'sweater' && (
          <g>
            {/* V-Neck Rib */}
            <polygon points="43,66 50,77 57,66" fill="#ffffff" />
            <path d="M40 66 L50 80 L60 66" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="2" />
          </g>
        )}

        {cfg.clothingStyle === 'track_jacket' && (
          <g>
            {/* Center Zipper */}
            <line x1="50" y1="66" x2="50" y2="98" stroke="#ffffff" strokeWidth="1.6" />
            {/* Athletic Shoulder Stripes */}
            <path d="M26 80 L29 98" stroke="#ffffff" strokeWidth="1.5" />
            <path d="M74 80 L71 98" stroke="#ffffff" strokeWidth="1.5" />
          </g>
        )}

        {/* Pattern: Stripe */}
        {cfg.clothingPattern === 'stripe' && (
          <g stroke="rgba(255,255,255,0.25)" strokeWidth="1.2">
            <line x1="28" y1="84" x2="72" y2="84" />
            <line x1="26" y1="91" x2="74" y2="91" />
          </g>
        )}
      </g>

      {/* ========================================================================= */}
      {/* 5. FACE SHAPE & FACIAL STRUCTURE BASE                                     */}
      {/* ========================================================================= */}
      <g id="avatar-face">
        {cfg.faceShape === 'round' && (
          <ellipse cx="50" cy="46.5" rx="20.5" ry="19.5" fill={`url(#${gid}-skin-grad)`} />
        )}
        {cfg.faceShape === 'square' && (
          <path
            d="M31 38 C31 28, 69 28, 69 38 C70 52, 67 65, 50 66 C33 65, 30 52, 31 38 Z"
            fill={`url(#${gid}-skin-grad)`}
          />
        )}
        {cfg.faceShape === 'chiseled' && (
          <path
            d="M32 38 C32 28, 68 28, 68 38 C69 50, 64 64, 50 67 C36 64, 31 50, 32 38 Z"
            fill={`url(#${gid}-skin-grad)`}
          />
        )}
        {cfg.faceShape === 'diamond' && (
          <path
            d="M33 39 C34 29, 66 29, 67 39 C71 48, 66 63, 50 66 C34 63, 29 48, 33 39 Z"
            fill={`url(#${gid}-skin-grad)`}
          />
        )}
        {cfg.faceShape === 'heart' && (
          <path
            d="M31 36 C32 28, 68 28, 69 36 C70 48, 63 64, 50 66.5 C37 64, 30 48, 31 36 Z"
            fill={`url(#${gid}-skin-grad)`}
          />
        )}
        {(cfg.faceShape === 'oval' || !['round', 'square', 'chiseled', 'diamond', 'heart'].includes(cfg.faceShape)) && (
          <ellipse cx="50" cy="46" rx="19.2" ry="20.5" fill={`url(#${gid}-skin-grad)`} />
        )}
      </g>

      {/* ========================================================================= */}
      {/* 6. EARS & EARRINGS                                                        */}
      {/* ========================================================================= */}
      <g id="avatar-ears">
        {cfg.earStyle === 'small' ? (
          <>
            <ellipse cx="30.5" cy="47" rx="2.2" ry="4.5" fill={skin} />
            <ellipse cx="69.5" cy="47" rx="2.2" ry="4.5" fill={skin} />
          </>
        ) : (
          <>
            <ellipse cx="29.8" cy="47" rx="3.1" ry="5.6" fill={skin} />
            <ellipse cx="70.2" cy="47" rx="3.1" ry="5.6" fill={skin} />
            {/* Inner Ear Folds */}
            <path d="M30 45 Q31.5 47 30 49" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
            <path d="M70 45 Q68.5 47 70 49" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
          </>
        )}

        {/* Earrings */}
        {cfg.earrings === 'pearl' && (
          <g fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.5">
            <circle cx="31.2" cy="51" r="1.4" />
            <circle cx="68.8" cy="51" r="1.4" />
          </g>
        )}
        {cfg.earrings === 'gold_stud' && (
          <g fill="#f59e0b" stroke="#b45309" strokeWidth="0.4">
            <circle cx="31.2" cy="51" r="1.3" />
            <circle cx="68.8" cy="51" r="1.3" />
          </g>
        )}
        {cfg.earrings === 'silver_hoop' && (
          <g fill="none" stroke="#e2e8f0" strokeWidth="0.9">
            <circle cx="30.5" cy="52" r="2.2" />
            <circle cx="69.5" cy="52" r="2.2" />
          </g>
        )}
      </g>

      {/* ========================================================================= */}
      {/* 7. FACIAL DETAILS (Blush, Freckles, Beauty Mark)                          */}
      {/* ========================================================================= */}
      <g id="avatar-facial-details">
        {cfg.facialDetail === 'blush' && (
          <g fill="#fb7185" opacity="0.42">
            <ellipse cx="37.5" cy="51.5" rx="4.2" ry="2.2" />
            <ellipse cx="62.5" cy="51.5" rx="4.2" ry="2.2" />
          </g>
        )}

        {cfg.facialDetail === 'freckles' && (
          <g fill="#78350f" opacity="0.45">
            <circle cx="37" cy="51" r="0.6" />
            <circle cx="39" cy="52" r="0.5" />
            <circle cx="41" cy="50.5" r="0.6" />
            <circle cx="59" cy="50.5" r="0.6" />
            <circle cx="61" cy="52" r="0.5" />
            <circle cx="63" cy="51" r="0.6" />
            <circle cx="50" cy="50" r="0.5" />
          </g>
        )}

        {cfg.facialDetail === 'beauty_mark' && (
          <circle cx="61.5" cy="53" r="0.85" fill="#451a03" />
        )}
      </g>

      {/* ========================================================================= */}
      {/* 8. NOSE                                                                   */}
      {/* ========================================================================= */}
      <g id="avatar-nose">
        {cfg.noseStyle === 'button' && (
          <path d="M48.5 50.5 Q50 52.8 51.5 50.5" fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
        )}
        {cfg.noseStyle === 'wide' && (
          <path d="M48 49 L47.5 52.5 Q50 54 52.5 52.5 L52 49" fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
        )}
        {cfg.noseStyle === 'aquiline' && (
          <path d="M50 46 L49 49.5 L48.8 52.5 L51.2 52.5" fill="none" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />
        )}
        {(cfg.noseStyle === 'straight' || cfg.noseStyle === 'rounded' || !['button', 'wide', 'aquiline'].includes(cfg.noseStyle)) && (
          <path d="M50 47.5 L49.2 52.5 L51.2 52.5" fill="none" stroke="#ea580c" strokeWidth="0.9" strokeLinecap="round" />
        )}
      </g>

      {/* ========================================================================= */}
      {/* 9. MOUTH & TEETH / EXPRESSIONS                                            */}
      {/* ========================================================================= */}
      <g id="avatar-mouth">
        {cfg.mouthStyle === 'teeth' ? (
          <g>
            {/* Open smile showing white teeth */}
            <path d="M43.5 55.5 Q50 61 56.5 55.5 Z" fill="#991b1b" />
            <path d="M44.5 55.5 Q50 58.5 55.5 55.5 Z" fill="#ffffff" />
            <path d="M43 55.5 Q50 61.5 57 55.5" fill="none" stroke={lips} strokeWidth="1.3" strokeLinecap="round" />
          </g>
        ) : cfg.mouthStyle === 'confident' ? (
          <path d="M45 56.8 Q49 58 55.5 55" fill="none" stroke={lips} strokeWidth="1.3" strokeLinecap="round" />
        ) : cfg.mouthStyle === 'neutral' ? (
          <path d="M45.5 56.5 L54.5 56.5" fill="none" stroke={lips} strokeWidth="1.2" strokeLinecap="round" />
        ) : cfg.mouthStyle === 'laugh' ? (
          <g>
            <path d="M43 55 Q50 63 57 55 Z" fill="#7f1d1d" />
            <path d="M44 55 Q50 58 56 55 Z" fill="#ffffff" />
            <path d="M42.5 55 Q50 63.5 57.5 55" fill="none" stroke={lips} strokeWidth="1.4" strokeLinecap="round" />
          </g>
        ) : (
          /* Default warm smile */
          <path d="M45 56 Q50 59.5 55 56" fill="none" stroke={lips} strokeWidth="1.3" strokeLinecap="round" />
        )}
      </g>

      {/* ========================================================================= */}
      {/* 10. EYES & EYEBALLS                                                       */}
      {/* ========================================================================= */}
      <g id="avatar-eyes">
        {/* Left & Right Sclera Base */}
        <ellipse cx="41.5" cy="45.5" rx="3.4" ry="2.2" fill="#ffffff" />
        <ellipse cx="58.5" cy="45.5" rx="3.4" ry="2.2" fill="#ffffff" />

        {/* Irises with selected eyeColor */}
        <circle cx="41.5" cy="45.5" r="2.1" fill={eyes} />
        <circle cx="58.5" cy="45.5" r="2.1" fill={eyes} />

        {/* Pupils */}
        <circle cx="41.5" cy="45.5" r="1.1" fill="#09090b" />
        <circle cx="58.5" cy="45.5" r="1.1" fill="#09090b" />

        {/* Catch-Light Highlights */}
        <circle cx="42.2" cy="44.8" r="0.65" fill="#ffffff" />
        <circle cx="59.2" cy="44.8" r="0.65" fill="#ffffff" />

        {/* Eye Shape Lid Curves */}
        {cfg.eyeShape === 'upturned' && (
          <g stroke="#09090b" strokeWidth="1.1" fill="none" strokeLinecap="round">
            <path d="M37.5 45.5 Q41.5 43.5 45.2 44.5" />
            <path d="M62.5 45.5 Q58.5 43.5 54.8 44.5" />
          </g>
        )}
        {cfg.eyeShape === 'hooded' && (
          <g stroke="#09090b" strokeWidth="1.1" fill="none" strokeLinecap="round">
            <path d="M37.8 46 Q41.5 44 45 46" />
            <path d="M62.2 46 Q58.5 44 55 46" />
            <path d="M38 43.5 Q41.5 42.5 45 43.5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <path d="M62 43.5 Q58.5 42.5 55 43.5" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
          </g>
        )}
        {cfg.eyeShape === 'round' && (
          <g stroke="#09090b" strokeWidth="1.1" fill="none" strokeLinecap="round">
            <path d="M37.5 45.5 Q41.5 43 45.5 45.5" />
            <path d="M62.5 45.5 Q58.5 43 54.5 45.5" />
          </g>
        )}
        {(cfg.eyeShape === 'almond' || !['upturned', 'hooded', 'round'].includes(cfg.eyeShape)) && (
          <g stroke="#09090b" strokeWidth="1.1" fill="none" strokeLinecap="round">
            <path d="M37.8 45.5 Q41.5 43.8 45.2 45.5" />
            <path d="M62.2 45.5 Q58.5 43.8 54.8 45.5" />
          </g>
        )}
      </g>

      {/* ========================================================================= */}
      {/* 11. EYEBROWS                                                              */}
      {/* ========================================================================= */}
      <g id="avatar-eyebrows" stroke={brows} strokeLinecap="round" fill="none">
        {cfg.eyebrowStyle === 'straight' && (
          <g strokeWidth="1.5">
            <line x1="36" y1="39.5" x2="46" y2="39.5" />
            <line x1="54" y1="39.5" x2="64" y2="39.5" />
          </g>
        )}
        {cfg.eyebrowStyle === 'thick' && (
          <g strokeWidth="2.1">
            <path d="M35.5 40 Q41 38.2 46 39.5" />
            <path d="M54 39.5 Q59 38.2 64.5 40" />
          </g>
        )}
        {cfg.eyebrowStyle === 'feathered' && (
          <g strokeWidth="1.3">
            <path d="M36 40 Q41.5 37.8 46.5 39" />
            <path d="M53.5 39 Q58.5 37.8 64 40" />
          </g>
        )}
        {(cfg.eyebrowStyle === 'natural' || cfg.eyebrowStyle === 'arched' || !['straight', 'thick', 'feathered'].includes(cfg.eyebrowStyle)) && (
          <g strokeWidth="1.4">
            <path d="M36 39.8 Q41.5 38 46 39.5" />
            <path d="M54 39.5 Q58.5 38 64 39.8" />
          </g>
        )}
      </g>

      {/* ========================================================================= */}
      {/* 12. FACIAL HAIR (Beard & Mustache)                                        */}
      {/* ========================================================================= */}
      <g id="avatar-facial-hair">
        {cfg.beardStyle === 'stubble' && (
          <g fill={beard} opacity="0.38">
            <circle cx="42" cy="60" r="0.6" />
            <circle cx="44" cy="62" r="0.6" />
            <circle cx="47" cy="63" r="0.6" />
            <circle cx="50" cy="63.5" r="0.6" />
            <circle cx="53" cy="63" r="0.6" />
            <circle cx="56" cy="62" r="0.6" />
            <circle cx="58" cy="60" r="0.6" />
            <circle cx="50" cy="60" r="0.6" />
          </g>
        )}

        {cfg.beardStyle === 'full_beard' && (
          <path
            d="M33 48 C33 66, 42 68, 50 68 C58 68, 67 66, 67 48 C67 60, 60 66, 50 66 C40 66, 33 60, 33 48 Z"
            fill={beard}
          />
        )}

        {cfg.beardStyle === 'goatee' && (
          <g fill={beard}>
            <ellipse cx="50" cy="63" rx="4.5" ry="3.5" />
            <rect x="48.5" y="58" width="3" height="3" rx="1" />
          </g>
        )}

        {cfg.beardStyle === 'anchor' && (
          <path d="M44 62 Q50 66 56 62 Q50 65 44 62" fill="none" stroke={beard} strokeWidth="2" strokeLinecap="round" />
        )}

        {cfg.beardStyle === 'box_beard' && (
          <path
            d="M34 50 L34 62 L44 66 L56 66 L66 62 L66 50 C66 60, 58 64, 50 64 C42 64, 34 60, 34 50 Z"
            fill={beard}
          />
        )}

        {/* Mustaches */}
        {cfg.mustacheStyle === 'chevron' && (
          <path d="M43 54.5 Q50 53 57 54.5 L55 56 Q50 55 45 56 Z" fill={beard} />
        )}
        {cfg.mustacheStyle === 'pencil' && (
          <path d="M44 54.5 Q50 53.5 56 54.5" fill="none" stroke={beard} strokeWidth="1.2" strokeLinecap="round" />
        )}
        {cfg.mustacheStyle === 'handlebar' && (
          <path d="M42 54 Q46 53 50 54 Q54 53 58 54 Q60 52 61 50 Q59 53 55 55 Q50 54.5 45 55 Q41 53 39 50 Q40 52 42 54 Z" fill={beard} />
        )}
      </g>

      {/* ========================================================================= */}
      {/* 13. EYEWEAR & GLASSES                                                     */}
      {/* ========================================================================= */}
      <g id="avatar-eyewear">
        {cfg.glassesStyle === 'wireframe_round' && (
          <g stroke={glasses} strokeWidth="1.2" fill="none">
            <rect x="36" y="41.5" width="11" height="8.5" rx="4" />
            <rect x="53" y="41.5" width="11" height="8.5" rx="4" />
            <line x1="47" y1="45" x2="53" y2="45" />
          </g>
        )}

        {cfg.glassesStyle === 'modern_rect' && (
          <g stroke={glasses} strokeWidth="1.3" fill="none">
            <rect x="35" y="41.5" width="12" height="8" rx="2.5" />
            <rect x="53" y="41.5" width="12" height="8" rx="2.5" />
            <line x1="47" y1="45" x2="53" y2="45" />
          </g>
        )}

        {cfg.glassesStyle === 'horn_rimmed' && (
          <g>
            <path d="M34 41.5 L48 41.5 L47 43.5 L35 43.5 Z" fill={glasses} />
            <path d="M52 41.5 L66 41.5 L65 43.5 L53 43.5 Z" fill={glasses} />
            <rect x="35" y="42" width="12" height="8" rx="2" stroke={glasses} strokeWidth="1" fill="none" />
            <rect x="53" y="42" width="12" height="8" rx="2" stroke={glasses} strokeWidth="1" fill="none" />
            <line x1="48" y1="43" x2="52" y2="43" stroke={glasses} strokeWidth="1.2" />
          </g>
        )}

        {cfg.glassesStyle === 'sunglasses' && (
          <g>
            <rect x="35" y="41" width="12" height="9" rx="3" fill="#0f172a" />
            <rect x="53" y="41" width="12" height="9" rx="3" fill="#0f172a" />
            <line x1="47" y1="44.5" x2="53" y2="44.5" stroke="#0f172a" strokeWidth="1.5" />
            {/* Sunglasses Lens Glare */}
            <path d="M36 43 L45 43 L42 48 L36 48 Z" fill="#ffffff" opacity="0.25" />
            <path d="M54 43 L63 43 L60 48 L54 48 Z" fill="#ffffff" opacity="0.25" />
          </g>
        )}

        {cfg.glassesStyle === 'aviator' && (
          <g stroke={glasses} strokeWidth="1.1" fill="none">
            <path d="M35 41 L47 41 L46 48 Q41 51 36 48 Z" />
            <path d="M53 41 L65 41 L64 48 Q59 51 54 48 Z" />
            <line x1="47" y1="42.5" x2="53" y2="42.5" />
            <line x1="47" y1="45" x2="53" y2="45" />
          </g>
        )}
      </g>

      {/* ========================================================================= */}
      {/* 14. FRONT HAIR / BANGS & FRINGE                                           */}
      {/* ========================================================================= */}
      <g id="avatar-front-hair">
        {cfg.hairStyle === 'side_part' && (
          <g fill={hair}>
            <path d="M30 38 C30 25, 68 22, 70 38 C70 42, 68 47, 68 47 C66 40, 64 36, 50 35 C38 35, 34 38, 30 38 Z" />
            <path d="M30 38 C34 32, 45 30, 52 30 C62 30, 70 34, 71 42 C68 37, 62 34, 53 34 C44 34, 34 37, 30 38 Z" opacity="0.8" />
          </g>
        )}

        {cfg.hairStyle === 'pompadour' && (
          <g fill={hair}>
            <path d="M29 38 C28 20, 65 18, 72 34 C68 31, 58 28, 48 29 C38 30, 32 34, 29 38 Z" />
            <path d="M33 32 Q50 20 67 30 Q50 24 33 32" opacity="0.75" />
          </g>
        )}

        {cfg.hairStyle === 'sleek_bun' && (
          <g fill={hair}>
            <path d="M31 38 C35 28, 65 28, 69 38 C68 45, 66 52, 65 54 C63 48, 61 40, 50 40 C39 40, 37 48, 35 54 C34 52, 32 45, 31 38 Z" />
            {/* Side strand */}
            <path d="M31 40 C34 46, 35 56, 33 60 C30 52, 30 46, 31 40 Z" />
            <path d="M69 40 C66 46, 65 56, 67 60 C70 52, 70 46, 69 40 Z" />
          </g>
        )}

        {cfg.hairStyle === 'ponytail' && (
          <path d="M30 36 C34 27, 66 27, 70 36 C68 42, 64 45, 50 38 C36 45, 32 42, 30 36 Z" fill={hair} />
        )}

        {cfg.hairStyle === 'long_waves' && (
          <g fill={hair}>
            <path d="M30 36 C35 27, 65 27, 70 36 C67 44, 66 52, 64 56 C62 48, 60 40, 50 40 C40 40, 38 48, 36 56 C34 52, 33 44, 30 36 Z" />
          </g>
        )}

        {cfg.hairStyle === 'straight_layers' && (
          <g fill={hair}>
            <path d="M30 36 C35 26, 65 26, 70 36 C68 45, 66 58, 67 62 C64 54, 62 42, 50 41 C38 42, 36 54, 33 62 C34 58, 32 45, 30 36 Z" />
          </g>
        )}

        {cfg.hairStyle === 'curly_afro' && (
          <g fill={hair}>
            <path d="M28 38 C26 22, 74 22, 72 38 C70 41, 68 44, 50 38 C32 44, 30 41, 28 38 Z" />
          </g>
        )}

        {cfg.hairStyle === 'buzz' && (
          <path d="M31 38 C31 29, 69 29, 69 38 C68 33, 62 31, 50 31 C38 31, 32 33, 31 38 Z" fill={hair} />
        )}

        {cfg.hairStyle === 'crew_cut' && (
          <path d="M30 37 C30 26, 70 26, 70 37 C67 33, 62 30, 50 30 C38 30, 33 33, 30 37 Z" fill={hair} />
        )}

        {cfg.hairStyle === 'braids' && (
          <g fill={hair}>
            <path d="M31 37 C34 28, 66 28, 69 37 C67 43, 64 45, 50 39 C36 45, 33 43, 31 37 Z" />
            <line x1="38" y1="32" x2="36" y2="44" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="45" y1="31" x2="43" y2="43" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="55" y1="31" x2="57" y2="43" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
            <line x1="62" y1="32" x2="64" y2="44" stroke="rgba(255,255,255,0.2)" strokeWidth="0.8" />
          </g>
        )}
      </g>
    </svg>
  );
};

export default PersonalizedAvatar;

