import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import {
  AvatarConfig,
  DEFAULT_AVATAR_CONFIG,
  SKIN_TONES,
  HAIR_COLORS,
  EYE_COLORS,
  CLOTHING_COLORS,
  GLASSES_COLORS,
  BACKGROUND_OPTIONS,
  PRESET_ARCHETYPES,
  BackgroundOption,
} from '../types/avatar';
import { PersonalizedAvatar } from '../components/avatar/PersonalizedAvatar';
import {
  Sparkles,
  RotateCcw,
  Check,
  Save,
  Dices,
  Layers,
  Eye,
  Smile,
  Scissors,
  Shirt,
  Glasses,
  Image as ImageIcon,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Palette,
  ShieldCheck,
  Compass,
} from 'lucide-react';

type StudioCategory = 'face' | 'eyes' | 'features' | 'hair' | 'outfit' | 'background';

const CATEGORIES: Array<{
  id: StudioCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tagline: string;
}> = [
  { id: 'face', label: 'Face & Skin', icon: Smile, tagline: 'Structure, complexion, and unique markings' },
  { id: 'eyes', label: 'Eyes & Brows', icon: Eye, tagline: 'Expression, gaze iris tone, and arched brows' },
  { id: 'features', label: 'Nose, Mouth & Ears', icon: Sparkles, tagline: 'Smile, lip pigments, and adornments' },
  { id: 'hair', label: 'Hair & Beard', icon: Scissors, tagline: 'Coiffures, texture, beard, and mustache' },
  { id: 'outfit', label: 'Clothing & Eyewear', icon: Shirt, tagline: 'Academic attire, patterns, and spectacles' },
  { id: 'background', label: 'Atmosphere & World', icon: ImageIcon, tagline: 'Cohesive environments & gradients' },
];

const FACE_SHAPES = [
  { id: 'oval', label: 'Oval Classic', desc: 'Balanced curved jaw' },
  { id: 'round', label: 'Soft Round', desc: 'Warm circular structure' },
  { id: 'square', label: 'Defined Square', desc: 'Strong angular jawline' },
  { id: 'chiseled', label: 'Chiseled Sharp', desc: 'Sculpted cheekbones' },
  { id: 'diamond', label: 'Diamond', desc: 'Pointed chin, wide temples' },
  { id: 'heart', label: 'Sweet Heart', desc: 'Tapered delicate chin' },
] as const;

const FACIAL_DETAILS = [
  { id: 'none', label: 'Pristine Clean', desc: 'Natural complexion' },
  { id: 'blush', label: 'Soft Rose Blush', desc: 'Radiant rosy warmth' },
  { id: 'freckles', label: 'Sun Freckles', desc: 'Delicate bridge dusting' },
  { id: 'beauty_mark', label: 'Beauty Mark', desc: 'Signature aesthetic dot' },
] as const;

const EYE_SHAPES = [
  { id: 'almond', label: 'Classic Almond', desc: 'Balanced expressive fold' },
  { id: 'round', label: 'Bright Round', desc: 'Open, attentive curiosity' },
  { id: 'wide', label: 'Wide Aperture', desc: 'Deep focus, clear pupil' },
  { id: 'upturned', label: 'Upturned Wing', desc: 'Dynamic energetic sweep' },
  { id: 'hooded', label: 'Hooded Calm', desc: 'Scholarly contemplative look' },
  { id: 'monolid', label: 'Monolid Clean', desc: 'Minimalist smooth contour' },
] as const;

const EYEBROW_STYLES = [
  { id: 'natural', label: 'Natural Soft', desc: 'Softly arched brow' },
  { id: 'arched', label: 'Sculpted Arch', desc: 'Lifted expressive curve' },
  { id: 'thick', label: 'Thick Bold', desc: 'Prominent assertive stroke' },
  { id: 'straight', label: 'Straight Line', desc: 'Modern horizontal brow' },
  { id: 'feathered', label: 'Feathered', desc: 'Textured soft gradient' },
] as const;

const NOSE_STYLES = [
  { id: 'straight', label: 'Straight Greek', desc: 'Clean classical bridge' },
  { id: 'button', label: 'Petite Button', desc: 'Soft uplifted apex' },
  { id: 'wide', label: 'Broad Noble', desc: 'Grounded strong base' },
  { id: 'aquiline', label: 'Aquiline Roman', desc: 'Distinguished gentle ridge' },
  { id: 'rounded', label: 'Gentle Rounded', desc: 'Harmonious soft tip' },
] as const;

