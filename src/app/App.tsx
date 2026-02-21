import { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { StartupScreen } from './components/StartupScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { LectureLibrary, Lecture } from './components/LectureLibrary';
import { LectureSession } from './components/LectureSession';
import { NewLectureModal } from './components/NewLectureModal';

type AppScreen = 'startup' | 'onboarding' | 'library' | 'session';

// Mock lectures for demo
const mockLectures: Lecture[] = [
  {
    id: '1',
    title: 'Introduction to Quantum Mechanics',
    topic: 'Physics',
    date: 'Feb 15, 2026',
    duration: '01:23:45',
    status: 'completed',
    definitionCount: 12,
    researchCount: 3,
    takeawayCount: 8,
  },
  {
    id: '2',
    title: 'Neural Networks and Deep Learning',
    topic: 'Computer Science',
    date: 'Feb 16, 2026',
    duration: '00:45:20',
    status: 'in-progress',
    definitionCount: 8,
    researchCount: 2,
    takeawayCount: 5,
  },
  {
    id: '3',
    title: 'Macroeconomic Theory',
    topic: 'Economics',
    date: 'Feb 17, 2026',
    duration: '02:10:30',
    status: 'completed',
    definitionCount: 15,
    researchCount: 5,
    takeawayCount: 12,
  },
];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('startup');
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [currentLectureId, setCurrentLectureId] = useState<string | undefined>();
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Initialize app state from localStorage
  useEffect(() => {
    const seenOnboarding = localStorage.getItem('lecref_onboarding_complete');
    const savedLectures = localStorage.getItem('lecref_lectures');
    
    if (seenOnboarding === 'true') {
      setHasSeenOnboarding(true);
    }
    
    if (savedLectures) {
      try {
        setLectures(JSON.parse(savedLectures));
      } catch (e) {
        // If parsing fails, use mock data
        setLectures(mockLectures);
      }
    } else {
      // First time - use mock lectures
      setLectures(mockLectures);
    }
  }, []);

  // Save lectures to localStorage whenever they change
  useEffect(() => {
    if (lectures.length > 0) {
      localStorage.setItem('lecref_lectures', JSON.stringify(lectures));
    }
  }, [lectures]);

  const handleStartupComplete = () => {
    if (hasSeenOnboarding) {
      setCurrentScreen('library');
    } else {
      setCurrentScreen('onboarding');
    }
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('lecref_onboarding_complete', 'true');
    setHasSeenOnboarding(true);
    setCurrentScreen('library');
  };

  const handleNewLecture = () => {
    setIsModalOpen(true);
  };

  const handleResumeLecture = (lectureId: string) => {
    setCurrentLectureId(lectureId);
    setCurrentScreen('session');
  };

  const handleExportLecture = (lectureId: string) => {
    const lecture = lectures.find(l => l.id === lectureId);
    if (!lecture) return;

    // Get saved lecture data
    const savedData = localStorage.getItem(`lecture_${lectureId}`);
    
    const exportData = {
      lecture,
      data: savedData ? JSON.parse(savedData) : null,
      exportedAt: new Date().toISOString(),
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lecref_${lecture.title.replace(/\s+/g, '_')}_${lectureId}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Show success message (you could add a toast notification here)
    toast.success(`Lecture exported: ${lecture.title}`);
  };

  const handleDeleteLecture = (lectureId: string) => {
    if (confirm('Are you sure you want to delete this lecture? This action cannot be undone.')) {
      setLectures((prev) => prev.filter(l => l.id !== lectureId));
      localStorage.removeItem(`lecture_${lectureId}`);
    }
  };

  const handleExitSession = () => {
    setCurrentLectureId(undefined);
    setCurrentScreen('library');
  };

  const handleModalSubmit = (title: string, topic: string) => {
    const newLecture: Lecture = {
      id: `lecture_${Date.now()}`,
      title,
      topic,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      duration: '00:00:00',
      status: 'in-progress',
      definitionCount: 0,
      researchCount: 0,
      takeawayCount: 0,
    };
    
    setLectures((prev) => [newLecture, ...prev]);
    setCurrentLectureId(newLecture.id);
    setCurrentScreen('session');
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  // Render current screen
  switch (currentScreen) {
    case 'startup':
      return <StartupScreen onComplete={handleStartupComplete} />;
    
    case 'onboarding':
      return <OnboardingScreen onComplete={handleOnboardingComplete} />;
    
    case 'library':
      return (
        <>
          <Toaster position="top-right" richColors />
          <LectureLibrary
            lectures={lectures}
            onNewLecture={handleNewLecture}
            onResumeLecture={handleResumeLecture}
            onExportLecture={handleExportLecture}
            onDeleteLecture={handleDeleteLecture}
          />
          <NewLectureModal
            isOpen={isModalOpen}
            onClose={handleModalCancel}
            onCreate={handleModalSubmit}
          />
        </>
      );
    
    case 'session':
      return (
        <LectureSession
          lectureId={currentLectureId}
          onExit={handleExitSession}
        />
      );
    
    default:
      return null;
  }
}