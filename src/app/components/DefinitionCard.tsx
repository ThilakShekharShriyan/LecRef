import { motion } from 'motion/react';
import { ExternalLink, Play, Pause } from 'lucide-react';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

export type DefinitionType = 'concept' | 'person' | 'event';

interface Citation {
  domain: string;
  favicon?: string;
}

interface DefinitionCardProps {
  term: string;
  type: DefinitionType;
  definition: string;
  citations: Citation[];
  index: number;
  totalCards: number;
}

const typeLabels = {
  concept: 'Concept',
  person: 'Person',
  event: 'Event',
};

export function DefinitionCard({ term, type, definition, citations, index, totalCards }: DefinitionCardProps) {
  const opacity = index < 3 ? 1 : 0.6;
  const safeType: DefinitionType = typeLabels[type] ? type : 'concept';
  const { isPlaying, isPaused, isLoading, play, pause, resume } = useAudioPlayer(`def-${term}-${index}`);

  const handlePlayClick = async () => {
    if (isPlaying) {
      if (isPaused) {
        resume();
      } else {
        pause();
      }
    } else {
      await play(`${term}. ${definition}`);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.05
      }}
      className="bg-[#ffffff] border border-[#e5e5e5] border-l-2 border-l-[#111111] p-4 transition-colors hover:border-l-[#525252]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <h3 className="text-[#111111] text-sm font-medium flex-1">{term}</h3>
        <button
          onClick={handlePlayClick}
          disabled={isLoading}
          className="p-1.5 border border-[#e5e5e5] hover:border-[#111111] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          title={isLoading ? "Loading..." : isPlaying && !isPaused ? "Pause" : isPlaying && isPaused ? "Resume" : "Play"}
        >
          {isLoading ? (
            <div className="w-3.5 h-3.5 border border-[#111111] border-t-transparent rounded-full animate-spin" />
          ) : isPlaying && !isPaused ? (
            <Pause className="w-3.5 h-3.5 text-[#111111]" />
          ) : (
            <Play className="w-3.5 h-3.5 text-[#111111]" />
          )}
        </button>
        <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-[#f5f5f5] text-[#737373]">
          {typeLabels[safeType]}
        </span>
      </div>

      {/* Definition */}
      <p className="text-[#525252] text-xs leading-relaxed mb-3">
        {definition}
      </p>

      {/* Citations */}
      <div className="flex flex-wrap gap-1.5">
        {citations.map((citation, i) => (
          <a
            key={i}
            href="#"
            className="px-2 py-1 bg-[#f5f5f5] text-[#737373] text-[10px] flex items-center gap-1 hover:bg-[#e5e5e5] transition-colors"
          >
            {citation.favicon && (
              <img src={citation.favicon} alt="" className="w-2.5 h-2.5" />
            )}
            <span>{citation.domain}</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}
