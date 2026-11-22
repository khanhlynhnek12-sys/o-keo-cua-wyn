import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Candy, RotateCcw, Heart, ExternalLink } from 'lucide-react';
import { sound } from '../utils/audio';
import { Character } from '../types/character';

interface LuckyCandyModalProps {
  isOpen: boolean;
  onClose: () => void;
  characters: Character[];
  onSelectCharacter: (char: Character) => void;
}

interface CandyFortune {
  name: string;
  flavor: string;
  emoji: string;
  color: string;
  textColor: string;
  borderColor: string;
  whisper: string;
  vibe: string;
}

const CANDY_FORTUNES: CandyFortune[] = [
  {
    name: 'Kẹo Dâu Tình Đầu',
    flavor: 'Vị ngọt thanh pha chút chua nhẹ',
    emoji: '🍓',
    color: 'from-pink-100 to-rose-200',
    textColor: 'text-rose-700',
    borderColor: 'border-pink-300',
    whisper: 'Hôm nay sẽ có một ánh mắt vô tình khiến tim nàng đập chệch một nhịp. Đừng ngần ngại mỉm cười nhé!',
    vibe: 'Ngọt ngào · Chớm nở · Dịu dàng',
  },
  {
    name: 'Sô-cô-la Đắng Huyền Bí',
    flavor: 'Vị đậm đà, hậu ngọt sâu lắng',
    emoji: '🍫',
    color: 'from-amber-100 to-stone-200',
    textColor: 'text-stone-800',
    borderColor: 'border-amber-300',
    whisper: 'Những thử thách hôm nay chỉ là lớp vỏ ngoài, bên trong là phần thưởng xứng đáng nhất đang đợi nàng.',
    vibe: 'Trầm ấm · Cuốn hút · Trưởng thành',
  },
  {
    name: 'Kẹo Đào Mộng Mơ',
    flavor: 'Vị thơm lừng như vườn hoa mùa xuân',
    emoji: '🍑',
    color: 'from-orange-100 to-rose-100',
    textColor: 'text-orange-700',
    borderColor: 'border-orange-300',
    whisper: 'Có người đang thầm nhớ nụ cười của nàng đấy. Hãy cứ tự tin là chính mình rạng rỡ nhất nha!',
    vibe: 'Trong sáng · Hạnh phúc · Ấm áp',
  },
  {
    name: 'Kẹo Nho Tím Hoàng Gia',
    flavor: 'Vị thanh tao, quý phái',
    emoji: '🍇',
    color: 'from-purple-100 to-indigo-100',
    textColor: 'text-purple-700',
    borderColor: 'border-purple-300',
    whisper: 'Nàng sinh ra là công chúa trong câu chuyện của chính mình. Đừng để bất kỳ ai làm lu mờ vương miện đó.',
    vibe: 'Kiêu kỳ · Sang trọng · Độc lập',
  },
  {
    name: 'Kẹo Chanh Muối Giông Bão',
    flavor: 'Chua thanh mặn nhẹ, bùng nổ năng lượng',
    emoji: '🍋',
    color: 'from-yellow-100 to-amber-100',
    textColor: 'text-amber-800',
    borderColor: 'border-yellow-300',
    whisper: 'Cơn mưa nào rồi cũng tạnh, giông bão qua đi là lúc cầu vồng rực rỡ nhất sẽ xuất hiện chào đón nàng!',
    vibe: 'Bản lĩnh · Kiên cường · Rực rỡ',
  },
  {
    name: 'Kẹo Mật Ong Vỗ Về',
    flavor: 'Ngọt ngào êm dịu, ấm sực cổ họng',
    emoji: '🍯',
    color: 'from-amber-100 to-orange-100',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-300',
    whisper: 'Dẫu ngoài kia có bao mệt mỏi, ổ kẹo của Wyn vẫn luôn là chốn bình yên chào đón nàng trở về.',
    vibe: 'Chữa lành · Bình yên · Ôm ấp',
  },
  {
    name: 'Kẹo Bạc Hà Gió Thoảng',
    flavor: 'Mát lạnh sảng khoái đến từng giác quan',
    emoji: '🍃',
    color: 'from-teal-100 to-emerald-100',
    textColor: 'text-teal-800',
    borderColor: 'border-teal-300',
    whisper: 'Hít một hơi thật sâu, thở ra mọi muộn phiền. Nàng đã làm rất tốt rồi, hôm nay hãy thưởng cho mình một chút nghỉ ngơi nhé.',
    vibe: 'Thư thái · Trong trẻo · An yên',
  },
];

