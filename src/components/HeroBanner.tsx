import React from 'react';
import { Pencil } from 'lucide-react';
import { sound } from '../utils/audio';

interface HeroBannerProps {
  polaroidPhoto?: string;
  isAdmin?: boolean;
  onOpenAdminPolaroid?: () => void;
  onOpenAddModal?: () => void;
  onOpenIntroModal: () => void;
  onOpenFeedbackModal?: () => void;
  onScrollToRoster: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  polaroidPhoto,
  isAdmin,
  onOpenAdminPolaroid,
  onOpenIntroModal,
  onScrollToRoster,
}) => {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-5 sm:pt-7 pb-4">
      {/* Main Showcase Container matching image_64af45c3.png */}
      <div className="relative bg-gradient-to-br from-white/95 via-[#fff8f9]/95 to-[#fff2f5]/90 dark:bg-slate-900/90 backdrop-blur-md rounded-3xl border border-[#fad7e0] dark:border-pink-900/40 p-6 sm:p-10 lg:p-12 shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        
        {/* Subtle decorative ambient lighting */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-pink-200/35 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-rose-200/25 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7 cols): Title, Subtitle, Whisper link & Buttons */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            
            {/* Category Subtitle */}
            <div className="text-[11px] sm:text-xs font-semibold text-[#d4658a] dark:text-pink-300 tracking-[0.2em] uppercase flex items-center gap-1.5">
              <span className="text-sm">✧</span>
              <span>MỘNG MƠ 2000S • WYN SWEET SANCTUARY</span>
            </div>

            {/* Main Headline with Red Bow */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[#981b40] dark:text-pink-200 tracking-tight leading-[1.15] flex items-center gap-2 flex-wrap font-serif">
              <span>Ổ kẹo ngọt của Wyn</span>
              <span className="inline-block hover:scale-125 transition-transform select-none text-3xl sm:text-5xl">🎀</span>
            </h1>

            {/* Description Text */}
            <p className="text-slate-600 dark:text-rose-100/90 text-sm sm:text-base leading-relaxed max-w-xl font-normal">
              Nơi tạo ra những viên kẹo từ ngọt đến đắng đến cay đang chờ các nàng mở ra và thưởng thức
            </p>

            {/* Action Buttons */}
            <div className="pt-1 flex flex-wrap items-center gap-3">
              {/* Button 1: Lời thì thầm từ Wyn */}
              <button
                type="button"
                onClick={() => {
                  sound.playChime();
                  onOpenIntroModal();
                }}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ff5e85] to-[#ff4071] hover:from-[#ff4d79] hover:to-[#f03264] shadow-md shadow-pink-500/25 hover:shadow-lg hover:shadow-pink-500/35 hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span className="text-sm">♡</span>
                <span className="text-sm">💬</span>
                <span>Lời thì thầm từ Wyn</span>
                <span className="text-xs">✦</span>
              </button>

              {/* Button 2: Ghé thăm hũ kẹo */}
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onScrollToRoster();
                }}
                className="px-6 py-3 rounded-full text-xs sm:text-sm font-semibold text-[#c93b63] dark:text-pink-200 bg-[#fff0f4] dark:bg-pink-950/50 hover:bg-[#ffe2ea] dark:hover:bg-pink-900/50 border border-pink-200/80 dark:border-pink-800/40 hover:scale-102 active:scale-95 transition-all cursor-pointer flex items-center gap-2"
              >
                <span>🍭</span>
                <span>Ghé thăm hũ kẹo</span>
                <span className="text-xs">↓</span>
              </button>
            </div>

          </div>

          {/* Right Column (5 cols): Pinned Polaroid Card matching image_64af45c3.png */}
          <div className="lg:col-span-5 flex justify-center">
            <div
              onClick={() => {
                sound.playChime();
                onOpenIntroModal();
              }}
              className="relative group cursor-pointer max-w-[300px] sm:max-w-[330px] w-full transition-all duration-300 hover:rotate-0 hover:scale-103 rotate-[1.5deg]"
              title="Nhấn để đọc lời thì thầm ngọt ngào từ Wyn"
            >
              {/* Top Center Gold/Wood Clip Pin */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-8 bg-gradient-to-b from-[#f3cf83] to-[#c79a42] rounded-xs shadow-md z-30 border border-[#b88c3a] flex items-center justify-center">
                <div className="w-1.5 h-4 border-l border-r border-[#8d651d]/50" />
              </div>

              {/* Top Right Floating Heart Badge */}
              <div className="absolute -top-3 -right-2 w-8 h-8 rounded-full bg-gradient-to-tr from-purple-300 to-pink-300 flex items-center justify-center text-sm shadow-md border-2 border-white dark:border-slate-800 rotate-12 z-30 animate-pulse">
                💖
              </div>

              {/* Admin Quick Edit Badge */}
              {isAdmin && onOpenAdminPolaroid && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sound.playPop();
                    onOpenAdminPolaroid();
                  }}
                  className="absolute -bottom-2.5 -right-2 px-3 py-1.5 rounded-full bg-gradient-to-r from-[#ff5e85] to-[#ff4071] text-white text-[11px] font-bold shadow-lg border-2 border-white dark:border-slate-800 flex items-center gap-1.5 hover:scale-105 active:scale-95 transition-all z-35 cursor-pointer"
                  title="Thay đổi ảnh khung Polaroid (Quản trị viên)"
                >
                  <Pencil className="w-3 h-3" />
                  <span>Đổi ảnh</span>
                </button>
              )}

              {/* Main Polaroid Body */}
              <div className="bg-white dark:bg-[#20121d] rounded-3xl p-3 sm:p-3.5 shadow-2xl border border-pink-200/80 dark:border-pink-900/50 space-y-2">
                {/* Bedroom Photo Frame */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/4.3] bg-pink-100 border border-pink-100/70 dark:border-pink-900/30">
                  <img
                    src={polaroidPhoto || '/assets/aistudio/hero_bedroom_photo.png'}
                    alt="Góc phòng ngủ Coquette & Kẹo Dâu Sữa Y2K"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = '/assets/aistudio/hero_bedroom_photo.png';
                    }}
                  />

                  {/* Frosted Quote Overlay Bubble matching image_64af45c3.png */}
                  <div className="absolute bottom-2 inset-x-2 bg-white/95 dark:bg-[#281525]/95 backdrop-blur-md rounded-2xl p-2.5 sm:p-3 shadow-lg border border-pink-200/80 dark:border-pink-800/40 text-center space-y-1">
                    <div className="flex items-center justify-center gap-1.5 text-xs text-rose-400">
                      <span>🌸</span>
                      <span className="w-5 h-px bg-pink-300" />
                      <span>🎀</span>
                    </div>
                    <p className="font-serif italic text-xs sm:text-[13px] text-rose-700 dark:text-rose-300 font-semibold leading-tight">
                      “Đôi môi em nhạt... 🥀”
                    </p>
                    <p className="text-xs sm:text-[13px] font-bold text-[#ff4071] leading-tight">
                      “Gieo chút kẹo ngọt trên môi em 🍭 💋”
                    </p>
                    <div className="text-[10px] text-pink-400 font-medium pt-0.5">
                      ✦ ký ức dâu sữa thơm lừng ✦
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Row of Polaroid */}
                <div className="flex items-center justify-between pt-1 px-1">
                  <div className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-pink-200">
                    <span>🎀</span>
                    <span>Wyn's Memory #01</span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-300 border border-rose-200/60 dark:border-rose-800/40">
                    ★ 2000s Coquette
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
