import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Mic, Brain, FileText, ArrowRight, ArrowLeft } from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

const slides = [
  {
    icon: Mic,
    title: 'Capture Every Word',
    description: 'lecRef listens to your lectures in real-time, transcribing everything automatically so you never miss important information.',
    color: '#6366f1',
  },
  {
    icon: Brain,
    title: 'Intelligent Definitions',
    description: 'AI automatically identifies and defines key concepts, people, and events as they\'re mentioned during the lecture.',
    color: '#8b5cf6',
  },
  {
    icon: FileText,
    title: 'Deep Research',
    description: 'Select any text to trigger comprehensive research with citations from trusted academic sources.',
    color: '#6366f1',
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
    <div className="h-screen flex items-center justify-center bg-white">
      <div className="max-w-2xl w-full px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-[#6366f1]" />
            <span className="font-semibold text-[#111118] text-xl">lecRef</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-[#9999aa] hover:text-[#6366f1] transition-colors text-sm"
          >
            Skip
          </button>
        </div>

        {/* Slide Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="text-center mb-16"
          >
            <div 
              className="w-32 h-32 mx-auto mb-8 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${slide.color}20` }}
            >
              <Icon className="w-16 h-16" style={{ color: slide.color }} />
            </div>
            
            <h2 className="text-4xl font-bold text-[#111118] mb-4">
              {slide.title}
            </h2>
            
            <p className="text-lg text-[#444455] leading-relaxed max-w-xl mx-auto">
              {slide.description}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2 mb-12">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentSlide 
                  ? 'w-8 bg-[#6366f1]' 
                  : 'bg-[#e8e8f0] hover:bg-[#d0d0e0]'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrevious}
            disabled={currentSlide === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              currentSlide === 0
                ? 'text-[#c0c0cc] cursor-not-allowed'
                : 'text-[#6366f1] hover:bg-[#eef2ff]'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Previous
          </button>
          
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e3] transition-colors shadow-lg"
          >
            {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
