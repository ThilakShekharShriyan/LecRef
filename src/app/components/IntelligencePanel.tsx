import { useState } from 'react';
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

  const emphasisLabel = emphasisLevel > 70 ? 'High' : 'Medium';

  return (
    <div className="w-[280px] flex flex-col h-full space-y-3 overflow-y-auto">
      {/* Current Topic */}
      <div className="border border-[#e5e5e5] bg-[#ffffff] p-4">
        <h3 className="text-[9px] uppercase tracking-widest text-[#a3a3a3] mb-3">Current Topic</h3>
        <div className="breathe px-3 py-2 border border-[#f0f0f0] mb-3">
          <div className="text-[#111111] text-xs font-medium">{currentTopic}</div>
        </div>
        
        {/* Emphasis Indicator */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#a3a3a3]">Emphasis</span>
            <span className="text-[#525252]">{emphasisLabel}</span>
          </div>
          <div className="relative h-1 bg-[#f0f0f0] overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-[#111111]"
              initial={{ width: 0 }}
              animate={{ width: `${emphasisLevel}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 15 }}
            />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border border-[#e5e5e5] bg-[#ffffff] p-4 flex-1">
        {/* Tab Header */}
        <div className="flex border-b border-[#f0f0f0] mb-3 relative">
          <button
            onClick={() => setActiveTab('takeaways')}
            className={`flex-1 pb-2 text-[10px] font-medium transition-colors relative ${
              activeTab === 'takeaways' ? 'text-[#111111]' : 'text-[#a3a3a3]'
            }`}
          >
            Takeaways
            {activeTab === 'takeaways' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-[#111111]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('research')}
            className={`flex-1 pb-2 text-[10px] font-medium transition-colors relative ${
              activeTab === 'research' ? 'text-[#111111]' : 'text-[#a3a3a3]'
            }`}
          >
            Research
            {activeTab === 'research' && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-px bg-[#111111]"
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
          {activeTab === 'takeaways' ? (
            <>
              {takeaways.length > 0 ? (
                takeaways.map((takeaway, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-2 text-[11px]"
                  >
                    <span className="text-[#a3a3a3] mt-0.5">-</span>
                    <span className="text-[#525252] flex-1">{takeaway}</span>
                  </motion.div>
                ))
              ) : (
                <div className="text-[11px] text-[#a3a3a3] text-center py-8">
                  Start listening to collect takeaways
                </div>
              )}
            </>
          ) : (
            <>
              {researchQueries.length > 0 ? (
                researchQueries.map((query) => (
                  <motion.div
                    key={query.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="border-b border-[#f0f0f0] pb-2 cursor-pointer"
                    onClick={() => setExpandedQuery(expandedQuery === query.id ? null : query.id)}
                  >
                    <div className="font-medium text-[10px] text-[#111111] mb-0.5">{`"${query.query}"`}</div>
                    {expandedQuery === query.id ? (
                      <div className="text-[10px] text-[#525252] mt-1">{query.summary}</div>
                    ) : (
                      <div className="text-[10px] text-[#a3a3a3]">{query.summary.slice(0, 50)}...</div>
                    )}
                    <div className="text-[9px] text-[#d4d4d4] mt-0.5">{query.timestamp}</div>
                  </motion.div>
                ))
              ) : (
                <div className="text-[11px] text-[#a3a3a3] text-center py-8">
                  Select text to trigger research
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Lecture Summary */}
      <div className="border border-[#e5e5e5] bg-[#ffffff] p-4">
        <h3 className="text-[9px] uppercase tracking-widest text-[#a3a3a3] mb-2">Summary</h3>
        <motion.div
          key={summary}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="text-[#525252] text-[11px] leading-relaxed mb-3"
        >
          {summary}
        </motion.div>
        <button
          onClick={onCopySummary}
          className="w-full py-1.5 border border-[#e5e5e5] text-[#111111] text-[10px] font-medium hover:border-[#111111] transition-colors"
        >
          Copy Summary
        </button>
      </div>
    </div>
  );
}
