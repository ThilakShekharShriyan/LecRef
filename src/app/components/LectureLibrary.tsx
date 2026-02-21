import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Play, Clock, Calendar, Download, Trash2, Search } from 'lucide-react';

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
    <div className="h-screen flex flex-col bg-[#fafafa]">
      {/* Header */}
      <div className="border-b border-[#e5e5e5]">
        <div className="max-w-6xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-light text-[#111111] tracking-tight">lecRef</h1>
            
            <button
              onClick={onNewLecture}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#111111] text-[#fafafa] text-sm font-medium hover:bg-[#262626] transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Lecture
            </button>
          </div>
          
          {/* Search Bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#a3a3a3]" />
            <input
              type="text"
              placeholder="Search lectures..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-[#f5f5f5] border border-[#e5e5e5] text-sm focus:outline-none focus:border-[#111111] transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-[#e5e5e5] p-5">
              <div className="text-2xl font-light text-[#111111] mb-1">{lectures.length}</div>
              <div className="text-xs text-[#a3a3a3] uppercase tracking-wide">Total</div>
            </div>
            <div className="border border-[#e5e5e5] p-5">
              <div className="text-2xl font-light text-[#111111] mb-1">
                {lectures.filter(l => l.status === 'in-progress').length}
              </div>
              <div className="text-xs text-[#a3a3a3] uppercase tracking-wide">In Progress</div>
            </div>
            <div className="border border-[#e5e5e5] p-5">
              <div className="text-2xl font-light text-[#111111] mb-1">
                {lectures.filter(l => l.status === 'completed').length}
              </div>
              <div className="text-xs text-[#a3a3a3] uppercase tracking-wide">Completed</div>
            </div>
          </div>

          {/* Lecture Grid */}
          {filteredLectures.length === 0 ? (
            <div className="text-center py-20">
              <h3 className="text-lg font-light text-[#111111] mb-2">
                {searchQuery ? 'No lectures found' : 'No lectures yet'}
              </h3>
              <p className="text-sm text-[#a3a3a3] mb-6">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Start your first lecture to begin capturing insights'}
              </p>
              {!searchQuery && (
                <button
                  onClick={onNewLecture}
                  className="px-5 py-2.5 bg-[#111111] text-[#fafafa] text-sm font-medium hover:bg-[#262626] transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Create First Lecture
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLectures.map((lecture) => (
                <motion.div
                  key={lecture.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  onHoverStart={() => setHoveredCard(lecture.id)}
                  onHoverEnd={() => setHoveredCard(null)}
                  className="bg-[#ffffff] border border-[#e5e5e5] p-5 cursor-pointer transition-all hover:border-[#111111]"
                  onClick={() => onResumeLecture(lecture.id)}
                >
                  {/* Status Badge */}
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider ${
                      lecture.status === 'completed'
                        ? 'bg-[#f5f5f5] text-[#525252]'
                        : 'bg-[#111111] text-[#fafafa]'
                    }`}>
                      {lecture.status === 'completed' ? 'Done' : 'Active'}
                    </span>
                    
                    {/* Action Buttons */}
                    <div className={`flex gap-1 transition-opacity ${
                      hoveredCard === lecture.id ? 'opacity-100' : 'opacity-0'
                    }`}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onExportLecture(lecture.id);
                        }}
                        className="p-1.5 hover:bg-[#f5f5f5] transition-colors"
                        title="Export"
                      >
                        <Download className="w-3.5 h-3.5 text-[#737373]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLecture(lecture.id);
                        }}
                        className="p-1.5 hover:bg-[#f5f5f5] transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-[#737373]" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Topic */}
                  <h3 className="text-sm font-medium text-[#111111] mb-1 line-clamp-2">
                    {lecture.title}
                  </h3>
                  <p className="text-xs text-[#a3a3a3] mb-4">{lecture.topic}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-2 mb-4 text-center">
                    <div className="bg-[#f5f5f5] p-2">
                      <div className="text-sm font-medium text-[#111111]">{lecture.definitionCount}</div>
                      <div className="text-[10px] text-[#a3a3a3]">Defs</div>
                    </div>
                    <div className="bg-[#f5f5f5] p-2">
                      <div className="text-sm font-medium text-[#111111]">{lecture.researchCount}</div>
                      <div className="text-[10px] text-[#a3a3a3]">Research</div>
                    </div>
                    <div className="bg-[#f5f5f5] p-2">
                      <div className="text-sm font-medium text-[#111111]">{lecture.takeawayCount}</div>
                      <div className="text-[10px] text-[#a3a3a3]">Notes</div>
                    </div>
                  </div>

                  {/* Meta Info */}
                  <div className="flex items-center justify-between text-[10px] text-[#a3a3a3] border-t border-[#f0f0f0] pt-3">
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
                    className="mt-3 pt-3 border-t border-[#f0f0f0]"
                  >
                    <button className="w-full flex items-center justify-center gap-2 py-2 bg-[#111111] text-[#fafafa] text-xs font-medium hover:bg-[#262626] transition-colors">
                      <Play className="w-3 h-3" />
                      {lecture.status === 'completed' ? 'View' : 'Resume'}
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
