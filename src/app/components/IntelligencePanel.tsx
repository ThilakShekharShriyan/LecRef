import { useState } from 'react';
import { Flame } from 'lucide-react';
import { motion } from 'motion/react';

interface ResearchQuery {
  id: string;
  query: string;
  summary: string;
  timestamp: string;
}

interface IntelligencePanelProps {
  currentTopic: string;
  emphasisLevel: number; // 0-100
  takeaways: string[];
  researchQueries: ResearchQuery[];
  summary: string;
  onCopySummary: () => void;
}

export function IntelligencePanel({ 
  currentTopic, 
  emphasisLevel, 
  takeaways, 
  researchQueries,
  summary,
  onCopySummary 
}: IntelligencePanelProps) {
  const [activeTab, setActiveTab] = useState<'takeaways' | 'research'>('takeaways');
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

  const emphasisIcon = emphasisLevel > 70 ? '🔥' : '∿';
  const emphasisLabel = emphasisLevel > 70 ? 'High' : 'Medium';

  return (
    <div className="w-[300px] bg-transparent flex flex-col h-full space-y-4 overflow-y-auto">
      {/* Current Topic */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <h3 className="text-xs uppercase tracking-wide text-[#9999aa] mb-3">Current Topic</h3>
        <div className="breathe rounded-lg px-4 py-3 mb-4 border border-[#e8e8f0]">
          <div className="text-[#111118] font-semibold text-sm">{currentTopic}</div>
        </div>
        
        {/* Emphasis Indicator */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#9999aa]">Emphasis Level</span>
            <span className="text-[#444455]">{emphasisLabel}</span>
          </div>
          <div className="relative h-2 bg-[#f1f1f5] rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#6366f1] rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${emphasisLevel}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
          <div className="text-right">
            <motion.span 
              key={emphasisIcon}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-lg"
            >
              {emphasisIcon}
            </motion.span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl shadow-md p-5 flex-1">
        {/* Tab Header */}
        <div className="flex border-b border-[#f1f1f5] mb-4 relative">
          <button
            onClick={() => setActiveTab('takeaways')}
            className={`flex-1 pb-3 text-sm transition-colors relative ${
              activeTab === 'takeaways' ? 'text-[#6366f1]' : 'text-[#9999aa]'
            }`}
          >
            Key Takeaways
            {activeTab === 'takeaways' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`flex-1 pb-3 text-sm transition-colors relative ${
              activeTab === 'research' ? 'text-[#6366f1]' : 'text-[#9999aa]'
            }`}
          >
            Your Research
            {activeTab === 'research' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#6366f1]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2">
          {activeTab === 'takeaways' ? (
            <>
              {takeaways.length > 0 ? (
                takeaways.map((takeaway, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-2 text-sm"
                  >
                    <span className="text-[#6366f1] mt-1.5">•</span>
                    <span className="text-[#333344] flex-1">{takeaway}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-sm text-[#9999aa] text-center py-8">
                  Start listening to collect key takeaways
                </div>
              )}
            </>
          ) : (
            <>
              {researchQueries.length > 0 ? (
                researchQueries.map((query) => (
                  <motion.div
                    key={query.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-[#f1f1f5] pb-3 cursor-pointer"
                    onClick={() => setExpandedQuery(expandedQuery === query.id ? null : query.id)}
                  >
                    <div className="font-semibold text-xs text-[#111118] mb-1">"{query.query}"</div>
                    {expandedQuery === query.id ? (
                      <div className="text-xs text-[#444455] mt-2">{query.summary}</div>
                    ) : (
                      <div className="text-xs text-[#9999aa]">{query.summary.slice(0, 50)}...</div>
                    )}
                    <div className="text-[10px] text-[#9999aa] mt-1">{query.timestamp}</div>
                  </motion.div>
                ))
              ) : (
                <div className="text-sm text-[#9999aa] text-center py-8">
                  Select text to trigger deep research
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lecture Summary */}
      <div className="bg-white rounded-xl shadow-md p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs uppercase tracking-wide text-[#9999aa]">Summary So Far</h3>
        </div>
        <motion.div
          key={summary}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="text-[#444455] text-sm leading-relaxed mb-4"
        >
          {summary}
        </motion.div>
        <button
          onClick={onCopySummary}
          className="w-full py-2 border border-[#6366f1] text-[#6366f1] rounded-lg hover:bg-[#eef2ff] transition-colors text-sm"
        >
          Copy Summary
        </button>
      </div>
    </div>
  );
}