import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Heart, Sparkles, MessageSquareHeart } from 'lucide-react';
import { sound } from '../utils/audio';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSendSuccess: (msg: string) => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSendSuccess,
}) => {
  const [senderName, setSenderName] = useState('');
  const [message, setMessage] = useState('');
  const [candySticker, setCandySticker] = useState('🍓 Kẹo dâu ngọt ngào');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    sound.playSuccess();
    try {
      const existing = JSON.parse(localStorage.getItem('wyn_feedback_messages') || '[]');
      existing.unshift({
        id: Date.now(),
        sender: senderName.trim() || 'Một người ghé thăm ẩn danh',
        message: message.trim(),
        sticker: candySticker,
        date: new Date().toLocaleDateString('vi-VN'),
      });
      localStorage.setItem('wyn_feedback_messages', JSON.stringify(existing));
    } catch {
      //
    }

    onSendSuccess('Lời nhắn ngọt ngào của bạn đã được gửi đến Wyn thành công!');
    setMessage('');
    setSenderName('');
    onClose();
  };

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
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl border border-rose-200 p-6 sm:p-8 space-y-4 z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2 text-rose-600">
              <MessageSquareHeart className="w-5 h-5" />
              <h2 className="font-script text-2xl font-bold text-[#b53457]">
                Gửi lời nhắn cho Wyn
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

          <p className="text-xs text-slate-600">
            Bạn có thể gửi một lời chúc, cảm nhận về ổ kẹo, hoặc yêu cầu tạo thêm nhân vật mới cho Wyn nhé! 💌
          </p>

          <form onSubmit={handleSubmit} className="space-y-3.5 text-xs sm:text-sm">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Tên hoặc biệt danh của bạn
              </label>
              <input
                type="text"
                value={senderName}
                onChange={(e) => setSenderName(e.target.value)}
                placeholder="Ví dụ: Bé Mèo, Người thích kẹo dâu..."
                className="w-full px-3.5 py-2 bg-[#fff7f8] border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gắn kèm một nhãn kẹo ngọt
              </label>
              <select
                value={candySticker}
                onChange={(e) => setCandySticker(e.target.value)}
                className="w-full px-3 py-2 bg-[#fff7f8] border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 text-xs cursor-pointer"
              >
                <option value="🍓 Kẹo dâu ngọt ngào">🍓 Kẹo dâu ngọt ngào</option>
                <option value="🫐 Kẹo việt quất ma mị">🫐 Kẹo việt quất ma mị</option>
                <option value="🌿 Kẹo bạc hà the mát">🌿 Kẹo bạc hà the mát</option>
                <option value="🌸 Kẹo bông gòn hồng">🌸 Kẹo bông gòn hồng</option>
                <option value="🍋 Kẹo chanh muối thanh mát">🍋 Kẹo chanh muối thanh mát</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Lời nhắn của bạn *
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Hãy viết vài dòng tâm tình, chia sẻ tâm trạng hay gửi lời chào đến Wyn..."
                className="w-full px-3.5 py-2.5 bg-[#fff7f8] border border-rose-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-800 text-xs leading-relaxed"
              />
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Gửi lời nhắn</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
