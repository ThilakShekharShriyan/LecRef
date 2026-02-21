import { motion, AnimatePresence } from 'motion/react';
import { ExternalLink, ChevronDown, ChevronUp, Globe, Microscope, Play, Pause } from 'lucide-react';
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

  // Use structured sources if available, otherwise fall back to plain synthesis
  const hasSources = sources && sources.length > 0;

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('[DeepResearchCard] handlePlayClick called', { isPlaying, isPaused, isAudioLoading });
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
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 280, damping: 24, delay: index * 0.04 }}
      className="bg-white rounded-2xl shadow-md border border-[#ede9fe] overflow-hidden"
    >
      {/* Header */}
      <div
        className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-[#faf8ff] transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="mt-0.5 w-8 h-8 rounded-lg bg-gradient-to-br from-[#8b5cf6] to-[#6366f1] flex items-center justify-center flex-shrink-0">
          <Microscope className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-[#8b5cf6]">
              Deep Research
            </span>
            {hasSources && (
              <span className="text-[10px] text-[#aaa] font-medium">
                · {sources!.length} sources
              </span>
            )}
          </div>
          <p className="text-sm font-semibold text-[#1a1a2e] leading-snug line-clamp-2">
            {query}
          </p>
        </div>
        <button
          onClick={handlePlayClick}
          disabled={isAudioLoading}
          className="p-2 rounded-lg bg-[#f3f0ff] hover:bg-[#e9d5ff] disabled:bg-[#d8d4ff] disabled:opacity-50 disabled:cursor-not-allowed transition-colors mt-0.5 flex-shrink-0"
          title={isAudioLoading ? "Loading..." : isPlaying && !isPaused ? "Pause" : isPlaying && isPaused ? "Resume" : "Play"}
        >
          {isAudioLoading ? (
            <div className="w-4 h-4 border-2 border-[#8b5cf6] border-t-transparent rounded-full animate-spin" />
          ) : isPlaying && !isPaused ? (
            <Pause className="w-4 h-4 text-[#8b5cf6]" />
          ) : (
            <Play className="w-4 h-4 text-[#8b5cf6]" />
          )}
        </button>
        <button className="text-[#8b5cf6] mt-1 flex-shrink-0">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {isLoading ? (
                /* Skeleton */
                <div className="space-y-3 pt-2">
                  {[100, 90, 95].map((w, i) => (
                    <div
                      key={i}
                      className="h-3 bg-[#ede9fe] rounded animate-pulse"
                      style={{ width: `${w}%` }}
                    />
                  ))}
                </div>
              ) : hasSources ? (
                /* Structured sources */
                <div className="space-y-3 pt-1">
                  {sources!.map((src, i) => (
                    <div
                      key={i}
                      className="rounded-xl border border-[#f0eaff] bg-[#faf8ff] p-3.5"
                    >
                      {/* Source title + link */}
                      <a
                        href={src.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-2 group mb-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="w-3.5 h-3.5 text-[#8b5cf6] mt-0.5 flex-shrink-0" />
                        <span className="text-xs font-semibold text-[#6366f1] group-hover:underline leading-tight">
                          {src.title}
                        </span>
                        <ExternalLink className="w-3 h-3 text-[#aaa] mt-0.5 flex-shrink-0 ml-auto" />
                      </a>
                      {/* Snippet */}
                      <p className="text-xs text-[#555566] leading-relaxed ml-5">
                        {src.snippet}
                      </p>
                      {/* Domain pill */}
                      <div className="mt-2 ml-5">
                        <span className="text-[10px] text-[#999] bg-white border border-[#eee] rounded-full px-2 py-0.5">
                          {src.domain}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback: plain text paragraphs */
                <div className="pt-2 space-y-2">
                  {synthesis.split('\n\n').map((para, i) => (
                    <p key={i} className="text-sm text-[#333344] leading-relaxed">
                      {para}
                    </p>
                  ))}
                </div>
              )}

              {/* Citation pills at bottom */}
              {citations && citations.length > 0 && !hasSources && (
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {citations.map((c, i) => (
                    <a
                      key={i}
                      href={c.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2.5 py-1 bg-[#f3f0ff] text-[#8b5cf6] text-[11px] rounded-full hover:bg-[#e9d5ff] transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {c.favicon && <img src={c.favicon} alt="" className="w-3 h-3" />}
                      {c.domain}
                      <ExternalLink className="w-2.5 h-2.5" />
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
