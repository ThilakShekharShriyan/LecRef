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
    triggerDeepResearch,
    disconnect
  } = useAudioStream(lectureId);

  const [timer, setTimer] = useState('00:00:00');
  const [seconds, setSeconds] = useState(0);
  const [sourceMode, setSourceMode] = useState<'microphone' | 'screen-audio'>('microphone');
  const [reminders, setReminders] = useState<Set<string>>(new Set());

  // Load reminders from localStorage on mount
  useEffect(() => {
    if (lectureId) {
      const savedData = localStorage.getItem(`lecture_${lectureId}`);
      if (savedData) {
        try {
          const data = JSON.parse(savedData);
          if (data.reminders) {
            setReminders(new Set(data.reminders));
          }
        } catch (e) {
          console.error('Failed to load reminders:', e);
        }
      }
    }
  }, [lectureId]);

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
        reminders: Array.from(reminders),
      };
      localStorage.setItem(`lecture_${lectureId}`, JSON.stringify(lectureData));
    };
    const interval = window.setInterval(save, 30_000);
    return () => clearInterval(interval);
  }, [lectureId, definitions, deepResearchCards, takeaways, researchQueries, transcript, timer, reminders]);


  const handleDeepResearch = (selectedText: string) => {
    if (!selectedText.trim()) {
      console.warn('⚠️ No text selected for deep research');
      return;
    }
    triggerDeepResearch(selectedText);
  };

  const handleAddDefinitionReminder = (term: string, definition: string) => {
    const reminderId = `def-${term}`;
    setReminders(prev => {
      const updated = new Set(prev);
      if (updated.has(reminderId)) {
        updated.delete(reminderId);
      } else {
        updated.add(reminderId);
      }
      return updated;
    });
  };

  const handleAddResearchReminder = (query: string, synthesis: string) => {
    const reminderId = `research-${query}`;
    setReminders(prev => {
      const updated = new Set(prev);
      if (updated.has(reminderId)) {
        updated.delete(reminderId);
      } else {
        updated.add(reminderId);
      }
      return updated;
    });
  };

  const handleCopySummary = async () => {
    // Prepare summary content including definitions for reference
    const summaryContent = {
      title: `Lecture: ${topic || 'Untitled'}`,
      summary: summary,
      definitions: definitions.map(def => ({
        term: def.term,
        definition: def.definition,
        type: def.type
      })),
      takeaways: takeaways,
      deepResearch: deepResearchCards.map(card => ({
        query: card.research_query,
        synthesis: card.synthesis
      }))
    };

    return exportToDocs(summaryContent);
  };

  const exportToDocs = async (summaryContent: any) => {
    try {
      const response = await fetch('/api/docs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: summaryContent.title,
          summary: summaryContent.summary,
          definitions: summaryContent.definitions,
          takeaways: summaryContent.takeaways,
          deepResearch: summaryContent.deepResearch
        })
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Open the created doc in a new tab
      if (data.doc_url) {
        window.open(data.doc_url, '_blank');
      }
    } catch (error) {
      console.error('[LectureSession] Export to Google Docs error:', error);
      alert('Failed to export to Google Docs. Please check that Google authentication is set up.');
    }
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
        reminders: Array.from(reminders),
      };
      localStorage.setItem(`lecture_${lectureId}`, JSON.stringify(lectureData));
    }
    disconnect();
    onExit();
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-[#fafafa]">
      {/* Modified Navbar with Back Button */}
      <nav className="h-11 border-b border-[#e5e5e5] flex items-center justify-between px-6 sticky top-0 z-50 bg-[#fafafa]">
        <div className="flex items-center gap-3">
          <button
            onClick={handleExitSession}
            className="p-1.5 hover:bg-[#f0f0f0] transition-colors"
            title="Back to Library"
          >
            <ArrowLeft className="w-4 h-4 text-[#111111]" />
          </button>
          <div className="h-4 w-px bg-[#e5e5e5]" />
          <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-[#111111] animate-pulse' : 'bg-[#d4d4d4]'}`} />
          <span className="text-xs text-[#737373]">{isListening ? 'Live' : 'Ready'}</span>
        </div>

        <button className="px-3 py-1.5 border border-[#e5e5e5] text-[#111111] text-xs font-medium hover:border-[#111111] transition-colors">
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
        <div className="flex-1 flex flex-col overflow-hidden px-4 py-4">
          {/* Transcript Bar */}
          {transcript && (
            <TranscriptBar transcript={transcript} isListening={isListening} onDeepResearch={handleDeepResearch} />
          )}

          {/* Definition Feed - Grid Layout */}
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-3 auto-rows-max relative">
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
                onAddReminder={handleAddResearchReminder}
                isReminder={reminders.has(`research-${card.query || card.term}`)}
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
                onAddReminder={handleAddDefinitionReminder}
                isReminder={reminders.has(`def-${def.term}`)}
              />
            ))}
          </div>
        </div>

        {/* Right Panel */}
        <div className="pr-4 py-4">
          <IntelligencePanel
            currentTopic={topic}
            emphasisLevel={emphasisLevel}
            takeaways={takeaways}
            researchQueries={researchQueries}
            summary={summary}
            onExportToDocs={handleCopySummary}
          />
        </div>
      </div>
    </div>
  );
}
