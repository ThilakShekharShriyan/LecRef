import { useState, useRef, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface TranscriptBarProps {
  transcript: string;
  isListening?: boolean;
  onDeepResearch: (selectedText: string) => void;
}

export function TranscriptBar({ transcript, isListening = false, onDeepResearch }: TranscriptBarProps) {
  const [selection, setSelection] = useState<{ text: string; rect: DOMRect | null }>({
    text: '',
    rect: null,
  });
  const transcriptRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom as new words arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const handleMouseUp = () => {
    const selectedText = window.getSelection()?.toString();
    if (selectedText && selectedText.trim().length > 0) {
      const range = window.getSelection()?.getRangeAt(0);
      const rect = range?.getBoundingClientRect();
      setSelection({ text: selectedText.trim(), rect: rect || null });
    } else {
      setSelection({ text: '', rect: null });
    }
  };

  const handleDeepResearch = () => {
    if (selection.text) {
      onDeepResearch(selection.text);
      setSelection({ text: '', rect: null });
      window.getSelection()?.removeAllRanges();
    }
  };

  // Split transcript into old and recent words
  const words = transcript.split(' ');
  const recentWordCount = 10;
  const oldWords = words.slice(0, -recentWordCount).join(' ');
  const recentWords = words.slice(-recentWordCount).join(' ');

  return (
    <>
      <div
        ref={transcriptRef}
        className="bg-white rounded-xl shadow-sm border border-gray-100 mb-4 overflow-hidden"
        onMouseUp={handleMouseUp}
      >
        {/* Header bar */}
        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-100 bg-[#fafafa]">
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                {/* Pulsing mic bars */}
                <div className="flex items-end gap-[2px] h-3.5">
                  {[0.6, 1.0, 0.75, 0.9, 0.5].map((h, i) => (
                    <motion.span
                      key={i}
                      className="w-[3px] rounded-full bg-[#6366f1]"
                      animate={{ height: [`${h * 6}px`, `${h * 14}px`, `${h * 6}px`] }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        delay: i * 0.12,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[11px] font-semibold text-[#6366f1] tracking-wide">
                  Transcribing…
                </span>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                <span className="text-[11px] text-[#aaaabc] font-medium">Transcript</span>
              </motion.div>
            )}
          </AnimatePresence>

          <span className="ml-auto text-[10px] text-[#c0c0d0] select-none">
            Select text to deep research
          </span>
        </div>

        {/* Transcript text */}
        <div className="px-4 py-3 text-sm leading-relaxed select-text cursor-text max-h-28 overflow-y-auto">
          {oldWords && <span className="text-[#aaaabc]">{oldWords} </span>}
          {recentWords && (
            <span className="text-[#111118] font-medium">{recentWords}</span>
          )}
          {/* Blinking cursor when listening */}
          {isListening && (
            <motion.span
              className="inline-block w-[2px] h-[1em] bg-[#6366f1] ml-0.5 align-middle rounded-full"
              animate={{ opacity: [1, 0, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
            />
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Floating deep research popup */}
      <AnimatePresence>
        {selection.text && selection.rect && (
          <motion.button
            initial={{ opacity: 0, y: 8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={handleDeepResearch}
            className="fixed z-50 bg-white border-2 border-[#6366f1] text-[#6366f1] px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2 text-sm font-medium"
            style={{
              left: selection.rect.left + selection.rect.width / 2,
              top: selection.rect.top - 50,
              transform: 'translateX(-50%)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Deep Research
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
