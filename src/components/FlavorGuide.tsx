import React from 'react';
import { Candy, Sparkles, Heart } from 'lucide-react';
import { sound } from '../utils/audio';

interface FlavorGuideProps {
  onSelectFlavor: (flavorKeyword: string) => void;
}

const FLAVORS = [
  {
    name: 'Dâu Tây Sữa Béo',
    keyword: 'Dâu',
    vibe: 'Ấm áp & Cưng chiều',
    desc: 'Hương vị béo ngậy êm đềm như một cái ôm vào chiều thu se lạnh, xua tan mọi mỏi mệt.',
    color: 'from-rose-500/10 to-pink-500/10 border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400',
  },
  {
    name: 'Việt Quất Rượu Vang',
    keyword: 'Việt quất',
    vibe: 'Ma Mị & Quyến Rũ',
    desc: 'Hương thơm nồng nàn của rượu vang ủ lâu năm hòa cùng quả mọng bóng đêm bí ẩn.',
    color: 'from-indigo-500/10 to-purple-500/10 border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400',
  },
  {
    name: 'Bạc Hà Mát Lạnh',
    keyword: 'Bạc hà',
    vibe: 'Tsundere & Rung Rinh',
    desc: 'Vị the mát sảng khoái giấu sau lớp đường tinh thể, như chú mèo nhỏ hay xù lông nhưng thích được vỗ về.',
    color: 'from-teal-500/10 to-emerald-500/10 border-teal-200 dark:border-teal-900/40 text-teal-600 dark:text-teal-400',
  },
  {
    name: 'Kẹo Bông Vani Hồng',
    keyword: 'Kẹo bông',
    vibe: 'Mê Luyến Ngọt Lịm',
    desc: 'Từng sợi đường hồng bông xốp ngọt ngào tan ngay trên đầu lưỡi, quấn quýt không nỡ rời xa.',
    color: 'from-pink-500/10 to-rose-500/10 border-pink-200 dark:border-pink-900/40 text-pink-600 dark:text-pink-400',
  },
];

export const FlavorGuide: React.FC<FlavorGuideProps> = ({ onSelectFlavor }) => {
  return (
    <section id="flavor-guide" className="py-12 bg-white dark:bg-slate-900 border-t border-rose-100 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-rose-500 uppercase tracking-widest">
            <Candy className="w-3.5 h-3.5" />
            <span>Thực Đơn Hương Vị Của Wyn</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Mỗi nhân vật là một dư vị riêng biệt
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
            Chọn vị kẹo bạn yêu thích nhất để tìm ra người bạn đồng hành phù hợp cho tâm trạng hôm nay.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FLAVORS.map((f, i) => (
            <div
              key={i}
              onClick={() => {
                sound.playPop();
                onSelectFlavor(f.keyword);
              }}
              className={`p-5 rounded-2xl border bg-gradient-to-br ${f.color} cursor-pointer hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between space-y-3 group`}
            >
              <div>
                <div className="text-xs font-semibold mb-1 opacity-80">{f.vibe}</div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-rose-600 transition-colors">
                  {f.name}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {f.desc}
                </p>
              </div>

              <div className="pt-2 text-xs font-semibold flex items-center gap-1 group-hover:underline">
                <span>Lọc nhân vật vị này</span>
                <Sparkles className="w-3 h-3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
