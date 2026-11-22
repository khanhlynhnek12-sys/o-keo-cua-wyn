import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SlidersHorizontal, X, Moon, Heart, Sparkles } from 'lucide-react';
import { sound } from '../utils/audio';

export type EffectType = 'hearts';

export type HeartPalette = 'all' | 'sweet_pink' | 'romantic_red' | 'sparkle_love';

export interface FloatingEffectConfig {
  activeEffects: EffectType[];
  density: number; // 6 to 36
  speed: 'slow' | 'normal' | 'fast';
  brightness: number; // 0 to 80 (% dark overlay to dim background)
  enabled: boolean;
  heartPalette?: HeartPalette;
  // Legacy backward-compat field
  effect?: string;
}

export const DEFAULT_FLOATING_CONFIG: FloatingEffectConfig = {
  activeEffects: ['hearts'],
  density: 20,
  speed: 'normal',
  brightness: 0,
  enabled: true,
  heartPalette: 'all',
};

export const AVAILABLE_EFFECTS: { id: EffectType; label: string; emoji: string }[] = [
  { id: 'hearts', label: 'Trái tim', emoji: '💖' },
];

export const HEART_PALETTES: { id: HeartPalette; label: string; emojis: string[] }[] = [
  { id: 'all', label: 'Đa sắc trái tim', emojis: ['💖', '💕', '💗', '💓', '❤️', '💌', '💘', '💝'] },
  { id: 'sweet_pink', label: 'Hồng kẹo ngọt', emojis: ['💖', '💕', '💗', '💓', '💝', '💌'] },
  { id: 'romantic_red', label: 'Đỏ nồng nàn', emojis: ['❤️', '💘', '💌', '💓', '💖'] },
  { id: 'sparkle_love', label: 'Lấp lánh tình yêu', emojis: ['💖', '💝', '✨', '💕', '💗'] },
];

export const EFFECT_EMOJIS: Record<EffectType, string[]> = {
  hearts: ['💖', '💕', '💗', '💓', '❤️', '💌', '💘', '💝'],
};

const SPEED_FACTORS: Record<'slow' | 'normal' | 'fast', number> = {
  slow: 1.45,
  normal: 1.0,
  fast: 0.72,
};

interface FloatingParticlesProps {
  config: FloatingEffectConfig;
  onUpdateConfig: (cfg: FloatingEffectConfig) => void;
}

interface ParticleItem {
  id: string;
  emoji: string;
  left: number; // percentage vw
  size: number; // rem
  duration: number; // seconds
  delay: number; // negative seconds so animation is continuous at all heights
  rotation: number; // deg
  sway: number; // px horizontal drift
  opacity: number;
  textShadow?: string;
}