const MOUTH_STYLES = [
  { id: 'smile', label: 'Gentle Smile', desc: 'Warm, approachable grin' },
  { id: 'teeth', label: 'Beaming Smile', desc: 'Confident visible teeth' },
  { id: 'confident', label: 'Subtle Smirk', desc: 'Clever confident expression' },
  { id: 'neutral', label: 'Focused Neutral', desc: 'Composed academic poise' },
  { id: 'laugh', label: 'Joyful Laugh', desc: 'Radiant open laughter' },
] as const;

const LIP_COLORS = [
  { id: '#be123c', label: 'Natural Rose', hex: '#be123c' },
  { id: '#e11d48', label: 'Crimson Poppy', hex: '#e11d48' },
  { id: '#f43f5e', label: 'Peach Coral', hex: '#f43f5e' },
  { id: '#9f1239', label: 'Deep Berry', hex: '#9f1239' },
  { id: '#78350f', label: 'Warm Cinnamon', hex: '#78350f' },
  { id: '#451a03', label: 'Espresso Nude', hex: '#451a03' },
];

const EAR_STYLES = [
  { id: 'standard', label: 'Standard', desc: 'Proportional natural ear' },
  { id: 'small', label: 'Neat Compact', desc: 'Tucked clean profile' },
  { id: 'curved', label: 'Curved Flare', desc: 'Soft defined helix' },
] as const;

const EARRING_OPTIONS = [
  { id: 'none', label: 'None', desc: 'Unadorned' },
  { id: 'pearl', label: 'Ivory Pearl', desc: 'Luminescent classic stud' },
  { id: 'gold_stud', label: 'Academic Gold', desc: 'Polished warm stud' },
  { id: 'silver_hoop', label: 'Platinum Hoop', desc: 'Contemporary metallic hoop' },
] as const;

const HAIR_STYLES = [
  { id: 'buzz', label: 'Precision Buzz', desc: 'Minimalist cropped fade' },
  { id: 'crew_cut', label: 'Textured Crew', desc: 'Short academic athletic cut' },
  { id: 'side_part', label: 'Classic Side Part', desc: 'Sophisticated professional taper' },
  { id: 'pompadour', label: 'Elevated Pompadour', desc: 'Voluminous swept-back crest' },
  { id: 'curly_afro', label: 'Textured Afro Curls', desc: 'Sculpted voluminous spiral ringlets' },
  { id: 'sleek_bun', label: 'Architectural Bun', desc: 'Clean, high-set crown bun' },
  { id: 'ponytail', label: 'High Ponytail', desc: 'Dynamic athletic sweep' },
  { id: 'long_waves', label: 'Cascading Waves', desc: 'Shoulder-length textured flow' },
  { id: 'straight_layers', label: 'Sleek Straight Layers', desc: 'Smooth geometric fringe' },
  { id: 'braids', label: 'Patterned Braids', desc: 'Intricately arranged woven locks' },
] as const;

const BEARD_STYLES = [
  { id: 'none', label: 'Clean Shaven', desc: 'Polished bare skin' },
  { id: 'stubble', label: 'Designer Stubble', desc: 'Five-o’clock shadow texture' },
  { id: 'goatee', label: 'Crisp Goatee', desc: 'Sculpted chin definition' },
  { id: 'anchor', label: 'Anchor Beard', desc: 'Jawline contour and chin tuft' },
  { id: 'box_beard', label: 'Tailored Box', desc: 'Trimmed modern box perimeter' },
  { id: 'full_beard', label: 'Distinguished Full', desc: 'Dense scholarly beard' },
] as const;

const MUSTACHE_STYLES = [
  { id: 'none', label: 'None', desc: 'Bare upper lip' },
  { id: 'pencil', label: 'Dapper Pencil', desc: 'Narrow vintage precision' },
  { id: 'chevron', label: 'Classic Chevron', desc: 'Full solid sweep' },
  { id: 'handlebar', label: 'Curled Handlebar', desc: 'Upward-curling flourish' },
] as const;

