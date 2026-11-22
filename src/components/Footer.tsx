import React from 'react';
import { Candy } from 'lucide-react';

export interface FooterProps {
  onExport?: () => void;
  onImport?: () => void;
  onResetDefault?: () => void;
  onOpenWelcomeGate?: () => void;
}

export const Footer: React.FC<FooterProps> = () => {
  return (
    <footer id="about-wyn" className="bg-rose-50/40 dark:bg-slate-950/70 backdrop-blur-xs border-t border-rose-100/60 dark:border-slate-800 text-slate-600 dark:text-slate-400 py-8 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col items-center text-center space-y-2">
          {/* Brand & Note */}
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
            <Candy className="w-4 h-4" />
            <span>Ổ kẹo ngọt của Wyn</span>
          </div>
          <p className="text-xs text-slate-500 max-w-md">
            Không gian lưu giữ những nhân vật hư cấu ngọt ngào, những câu chuyện xuất thân say đắm và những lời thì thầm đầu tiên chạm đến trái tim.
          </p>
        </div>

        <div className="mt-6 pt-5 border-t border-rose-100/60 dark:border-slate-900 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
          <span>Được tạo riêng cho</span>
          <span className="font-semibold text-rose-500">Wyn</span>
          <span aria-hidden="true">·</span>
          <span>Hiệu ứng chuyển cảnh mượt mà & thông tin chi tiết từng nhân vật</span>
        </div>
      </div>
    </footer>
  );
};