export const FloatingParticles: React.FC<FloatingParticlesProps> = ({
  config,
  onUpdateConfig,
}) => {
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);

  // Active palette emojis (strictly hearts only)
  const currentEmojis = useMemo(() => {
    const selectedPalette = HEART_PALETTES.find((p) => p.id === config.heartPalette) || HEART_PALETTES[0];
    return selectedPalette.emojis;
  }, [config.heartPalette]);

  // Generate particles array with golden ratio dispersion across entire screen and steady constant speed
  const particles = useMemo(() => {
    if (!config.enabled) return [];

    const userDensity = typeof config.density === 'number' ? config.density : 20;
    const speedMult = SPEED_FACTORS[config.speed] || 1.0;

    // Particle count between 8 and 36 (default 20: perfectly balanced and scattered)
    const totalCount = Math.min(36, Math.max(8, userDensity));
    const list: ParticleItem[] = [];

    // Steady falling base duration
    const baseDuration = 12.5;
    const duration = baseDuration * speedMult;

    // Golden ratio constant for optimal low-discrepancy 1D spatial distribution across entire web width
    const PHI = 0.618033988749895;

    for (let globalIndex = 0; globalIndex < totalCount; globalIndex++) {
      // 1. Emoji from the selected palette
      const emoji = currentEmojis[globalIndex % currentEmojis.length];

      // 2. Uniform quasi-random horizontal distribution across [2.5vw, 96.5vw]
      // Weyl sequence with golden ratio guarantees uniform scattering across the entire screen (left, center, right) without clumps or hollow zones
      const horizontalFraction = (globalIndex * PHI) % 1;
      const left = 2.5 + horizontalFraction * 94; // 2.5vw to 96.5vw

      // 3. Gentle size variations for subtle depth
      const sizeVariants = [0.95, 1.15, 1.0, 1.25, 0.9, 1.1, 1.05, 1.2];
      const size = sizeVariants[globalIndex % sizeVariants.length];

      // 4. Subtle tilt angle (-24deg to +24deg)
      const tiltVariants = [-22, 18, -15, 24, -20, 14, -12, 22];
      const rotation = tiltVariants[globalIndex % tiltVariants.length];

      // 5. Gentle horizontal sway amplitude (e.g. 15px to 28px)
      const swayVariants = [18, -20, 24, -18, 26, -22, 16, -24];
      const sway = swayVariants[globalIndex % swayVariants.length];

      // 6. Staggered negative delays for seamless continuous rain of hearts across the entire vertical height
      // Staggering evenly with globalIndex / totalCount ensures hearts are already present at every vertical level on load
      const staggerRatio = globalIndex / totalCount;
      const delay = -1 * (staggerRatio * duration);

      list.push({
        id: `heart-${globalIndex}`,
        emoji,
        left,
        size,
        duration,
        delay,
        rotation,
        sway,
        opacity: 0.88,
        textShadow: '0 2px 10px rgba(255, 105, 180, 0.35)',
      });
    }

    return list;
  }, [config.enabled, config.density, config.speed, currentEmojis]);

  const densityLabel = useMemo(() => {
    const d = config.density ?? 20;
    if (d <= 12) return 'Thưa nhẹ rải rác';
    if (d <= 24) return 'Vừa vặn · Rải đều 💖';
    return 'Rơi rộ ngập tràn 💗';
  }, [config.density]);

  return (
    <>
      {/* Hardware-Accelerated CSS Keyframes for Steady Falling Hearts */}
      <style>{`
        @keyframes floatSteadyHeartFall {
          0% {
            transform: translate3d(0, -10vh, 0) rotate(0deg);
            opacity: 0;
          }
          6% {
            opacity: var(--p-opacity, 0.88);
          }
          25% {
            transform: translate3d(var(--sway-x, 20px), 20vh, 0) rotate(calc(var(--rot, 20deg) * 0.65));
          }
          50% {
            transform: translate3d(0, 50vh, 0) rotate(var(--rot, 20deg));
          }
          75% {
            transform: translate3d(calc(var(--sway-x, 20px) * -0.85), 80vh, 0) rotate(calc(var(--rot, 20deg) * 0.35));
          }
          94% {
            opacity: var(--p-opacity, 0.88);
          }
          100% {
            transform: translate3d(0, 110vh, 0) rotate(0deg);
            opacity: 0;
          }
        }
      `}</style>

      {/* Background Dimness / Dark Overlay */}
      {config.brightness > 0 && (
        <div
          className="fixed inset-0 pointer-events-none z-5 transition-opacity duration-300 bg-slate-950"
          style={{ opacity: (config.brightness / 100) * 0.8 }}
          aria-hidden="true"
        />
      )}

      {/* Floating Hearts Layer - Rải rác khắp toàn bộ màn hình, tốc độ rơi đều ổn định */}
      {config.enabled && (
        <div
          className="fixed inset-0 pointer-events-none z-10 overflow-hidden"
          aria-hidden="true"
        >
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute pointer-events-none select-none will-change-transform"
              style={{
                left: `${p.left}vw`,
                fontSize: `${p.size}rem`,
                animationName: 'floatSteadyHeartFall',
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                ['--sway-x' as string]: `${p.sway}px`,
                ['--rot' as string]: `${p.rotation}deg`,
                ['--p-opacity' as string]: p.opacity,
                textShadow: p.textShadow,
              }}
            >
              {p.emoji}
            </div>
          ))}
        </div>
      )}

      {/* Control Widget Modal at Bottom-Right */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
        <AnimatePresence>
          {isWidgetOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 14 }}
              className="w-80 sm:w-92 bg-[#251522]/95 backdrop-blur-md rounded-3xl border border-[#ff8db3]/40 p-4 sm:p-5 shadow-2xl space-y-4 text-white max-h-[85vh] overflow-y-auto"
            >
              {/* Widget Header */}
              <div className="flex items-center justify-between pb-2 border-b border-pink-500/20">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
                  <h4 className="text-sm font-bold text-[#ffb0c7]">
                    Hiệu ứng Trái tim rơi 💖
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    setIsWidgetOpen(false);
                  }}
                  className="p-1 text-pink-300 hover:text-white rounded-lg hover:bg-pink-500/20 cursor-pointer transition-colors"
                  aria-label="Đóng bảng tùy chỉnh hiệu ứng"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Toggle Switch */}
              <div className="flex items-center justify-between bg-pink-950/40 p-2.5 rounded-2xl border border-pink-500/20">
                <div className="text-xs">
                  <div className="font-bold text-pink-100">Bật mưa trái tim</div>
                  <div className="text-[10px] text-pink-300">Rải rác khắp màn hình, tốc độ ổn định</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    sound.playPop();
                    onUpdateConfig({
                      ...config,
                      enabled: !config.enabled,
                      activeEffects: ['hearts'],
                    });
                  }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer shadow-xs ${
                    config.enabled
                      ? 'bg-gradient-to-r from-rose-500 to-pink-500 text-white'
                      : 'bg-[#3b2739] text-pink-300 hover:text-white'
                  }`}
                >
                  {config.enabled ? 'Đang bật ✨' : 'Tắt'}
                </button>
              </div>

              {/* Heart Palette Selector */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-pink-300 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-pink-400" />
                  <span>Tone màu trái tim:</span>
                </span>
                <div className="grid grid-cols-2 gap-2">
                  {HEART_PALETTES.map((palette) => {
                    const isSelected = (config.heartPalette || 'all') === palette.id;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          onUpdateConfig({
                            ...config,
                            heartPalette: palette.id,
                            enabled: true,
                            activeEffects: ['hearts'],
                          });
                        }}
                        className={`p-2 rounded-2xl text-xs font-bold transition-all cursor-pointer flex flex-col items-center justify-center gap-1 border ${
                          isSelected
                            ? 'bg-rose-500 text-white border-pink-300 shadow-rose-500/30 scale-102'
                            : 'bg-[#3b2739]/80 text-pink-100 hover:bg-[#4d324b] border-pink-400/30'
                        }`}
                      >
                        <span className="text-sm">{palette.emojis.slice(0, 3).join(' ')}</span>
                        <span className="text-[11px] font-semibold">{palette.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Speed Row */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-pink-300">Tốc độ rơi:</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { id: 'slow' as const, label: 'Chậm rãi 🍃' },
                    { id: 'normal' as const, label: 'Vừa vặn ✨' },
                    { id: 'fast' as const, label: 'Nhanh ⚡' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        onUpdateConfig({ ...config, speed: s.id });
                      }}
                      className={`py-1.5 px-2 rounded-xl text-[11px] font-bold transition-all cursor-pointer border ${
                        config.speed === s.id
                          ? 'bg-pink-600 text-white border-pink-300'
                          : 'bg-[#3b2739]/70 text-pink-200 border-pink-400/20 hover:bg-[#4a2e45]'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Slider Row: Mật độ rơi */}
              <div className="space-y-1.5 pt-1 border-t border-pink-500/20">
                <div className="flex items-center justify-between text-xs text-pink-200">
                  <span className="font-bold flex items-center gap-1.5">
                    <span>Mật độ rơi:</span>
                    <span className="text-pink-300 font-semibold text-[11px] bg-pink-900/60 px-2 py-0.5 rounded-full border border-pink-500/30">
                      {densityLabel}
                    </span>
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={6}
                    max={36}
                    step={1}
                    value={config.density ?? 20}
                    onChange={(e) => {
                      onUpdateConfig({
                        ...config,
                        density: Number(e.target.value),
                      });
                    }}
                    className="w-full accent-rose-400 cursor-pointer h-2 rounded-lg bg-pink-950/60"
                  />
                  <span className="text-xs font-bold text-pink-300 w-5 text-right shrink-0">
                    {config.density ?? 20}
                  </span>
                </div>
              </div>

              {/* Brightness / Darkness Slider */}
              <div className="flex items-center gap-2.5 pt-2 border-t border-pink-500/20">
                <div className="flex items-center gap-1 shrink-0 text-xs font-bold text-pink-200">
                  <Moon className="w-3.5 h-3.5 text-pink-300" />
                  <span>Độ tối nền</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  step={5}
                  value={config.brightness ?? 0}
                  onChange={(e) => {
                    onUpdateConfig({
                      ...config,
                      brightness: Number(e.target.value),
                    });
                  }}
                  className="w-full accent-rose-400 cursor-pointer h-2 rounded-lg bg-pink-950/60"
                />
                <span className="text-[11px] font-bold text-pink-300 shrink-0 w-8 text-right">
                  {config.brightness ?? 0}%
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Floating Toggle Widget Button */}
        <button
          type="button"
          onClick={() => {
            sound.playChime();
            setIsWidgetOpen(!isWidgetOpen);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-[#281523]/90 backdrop-blur-md border border-pink-400/50 text-white text-xs font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all cursor-pointer group"
          title="Tùy chỉnh hiệu ứng trái tim rơi & nền web"
        >
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400 group-hover:scale-125 transition-transform" />
          <span className="text-pink-200 font-bold">Trái tim rơi</span>
          {config.enabled && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
          )}
          <SlidersHorizontal className="w-3.5 h-3.5 text-pink-300 ml-0.5" />
        </button>
      </div>
    </>
  );
};
