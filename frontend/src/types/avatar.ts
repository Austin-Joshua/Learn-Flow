export interface AvatarConfig {
  skinTone: string;
  faceShape: 'oval' | 'round' | 'square' | 'chiseled' | 'diamond' | 'heart';
  eyeShape: 'almond' | 'round' | 'wide' | 'upturned' | 'hooded' | 'monolid';
  eyeColor: string;
  eyebrowStyle: 'natural' | 'arched' | 'thick' | 'straight' | 'feathered';
  eyebrowColor: string;
  noseStyle: 'straight' | 'button' | 'wide' | 'aquiline' | 'rounded';
  mouthStyle: 'smile' | 'teeth' | 'confident' | 'neutral' | 'laugh';
  lipColor: string;
  earStyle: 'standard' | 'small' | 'curved';
  earrings: 'none' | 'pearl' | 'gold_stud' | 'silver_hoop';
  facialDetail: 'none' | 'freckles' | 'blush' | 'beauty_mark';
  hairStyle:
    | 'buzz'
    | 'side_part'
    | 'pompadour'
    | 'curly_afro'
    | 'sleek_bun'
    | 'ponytail'
    | 'long_waves'
    | 'straight_layers'
    | 'braids'
    | 'crew_cut';
  hairColor: string;
  beardStyle: 'none' | 'stubble' | 'full_beard' | 'goatee' | 'anchor' | 'box_beard';
  mustacheStyle: 'none' | 'chevron' | 'pencil' | 'handlebar';
  facialHairColor: string;
  clothingStyle: 'casual_tee' | 'oxford' | 'hoodie' | 'blazer' | 'sweater' | 'track_jacket';
  clothingColor: string;
  clothingPattern: 'solid' | 'stripe' | 'collar_contrast';
  glassesStyle: 'none' | 'wireframe_round' | 'modern_rect' | 'horn_rimmed' | 'sunglasses' | 'aviator';
  glassesColor: string;
  backgroundId: string;
}

export interface ColorOption {
  id: string;
  label: string;
  hex: string;
}

export interface SelectOption<T = string> {
  id: T;
  label: string;
  description?: string;
  icon?: string;
}

export interface BackgroundOption {
  id: string;
  name: string;
  category: 'gradient' | 'environment' | 'minimalist' | 'academic' | 'cyber';
  description: string;
  previewGradient: string;
}

export const SKIN_TONES: ColorOption[] = [
  { id: 'fair_porcelain', label: 'Fair Porcelain', hex: '#fef3c7' },
  { id: 'peach_light', label: 'Soft Peach', hex: '#fed7aa' },
  { id: 'warm_honey', label: 'Warm Honey', hex: '#fde047' },
  { id: 'golden_tan', label: 'Golden Tan', hex: '#f59e0b' },
  { id: 'rich_chestnut', label: 'Rich Chestnut', hex: '#d97706' },
  { id: 'warm_bronze', label: 'Warm Bronze', hex: '#b45309' },
  { id: 'deep_espresso', label: 'Deep Espresso', hex: '#78350f' },
  { id: 'obsidian_noir', label: 'Obsidian Earth', hex: '#451a03' },
];

export const HAIR_COLORS: ColorOption[] = [
  { id: 'onyx_black', label: 'Natural Onyx', hex: '#1c1917' },
  { id: 'dark_espresso', label: 'Dark Espresso', hex: '#292524' },
  { id: 'rich_chestnut', label: 'Rich Chestnut', hex: '#451a03' },
  { id: 'warm_chocolate', label: 'Chocolate Brown', hex: '#78350f' },
  { id: 'golden_blonde', label: 'Honey Blonde', hex: '#d97706' },
  { id: 'copper_auburn', label: 'Copper Auburn', hex: '#b91c1c' },
  { id: 'platinum_silver', label: 'Platinum Silver', hex: '#94a3b8' },
  { id: 'sapphire_blue', label: 'Scholar Sapphire', hex: '#0284c7' },
  { id: 'emerald_teal', label: 'Alpine Teal', hex: '#0d9488' },
  { id: 'amethyst_purple', label: 'Quantum Purple', hex: '#7c3aed' },
];

export const EYE_COLORS: ColorOption[] = [
  { id: 'deep_brown', label: 'Deep Chestnut', hex: '#451a03' },
  { id: 'dark_onyx', label: 'Dark Onyx', hex: '#09090b' },
  { id: 'amber_hazel', label: 'Amber Hazel', hex: '#78350f' },
  { id: 'sapphire_blue', label: 'Sapphire Blue', hex: '#1e3a8a' },
  { id: 'emerald_green', label: 'Emerald Green', hex: '#059669' },
  { id: 'storm_gray', label: 'Storm Gray', hex: '#475569' },
  { id: 'violet_amethyst', label: 'Violet Amethyst', hex: '#6d28d9' },
];

