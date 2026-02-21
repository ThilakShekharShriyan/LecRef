import { motion } from 'motion/react';

interface StartupScreenProps {
  onComplete: () => void;
}

export function StartupScreen({ onComplete }: StartupScreenProps) {
  return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="text-7xl font-light tracking-tight text-[#111111] mb-3"
        >
          lecRef
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-sm text-[#737373] tracking-wide mb-12"
        >
          Your AI Lecture Assistant
        </motion.p>
        
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          whileHover={{ backgroundColor: '#262626' }}
          whileTap={{ scale: 0.98 }}
          onClick={onComplete}
          className="px-8 py-3 bg-[#111111] text-[#fafafa] text-sm font-medium tracking-wide transition-colors"
        >
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
}
