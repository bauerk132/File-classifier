import React, { useState } from 'react';
import { 
  History, 
  RotateCcw, 
  CheckCircle2, 
  FileText, 
  Download, 
  X, 
  FolderCheck, 
  Layers, 
  AlertCircle,
  Hash
} from 'lucide-react';
import { RunHistoryItem } from '../types';

interface HistoryScreenProps {
  history: RunHistoryItem[];
  onRevertRun: (runId: string) => void;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  history,
  onRevertRun
}) => {
  const [inspectingRun, setInspectingRun] = useState<RunHistoryItem | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const totalFilesMoved = history.reduce((acc, h) => acc + (h.status === 'completed' ? h.fileCount : 0), 0);
  const totalBytesMoved = history.reduce((acc, h) => acc + (h.status === 'completed' ? h.totalBytes : 0), 0);
  const latestCompletedRun = history.find(h => h.status === 'completed');

  const handleExportManifest = (run: RunHistoryItem) => {
    const blob = new Blob([JSON.stringify(run, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sorter-manifest-${run.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Organization Run History</h1>
          <p className="text-xs text-slate-400 mt-1">
            Every file relocation is recorded into an atomic checkpoint manifest. You can inspect transformations or roll back anytime.
          </p>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Runs</div>
          <div className="text-lg font-black font-mono text-white mt-1">{history.length} Lifetime</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Logged checkpoints</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400">Files Organized</div>
          <div className="text-lg font-black font-mono text-cyan-300 mt-1">{totalFilesMoved.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-400/80 mt-0.5">Successfully moved</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-emerald-400">Active Checkpoint</div>
          <div className="text-lg font-black font-mono text-emerald-300 mt-1">
            {latestCompletedRun ? latestCompletedRun.id : 'None'}
          </div>
          <div className="text-[10px] text-emerald-400/80 mt-0.5">Cached for instant revert</div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-400">Total Size Organized</div>
          <div className="text-lg font-black font-mono text-purple-300 mt-1">{formatBytes(totalBytesMoved)}</div>
          <div className="text-[10px] text-purple-400/80 mt-0.5">Zero byte corruption</div>
        </div>
      </div>

      {/* Active Checkpoint Banner */}
      {latestCompletedRun && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0A1220] border border-cyan-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-white">#{latestCompletedRun.id}</span>
                <span className="px-2 py-0.2 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  Instant Revert Cached
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Most recent run moved {latestCompletedRun.fileCount} files. You can immediately rollback all files to their exact origins.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={() => setInspectingRun(latestCompletedRun)}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              Inspect Manifest
            </button>
            <button
              onClick={() => onRevertRun(latestCompletedRun.id)}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Revert This Run</span>
            </button>
          </div>
        </div>
      )}

      {/* Run Log Table */}
      <div className="rounded-2xl bg-[#090D15] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0D121D] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">Run Identifier</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Files & Size</th>
                <th className="py-3 px-4">Destination Target</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {history.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-white">
                    #{item.id}
                  </td>
                  <td className="py-3.5 px-4 text-slate-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 font-mono">
                    <span className="text-white font-bold">{item.fileCount}</span> files
                    <span className="text-slate-500 ml-1">({formatBytes(item.totalBytes)})</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 truncate max-w-xs">
                    {item.targetDirectory}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                      item.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400'
                    }`}>
                      {item.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setInspectingRun(item)}
                        className="text-cyan-400 hover:text-cyan-300 font-semibold text-xs cursor-pointer"
                      >
                        Inspect
                      </button>
                      {item.status === 'completed' && (
                        <button
                          onClick={() => onRevertRun(item.id)}
                          className="text-rose-400 hover:text-rose-300 font-semibold text-xs ml-2 cursor-pointer"
                        >
                          Undo
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inspect Manifest Modal */}
      {inspectingRun && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-4xl bg-[#0C1019] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-slate-200">
            <div className="p-5 border-b border-slate-800 bg-[#0F1420] flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Run Manifest #{inspectingRun.id}</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {inspectingRun.manifest.length} atomic transformations with SHA-256 safety validations
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleExportManifest(inspectingRun)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => setInspectingRun(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-900 border-b border-slate-800 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="py-2.5 px-3">File Name</th>
                      <th className="py-2.5 px-3">Original Source</th>
                      <th className="py-2.5 px-3">New Destination</th>
                      <th className="py-2.5 px-3">Size</th>
                      <th className="py-2.5 px-3">Safety Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-[11px]">
                    {inspectingRun.manifest.map((m, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-bold text-white">{m.fileName}</td>
                        <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{m.sourcePath}</td>
                        <td className="py-2.5 px-3 text-cyan-300 truncate max-w-xs">{m.destinationPath}</td>
                        <td className="py-2.5 px-3 text-slate-400">{formatBytes(m.size)}</td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{m.sha256}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-4 border-t border-slate-800 bg-[#0F1420] flex justify-end">
              <button
                onClick={() => setInspectingRun(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
              >
                Close Manifest
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