export const CLOTHING_COLORS: ColorOption[] = [
  { id: 'academic_azure', label: 'Academic Azure', hex: '#0284c7' },
  { id: 'midnight_navy', label: 'Midnight Navy', hex: '#0f172a' },
  { id: 'emerald_ivy', label: 'Emerald Ivy', hex: '#059669' },
  { id: 'royal_crimson', label: 'Royal Crimson', hex: '#be123c' },
  { id: 'scholar_purple', label: 'Scholar Purple', hex: '#7c3aed' },
  { id: 'amber_gold', label: 'Amber Gold', hex: '#d97706' },
  { id: 'heather_slate', label: 'Heather Slate', hex: '#64748b' },
  { id: 'pure_linen', label: 'Pure Linen', hex: '#ffffff' },
];

export const GLASSES_COLORS: ColorOption[] = [
  { id: 'matte_black', label: 'Matte Black', hex: '#0f172a' },
  { id: 'academic_gold', label: 'Academic Gold', hex: '#d97706' },
  { id: 'brushed_silver', label: 'Brushed Silver', hex: '#94a3b8' },
  { id: 'tortoise_shell', label: 'Tortoise Brown', hex: '#78350f' },
];

export const BACKGROUND_OPTIONS: BackgroundOption[] = [
  {
    id: 'collegiate_azure',
    name: 'Collegiate Azure',
    category: 'gradient',
    description: 'Iconic Learnflow blue horizon with ambient celestial rays.',
    previewGradient: 'linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)',
  },
  {
    id: 'sunset_horizon',
    name: 'Sunset Vista',
    category: 'gradient',
    description: 'Warm twilight glow across peach, rose, and amber hues.',
    previewGradient: 'linear-gradient(135deg, #4c0519 0%, #be123c 50%, #f59e0b 100%)',
  },
  {
    id: 'deep_nebula',
    name: 'Deep Nebula',
    category: 'cyber',
    description: 'Cosmic deep space with luminescent star clusters.',
    previewGradient: 'linear-gradient(135deg, #09090b 0%, #581c87 60%, #3b82f6 100%)',
  },
  {
    id: 'emerald_aurora',
    name: 'Emerald Aurora',
    category: 'environment',
    description: 'Boreal forest night with glowing emerald ribbons.',
    previewGradient: 'linear-gradient(135deg, #022c22 0%, #059669 60%, #10b981 100%)',
  },
  {
    id: 'royal_obsidian',
    name: 'Royal Obsidian',
    category: 'minimalist',
    description: 'Sleek executive dark slate with subtle metallic rim lighting.',
    previewGradient: 'linear-gradient(135deg, #030712 0%, #1e293b 100%)',
  },
  {
    id: 'solar_amber',
    name: 'Solar Daylight',
    category: 'gradient',
    description: 'High noon academic daylight with warm golden undertones.',
    previewGradient: 'linear-gradient(135deg, #78350f 0%, #d97706 50%, #fef08a 100%)',
  },
  {
    id: 'alpine_mountain',
    name: 'Alpine Ascent',
    category: 'environment',
    description: 'Snow-capped mountain peaks from the My Journey expedition.',
    previewGradient: 'linear-gradient(135deg, #0c1a2e 0%, #1e3a8a 50%, #38bdf8 100%)',
  },
  {
    id: 'oxford_library',
    name: 'Historic Library',
    category: 'academic',
    description: 'Classical university library with warm wood and archival books.',
    previewGradient: 'linear-gradient(135deg, #271306 0%, #78350f 70%, #d97706 100%)',
  },
  {
    id: 'cyber_grid',
    name: 'Cybernetic Matrix',
    category: 'cyber',
    description: 'High-tech hexagonal circuit grid with glowing trace vectors.',
    previewGradient: 'linear-gradient(135deg, #020617 0%, #0369a1 70%, #06b6d4 100%)',
  },
  {
    id: 'starlight_night',
    name: 'Starlight Observatory',
    category: 'environment',
    description: 'Tranquil alpine night sky adorned with glittering constellations.',
    previewGradient: 'linear-gradient(135deg, #020617 0%, #172554 60%, #60a5fa 100%)',
  },
  {
    id: 'studio_gray',
    name: 'Studio Minimalist',
    category: 'minimalist',
    description: 'Clean architectural neutral backdrop with soft directional lighting.',
    previewGradient: 'linear-gradient(135deg, #334155 0%, #64748b 50%, #cbd5e1 100%)',
  },
  {
    id: 'cherry_blossom',
    name: 'Cherry Blossom Park',
    category: 'environment',
    description: 'Delicate floral spring canopy with soft petals in breeze.',
    previewGradient: 'linear-gradient(135deg, #4c0519 0%, #db2777 60%, #fbcfe8 100%)',
  },
];

