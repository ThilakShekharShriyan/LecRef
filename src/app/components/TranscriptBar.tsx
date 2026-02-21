import { useState, useRef, useEffect } from 'react';
import { Search } from 'lucide-react';
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
        className="border border-[#e5e5e5] mb-4 overflow-hidden bg-[#ffffff]"
        onMouseUp={handleMouseUp}
      >
        {/* Header bar */}
        <div className="flex items-center gap-2.5 px-4 py-2 border-b border-[#f0f0f0]">
          <AnimatePresence mode="wait">
            {isListening ? (
              <motion.div
                key="live"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-2"
              >
                {/* Pulsing bars */}
                <div className="flex items-end gap-[2px] h-3">
                  {[0.6, 1.0, 0.75, 0.9, 0.5].map((h, i) => (
                    <motion.span
                      key={i}
                      className="w-[2px] bg-[#111111]"
                      animate={{ height: [`${h * 5}px`, `${h * 12}px`, `${h * 5}px`] }}
                      transition={{
                        duration: 0.7,
                        repeat: Infinity,
                        delay: i * 0.12,
                        ease: 'easeInOut',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium text-[#111111] tracking-wide">
                  Transcribing
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
                <span className="w-1 h-1 rounded-full bg-[#d4d4d4]" />
                <span className="text-[10px] text-[#a3a3a3]">Transcript</span>
              </motion.div>
            )}
          </AnimatePresence>

          <span className="ml-auto text-[9px] text-[#d4d4d4] select-none">
            Select text to research
          </span>
        </div>

        {/* Transcript text */}
        <div className="px-4 py-3 text-xs leading-relaxed select-text cursor-text max-h-24 overflow-y-auto">
          {oldWords && <span className="text-[#a3a3a3]">{oldWords} </span>}
          {recentWords && (
            <span className="text-[#111111]">{recentWords}</span>
          )}
          {/* Blinking cursor when listening */}
          {isListening && (
            <motion.span
              className="inline-block w-[1.5px] h-[1em] bg-[#111111] ml-0.5 align-middle"
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
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            onClick={handleDeepResearch}
            className="fixed z-50 bg-[#111111] text-[#fafafa] px-3 py-1.5 flex items-center gap-1.5 text-xs font-medium"
            style={{
              left: selection.rect.left + selection.rect.width / 2,
              top: selection.rect.top - 44,
              transform: 'translateX(-50%)',
            }}
          >
            <Search className="w-3 h-3" />
            Research
          </motion.button>
        )}
      </AnimatePresence>
    </>
  );
}
