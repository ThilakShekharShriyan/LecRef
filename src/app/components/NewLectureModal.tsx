import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

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
            className="fixed inset-0 bg-[#111111]/40 z-50"
          />

          {/* Modal */}
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              className="bg-[#ffffff] border border-[#e5e5e5] w-full max-w-md p-8 pointer-events-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-light text-[#111111] tracking-tight">New Lecture</h2>
                <button
                  onClick={handleClose}
                  className="p-1.5 hover:bg-[#f5f5f5] transition-colors"
                >
                  <X className="w-4 h-4 text-[#a3a3a3]" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-xs text-[#a3a3a3] uppercase tracking-wide mb-2">
                    Title
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g., Introduction to Machine Learning"
                    className="w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label htmlFor="topic" className="block text-xs text-[#a3a3a3] uppercase tracking-wide mb-2">
                    Subject
                  </label>
                  <input
                    id="topic"
                    type="text"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Computer Science"
                    className="w-full px-3 py-2.5 bg-[#f5f5f5] border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#111111] transition-colors"
                    required
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="flex-1 px-4 py-2.5 border border-[#e5e5e5] text-[#737373] text-sm hover:border-[#111111] hover:text-[#111111] transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 bg-[#111111] text-[#fafafa] text-sm font-medium hover:bg-[#262626] transition-colors"
                  >
                    Create
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
