import { Mic, MicOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SidebarProps {
  isListening: boolean;
  timer: string;
  sourceMode: 'microphone' | 'screen-audio';
  onToggleListening: () => void;
  onSourceModeChange: (mode: 'microphone' | 'screen-audio') => void;
}

const BAR_COUNT = 5;
const barDelays = [0, 0.15, 0.05, 0.2, 0.1];
const barHeights = [0.5, 0.9, 0.7, 1.0, 0.6];

export function Sidebar({
  isListening,
  timer,
  sourceMode,
  onToggleListening,
  onSourceModeChange,
}: SidebarProps) {
  return (
    <div className="w-56 border-r border-[#e5e5e5] flex flex-col h-full bg-[#ffffff]">
      {/* Header */}
      <div className="p-5 border-b border-[#e5e5e5]">
        <h1 className="font-light text-[#111111] text-base tracking-tight">lecRef</h1>
      </div>

      {/* Mic Section */}
      <div className="flex-1 flex flex-col items-center pt-10 gap-0">

        {/* Mic Button */}
        <motion.button
          onClick={onToggleListening}
          whileTap={{ scale: 0.94 }}
          className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all duration-300 ${isListening
              ? 'bg-[#111111]'
              : 'bg-[#ffffff] border border-[#e5e5e5] hover:border-[#111111]'
            }`}
        >
          {/* Pulse rings when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                {[1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full bg-[#111111]"
                    initial={{ opacity: 0.2, scale: 1 }}
                    animate={{ opacity: 0, scale: 1.7 + i * 0.3 }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      delay: i * 0.5,
                      ease: 'easeOut',
                    }}
                  />
                ))}
              </>
            )}
          </AnimatePresence>

          {isListening ? (
            <Mic className="w-6 h-6 text-[#fafafa] relative z-10" />
          ) : (
            <MicOff className="w-6 h-6 text-[#a3a3a3] relative z-10" />
          )}
        </motion.button>

        {/* Status label */}
        <AnimatePresence mode="wait">
          {isListening ? (
            <motion.div
              key="live"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-5 flex flex-col items-center gap-3"
            >
              {/* Waveform bars */}
              <div className="flex items-end gap-[3px] h-6">
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-[4px] rounded-sm bg-[#111111]"
                    animate={{
                      height: [
                        `${barHeights[i] * 8}px`,
                        `${barHeights[i] * 24}px`,
                        `${barHeights[i] * 8}px`,
                      ],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: barDelays[i],
                      ease: 'easeInOut',
                    }}
                  />
                ))}
              </div>

              {/* LIVE pill */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 border border-[#111111]">
                <span className="w-1 h-1 rounded-full bg-[#111111] animate-pulse" />
                <span className="text-[10px] font-medium text-[#111111] tracking-widest uppercase">
                  Live
                </span>
              </div>

              {/* Timer */}
              <div className="font-mono text-xs text-[#a3a3a3]">{timer}</div>
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2 }}
              className="mt-5 flex flex-col items-center gap-1"
            >
              <p className="text-xs text-[#a3a3a3]">Tap to start</p>
              <div className="font-mono text-xs text-[#d4d4d4]">{timer}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source Mode Toggle */}
        <div className="mt-10 w-48">
          <div className="border border-[#e5e5e5] p-0.5 relative flex">
            <motion.div
              className="absolute top-0.5 bottom-0.5 bg-[#111111]"
              initial={false}
              animate={{
                left: sourceMode === 'microphone' ? '2px' : '50%',
                right: sourceMode === 'microphone' ? '50%' : '2px',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <button
              onClick={() => onSourceModeChange('microphone')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-medium transition-colors relative z-10 ${sourceMode === 'microphone' ? 'text-[#fafafa]' : 'text-[#a3a3a3]'
                }`}
            >
              Microphone
            </button>
            <button
              onClick={() => onSourceModeChange('screen-audio')}
              className={`flex-1 py-1.5 px-2 text-[10px] font-medium transition-colors relative z-10 ${sourceMode === 'screen-audio' ? 'text-[#fafafa]' : 'text-[#a3a3a3]'
                }`}
            >
              Screen Audio
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 space-y-2 border-t border-[#e5e5e5]">
        <a href="#" className="text-[10px] text-[#737373] hover:text-[#111111] transition-colors block">
          How it works
        </a>
        <p className="text-[10px] text-[#d4d4d4]">Powered by Smallest AI</p>
      </div>
    </div>
  );
}
