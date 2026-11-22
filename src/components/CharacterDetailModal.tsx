import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  ExternalLink,
  Copy,
  Heart,
  MessageSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Send,
  Edit3,
  Trash2,
  Candy,
  Check,
} from 'lucide-react';
import { Character } from '../types/character';
import { sound } from '../utils/audio';

interface CharacterDetailModalProps {
  character: Character | null;
  onClose: () => void;
  onToggleFavorite: (id: string) => void;
  onCopyFirstMessage: (message: string) => void;
  onCopyLink: (link: string) => void;
  onEdit: (character: Character) => void;
  onDelete: (id: string) => void;
  onNext: () => void;
  onPrev: () => void;
  isFavorite: boolean;
  totalCharacters: number;
  currentIndex: number;
  isAdmin?: boolean;
  onTasted?: (id: string) => void;
}

export const CharacterDetailModal: React.FC<CharacterDetailModalProps> = ({
  character,
  onClose,
  onToggleFavorite,
  onCopyFirstMessage,
  onCopyLink,
  onEdit,
  onDelete,
  onNext,
  onPrev,
  isFavorite,
  totalCharacters,
  currentIndex,
  isAdmin = false,
  onTasted,
}) => {
  const [userReply, setUserReply] = useState('');
  const [simulatedChat, setSimulatedChat] = useState<{ sender: 'user' | 'bot'; text: string }[]>([]);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedMsg, setCopiedMsg] = useState(false);

  // Reset chat when character changes
  React.useEffect(() => {
    if (character) {
      setSimulatedChat([
        { sender: 'bot', text: character.firstMessage }
      ]);
      setUserReply('');
      setCopiedLink(false);
      setCopiedMsg(false);
    }
  }, [character?.id]);

  if (!character) return null;

  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userReply.trim()) return;

    sound.playPop();
    const newChat = [...simulatedChat, { sender: 'user' as const, text: userReply.trim() }];
    setSimulatedChat(newChat);
    const sentText = userReply.trim();
    setUserReply('');

    // Simulated character response with gentle tone
    setTimeout(() => {
      sound.playChime();
      let reply = 'Cảm ơn em đã lắng nghe anh. Mỗi lần gặp em là một niềm vui ngọt ngào.';
      if (character.sampleReplies && character.sampleReplies.length > 0) {
        const randIndex = Math.floor(Math.random() * character.sampleReplies.length);
        reply = character.sampleReplies[randIndex];
      }
      setSimulatedChat((prev) => [...prev, { sender: 'bot', text: reply }]);
    }, 450);
  };

  const handleQuickPrompt = (prompt: string) => {
    setUserReply(prompt);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="fixed inset-0 bg-slate-900/60 dark:bg-black/75 backdrop-blur-sm"
        />

        {/* Modal Dialog with Smooth Spring Animation */}
        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-100 dark:border-slate-800 overflow-hidden z-10"
        >
          {/* Top Control Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-rose-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
            {/* Left: Index navigation */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onPrev();
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Nhân vật trước"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {currentIndex + 1} / {totalCharacters}
              </span>
              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onNext();
                }}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Nhân vật kế tiếp"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Right: Actions and close */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sound.playHeart();
                  onToggleFavorite(character.id);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                  isFavorite
                    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/40 border border-rose-200/70 dark:border-rose-900'
                    : 'text-slate-500 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 border border-transparent'
                }`}
                title={`${isFavorite ? 'Bỏ yêu thích' : 'Thêm yêu thích'} (${character.likesCount || 0} lượt tim)`}
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
                <span className="text-xs font-bold tabular-nums">{character.likesCount || 0}</span>
              </button>

              {isAdmin && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      onEdit(character);
                    }}
                    className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Chỉnh sửa thông tin nhân vật (Admin)"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDelete(character.id);
                      onClose();
                    }}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                    title="Xóa nhân vật khỏi hũ kẹo (Admin)"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}

              <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-1" />

              <button
                type="button"
                onClick={() => {
                  sound.playPop();
                  onClose();
                }}
                className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Đóng (ESC)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Modal Main Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 sm:p-8">
              {/* Left Column: Portrait & Flavor Info (5 cols) */}
              <div className="lg:col-span-5 space-y-4">
                <div className="relative aspect-3/4 rounded-2xl overflow-hidden bg-rose-50 dark:bg-slate-800 shadow-md border border-rose-100 dark:border-slate-700">
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-full h-full object-cover object-top"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.currentTarget;
                      target.style.display = 'none';
                      if (target.nextElementSibling) {
                        (target.nextElementSibling as HTMLElement).style.display = 'flex';
                      }
                    }}
                  />
                  <div
                    style={{ display: 'none' }}
                    className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-tr from-rose-100 to-pink-50 dark:from-slate-800 dark:to-slate-900 text-rose-500 p-6 text-center"
                  >
                    <Candy className="w-16 h-16 mb-3 stroke-[1.5]" />
                    <span className="text-base font-bold text-slate-800 dark:text-slate-200">{character.name}</span>
                  </div>

                  {/* Gradient Overlay for bottom text */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 text-white">
                    <span className="text-xs font-semibold text-rose-300 drop-shadow-xs">
                      {character.sweetFlavor}
                    </span>
                    <h2 className="text-2xl font-bold leading-tight drop-shadow-xs">
                      {character.name}
                    </h2>
                  </div>
                </div>

                {/* Personality Traits & Flavor Details */}
                <div className="p-4 bg-rose-50/60 dark:bg-slate-800/60 rounded-2xl border border-rose-100/70 dark:border-slate-700/60 space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                    <Candy className="w-3.5 h-3.5" />
                    <span>Hương vị & Đặc trưng tính cách</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {character.personalityTraits?.map((trait, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg border border-rose-100 dark:border-slate-700"
                      >
                        {trait}
                      </span>
                    ))}
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                    "{character.tagline}"
                  </p>
                </div>

                {/* Character Link Highlight Box with Mở kẹo thưởng thức */}
                <div className="p-4 bg-white dark:bg-slate-800 rounded-2xl border border-rose-200 dark:border-slate-700 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Candy className="w-3.5 h-3.5 text-rose-500 fill-rose-300" />
                      <span>Cổng liên kết nhân vật</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playSuccess();
                        onCopyLink(character.characterLink);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép link</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Đã có ... nàng thưởng thức kẹo */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r from-rose-50 via-pink-50 to-rose-50 dark:from-slate-800 dark:to-slate-850 border border-rose-100 dark:border-slate-700 text-xs">
                    <span className="flex items-center gap-1.5 font-semibold text-rose-700 dark:text-rose-300">
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>
                        Đã có <strong className="text-rose-600 dark:text-rose-400 font-bold">{character.tastedCount || 0}</strong> nàng thưởng thức kẹo
                      </span>
                    </span>
                    <span className="text-[10px] text-pink-500 font-medium bg-white/80 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-rose-100 dark:border-slate-700">
                      🍬 viên kẹo ngọt
                    </span>
                  </div>

                  <a
                    href={character.characterLink || '#'}
                    target={character.characterLink && character.characterLink !== '#' ? '_blank' : undefined}
                    rel="noopener noreferrer"
                    onClick={() => {
                      sound.playChime();
                      if (character.characterLink && character.characterLink !== '#') {
                        onTasted?.(character.id);
                      }
                    }}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-rose-500 via-pink-500 to-rose-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-xs hover:shadow-md transition-all cursor-pointer"
                  >
                    <ExternalLink className="w-4 h-4 stroke-[2.5]" />
                    <span>Mở kẹo thưởng thức (Trò chuyện ngay)</span>
                  </a>

                  {character.characterLink && (
                    <p className="text-[11px] text-slate-400 truncate text-center">
                      {character.characterLink}
                    </p>
                  )}
                </div>
              </div>

              {/* Right Column: Full Info, Backstory & Chat Simulator (7 cols) */}
              <div className="lg:col-span-7 space-y-6">
                {/* Header Information */}
                <div>
                  <div className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1.5 mb-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{character.genre}</span>
                  </div>
                  <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    {character.name}
                  </h1>
                </div>

                {/* Section: Backstory (Tiểu sử / Cốt truyện) */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Tiểu sử & Xuất thân
                  </h3>
                  <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line space-y-2.5 bg-slate-50/60 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                    {character.backstory}
                  </div>
                </div>

                {/* Section: Opening Message (Tin nhắn đầu) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-rose-500" />
                      <span>Tin nhắn đầu tiên</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playSuccess();
                        onCopyFirstMessage(character.firstMessage);
                        setCopiedMsg(true);
                        setTimeout(() => setCopiedMsg(false), 2000);
                      }}
                      className="text-xs text-rose-600 dark:text-rose-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      {copiedMsg ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-600">Đã chép tin nhắn</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Sao chép tin nhắn</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Character First Message Speech Bubble */}
                  <div className="p-4 sm:p-5 bg-gradient-to-br from-rose-50 via-pink-50/40 to-amber-50/30 dark:from-slate-800 dark:via-slate-800/80 dark:to-slate-800 rounded-2xl border border-rose-200/80 dark:border-slate-700 relative">
                    <p className="text-sm sm:text-base font-medium italic text-slate-800 dark:text-slate-200 leading-relaxed">
                      "{character.firstMessage}"
                    </p>
                  </div>
                </div>

                {/* Section: Interactive Dialogue Simulation (Thử tương tác nhanh) */}
                <div className="p-4 sm:p-5 bg-white dark:bg-slate-800/90 rounded-2xl border border-rose-100 dark:border-slate-700/80 shadow-xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-500" />
                      <span>Thử tương tác với {character.name}</span>
                    </h4>
                    <span className="text-[11px] text-slate-400">Mô phỏng trò chuyện</span>
                  </div>

                  {/* Chat message stream */}
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {simulatedChat.map((msg, i) => (
                      <div
                        key={i}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-rose-500 text-white rounded-br-xs'
                              : 'bg-rose-50 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-xs border border-rose-100 dark:border-slate-600'
                          }`}
                        >
                          {msg.text}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Quick suggested prompts */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('Chào cậu, hôm nay có kẹo gì thơm không?')}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
                    >
                      "Hôm nay có kẹo gì ngon?"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('Cậu có thể kể thêm về câu chuyện của mình không?')}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
                    >
                      "Kể thêm về cậu đi"
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickPrompt('Mình thích vị ngọt của cậu nhất đấy!')}
                      className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-rose-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
                    >
                      "Mình thích cậu lắm"
                    </button>
                  </div>

                  {/* Input form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-1">
                    <input
                      type="text"
                      value={userReply}
                      onChange={(e) => setUserReply(e.target.value)}
                      placeholder={`Gửi lời nhắn đáp lại ${character.name}...`}
                      className="flex-1 px-3.5 py-2 text-xs sm:text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-400 text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="submit"
                      disabled={!userReply.trim()}
                      className="p-2 sm:px-4 sm:py-2 bg-rose-500 hover:bg-rose-600 disabled:opacity-40 text-white rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Gửi</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
