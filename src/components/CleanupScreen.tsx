import React, { useState, useMemo } from 'react';
import { 
  Trash2, 
  FolderArchive, 
  Clock, 
  ShieldCheck, 
  AlertTriangle, 
  Check, 
  Download, 
  HardDrive, 
  CheckSquare, 
  Square, 
  FileText, 
  ExternalLink, 
  Sparkles,
  RefreshCw,
  FolderOpen,
  ArrowRight,
  Info,
  Calendar
} from 'lucide-react';
import { FileRecord, QuarantineStagingPlan, RunHistoryItem } from '../types';
import { CleanupVisualization } from './CleanupVisualization';

interface CleanupScreenProps {
  files: FileRecord[];
  onExecuteQuarantine: (runData: Omit<RunHistoryItem, 'id' | 'timestamp'>, quarantinePath: string) => void;
  onNavigateToHistory: () => void;
  onRemoveFromCleanup: (fileId: string) => void;
}

export const CleanupScreen: React.FC<CleanupScreenProps> = ({
  files,
  onExecuteQuarantine,
  onNavigateToHistory,
  onRemoveFromCleanup
}) => {
  // Filter all files that qualify for cleanup (strict exclusion of systemProtected OS files)
  const allCandidates = useMemo(() => {
    return files.filter(f => {
      if (f.systemProtected) return false;
      if (f.status === 'organized') return false;
      if (f.cleanupCandidate) return true;
      if (f.targetGroupId === 'temp_junk') return true;
      if (f.isDuplicate) return true;
      if (f.extension === '.crdownload' || f.extension === '.part') return true;
      if (f.name.toLowerCase().startsWith('untitled')) return true;
      return false;
    });
  }, [files]);

  // Selected file IDs
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    return new Set(allCandidates.map(f => f.id));
  });

  // Category filter
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Quarantine staging configuration
  const [quarantineFolder, setQuarantineFolder] = useState<string>('C:\\Users\\Admin\\Documents\\_Needs_Recycled_Quarantine');
  const [holdingDurationDays, setHoldingDurationDays] = useState<number>(7);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [hasCompletedStaging, setHasCompletedStaging] = useState<boolean>(false);
  const [lastStagedManifest, setLastStagedManifest] = useState<any[]>([]);

  // Format bytes helper
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Derive candidate specific category
  const getCandidateType = (f: FileRecord): { key: string; label: string; color: string; badge: string } => {
    const ext = f.extension.toLowerCase();
    const name = f.name.toLowerCase();

    if (ext === '.crdownload' || ext === '.part' || name.endsWith('.download')) {
      return { key: 'downloads', label: 'Incomplete Download', color: '#EF4444', badge: 'Broken Artifact' };
    }
    if (['.dmg', '.exe', '.pkg', '.iso'].includes(ext)) {
      return { key: 'installers', label: 'Stale Disk Installer', color: '#F59E0B', badge: 'High Storage' };
    }
    if (ext === '.log' || ext === '.dmp' || name.includes('crash')) {
      return { key: 'logs', label: 'Crash / Debug Log', color: '#6366F1', badge: 'Diagnostic Log' };
    }
    if (name.startsWith('untitled') || ext === '.tmp' || ext === '.bak') {
      return { key: 'scratchpads', label: 'Temporary Scratchpad', color: '#EC4899', badge: 'Stale Scratchpad' };
    }
    if (f.isDuplicate) {
      return { key: 'duplicates', label: 'Redundant Duplicate', color: '#8B5CF6', badge: 'Identical Duplicate' };
    }
    return { key: 'other', label: 'Junk / Temp File', color: '#64748B', badge: 'Temporary' };
  };

  // Filtered list
  const filteredCandidates = useMemo(() => {
    if (filterCategory === 'all') return allCandidates;
    return allCandidates.filter(f => getCandidateType(f).key === filterCategory);
  }, [allCandidates, filterCategory]);

  // Selected totals
  const selectedFiles = allCandidates.filter(f => selectedIds.has(f.id));
  const totalReclaimableBytes = selectedFiles.reduce((acc, f) => acc + f.size, 0);

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredCandidates.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allCandidates.map(f => f.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleExecuteStaging = () => {
    if (selectedFiles.length === 0) return;

    const manifestMoves = selectedFiles.map(f => ({
      fileId: f.id,
      fileName: f.name,
      sourcePath: f.path || f.relativePath,
      destinationPath: `${quarantineFolder}/${f.name}`,
      size: f.size,
      sha256: f.safetyHash
    }));

    onExecuteQuarantine({
      status: 'completed',
      fileCount: selectedFiles.length,
      totalBytes: totalReclaimableBytes,
      sourceDirectory: 'Scan Root (Various)',
      targetDirectory: quarantineFolder,
      manifest: manifestMoves
    }, quarantineFolder);

    setLastStagedManifest(manifestMoves);
    setShowConfirmModal(false);
    setHasCompletedStaging(true);
  };

  const handleExportCleanupManifest = () => {
    const data = {
      action: "sorter_quarantine_staging",
      timestamp: new Date().toISOString(),
      holdingDurationDays,
      recommendedRecycleDate: new Date(Date.now() + holdingDurationDays * 86400000).toISOString(),
      quarantineFolder,
      instructions: "To finalize deletion, move this entire folder to your system Recycle Bin / Trash. If you need to restore any files, consult the originalPath entries below.",
      files: lastStagedManifest
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'quarantine-recycle-manifest.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>Recommended for Cleanup & Staging</span>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {allCandidates.length} Candidates
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Safe non-destructive quarantine: Sorter moves files to a holding staging folder before you send them to the Recycle Bin.
              </p>
            </div>
          </div>
        </div>

        {/* Summary Pill */}
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-right">
            <div className="text-[10px] uppercase font-mono text-slate-400">Reclaimable Storage</div>
            <div className="text-base font-black font-mono text-rose-400">
              {formatBytes(totalReclaimableBytes)}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content or Success State */}
      {hasCompletedStaging ? (
        <div className="p-8 rounded-2xl bg-gradient-to-b from-[#0B1522] to-[#070D18] border border-cyan-500/40 text-center space-y-6 max-w-2xl mx-auto shadow-2xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center">
            <Check className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-white">Files Staged in Quarantine Folder!</h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-cyan-400 font-mono">{lastStagedManifest.length} files</strong> ({formatBytes(totalReclaimableBytes)}) have been safely moved to:
              <br />
              <code className="text-cyan-300 font-mono bg-slate-950 px-2 py-1 rounded mt-2 inline-block border border-slate-800">
                {quarantineFolder}
              </code>
            </p>
          </div>

          {/* Educational Safety Banner */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-left text-xs space-y-2">
            <div className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Next Steps for Deletion:</span>
            </div>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              1. Sorter does not force-delete files directly. They will remain safely in the quarantine folder for your <strong>{holdingDurationDays}-day holding period</strong>.
              <br />
              2. When you are ready, simply open that folder in your file manager and drag it to your system <strong>Recycle Bin / Trash</strong> to permanently delete.
              <br />
              3. A manifest has been recorded in Sorter Run History so you can undo or restore any file if needed.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <button
              onClick={handleExportCleanupManifest}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download Quarantine Manifest</span>
            </button>
            <button
              onClick={onNavigateToHistory}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>View Run History</span>
            </button>
            <button
              onClick={() => setHasCompletedStaging(false)}
              className="px-4 py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Return to Cleanup Screen
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Hard Drive C: Target Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-xs">
            <div className="flex items-center gap-2.5">
              <HardDrive className="w-4 h-4 text-cyan-400 shrink-0" />
              <div>
                <span className="font-bold text-white">Target Disk: Local Disk (C:)</span>
                <span className="text-slate-400 ml-2">476.8 GB NVMe SSD · 192.6 GB Free</span>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-emerald-400 font-bold">+{formatBytes(totalReclaimableBytes)}</span>
              <span className="text-slate-400">space recovery to C: partition</span>
            </div>
          </div>

          {/* User Prompt / Configuration Hero Card */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#101422] to-slate-900 border border-rose-500/30 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-rose-400 font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Staged Cleanup Recommendation
                </span>
                <h3 className="text-base font-black text-white mt-1">
                  Would you like to move these files to a separate quarantine folder before recycling?
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Instead of immediate deletion, files are held in a staging directory. Once the holding period passes and you are confident you don't need them, you can empty or recycle the folder.
                </p>
              </div>

              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={selectedFiles.length === 0}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all shadow-lg shrink-0 cursor-pointer ${
                  selectedFiles.length > 0
                    ? 'bg-rose-600 hover:bg-rose-500 text-white hover:shadow-rose-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <FolderArchive className="w-4 h-4" />
                <span>Stage {selectedFiles.length} Files ({formatBytes(totalReclaimableBytes)})</span>
              </button>
            </div>

            {/* Holding Duration & Target Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80">
              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <FolderOpen className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Staging Quarantine Folder Path:</span>
                </label>
                <input
                  type="text"
                  value={quarantineFolder}
                  onChange={(e) => setQuarantineFolder(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-rose-400" />
                  <span>Review Holding Duration Before Final Recycle:</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { days: 7, label: '7 Days' },
                    { days: 14, label: '14 Days' },
                    { days: 30, label: '30 Days' },
                    { days: 0, label: 'Ready Now' },
                  ].map(opt => (
                    <button
                      key={opt.days}
                      onClick={() => setHoldingDurationDays(opt.days)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold font-mono transition-all cursor-pointer ${
                        holdingDurationDays === opt.days
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                          : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Storage Gain & Selection Visualizer */}
          <CleanupVisualization
            totalScannedFiles={files}
            allCandidates={allCandidates}
            selectedIds={selectedIds}
            onSelectAll={() => setSelectedIds(new Set(allCandidates.map(f => f.id)))}
            onSelectLargeOnly={() => setSelectedIds(new Set(allCandidates.filter(f => f.size >= 10 * 1024 * 1024).map(f => f.id)))}
            onClearSelection={() => setSelectedIds(new Set())}
            getCandidateType={getCandidateType}
            formatBytes={formatBytes}
          />

          {/* Category Filter Pills & Table Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => setFilterCategory('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'all'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                All ({allCandidates.length})
              </button>
              <button
                onClick={() => setFilterCategory('downloads')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'downloads'
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Incomplete Downloads
              </button>
              <button
                onClick={() => setFilterCategory('installers')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'installers'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Stale Installers
              </button>
              <button
                onClick={() => setFilterCategory('logs')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'logs'
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Crash & Debug Logs
              </button>
              <button
                onClick={() => setFilterCategory('scratchpads')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'scratchpads'
                    ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Scratchpads & Temp
              </button>
              <button
                onClick={() => setFilterCategory('duplicates')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filterCategory === 'duplicates'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                Duplicates
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors cursor-pointer"
              >
                {selectedIds.size === filteredCandidates.length ? (
                  <CheckSquare className="w-3.5 h-3.5 text-rose-400" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>{selectedIds.size === filteredCandidates.length ? 'Deselect All' : 'Select All'}</span>
              </button>
            </div>
          </div>

          {/* Candidates Table */}
          <div className="rounded-2xl bg-[#090D15] border border-slate-800 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-[#0D121D] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                  <tr>
                    <th className="py-3 px-4 w-10">
                      <input
                        type="checkbox"
                        checked={selectedIds.size === filteredCandidates.length && filteredCandidates.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded border-slate-700 bg-slate-900 text-rose-500"
                      />
                    </th>
                    <th className="py-3 px-4">Candidate File</th>
                    <th className="py-3 px-4">Cleanup Justification</th>
                    <th className="py-3 px-4">Original Location</th>
                    <th className="py-3 px-4">File Size</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {filteredCandidates.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        No cleanup candidates match the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredCandidates.map(f => {
                      const isSelected = selectedIds.has(f.id);
                      const typeInfo = getCandidateType(f);

                      return (
                        <tr 
                          key={f.id} 
                          className={`transition-colors ${
                            isSelected ? 'bg-rose-950/10 hover:bg-rose-950/20' : 'hover:bg-slate-800/40 opacity-70'
                          }`}
                        >
                          <td className="py-3 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(f.id)}
                              className="rounded border-slate-700 bg-slate-900 text-rose-500"
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="truncate max-w-sm">{f.name}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                              Modified: {new Date(f.modified).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="py-3 px-4 font-sans">
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-bold inline-block"
                              style={{ 
                                backgroundColor: `${typeInfo.color}20`, 
                                color: typeInfo.color,
                                border: `1px solid ${typeInfo.color}40`
                              }}
                            >
                              {typeInfo.badge}
                            </span>
                            <div className="text-[11px] text-slate-400 mt-1">
                              {f.cleanupReason || typeInfo.label}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-slate-400 text-[11px] truncate max-w-xs font-mono">
                            {f.relativePath || f.path}
                          </td>
                          <td className="py-3 px-4 font-bold text-rose-400">
                            {formatBytes(f.size)}
                          </td>
                          <td className="py-3 px-4 text-right font-sans">
                            <button
                              onClick={() => onRemoveFromCleanup(f.id)}
                              className="text-slate-400 hover:text-emerald-400 text-xs font-semibold transition-colors cursor-pointer"
                              title="Keep this file in main organizer"
                            >
                              Keep File
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0C1019] border border-rose-500/40 rounded-2xl shadow-2xl p-6 space-y-5 text-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                <FolderArchive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Confirm Quarantine Staging</h3>
                <p className="text-xs text-slate-400">Non-destructive pre-recycle isolation</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Files to stage:</span>
                <span className="font-bold font-mono text-white">{selectedFiles.length} files</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total size:</span>
                <span className="font-bold font-mono text-rose-400">{formatBytes(totalReclaimableBytes)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Staging destination:</span>
                <span className="font-mono text-cyan-300 text-right truncate max-w-[200px]">{quarantineFolder}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Holding duration:</span>
                <span className="font-bold text-white">{holdingDurationDays > 0 ? `${holdingDurationDays} Days` : 'Immediate Review'}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
              <Info className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div className="leading-relaxed">
                <strong>No files will be permanently deleted right now.</strong> Sorter will move them into the quarantine folder. You will manually move that folder to your Recycle Bin whenever you decide.
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleExecuteStaging}
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg transition-colors cursor-pointer"
              >
                Proceed & Stage to Quarantine
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
