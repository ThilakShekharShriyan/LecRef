import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { TranscriptBar } from './TranscriptBar';
import { DefinitionCard, DefinitionType } from './DefinitionCard';
import { DeepResearchCard } from './DeepResearchCard';
import { SkeletonCard } from './SkeletonCard';
import { IntelligencePanel } from './IntelligencePanel';
import { EmptyState } from './EmptyState';
import { useAudioStream } from '../hooks/useAudioStream';

interface LectureSessionProps {
  lectureId?: string;
  onExit: () => void;
}

export function LectureSession({ lectureId, onExit }: LectureSessionProps) {
  const {
    isListening,
    transcript,
    definitions,
    deepResearchCards,
    takeaways,
    researchQueries,
    summary,
    topic,
    emphasisLevel,
    toggleListening,
    disconnect
  } = useAudioStream(lectureId);

  const [timer, setTimer] = useState('00:00:00');
  const [seconds, setSeconds] = useState(0);
  const [sourceMode, setSourceMode] = useState<'microphone' | 'screen-audio'>('microphone');

  // Timer effect
  useEffect(() => {
    let interval: number | undefined;
    if (isListening) {
      interval = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isListening]);

  // Format timer display
  useEffect(() => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    setTimer(
      `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    );
  }, [seconds]);

  // Auto-save transcript and session data every 30 seconds
  useEffect(() => {
    if (!lectureId) return;
    const save = () => {
      const lectureData = {
        definitions,
        deepResearchCards,
        takeaways,
        researchQueries,
        transcript,
        duration: timer,
      };
      localStorage.setItem(`lecture_${lectureId}`, JSON.stringify(lectureData));
    };
    const interval = window.setInterval(save, 30_000);
    return () => clearInterval(interval);
  }, [lectureId, definitions, deepResearchCards, takeaways, researchQueries, transcript, timer]);


  const handleDeepResearch = (selectedText: string) => {
    // In a real app, this would send a message to the backend via WebSocket
    // For now, we can just log it or maybe the hook should expose a method for this
    console.log("Deep research requested for:", selectedText);
    // TODO: Implement sending deep research request to backend
    // ws.send(JSON.stringify({ type: 'deep_research', selected_text: selectedText, context: transcript.slice(-500) }))
  };

  const handleCopySummary = () => {
    navigator.clipboard.writeText(summary);
  };

  const handleExitSession = () => {
    // Save lecture data before exiting
    if (lectureId) {
      const lectureData = {
        definitions,
        deepResearchCards,
        takeaways,
        researchQueries,
        transcript,
        duration: timer,
      };
      localStorage.setItem(`lecture_${lectureId}`, JSON.stringify(lectureData));
    }
    disconnect();
    onExit();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Modified Navbar with Back Button */}
      <nav className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={handleExitSession}
            className="p-2 hover:bg-[#f1f1f5] rounded-lg transition-colors"
            title="Back to Library"
          >
            <ArrowLeft className="w-5 h-5 text-[#6366f1]" />
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#22c55e] animate-pulse' : 'bg-gray-400'}`} />
          <span className="text-sm text-[#444455] font-medium">{isListening ? 'Live' : 'Ready'}</span>
        </div>

        <button className="px-4 py-2 border border-[#6366f1] text-[#6366f1] rounded-lg hover:bg-[#eef2ff] transition-colors text-sm font-medium">
          Copy All Notes
        </button>
      </nav>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          isListening={isListening}
          timer={timer}
          sourceMode={sourceMode}
          onToggleListening={toggleListening}
          onSourceModeChange={setSourceMode}
        />

        {/* Center Column */}
        <div className="flex-1 flex flex-col overflow-hidden px-6 py-4">
          {/* Transcript Bar */}
          {transcript && (
            <TranscriptBar transcript={transcript} isListening={isListening} onDeepResearch={handleDeepResearch} />
          )}

          {/* Definition Feed */}
          <div className="flex-1 overflow-y-auto space-y-4 relative">
            {!isListening && definitions.length === 0 && deepResearchCards.length === 0 && (
              <>
                <EmptyState />
              </>
            )}

            {deepResearchCards.map((card, index) => (
              <DeepResearchCard
                key={card.id || index}
                query={card.query || card.term}
                synthesis={card.synthesis || card.content}
                citations={card.citations}
                sources={card.sources}
                index={index}
              />
            ))}
            {definitions.map((def, index) => (
              <DefinitionCard
                key={def.id || index}
                term={def.term}
                type={def.type || def.badge_type}
                definition={def.definition || def.content}
                citations={def.citations}
                index={index}
                totalCards={definitions.length}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="pr-6 py-4">
          <IntelligencePanel
            currentTopic={topic}
            emphasisLevel={emphasisLevel}
            takeaways={takeaways}
            researchQueries={researchQueries}
            summary={summary}
            onCopySummary={handleCopySummary}
          />
        </div>
      </div>
    </div>
  );
}
