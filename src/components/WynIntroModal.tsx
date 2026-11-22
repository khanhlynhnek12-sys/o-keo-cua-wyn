import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Heart, Sparkles, Candy } from 'lucide-react';
import { sound } from '../utils/audio';

interface WynIntroModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WynIntroModal: React.FC<WynIntroModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-lg bg-gradient-to-b from-white via-[#fff9fa] to-[#fff3f5] rounded-3xl shadow-xl border border-rose-200 p-6 sm:p-8 space-y-5 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2 text-rose-600">
              <Candy className="w-5 h-5 fill-rose-200" />
              <h2 className="font-script text-2xl font-bold text-[#b53457]">
                Lời thì thầm từ Wyn
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-rose-50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Letter Body */}
          <div className="space-y-3.5 text-xs sm:text-sm text-slate-700 leading-relaxed font-normal">
            <p className="text-sm sm:text-base font-bold text-[#b53457] leading-snug">
              Hảo la hảo la! Chào mừng các nàng đến với chiếc ổ nhỏ này! 🌸
            </p>
            <p>
              Xin tự giới thiệu một chút, chủ của chiếc ổ này là Wyn, mọi người cứ gọi là Wyn nè. ✨ Wyn đến với thế giới viết lách này là muốn gửi gắm những đứa con tinh thần của mình cho mọi người. 📚💖 Chiếc ổ này có đủ vị kẹo, từ ngọt ngào đến đắng cay. 🍬☕
            </p>
            <p className="bg-[#fff0f3] p-3 rounded-2xl border border-[#fac8d1] text-slate-700 italic">
              Chủ ổ này dễ tính nhưng cũng dễ cọc, mong mọi người yêu thương. 🥰 Nếu có gì sai sót thì hãy feedback để Wyn biết nè, xin đừng nặng lời nha.
            </p>
            <p className="font-semibold text-[#e87739] text-sm">
              Xia xỉa! 🙏 Tym tym! 💕
            </p>
            <div className="pt-2 text-right">
              <span className="font-script text-2xl text-[#b53457] font-bold">~ Wyn ~</span>
            </div>
          </div>

          {/* Close button */}
          <div className="pt-2 flex justify-center">
            <button
              type="button"
              onClick={() => {
                sound.playChime();
                onClose();
              }}
              className="px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-xs transition-all"
            >
              Cảm ơn Wyn 💌
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
