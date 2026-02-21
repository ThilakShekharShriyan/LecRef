interface NavbarProps {
  isListening: boolean;
}

export function Navbar({ isListening }: NavbarProps) {
  return (
    <nav className="h-11 border-b border-[#e5e5e5] flex items-center justify-between px-6 sticky top-0 z-50 bg-[#fafafa]">
      <div className="flex items-center gap-2">
        <span className="font-light text-[#111111] text-base tracking-tight">lecRef</span>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-[#111111] animate-pulse' : 'bg-[#d4d4d4]'}`} />
        <span className="text-xs text-[#737373]">{isListening ? 'Live' : 'Ready'}</span>
      </div>
      
      <button className="px-3 py-1.5 border border-[#e5e5e5] text-[#111111] text-xs font-medium hover:border-[#111111] transition-colors">
        Copy All Notes
      </button>
    </nav>
  );
}
