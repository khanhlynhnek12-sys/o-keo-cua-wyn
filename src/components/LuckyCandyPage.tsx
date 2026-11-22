import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  ArrowLeft,
  Candy,
  RotateCcw,
  Heart,
  ExternalLink,
  MessageCircle,
  Copy,
  Plus,
  Compass,
  X,
  Volume2,
  Clock,
} from 'lucide-react';
import { sound } from '../utils/audio';
import { Character } from '../types/character';
import {
  LuckyCandyDrawEntry,
  LuckyCandyStats,
  subscribeLuckyCandyDraws,
  subscribeLuckyCandyStats,
  recordLuckyCandyDrawInFirestore,
} from '../firebase/services';

interface LuckyCandyPageProps {
  characters: Character[];
  onBackToHome: () => void;
  onSelectCharacter: (char: Character) => void;
  onOpenAddModal: () => void;
  onToast: (msg: string) => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  isAdmin?: boolean;
  onTasted?: (id: string) => void;
}

// Fallback special sweet fortune character when nest is empty
const DEFAULT_SWEET_CANDY_FORTUNE: Character = {
  id: 'wyn_special_candy_fortune',
  name: 'Kẹo Ngọt Duyên Lành Của Wyn 🌸',
  avatar:
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
  genre: 'Chữa lành',
  sweetFlavor: 'Dâu Tây Sữa Ngọt Lịm 🍓🥛',
  tagline: 'Chờ đợi một người đủ dịu dàng để bước vào thế giới của nhau...',
  firstMessage:
    'Chào nàng yêu dấu! Dù hôm nay có chuyện gì xảy ra, cũng đừng quên mỉm cười và nhận lấy chút kẹo ngọt này từ Wyn nhé! 💕',
  backstory:
    'Ổ kẹo của Wyn đang trong giai đoạn ấp ủ những nhân vật ngọt ngào tiếp theo. Viên kẹo đầu tiên nàng vừa rút trúng mang theo 100% năng lượng may mắn và tình yêu thương của Wyn gửi đến nàng!',
  characterLink: '',
  personalityTraits: ['Ấm áp', 'Dịu dàng', 'Ngọt ngào', 'Biết lắng nghe'],
  themeColor: {
    bgGradient: 'from-pink-500/10 to-rose-500/10',
    badgeBg: 'bg-rose-100',
    badgeText: 'text-rose-700',
    borderActive: 'border-rose-400',
    accent: '#ff5364',
    softGlow: 'rgba(255, 83, 100, 0.25)',
  },
};

