import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Candy } from 'lucide-react';

interface ToastProps {
  message: string | null;
}

export const Toast: React.FC<ToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-slate-900/90 dark:bg-white/95 text-white dark:text-slate-900 rounded-2xl shadow-xl backdrop-blur-md border border-rose-300/30 text-xs sm:text-sm font-medium"
        >
          <div className="w-5 h-5 rounded-full bg-rose-500 flex items-center justify-center text-white shrink-0">
            <Check className="w-3 h-3 stroke-[3]" />
          </div>
          <span>{message}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
