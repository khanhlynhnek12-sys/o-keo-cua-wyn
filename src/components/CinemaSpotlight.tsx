import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Copy,
  Heart,
  MessageSquare,
  Sparkles,
  Candy,
  Check,
  Pencil,
  Trash2,
} from 'lucide-react';
import { Character } from '../types/character';
import { sound } from '../utils/audio';

interface CinemaSpotlightProps {
  characters: Character[];
  selectedIndex: number;
  onSelectIndex: (index: number) => void;
  onViewDetails: (char: Character) => void;
  onToggleFavorite: (id: string) => void;
  onCopyFirstMessage: (message: string) => void;
  onCopyLink: (link: string) => void;
  favorites: Set<string>;
  onTasted?: (id: string) => void;
  isAdmin?: boolean;
  onEdit?: (character: Character) => void;
  onDelete?: (id: string) => void;
}

export const CinemaSpotlight: React.FC<CinemaSpotlightProps> = ({
  characters,
  selectedIndex,
  onSelectIndex,
  onViewDetails,
  onToggleFavorite,
  onCopyFirstMessage,
  onCopyLink,
  favorites,
  onTasted,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);
  const [copiedMsg, setCopiedMsg] = React.useState(false);

  if (characters.length === 0) return null;
  const current = characters[selectedIndex] || characters[0];
  const isFavorite = favorites.has(current.id);

  const handlePrev = () => {
    sound.playPop();
    const nextIdx = (selectedIndex - 1 + characters.length) % characters.length;
    onSelectIndex(nextIdx);
  };

  const handleNext = () => {
    sound.playPop();
    const nextIdx = (selectedIndex + 1) % characters.length;
    onSelectIndex(nextIdx);
  };

  return (
    <div className="relative w-full max-w-6xl mx-auto py-4 px-2">
      {/* Ambient background glow matching character vibe */}
      <div
        className="absolute inset-0 -z-10 blur-3xl opacity-25 dark:opacity-20 transition-all duration-700 pointer-events-none rounded-3xl"
        style={{
          background: `radial-gradient(circle at center, ${current.themeColor?.accent || '#f43f5e'} 0%, transparent 70%)`,
        }}
      />

      <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-rose-100 dark:border-slate-800 shadow-xl overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 min-h-[480px]"
          >
            {/* Visual Portrait Frame (5 cols) */}
            <div className="lg:col-span-5 relative overflow-hidden bg-rose-50 dark:bg-slate-800 min-h-[340px] lg:min-h-full">
              <img
                src={current.avatar}
                alt={current.name}
                className="w-full h-full object-cover object-top hover:scale-105 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

              {/* Top Favorite & Admin Controls */}
              <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
                {isAdmin && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        onEdit?.(current);
                      }}
                      className="p-2.5 rounded-full bg-amber-500/90 hover:bg-amber-600 text-white backdrop-blur-md transition-all shadow-md"
                      title="Sửa nhân vật (QTV)"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playPop();
                        if (confirm(`Nàng có chắc muốn xóa nhân vật "${current.name}" không?`)) {
                          onDelete?.(current.id);
                        }
                      }}
                      className="p-2.5 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white backdrop-blur-md transition-all shadow-md"
                      title="Xóa nhân vật (QTV)"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={() => {
                    sound.playHeart();
                    onToggleFavorite(current.id);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-md transition-all ${
                    isFavorite
                      ? 'bg-rose-500 text-white shadow-md'
                      : 'bg-black/45 text-white hover:bg-black/65'
                  }`}
                  title={`${isFavorite ? 'Bỏ thích' : 'Yêu thích'} (${current.likesCount || 0} lượt tim)`}
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                  <span className="text-xs font-bold tabular-nums">{current.likesCount || 0}</span>
                </button>
              </div>

              {/* Bottom Tagline on Image */}
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="text-xs font-semibold text-rose-300 drop-shadow-xs">
                  {current.sweetFlavor}
                </span>
                <h3 className="text-2xl font-black drop-shadow-xs leading-snug">
                  {current.name}
                </h3>
                <p className="text-xs text-slate-200 line-clamp-2 mt-1 drop-shadow-xs">
                  {current.tagline}
                </p>
              </div>
            </div>

            {/* Content & Details (7 cols) */}
            <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                {/* Genre & Index indicator */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400 font-semibold tracking-wide">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{current.genre}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-400 tabular-nums">
                    {selectedIndex + 1} / {characters.length}
                  </span>
                </div>

                <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {current.name}
                </h2>

                {/* Backstory excerpt */}
                <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-4">
                  {current.backstory}
                </div>

                {/* Opening Message Highlight Box */}
                <div className="p-4 bg-rose-50/70 dark:bg-slate-800/80 rounded-2xl border border-rose-100 dark:border-slate-700/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-rose-600 dark:text-rose-400">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />
                      Tin nhắn đầu tiên
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playSuccess();
                        onCopyFirstMessage(current.firstMessage);
                        setCopiedMsg(true);
                        setTimeout(() => setCopiedMsg(false), 2000);
                      }}
                      className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 flex items-center gap-1 transition-colors"
                    >
                      {copiedMsg ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Chép tin nhắn</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs sm:text-sm italic font-medium text-slate-700 dark:text-slate-200 leading-relaxed line-clamp-3">
                    "{current.firstMessage}"
                  </p>
                </div>
              </div>

              {/* Bottom Nav & Actions */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                {/* Prev / Next buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Nhân vật trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={handleNext}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Nhân vật kế tiếp"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  <div className="flex gap-1 ml-1 overflow-x-auto max-w-[140px] no-scrollbar">
                    {characters.map((c, i) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          sound.playPop();
                          onSelectIndex(i);
                        }}
                        className={`w-2 h-2 rounded-full transition-all ${
                          i === selectedIndex
                            ? 'w-6 bg-rose-500'
                            : 'bg-slate-300 dark:bg-slate-700 hover:bg-rose-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Primary actions: Link and Detail */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      sound.playSuccess();
                      onCopyLink(current.characterLink);
                      setCopiedLink(true);
                      setTimeout(() => setCopiedLink(false), 2000);
                    }}
                    className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                    title="Sao chép link nhân vật"
                  >
                    {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <a
                    href={current.characterLink || '#'}
                    target={current.characterLink && current.characterLink !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={() => {
                      sound.playChime();
                      if (current.characterLink && current.characterLink !== '#') {
                        onTasted?.(current.id);
                      }
                    }}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-xs hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
                    title={`Đã có ${current.tastedCount || 0} nàng thưởng thức kẹo`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                    <span>Mở kẹo thưởng thức ({current.tastedCount || 0})</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      onViewDetails(current);
                    }}
                    className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-900 rounded-xl transition-all whitespace-nowrap cursor-pointer"
                  >
                    <span>Xem đầy đủ</span>
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};
