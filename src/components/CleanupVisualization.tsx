import React, { useMemo } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { 
  TrendingUp, 
  HardDrive, 
  Files, 
  Sparkles, 
  ArrowDownRight, 
  CheckCircle2, 
  PieChart as PieIcon, 
  BarChart3, 
  Zap,
  ArrowRight
} from 'lucide-react';
import { FileRecord } from '../types';

interface CleanupVisualizationProps {
  totalScannedFiles: FileRecord[];
  allCandidates: FileRecord[];
  selectedIds: Set<string>;
  onSelectAll: () => void;
  onSelectLargeOnly: () => void;
  onClearSelection: () => void;
  getCandidateType: (f: FileRecord) => { key: string; label: string; color: string; badge: string };
  formatBytes: (bytes: number) => string;
}

export const CleanupVisualization: React.FC<CleanupVisualizationProps> = ({
  totalScannedFiles,
  allCandidates,
  selectedIds,
  onSelectAll,
  onSelectLargeOnly,
  onClearSelection,
  getCandidateType,
  formatBytes,
}) => {
  // Aggregate calculations
  const totalScannedBytes = useMemo(() => {
    return totalScannedFiles.reduce((acc, f) => acc + f.size, 0);
  }, [totalScannedFiles]);

  const selectedFiles = useMemo(() => {
    return allCandidates.filter(f => selectedIds.has(f.id));
  }, [allCandidates, selectedIds]);

  const selectedBytes = useMemo(() => {
    return selectedFiles.reduce((acc, f) => acc + f.size, 0);
  }, [selectedFiles]);

  const totalCandidateBytes = useMemo(() => {
    return allCandidates.reduce((acc, f) => acc + f.size, 0);
  }, [allCandidates]);

  // Storage gain calculations
  const storageGainBytes = selectedBytes;
  const storageGainPercentOfTotal = totalScannedBytes > 0 
    ? ((selectedBytes / totalScannedBytes) * 100).toFixed(1) 
    : '0';
  const storageGainPercentOfCandidates = totalCandidateBytes > 0 
    ? Math.round((selectedBytes / totalCandidateBytes) * 100) 
    : 0;

  const postCleanupBytes = Math.max(0, totalScannedBytes - selectedBytes);
  const postCleanupCount = Math.max(0, totalScannedFiles.length - selectedFiles.length);

  // Category breakdown data for charts
  const categoryData = useMemo(() => {
    const map: Record<string, { label: string; color: string; selectedBytes: number; selectedCount: number; totalBytes: number; totalCount: number }> = {
      downloads: { label: 'Downloads', color: '#EF4444', selectedBytes: 0, selectedCount: 0, totalBytes: 0, totalCount: 0 },
      installers: { label: 'Installers', color: '#F59E0B', selectedBytes: 0, selectedCount: 0, totalBytes: 0, totalCount: 0 },
      logs: { label: 'Crash Logs', color: '#6366F1', selectedBytes: 0, selectedCount: 0, totalBytes: 0, totalCount: 0 },
      scratchpads: { label: 'Scratchpads', color: '#EC4899', selectedBytes: 0, selectedCount: 0, totalBytes: 0, totalCount: 0 },
      duplicates: { label: 'Duplicates', color: '#8B5CF6', selectedBytes: 0, selectedCount: 0, totalBytes: 0, totalCount: 0 },
      other: { label: 'Junk/Temp', color: '#64748B', selectedBytes: 0, selectedCount: 0, totalBytes: 0, totalCount: 0 },
    };

    for (const f of allCandidates) {
      const type = getCandidateType(f);
      const entry = map[type.key] || map.other;
      entry.totalBytes += f.size;
      entry.totalCount += 1;
      if (selectedIds.has(f.id)) {
        entry.selectedBytes += f.size;
        entry.selectedCount += 1;
      }
    }

    return Object.entries(map)
      .filter(([_, val]) => val.totalCount > 0)
      .map(([key, val]) => ({
        key,
        name: val.label,
        color: val.color,
        // Convert to MB for readable chart scale
        sizeMB: parseFloat((val.selectedBytes / (1024 * 1024)).toFixed(2)),
        bytes: val.selectedBytes,
        formattedSize: formatBytes(val.selectedBytes),
        count: val.selectedCount,
        totalBytes: val.totalBytes,
        totalCount: val.totalCount,
      }));
  }, [allCandidates, selectedIds, getCandidateType, formatBytes]);

  // Donut chart data: Storage Reclaimed vs Retained
  const donutData = useMemo(() => {
    return [
      { name: 'Reclaimed Storage Gain', value: Math.max(1, selectedBytes), color: '#10B981', formatted: formatBytes(selectedBytes) },
      { name: 'Retained Workspace Files', value: Math.max(1, postCleanupBytes), color: '#1E293B', formatted: formatBytes(postCleanupBytes) }
    ];
  }, [selectedBytes, postCleanupBytes, formatBytes]);

  return (
    <div className="space-y-4">
      {/* 1. Main Impact Stat Cards & Quick Selection Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Storage Gain Metric */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#0B1522] via-[#0E1B2C] to-[#0A121E] border border-emerald-500/40 shadow-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
          
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-emerald-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              Projected Storage Gain
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              +{storageGainPercentOfTotal}% Total Gain
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <div className="text-3xl font-black font-mono tracking-tight text-white group-hover:text-emerald-300 transition-colors">
              +{formatBytes(storageGainBytes)}
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Storage immediately reclaimed upon moving staged quarantine files to Recycle Bin.
          </p>

          {/* Progress bar representing fraction of candidate pool chosen */}
          <div className="mt-3 pt-3 border-t border-slate-800/80">
            <div className="flex justify-between text-[11px] font-mono text-slate-400 mb-1">
              <span>Candidate Pool Selected</span>
              <span className="text-emerald-400 font-bold">{storageGainPercentOfCandidates}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 via-emerald-400 to-emerald-500 rounded-full transition-all duration-300 shadow-[0_0_12px_rgba(16,185,129,0.5)]"
                style={{ width: `${Math.min(100, Math.max(0, storageGainPercentOfCandidates))}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* File Count to Recycle Metric */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-[#120D1A] via-[#1A1226] to-[#100B17] border border-rose-500/40 shadow-xl group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>

          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-rose-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Files className="w-4 h-4" />
              Files to Recycle
            </span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
              {selectedFiles.length} of {allCandidates.length} Selected
            </span>
          </div>

          <div className="mt-2.5 flex items-baseline gap-2">
            <div className="text-3xl font-black font-mono tracking-tight text-white group-hover:text-rose-300 transition-colors">
              {selectedFiles.length.toLocaleString()} <span className="text-base font-normal text-slate-400">files</span>
            </div>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Redundant, partial, or debug files scheduled for quarantine isolation.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono text-slate-400">
            <span>Remaining Workspace Files:</span>
            <span className="font-bold text-white">{postCleanupCount.toLocaleString()} items</span>
          </div>
        </div>

        {/* Quick Selection Presets & Optimization Mode */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
          <div>
            <div className="text-xs font-mono text-cyan-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-cyan-400" />
              Quick Selection Presets
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select candidates based on storage gain efficiency:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <button
              onClick={onSelectAll}
              className="px-2.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Select All (Max Gain)
            </button>
            <button
              onClick={onSelectLargeOnly}
              className="px-2.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Heavy Files (&gt;10 MB)
            </button>
            <button
              onClick={onClearSelection}
              className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition-all text-center cursor-pointer"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* 2. Before vs. After Storage Ledger & Multi-Segmented Storage Bar */}
      <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-black text-white">Before & After Storage Ledger</h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Real-time projection based on active selection
          </span>
        </div>

        {/* 4-Column Ledger with C: Drive Projection */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
            <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">1. Current Workspace</div>
            <div className="text-lg font-black font-mono text-white mt-1">
              {formatBytes(totalScannedBytes)}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{totalScannedFiles.length} Total files scanned</div>
          </div>

          <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-500/40">
            <div className="text-[10px] uppercase font-mono tracking-wider text-rose-400 flex items-center justify-between">
              <span>2. Storage Gained</span>
              <span className="text-[9px] bg-rose-500/20 px-1.5 py-0.2 rounded text-rose-300 font-bold">Recycled</span>
            </div>
            <div className="text-lg font-black font-mono text-emerald-400 mt-1">
              +{formatBytes(storageGainBytes)}
            </div>
            <div className="text-[11px] text-rose-300/80 mt-0.5">-{selectedFiles.length} cleanup files removed</div>
          </div>

          <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-500/30">
            <div className="text-[10px] uppercase font-mono tracking-wider text-cyan-400">3. Net Post-Cleanup Size</div>
            <div className="text-lg font-black font-mono text-white mt-1">
              {formatBytes(postCleanupBytes)}
            </div>
            <div className="text-[11px] text-cyan-300/80 mt-0.5">{postCleanupCount} Clean organized catalog</div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-500/30">
            <div className="text-[10px] uppercase font-mono tracking-wider text-indigo-400 flex items-center justify-between">
              <span>4. Local Disk (C:) Free</span>
              <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-lg font-black font-mono text-white mt-1">
              {(192.6 + (storageGainBytes / (1024 * 1024 * 1024))).toFixed(1)} GB
            </div>
            <div className="text-[11px] text-emerald-400/90 mt-0.5">
              From 192.6 GB (+{formatBytes(storageGainBytes)})
            </div>
          </div>
        </div>

        {/* Segmented Reclaim Bar */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">Storage Distribution (Current Selection):</span>
            <span className="text-emerald-400 font-bold">
              {storageGainPercentOfTotal}% Storage Reclaimed
            </span>
          </div>

          <div className="w-full h-3 rounded-lg bg-slate-950 border border-slate-800 flex overflow-hidden p-0.5">
            {categoryData.map(cat => {
              if (cat.bytes <= 0 || totalScannedBytes <= 0) return null;
              const widthPct = Math.max(1, (cat.bytes / totalScannedBytes) * 100);
              return (
                <div
                  key={cat.key}
                  title={`${cat.name}: ${cat.formattedSize} (${cat.count} files)`}
                  className="h-full rounded-sm transition-all duration-300"
                  style={{
                    width: `${widthPct}%`,
                    backgroundColor: cat.color,
                    marginRight: '2px'
                  }}
                />
              );
            })}
            <div 
              title={`Retained files: ${formatBytes(postCleanupBytes)}`}
              className="h-full rounded-sm bg-slate-800/80 flex-1"
            />
          </div>

          {/* Segment Legend */}
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono pt-1 text-slate-400">
            {categoryData.map(cat => (
              <div key={cat.key} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-slate-300">{cat.name}:</span>
                <span className="text-white font-bold">{cat.formattedSize}</span>
                <span className="text-slate-500">({cat.count})</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="w-2 h-2 rounded-full bg-slate-700" />
              <span className="text-slate-400">Retained:</span>
              <span className="text-slate-200 font-bold">{formatBytes(postCleanupBytes)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recharts Visualizer: Storage Gain by Category & Proportion Donut */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart: Storage Gain by Category */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#090D16] border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Reclaimable Storage by Category
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400">Values in Megabytes (MB)</span>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <XAxis 
                  dataKey="name" 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 11, fontFamily: 'monospace' }}
                  interval={0}
                />
                <YAxis 
                  stroke="#64748B" 
                  tick={{ fill: '#94A3B8', fontSize: 10, fontFamily: 'monospace' }}
                  unit=" MB"
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 shadow-2xl text-xs space-y-1">
                          <div className="font-bold text-white flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: data.color }} />
                            <span>{data.name}</span>
                          </div>
                          <div className="text-slate-400 flex justify-between gap-4 font-mono">
                            <span>Selected Gain:</span>
                            <span className="text-emerald-400 font-bold">{data.formattedSize}</span>
                          </div>
                          <div className="text-slate-400 flex justify-between gap-4 font-mono">
                            <span>Selected Files:</span>
                            <span className="text-white font-bold">{data.count} of {data.totalCount}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }} 
                />
                <Bar dataKey="sizeMB" radius={[6, 6, 0, 0]}>
                  {categoryData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.color} 
                      className="transition-all duration-300 hover:opacity-80"
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Donut Chart: Reclaimed vs. Retained */}
        <div className="p-5 rounded-2xl bg-[#090D16] border border-slate-800 shadow-xl flex flex-col justify-between space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-black uppercase tracking-wider text-white">
                Storage Impact Ratio
              </h4>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
              +{storageGainPercentOfTotal}% Freed
            </span>
          </div>

          <div className="relative h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={68}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`donut-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-700 shadow-xl text-xs font-mono">
                          <div className="text-white font-bold">{data.name}</div>
                          <div className="text-emerald-400 font-bold mt-0.5">{data.formatted}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Donut Center text */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <div className="text-base font-black font-mono text-emerald-400">
                +{formatBytes(storageGainBytes)}
              </div>
              <div className="text-[10px] uppercase font-mono text-slate-400">Gain</div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800 text-xs font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-300">
                <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
                <span>Reclaimable Gain:</span>
              </div>
              <span className="font-bold text-emerald-400">{formatBytes(storageGainBytes)}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded bg-slate-800" />
                <span>Retained Storage:</span>
              </div>
              <span className="font-bold text-slate-300">{formatBytes(postCleanupBytes)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