export const DEFAULT_AVATAR_CONFIG: AvatarConfig = {
  skinTone: '#fed7aa',
  faceShape: 'oval',
  eyeShape: 'almond',
  eyeColor: '#1e3a8a',
  eyebrowStyle: 'arched',
  eyebrowColor: '#1c1917',
  noseStyle: 'straight',
  mouthStyle: 'smile',
  lipColor: '#be123c',
  earStyle: 'standard',
  earrings: 'pearl',
  facialDetail: 'blush',
  hairStyle: 'sleek_bun',
  hairColor: '#1c1917',
  beardStyle: 'none',
  mustacheStyle: 'none',
  facialHairColor: '#1c1917',
  clothingStyle: 'oxford',
  clothingColor: '#0284c7',
  clothingPattern: 'solid',
  glassesStyle: 'wireframe_round',
  glassesColor: '#0f172a',
  backgroundId: 'collegiate_azure',
};

export const PRESET_ARCHETYPES: Array<{ id: string; name: string; title: string; config: AvatarConfig }> = [
  {
    id: 'ada_lovelace',
    name: 'Ada Lovelace',
    title: 'Pioneer Algorithmist',
    config: {
      ...DEFAULT_AVATAR_CONFIG,
      skinTone: '#fed7aa',
      faceShape: 'oval',
      eyeShape: 'almond',
      eyeColor: '#1e3a8a',
      hairStyle: 'sleek_bun',
      hairColor: '#1c1917',
      clothingStyle: 'blazer',
      clothingColor: '#0284c7',
      earrings: 'pearl',
      facialDetail: 'blush',
      glassesStyle: 'wireframe_round',
      backgroundId: 'collegiate_azure',
    },
  },
  {
    id: 'alan_turing',
    name: 'Alan Turing',
    title: 'Foundational Cryptanalyst',
    config: {
      ...DEFAULT_AVATAR_CONFIG,
      skinTone: '#fed7aa',
      faceShape: 'square',
      eyeShape: 'round',
      eyeColor: '#451a03',
      eyebrowStyle: 'straight',
      hairStyle: 'side_part',
      hairColor: '#1e293b',
      beardStyle: 'none',
      clothingStyle: 'oxford',
      clothingColor: '#0369a1',
      earrings: 'none',
      facialDetail: 'none',
      glassesStyle: 'modern_rect',
      backgroundId: 'oxford_library',
    },
  },
  {
    id: 'grace_hopper',
    name: 'Grace Hopper',
    title: 'Compiler Architect',
    config: {
      ...DEFAULT_AVATAR_CONFIG,
      skinTone: '#fef3c7',
      faceShape: 'chiseled',
      eyeShape: 'wide',
      eyeColor: '#059669',
      eyebrowStyle: 'arched',
      hairStyle: 'crew_cut',
      hairColor: '#94a3b8',
      clothingStyle: 'blazer',
      clothingColor: '#0f172a',
      earrings: 'silver_hoop',
      glassesStyle: 'horn_rimmed',
      backgroundId: 'royal_obsidian',
    },
  },
  {
    id: 'linus_torvalds',
    name: 'Linus Torvalds',
    title: 'Kernel & Distributed Systems',
    config: {
      ...DEFAULT_AVATAR_CONFIG,
      skinTone: '#fed7aa',
      faceShape: 'round',
      eyeShape: 'hooded',
      eyeColor: '#78350f',
      eyebrowStyle: 'thick',
      hairStyle: 'curly_afro',
      hairColor: '#78350f',
      beardStyle: 'stubble',
      mustacheStyle: 'none',
      clothingStyle: 'hoodie',
      clothingColor: '#7c3aed',
      earrings: 'none',
      facialDetail: 'freckles',
      glassesStyle: 'none',
      backgroundId: 'cyber_grid',
    },
  },
  {
    id: 'quantum_explorer',
    name: 'Quantum Scholar',
    title: 'Hardware & Quantum Computing',
    config: {
      ...DEFAULT_AVATAR_CONFIG,
      skinTone: '#b45309',
      faceShape: 'diamond',
      eyeShape: 'upturned',
      eyeColor: '#6d28d9',
      eyebrowStyle: 'feathered',
      hairStyle: 'braids',
      hairColor: '#0284c7',
      beardStyle: 'goatee',
      mustacheStyle: 'pencil',
      facialHairColor: '#0284c7',
      clothingStyle: 'track_jacket',
      clothingColor: '#059669',
      earrings: 'gold_stud',
      facialDetail: 'none',
      glassesStyle: 'aviator',
      backgroundId: 'deep_nebula',
    },
  },
];

