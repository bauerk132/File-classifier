import React from 'react';
import { 
  FolderKanban, 
  Search, 
  Layers, 
  CheckSquare, 
  ArrowRightLeft, 
  Trash2,
  Sliders, 
  History, 
  ShieldCheck, 
  Sparkles,
  ChevronDown,
  HardDrive
} from 'lucide-react';
import { ScreenType, UserProfile } from '../types';

interface NavbarProps {
  currentScreen: ScreenType;
  onSelectScreen: (screen: ScreenType) => void;
  reviewCount: number;
  cleanupCount?: number;
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onOpenWizard: () => void;
  onOpenProfileManager: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentScreen,
  onSelectScreen,
  reviewCount,
  cleanupCount,
  profiles,
  activeProfileId,
  onSelectProfile,
  onOpenWizard,
  onOpenProfileManager,
  searchQuery,
  onSearchChange,
}) => {
  const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
  const [profileDropdownOpen, setProfileDropdownOpen] = React.useState(false);

  const navItems: Array<{ id: ScreenType; label: string; icon: React.ReactNode; badge?: number }> = [
    { id: 'scan', label: 'Scan', icon: <Search className="w-4 h-4" /> },
    { id: 'results', label: 'Results', icon: <Layers className="w-4 h-4" /> },
    { id: 'review', label: 'Review', icon: <CheckSquare className="w-4 h-4" />, badge: reviewCount },
    { id: 'organize', label: 'Organize', icon: <ArrowRightLeft className="w-4 h-4" /> },
    { id: 'cleanup', label: 'Cleanup', icon: <Trash2 className="w-4 h-4" />, badge: cleanupCount },
    { id: 'rules', label: 'Rules', icon: <Sliders className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-800 text-slate-200">
      {/* Top micro bar for safety status and workspace indicator */}
      <div className="px-4 py-1.5 bg-[#070A0F] border-b border-slate-800/80 flex items-center justify-between text-xs font-mono">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-cyan-950/40 border border-cyan-800/50 text-cyan-300">
            <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-sans font-bold text-[11px] text-white">This PC: Local Disk (C:)</span>
            <span className="text-cyan-400/80 text-[10px]">192.6 GB Free</span>
          </div>

          <span className="text-slate-600 hidden md:inline">|</span>

          <div className="hidden sm:flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-slate-400">Disk Safety:</span>
            <div className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-sans font-medium text-[11px]">System32 &amp; OS Core Locked</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={onOpenWizard}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" />
            <span className="font-sans text-[11px] font-semibold">First-Run Wizard</span>
          </button>

          {/* Profile Switcher */}
          <div className="relative">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors cursor-pointer"
            >
              <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              <span className="text-[11px] font-sans font-medium">{activeProfile?.name || 'Default Profile'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {profileDropdownOpen && (
              <div 
                className="absolute right-0 mt-1 w-56 bg-slate-900 border border-slate-700 rounded-lg shadow-2xl p-1 z-50 text-xs font-sans"
                onMouseLeave={() => setProfileDropdownOpen(false)}
              >
                <div className="px-2.5 py-1.5 text-slate-400 font-semibold border-b border-slate-800 flex justify-between items-center">
                  <span>Switch Profile</span>
                  <button 
                    onClick={() => { setProfileDropdownOpen(false); onOpenProfileManager(); }}
                    className="text-cyan-400 hover:underline text-[10px]"
                  >
                    Manage
                  </button>
                </div>
                {profiles.map(p => (
                  <button
                    key={p.id}
                    onClick={() => {
                      onSelectProfile(p.id);
                      setProfileDropdownOpen(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded flex items-center justify-between transition-colors ${
                      p.id === activeProfileId ? 'bg-cyan-500/20 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span>{p.name}</span>
                    {p.id === activeProfileId && <span className="text-cyan-400 text-[10px]">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div 
            onClick={() => onSelectScreen('scan')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-indigo-600 to-pink-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <FolderKanban className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-wider text-white">SORTER</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  v1.2 Desktop
                </span>
              </div>
              <p className="text-[10px] text-slate-400 -mt-0.5">Four-tier file classification & organizer</p>
            </div>
          </div>
        </div>

        {/* Center Nav tabs */}
        <nav className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {navItems.map((item) => {
            const isActive = currentScreen === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectScreen(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer relative ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold ${
                    isActive ? 'bg-amber-400 text-slate-950' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Global Filter / Search Bar */}
        <div className="flex items-center gap-2 w-64">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search files, rules, tags... (⌘K)"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full bg-slate-900/90 border border-slate-700/80 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