export const LuckyCandyModal: React.FC<LuckyCandyModalProps> = ({
  isOpen,
  onClose,
  characters,
  onSelectCharacter,
}) => {
  const [isShaking, setIsShaking] = useState(false);
  const [drawnCandy, setDrawnCandy] = useState<CandyFortune | null>(null);
  const [drawnCharacter, setDrawnCharacter] = useState<Character | null>(null);

  if (!isOpen) return null;

  const handlePickCandy = () => {
    sound.playPop();
    setIsShaking(true);
    setDrawnCandy(null);
    setDrawnCharacter(null);

    setTimeout(() => {
      setIsShaking(false);
      sound.playSuccess();

      // If characters exist, 50% chance pick a character or pick a sweet candy fortune
      if (characters.length > 0 && Math.random() > 0.5) {
        const randChar = characters[Math.floor(Math.random() * characters.length)];
        setDrawnCharacter(randChar);
      } else {
        const randFortune = CANDY_FORTUNES[Math.floor(Math.random() * CANDY_FORTUNES.length)];
        setDrawnCandy(randFortune);
      }
    }, 700);
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
          className="relative w-full max-w-md bg-white rounded-3xl shadow-xl border border-rose-200 p-6 sm:p-8 space-y-5 z-10 overflow-hidden"
        >
          {/* Subtle glow background */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-rose-100 rounded-full blur-2xl pointer-events-none" />

          {/* Modal Header */}
          <div className="flex items-center justify-between border-b border-rose-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-full bg-rose-100 text-rose-500">
                <Candy className="w-5 h-5 fill-rose-300" />
              </div>
              <div>
                <h3 className="font-script text-2xl font-bold text-[#b53457] leading-none">
                  Hũ Bốc Kẹo Ngon
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Rút một viên kẹo may mắn và nhận lời thì thầm ngọt ngào từ Wyn ✨
                </p>
              </div>
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

          {/* Shaking Candy Jar Area */}
          <div className="py-2 text-center space-y-4">
            {!drawnCandy && !drawnCharacter && (
              <div className="space-y-4">
                <motion.div
                  animate={
                    isShaking
                      ? {
                          rotate: [-8, 8, -6, 6, -3, 3, 0],
                          scale: [1, 1.08, 0.96, 1.05, 1],
                        }
                      : { y: [0, -4, 0] }
                  }
                  transition={
                    isShaking
                      ? { duration: 0.65, ease: 'easeInOut' }
                      : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
                  }
                  className="w-28 h-28 mx-auto rounded-3xl bg-gradient-to-tr from-rose-200 via-pink-100 to-amber-100 border-2 border-rose-300 shadow-inner flex flex-col items-center justify-center cursor-pointer select-none group"
                  onClick={handlePickCandy}
                >
                  <span className="text-4xl group-hover:scale-110 transition-transform">🍬</span>
                  <span className="text-[10px] font-bold text-rose-600 mt-1 uppercase tracking-wider">
                    Chạm để bốc
                  </span>
                </motion.div>

                <p className="text-xs text-slate-500">
                  {isShaking
                    ? 'Đang lắc hũ kẹo xào xạc... 🍭'
                    : 'Hãy nhắm mắt lại, nghĩ về một điều ước và chạm vào hũ kẹo nhé!'}
                </p>

                <button
                  type="button"
                  disabled={isShaking}
                  onClick={handlePickCandy}
                  className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-gradient-to-r from-[#ff5364] to-[#ff7d45] hover:opacity-95 rounded-full shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{isShaking ? 'Đang bốc kẹo...' : 'Bốc Kẹo Ngon Ngay ✨'}</span>
                </button>
              </div>
            )}

            {/* Result: Candy Fortune */}
            {drawnCandy && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className={`p-5 rounded-2xl bg-gradient-to-b ${drawnCandy.color} border ${drawnCandy.borderColor} text-left space-y-3 shadow-sm`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{drawnCandy.emoji}</span>
                    <div>
                      <h4 className={`text-base font-bold ${drawnCandy.textColor}`}>
                        {drawnCandy.name}
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        {drawnCandy.flavor}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-white/70 px-2.5 py-1 rounded-full text-slate-700 font-semibold border border-white/80">
                    Vị hôm nay
                  </span>
                </div>

                <div className="bg-white/85 backdrop-blur-xs p-3.5 rounded-xl border border-white/60 space-y-1.5">
                  <div className="text-[11px] font-bold text-rose-600 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Lời thì thầm từ Wyn:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed italic">
                    "{drawnCandy.whisper}"
                  </p>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold tracking-wide">
                    {drawnCandy.vibe}
                  </span>
                  <button
                    type="button"
                    onClick={handlePickCandy}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Bốc viên khác</span>
                  </button>
                </div>
              </motion.div>
            )}

            {/* Result: Random Character */}
            {drawnCharacter && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="p-5 rounded-2xl bg-gradient-to-b from-rose-50 to-pink-100 border border-rose-300 text-left space-y-3 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={drawnCharacter.avatar}
                    alt={drawnCharacter.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-rose-300 shadow-xs"
                  />
                  <div>
                    <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider">
                      Nhân vật định mệnh hôm nay
                    </span>
                    <h4 className="text-lg font-bold text-slate-800 leading-tight">
                      {drawnCharacter.name}
                    </h4>
                    <span className="text-xs text-slate-600">
                      {drawnCharacter.genre}
                    </span>
                  </div>
                </div>

                {drawnCharacter.firstMessage && (
                  <div className="bg-white/90 p-3 rounded-xl border border-rose-200/80 text-xs text-slate-700 italic">
                    "{drawnCharacter.firstMessage}"
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectCharacter(drawnCharacter);
                    }}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
                  >
                    <span>Xem chi tiết</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={handlePickCandy}
                    className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-800"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Bốc lại</span>
                  </button>
                </div>
              </motion.div>
            )}
          </div>

          {/* Bottom Close */}
          <div className="pt-1 flex justify-center">
            <button
              type="button"
              onClick={() => {
                sound.playPop();
                onClose();
              }}
              className="text-xs text-slate-400 hover:text-slate-600 py-1"
            >
              Đóng hộp kẹo
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
