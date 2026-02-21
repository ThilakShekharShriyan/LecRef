import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles } from 'lucide-react';

interface NewLectureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, topic: string) => void;
}

export function NewLectureModal({ isOpen, onClose, onCreate }: NewLectureModalProps) {
  const [title, setTitle] = useState('');
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim() && topic.trim()) {
      onCreate(title.trim(), topic.trim());
      setTitle('');
      setTopic('');
      onClose();
    }
  };

  const handleClose = () => {
    setTitle('');
    setTopic('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-[#111118]">New Lecture</h2>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 hover:bg-[#f1f1f5] rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-[#9999aa]" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-[#444455] mb-2">
                    Lecture Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Introduction to Machine Learning"
                    className="w-full px-4 py-3 bg-[#f8f8fc] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block text-sm font-medium text-[#444455] mb-2">
                    Topic / Subject
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Computer Science, Physics, etc."
                    className="w-full px-4 py-3 bg-[#f8f8fc] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-3 border border-gray-300 text-[#444455] rounded-lg hover:bg-[#f8f8fc] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e3] transition-colors shadow-lg"
                  >
                    Create Lecture
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
