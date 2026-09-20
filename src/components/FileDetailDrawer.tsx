import React, { useState } from 'react';
import { 
  X, 
  ShieldAlert, 
  ShieldCheck, 
  ExternalLink, 
  Check, 
  Hash, 
  FileText, 
  Clock, 
  HardDrive, 
  Layers, 
  Globe, 
  Cpu,
  Cloud,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { FileRecord, Taxonomy } from '../types';

interface FileDetailDrawerProps {
  file: FileRecord | null;
  onClose: () => void;
  onAccept: (fileId: string) => void;
  onRecategorize: (fileId: string, targetGroupId: string, targetCategoryId: string) => void;
  taxonomy: Taxonomy;
  onAzureAIAnalyzeFile?: (fileId: string) => Promise<void>;
}

export const FileDetailDrawer: React.FC<FileDetailDrawerProps> = ({
  file,
  onClose,
  onAccept,
  onRecategorize,
  taxonomy,
  onAzureAIAnalyzeFile
}) => {
  const [analyzingWithAI, setAnalyzingWithAI] = useState(false);
  if (!file) return null;

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formattedDate = new Date(file.modified).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[460px] bg-[#0C1019] border-l border-slate-800 shadow-2xl flex flex-col text-slate-200">
      {/* Drawer Header */}
      <div className="p-5 border-b border-slate-800/80 bg-[#0F1420] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs"
            style={{ 
              backgroundColor: `${file.targetGroupColor}20`,
              color: file.targetGroupColor,
              border: `1px solid ${file.targetGroupColor}40`
            }}
          >
            {file.extension ? file.extension.replace('.', '').toUpperCase().slice(0, 3) : 'DOC'}
          </div>
          <div>
            <h3 className="text-sm font-bold text-white truncate max-w-[260px]">{file.name}</h3>
            <span className="text-[11px] font-mono text-slate-400">{formatBytes(file.size)}</span>
          </div>
        </div>

        <button 
          onClick={onClose}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6 text-xs">
        {/* OS Protected Safety Warning */}
        {file.systemProtected && (
          <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-500/40 text-cyan-200 space-y-2">
            <div className="flex items-center gap-2 font-bold text-white text-xs">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Windows OS Core File · Strictly Locked</span>
            </div>
            <p className="text-[11px] text-cyan-200/90 leading-relaxed font-sans">
              This file resides within Windows system directories (<span className="font-mono text-white">C:\Windows</span>) or core virtual memory allocations. Non-destructive safety policies strictly lock this file against deletion, staging, or relocation.
            </p>
          </div>
        )}

        {/* Azure AI Inference Highlight */}
        {file.matchEngine === 'ai_analysis' && (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/80 to-cyan-950/80 border border-cyan-500/50 flex items-center justify-between text-xs shadow-md shadow-cyan-950/40">
            <div className="flex items-center gap-2 text-cyan-200 font-bold">
              <Cloud className="w-4 h-4 text-cyan-400" />
              <span>Azure AI Inference Active</span>
            </div>
            <span className="font-mono text-[10px] text-cyan-200 bg-cyan-900/60 px-2.5 py-0.5 rounded border border-cyan-500/40">
              {file.aiModel || 'gpt-4o-mini'}
            </span>
          </div>
        )}

        {/* Destination & Confidence Block */}
        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Proposed Destination
          </div>
          <div className="flex items-center gap-2">
            <span 
              className="px-2.5 py-1 rounded-md text-xs font-bold"
              style={{
                backgroundColor: `${file.targetGroupColor}20`,
                color: file.targetGroupColor,
                border: `1px solid ${file.targetGroupColor}40`
              }}
            >
              {file.targetGroupName}
            </span>
            <span className="text-slate-500 font-bold">&gt;</span>
            <span className="font-bold text-white text-xs">{file.targetCategoryName}</span>
          </div>

          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Classification Confidence</span>
            <div className="flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className={`h-full ${file.confidence >= 0.85 ? 'bg-emerald-400' : file.confidence >= 0.70 ? 'bg-cyan-400' : 'bg-amber-400'}`}
                  style={{ width: `${Math.round(file.confidence * 100)}%` }}
                ></div>
              </div>
              <span className="font-mono font-bold text-white">{Math.round(file.confidence * 100)}%</span>
            </div>
          </div>
        </div>

        {/* WHY THIS CATEGORY Section */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold flex items-center justify-between">
            <span>Why This Category?</span>
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] text-cyan-400 font-normal">Method: {file.matchEngine.replace('_', ' ').toUpperCase()}</span>
              {onAzureAIAnalyzeFile && !file.systemProtected && (
                <button
                  onClick={async () => {
                    setAnalyzingWithAI(true);
                    try {
                      await onAzureAIAnalyzeFile(file.id);
                    } finally {
                      setAnalyzingWithAI(false);
                    }
                  }}
                  disabled={analyzingWithAI}
                  className="flex items-center gap-1.5 px-2 py-0.5 rounded-lg bg-blue-950/80 hover:bg-blue-900 border border-cyan-500/40 text-cyan-300 text-[10px] font-bold cursor-pointer transition-all"
                  title="Run Azure AI analysis on this file"
                >
                  {analyzingWithAI ? (
                    <RefreshCw className="w-3 h-3 animate-spin text-cyan-300" />
                  ) : (
                    <Cloud className="w-3 h-3 text-cyan-400" />
                  )}
                  <span>{analyzingWithAI ? 'Analyzing...' : 'Ask Azure AI'}</span>
                </button>
              )}
            </div>
          </div>

          <div className={`p-4 rounded-xl border leading-relaxed ${
            file.sensitive 
              ? 'bg-amber-950/20 border-amber-800/40 text-amber-200' 
              : 'bg-slate-900/60 border-slate-800 text-slate-300'
          }`}>
            <p className="text-xs">{file.whyExplanation}</p>

            {file.sensitive && (
              <div className="mt-2.5 flex items-center gap-1.5 text-[11px] font-semibold text-amber-400">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Strict Security Guard: Never opened read-only.</span>
              </div>
            )}
          </div>
        </div>

        {/* Matched Signals */}
        {file.matchedSignals && file.matchedSignals.length > 0 && (
          <div className="space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
              Matched Evidence Signals
            </div>
            <div className="flex flex-wrap gap-1.5">
              {file.matchedSignals.map((signal, idx) => (
                <span 
                  key={idx}
                  className="px-2 py-0.8 rounded-md text-[11px] font-mono bg-slate-800 border border-slate-700 text-cyan-300"
                >
                  {signal}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Technical Metadata */}
        <div className="space-y-2">
          <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
            Technical Metadata
          </div>
          <div className="rounded-xl bg-slate-900/80 border border-slate-800 divide-y divide-slate-800/60 font-mono text-[11px]">
            <div className="px-3.5 py-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <HardDrive className="w-3 h-3 text-cyan-400" />
                Drive Volume
              </span>
              <span className="text-cyan-300 font-semibold">{file.drive ? `Local Disk (${file.drive})` : 'Local Disk (C:)'} (NTFS)</span>
            </div>
            <div className="px-3.5 py-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <FileText className="w-3 h-3 text-slate-500" />
                File Path
              </span>
              <span className="text-slate-300 truncate max-w-[240px]" title={file.path}>{file.path || file.relativePath}</span>
            </div>
            <div className="px-3.5 py-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <HardDrive className="w-3 h-3 text-slate-500" />
                Exact Size
              </span>
              <span className="text-slate-300">{file.size.toLocaleString()} bytes</span>
            </div>
            <div className="px-3.5 py-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <Clock className="w-3 h-3 text-slate-500" />
                Modified
              </span>
              <span className="text-slate-300">{formattedDate}</span>
            </div>
            <div className="px-3.5 py-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <Layers className="w-3 h-3 text-slate-500" />
                Rule Identifier
              </span>
              <span className="text-cyan-400 font-bold">{file.ruleIdentifier}</span>
            </div>
            <div className="px-3.5 py-2 flex justify-between items-center">
              <span className="text-slate-400 flex items-center gap-1.5 font-sans">
                <Hash className="w-3 h-3 text-slate-500" />
                Safety Hash
              </span>
              <span className="text-slate-400">{file.safetyHash}</span>
            </div>
          </div>
        </div>

        {/* Re-categorize Select */}
        <div className="space-y-2 pt-2">
          <label className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold block">
            Manual Override / Move To
          </label>
          {file.systemProtected ? (
            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center justify-between">
              <span>Locked: Windows OS core files cannot be relocated</span>
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
            </div>
          ) : (
            <select
              value={`${file.targetGroupId}:${file.targetCategoryId}`}
              onChange={(e) => {
                const [gid, cid] = e.target.value.split(':');
                onRecategorize(file.id, gid, cid);
              }}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
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
          )}
        </div>
      </div>

      {/* Drawer Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-[#0F1420] flex items-center gap-2">
        <button
          onClick={() => {
            onAccept(file.id);
            onClose();
          }}
          className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>Accept Classification</span>
        </button>
      </div>
    </div>
  );
};
