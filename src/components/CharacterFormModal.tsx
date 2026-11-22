import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Check, Image as ImageIcon, Plus, Upload } from 'lucide-react';
import { Character } from '../types/character';
import { PRESET_GENRES } from '../data/genres';
import { saveCustomGenresToFirestore, subscribeCustomGenres } from '../firebase/services';
import { compressMediaFile } from '../utils/imageCompressor';
import { sound } from '../utils/audio';

interface CharacterFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (character: Character) => void;
  initialData?: Character | null;
  defaultGenre?: string;
}

const PRESET_AVATARS = [
  { label: 'Liên Vũ (Dâu tây)', path: '/images/wyn_char_lian_1793720549992.jpg' },
  { label: 'Dạ Thần (Việt quất)', path: '/images/wyn_char_kaelen_1793720550098.jpg' },
  { label: 'Lâm Miêu (Bạc hà)', path: '/images/wyn_char_mio_1793720551324.jpg' },
  { label: 'Bạch Dạ Dạ (Kẹo bông)', path: '/images/wyn_char_sylvie_1793720552627.jpg' },
];

export const CharacterFormModal: React.FC<CharacterFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultGenre = '',
}) => {
  const [name, setName] = useState('');
  const [genre, setGenre] = useState('');
  const [tagline, setTagline] = useState('');
  const [sweetFlavor, setSweetFlavor] = useState('');
  const [backstory, setBackstory] = useState('');
  const [firstMessage, setFirstMessage] = useState('');
  const [characterLink, setCharacterLink] = useState('');
  const [avatar, setAvatar] = useState('/images/wyn_char_lian_1793720549992.jpg');
  const [traits, setTraits] = useState('');
  const [validationError, setValidationError] = useState('');

  const [customGenres, setCustomGenres] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('wyn_custom_genres');
      if (saved) return JSON.parse(saved);
    } catch {
      //
    }
    return [];
  });
  const [newGenreInput, setNewGenreInput] = useState('');

  const allAvailableGenres = useMemo(() => {
    const list: { name: string; emoji: string }[] = PRESET_GENRES.map((g) => ({
      name: g.name,
      emoji: g.emoji,
    }));

    customGenres.forEach((cg) => {
      if (!list.some((item) => item.name.toLowerCase() === cg.toLowerCase())) {
        list.push({ name: cg, emoji: '✨' });
      }
    });

    return list;
  }, [customGenres]);

  useEffect(() => {
    setValidationError('');
    if (initialData) {
      setName(initialData.name);
      setGenre(initialData.genre);
      setTagline(initialData.tagline);
      setSweetFlavor(initialData.sweetFlavor);
      setBackstory(initialData.backstory);
      setFirstMessage(initialData.firstMessage);
      setCharacterLink(initialData.characterLink);
      setAvatar(initialData.avatar);
      setTraits(initialData.personalityTraits?.join(', ') || '');
    } else {
      setName('');
      setGenre(defaultGenre || '');
      setTagline('');
      setSweetFlavor('');
      setBackstory('');
      setFirstMessage('');
      setCharacterLink('https://character.ai/');
      setAvatar('/images/wyn_char_lian_1793720549992.jpg');
      setTraits('Dịu dàng, Đáng yêu, Ngọt ngào');
    }
  }, [initialData, defaultGenre, isOpen]);

  const handleToggleGenreTag = (genreName: string) => {
    sound.playPop();
    const currentTags = genre
      .split('·')
      .map((s) => s.trim())
      .filter(Boolean);

    const exists = currentTags.some((t) => t.toLowerCase() === genreName.toLowerCase());
    if (exists) {
      const updated = currentTags.filter((t) => t.toLowerCase() !== genreName.toLowerCase());
      setGenre(updated.join(' · '));
    } else {
      const updated = [...currentTags, genreName];
      setGenre(updated.join(' · '));
    }
  };

  useEffect(() => {
    const unsubscribe = subscribeCustomGenres((remoteGenres) => {
      if (Array.isArray(remoteGenres)) {
        setCustomGenres(remoteGenres);
        try {
          localStorage.setItem('wyn_custom_genres', JSON.stringify(remoteGenres));
        } catch {
          //
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAddCustomGenre = () => {
    const trimmed = newGenreInput.trim();
    if (!trimmed) return;
    sound.playSuccess();

    if (!customGenres.some((g) => g.toLowerCase() === trimmed.toLowerCase())) {
      const updated = [...customGenres, trimmed];
      setCustomGenres(updated);
      saveCustomGenresToFirestore(updated).catch(() => {});
      try {
        localStorage.setItem('wyn_custom_genres', JSON.stringify(updated));
      } catch {
        //
      }
    }

    handleToggleGenreTag(trimmed);
    setNewGenreInput('');
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !genre.trim() || !backstory.trim() || !firstMessage.trim()) {
      setValidationError('Vui lòng điền đầy đủ Tên, Thể loại, Cốt truyện và Tin nhắn đầu tiên nhé!');
      return;
    }

    sound.playSuccess();
    const characterToSave: Character = {
      id: initialData ? initialData.id : `char-${Date.now()}`,
      name: name.trim(),
      genre: genre.trim(),
      tagline: tagline.trim() || 'Một viên kẹo ngọt ngào trong Ổ kẹo của Wyn',
      sweetFlavor: sweetFlavor.trim() || 'Kẹo trái cây ngọt ngào',
      backstory: backstory.trim(),
      firstMessage: firstMessage.trim(),
      characterLink: characterLink.trim() || 'https://character.ai/',
      avatar: avatar.trim(),
      personalityTraits: traits
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      themeColor: initialData?.themeColor || {
        bgGradient: 'from-pink-100 via-rose-50 to-amber-100',
        badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
        badgeText: 'text-rose-700',
        borderActive: 'border-rose-400 ring-rose-200',
        accent: '#e11d48',
        softGlow: 'rgba(244, 63, 94, 0.25)',
      },
      sampleReplies: initialData?.sampleReplies || [
        'Cảm ơn em đã gửi lời nhắn cho anh/em nhé.',
        'Mỗi ngày gặp em đều khiến tâm trạng ngọt ngào hơn rất nhiều.',
        'Hãy ở bên cạnh mình thêm một chút nữa nhé.'
      ],
      isFavorite: initialData?.isFavorite || false,
      createdAt: initialData?.createdAt || new Date().toISOString().split('T')[0],
      tastedCount: initialData?.tastedCount || 0,
    };

    onSave(characterToSave);
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            sound.playPop();
            onClose();
          }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        />

        <motion.div
          role="dialog"
          aria-modal="true"
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-2xl max-h-[92vh] flex flex-col bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-rose-100 dark:border-slate-800 overflow-hidden z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md shrink-0">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {initialData ? 'Chỉnh sửa nhân vật' : 'Thêm nhân vật mới vào Ổ kẹo'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs sm:text-sm">
            {/* Row 1: Name and Genre */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Tên nhân vật *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Hạ Vũ (Lian)"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Thể loại *
                  </label>
                  <span className="text-[10px] text-pink-500 font-medium">Bấm chọn nhanh bên dưới</span>
                </div>
                <input
                  type="text"
                  required
                  value={genre}
                  onChange={(e) => setGenre(e.target.value)}
                  placeholder="Ví dụ: Thanh mai trúc mã · Tổng tài · Nuông chiều"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
                />

                {/* Quick Genre Chips & Custom Genre Creator */}
                <div className="mt-2 space-y-2">
                  <span className="text-[10px] text-slate-400 block">
                    Gợi ý thể loại (bấm chọn hoặc viết thêm):
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 bg-slate-50/70 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 rounded-xl">
                    {allAvailableGenres.map((g) => {
                      const isSelected = genre
                        .split('·')
                        .map((s) => s.trim().toLowerCase())
                        .includes(g.name.toLowerCase());
                      return (
                        <button
                          key={g.name}
                          type="button"
                          onClick={() => handleToggleGenreTag(g.name)}
                          className={`text-[10px] px-2 py-0.5 rounded-full border transition-all flex items-center gap-1 cursor-pointer ${
                            isSelected
                              ? 'bg-[#ff5364] text-white border-[#ff5364] font-bold shadow-2xs'
                              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-rose-300 hover:text-rose-600'
                          }`}
                        >
                          <span>{g.emoji}</span>
                          <span>{g.name}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Input để viết thêm thể loại mới */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <input
                      type="text"
                      value={newGenreInput}
                      onChange={(e) => setNewGenreInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomGenre();
                        }
                      }}
                      placeholder="Viết thêm thể loại mới..."
                      className="flex-1 px-3 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomGenre}
                      className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-xl shadow-2xs cursor-pointer shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                      <span>Thêm</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Row 2: Sweet Flavor & Tagline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vị kẹo đặc trưng
                </label>
                <input
                  type="text"
                  value={sweetFlavor}
                  onChange={(e) => setSweetFlavor(e.target.value)}
                  placeholder="Ví dụ: Kẹo dâu sữa béo / Kẹo bạc hà mát lạnh"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Khẩu hiệu / Giới thiệu 1 câu
                </label>
                <input
                  type="text"
                  value={tagline}
                  onChange={(e) => setTagline(e.target.value)}
                  placeholder="Ví dụ: Người luôn giấu kẹo vào túi áo bạn"
                  className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>

            {/* Avatar preset selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Chọn ảnh đại diện nhân vật</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
                {PRESET_AVATARS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      sound.playPop();
                      setAvatar(item.path);
                    }}
                    className={`relative p-1.5 rounded-xl border flex flex-col items-center gap-1.5 transition-all text-left ${
                      avatar === item.path
                        ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 ring-2 ring-rose-300'
                        : 'border-slate-200 dark:border-slate-700 hover:border-rose-300'
                    }`}
                  >
                    <img
                      src={item.path}
                      alt={item.label}
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate w-full text-center">
                      {item.label}
                    </span>
                    {avatar === item.path && (
                      <span className="absolute top-2 right-2 bg-rose-500 text-white rounded-full p-0.5">
                        <Check className="w-3 h-3" />
                      </span>
                    )}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={avatar}
                  onChange={(e) => setAvatar(e.target.value)}
                  placeholder="Hoặc dán đường dẫn ảnh tùy chỉnh..."
                  className="flex-1 px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-xs text-slate-900 dark:text-slate-100"
                />
                <label className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 rounded-xl text-xs font-semibold cursor-pointer transition-colors shrink-0">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Tải ảnh</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const res = await compressMediaFile(file, 600, 600, 0.8);
                        setAvatar(res.dataUrl);
                        sound.playSuccess();
                      } catch {
                        //
                      }
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Backstory */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tiểu sử & Cốt truyện (Backstory) *
              </label>
              <textarea
                required
                rows={4}
                value={backstory}
                onChange={(e) => setBackstory(e.target.value)}
                placeholder="Kể về xuất thân, tính cách, hoàn cảnh gặp gỡ bạn của nhân vật..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>

            {/* First Message */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tin nhắn đầu tiên (First Message) *
              </label>
              <textarea
                required
                rows={3}
                value={firstMessage}
                onChange={(e) => setFirstMessage(e.target.value)}
                placeholder="Lời thoại đầu tiên khi nhân vật mở lời chào hoặc tương tác với bạn..."
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100 leading-relaxed"
              />
            </div>

            {/* Character Link */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Link nhân vật (Character Link) *
              </label>
              <input
                type="url"
                required
                value={characterLink}
                onChange={(e) => setCharacterLink(e.target.value)}
                placeholder="https://character.ai/chat/... hoặc link bot Discord, c.ai"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* Personality Traits */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Nét tính cách (phân cách bằng dấu phẩy)
              </label>
              <input
                type="text"
                value={traits}
                onChange={(e) => setTraits(e.target.value)}
                placeholder="Dịu dàng, Thâm tình, Hay dỗi, Chu đáo"
                className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-400 focus:outline-none text-slate-900 dark:text-slate-100"
              />
            </div>

            {validationError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-600 dark:text-rose-300 font-medium">
                {validationError}
              </div>
            )}

            {/* Actions */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 rounded-xl shadow-xs transition-all"
              >
                {initialData ? 'Lưu thay đổi' : 'Thêm vào Ổ kẹo'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