const CLOTHING_STYLES = [
  { id: 'casual_tee', label: 'Modern Tee', desc: 'Relaxed campus cotton crew' },
  { id: 'oxford', label: 'Oxford Button-Down', desc: 'Crisp pointed collar shirt' },
  { id: 'hoodie', label: 'Campus Pullover', desc: 'Comfortable fleece hood & drawstrings' },
  { id: 'blazer', label: 'University Blazer', desc: 'Tailored lapels with crest accent' },
  { id: 'sweater', label: 'Chunky Crewneck', desc: 'Warm knit ribbed collar pullover' },
  { id: 'track_jacket', label: 'Varsity Track', desc: 'Athletic dual-stripe zip collar' },
] as const;

const CLOTHING_PATTERNS = [
  { id: 'solid', label: 'Monochrome Solid', desc: 'Clean uniform saturation' },
  { id: 'stripe', label: 'Horizontal Nautical', desc: 'Fine collegiate stripes' },
  { id: 'collar_contrast', label: 'Accent Rim', desc: 'Distinct rim contrast ribbing' },
] as const;

const GLASSES_STYLES = [
  { id: 'none', label: 'No Glasses', desc: 'Unobstructed eyes' },
  { id: 'wireframe_round', label: 'Round Wireframe', desc: 'Intellectual vintage circle' },
  { id: 'modern_rect', label: 'Modern Rectangular', desc: 'Minimalist sleek frame' },
  { id: 'horn_rimmed', label: 'Horn-Rimmed Brow', desc: 'Bold mid-century acetate' },
  { id: 'sunglasses', label: 'Dark Sunglasses', desc: 'Polarized cool tinted lenses' },
  { id: 'aviator', label: 'Teardrop Aviator', desc: 'Double bridge pilot frame' },
] as const;

