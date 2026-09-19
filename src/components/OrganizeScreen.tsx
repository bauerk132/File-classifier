import React, { useState, useMemo } from 'react';
import { 
  ArrowRightLeft, 
  ShieldCheck, 
  AlertTriangle, 
  FolderCheck, 
  FileText, 
  Download, 
  Check, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FolderTree
} from 'lucide-react';
import { FileRecord, Taxonomy, RunHistoryItem } from '../types';

interface OrganizeScreenProps {
  files: FileRecord[];
  taxonomy: Taxonomy;
  onExecuteOrganize: (runData: Omit<RunHistoryItem, 'id' | 'timestamp'>) => void;
  onNavigateToHistory: () => void;
}

export const OrganizeScreen: React.FC<OrganizeScreenProps> = ({
  files,
  taxonomy,
  onExecuteOrganize,
  onNavigateToHistory
}) => {
  const [destinationRoot, setDestinationRoot] = useState('C:\\Users\\Admin\\Documents\\Organized_Library');
  const [copyInsteadOfMove, setCopyInsteadOfMove] = useState(false);
  const [folderStructure, setFolderStructure] = useState<'group_category' | 'category_only'>('group_category');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    'echt_restaurant': true,
    'documents': true,
    'code': true
  });
  
  // Conflict resolution dictionary: { [fileId]: 'skip' | 'keep_both' }
  const [conflictResolutions, setConflictResolutions] = useState<Record<string, 'skip' | 'keep_both'>>({
    'f-quarterly-report': 'keep_both'
  });

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executeSuccess, setExecuteSuccess] = useState(false);
  const [latestRunId, setLatestRunId] = useState<string>('');

  // Eligible files: NOT sensitive, NOT needing review, and NOT system-protected OS files
  const eligibleFiles = useMemo(() => {
    return files.filter(f => !f.sensitive && !f.needsReview && f.matchEngine !== 'ignored' && !f.systemProtected);
  }, [files]);

  const leftInReviewCount = useMemo(() => {
    return files.filter(f => f.needsReview).length;
  }, [files]);

  const sensitiveProtectedCount = useMemo(() => {
    return files.filter(f => f.sensitive).length;
  }, [files]);

  const osProtectedCount = useMemo(() => {
    return files.filter(f => f.systemProtected).length;
  }, [files]);

  // Detected conflicts (simulated duplicate destination items)
  const conflicts = useMemo(() => {
    return files.filter(f => f.name.includes('Quarterly_Report') || f.isDuplicate);
  }, [files]);

  // Grouped eligible files for visualization
  const groupedProposals = useMemo(() => {
    const map: Record<string, { groupName: string; groupColor: string; files: FileRecord[] }> = {};
    for (const f of eligibleFiles) {
      if (!map[f.targetGroupId]) {
        map[f.targetGroupId] = {
          groupName: f.targetGroupName,
          groupColor: f.targetGroupColor,
          files: []
        };
      }
      map[f.targetGroupId].files.push(f);
    }
    return map;
  }, [eligibleFiles]);

  const totalBytesMoving = useMemo(() => {
    return eligibleFiles.reduce((acc, f) => acc + f.size, 0);
  }, [eligibleFiles]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleToggleGroup = (gid: string) => {
    setExpandedGroups(prev => ({ ...prev, [gid]: !prev[gid] }));
  };

  const handleExportPlanJson = () => {
    const plan = {
      timestamp: new Date().toISOString(),
      destinationRoot,
      copyInsteadOfMove,
      folderStructure,
      totalFiles: eligibleFiles.length,
      moves: eligibleFiles.map(f => {
        const destFolder = folderStructure === 'group_category'
          ? `${destinationRoot}/${f.targetGroupName}/${f.targetCategoryName}`
          : `${destinationRoot}/${f.targetCategoryName}`;
        return {
          id: f.id,
          name: f.name,
          source: f.path,
          destination: `${destFolder}/${f.name}`,
          size: f.size,
          safetyHash: f.safetyHash
        };
      })
    };

    const blob = new Blob([JSON.stringify(plan, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorter-organize-plan-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleConfirmOrganize = () => {
    setIsExecuting(true);
    setTimeout(() => {
      const runId = `RUN-${Math.floor(1000 + Math.random() * 9000)}`;
      setLatestRunId(runId);
      
      const manifestMoves = eligibleFiles.map(f => {
        const destFolder = folderStructure === 'group_category'
          ? `${destinationRoot}/${f.targetGroupName}/${f.targetCategoryName}`
          : `${destinationRoot}/${f.targetCategoryName}`;
        return {
          fileId: f.id,
          fileName: f.name,
          sourcePath: f.path,
          destinationPath: `${destFolder}/${f.name}`,
          size: f.size,
          sha256: f.safetyHash
        };
      });

      onExecuteOrganize({
        status: 'completed',
        fileCount: eligibleFiles.length,
        totalBytes: totalBytesMoving,
        sourceDirectory: '~/Documents & Downloads',
        targetDirectory: destinationRoot,
        manifest: manifestMoves
      });

      setIsExecuting(false);
      setShowConfirmModal(false);
      setExecuteSuccess(true);
    }, 1200);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Top Dry-Run Safety Lock Banner */}
      <div className="p-4 rounded-2xl bg-[#090D16] border border-cyan-500/30 flex items-start justify-between gap-4 shadow-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white tracking-wide">
                Preview Only · Dry-Run Protection Active
              </h2>
              <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Non-Destructive Shield
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              Target Volume: <span className="font-mono text-cyan-300 font-semibold">Local Disk (C:)</span>. Nothing moves until you confirm. Files still in Review ({leftInReviewCount}), sensitive files ({sensitiveProtectedCount}), and <span className="text-emerald-300 font-semibold">{osProtectedCount} Windows OS Core files</span> (C:\Windows, pagefile.sys) are locked and will never be moved.
            </p>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400">
          <span>Mode:</span>
          <span className="text-emerald-400 font-bold">{copyInsteadOfMove ? 'SAFE COPY' : 'ATOMIC MOVE'}</span>
        </div>
      </div>

      {/* Success Banner if just executed */}
      {executeSuccess && (
        <div className="p-5 rounded-2xl bg-emerald-950/30 border border-emerald-500/40 flex items-center justify-between gap-4 shadow-xl text-xs text-emerald-200">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-sm text-emerald-300">
                Organization Completed Successfully! (#{latestRunId})
              </div>
              <div className="text-slate-300 mt-0.5">
                {eligibleFiles.length} files organized into {destinationRoot}. You can undo this run at any time in History.
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onNavigateToHistory}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold transition-colors cursor-pointer"
            >
              View in History &gt;
            </button>
          </div>
        </div>
      )}

      {/* Configuration Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Destination Path Selector */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-cyan-400" />
            <span>Target Destination Folder</span>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={destinationRoot}
              onChange={(e) => setDestinationRoot(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={() => {
                const newPath = prompt('Enter destination directory path:', destinationRoot);
                if (newPath) setDestinationRoot(newPath);
              }}
              className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Change
            </button>
          </div>
        </div>

        {/* Layout & Safety Toggles */}
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
            Folder Layout & Mode
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <label className="text-slate-400 font-medium">Layout:</label>
              <select
                value={folderStructure}
                onChange={(e) => setFolderStructure(e.target.value as any)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white"
              >
                <option value="group_category">Group &gt; Category (Recommended)</option>
                <option value="category_only">Category only (Flat)</option>
              </select>
            </div>

            <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={copyInsteadOfMove}
                onChange={(e) => setCopyInsteadOfMove(e.target.checked)}
                className="rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-0"
              />
              <span className="font-semibold">Copy instead of move (Preserves original)</span>
            </label>
          </div>
        </div>
      </div>

      {/* Proposed Moves Breakdown Table */}
      <div className="rounded-2xl bg-[#090D15] border border-slate-800 overflow-hidden shadow-xl">
        <div className="p-4 bg-[#0D121D] border-b border-slate-800 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-white">Proposed Moves Breakdown</span>
            <span className="text-slate-400">({eligibleFiles.length} files · {formatBytes(totalBytesMoving)})</span>
          </div>
          <button
            onClick={handleExportPlanJson}
            className="flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Plan (JSON)</span>
          </button>
        </div>

        {/* Group lists */}
        <div className="divide-y divide-slate-800/60">
          {Object.entries(groupedProposals).map(([groupId, group]) => {
            const isExpanded = expandedGroups[groupId] ?? true;
            return (
              <div key={groupId} className="p-3">
                <div 
                  onClick={() => handleToggleGroup(groupId)}
                  className="flex items-center justify-between py-2 px-2 rounded-lg hover:bg-slate-800/40 cursor-pointer text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: group.groupColor }}></span>
                    <span className="font-bold text-white">{group.groupName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300">
                      {group.files.length} files
                    </span>
                  </div>

                  <span className="font-mono text-slate-400 text-[11px]">
                    {formatBytes(group.files.reduce((a, b) => a + b.size, 0))}
                  </span>
                </div>

                {/* Expanded file list */}
                {isExpanded && (
                  <div className="mt-2 pl-6 pr-2 space-y-1.5">
                    {group.files.slice(0, 8).map((file) => {
                      const isConflict = file.name.includes('Quarterly_Report') || file.isDuplicate;
                      return (
                        <div 
                          key={file.id}
                          className={`p-2.5 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono ${
                            isConflict 
                              ? 'bg-amber-950/20 border-amber-800/50 text-amber-200' 
                              : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-2 truncate max-w-md">
                            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-200 truncate">{file.name}</span>
                            <span className="text-slate-500 font-sans text-[11px]">&rarr;</span>
                            <span className="text-cyan-400 font-sans text-[11px] truncate">
                              {file.targetCategoryName}
                            </span>
                          </div>

                          {/* Conflict Resolution Controls if duplicate name */}
                          {isConflict ? (
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-amber-400 text-[10px] font-sans font-semibold">
                                Name exists at dest:
                              </span>
                              <div className="flex items-center gap-1 font-sans text-[11px]">
                                <button
                                  onClick={() => setConflictResolutions(prev => ({ ...prev, [file.id]: 'keep_both' }))}
                                  className={`px-2 py-0.5 rounded border transition-colors ${
                                    conflictResolutions[file.id] === 'keep_both'
                                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  Keep both (+1)
                                </button>
                                <button
                                  onClick={() => setConflictResolutions(prev => ({ ...prev, [file.id]: 'skip' }))}
                                  className={`px-2 py-0.5 rounded border transition-colors ${
                                    conflictResolutions[file.id] === 'skip'
                                      ? 'bg-slate-700 text-white border-slate-600 font-bold'
                                      : 'bg-slate-800 text-slate-400 border-slate-700'
                                  }`}
                                >
                                  Skip
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">
                              {formatBytes(file.size)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sticky Action Bar */}
      <div className="p-4 rounded-2xl bg-[#090D15] border border-slate-800 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-300">
          <span className="font-bold text-white">{eligibleFiles.length.toLocaleString()} files</span> will move · 
          <span className="text-amber-400 font-semibold ml-1">{conflicts.length} conflicts resolved</span> · 
          <span className="text-slate-400 ml-1">{leftInReviewCount} left in Review</span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportPlanJson}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            Export Plan (JSON)
          </button>

          <button
            onClick={() => setShowConfirmModal(true)}
            disabled={eligibleFiles.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 via-cyan-600 to-indigo-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-black shadow-lg shadow-cyan-600/30 transition-all cursor-pointer disabled:opacity-50"
          >
            <ArrowRightLeft className="w-4 h-4 stroke-[2.5]" />
            <span>Move Files (Confirm)</span>
          </button>
        </div>
      </div>

      {/* Final Move Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0C1019] border border-slate-700 rounded-2xl shadow-2xl overflow-hidden p-6 space-y-6 text-slate-200">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto">
                <ArrowRightLeft className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">
                Move {eligibleFiles.length} files?
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Files will be moved cleanly to <strong className="text-white font-mono">{destinationRoot}</strong>. Files are moved, never overwritten, and never modified.
              </p>
            </div>

            {/* Safety checkpoints info */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2 font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Operation:</span>
                <span className="text-emerald-400 font-bold">{copyInsteadOfMove ? 'SAFE COPY' : 'ATOMIC FILE MOVE'}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Files Protected:</span>
                <span className="text-amber-400 font-bold">{sensitiveProtectedCount} Sensitive / {leftInReviewCount} Review</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Rollback Checkpoint:</span>
                <span className="text-cyan-400 font-bold">Enabled (History Log)</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                onClick={handleConfirmOrganize}
                disabled={isExecuting}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-slate-950 text-xs font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                {isExecuting ? (
                  <span>Executing Move...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Yes, Move Files Now</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
