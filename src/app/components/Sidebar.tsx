import { Mic, MicOff, Sparkles } from 'lucide-react';
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
    <div className="w-60 bg-white border-r border-gray-200 flex flex-col h-full shadow-sm">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#6366f1]" />
          <h1 className="font-semibold text-[#111118] text-lg">lecRef</h1>
        </div>
      </div>

      {/* Mic Section */}
      <div className="flex-1 flex flex-col items-center pt-10 gap-0">

        {/* Mic Button */}
        <motion.button
          onClick={onToggleListening}
          whileTap={{ scale: 0.94 }}
          whileHover={{ scale: 1.04 }}
          className={`relative w-20 h-20 rounded-full flex items-center justify-center shadow-md transition-all duration-300 ${isListening
              ? 'bg-[#6366f1]'
              : 'bg-white border-2 border-[#e0e0f0] hover:border-[#6366f1]'
            }`}
        >
          {/* Pulse rings when listening */}
          <AnimatePresence>
            {isListening && (
              <>
                {[1, 2].map((i) => (
                  <motion.span
                    key={i}
                    className="absolute inset-0 rounded-full bg-[#6366f1]"
                    initial={{ opacity: 0.4, scale: 1 }}
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
            <Mic className="w-8 h-8 text-white relative z-10" />
          ) : (
            <MicOff className="w-8 h-8 text-gray-400 relative z-10" />
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
              <div className="flex items-end gap-[3px] h-8">
                {Array.from({ length: BAR_COUNT }).map((_, i) => (
                  <motion.span
                    key={i}
                    className="w-[5px] rounded-full bg-[#6366f1]"
                    animate={{
                      height: [
                        `${barHeights[i] * 10}px`,
                        `${barHeights[i] * 32}px`,
                        `${barHeights[i] * 10}px`,
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
              <div className="flex items-center gap-1.5 px-3 py-1 bg-[#eef2ff] rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
                <span className="text-[11px] font-semibold text-[#6366f1] tracking-wide uppercase">
                  Live
                </span>
              </div>

              {/* Timer */}
              <div className="font-mono text-sm text-[#9999aa]">{timer}</div>
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
              <p className="text-sm font-medium text-[#9999aa]">Tap to start</p>
              <div className="font-mono text-sm text-[#c0c0d0]">{timer}</div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Source Mode Toggle */}
        <div className="mt-10 w-52">
          <div className="bg-[#f1f1f5] rounded-full p-1 relative">
            <motion.div
              className="absolute top-1 bottom-1 bg-white rounded-full shadow-sm"
              initial={false}
              animate={{
                left: sourceMode === 'microphone' ? '4px' : '50%',
                right: sourceMode === 'microphone' ? '50%' : '4px',
              }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
            <div className="relative z-10 flex">
              <button
                onClick={() => onSourceModeChange('microphone')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-medium transition-colors ${sourceMode === 'microphone' ? 'text-[#111118]' : 'text-[#9999aa]'
                  }`}
              >
                Microphone
              </button>
              <button
                onClick={() => onSourceModeChange('screen-audio')}
                className={`flex-1 py-2 px-3 rounded-full text-xs font-medium transition-colors ${sourceMode === 'screen-audio' ? 'text-[#111118]' : 'text-[#9999aa]'
                  }`}
              >
                Screen Audio
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 space-y-2 border-t border-gray-100">
        <a href="#" className="text-xs text-[#6366f1] hover:underline block">
          How it works →
        </a>
        <p className="text-[10px] text-[#9999aa]">Powered by Smallest AI × Gemini</p>
      </div>
    </div>
  );
}