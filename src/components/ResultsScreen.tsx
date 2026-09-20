import React, { useState, useMemo } from 'react';
import { 
  Layers, 
  Search, 
  FileText, 
  CheckSquare, 
  ArrowRight, 
  ShieldAlert, 
  Copy, 
  Cpu, 
  Globe, 
  FileCode, 
  FileSpreadsheet, 
  FileImage, 
  Archive, 
  Terminal,
  Filter,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Trash2,
  HardDrive,
  ShieldCheck,
  Folder,
  Cloud,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { FileRecord, Taxonomy, MatchEngine, AIProviderStatus } from '../types';
import { FileDetailDrawer } from './FileDetailDrawer';

interface ResultsScreenProps {
  files: FileRecord[];
  taxonomy: Taxonomy;
  onSelectFileForDetail: (file: FileRecord) => void;
  selectedFile: FileRecord | null;
  onCloseDrawer: () => void;
  onAcceptClassification: (fileId: string) => void;
  onRecategorize: (fileId: string, groupId: string, catId: string) => void;
  onNavigateToReview: () => void;
  onNavigateToOrganize: () => void;
  onNavigateToCleanup?: () => void;
  searchQuery: string;
  aiStatus?: AIProviderStatus | null;
  onAzureAIBatchAnalyze?: () => Promise<void>;
  onAzureAIAnalyzeFile?: (fileId: string) => Promise<void>;
  isAiAnalyzing?: boolean;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  files,
  taxonomy,
  selectedFile,
  onSelectFileForDetail,
  onCloseDrawer,
  onAcceptClassification,
  onRecategorize,
  onNavigateToReview,
  onNavigateToOrganize,
  onNavigateToCleanup,
  searchQuery,
  aiStatus,
  onAzureAIBatchAnalyze,
  onAzureAIAnalyzeFile,
  isAiAnalyzing
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState<string>('all');
  const [selectedEngine, setSelectedEngine] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [filterSensitiveOnly, setFilterSensitiveOnly] = useState(false);
  const [filterReviewOnly, setFilterReviewOnly] = useState(false);
  
  // Pagination / chunking for 50,000+ files
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 50;

  // Aggregate metrics
  const metrics = useMemo(() => {
    const total = files.length;
    const nameCount = files.filter(f => f.matchEngine === 'name_rule').length;
    const contentCount = files.filter(f => f.matchEngine === 'content_check').length;
    const webCount = files.filter(f => f.matchEngine === 'web_lookup').length;
    const aiCount = files.filter(f => f.matchEngine === 'ai_analysis').length;
    const reviewCount = files.filter(f => f.needsReview).length;
    const duplicateCount = files.filter(f => f.isDuplicate).length;
    const sensitiveCount = files.filter(f => f.sensitive).length;
    const osProtectedCount = files.filter(f => f.systemProtected).length;

    return {
      total,
      nameCount,
      namePct: total ? ((nameCount / total) * 100).toFixed(1) : '0',
      contentCount,
      contentPct: total ? ((contentCount / total) * 100).toFixed(1) : '0',
      webCount,
      webPct: total ? ((webCount / total) * 100).toFixed(1) : '0',
      aiCount,
      aiPct: total ? ((aiCount / total) * 100).toFixed(1) : '0',
      reviewCount,
      duplicateCount,
      sensitiveCount,
      osProtectedCount
    };
  }, [files]);

  // Group counts
  const groupCounts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const f of files) {
      map[f.targetGroupId] = (map[f.targetGroupId] || 0) + 1;
    }
    return map;
  }, [files]);

  // Filtered files
  const filteredFiles = useMemo(() => {
    return files.filter(f => {
      if (selectedGroupId !== 'all' && f.targetGroupId !== selectedGroupId) return false;
      if (selectedEngine !== 'all' && f.matchEngine !== selectedEngine) return false;
      if (filterSensitiveOnly && !f.sensitive) return false;
      if (filterReviewOnly && !f.needsReview) return false;

      // Sector filter for whole C: drive
      if (selectedSector !== 'all') {
        const p = (f.folderLocation || f.path || '').toLowerCase();
        if (selectedSector === 'downloads' && !p.includes('downloads')) return false;
        if (selectedSector === 'documents' && !p.includes('documents')) return false;
        if (selectedSector === 'desktop' && !p.includes('desktop')) return false;
        if (selectedSector === 'temp' && !p.includes('temp')) return false;
        if (selectedSector === 'repos' && !p.includes('repos') && !p.includes('source') && !p.includes('.ssh')) return false;
        if (selectedSector === 'protected' && !f.systemProtected) return false;
      }

      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesName = f.name.toLowerCase().includes(q);
        const matchesCat = f.targetCategoryName.toLowerCase().includes(q);
        const matchesGroup = f.targetGroupName.toLowerCase().includes(q);
        const matchesEngine = f.matchEngine.toLowerCase().includes(q);
        const matchesPath = (f.path || '').toLowerCase().includes(q);
        if (!matchesName && !matchesCat && !matchesGroup && !matchesEngine && !matchesPath) return false;
      }

      return true;
    });
  }, [files, selectedGroupId, selectedEngine, selectedSector, filterSensitiveOnly, filterReviewOnly, searchQuery]);

  // Paged files
  const totalPages = Math.ceil(filteredFiles.length / pageSize) || 1;
  const pagedFiles = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredFiles.slice(start, start + pageSize);
  }, [filteredFiles, currentPage, pageSize]);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getFileIcon = (ext: string, sensitive: boolean) => {
    if (sensitive) return <ShieldAlert className="w-4 h-4 text-amber-400" />;
    const cleanExt = ext.toLowerCase();
    if (['.ts', '.tsx', '.js', '.py', '.sh'].includes(cleanExt)) return <FileCode className="w-4 h-4 text-purple-400" />;
    if (['.xlsx', '.csv', '.parquet'].includes(cleanExt)) return <FileSpreadsheet className="w-4 h-4 text-cyan-400" />;
    if (['.png', '.jpg', '.svg', '.sketch'].includes(cleanExt)) return <FileImage className="w-4 h-4 text-pink-400" />;
    if (['.zip', '.tar', '.gz', '.dmg'].includes(cleanExt)) return <Archive className="w-4 h-4 text-amber-400" />;
    return <FileText className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Summary Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-white tracking-tight">Classification Results</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              {files.length.toLocaleString()} Files
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Entire computer classification completed across Local Disk (C:). Review ambiguous items or proceed directly to Organize.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onAzureAIBatchAnalyze && (
            <button
              onClick={onAzureAIBatchAnalyze}
              disabled={isAiAnalyzing || metrics.reviewCount === 0}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-700 via-indigo-700 to-cyan-600 hover:from-blue-600 hover:to-cyan-500 disabled:opacity-50 text-white text-xs font-bold shadow-lg shadow-cyan-950/40 border border-cyan-400/40 transition-all cursor-pointer"
              title="Run Azure AI deep classification on ambiguous items"
            >
              {isAiAnalyzing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-300" />
                  <span>Azure AI Analyzing...</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Azure AI Analyze ({metrics.reviewCount})</span>
                  <Sparkles className="w-3 h-3 text-cyan-200" />
                </>
              )}
            </button>
          )}

          <button
            onClick={onNavigateToReview}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer"
          >
            <CheckSquare className="w-4 h-4" />
            <span>Review Queue ({metrics.reviewCount})</span>
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

      {/* Hard Drive System Context Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0C1322] to-cyan-950/40 border border-cyan-800/40 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-black text-cyan-300 uppercase tracking-wider">Storage Target</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-200 border border-cyan-500/40">
                This Computer · Local Disk (C:)
              </span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" />
                OS Guard Enforced ({metrics.osProtectedCount} Locked)
              </span>
            </div>
            <div className="text-xs text-slate-300 font-sans mt-1">
              Classifying root filesystem <span className="font-mono text-white font-semibold">C:\</span> (476.8 GB NVMe SSD) · 192.6 GB Free · Core system files protected from moves
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] font-mono text-slate-400">Sectors Scanned:</span>
          <span className="px-2 py-1 rounded bg-slate-800/90 text-cyan-300 text-[11px] font-mono border border-slate-700">
            C:\Users\Admin
          </span>
          <span className="px-2 py-1 rounded bg-slate-800/90 text-purple-300 text-[11px] font-mono border border-slate-700">
            C:\Windows\Temp
          </span>
          <span className="px-2 py-1 rounded bg-slate-800/90 text-emerald-300 text-[11px] font-mono border border-slate-700">
            C:\Windows\System32
          </span>
        </div>
      </div>

      {/* Top 8 Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {/* Total Files */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Total Files</div>
          <div className="text-lg font-black font-mono text-white mt-1">{metrics.total.toLocaleString()}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Indexed catalog</div>
        </div>

        {/* Sorted by Name */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-blue-400">Sorted by Name</div>
          <div className="text-lg font-black font-mono text-white mt-1">{metrics.nameCount.toLocaleString()}</div>
          <div className="text-[10px] text-blue-400/80 font-mono mt-0.5">{metrics.namePct}% matched</div>
        </div>

        {/* Content Check */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-purple-400">Content Check</div>
          <div className="text-lg font-black font-mono text-white mt-1">{metrics.contentCount.toLocaleString()}</div>
          <div className="text-[10px] text-purple-400/80 font-mono mt-0.5">{metrics.contentPct}% read-only</div>
        </div>

        {/* Web Lookup */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-cyan-400">Web Lookup</div>
          <div className="text-lg font-black font-mono text-white mt-1">{metrics.webCount.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">{metrics.webPct}% registry</div>
        </div>

        {/* Azure AI Analysis Card */}
        <div 
          onClick={() => setSelectedEngine(selectedEngine === 'ai_analysis' ? 'all' : 'ai_analysis')}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            selectedEngine === 'ai_analysis'
              ? 'bg-cyan-500/20 border-cyan-400 shadow-md shadow-cyan-500/30'
              : 'bg-slate-900/90 border-slate-800 hover:border-cyan-500/40'
          }`}
          title="Click to filter by Azure AI classified files"
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-cyan-300 flex items-center gap-1">
            <Cloud className="w-3 h-3 text-cyan-400" />
            <span>Azure AI</span>
          </div>
          <div className="text-lg font-black font-mono text-cyan-200 mt-1">{metrics.aiCount.toLocaleString()}</div>
          <div className="text-[10px] text-cyan-400/80 font-mono mt-0.5">{metrics.aiPct}% resolved</div>
        </div>

        {/* Need Review */}
        <div 
          onClick={() => setFilterReviewOnly(!filterReviewOnly)}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterReviewOnly 
              ? 'bg-amber-500/20 border-amber-500 shadow-md shadow-amber-500/20' 
              : 'bg-slate-900/90 border-slate-800 hover:border-amber-500/40'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-amber-400">Need Review</div>
          <div className="text-lg font-black font-mono text-amber-300 mt-1">{metrics.reviewCount}</div>
          <div className="text-[10px] text-amber-400/80 mt-0.5">Click to filter</div>
        </div>

        {/* Duplicates */}
        <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
          <div className="text-[10px] uppercase tracking-wider font-semibold text-slate-400">Duplicates</div>
          <div className="text-lg font-black font-mono text-slate-200 mt-1">{metrics.duplicateCount}</div>
          <div className="text-[10px] text-slate-500 mt-0.5">~420 MB dup</div>
        </div>

        {/* Sensitive */}
        <div 
          onClick={() => setFilterSensitiveOnly(!filterSensitiveOnly)}
          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
            filterSensitiveOnly 
              ? 'bg-rose-500/20 border-rose-500 shadow-md shadow-rose-500/20' 
              : 'bg-slate-900/90 border-slate-800 hover:border-rose-500/40'
          }`}
        >
          <div className="text-[10px] uppercase tracking-wider font-semibold text-rose-400">Sensitive</div>
          <div className="text-lg font-black font-mono text-rose-300 mt-1">{metrics.sensitiveCount}</div>
          <div className="text-[10px] text-rose-400/80 mt-0.5">Never opened</div>
        </div>
      </div>

      {/* Cleanup / Staging Recommendation Banner */}
      {files.some(f => f.cleanupCandidate || f.targetGroupId === 'temp_junk' || f.isDuplicate || f.extension === '.crdownload') && onNavigateToCleanup && (
        <div className="p-3.5 rounded-xl bg-gradient-to-r from-rose-950/30 via-slate-900 to-slate-900 border border-rose-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white">Recommended for Cleanup & Staging:</span>{' '}
              <span className="text-slate-300">
                Sorter detected candidate temporary files, incomplete downloads, and stale disk installers.
              </span>
            </div>
          </div>

          <button
            onClick={onNavigateToCleanup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600/30 hover:bg-rose-600/40 text-rose-200 border border-rose-500/40 font-bold transition-all shrink-0 cursor-pointer self-end sm:self-auto"
          >
            <span>Review Cleanup & Quarantine</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Hard Drive Sector / Location Filter Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            Filter by C: Drive Sector
          </span>
          <span className="font-mono text-[11px] text-cyan-400/80">Active Sector: {selectedSector.toUpperCase()}</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {[
            { id: 'all', label: 'All C: Drive Sectors', count: files.length },
            { id: 'downloads', label: 'Downloads (C:\\Users\\...\\Downloads)', count: files.filter(f => (f.path||'').toLowerCase().includes('downloads')).length },
            { id: 'documents', label: 'Documents (C:\\Users\\...\\Documents)', count: files.filter(f => (f.path||'').toLowerCase().includes('documents')).length },
            { id: 'desktop', label: 'Desktop (C:\\Users\\...\\Desktop)', count: files.filter(f => (f.path||'').toLowerCase().includes('desktop')).length },
            { id: 'temp', label: 'Temp Files (Windows & AppData)', count: files.filter(f => (f.path||'').toLowerCase().includes('temp')).length },
            { id: 'repos', label: 'Code & Repos (source\\repos)', count: files.filter(f => (f.path||'').toLowerCase().includes('repos') || (f.path||'').toLowerCase().includes('source')).length },
            { id: 'protected', label: 'OS Core Protected (Windows)', count: files.filter(f => f.systemProtected).length }
          ].map(sector => (
            <button
              key={sector.id}
              onClick={() => setSelectedSector(sector.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                selectedSector === sector.id
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold border-cyan-400 shadow-md shadow-cyan-600/30'
                  : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-800'
              }`}
            >
              <span>{sector.label}</span>
              <span className={`text-[10px] font-mono px-1 rounded ${selectedSector === sector.id ? 'bg-black/30 text-white' : 'text-slate-400'}`}>
                {sector.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 11 Classification Group Filter Chips */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 font-semibold uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-cyan-400" />
            Filter by Taxonomy Group
          </span>
          <span>Showing {filteredFiles.length} of {files.length} items</span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedGroupId('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              selectedGroupId === 'all'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'bg-slate-900/80 hover:bg-slate-800 text-slate-300 border border-slate-800'
            }`}
          >
            All Groups ({files.length})
          </button>

          {taxonomy.groups.map(group => {
            const count = groupCounts[group.id] || 0;
            const isSelected = selectedGroupId === group.id;
            return (
              <button
                key={group.id}
                onClick={() => setSelectedGroupId(group.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                  isSelected
                    ? 'shadow-md text-white font-bold'
                    : 'bg-slate-900/70 hover:bg-slate-800 text-slate-300 border-slate-800/80'
                }`}
                style={isSelected ? {
                  backgroundColor: group.color,
                  borderColor: group.color,
                  boxShadow: `0 4px 14px ${group.color}40`
                } : {}}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: group.color }}></span>
                <span>{group.name}</span>
                <span className={`text-[10px] font-mono px-1 rounded ${isSelected ? 'bg-black/30 text-white' : 'text-slate-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Engine & Quick Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Engine:</span>
          {(['all', 'name_rule', 'content_check', 'web_lookup', 'ignored'] as const).map(eng => (
            <button
              key={eng}
              onClick={() => setSelectedEngine(eng)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                selectedEngine === eng
                  ? 'bg-slate-700 text-white font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {eng === 'all' ? 'All Engines' : eng.replace('_', ' ').toUpperCase()}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterSensitiveOnly}
              onChange={(e) => setFilterSensitiveOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-rose-500 focus:ring-0"
            />
            <span>Sensitive Only</span>
          </label>
          <span className="text-slate-600">|</span>
          <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={filterReviewOnly}
              onChange={(e) => setFilterReviewOnly(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0"
            />
            <span>Needs Review Only</span>
          </label>
        </div>
      </div>

      {/* Files Table */}
      <div className="rounded-2xl bg-[#090D15] border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#0D121D] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              <tr>
                <th className="py-3 px-4">File Name</th>
                <th className="py-3 px-4">Target Category</th>
                <th className="py-3 px-4">Match Engine</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Size</th>
                <th className="py-3 px-4">Flags</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {pagedFiles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500 italic">
                    No files match the active filters or search query.
                  </td>
                </tr>
              ) : (
                pagedFiles.map((file) => {
                  const isSelected = selectedFile?.id === file.id;
                  return (
                    <tr
                      key={file.id}
                      onClick={() => onSelectFileForDetail(file)}
                      className={`transition-colors cursor-pointer group ${
                        isSelected 
                          ? 'bg-cyan-950/30 text-white' 
                          : 'hover:bg-slate-800/50 text-slate-300'
                      }`}
                    >
                      {/* Name & Sector Path */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-200">
                        <div className="flex items-start gap-2.5">
                          <div className="mt-0.5 shrink-0">
                            {getFileIcon(file.extension, file.sensitive)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="truncate max-w-[260px] font-bold text-white" title={file.name}>
                                {file.name}
                              </span>
                              {file.systemProtected && (
                                <span className="px-1.5 py-0.5 rounded text-[9px] font-sans font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shrink-0">
                                  OS LOCKED
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[320px] mt-0.5" title={file.path}>
                              {file.path || file.folderLocation}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Target Category */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <span 
                            className="w-2 h-2 rounded-full shrink-0"
                            style={{ backgroundColor: file.targetGroupColor }}
                          ></span>
                          <span className="font-semibold text-slate-200">
                            {file.targetCategoryName}
                          </span>
                          <span className="text-[10px] text-slate-500 hidden xl:inline">
                            ({file.targetGroupName})
                          </span>
                        </div>
                      </td>

                      {/* Engine */}
                      <td className="py-3 px-4">
                        {file.matchEngine === 'ai_analysis' ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 inline-flex items-center gap-1">
                            <Cloud className="w-3 h-3 text-cyan-400" />
                            AZURE AI
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                            file.matchEngine === 'content_check'
                              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                              : file.matchEngine === 'web_lookup'
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                              : file.matchEngine === 'ignored'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                          }`}>
                            {file.matchEngine.replace('_', ' ').toUpperCase()}
                          </span>
                        )}
                      </td>

                      {/* Confidence */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-14 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div 
                              className={`h-full ${
                                file.confidence >= 0.85 
                                  ? 'bg-emerald-400' 
                                  : file.confidence >= 0.70 
                                  ? 'bg-cyan-400' 
                                  : 'bg-amber-400'
                              }`}
                              style={{ width: `${Math.round(file.confidence * 100)}%` }}
                            ></div>
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-300">
                            {Math.round(file.confidence * 100)}%
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                        {formatBytes(file.size)}
                      </td>

                      {/* Flags */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {file.systemProtected && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                              OS Guard
                            </span>
                          )}
                          {file.sensitive && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              Sensitive
                            </span>
                          )}
                          {file.needsReview && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              Review
                            </span>
                          )}
                          {file.cleanupCandidate && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                              Cleanup
                            </span>
                          )}
                          {!file.systemProtected && !file.sensitive && !file.needsReview && !file.cleanupCandidate && (
                            <span className="text-slate-600 text-[10px]">—</span>
                          )}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3 px-4 text-right">
                        <span className="text-[11px] font-semibold text-cyan-400 group-hover:underline">
                          Inspect &gt;
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-[#0D121D] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div>
            Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredFiles.length)} of {filteredFiles.length} files
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-mono text-xs font-bold text-white px-2">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-out detail drawer */}
      <FileDetailDrawer
        file={selectedFile}
        onClose={onCloseDrawer}
        onAccept={onAcceptClassification}
        onRecategorize={onRecategorize}
        taxonomy={taxonomy}
        onAzureAIAnalyzeFile={onAzureAIAnalyzeFile}
      />
    </div>
  );
};
