/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Tag, Sparkles, Filter, X, ChevronRight, Plus, Heart } from 'lucide-react';
import { PRESET_GENRES, GenreItem } from '../data/genres';
import { Character } from '../types/character';
import { sound } from '../utils/audio';

interface GenreShowcaseProps {
  selectedGenre: string;
  onSelectGenre: (genreName: string) => void;
  characters: Character[];
  onOpenAddModalWithGenre?: (genreName: string) => void;
  onScrollToRoster: () => void;
  onNavigateToGenresPage?: () => void;
  isAdmin?: boolean;
}

export const GenreShowcase: React.FC<GenreShowcaseProps> = ({
  selectedGenre,
  onSelectGenre,
  characters,
  onOpenAddModalWithGenre,
  onScrollToRoster,
  onNavigateToGenresPage,
  isAdmin = false,
}) => {
  const [hoveredGenre, setHoveredGenre] = useState<GenreItem | null>(null);

  // Calculate count for each genre
  const getGenreCount = (genreName: string, aliases: string[] = []) => {
    const allNames = [genreName, ...aliases].map((n) => n.toLowerCase());
    return characters.filter((c) => {
      const charGenre = (c.genre || '').toLowerCase();
      return allNames.some((n) => charGenre.includes(n));
    }).length;
  };

  const handleGenreClick = (genre: GenreItem) => {
    sound.playPop();
    if (selectedGenre.toLowerCase() === genre.name.toLowerCase()) {
      onSelectGenre('Tất cả');
    } else {
      onSelectGenre(genre.name);
      onScrollToRoster();
    }
  };

  return (
    <section id="the-loai-section" className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
      {/* Header matching site style */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-rose-100/70">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#e87739]" />
          <h2 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>Thẻ thể loại & Hương vị tính cách</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-[#b53457] border border-rose-200">
              {PRESET_GENRES.length} thể loại
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onNavigateToGenresPage && (
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onNavigateToGenresPage();
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#fac8d1] text-xs font-bold text-[#b53457] hover:bg-rose-50 shadow-2xs transition-all cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-amber-500" />
              <span>Xem trang thể loại riêng</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Selected genre clear button if active */}
          {selectedGenre && selectedGenre !== 'Tất cả' && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">Đang lọc theo:</span>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onSelectGenre('Tất cả');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold shadow-xs hover:bg-rose-600 transition-colors"
              >
                <span>{selectedGenre}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description text */}
      <p className="text-xs text-slate-500 max-w-2xl">
        Khám phá thế giới nhân vật của Wyn qua từng thể loại yêu thích. Chọn một thẻ thể loại để lọc các nhân vật mang phong vị tương ứng:
      </p>

      {/* Grid of 16 Genres with interactive cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 gap-3 sm:gap-3.5">
        {PRESET_GENRES.map((genre) => {
          const count = getGenreCount(genre.name, genre.alias);
          const isSelected =
            selectedGenre.toLowerCase() === genre.name.toLowerCase() ||
            (genre.alias && genre.alias.some((a) => selectedGenre.toLowerCase() === a.toLowerCase()));

          return (
            <div
              key={genre.id}
              onClick={() => handleGenreClick(genre)}
              onMouseEnter={() => setHoveredGenre(genre)}
              onMouseLeave={() => setHoveredGenre(null)}
              className={`group relative p-3 sm:p-3.5 rounded-2xl border cursor-pointer transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-br from-[#fff0f3] to-[#ffe4e9] border-[#ff4d6d] shadow-md shadow-rose-200/50 scale-[1.02] ring-2 ring-rose-400/30'
                  : 'bg-white hover:bg-[#fff9fa] border-[#fae2e5] hover:border-rose-300 hover:shadow-sm'
              }`}
            >
              <div>
                {/* Top row: Emoji & Count badge */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-2xl group-hover:scale-110 transition-transform filter drop-shadow-2xs">
                    {genre.emoji}
                  </span>
                  
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                      count > 0
                        ? 'bg-rose-100/80 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-400 border-slate-200'
                    }`}
                  >
                    {count > 0 ? `${count} nhân vật` : '0 kẹo'}
                  </span>
                </div>

                {/* Genre Name */}
                <h3
                  className={`text-xs sm:text-sm font-bold tracking-tight mb-1 transition-colors ${
                    isSelected ? 'text-[#b52d55]' : 'text-slate-800 group-hover:text-[#b53457]'
                  }`}
                >
                  {genre.name}
                </h3>

                {/* Genre Short Quote / Backstory teaser */}
                <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                  {genre.description}
                </p>
              </div>

              {/* Bottom action hint */}
              <div className="mt-2.5 pt-2 border-t border-rose-100/40 flex items-center justify-between text-[10px]">
                <span className={isSelected ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                  {isSelected ? '✓ Đang xem' : 'Bấm để lọc kẹo'}
                </span>

                {isAdmin && onOpenAddModalWithGenre && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      sound.playChime();
                      onOpenAddModalWithGenre(genre.name);
                    }}
                    title={`Thêm nhân vật mới thuộc thể loại ${genre.name} (Admin)`}
                    className="p-1 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-100/70 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
