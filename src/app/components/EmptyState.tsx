import { Mic } from 'lucide-react';
import { motion } from 'motion/react';

export function EmptyState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] flex items-center justify-center shadow-lg">
          <Mic className="w-9 h-9 text-[#6366f1]" />
        </div>
        <p className="text-[#9999aa] text-lg font-medium">Press the mic to start listening</p>
        <p className="text-[#c0c0cc] text-sm mt-2">lecRef will automatically capture definitions and insights</p>
      </motion.div>
    </div>
  );
}