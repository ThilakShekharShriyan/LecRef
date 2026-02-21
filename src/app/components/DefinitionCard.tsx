import { motion } from 'motion/react';
import { ExternalLink } from 'lucide-react';

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

const typeColors = {
  concept: { bg: '#dbeafe', text: '#3b82f6' },
  person: { bg: '#dcfce7', text: '#16a34a' },
  event: { bg: '#fef9c3', text: '#d97706' },
};

const typeLabels = {
  concept: 'Concept',
  person: 'Person',
  event: 'Event',
};

export function DefinitionCard({ term, type, definition, citations, index, totalCards }: DefinitionCardProps) {
  const opacity = index < 3 ? 1 : 0.6;
  const safeType: DefinitionType = typeColors[type] ? type : 'concept';
  const colors = typeColors[safeType];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity, y: 0, scale: 1 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 25,
        delay: index * 0.05
      }}
      whileHover={{ y: -2, boxShadow: '0 10px 30px rgba(0,0,0,0.12)' }}
      className="bg-white rounded-xl shadow-md p-5 border-l-[3px] border-[#6366f1] transition-shadow hover:shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-3">
        <h3 className="text-[#111118] font-semibold flex-1">{term}</h3>
        <span
          className="px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {typeLabels[safeType]}
        </span>
      </div>

      {/* Definition */}
      <p className="text-[#444455] text-sm leading-relaxed mb-4">
        {definition}
      </p>

      {/* Citations */}
      <div className="flex flex-wrap gap-2">
        {citations.map((citation, i) => (
          <a
            key={i}
            href="#"
            className="px-3 py-1.5 bg-[#ede9fe] text-[#6366f1] text-xs rounded-full flex items-center gap-1.5 hover:bg-[#ddd6fe] transition-colors"
          >
            {citation.favicon && (
              <img src={citation.favicon} alt="" className="w-3 h-3" />
            )}
            <span>{citation.domain}</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        ))}
      </div>
    </motion.div>
  );
}