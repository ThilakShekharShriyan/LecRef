import { Sparkles } from 'lucide-react';

interface NavbarProps {
  isListening: boolean;
}

export function Navbar({ isListening }: NavbarProps) {
  return (
    <nav className="h-12 bg-white border-b border-gray-200 flex items-center justify-between px-6 sticky top-0 z-50 shadow-sm">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-[#6366f1]" />
        <span className="font-semibold text-[#111118] text-lg">lecRef</span>
      </div>
      
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 rounded-full ${isListening ? 'bg-[#22c55e] animate-pulse' : 'bg-gray-400'}`} />
        <span className="text-sm text-[#444455] font-medium">{isListening ? 'Live' : 'Ready'}</span>
      </div>
      
      <button className="px-4 py-2 border border-[#6366f1] text-[#6366f1] rounded-lg hover:bg-[#eef2ff] transition-colors text-sm font-medium">
        Copy All Notes
      </button>
    </nav>
  );
}