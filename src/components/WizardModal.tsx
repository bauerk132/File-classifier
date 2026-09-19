import React, { useState, useEffect } from 'react';
import { 
  FolderPlus, 
  Terminal, 
  Sparkles, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowRight, 
  Check, 
  X, 
  Edit2, 
  RefreshCw,
  FolderTree,
  AlertCircle
} from 'lucide-react';
import { Taxonomy, TaxonomyCategory } from '../types';

interface WizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  taxonomy: Taxonomy;
  onApplyCategoriesToProfile: (keptCategories: TaxonomyCategory[]) => void;
  onCompleteWizard: () => void;
}

interface SuggestedCategoryItem {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  groupColor: string;
  reason: string;
  fileCountEstimate: number;
  sampleFiles: string[];
  kept: boolean;
  priority: number;
}

export const WizardModal: React.FC<WizardModalProps> = ({
  isOpen,
  onClose,
  taxonomy,
  onApplyCategoriesToProfile,
  onCompleteWizard
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [selectedFolderNames, setSelectedFolderNames] = useState<string[]>([
    'Downloads',
    'Desktop',
    'Documents/Projects',
    'ECHT_Restaurant_Ops'
  ]);
  
  // Step 2 Survey Simulation state
  const [surveyProgress, setSurveyProgress] = useState(0);
  const [catalogedCount, setCatalogedCount] = useState(120);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [surveyCompleted, setSurveyCompleted] = useState(false);

  // Step 3 Suggested categories based on survey evidence
  const [suggestions, setSuggestions] = useState<SuggestedCategoryItem[]>([
    {
      id: 'sug-rec',
      name: 'ECHT Recipes & Kitchen Prep',
      groupId: 'echt_restaurant',
      groupName: 'ECHT Restaurant',
      groupColor: '#F97316',
      reason: '85 recipe notes with culinary ingredients detected in ECHT folders',
      fileCountEstimate: 85,
      sampleFiles: ['notes_draft.md', 'duck_confit_prep.md', 'dinner_menu_spring.pdf'],
      kept: true,
      priority: 70
    },
    {
      id: 'sug-code',
      name: 'TypeScript & Web Repositories',
      groupId: 'code',
      groupName: 'Code & Dev',
      groupColor: '#8B5CF6',
      reason: '3,200 TypeScript source files located in Projects directories',
      fileCountEstimate: 3200,
      sampleFiles: ['ClassifierEngine.tsx', 'App.tsx', 'index.ts'],
      kept: true,
      priority: 30
    },
    {
      id: 'sug-photo',
      name: 'High-Res Camera RAW & Photos',
      groupId: 'media',
      groupName: 'Media & Design',
      groupColor: '#EC4899',
      reason: '1,240 photos and camera captures in DCIM and Desktop',
      fileCountEstimate: 1240,
      sampleFiles: ['DSC_09421.CR2', 'IMG_4821.HEIC', 'CleanShot.png'],
      kept: true,
      priority: 21
    },
    {
      id: 'sug-inv',
      name: 'Sysco & Supplier Invoices',
      groupId: 'echt_restaurant',
      groupName: 'ECHT Restaurant',
      groupColor: '#F97316',
      reason: '34 supplier billing statements and vendor item lists',
      fileCountEstimate: 34,
      sampleFiles: ['Sysco_Invoice_99214_BOH.pdf', 'USFoods_Weekly.pdf'],
      kept: true,
      priority: 71
    },
    {
      id: 'sug-sec',
      name: 'Environment & API Secrets',
      groupId: 'code',
      groupName: 'Code & Dev',
      groupColor: '#8B5CF6',
      reason: 'Security credentials identified by name. Never opened read-only.',
      fileCountEstimate: 6,
      sampleFiles: ['.env.local', 'id_rsa.pub', 'jwt_secret.key'],
      kept: true,
      priority: 1
    },
    {
      id: 'sug-tax',
      name: 'Tax Filings & Government ID',
      groupId: 'personal_life',
      groupName: 'Personal Life',
      groupColor: '#10B981',
      reason: '28 W2 statements and official identification documents',
      fileCountEstimate: 28,
      sampleFiles: ['W2_Tax_Year_2023_Official.pdf', 'Passport_Scan.pdf'],
      kept: true,
      priority: 50
    },
    {
      id: 'sug-junk',
      name: 'Partial Downloads & Temp Junk',
      groupId: 'temp_junk',
      groupName: 'Temp & Junk',
      groupColor: '#78716C',
      reason: '19 leftover .crdownload, .part and cache artifacts',
      fileCountEstimate: 19,
      sampleFiles: ['ubuntu.iso.crdownload', 'untitled_file', 'temp.part'],
      kept: true,
      priority: 90
    }
  ]);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameText, setEditNameText] = useState('');

  // Step 2 Live stream animation
  useEffect(() => {
    if (step === 2 && !surveyCompleted) {
      let currentP = 0;
      const samplePaths = [
        'READING ~/Downloads/Sysco_Invoice_99214_BOH.pdf',
        'READING ~/Desktop/CleanShot 2024-04-12 at 10.42.18.png',
        'INDEXING ~/Projects/web-app/.env.local [Sensitive: bypass content check]',
        'READING ~/ECHT/Recipes/notes_draft.md [Found culinary keywords: kosher salt]',
        'READING ~/Desktop/bookmark.webloc [Web lookup: macOS shortcut]',
        'INDEXING ~/Downloads/Docker_v4.28.0_installer.dmg',
        'INDEXING ~/Personal/Taxes/W2_Tax_Year_2023_Official.pdf',
        'CATALOGING ~/Projects/SorterApp/src/ClassifierEngine.tsx',
        'INDEXING ~/Downloads/ubuntu-22.04.iso.crdownload',
        'READING ~/Documents/Quarterly_Report.pdf',
        'COMPLETED PASS 1: 3,412 files cataloged without opening files.'
      ];

      const interval = setInterval(() => {
        currentP += 5;
        setSurveyProgress(Math.min(100, currentP));
        setCatalogedCount(prev => Math.min(3412, prev + 240));

        const nextLog = samplePaths[Math.floor((currentP / 100) * (samplePaths.length - 1))];
        setTerminalLogs(prev => [...prev.slice(-7), nextLog]);

        if (currentP >= 100) {
          clearInterval(interval);
          setSurveyCompleted(true);
        }
      }, 100);

      return () => clearInterval(interval);
    }
  }, [step, surveyCompleted]);

  if (!isOpen) return null;

  const handleStartSurvey = () => {
    setStep(2);
    setSurveyProgress(0);
    setSurveyCompleted(false);
  };

  const handleSaveAndFinish = () => {
    const keptList: TaxonomyCategory[] = suggestions
      .filter(s => s.kept)
      .map(s => ({
        id: s.id,
        name: s.name,
        priority: s.priority,
        folder_hints: [s.name.toLowerCase().replace(/[^a-z0-9]/g, '-')]
      }));

    onApplyCategoriesToProfile(keptList);
    onCompleteWizard();
    onClose();
  };

  const keptCount = suggestions.filter(s => s.kept).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#0B0F17] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0F1420] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                First-Run Setup Wizard
              </h2>
              <p className="text-xs text-slate-400">
                Four-step personalized catalog & category generator
              </p>
            </div>
          </div>

          {/* Stepper indicators */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                  step === s 
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' 
                    : step > s 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-800/60 text-slate-500'
                }`}
              >
                {step > s ? <Check className="w-3 h-3 text-emerald-400" /> : <span>{s}</span>}
                <span className="hidden sm:inline">
                  {s === 1 && 'Pick Folders'}
                  {s === 2 && 'Survey'}
                  {s === 3 && 'Choose Categories'}
                  {s === 4 && 'Save'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-200">
          {/* STEP 1: PICK FOLDERS */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 1: Pick Folders to Survey</h3>
                <p className="text-xs text-slate-400">
                  Select the source directories you want Sorter to catalog. Scanning is strictly read-only.
                </p>
              </div>

              {/* Folder list */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Active Survey Roots
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedFolderNames.map((folder, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <FolderTree className="w-4 h-4 text-cyan-400" />
                        <span className="font-mono text-slate-200">~/{folder}</span>
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">
                        Read-only
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Safety notice */}
              <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <div className="font-semibold text-emerald-300">Strict Non-Destructive Guarantee</div>
                  <div className="text-slate-400 leading-relaxed">
                    Sorter will catalog folder structures, names, and extensions. No file will ever be moved, renamed, or modified during scanning or surveying. Sensitive environment files are never opened.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOOK AROUND (SURVEY) */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">Step 2: Looking Around</h3>
                <p className="text-xs text-slate-400">
                  Surveying directory patterns and sampling extension distributions...
                </p>
              </div>

              {/* Progress and speed */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                <div className="flex justify-between items-center text-xs font-mono">
                  <span className="text-cyan-400 font-bold">{surveyProgress}% CATALOGED</span>
                  <span className="text-slate-400">~384 files / sec</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 transition-all duration-150"
                    style={{ width: `${surveyProgress}%` }}
                  ></div>
                </div>
              </div>

              {/* Telemetry Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Root Paths</div>
                  <div className="text-base font-bold font-mono text-white mt-1">4 / 4</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Files Cataloged</div>
                  <div className="text-base font-bold font-mono text-cyan-400 mt-1">{catalogedCount.toLocaleString()}</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">File Types</div>
                  <div className="text-base font-bold font-mono text-indigo-400 mt-1">84 Detected</div>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-center">
                  <div className="text-[10px] uppercase tracking-wider text-slate-400">Elapsed Time</div>
                  <div className="text-base font-bold font-mono text-emerald-400 mt-1">00:08</div>
                </div>
              </div>

              {/* Live terminal scroll */}
              <div className="p-3 rounded-xl bg-[#06090F] border border-slate-800 font-mono text-[11px] space-y-1 h-36 overflow-y-auto">
                <div className="text-slate-500 flex items-center gap-1.5 pb-1 border-b border-slate-800">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SURVEY TELEMETRY STREAM</span>
                </div>
                {terminalLogs.map((log, i) => (
                  <div key={i} className="text-slate-300">
                    <span className="text-slate-600">&gt; </span>{log}
                  </div>
                ))}
              </div>

              {/* Offline Safe badge */}
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-900/40 px-3 py-2 rounded-lg border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>
                  Local privacy guarantee: Only file names, types, and folder names were cataloged. Nothing left this computer.
                </span>
              </div>
            </div>
          )}

          {/* STEP 3: SUGGEST CATEGORIES */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Step 3: Suggested Categories</h3>
                  <p className="text-xs text-slate-400">
                    We found {suggestions.length} clear patterns based on your surveyed files. Choose which to keep in your profile:
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {keptCount} of {suggestions.length} Kept
                </span>
              </div>

              {/* Suggestions List */}
              <div className="space-y-2.5 max-h-[46vh] overflow-y-auto pr-1">
                {suggestions.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      item.kept 
                        ? 'bg-slate-900/90 border-slate-700/80 shadow-md' 
                        : 'bg-slate-950/40 border-slate-800/40 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <button
                          onClick={() => {
                            setSuggestions(prev => prev.map(s => s.id === item.id ? { ...s, kept: !s.kept } : s));
                          }}
                          className={`mt-1 w-5 h-5 rounded flex items-center justify-center transition-colors cursor-pointer ${
                            item.kept ? 'bg-cyan-500 text-black' : 'border border-slate-600 bg-slate-800'
                          }`}
                        >
                          {item.kept && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                        </button>

                        <div>
                          {editingId === item.id ? (
                            <div className="flex items-center gap-2 mb-1">
                              <input
                                type="text"
                                value={editNameText}
                                onChange={(e) => setEditNameText(e.target.value)}
                                className="bg-slate-800 border border-cyan-500 rounded px-2 py-0.5 text-xs text-white"
                                autoFocus
                              />
                              <button
                                onClick={() => {
                                  setSuggestions(prev => prev.map(s => s.id === item.id ? { ...s, name: editNameText } : s));
                                  setEditingId(null);
                                }}
                                className="px-2 py-0.5 rounded bg-cyan-600 text-white text-xs"
                              >
                                Save
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-white">{item.name}</span>
                              <span 
                                className="px-2 py-0.5 rounded text-[10px] font-semibold border"
                                style={{ 
                                  borderColor: `${item.groupColor}60`, 
                                  backgroundColor: `${item.groupColor}15`,
                                  color: item.groupColor
                                }}
                              >
                                {item.groupName}
                              </span>
                            </div>
                          )}

                          <p className="text-xs text-slate-400 mt-0.5">{item.reason}</p>

                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[11px] text-slate-500">Samples:</span>
                            {item.sampleFiles.map((f, fi) => (
                              <span key={fi} className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-semibold text-slate-300">
                          ~{item.fileCountEstimate} files
                        </span>
                        <button
                          onClick={() => {
                            setEditingId(item.id);
                            setEditNameText(item.name);
                          }}
                          className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                          title="Rename category"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: SAVE & SUMMARY */}
          {step === 4 && (
            <div className="space-y-6">
              <div className="text-center max-w-lg mx-auto py-4">
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Profile Ready for Action</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {keptCount} categories kept in this profile. These cover approximately 78% of your surveyed files automatically; ambiguous items will be staged safely in the Review Queue.
                </p>
              </div>

              {/* Summary cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Categories Kept</div>
                  <div className="text-lg font-bold text-emerald-400 mt-1">{keptCount} of {suggestions.length}</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Coverage Estimate</div>
                  <div className="text-lg font-bold text-cyan-400 mt-1">~78% Auto</div>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-center">
                  <div className="text-xs text-slate-400">Review Queue Stage</div>
                  <div className="text-lg font-bold text-amber-400 mt-1">~41 Files</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-indigo-950/20 border border-indigo-800/40 text-xs text-slate-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>
                  You can fine-tune priority orders, file extensions, and custom ignore rules at any time on the Rules screen.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-slate-800 bg-[#0F1420] flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel / Close
          </button>

          <div className="flex items-center gap-2">
            {step === 1 && (
              <button
                onClick={handleStartSurvey}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>Survey These Folders</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!surveyCompleted}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  surveyCompleted
                    ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                <span>Proceed to Category Suggestions</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                onClick={() => setStep(4)}
                className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
              >
                <span>Save to Profile & Review Summary</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 4 && (
              <button
                onClick={handleSaveAndFinish}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Apply & Start Sorting</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
