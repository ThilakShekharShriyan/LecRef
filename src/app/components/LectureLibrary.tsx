import { useState } from 'react';
import { motion } from 'motion/react';
import { Sparkles, Plus, Play, Clock, Calendar, Download, Trash2, Search } from 'lucide-react';

export interface Lecture {
  id: string;
  title: string;
  topic: string;
  date: string;
  duration: string;
  status: 'completed' | 'in-progress';
  definitionCount: number;
  researchCount: number;
  takeawayCount: number;
}

interface LectureLibraryProps {
  lectures: Lecture[];
  onNewLecture: () => void;
  onResumeLecture: (lectureId: string) => void;
  onExportLecture: (lectureId: string) => void;
  onDeleteLecture: (lectureId: string) => void;
}

export function LectureLibrary({ 
  lectures, 
  onNewLecture, 
  onResumeLecture,
  onExportLecture,
  onDeleteLecture 
}: LectureLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const filteredLectures = lectures.filter(lecture =>
    lecture.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    lecture.topic.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="h-screen flex flex-col bg-[#f8f8fc]">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-[#6366f1]" />
              <h1 className="text-3xl font-bold text-[#111118]">lecRef</h1>
            </div>
            
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onNewLecture}
              className="flex items-center gap-2 px-6 py-3 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e3] transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
              New Lecture
            </motion.button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[#9999aa]" />
            <input
              type="text"
              placeholder="Search lectures by title or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-[#f8f8fc] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#6366f1] focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-7xl mx-auto px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-[#111118] mb-1">{lectures.length}</div>
              <div className="text-sm text-[#9999aa]">Total Lectures</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-[#6366f1] mb-1">
                {lectures.filter(l => l.status === 'in-progress').length}
              </div>
              <div className="text-sm text-[#9999aa]">In Progress</div>
            </div>
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="text-3xl font-bold text-[#16a34a] mb-1">
                {lectures.filter(l => l.status === 'completed').length}
              </div>
              <div className="text-sm text-[#9999aa]">Completed</div>
            </div>
          </div>

          {/* Lecture Grid */}
          {filteredLectures.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#eef2ff] to-[#e0e7ff] flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-[#6366f1]" />
              </div>
              <h3 className="text-2xl font-semibold text-[#111118] mb-2">
                {searchQuery ? 'No lectures found' : 'No lectures yet'}
              </h3>
              <p className="text-[#9999aa] mb-6">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Start your first lecture to begin capturing insights'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onNewLecture}
                  className="px-6 py-3 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e3] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Lecture
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredLectures.map((lecture) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -4, boxShadow: '0 12px 40px rgba(0,0,0,0.15)' }}
                  onHoverStart={() => setHoveredCard(lecture.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="bg-white rounded-xl shadow-md p-6 cursor-pointer transition-all border border-transparent hover:border-[#6366f1]"
                  onClick={() => onResumeLecture(lecture.id)}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      lecture.status === 'completed'
                        ? 'bg-[#dcfce7] text-[#16a34a]'
                        : 'bg-[#fef9c3] text-[#d97706]'
                    }`}>
                      {lecture.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className={`flex gap-2 transition-opacity ${
                      hoveredCard === lecture.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportLecture(lecture.id);
                        }}
                        className="p-2 hover:bg-[#eef2ff] rounded-lg transition-colors"
                        title="Export"
                      >
                        <Download className="w-4 h-4 text-[#6366f1]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLecture(lecture.id);
                        }}
                        className="p-2 hover:bg-[#fee] rounded-lg transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4 text-[#dc2626]" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Topic */}
                  <h3 className="text-lg font-semibold text-[#111118] mb-2 line-clamp-2">
                    {lecture.title}
                  </h3>
                  <p className="text-sm text-[#6366f1] mb-4">{lecture.topic}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-[#f8f8fc] rounded-lg p-2">
                      <div className="text-lg font-semibold text-[#111118]">{lecture.definitionCount}</div>
                      <div className="text-xs text-[#9999aa]">Definitions</div>
                    </div>
                    <div className="bg-[#f8f8fc] rounded-lg p-2">
                      <div className="text-lg font-semibold text-[#111118]">{lecture.researchCount}</div>
                      <div className="text-xs text-[#9999aa]">Research</div>
                    </div>
                    <div className="bg-[#f8f8fc] rounded-lg p-2">
                      <div className="text-lg font-semibold text-[#111118]">{lecture.takeawayCount}</div>
                      <div className="text-xs text-[#9999aa]">Takeaways</div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-xs text-[#9999aa] border-t border-gray-100 pt-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {lecture.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {lecture.duration}
                    </div>
                  </div>

                  {/* Resume Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredCard === lecture.id ? 1 : 0 }}
                    className="mt-4 pt-3 border-t border-gray-100"
                  >
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#5558e3] transition-colors">
                      <Play className="w-4 h-4" />
                      {lecture.status === 'completed' ? 'View Lecture' : 'Resume Lecture'}
                    </button>
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