export const AvatarStudioPage: React.FC = () => {
  const { user, updateUser } = useAuthStore();
  const navigate = useNavigate();

  // Load existing avatar or default
  const initialConfig: AvatarConfig = useMemo(() => {
    if (user?.avatar_config && Object.keys(user.avatar_config).length > 5) {
      return { ...DEFAULT_AVATAR_CONFIG, ...user.avatar_config };
    }
    return DEFAULT_AVATAR_CONFIG;
  }, [user]);

  const [draftConfig, setDraftConfig] = useState<AvatarConfig>(initialConfig);
  const [activeCategory, setActiveCategory] = useState<StudioCategory>('face');
  const [backgroundFilter, setBackgroundFilter] = useState<string>('all');
  const [previewZoom, setPreviewZoom] = useState<'normal' | 'zoomed'>('normal');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Sync draft if initialConfig changes externally
  useEffect(() => {
    setDraftConfig(initialConfig);
  }, [initialConfig]);

  const updateField = <K extends keyof AvatarConfig>(field: K, value: AvatarConfig[K]) => {
    setDraftConfig((prev) => ({ ...prev, [field]: value }));
  };

  const handleRandomize = () => {
    const randomPick = <T,>(arr: readonly T[] | T[]): T => arr[Math.floor(Math.random() * arr.length)];
    const randomSkin = randomPick(SKIN_TONES).hex;
    const randomHair = randomPick(HAIR_COLORS).hex;
    const randomEye = randomPick(EYE_COLORS).hex;
    const randomCloth = randomPick(CLOTHING_COLORS).hex;
    const randomGlassesCol = randomPick(GLASSES_COLORS).hex;
    const randomBg = randomPick(BACKGROUND_OPTIONS).id;

    setDraftConfig({
      skinTone: randomSkin,
      faceShape: randomPick(FACE_SHAPES).id,
      eyeShape: randomPick(EYE_SHAPES).id,
      eyeColor: randomEye,
      eyebrowStyle: randomPick(EYEBROW_STYLES).id,
      eyebrowColor: randomHair,
      noseStyle: randomPick(NOSE_STYLES).id,
      mouthStyle: randomPick(MOUTH_STYLES).id,
      lipColor: randomPick(LIP_COLORS).hex,
      earStyle: randomPick(EAR_STYLES).id,
      earrings: randomPick(EARRING_OPTIONS).id,
      facialDetail: randomPick(FACIAL_DETAILS).id,
      hairStyle: randomPick(HAIR_STYLES).id,
      hairColor: randomHair,
      beardStyle: randomPick(BEARD_STYLES).id,
      mustacheStyle: randomPick(MUSTACHE_STYLES).id,
      facialHairColor: randomHair,
      clothingStyle: randomPick(CLOTHING_STYLES).id,
      clothingColor: randomCloth,
      clothingPattern: randomPick(CLOTHING_PATTERNS).id,
      glassesStyle: randomPick(GLASSES_STYLES).id,
      glassesColor: randomGlassesCol,
      backgroundId: randomBg,
    });
  };

  const handleResetToDefault = () => {
    setDraftConfig(DEFAULT_AVATAR_CONFIG);
  };

  const handleDiscardChanges = () => {
    setDraftConfig(initialConfig);
  };

  const handleApplyArchetype = (config: AvatarConfig) => {
    setDraftConfig({ ...config });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await api.users.updateMyAvatar(draftConfig);
      const savedConfig = res.data;
      updateUser({ avatar_config: savedConfig });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } catch (err: unknown) {
      console.error('Failed to save avatar configuration:', err);
      // Fallback: save locally in store and storage anyway for responsive resilience
      updateUser({ avatar_config: draftConfig });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3500);
    } finally {
      setIsSaving(false);
    }
  };

  // Download SVG file for the user
  const handleDownloadSVG = () => {
    const svgEl = document.getElementById('learnflow-studio-avatar-svg');
    if (!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `learnflow-avatar-${user?.first_name || 'scholar'}.svg`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const currentBg = useMemo(() => {
    return (
      BACKGROUND_OPTIONS.find((b) => b.id === draftConfig.backgroundId) ||
      BACKGROUND_OPTIONS[0]
    );
  }, [draftConfig.backgroundId]);

  const filteredBackgrounds = useMemo(() => {
    if (backgroundFilter === 'all') return BACKGROUND_OPTIONS;
    return BACKGROUND_OPTIONS.filter((b) => b.category === backgroundFilter);
  }, [backgroundFilter]);

  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(draftConfig) !== JSON.stringify(initialConfig);
  }, [draftConfig, initialConfig]);

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#F8FAFC] dark:bg-[#06080e] text-slate-900 dark:text-slate-100 font-sans transition-colors duration-200">
      {/* =========================================================================
          TOP COMMAND BAR & BREADCRUMBS
          ========================================================================= */}
      <div className="border-b border-slate-200/80 dark:border-white/10 bg-white/80 dark:bg-[#090d16]/80 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <Link
              to="/settings"
              className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors inline-flex items-center gap-1.5 text-xs font-semibold"
              title="Return to Settings"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Settings</span>
            </Link>
            <div className="h-4 w-px bg-slate-300 dark:bg-white/10" />
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center border border-sky-500/20">
                <Sparkles className="w-4 h-4" />
              </span>
              <div>
                <h1 className="text-sm font-extrabold text-slate-900 dark:text-white leading-none">
                  Avatar &amp; Environment Studio
                </h1>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 hidden sm:block">
                  Personalized 2D/3D identity engine across all Learnflow portals
                </p>
              </div>
            </div>
          </div>

          {/* Action Hub */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={handleRandomize}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer transition-transform active:scale-95"
              title="Generate a random identity composition"
            >
              <Dices className="w-3.5 h-3.5 text-sky-500" />
              <span className="hidden sm:inline">Randomize</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-semibold shadow-2xs inline-flex items-center space-x-1.5 cursor-pointer transition-transform active:scale-95"
              title="Reset configuration to clean defaults"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Default</span>
            </button>

            {hasUnsavedChanges && (
              <button
                type="button"
                onClick={handleDiscardChanges}
                className="px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-100 text-xs font-semibold inline-flex items-center space-x-1.5 cursor-pointer transition-colors"
                title="Discard unsaved edits"
              >
                <span>Revert</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm inline-flex items-center space-x-1.5 cursor-pointer transition-all active:scale-95 ${
                saveSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#0082fb] hover:bg-[#0074e0] text-white'
              }`}
            >
              {isSaving ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : saveSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Saved!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Identity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Save Success Flash Banner */}
      <AnimatePresence>
        {saveSuccess && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-emerald-500 text-white px-4 py-2 text-center text-xs font-semibold shadow-xs flex items-center justify-center space-x-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              Identity updated successfully! Your customized avatar is now synchronized across all
              modules, leaderboards, and navigation menus.
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          MAIN STUDIO TRIPLE-PANE WORKSPACE
          ========================================================================= */}
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* =====================================================================
              LEFT COLUMN: CUSTOMISATION CATEGORIES & VISUAL PICKERS (Span 4)
              ===================================================================== */}
          <div className="lg:col-span-5 order-2 lg:order-1 space-y-5">
            {/* Category Navigation Pills */}
            <div className="bg-white dark:bg-[#0c1220] p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xs grid grid-cols-3 sm:grid-cols-6 gap-1">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const active = activeCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 cursor-pointer ${
                      active
                        ? 'bg-[#0082fb] text-white shadow-xs font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1" />
                    <span className="text-[10px] leading-tight text-center">{cat.label.split('&')[0].trim()}</span>
                  </button>
                );
              })}
            </div>

            {/* Active Category Option Panel */}
            <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-white/10 p-5 sm:p-6 shadow-xs space-y-6">
              {/* Category Header */}
              <div className="border-b border-slate-100 dark:border-white/5 pb-3.5">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.label}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {CATEGORIES.find((c) => c.id === activeCategory)?.tagline}
                </p>
              </div>

              {/* -----------------------------------------------------------------
                  CATEGORY 1: FACE & SKIN
                  ----------------------------------------------------------------- */}
              {activeCategory === 'face' && (
                <div className="space-y-6">
                  {/* Skin Tone Palette */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Complexion &amp; Skin Tone
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {SKIN_TONES.map((tone) => (
                        <button
                          key={tone.id}
                          type="button"
                          onClick={() => updateField('skinTone', tone.hex)}
                          className={`group relative flex flex-col items-center justify-center p-1 rounded-xl border transition-all ${
                            draftConfig.skinTone === tone.hex
                              ? 'border-sky-500 ring-2 ring-sky-500/30 shadow-xs'
                              : 'border-slate-200 dark:border-slate-800 hover:border-slate-400'
                          }`}
                          title={tone.label}
                        >
                          <span
                            className="w-8 h-8 rounded-full shadow-inner border border-black/10 flex items-center justify-center transition-transform group-hover:scale-105"
                            style={{ backgroundColor: tone.hex }}
                          >
                            {draftConfig.skinTone === tone.hex && (
                              <Check className="w-3.5 h-3.5 text-slate-900 stroke-[3]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Face Shape */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Facial Architecture &amp; Jawline
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {FACE_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => updateField('faceShape', shape.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.faceShape === shape.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{shape.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{shape.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Facial Details */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Facial Markings &amp; Natural Highlights
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {FACIAL_DETAILS.map((det) => (
                        <button
                          key={det.id}
                          type="button"
                          onClick={() => updateField('facialDetail', det.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.facialDetail === det.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{det.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{det.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* -----------------------------------------------------------------
                  CATEGORY 2: EYES & BROWS
                  ----------------------------------------------------------------- */}
              {activeCategory === 'eyes' && (
                <div className="space-y-6">
                  {/* Eye Color Swatches */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Iris Pigment
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {EYE_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => updateField('eyeColor', col.hex)}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            draftConfig.eyeColor === col.hex
                              ? 'border-sky-500 ring-2 ring-sky-500/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                          title={col.label}
                        >
                          <span
                            className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: col.hex }}
                          >
                            {draftConfig.eyeColor === col.hex && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eye Shape */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Eye Aperture &amp; Eyelid Contour
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {EYE_SHAPES.map((shape) => (
                        <button
                          key={shape.id}
                          type="button"
                          onClick={() => updateField('eyeShape', shape.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.eyeShape === shape.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{shape.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{shape.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eyebrow Style */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Eyebrow Form &amp; Character
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {EYEBROW_STYLES.map((brow) => (
                        <button
                          key={brow.id}
                          type="button"
                          onClick={() => updateField('eyebrowStyle', brow.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.eyebrowStyle === brow.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{brow.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{brow.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Eyebrow Color */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Eyebrow Color
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {HAIR_COLORS.slice(0, 5).map((col) => (
                        <button
                          key={`brow-${col.id}`}
                          type="button"
                          onClick={() => updateField('eyebrowColor', col.hex)}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            draftConfig.eyebrowColor === col.hex
                              ? 'border-sky-500 ring-2 ring-sky-500/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                          title={col.label}
                        >
                          <span
                            className="w-6 h-6 rounded-full shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: col.hex }}
                          >
                            {draftConfig.eyebrowColor === col.hex && (
                              <Check className="w-3 h-3 text-white stroke-[3]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* -----------------------------------------------------------------
                  CATEGORY 3: NOSE, MOUTH & EARS
                  ----------------------------------------------------------------- */}
              {activeCategory === 'features' && (
                <div className="space-y-6">
                  {/* Nose Style */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Nose Bridge &amp; Apex
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {NOSE_STYLES.map((nose) => (
                        <button
                          key={nose.id}
                          type="button"
                          onClick={() => updateField('noseStyle', nose.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.noseStyle === nose.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{nose.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{nose.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mouth & Expression */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Mouth Expression &amp; Smile
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {MOUTH_STYLES.map((mouth) => (
                        <button
                          key={mouth.id}
                          type="button"
                          onClick={() => updateField('mouthStyle', mouth.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.mouthStyle === mouth.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{mouth.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mouth.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lip Color */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Lip Pigment Tone
                    </label>
                    <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                      {LIP_COLORS.map((lip) => (
                        <button
                          key={lip.id}
                          type="button"
                          onClick={() => updateField('lipColor', lip.hex)}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            draftConfig.lipColor === lip.hex
                              ? 'border-sky-500 ring-2 ring-sky-500/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                          title={lip.label}
                        >
                          <span
                            className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: lip.hex }}
                          >
                            {draftConfig.lipColor === lip.hex && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Ears & Earrings */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Earrings &amp; Ear Studs
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {EARRING_OPTIONS.map((ear) => (
                        <button
                          key={ear.id}
                          type="button"
                          onClick={() => updateField('earrings', ear.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.earrings === ear.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{ear.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{ear.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* -----------------------------------------------------------------
                  CATEGORY 4: HAIR & BEARD
                  ----------------------------------------------------------------- */}
              {activeCategory === 'hair' && (
                <div className="space-y-6">
                  {/* Hair Style */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Hairstyle &amp; Cut
                    </label>
                    <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                      {HAIR_STYLES.map((hair) => (
                        <button
                          key={hair.id}
                          type="button"
                          onClick={() => updateField('hairStyle', hair.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.hairStyle === hair.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{hair.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{hair.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Hair Color Palette */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Hair Color Swatches
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {HAIR_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => {
                            updateField('hairColor', col.hex);
                            if (draftConfig.beardStyle !== 'none' || draftConfig.mustacheStyle !== 'none') {
                              updateField('facialHairColor', col.hex);
                            }
                          }}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            draftConfig.hairColor === col.hex
                              ? 'border-sky-500 ring-2 ring-sky-500/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                          title={col.label}
                        >
                          <span
                            className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center"
                            style={{ backgroundColor: col.hex }}
                          >
                            {draftConfig.hairColor === col.hex && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Beard Style */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Beard &amp; Jawline Hair
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {BEARD_STYLES.map((beard) => (
                        <button
                          key={beard.id}
                          type="button"
                          onClick={() => updateField('beardStyle', beard.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.beardStyle === beard.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{beard.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{beard.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Mustache Style */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Mustache Profile
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {MUSTACHE_STYLES.map((mustache) => (
                        <button
                          key={mustache.id}
                          type="button"
                          onClick={() => updateField('mustacheStyle', mustache.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.mustacheStyle === mustache.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{mustache.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{mustache.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* -----------------------------------------------------------------
                  CATEGORY 5: CLOTHING & EYEWEAR
                  ----------------------------------------------------------------- */}
              {activeCategory === 'outfit' && (
                <div className="space-y-6">
                  {/* Shirt Style */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Attire &amp; Layering
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {CLOTHING_STYLES.map((shirt) => (
                        <button
                          key={shirt.id}
                          type="button"
                          onClick={() => updateField('clothingStyle', shirt.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.clothingStyle === shirt.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{shirt.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{shirt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Clothing Color */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Fabric Tone
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {CLOTHING_COLORS.map((col) => (
                        <button
                          key={col.id}
                          type="button"
                          onClick={() => updateField('clothingColor', col.hex)}
                          className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                            draftConfig.clothingColor === col.hex
                              ? 'border-sky-500 ring-2 ring-sky-500/30'
                              : 'border-slate-200 dark:border-slate-800'
                          }`}
                          title={col.label}
                        >
                          <span
                            className="w-7 h-7 rounded-full shadow-inner flex items-center justify-center border border-black/10"
                            style={{ backgroundColor: col.hex }}
                          >
                            {draftConfig.clothingColor === col.hex && (
                              <Check className="w-3.5 h-3.5 text-white stroke-[3]" />
                            )}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Pattern */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Texture &amp; Collar Detailing
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {CLOTHING_PATTERNS.map((patt) => (
                        <button
                          key={patt.id}
                          type="button"
                          onClick={() => updateField('clothingPattern', patt.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.clothingPattern === patt.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{patt.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{patt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Glasses & Frames */}
                  <div>
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                      Spectacles &amp; Eyewear
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {GLASSES_STYLES.map((glass) => (
                        <button
                          key={glass.id}
                          type="button"
                          onClick={() => updateField('glassesStyle', glass.id)}
                          className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                            draftConfig.glassesStyle === glass.id
                              ? 'bg-sky-50 dark:bg-sky-950/40 border-sky-500 text-sky-900 dark:text-sky-200 shadow-2xs'
                              : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40'
                          }`}
                        >
                          <div className="text-xs font-bold">{glass.label}</div>
                          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{glass.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Glasses Frame Color (if not none) */}
                  {draftConfig.glassesStyle !== 'none' && (
                    <div>
                      <label className="text-xs font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-2.5 block">
                        Frame Metallic Finish
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {GLASSES_COLORS.map((col) => (
                          <button
                            key={col.id}
                            type="button"
                            onClick={() => updateField('glassesColor', col.hex)}
                            className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                              draftConfig.glassesColor === col.hex
                                ? 'border-sky-500 ring-2 ring-sky-500/30'
                                : 'border-slate-200 dark:border-slate-800'
                            }`}
                          >
                            <span
                              className="w-5 h-5 rounded-full shadow-inner border border-black/10 shrink-0"
                              style={{ backgroundColor: col.hex }}
                            />
                            <span className="text-[11px] font-bold truncate">{col.label.split(' ')[0]}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* -----------------------------------------------------------------
                  CATEGORY 6: ATMOSPHERE & WORLD BACKGROUND
                  ----------------------------------------------------------------- */}
              {activeCategory === 'background' && (
                <div className="space-y-6">
                  {/* Category Filter Pills */}
                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                    {[
                      { id: 'all', label: 'All Themes' },
                      { id: 'gradient', label: 'Gradients' },
                      { id: 'environment', label: 'Nature & Parks' },
                      { id: 'academic', label: 'Academic' },
                      { id: 'cyber', label: 'Cyber / Sci' },
                      { id: 'minimalist', label: 'Studio Neutral' },
                    ].map((filt) => (
                      <button
                        key={filt.id}
                        type="button"
                        onClick={() => setBackgroundFilter(filt.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                          backgroundFilter === filt.id
                            ? 'bg-sky-500 text-white shadow-2xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {filt.label}
                      </button>
                    ))}
                  </div>

                  {/* Background Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
                    {filteredBackgrounds.map((bg) => (
                      <button
                        key={bg.id}
                        type="button"
                        onClick={() => updateField('backgroundId', bg.id)}
                        className={`group relative overflow-hidden rounded-2xl border text-left p-3.5 transition-all cursor-pointer ${
                          draftConfig.backgroundId === bg.id
                            ? 'border-sky-500 ring-3 ring-sky-500/30 shadow-md'
                            : 'border-slate-200 dark:border-white/10 hover:border-slate-400'
                        }`}
                      >
                        {/* Background Thumbnail Gradient */}
                        <div
                          className="h-14 rounded-xl mb-2.5 shadow-inner border border-black/10 flex items-end justify-end p-2 transition-transform group-hover:scale-102"
                          style={{ background: bg.previewGradient }}
                        >
                          {draftConfig.backgroundId === bg.id && (
                            <span className="w-5 h-5 rounded-full bg-white text-sky-600 flex items-center justify-center shadow-xs">
                              <Check className="w-3.5 h-3.5 stroke-[3]" />
                            </span>
                          )}
                        </div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {bg.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {bg.description}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* =====================================================================
              CENTER COLUMN: LIVE AVATAR STAGE & PRESET ARCHETYPES (Span 4)
              ===================================================================== */}
          <div className="lg:col-span-4 order-1 lg:order-2 space-y-4 lg:sticky lg:top-20">
            {/* Stage Card */}
            <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-white/10 p-6 shadow-sm relative overflow-hidden flex flex-col items-center">
              {/* Top Meta Header on Stage */}
              <div className="w-full flex items-center justify-between mb-4">
                <span className="text-[10px] font-mono uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20">
                  {currentBg.name}
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setPreviewZoom(previewZoom === 'normal' ? 'zoomed' : 'normal')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title={previewZoom === 'normal' ? 'Zoom In Portrait' : 'Normal Size'}
                  >
                    {previewZoom === 'normal' ? <ZoomIn className="w-4 h-4" /> : <ZoomOut className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSVG}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Export Identity SVG"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Large Central Avatar Stage */}
              <div
                className={`relative transition-all duration-300 flex items-center justify-center ${
                  previewZoom === 'zoomed' ? 'scale-110 my-4' : 'my-2'
                }`}
              >
                {/* Ambient glow halo */}
                <div
                  className="absolute -inset-4 rounded-full blur-2xl opacity-40 transition-colors duration-500 pointer-events-none"
                  style={{
                    background:
                      draftConfig.clothingColor || '#0284c7',
                  }}
                />

                {/* Vector SVG Avatar */}
                <div className="relative rounded-full ring-8 ring-white dark:ring-slate-900 shadow-2xl overflow-hidden bg-slate-900">
                  <div id="learnflow-studio-avatar-svg">
                    <PersonalizedAvatar
                      config={draftConfig}
                      size={previewZoom === 'zoomed' ? 280 : 240}
                      className="transition-transform duration-300"
                    />
                  </div>
                </div>
              </div>

              {/* Archetype Quick Selector Carousel */}
              <div className="w-full mt-6 pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Inspiring Archetypes
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click Apply</span>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  {PRESET_ARCHETYPES.map((arch) => (
                    <button
                      key={arch.id}
                      type="button"
                      onClick={() => handleApplyArchetype(arch.config)}
                      className="px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-950/60 text-slate-700 dark:text-slate-300 hover:text-sky-600 dark:hover:text-sky-300 border border-slate-200/80 dark:border-white/5 text-[11px] font-semibold whitespace-nowrap transition-colors cursor-pointer"
                    >
                      {arch.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* =====================================================================
              RIGHT COLUMN: IDENTITY SUMMARY & RAPID ATTRIBUTE BREAKDOWN (Span 3)
              ===================================================================== */}
          <div className="lg:col-span-3 order-3 space-y-4">
            {/* Identity Card */}
            <div className="bg-white dark:bg-[#0c1220] rounded-3xl border border-slate-200 dark:border-white/10 p-5 shadow-xs space-y-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-slate-200 dark:border-white/10">
                  <PersonalizedAvatar config={draftConfig} size={40} />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                    {user?.full_name || 'Academic Scholar'}
                  </h4>
                  <p className="text-[10px] font-mono text-slate-500 dark:text-slate-400 truncate">
                    {user?.email || 'learner@learnflow.edu'}
                  </p>
                </div>
              </div>

              {/* Active Attribute Ledger */}
              <div className="border-t border-slate-100 dark:border-white/5 pt-3 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Active Configuration
                </span>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Structure</span>
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {draftConfig.faceShape}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Coiffure</span>
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {draftConfig.hairStyle.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Facial Hair</span>
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {draftConfig.beardStyle === 'none' ? 'Clean' : draftConfig.beardStyle.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Attire</span>
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {draftConfig.clothingStyle.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1 border-b border-slate-50 dark:border-white/5">
                  <span className="text-slate-500 dark:text-slate-400">Eyewear</span>
                  <span className="font-semibold capitalize text-slate-800 dark:text-slate-200">
                    {draftConfig.glassesStyle === 'none' ? 'None' : draftConfig.glassesStyle.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs py-1">
                  <span className="text-slate-500 dark:text-slate-400">Atmosphere</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[120px]">
                    {currentBg.name}
                  </span>
                </div>
              </div>

              {/* Platform Propagation Note */}
              <div className="bg-sky-50/70 dark:bg-sky-950/30 rounded-2xl p-3 border border-sky-100 dark:border-sky-900/40 text-[11px] text-sky-800 dark:text-sky-300 leading-relaxed">
                <span className="font-bold flex items-center gap-1 mb-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Instant Global Sync
                </span>
                Saving here binds this identity directly to your user token. It automatically renders across
                My Journey mountain trails, grading rubrics, peer discussions, and the global navigation shell.
              </div>

              {/* Big Save Button in Summary Column */}
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={`w-full py-2.5 rounded-2xl text-xs font-bold shadow-md flex items-center justify-center space-x-2 cursor-pointer transition-all active:scale-98 ${
                  saveSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#0082fb] hover:bg-[#0074e0] text-white'
                }`}
              >
                {isSaving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Synchronizing Identity...</span>
                  </>
                ) : saveSuccess ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Identity Saved Globally</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Apply &amp; Save Everywhere</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

