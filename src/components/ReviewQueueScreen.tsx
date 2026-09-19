import React, { useState, useEffect } from 'react';
import { 
  CheckSquare, 
  Check, 
  X, 
  HelpCircle, 
  ArrowRight, 
  Sparkles, 
  Terminal, 
  Layers, 
  ShieldCheck, 
  ChevronRight,
  ChevronDown,
  CornerDownRight,
  Keyboard
} from 'lucide-react';
import { FileRecord, Taxonomy } from '../types';

interface ReviewQueueScreenProps {
  files: FileRecord[];
  taxonomy: Taxonomy;
  onAcceptFile: (fileId: string) => void;
  onSkipFile: (fileId: string) => void;
  onChangeFileCategory: (fileId: string, groupId: string, catId: string) => void;
  onAcceptAllHighConfidence: () => void;
  onNavigateToOrganize: () => void;
}

export const ReviewQueueScreen: React.FC<ReviewQueueScreenProps> = ({
  files,
  taxonomy,
  onAcceptFile,
  onSkipFile,
  onChangeFileCategory,
  onAcceptAllHighConfidence,
  onNavigateToOrganize
}) => {
  // Review items are those with needsReview === true or status === 'pending'
  const reviewFiles = files.filter(f => f.needsReview || f.matchEngine === 'content_check' || f.matchEngine === 'web_lookup');
  
  const [selectedFileId, setSelectedFileId] = useState<string>(reviewFiles[0]?.id || '');
  const [alwaysCreateRule, setAlwaysCreateRule] = useState(false);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(12);

  const activeFile = reviewFiles.find(f => f.id === selectedFileId) || reviewFiles[0];

  // Keyboard shortcut listener (A: Accept, C: Change, S: Skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;

      if (!activeFile) return;

      if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        handleAccept(activeFile.id);
      } else if (e.key === 's' || e.key === 'S') {
        e.preventDefault();
        handleSkip(activeFile.id);
      } else if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setShowCategoryPicker(prev => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeFile]);

  const handleAccept = (fileId: string) => {
    onAcceptFile(fileId);
    setReviewedCount(c => c + 1);
    // Auto advance to next review item
    const currentIndex = reviewFiles.findIndex(f => f.id === fileId);
    if (currentIndex >= 0 && currentIndex < reviewFiles.length - 1) {
      setSelectedFileId(reviewFiles[currentIndex + 1].id);
    }
  };

  const handleSkip = (fileId: string) => {
    onSkipFile(fileId);
    const currentIndex = reviewFiles.findIndex(f => f.id === fileId);
    if (currentIndex >= 0 && currentIndex < reviewFiles.length - 1) {
      setSelectedFileId(reviewFiles[currentIndex + 1].id);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalInQueue = Math.max(reviewFiles.length, 41);
  const progressPercent = Math.min(100, Math.round((reviewedCount / totalInQueue) * 100));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header and Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
              HUMAN-IN-THE-LOOP VERIFICATION
            </span>
          </div>
          <h1 className="text-xl font-black text-white tracking-tight">
            Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Staged items with subtle signals, content checks, or web lookups. Confirm target categories before files are organized.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={onAcceptAllHighConfidence}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Accept All High-Confidence
          </button>

          <button
            onClick={onNavigateToOrganize}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            <span>Proceed to Organize</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Progress Bar & Shortcuts Banner */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
        <div className="flex justify-between items-center text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <span className="font-bold text-amber-400">{reviewedCount} of {totalInQueue}</span>
            <span>files reviewed</span>
          </div>
          <span className="text-cyan-400 font-bold">{progressPercent}% Completed</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-amber-500 via-indigo-500 to-cyan-400 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        {/* Keyboard hints legend */}
        <div className="flex flex-wrap items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">A</kbd>
              Accept
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">C</kbd>
              Change Category
            </span>
            <span className="flex items-center gap-1.5 font-mono">
              <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-200 font-bold">S</kbd>
              Skip File
            </span>
          </div>
          <div className="flex items-center gap-1 text-slate-500">
            <Keyboard className="w-3.5 h-3.5" />
            <span>Shortcuts active</span>
          </div>
        </div>
      </div>

      {/* Main Split Review Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Review Files List */}
        <div className="lg:col-span-4 rounded-2xl bg-[#090D15] border border-slate-800 overflow-hidden flex flex-col max-h-[640px]">
          <div className="p-3.5 bg-[#0D121D] border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Staged Items ({reviewFiles.length})</span>
            <span className="text-[10px] text-slate-500">Select to inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1.5 space-y-1">
            {reviewFiles.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs italic">
                All staged items reviewed.
              </div>
            ) : (
              reviewFiles.map((file) => {
                const isSelected = activeFile?.id === file.id;
                return (
                  <div
                    key={file.id}
                    onClick={() => setSelectedFileId(file.id)}
                    className={`p-3 rounded-xl transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-800/90 border-cyan-500/80 shadow-md text-white'
                        : 'bg-slate-900/40 hover:bg-slate-800/40 border-slate-800/60 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-xs font-bold truncate max-w-[200px]" title={file.name}>
                        {file.name}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {formatBytes(file.size)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span 
                        className="px-2 py-0.5 rounded text-[10px] font-semibold truncate max-w-[150px]"
                        style={{
                          backgroundColor: `${file.targetGroupColor}20`,
                          color: file.targetGroupColor
                        }}
                      >
                        {file.targetCategoryName}
                      </span>

                      <span className={`px-1.5 py-0.2 rounded text-[9px] font-mono uppercase ${
                        file.matchEngine === 'content_check' 
                          ? 'bg-purple-500/20 text-purple-300' 
                          : file.matchEngine === 'web_lookup' 
                          ? 'bg-cyan-500/20 text-cyan-300' 
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {file.matchEngine.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Deep Inspection & Confirmation */}
        <div className="lg:col-span-8 rounded-2xl bg-[#090D15] border border-slate-800 p-6 flex flex-col justify-between space-y-6">
          {activeFile ? (
            <div className="space-y-6">
              {/* File Title & Status */}
              <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-5">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                      {activeFile.extension || 'NO-EXT'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      activeFile.confidence >= 0.80 ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {Math.round(activeFile.confidence * 100)}% Confidence
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      {activeFile.matchEngine.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-xl font-bold font-mono text-white break-all">
                    {activeFile.name}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Path: <span className="font-mono text-slate-300">{activeFile.relativePath || activeFile.path}</span> · Size: <span className="font-mono text-slate-300">{formatBytes(activeFile.size)}</span>
                  </p>
                </div>
              </div>

              {/* Proposed Category Box */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Proposed Target Category
                </div>
                <div className="flex items-center gap-2.5">
                  <span 
                    className="px-3 py-1 rounded-lg text-xs font-bold"
                    style={{
                      backgroundColor: `${activeFile.targetGroupColor}20`,
                      color: activeFile.targetGroupColor,
                      border: `1px solid ${activeFile.targetGroupColor}40`
                    }}
                  >
                    {activeFile.targetGroupName}
                  </span>
                  <span className="text-slate-500 font-bold">&gt;</span>
                  <span className="text-sm font-bold text-white">
                    {activeFile.targetCategoryName}
                  </span>
                </div>
              </div>

              {/* WHY THIS CATEGORY Section */}
              <div className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 space-y-3">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center justify-between">
                  <span>Why This Category?</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Signal Trace Engine</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {activeFile.whyExplanation}
                </p>

                {/* Evidence Chips */}
                {activeFile.matchedSignals && activeFile.matchedSignals.length > 0 && (
                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold block">
                      Matched Signals:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {activeFile.matchedSignals.map((signal, si) => (
                        <span 
                          key={si}
                          className="px-2 py-0.8 rounded text-[11px] font-mono bg-slate-800 border border-slate-700 text-cyan-300"
                        >
                          {signal}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Alternative Categories Suggestions */}
              <div className="space-y-2">
                <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                  Alternative Quick Choices
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => onChangeFileCategory(activeFile.id, 'documents', 'text-notes')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
                  >
                    Documents &gt; Notes, Markdown & Text
                  </button>
                  <button
                    onClick={() => onChangeFileCategory(activeFile.id, 'temp_junk', 'scratchpads')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700/80 transition-colors cursor-pointer"
                  >
                    Temp & Junk &gt; Scratchpads
                  </button>
                  <button
                    onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 text-xs font-semibold border border-indigo-500/30 transition-colors cursor-pointer"
                  >
                    + Browse All Folders...
                  </button>
                </div>

                {/* Expanded full category picker */}
                {showCategoryPicker && (
                  <div className="p-3 mt-2 rounded-xl bg-slate-900 border border-slate-700 space-y-2">
                    <span className="text-xs text-slate-300 font-semibold block">Choose destination:</span>
                    <select
                      value={`${activeFile.targetGroupId}:${activeFile.targetCategoryId}`}
                      onChange={(e) => {
                        const [gid, cid] = e.target.value.split(':');
                        onChangeFileCategory(activeFile.id, gid, cid);
                        setShowCategoryPicker(false);
                      }}
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {taxonomy.groups.map(g => (
                        <optgroup key={g.id} label={g.name}>
                          {g.categories.map(c => (
                            <option key={c.id} value={`${g.id}:${c.id}`}>
                              {g.name} &gt; {c.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* "Always create rule" toggle */}
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={alwaysCreateRule}
                  onChange={(e) => setAlwaysCreateRule(e.target.checked)}
                  className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
                />
                <span>Always sort files like this into this category (creates a permanent rule)</span>
              </label>
            </div>
          ) : (
            <div className="py-24 text-center text-slate-500 italic">
              No files currently selected.
            </div>
          )}

          {/* Action Confirmation Controls */}
          {activeFile && (
            <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleSkip(activeFile.id)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-colors cursor-pointer"
              >
                Skip File (S)
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowCategoryPicker(!showCategoryPicker)}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-bold transition-colors cursor-pointer"
                >
                  Change Category (C)
                </button>

                <button
                  onClick={() => handleAccept(activeFile.id)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Accept (A)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
