import { Mic } from 'lucide-react';
import { motion } from 'motion/react';

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <div className="w-14 h-14 mx-auto mb-4 border border-[#e5e5e5] flex items-center justify-center">
          <Mic className="w-6 h-6 text-[#a3a3a3]" />
        </div>
        <p className="text-[#737373] text-sm">Press the mic to start listening</p>
        <p className="text-[#d4d4d4] text-xs mt-1">Definitions and insights will appear here</p>
      </motion.div>
    </div>
  );
}
