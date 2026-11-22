import React from 'react';
import { ExternalLink, Copy, Heart, MessageSquare, ChevronRight, Candy, Sparkles, Pencil, Trash2 } from 'lucide-react';
import { Character } from '../types/character';
import { sound } from '../utils/audio';

interface CharacterCardProps {
  character: Character;
  onSelect: (character: Character) => void;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onCopyFirstMessage: (message: string, e: React.MouseEvent) => void;
  onCopyLink: (link: string, e: React.MouseEvent) => void;
  onTasted?: (id: string) => void;
  isFavorite: boolean;
  isAdmin?: boolean;
  onEdit?: (character: Character, e: React.MouseEvent) => void;
  onDelete?: (id: string, e: React.MouseEvent) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({
  character,
  onSelect,
  onToggleFavorite,
  onCopyFirstMessage,
  onCopyLink,
  onTasted,
  isFavorite,
  isAdmin,
  onEdit,
  onDelete,
}) => {
  const [imageLoaded, setImageLoaded] = React.useState(false);

  return (
    <article
      onClick={() => {
        sound.playPop();
        onSelect(character);
      }}
      className="group relative flex flex-col bg-white dark:bg-slate-800/90 rounded-2xl border border-rose-100/90 dark:border-slate-700/80 hover:border-rose-300 dark:hover:border-rose-500/60 shadow-xs hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden transform hover:-translate-y-1"
    >
      {/* Visual Portrait Frame with Resilient Fallback */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-gradient-to-tr from-rose-100 to-pink-50 dark:from-slate-800 dark:to-slate-900">
        <img
          src={character.avatar}
          alt={`Chân dung ${character.name}`}
          className={`w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          referrerPolicy="no-referrer"
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            setImageLoaded(false);
            e.currentTarget.style.display = 'none';
          }}
        />

        {/* Fallback container if image is loading or unavailable */}
        {!imageLoaded && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-rose-500 dark:text-rose-400 p-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-200/50 dark:bg-slate-700 flex items-center justify-center mb-2">
              <Candy className="w-6 h-6 animate-pulse" />
            </div>
            <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{character.name}</span>
            <span className="text-xs text-rose-600 dark:text-rose-400 font-medium">{character.sweetFlavor}</span>
          </div>
        )}

        {/* Soft contrast scrim at bottom of portrait */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Floating Controls in Top Right (Favorites + Admin Buttons) */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playPop();
                  onEdit?.(character, e);
                }}
                className="p-2 rounded-full bg-amber-500/90 hover:bg-amber-600 text-white backdrop-blur-md transition-all shadow-sm"
                title="Sửa nhân vật (QTV)"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playPop();
                  if (confirm(`Nàng có chắc muốn xóa nhân vật "${character.name}" không?`)) {
                    onDelete?.(character.id, e);
                  }
                }}
                className="p-2 rounded-full bg-rose-600/90 hover:bg-rose-700 text-white backdrop-blur-md transition-all shadow-sm"
                title="Xóa nhân vật (QTV)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              sound.playHeart();
              onToggleFavorite(character.id, e);
            }}
            className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-md transition-all shadow-sm ${
              isFavorite
                ? 'bg-rose-500 text-white shadow-rose-500/40'
                : 'bg-black/40 hover:bg-black/60 text-white'
            }`}
            title={`${isFavorite ? 'Bỏ yêu thích' : 'Thêm vào yêu thích'} (${character.likesCount || 0} lượt tim)`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            <span className="text-[11px] font-bold tabular-nums">{character.likesCount || 0}</span>
          </button>
        </div>

        {/* Prominent Floating Candy Flavor Badge in top-left */}
        <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-rose-600 dark:text-rose-300 text-[11px] font-bold shadow-xs">
          <Candy className="w-3.5 h-3.5 fill-rose-400/40 text-rose-500" />
          <span>{character.sweetFlavor.split('·')[0].trim()}</span>
        </div>

        {/* Overlaid Bottom Title & Genre */}
        <div className="absolute bottom-3 left-3 right-3 text-white">
          <div className="text-[11px] text-rose-200 font-medium tracking-wide flex items-center gap-1.5 drop-shadow-xs">
            <Sparkles className="w-3 h-3 text-amber-300" />
            <span>{character.genre}</span>
          </div>
          <h3 className="text-lg font-bold tracking-tight text-white drop-shadow-xs leading-snug">
            {character.name}
          </h3>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3.5">
        {/* Candy Flavor Callout & Personality Traits */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-semibold">
            <Candy className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Vị kẹo: {character.sweetFlavor}</span>
          </div>
          {character.personalityTraits && character.personalityTraits.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span className="truncate">{character.personalityTraits.join(' · ')}</span>
            </div>
          )}
        </div>

        {/* Backstory summary */}
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed">
          {character.backstory}
        </p>

        {/* First Message box (Tin nhắn đầu) */}
        <div className="relative p-3 bg-rose-50/70 dark:bg-slate-900/70 rounded-xl border border-rose-100/80 dark:border-slate-700/60 text-xs">
          <div className="flex items-center justify-between text-[11px] font-semibold text-rose-600 dark:text-rose-400 mb-1">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              Tin nhắn đầu tiên
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                sound.playSuccess();
                onCopyFirstMessage(character.firstMessage, e);
              }}
              className="text-slate-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors flex items-center gap-1"
              title="Sao chép tin nhắn đầu"
            >
              <Copy className="w-3 h-3" />
              <span>Chép</span>
            </button>
          </div>
          <p className="italic text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
            "{character.firstMessage}"
          </p>
        </div>

        {/* Đã có ... nàng thưởng thức kẹo */}
        <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-50 via-pink-50/70 to-rose-50/50 dark:from-slate-800 dark:to-slate-850 border border-rose-100/90 dark:border-slate-700/70 text-[11px] font-medium text-rose-700 dark:text-rose-300">
          <span className="flex items-center gap-1.5 font-semibold">
            <Candy className="w-3.5 h-3.5 text-rose-500 fill-rose-300 shrink-0" />
            <span>
              Đã có <strong className="text-rose-600 dark:text-rose-400 font-bold">{character.tastedCount || 0}</strong> nàng thưởng thức kẹo
            </span>
          </span>
          <span className="text-[10px] text-pink-400 dark:text-pink-300 font-normal">✨ vị ngọt</span>
        </div>

        {/* Bottom Action Footer with Mở kẹo thưởng thức & Detail Trigger */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-700/60 flex items-center justify-between gap-2">
          {/* Mở kẹo thưởng thức (Chat link) */}
          <div className="flex items-center gap-1">
            <a
              href={character.characterLink || '#'}
              target={character.characterLink && character.characterLink !== '#' ? '_blank' : undefined}
              rel="noopener noreferrer"
              onClick={(e) => {
                e.stopPropagation();
                sound.playChime();
                if (character.characterLink && character.characterLink !== '#') {
                  onTasted?.(character.id);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white text-xs font-bold shadow-2xs hover:shadow-md transition-all cursor-pointer whitespace-nowrap"
              title="Mở link chat và thưởng thức kẹo"
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Mở kẹo thưởng thức</span>
            </a>
            {character.characterLink && character.characterLink !== '#' && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playSuccess();
                  onCopyLink(character.characterLink, e);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-rose-50 dark:hover:bg-slate-700 transition-colors"
                title="Sao chép link"
              >
                <Copy className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Primary View Detail Button */}
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 group-hover:text-rose-600 dark:group-hover:text-rose-400 group-hover:translate-x-0.5 transition-all shrink-0">
            <span>Chi tiết</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>
    </article>
  );
};