export const LuckyCandyPage: React.FC<LuckyCandyPageProps> = ({
  characters,
  onBackToHome,
  onSelectCharacter,
  onOpenAddModal,
  onToast,
  onToggleFavorite,
  isFavorite,
  isAdmin = false,
  onTasted,
}) => {
  // Interaction phase: 'idle' | 'shaking' | 'candy_floating' | 'revealed'
  const [drawPhase, setDrawPhase] = useState<'idle' | 'shaking' | 'candy_floating' | 'revealed'>('idle');
  const [drawnCharacter, setDrawnCharacter] = useState<Character | null>(null);
  const [unwrapBurst, setUnwrapBurst] = useState(false);

  // Real-time Firestore stats & recent draws feed
  const [luckyStats, setLuckyStats] = useState<LuckyCandyStats>({ totalDraws: 0 });
  const [recentDraws, setRecentDraws] = useState<LuckyCandyDrawEntry[]>([]);

  useEffect(() => {
    const unsubStats = subscribeLuckyCandyStats(
      (stats) => setLuckyStats(stats),
      (err) => console.warn('Lucky candy stats fallback:', err)
    );
    const unsubDraws = subscribeLuckyCandyDraws(
      (draws) => setRecentDraws(draws),
      (err) => console.warn('Lucky candy draws fallback:', err)
    );
    return () => {
      unsubStats();
      unsubDraws();
    };
  }, []);

  // Keep revealed character synced with live likesCount / tastedCount updates
  const activeDrawnCharacter = drawnCharacter
    ? characters.find((c) => c.id === drawnCharacter.id) || drawnCharacter
    : null;

  // Trigger draw: Jar shakes up and down -> Candy appears in the center of the screen
  const handleStartDraw = () => {
    if (drawPhase === 'shaking') return;

    sound.playPop();
    setDrawPhase('shaking');
    setDrawnCharacter(null);
    setUnwrapBurst(false);

    // Shake for 800ms, then pop floating candy to the center
    setTimeout(() => {
      sound.playPop();
      // Select destiny character
      if (characters.length > 0) {
        const randomChar = characters[Math.floor(Math.random() * characters.length)];
        setDrawnCharacter(randomChar);
      } else {
        setDrawnCharacter(DEFAULT_SWEET_CANDY_FORTUNE);
      }
      setDrawPhase('candy_floating');
    }, 850);
  };

  // User clicks the floating candy in the center -> unwraps and reveals destiny character
  const handleUnwrapCandy = () => {
    sound.playSuccess();
    sound.playChime();
    setUnwrapBurst(true);

    if (drawnCharacter) {
      recordLuckyCandyDrawInFirestore({
        characterId: drawnCharacter.id,
        characterName: drawnCharacter.name,
        characterAvatar: drawnCharacter.avatar,
        sweetFlavor: drawnCharacter.sweetFlavor,
        genre: drawnCharacter.genre,
        type: drawnCharacter.id === 'wyn_special_candy_fortune' ? 'fortune' : 'character',
      }).catch((err) => {
        console.warn('Could not record lucky candy draw in Firestore:', err);
      });
    }

    setTimeout(() => {
      setDrawPhase('revealed');
    }, 450);
  };

  // Close reveal modal / reset back to jar
  const handleResetDraw = () => {
    sound.playPop();
    setDrawPhase('idle');
    setDrawnCharacter(null);
    setUnwrapBurst(false);
  };

  const handleCopyGreeting = (msg: string) => {
    try {
      navigator.clipboard.writeText(msg);
      onToast('Đã sao chép lời thì thầm ngọt ngào!');
    } catch {
      onToast('Đã chọn lời thì thầm');
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 animate-fadeIn">
      {/* Top Breadcrumb & Navigation */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            sound.playPop();
            onBackToHome();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[#b53457] bg-white border border-[#fac8d1] hover:bg-rose-50 shadow-2xs transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Quay lại Trang chủ</span>
        </button>

        <span className="text-xs text-pink-400 font-medium flex items-center gap-1.5">
          <Candy className="w-3.5 h-3.5" />
          <span>Hũ kẹo định mệnh của Wyn</span>
        </span>
      </div>

      {/* Main Section Header matching image_1d2da8aa.png */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full bg-[#ff5364] shrink-0" />
          <h1 className="text-lg sm:text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            <span>🎁</span>
            <span>Hũ Kẹo Bất Ngờ — Bốc Kẹo Duyên Định</span>
          </h1>
        </div>

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#fff0f3] border border-[#fbd3db] text-xs font-semibold text-[#cf385e] shadow-2xs self-start sm:self-auto">
          <Sparkles className="w-3.5 h-3.5 text-[#cf385e]" />
          <span>✨ Rút ngẫu nhiên thẻ kẹo ngọt · Đã bốc {luckyStats.totalDraws} lần</span>
        </div>
      </div>

      {/* Hero Showcase Card matching image_1d2da8aa.png pixel-for-pixel */}
      <div className="relative bg-white rounded-3xl border border-[#fae2e5] p-6 sm:p-10 lg:p-12 shadow-xs overflow-hidden">
        {/* Soft decorative background accents matching the mockup watermark feel */}
        <div className="absolute -top-16 -right-16 w-64 h-64 bg-pink-100/40 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-64 h-64 bg-amber-100/30 rounded-full blur-3xl pointer-events-none" />

        {/* Faint corner treats illustrations */}
        <div className="absolute bottom-3 left-4 text-3xl opacity-20 select-none pointer-events-none">
          🍭
        </div>
        <div className="absolute bottom-3 right-8 text-3xl opacity-20 select-none pointer-events-none">
          🧁
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center relative z-10">
          {/* Left Column: Glass Candy Jar with Up-Down Shaking Animation */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <motion.div
              animate={
                drawPhase === 'shaking'
                  ? {
                      y: [-16, 16, -14, 14, -10, 10, -6, 6, -3, 3, 0],
                      scale: [1, 1.05, 0.96, 1.04, 1],
                    }
                  : {
                      y: [0, -6, 0],
                    }
              }
              transition={
                drawPhase === 'shaking'
                  ? { duration: 0.82, ease: 'easeInOut' }
                  : { repeat: Infinity, duration: 3.2, ease: 'easeInOut' }
              }
              onClick={handleStartDraw}
              className="relative w-64 sm:w-72 cursor-pointer select-none group"
              title="Chạm vào hũ để bốc kẹo duyên định!"
            >
              {/* Outer Glow Halo */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-pink-200/50 via-rose-200/40 to-amber-200/40 rounded-[3rem] blur-xl opacity-75 group-hover:opacity-100 transition-opacity" />

              {/* Sparkles around jar top */}
              <div className="absolute -top-2 -left-2 text-pink-400 text-lg animate-pulse">
                ✨
              </div>
              <div className="absolute top-1 -right-3 text-amber-400 text-xl animate-bounce">
                ✨
              </div>
              <div className="absolute top-1/2 -left-4 text-rose-400 text-sm">
                🌸
              </div>

              {/* Jar Container */}
              <div className="relative bg-gradient-to-b from-white/95 via-rose-50/40 to-[#fff2f4]/80 backdrop-blur-md rounded-[2.8rem] border-2 border-[#fac8d1] p-5 shadow-lg flex flex-col items-center">
                {/* Jar Lid (Pink rounded cap with handle) */}
                <div className="w-40 h-5 bg-gradient-to-r from-[#ff6b81] via-[#ff5364] to-[#ffa07a] rounded-full shadow-md flex items-center justify-center -mt-2 mb-4 border border-white/60">
                  <div className="w-16 h-1.5 bg-white/40 rounded-full" />
                </div>

                {/* Floating Candies inside the Jar */}
                <div className="relative w-full h-52 flex items-center justify-center overflow-hidden">
                  {/* Candies arranged floating as in mockup */}
                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [-15, 15, -12, 12, 0], x: [-6, 6, -4, 4, 0] }
                        : { y: [0, -5, 0], rotate: [0, 5, 0] }
                    }
                    transition={{ repeat: Infinity, duration: 2.4, ease: 'easeInOut' }}
                    className="absolute top-3 left-14 text-3xl filter drop-shadow-sm"
                  >
                    🍬
                  </motion.div>

                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [15, -15, 10, -10, 0], x: [8, -8, 4, -4, 0] }
                        : { y: [0, 6, 0], rotate: [0, -8, 0] }
                    }
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                    className="absolute top-2 right-12 text-3xl filter drop-shadow-sm"
                  >
                    🍭
                  </motion.div>

                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [-12, 12, -8, 8, 0] }
                        : { y: [0, -4, 0], scale: [1, 1.05, 1] }
                    }
                    transition={{ repeat: Infinity, duration: 2.1, ease: 'easeInOut' }}
                    className="absolute top-16 left-8 text-2xl filter drop-shadow-sm"
                  >
                    🍓
                  </motion.div>

                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [14, -14, 8, -8, 0] }
                        : { y: [0, 5, 0], rotate: [-5, 5, -5] }
                    }
                    transition={{ repeat: Infinity, duration: 2.6, ease: 'easeInOut' }}
                    className="absolute top-16 right-16 text-2xl filter drop-shadow-sm"
                  >
                    🍫
                  </motion.div>

                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [-10, 10, -6, 6, 0] }
                        : { y: [0, -6, 0] }
                    }
                    transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
                    className="absolute top-20 right-6 text-xl"
                  >
                    ✨
                  </motion.div>

                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [12, -12, 6, -6, 0] }
                        : { y: [0, 4, 0] }
                    }
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="absolute bottom-8 left-16 text-3xl filter drop-shadow-sm"
                  >
                    🍯
                  </motion.div>

                  <motion.div
                    animate={
                      drawPhase === 'shaking'
                        ? { y: [-12, 12, -6, 6, 0] }
                        : { y: [0, -5, 0] }
                    }
                    transition={{ repeat: Infinity, duration: 2.7, ease: 'easeInOut' }}
                    className="absolute bottom-8 right-14 text-3xl filter drop-shadow-sm"
                  >
                    🧁
                  </motion.div>
                </div>

                {/* Sub-card anchored at bottom of jar: Ổ KẸO TÂM TÌNH */}
                <div className="w-full bg-white/95 rounded-2xl border border-rose-200/90 py-2.5 px-4 text-center shadow-xs">
                  <div className="text-xs font-bold text-[#b53457] tracking-wider uppercase">
                    Ổ KẸO TÂM TÌNH
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    100% kẹo ngọt duyên lành
                  </div>
                </div>
              </div>

              {/* Gentle floating candy sticker on left bottom */}
              <div className="absolute -bottom-1 -left-2 text-rose-500 text-lg">
                🌸
              </div>
              <div className="absolute -bottom-1 -right-2 text-amber-500 text-base">
                ✨
              </div>
            </motion.div>

            {/* Prompt subtext below the jar matching mockup */}
            <p className="text-xs font-semibold text-[#b53457] mt-3 flex items-center gap-1.5 animate-pulse">
              <span>👆</span>
              <span>Chạm vào hũ kẹo để bốc ngay nhé!</span>
            </p>
          </div>

          {/* Right Column: Title, Description, 3 Badges, 2 Buttons, Footnote */}
          <div className="lg:col-span-7 space-y-5">
            {/* Collection Badge */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-[11px] font-bold text-amber-800">
              <span>🍬</span>
              <span>Bộ sưu tập: Hương Vị Kẹo Mùa Yêu</span>
            </div>

            {/* Big Title */}
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-800 tracking-tight leading-snug">
              Mỗi viên kẹo là một tâm hồn chờ bạn mở lòng
            </h2>

            {/* Description */}
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Bạn đang tìm kiếm một chút dịu dàng sau ngày dài mỏi mệt? Hãy để chiếc hũ thần kỳ của Wyn gửi đến bạn một nhân vật ngọt ngào, cùng lời thì thầm đầu tiên ấm áp chạm đến trái tim bạn.
            </p>

            {/* 3 Mini Stat Pill Boxes in a row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              {/* Box 1 */}
              <div className="bg-white rounded-2xl border border-rose-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                <span className="text-2xl">🍓</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">
                    {characters.length > 0 ? `${characters.length} Nhân vật` : '0 Nhân vật'}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {characters.length > 0 ? 'Đầy đủ cá tính' : 'Chưa có nhân vật'}
                  </div>
                </div>
              </div>

              {/* Box 2 */}
              <div className="bg-white rounded-2xl border border-rose-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                <span className="text-2xl">⭐</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Tỉ lệ ngọt 100%</div>
                  <div className="text-[10px] text-slate-500">5/5 sao ngọt ngào</div>
                </div>
              </div>

              {/* Box 3 */}
              <div className="bg-white rounded-2xl border border-rose-200/80 p-3.5 flex items-center gap-3 shadow-2xs">
                <span className="text-2xl">💌</span>
                <div>
                  <div className="text-xs font-bold text-slate-800">Thì thầm bí mật</div>
                  <div className="text-[10px] text-slate-500">First Whisper</div>
                </div>
              </div>
            </div>

            {/* 2 Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3">
              {/* Primary button */}
              <button
                type="button"
                onClick={handleStartDraw}
                disabled={drawPhase === 'shaking'}
                className="inline-flex items-center gap-2 px-6 py-3 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-[#ff5364] via-[#ff6b57] to-[#ff7d45] hover:opacity-95 rounded-full shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50"
              >
                <span>🍓</span>
                <span>Bốc 1 Viên Kẹo</span>
                <span className="text-xs font-normal opacity-90">(Thử vận may)</span>
              </button>

              {/* Secondary button */}
              <button
                type="button"
                onClick={handleStartDraw}
                disabled={drawPhase === 'shaking'}
                className="inline-flex items-center gap-2 px-5 py-3 text-xs sm:text-sm font-semibold text-rose-600 bg-white border border-[#fac8d1] hover:bg-rose-50 rounded-full transition-all cursor-pointer disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Rút May Mắn</span>
              </button>
            </div>

            {/* Footnote text */}
            <p className="text-[11px] text-slate-400 italic pt-1">
              * Bốc kẹo hoàn toàn miễn phí, mang lại nụ cười và năng lượng tích cực mỗi ngày cho bạn!
            </p>
          </div>
        </div>
      </div>

      {/* Real-time Recent Lucky Candy Draws Feed */}
      <div className="bg-white rounded-3xl border border-[#fae2e5] p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-lg">🍬</span>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-800">
                Nhật Ký Bốc Kẹo Duyên Định Gần Đây
              </h3>
              <p className="text-[11px] text-slate-500">
                Đồng bộ thời gian thực cùng mọi nàng ghé thăm Ổ kẹo ({luckyStats.totalDraws} lượt bốc)
              </p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Đồng bộ Realtime</span>
          </span>
        </div>

        {recentDraws.length === 0 ? (
          <div className="text-center py-6 space-y-1.5 text-xs text-slate-500">
            <p className="font-semibold text-slate-700">Chưa có lượt bốc kẹo nào được ghi nhận</p>
            <p>Hãy chạm vào hũ kẹo phía trên để trở thành người mở hàng đầu tiên nhé! ✨</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {recentDraws.map((draw) => {
              const matchedChar = characters.find((c) => c.id === draw.characterId);
              const avatarSrc = matchedChar?.avatar || draw.characterAvatar;
              const formattedTime = (() => {
                try {
                  return new Date(draw.createdAt).toLocaleTimeString('vi-VN', {
                    hour: '2-digit',
                    minute: '2-digit',
                    day: '2-digit',
                    month: '2-digit',
                  });
                } catch {
                  return '';
                }
              })();

              return (
                <div
                  key={draw.id}
                  onClick={() => {
                    if (matchedChar) {
                      sound.playPop();
                      onSelectCharacter(matchedChar);
                    }
                  }}
                  className={`flex items-center gap-3 p-3 rounded-2xl border border-rose-100 bg-rose-50/40 transition-all ${
                    matchedChar ? 'hover:bg-rose-50 hover:border-rose-300 cursor-pointer' : ''
                  }`}
                >
                  {avatarSrc ? (
                    <img
                      src={avatarSrc}
                      alt={draw.characterName}
                      className="w-11 h-11 rounded-xl object-cover border border-rose-200 shrink-0"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-rose-100 flex items-center justify-center text-xl shrink-0">
                      🍬
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-800 truncate">
                      {draw.characterName}
                    </div>
                    {draw.sweetFlavor && (
                      <div className="text-[11px] text-rose-600 font-medium truncate">
                        {draw.sweetFlavor}
                      </div>
                    )}
                    {formattedTime && (
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-0.5">
                        <Clock className="w-3 h-3" />
                        <span>{formattedTime}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTION OVERLAY: "1 CỤC KẸO HIỆN RA GIỮA MÀN HÌNH BẤM VÀO MỞ RA ẤY"  */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawPhase === 'candy_floating' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center p-4 overflow-y-auto"
          >
            {/* Floating Sparkles & Hearts in the background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
              <div className="absolute top-1/4 left-1/4 text-2xl animate-bounce">✨</div>
              <div className="absolute top-1/3 right-1/4 text-3xl animate-pulse">🌸</div>
              <div className="absolute bottom-1/4 left-1/3 text-2xl animate-ping">💖</div>
              <div className="absolute bottom-1/3 right-1/3 text-xl animate-pulse">⭐</div>
            </div>

            {/* Prompt Tag */}
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-8 text-center space-y-2 z-10"
            >
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 border border-rose-300 text-xs sm:text-sm font-bold text-[#b53457] shadow-lg">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span>BẠN ĐÃ RÚT ĐƯỢC 1 VIÊN KẸO DUYÊN ĐỊNH!</span>
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400" />
              </div>
              <p className="text-white text-xs sm:text-sm font-medium drop-shadow-sm">
                Hãy chạm nhẹ vào viên kẹo để bóc vỏ và mở ra điều bất ngờ nhé! 🎁
              </p>
            </motion.div>

            {/* Center Giant Floating Candy */}
            <motion.div
              initial={{ scale: 0, rotate: -45 }}
              animate={
                unwrapBurst
                  ? { scale: [1, 1.4, 0], rotate: [0, 45, 90], opacity: [1, 1, 0] }
                  : {
                      scale: [0.95, 1.08, 0.95],
                      rotate: [-6, 6, -6],
                      y: [-12, 12, -12],
                    }
              }
              transition={
                unwrapBurst
                  ? { duration: 0.45, ease: 'easeOut' }
                  : { repeat: Infinity, duration: 2.4, ease: 'easeInOut' }
              }
              onClick={handleUnwrapCandy}
              className="relative cursor-pointer select-none group z-10 p-6"
            >
              {/* Radial Glowing Aura */}
              <div className="absolute -inset-10 bg-gradient-to-tr from-pink-400/40 via-rose-300/40 to-amber-300/40 rounded-full blur-3xl opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all animate-pulse" />

              {/* Candy Graphic */}
              <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full bg-gradient-to-tr from-[#ff5364] via-[#ff7085] to-[#ffb37e] border-4 border-white shadow-2xl flex flex-col items-center justify-center text-white transform group-hover:scale-105 transition-transform">
                {/* Shiny reflex */}
                <div className="absolute top-4 left-6 w-14 h-6 bg-white/40 rounded-full rotate-[-30deg]" />

                <span className="text-7xl sm:text-8xl filter drop-shadow-md group-hover:scale-110 transition-transform">
                  🍬
                </span>

                <div className="absolute bottom-5 px-3 py-1 bg-white/90 rounded-full text-[11px] font-bold text-[#b53457] shadow-sm flex items-center gap-1">
                  <span>Chạm để bóc mở</span>
                  <span>✨</span>
                </div>
              </div>

              {/* Burst sparkles indicator on hover */}
              <div className="text-center mt-6">
                <span className="inline-block px-5 py-2 rounded-full bg-white text-slate-800 text-xs font-bold shadow-md group-hover:bg-rose-50 transition-colors">
                  👆 Chạm vào viên kẹo để bóc mở ra nhé! 🎁
                </span>
              </div>
            </motion.div>

            {/* Cancel / Close button */}
            <button
              type="button"
              onClick={handleResetDraw}
              className="mt-8 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1 px-4 py-2 rounded-full bg-black/20 hover:bg-black/30 transition-all z-10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Để lúc khác mở</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* REVEALED DESTINY CHARACTER MODAL ("MỞ RA ẤY")                             */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {drawPhase === 'revealed' && activeDrawnCharacter && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.85, y: 30, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl border-2 border-[#fac8d1] p-6 sm:p-8 shadow-2xl space-y-6 my-auto"
            >
              {/* Close Button */}
              <button
                type="button"
                onClick={handleResetDraw}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Reveal Header */}
              <div className="text-center space-y-1">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#fff0f3] border border-[#fbd3db] text-xs font-bold text-[#b53457] uppercase tracking-wider">
                  🎉 NHÂN VẬT ĐỊNH MỆNH CỦA BẠN HÔM NAY
                </span>
                <p className="text-xs text-slate-500">
                  Viên kẹo vừa được bóc mở mang đến hương vị dành riêng cho nàng!
                </p>
              </div>

              {/* Character Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center bg-gradient-to-br from-[#fff8f9] to-[#fff1f3] rounded-2xl border border-rose-200/80 p-5 sm:p-6">
                {/* Avatar */}
                <div className="sm:col-span-5 flex flex-col items-center">
                  <div className="relative group">
                    <img
                      src={activeDrawnCharacter.avatar}
                      alt={activeDrawnCharacter.name}
                      className="w-36 h-36 sm:w-44 sm:h-44 rounded-2xl object-cover border-4 border-white shadow-md group-hover:scale-102 transition-transform"
                    />
                    {activeDrawnCharacter.id !== 'wyn_special_candy_fortune' && (
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(activeDrawnCharacter.id)}
                        className={`absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full backdrop-blur-xs transition-all shadow-sm ${
                          isFavorite(activeDrawnCharacter.id)
                            ? 'bg-rose-500 text-white'
                            : 'bg-white/90 text-slate-600 hover:text-rose-500'
                        }`}
                        title={`Yêu thích nhân vật (${activeDrawnCharacter.likesCount || 0} lượt tim)`}
                      >
                        <Heart
                          className={`w-4 h-4 ${
                            isFavorite(activeDrawnCharacter.id) ? 'fill-current' : ''
                          }`}
                        />
                        <span className="text-[11px] font-bold tabular-nums">
                          {activeDrawnCharacter.likesCount || 0}
                        </span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Details */}
                <div className="sm:col-span-7 space-y-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white border border-rose-200 text-[#b53457] shadow-2xs">
                      {activeDrawnCharacter.genre}
                    </span>
                    {activeDrawnCharacter.sweetFlavor && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 border border-amber-200 text-amber-800 shadow-2xs">
                        🍬 {activeDrawnCharacter.sweetFlavor}
                      </span>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-800">
                    {activeDrawnCharacter.name}
                  </h3>

                  {activeDrawnCharacter.tagline && (
                    <p className="text-xs sm:text-sm font-medium text-rose-600 italic">
                      &ldquo;{activeDrawnCharacter.tagline}&rdquo;
                    </p>
                  )}

                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {activeDrawnCharacter.backstory}
                  </p>

                  {/* First whisper bubble */}
                  {activeDrawnCharacter.firstMessage && (
                    <div className="bg-white/95 rounded-xl p-3 border border-rose-200/80 space-y-1 shadow-2xs">
                      <div className="flex items-center justify-between text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          <MessageCircle className="w-3.5 h-3.5" />
                          <span>Lời thì thầm đầu tiên:</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyGreeting(activeDrawnCharacter.firstMessage)}
                          className="hover:text-rose-800 flex items-center gap-1 text-[10px] font-semibold cursor-pointer lowercase"
                        >
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        &ldquo;{activeDrawnCharacter.firstMessage}&rdquo;
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-rose-100">
                <button
                  type="button"
                  onClick={handleStartDraw}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-[#b53457] bg-rose-50 hover:bg-rose-100 rounded-xl transition-all cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Bốc viên kẹo khác 🔄</span>
                </button>

                <div className="flex flex-wrap items-center gap-2">
                  {activeDrawnCharacter.characterLink && (
                    <a
                      href={activeDrawnCharacter.characterLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        sound.playChime();
                        if (activeDrawnCharacter.id !== 'wyn_special_candy_fortune') {
                          onTasted?.(activeDrawnCharacter.id);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Mở kẹo thưởng thức ({activeDrawnCharacter.tastedCount || 0})</span>
                    </a>
                  )}

                  {activeDrawnCharacter.id !== 'wyn_special_candy_fortune' ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetDraw();
                        onSelectCharacter(activeDrawnCharacter);
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-[#b53457] bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition-all cursor-pointer"
                    >
                      <span>Xem hồ sơ</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  ) : isAdmin ? (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetDraw();
                        onOpenAddModal();
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Thêm nhân vật đầu tiên (Admin) ✨</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        handleResetDraw();
                        onBackToHome();
                      }}
                      className="inline-flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <span>🌸 Về trang chủ khám phá ổ</span>
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
