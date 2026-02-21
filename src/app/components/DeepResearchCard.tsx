import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, ChevronDown, ChevronUp, Globe, Search, Play, Pause } from 'lucide-react';
import { useState } from 'react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface Source {
  title: string;
  url: string;
  domain: string;
  snippet: string;
}

interface Citation {
  title?: string;
  url?: string;
  domain: string;
  favicon?: string;
}

interface DeepResearchCardProps {
  query: string;
  synthesis: string;
  citations: Citation[];
  sources?: Source[];
  index: number;
  isLoading?: boolean;
}

export function DeepResearchCard({
  query,
  synthesis,
  citations,
  sources,
  index,
  isLoading = false,
}: DeepResearchCardProps) {
  const [expanded, setExpanded] = useState(index === 0);
  const opacity = index < 2 ? 1 : 0.7;
  const { isPlaying, isPaused, isLoading: isAudioLoading, play, pause, resume } = useAudioPlayer(`research-${query}-${index}`);

  const hasSources = sources && sources.length > 0;

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isPlaying) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      await play(`${query}. ${synthesis}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.04 }}
      className="bg-[#ffffff] border border-[#e5e5e5] overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-[#f5f5f5] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="mt-0.5 w-7 h-7 border border-[#e5e5e5] flex items-center justify-center flex-shrink-0">
          <Search className="w-3.5 h-3.5 text-[#111111]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[9px] font-medium uppercase tracking-widest text-[#a3a3a3]">
              Research
            </span>
            {hasSources && (
              <span className="text-[9px] text-[#d4d4d4]">
                {sources!.length} sources
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-[#111111] leading-snug line-clamp-2">
            {query}
          </p>
        </div>
        <button
          onClick={handlePlayClick}
          disabled={isAudioLoading}
          className="p-1.5 border border-[#e5e5e5] hover:border-[#111111] disabled:opacity-30 disabled:cursor-not-allowed transition-colors mt-0.5 flex-shrink-0"
          title={isAudioLoading ? "Loading..." : isPlaying && !isPaused ? "Pause" : isPlaying && isPaused ? "Resume" : "Play"}
        >
          {isAudioLoading ? (
            <div className="w-3.5 h-3.5 border border-[#111111] border-t-transparent rounded-full animate-spin" />
          ) : isPlaying && !isPaused ? (
            <Pause className="w-3.5 h-3.5 text-[#111111]" />
          ) : (
            <Play className="w-3.5 h-3.5 text-[#111111]" />
          )}
        </button>
        <button className="text-[#a3a3a3] mt-1 flex-shrink-0">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Expanded Content */}
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4">
              {isLoading ? (
                <div className="space-y-2 pt-2">
                  {[100, 90, 95].map((w, i) => (
                    <div
                      key={i}
                      className="h-2.5 bg-[#f0f0f0] shimmer"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              ) : hasSources ? (
                <div className="space-y-2 pt-1">
                  {sources!.map((src, i) => (
                    <div
                      key={i}
                      className="border border-[#f0f0f0] bg-[#fafafa] p-3"
                    >
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group mb-1.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3 h-3 text-[#a3a3a3] mt-0.5 flex-shrink-0" />
                        <span className="text-[10px] font-medium text-[#111111] group-hover:underline leading-tight">
                          {src.title}
                        </span>
                        <ExternalLink className="w-2.5 h-2.5 text-[#d4d4d4] mt-0.5 flex-shrink-0 ml-auto" />
                      </a>
                      <p className="text-[10px] text-[#737373] leading-relaxed ml-5">
                        {src.snippet}
                      </p>
                      <div className="mt-1.5 ml-5">
                        <span className="text-[9px] text-[#a3a3a3] bg-[#ffffff] border border-[#e5e5e5] px-1.5 py-0.5">
                          {src.domain}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="pt-2 space-y-2">
                  {synthesis.split('\n\n').map((para, i) => (
                    <p key={i} className="text-xs text-[#525252] leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {citations && citations.length > 0 && !hasSources && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-0.5 bg-[#f5f5f5] text-[#737373] text-[10px] hover:bg-[#e5e5e5] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.favicon && <img src={c.favicon} alt="" className="w-2.5 h-2.5" />}
                      {c.domain}
                      <ExternalLink className="w-2 h-2" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
