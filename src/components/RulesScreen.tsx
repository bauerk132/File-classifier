import React, { useState } from 'react';
import { 
  Sliders, 
  Layers, 
  EyeOff, 
  Settings, 
  Plus, 
  Trash2, 
  Download, 
  Upload, 
  RotateCcw, 
  Check, 
  ShieldCheck, 
  Search, 
  Sparkles,
  FileCode,
  Tag,
  AlertCircle
} from 'lucide-react';
import { Taxonomy, TaxonomyGroup, TaxonomyCategory, IgnoreRule } from '../types';
import { classifyFile } from '../utils/classifier';

interface RulesScreenProps {
  taxonomy: Taxonomy;
  onUpdateTaxonomy: (newTaxonomy: Taxonomy) => void;
  onResetToDefault: () => void;
}

export const RulesScreen: React.FC<RulesScreenProps> = ({
  taxonomy,
  onUpdateTaxonomy,
  onResetToDefault
}) => {
  const [activeTab, setActiveTab] = useState<'categories' | 'ignore' | 'lookup'>('categories');
  const [selectedGroupId, setSelectedGroupId] = useState<string>(taxonomy.groups[0]?.id || 'documents');
  
  // Test simulator state
  const [testFileName, setTestFileName] = useState('notes_draft.md');
  const [testSampleContent, setTestSampleContent] = useState('kosher salt, olive oil, prep time: 25m, yield: 4 portions');

  // Add category modal
  const [showAddCatModal, setShowAddCatModal] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatExts, setNewCatExts] = useState('');
  const [newCatPatterns, setNewCatPatterns] = useState('');
  const [newCatPriority, setNewCatPriority] = useState(50);

  // Add ignore rule modal
  const [showAddIgnoreModal, setShowAddIgnoreModal] = useState(false);
  const [newIgnorePattern, setNewIgnorePattern] = useState('');
  const [newIgnoreScope, setNewIgnoreScope] = useState<'both' | 'file' | 'folder'>('both');
  const [newIgnoreReason, setNewIgnoreReason] = useState('');

  // Live test result computation
  const testResult = React.useMemo(() => {
    const syntheticFile = {
      id: 'test-sim',
      name: testFileName,
      path: `/Users/Test/${testFileName}`,
      relativePath: testFileName,
      size: 4096,
      modified: Date.now(),
      sampleContent: testSampleContent
    };
    return classifyFile(syntheticFile, taxonomy, true, true);
  }, [testFileName, testSampleContent, taxonomy]);

  const activeGroup = taxonomy.groups.find(g => g.id === selectedGroupId) || taxonomy.groups[0];

  const handleAddCategory = () => {
    if (!newCatName.trim()) return;

    const newCategory: TaxonomyCategory = {
      id: `cat-${Date.now()}`,
      name: newCatName.trim(),
      priority: Number(newCatPriority),
      extensions: newCatExts.split(',').map(e => e.trim().toLowerCase()).filter(Boolean),
      name_patterns: newCatPatterns.split(',').map(p => p.trim()).filter(Boolean),
      folder_hints: [newCatName.toLowerCase().replace(/[^a-z0-9]/g, '-')]
    };

    const updatedGroups = taxonomy.groups.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          categories: [...g.categories, newCategory]
        };
      }
      return g;
    });

    onUpdateTaxonomy({ ...taxonomy, groups: updatedGroups });
    setShowAddCatModal(false);
    setNewCatName('');
    setNewCatExts('');
    setNewCatPatterns('');
  };

  const handleDeleteCategory = (catId: string) => {
    if (!confirm('Are you sure you want to remove this category?')) return;
    const updatedGroups = taxonomy.groups.map(g => {
      if (g.id === selectedGroupId) {
        return {
          ...g,
          categories: g.categories.filter(c => c.id !== catId)
        };
      }
      return g;
    });
    onUpdateTaxonomy({ ...taxonomy, groups: updatedGroups });
  };

  const handleAddIgnoreRule = () => {
    if (!newIgnorePattern.trim()) return;
    const newRule: IgnoreRule = {
      id: `ign-${Date.now()}`,
      pattern: newIgnorePattern.trim(),
      scope: newIgnoreScope,
      description: newIgnoreReason.trim() || 'Custom user exclusion rule',
      reason: newIgnoreReason.trim() || 'Custom user exclusion rule',
      enabled: true
    };
    onUpdateTaxonomy({
      ...taxonomy,
      ignore_rules: [...taxonomy.ignore_rules, newRule]
    });
    setShowAddIgnoreModal(false);
    setNewIgnorePattern('');
    setNewIgnoreReason('');
  };

  const handleDeleteIgnoreRule = (index: number) => {
    const updated = [...taxonomy.ignore_rules];
    updated.splice(index, 1);
    onUpdateTaxonomy({ ...taxonomy, ignore_rules: updated });
  };

  const handleExportTaxonomyJson = () => {
    const blob = new Blob([JSON.stringify(taxonomy, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'file-classifier-taxonomy.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTaxonomyJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.groups && parsed.ignore_rules) {
          onUpdateTaxonomy(parsed);
          alert('Taxonomy successfully loaded and applied!');
        } else {
          alert('Invalid taxonomy schema: must contain groups and ignore_rules.');
        }
      } catch (err: any) {
        alert('Failed to parse JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl font-black text-white tracking-tight">Classification Rules & Taxonomy</h1>
          <p className="text-xs text-slate-400 mt-1">
            Deterministic rules loaded from <code className="text-cyan-400 font-mono">file-classifier-taxonomy.json</code>. You can customize, import, or export anytime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportTaxonomyJson}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export JSON</span>
          </button>

          <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/40 text-xs font-semibold transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportTaxonomyJson} 
              className="hidden" 
            />
          </label>

          <button
            onClick={onResetToDefault}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            title="Reset rules to default taxonomy"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-1">
        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'categories'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Categories ({taxonomy.groups.reduce((acc, g) => acc + g.categories.length, 0)})</span>
        </button>

        <button
          onClick={() => setActiveTab('ignore')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'ignore'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <EyeOff className="w-4 h-4" />
          <span>Ignore Rules ({taxonomy.ignore_rules.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('lookup')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'lookup'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Resolution Policy & AI Settings</span>
        </button>
      </div>

      {/* TAB 1: CATEGORIES & LIVE SIMULATOR */}
      {activeTab === 'categories' && (
        <div className="space-y-6">
          {/* Live Diagnostic Simulator Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-[#0B101D] border border-cyan-500/30 space-y-3 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                Live Rule Engine Simulator (Test Any File Name)
              </span>
              <span className="text-[11px] font-mono text-cyan-400">Step-by-step diagnostic</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Test File Name</label>
                <input
                  type="text"
                  value={testFileName}
                  onChange={(e) => setTestFileName(e.target.value)}
                  placeholder="e.g. Sysco_Invoice_99214.pdf, .env.local, duck_recipe.md"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-mono text-slate-400 block mb-1">Simulated Sample Content (Read-only)</label>
                <input
                  type="text"
                  value={testSampleContent}
                  onChange={(e) => setTestSampleContent(e.target.value)}
                  placeholder="e.g. kosher salt, olive oil, prep time: 25m"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Diagnostic trace pill */}
            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs flex flex-wrap items-center justify-between gap-2 font-mono">
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Result:</span>
                <span className="font-bold text-white">{testResult.targetGroupName}</span>
                <span className="text-slate-500">&gt;</span>
                <span className="font-bold text-cyan-300">{testResult.targetCategoryName}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-slate-400">Engine: <strong className="text-purple-400">{testResult.matchEngine.toUpperCase()}</strong></span>
                <span className="text-slate-400">Confidence: <strong className="text-emerald-400">{Math.round(testResult.confidence * 100)}%</strong></span>
                {testResult.sensitive && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-rose-500/20 text-rose-300 font-bold border border-rose-500/40">
                    Sensitive Protected
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Group Selector & Category Table */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left sidebar: Groups */}
            <div className="lg:col-span-4 space-y-1.5">
              <div className="text-xs uppercase tracking-wider font-semibold text-slate-400 px-2 pb-1">
                Classification Groups ({taxonomy.groups.length})
              </div>
              {taxonomy.groups.map(group => {
                const isSelected = selectedGroupId === group.id;
                return (
                  <button
                    key={group.id}
                    onClick={() => setSelectedGroupId(group.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer flex items-center justify-between border ${
                      isSelected
                        ? 'bg-slate-800/90 text-white font-bold shadow-md'
                        : 'bg-slate-900/40 hover:bg-slate-800/40 text-slate-300 border-slate-800/60'
                    }`}
                    style={isSelected ? { borderColor: `${group.color}80` } : {}}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: group.color }}></span>
                      <span className="text-xs truncate">{group.name}</span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-500">
                      {group.categories.length}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Right column: Categories in Selected Group */}
            <div className="lg:col-span-8 space-y-4">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: activeGroup.color }}></span>
                    {activeGroup.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {activeGroup.categories.length} categories defined with deterministic priorities
                  </p>
                </div>

                <button
                  onClick={() => setShowAddCatModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              </div>

              {/* Categories list */}
              <div className="space-y-3">
                {activeGroup.categories.map((cat) => (
                  <div 
                    key={cat.id}
                    className="p-4 rounded-xl bg-[#090D15] border border-slate-800 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-white">{cat.name}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-800 text-slate-300">
                            Priority: {cat.priority}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleDeleteCategory(cat.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                        title="Delete category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Extensions */}
                    {cat.extensions && cat.extensions.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-slate-500 font-sans text-[10px]">Exts:</span>
                        {cat.extensions.map((ext, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                            {ext}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Name patterns */}
                    {cat.name_patterns && cat.name_patterns.length > 0 && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono">
                        <span className="text-slate-500 font-sans text-[10px]">Patterns:</span>
                        {cat.name_patterns.map((pat, idx) => (
                          <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-800 text-purple-300 border border-slate-700">
                            {pat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: IGNORE LIST */}
      {activeTab === 'ignore' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">Global File Exclusion Rules</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Files matching these glob patterns or directories are completely ignored and will never be moved.
              </p>
            </div>

            <button
              onClick={() => setShowAddIgnoreModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Ignore Rule</span>
            </button>
          </div>

          <div className="rounded-2xl bg-[#090D15] border border-slate-800 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-[#0D121D] border-b border-slate-800 text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                <tr>
                  <th className="py-3 px-4">Pattern</th>
                  <th className="py-3 px-4">Scope</th>
                  <th className="py-3 px-4">Reason / Exclusion Scope</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {taxonomy.ignore_rules.map((rule, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-cyan-300 font-bold">{rule.pattern}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-sans">
                        {rule.scope}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-sans text-slate-400">{rule.reason || rule.description}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => handleDeleteIgnoreRule(idx)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: RESOLUTION POLICY & LOOKUP SETTINGS */}
      {activeTab === 'lookup' && (
        <div className="space-y-6 max-w-4xl">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white">Resolution Policy Configuration</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Sorter executes a strict 4-stage resolution policy. Tiers activate only when preceding stages fail or yield ambiguous results.
            </p>

            <div className="space-y-4 pt-2">
              {/* Content Check */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-white">Stage 2: Read-Only Content Check</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Reads first 32 KB of text/markdown files for keyword signals (e.g. culinary ingredients, recipes).
                  </div>
                  <div className="text-[10px] font-mono text-emerald-400 mt-1">
                    Protected: Sensitive files (.env, keys) are strictly excluded.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-emerald-500/20 text-emerald-300">
                  Active (Max 32 KB)
                </span>
              </div>

              {/* Web Lookup */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-white">Stage 3: Web Extension Lookup</div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Queries online MIME/format registry for rare extensions (e.g. .webloc, .sketch, .parquet). Only the extension string is sent.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-cyan-500/20 text-cyan-300">
                  Active
                </span>
              </div>

              {/* AI Smart Classification */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start justify-between gap-4">
                <div>
                  <div className="font-bold text-xs text-white flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Stage 4: Server-Side Gemini Intelligence</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1">
                    Uses Gemini 2.5 Flash on Express backend to assist manual review for cryptic filenames. Strictly privacy preserved: file content is NEVER transmitted.
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded text-xs font-mono font-bold bg-indigo-500/20 text-indigo-300">
                  Server Endpoint Ready
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCatModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0C1019] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-bold text-white">Add Category to {activeGroup.name}</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Category Name</label>
                <input
                  type="text"
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  placeholder="e.g. Shift Schedules, Pitch Decks"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">File Extensions (comma separated)</label>
                <input
                  type="text"
                  value={newCatExts}
                  onChange={(e) => setNewCatExts(e.target.value)}
                  placeholder=".xlsx, .csv"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Name Patterns (comma separated)</label>
                <input
                  type="text"
                  value={newCatPatterns}
                  onChange={(e) => setNewCatPatterns(e.target.value)}
                  placeholder="*schedule*, *roster*"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Priority (Higher runs first)</label>
                <input
                  type="number"
                  value={newCatPriority}
                  onChange={(e) => setNewCatPriority(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddCatModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Save Category
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Ignore Rule Modal */}
      {showAddIgnoreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0C1019] border border-slate-700 rounded-2xl shadow-2xl p-6 space-y-4 text-slate-200">
            <h3 className="text-base font-bold text-white">Add Global Exclusion Pattern</h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Pattern (Glob / Wildcard)</label>
                <input
                  type="text"
                  value={newIgnorePattern}
                  onChange={(e) => setNewIgnorePattern(e.target.value)}
                  placeholder="e.g. .venv/**, *.log"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Scope</label>
                <select
                  value={newIgnoreScope}
                  onChange={(e) => setNewIgnoreScope(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                >
                  <option value="both">Both (Files & Directories)</option>
                  <option value="file">Files Only</option>
                  <option value="folder">Folders Only</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Reason</label>
                <input
                  type="text"
                  value={newIgnoreReason}
                  onChange={(e) => setNewIgnoreReason(e.target.value)}
                  placeholder="e.g. Virtual environment artifacts"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddIgnoreModal(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleAddIgnoreRule}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs"
              >
                Save Rule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
