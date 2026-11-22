/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { sound } from '../utils/audio';

interface WelcomeGateModalProps {
  isOpen: boolean;
  onEnter: () => void;
  siteLogo?: string | null;
}

export const WelcomeGateModal: React.FC<WelcomeGateModalProps> = ({
  isOpen,
  onEnter,
  siteLogo,
}) => {
  const [progress, setProgress] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const hasFinishedRef = useRef(false);

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Animated progress bar advancing smoothly from 0% to 100%
  useEffect(() => {
    if (!isOpen) return;

    setProgress(0);
    hasFinishedRef.current = false;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        // Organic natural step increment
        const increment = Math.max(1.5, Math.floor(Math.random() * 8) + 2);
        const next = Math.min(100, prev + increment);

        if (next === 100 && !hasFinishedRef.current) {
          hasFinishedRef.current = true;
          clearInterval(interval);
          // Wait briefly at 100% so user sees completion, then enter smoothly
          setTimeout(() => {
            sound.playChime();
            setIsClosing(true);
            setTimeout(() => {
              onEnter();
              setIsClosing(false);
            }, 380);
          }, 350);
        }
        return next;
      });
    }, 65);

    return () => clearInterval(interval);
  }, [isOpen, onEnter]);

  if (!isOpen) return null;

  // Immediate skip button handler
  const handleSkip = () => {
    sound.playPop();
    setIsClosing(true);
    setTimeout(() => {
      onEnter();
      setIsClosing(false);
    }, 280);
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 transition-all duration-400 select-none ${
        isClosing
          ? 'opacity-0 scale-98 pointer-events-none'
          : 'opacity-100 scale-100'
      }`}
      aria-label="Màn hình chào mừng Ổ kẹo ngọt của Wyn"
    >
      {/* Soft Romantic Ambient Gradient Backdrop matching image_d9c5d575.png */}
      <div
        className="fixed inset-0 bg-[#fff4f6] transition-opacity duration-300"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, #fff7f9 0%, #feedf2 45%, #fedbe4 100%)',
        }}
        aria-hidden="true"
      />

      {/* Floating Ambient Decorative Emojis positioned exactly as in image_d9c5d575.png */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        {/* Top-Left Sparkle */}
        <span
          className="absolute top-[8%] left-[6%] sm:top-[12%] sm:left-[10%] text-2xl sm:text-3xl text-amber-300 filter drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)] animate-pulse"
          style={{ animationDuration: '3s' }}
        >
          ✨
        </span>

        {/* Top-Right Candy */}
        <span
          className="absolute top-[9%] right-[7%] sm:top-[14%] sm:right-[12%] text-2xl sm:text-3xl filter drop-shadow-[0_4px_10px_rgba(244,63,94,0.3)] animate-bounce"
          style={{ animationDuration: '2.5s' }}
        >
          🍬
        </span>

        {/* Bottom-Left Heart */}
        <span
          className="absolute bottom-[10%] left-[8%] sm:bottom-[15%] sm:left-[14%] text-2xl sm:text-3xl filter drop-shadow-[0_2px_8px_rgba(255,105,180,0.4)] animate-pulse"
          style={{ animationDuration: '2.2s' }}
        >
          💖
        </span>

        {/* Bottom-Right Blossom */}
        <span
          className="absolute bottom-[8%] right-[8%] sm:bottom-[12%] sm:right-[14%] text-3xl sm:text-4xl filter drop-shadow-[0_2px_8px_rgba(244,63,94,0.25)] animate-pulse"
          style={{ animationDuration: '4s' }}
        >
          🌸
        </span>
      </div>

      {/* Central Content Box matching image_d9c5d575.png */}
      <div className="relative w-full max-w-[460px] mx-auto text-center space-y-4 sm:space-y-5 px-2">
        
        {/* Logo Card with Rounded Square & Badges */}
        <div className="relative mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-[26px] bg-white/90 backdrop-blur-md border-2 border-white shadow-[0_12px_32px_rgba(255,150,180,0.28),inset_0_2px_4px_rgba(255,255,255,0.9)] flex items-center justify-center p-2 group transition-transform">
          {siteLogo ? (
            <img
              src={siteLogo}
              alt="Logo Ổ kẹo ngọt của Wyn"
              className="w-full h-full object-contain rounded-2xl filter drop-shadow-xs"
            />
          ) : (
            <div className="flex flex-col items-center justify-center space-y-1">
              <span className="text-4xl sm:text-5xl select-none filter drop-shadow-[0_4px_10px_rgba(244,63,94,0.35)] transform group-hover:scale-110 transition-transform">
                🍬
              </span>
            </div>
          )}

          {/* Top-Right Golden Sparkle Badge */}
          <span className="absolute -top-1.5 -right-1.5 text-base sm:text-lg select-none filter drop-shadow-xs animate-pulse">
            ✨
          </span>

          {/* Bottom-Left Sweet Heart Badge */}
          <span className="absolute -bottom-1 -left-1 text-sm sm:text-base select-none filter drop-shadow-xs animate-bounce" style={{ animationDuration: '2s' }}>
            ❤️
          </span>
        </div>

        {/* Pill Badge: THẾ GIỚI KẸO NGỌT CỦA WYN 🌸 */}
        <div className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-white/85 border border-[#fed4df] shadow-[0_2px_8px_rgba(255,182,193,0.3)] text-[#ff3366] text-[11px] sm:text-xs font-bold tracking-widest uppercase">
          <span>THẾ GIỚI KẸO NGỌT CỦA WYN</span>
          <span>🌸</span>
        </div>

        {/* Big Script Headline: "Ổ kẹo ngọt của Wyn" */}
        <div className="space-y-1.5">
          <h1
            className="text-3xl sm:text-4xl md:text-[44px] leading-tight font-bold filter drop-shadow-[0_2px_4px_rgba(255,77,109,0.18)]"
            style={{
              fontFamily: "'Dancing Script', 'Caveat', cursive, sans-serif",
            }}
          >
            <span className="text-[#e8256f]">Ổ kẹo ngọt </span>
            <span className="text-[#f5841f]">của Wyn</span>
          </h1>

          {/* Italic Romantic Quote */}
          <p className="text-xs sm:text-[13px] text-slate-600 font-serif italic tracking-wide font-medium leading-relaxed">
            &ldquo;Đôi môi em nhạt... Gieo chút kẹo ngọt trên môi em 🍭 💋&rdquo;
          </p>
        </div>

        {/* Progress Bar Container with Moving Candy on Head */}
        <div className="pt-2 sm:pt-3 space-y-2 max-w-[380px] sm:max-w-[420px] mx-auto w-full">
          {/* Progress Track */}
          <div className="relative w-full h-3 sm:h-3.5 bg-rose-100/80 rounded-full shadow-inner border border-rose-200/50 p-0.5 overflow-visible">
            {/* Animated Fill Bar */}
            <div
              className="relative h-full rounded-full bg-gradient-to-r from-[#ff2e63] via-[#ff5e62] to-[#ff9966] transition-all duration-100 ease-out shadow-[0_0_12px_rgba(255,94,98,0.45)]"
              style={{ width: `${Math.max(4, Math.min(100, progress))}%` }}
            >
              {/* Animated Candy Mascot attached right on the progress bar head */}
              <div
                className="absolute -right-3 -top-2.5 sm:-top-3 text-lg sm:text-xl select-none filter drop-shadow-[0_2px_5px_rgba(0,0,0,0.15)] transform transition-transform"
                style={{
                  transform: `translateX(30%) scale(${progress >= 100 ? 1.2 : 1})`,
                }}
              >
                🍬
              </div>
            </div>
          </div>

          {/* Information & Percentage Row */}
          <div className="flex items-center justify-between text-[11px] sm:text-xs font-semibold px-1 text-slate-600">
            <span className="text-[#e8256f] flex items-center gap-1 font-bold">
              <span>Chào mừng các nàng đã đến với ổ kẹo!</span>
              <span>🌸</span>
              <span>💖</span>
            </span>
            <span className="text-[#e8256f] font-extrabold tabular-nums tracking-wide">
              {Math.min(100, Math.round(progress))}%
            </span>
          </div>
        </div>

        {/* Skip / Enter Action Button: Bỏ qua & Vào ngay 🌸 → */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className="inline-flex items-center gap-1.5 px-6 sm:px-7 py-2 sm:py-2.5 rounded-full text-xs sm:text-[13px] font-bold text-[#e8256f] bg-white/90 hover:bg-white active:scale-95 border border-[#fccad5] shadow-[0_4px_16px_rgba(255,182,193,0.35)] hover:shadow-[0_6px_20px_rgba(255,150,180,0.45)] hover:border-[#ff99b0] transition-all cursor-pointer group"
          >
            <span>Bỏ qua & Vào ngay</span>
            <span className="text-sm">🌸</span>
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>
        </div>

      </div>
    </div>
  );
};
