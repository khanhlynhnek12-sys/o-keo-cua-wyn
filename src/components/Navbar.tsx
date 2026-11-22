import React from 'react';
import {
  Candy,
  Volume2,
  VolumeX,
  Search,
  Heart,
  Sparkles,
  MessageCircleHeart,
  Compass,
  Lock,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { sound } from '../utils/audio';

export type AppPage = 'home' | 'feedback' | 'lucky-candy' | 'genres';

interface NavbarProps {
  currentPage: AppPage;
  onNavigate: (page: AppPage) => void;
  onOpenAddModal: () => void;
  onOpenIntroModal: () => void;
  onOpenAdminModal: () => void;
  isAdmin: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  favoritesCount: number;
  onFilterFavorites: () => void;
  showingFavoritesOnly: boolean;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onScrollToRoster: () => void;
  onScrollToFlavors: () => void;
  onScrollToGenres: () => void;
  siteLogo?: string | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPage,
  onNavigate,
  onOpenAddModal,
  onOpenIntroModal,
  onOpenAdminModal,
  isAdmin,
  soundEnabled,
  onToggleSound,
  favoritesCount,
  onFilterFavorites,
  showingFavoritesOnly,
  searchQuery,
  onSearchChange,
  onScrollToRoster,
  onScrollToFlavors,
  onScrollToGenres,
  siteLogo,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-[#fdf9f8]/95 backdrop-blur-md border-b border-[#f5dedf] transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 px-4 sm:px-6 py-2.5">
        
        {/* Brand Zone */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            sound.playChime();
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-2.5 group shrink-0"
        >
          {/* Logo Zone: Custom uploaded logo or default candy icon */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#ff6b81] to-[#ffa07a] flex items-center justify-center text-white shadow-sm shadow-rose-200 group-hover:rotate-12 transition-transform overflow-hidden border border-rose-200/80 shrink-0">
            {siteLogo ? (
              <img
                src={siteLogo}
                alt="Logo Ổ kẹo của Wyn"
                className="w-full h-full object-cover"
              />
            ) : (
              <Candy className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-script text-2xl font-bold text-[#b53457] leading-none tracking-wide">
                Ổ kẹo ngọt
              </span>
              <span className="font-hand text-sm font-bold text-[#c73e63] bg-[#fde9ec] border border-[#fbd0d8] px-2 py-0.5 rounded-full leading-tight">
                của Wyn
              </span>
            </div>
            <span className="text-[10px] text-pink-400 font-sans tracking-widest uppercase mt-0.5 font-medium">
              sweet candies & whispers
            </span>
          </div>
        </a>

        {/* Navigation Tabs (Ordered per user request) */}
        <nav className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-slate-600">
          {/* 1. Trang chủ */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onNavigate('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentPage === 'home'
                ? 'bg-[#fdebee] text-[#b53457] border-[#fac8d1] shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#b53457] hover:bg-[#fff0f2]'
            }`}
          >
            <span>🍓</span>
            <span>Trang chủ</span>
          </button>

          {/* 2. Khám phá ổ (bấm vào hiện ra phần có các nhân vật) */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onNavigate('home');
              setTimeout(() => {
                onScrollToRoster();
              }, 50);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-600 hover:text-[#b53457] hover:bg-[#fff0f2] transition-colors cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5 text-pink-500" />
            <span>Khám phá ổ</span>
          </button>

          {/* 3. Thẻ thể loại (trang thể loại riêng) */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onNavigate('genres');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentPage === 'genres'
                ? 'bg-[#fdebee] text-[#b53457] border-[#fac8d1] shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#b53457] hover:bg-[#fff0f2]'
            }`}
          >
            <Tag className="w-3.5 h-3.5 text-amber-500" />
            <span>Thẻ thể loại</span>
          </button>

          {/* 4. Góc feedback (hiện riêng 1 trang feedback) */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onNavigate('feedback');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentPage === 'feedback'
                ? 'bg-[#fdebee] text-[#b53457] border-[#fac8d1] shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#b53457] hover:bg-[#fff0f2]'
            }`}
          >
            <MessageCircleHeart className="w-3.5 h-3.5 text-rose-400" />
            <span>Góc feedback</span>
          </button>

          {/* 4. Bốc kẹo ngon (hiện riêng trang bốc kẹo nhân vật) */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onNavigate('lucky-candy');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
              currentPage === 'lucky-candy'
                ? 'bg-[#fdebee] text-[#b53457] border-[#fac8d1] shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-[#b53457] hover:bg-[#fff0f2]'
            }`}
          >
            <Candy className="w-3.5 h-3.5 text-amber-500" />
            <span>Bốc kẹo ngon</span>
          </button>

          {/* 5. Quản trị viên (ẩn kín đáo, không lộ mật khẩu) */}
          <button
            type="button"
            onClick={() => {
              sound.playPop();
              onOpenAdminModal();
            }}
            title={isAdmin ? 'Bảng quản trị Wyn (Đã mở khóa)' : 'Khu vực quản trị'}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all cursor-pointer ${
              isAdmin
                ? 'bg-amber-100/80 text-amber-800 border border-amber-300 font-bold shadow-2xs'
                : 'text-slate-300 hover:text-slate-600 hover:bg-rose-50/60 opacity-40 hover:opacity-100'
            }`}
          >
            {isAdmin ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                <span className="text-[11px]">👑 Wyn Admin</span>
              </>
            ) : (
              <>
                <Lock className="w-3 h-3 text-slate-400" />
                <span className="text-[11px] font-normal">Quản trị</span>
              </>
            )}
          </button>
        </nav>

        {/* Right Search & Action Zone */}
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative hidden xl:block w-48">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Tìm vị kẹo ngọt..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#f5dedf] rounded-full text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-300 transition-all shadow-2xs"
            />
          </div>

          {/* Gradient Primary Button: Khám phá vị kẹo */}
          <button
            type="button"
            onClick={() => {
              sound.playChime();
              if (isAdmin) {
                onOpenAdminModal();
              } else {
                if (currentPage !== 'home') {
                  onNavigate('home');
                  setTimeout(() => {
                    onScrollToRoster();
                  }, 80);
                } else {
                  onScrollToRoster();
                }
              }
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-xs hover:shadow-md transition-all whitespace-nowrap cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">Khám phá vị kẹo</span>
            <span className="sm:hidden">{isAdmin ? 'Quản trị' : 'Xem kẹo'}</span>
          </button>

          {/* Heart / Wishlist button */}
          <button
            type="button"
            onClick={() => {
              sound.playHeart();
              onFilterFavorites();
            }}
            className={`p-2 rounded-xl border transition-all cursor-pointer ${
              showingFavoritesOnly
                ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                : 'bg-white text-slate-500 hover:text-rose-500 hover:bg-[#fff0f2] border-[#f5dedf]'
            }`}
            title={showingFavoritesOnly ? 'Hiển thị tất cả' : `Nhân vật yêu thích (${favoritesCount})`}
          >
            <Heart className={`w-4 h-4 ${showingFavoritesOnly ? 'fill-current' : ''}`} />
          </button>

          {/* Audio toggle button */}
          <button
            type="button"
            onClick={onToggleSound}
            className="p-2 text-slate-400 hover:text-rose-500 bg-white border border-[#f5dedf] rounded-xl hover:bg-[#fff0f2] transition-colors cursor-pointer"
            title={soundEnabled ? 'Tắt âm thanh nhẹ' : 'Bật âm thanh nhẹ'}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-between overflow-x-auto px-4 py-2 border-t border-rose-100/70 gap-2 text-[11px] font-semibold text-slate-600 no-scrollbar">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onNavigate('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0 ${
            currentPage === 'home' ? 'bg-[#fdebee] text-[#b53457]' : 'hover:bg-rose-50'
          }`}
        >
          🍓 Trang chủ
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onNavigate('home');
            setTimeout(() => {
              onScrollToRoster();
            }, 50);
          }}
          className="px-2 py-1 rounded-lg hover:bg-rose-50 whitespace-nowrap shrink-0"
        >
          ✨ Khám phá ổ
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onNavigate('genres');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2 py-1 rounded-lg whitespace-nowrap shrink-0 ${
            currentPage === 'genres' ? 'bg-[#fdebee] text-[#b53457]' : 'hover:bg-rose-50'
          }`}
        >
          🏷️ Thể loại
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onNavigate('feedback');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2 py-1 rounded-lg whitespace-nowrap shrink-0 ${
            currentPage === 'feedback' ? 'bg-[#fdebee] text-[#b53457]' : 'hover:bg-rose-50'
          }`}
        >
          💌 Góc feedback
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onNavigate('lucky-candy');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className={`px-2 py-1 rounded-lg whitespace-nowrap shrink-0 ${
            currentPage === 'lucky-candy' ? 'bg-[#fdebee] text-[#b53457]' : 'hover:bg-rose-50'
          }`}
        >
          🍬 Bốc kẹo ngon
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onOpenAdminModal();
          }}
          className={`px-2 py-1 rounded-lg whitespace-nowrap shrink-0 ${
            isAdmin ? 'text-amber-700 font-bold bg-amber-50' : 'text-slate-300 opacity-50'
          }`}
        >
          🔒 Quản trị
        </button>
      </div>
    </header>
  );
};
