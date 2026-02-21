import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mic, Brain, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Mic,
    title: 'Capture Every Word',
    description: 'lecRef listens to your lectures in real-time, transcribing everything automatically so you never miss important information.',
  },
  {
    icon: Brain,
    title: 'Intelligent Definitions',
    description: 'AI automatically identifies and defines key concepts, people, and events as they\'re mentioned during the lecture.',
  },
  {
    icon: FileText,
    title: 'Deep Research',
    description: 'Select any text to trigger comprehensive research with citations from trusted academic sources.',
  },
];

export function OnboardingScreen({ onComplete }: OnboardingScreenProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  const slide = slides[currentSlide];
  const Icon = slide.icon;

  return (
    <div className="h-screen flex items-center justify-center bg-[#fafafa]">
      <div className="max-w-xl w-full px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <span className="font-light text-[#111111] text-xl tracking-tight">lecRef</span>
          <button
            onClick={handleSkip}
            className="text-[#a3a3a3] hover:text-[#111111] transition-colors text-sm"
          >
            Skip
          </button>
        </div>

        {/* Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.25 }}
            className="mb-16"
          >
            <div className="w-16 h-16 mb-8 border border-[#e5e5e5] flex items-center justify-center">
              <Icon className="w-7 h-7 text-[#111111]" />
            </div>
            
            <h2 className="text-3xl font-light text-[#111111] mb-4 tracking-tight">
              {slide.title}
            </h2>
            
            <p className="text-sm text-[#737373] leading-relaxed max-w-md">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex gap-2 mb-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-px transition-all ${
                index === currentSlide 
                  ? 'w-8 bg-[#111111]' 
                  : 'w-4 bg-[#d4d4d4] hover:bg-[#a3a3a3]'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 text-sm transition-colors ${
              currentSlide === 0
                ? 'text-[#d4d4d4] cursor-not-allowed'
                : 'text-[#111111] hover:text-[#525252]'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#111111] text-[#fafafa] text-sm font-medium hover:bg-[#262626] transition-colors"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
