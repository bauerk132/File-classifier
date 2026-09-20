/**
 * Sorter: Classifies files in a folder using a 4-tier deterministic resolution policy.
 * Non-destructive: Scanning is read-only. Moving only happens upon final confirmation.
 */

import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { ScanScreen } from './components/ScanScreen';
import { ResultsScreen } from './components/ResultsScreen';
import { ReviewQueueScreen } from './components/ReviewQueueScreen';
import { OrganizeScreen } from './components/OrganizeScreen';
import { CleanupScreen } from './components/CleanupScreen';
import { RulesScreen } from './components/RulesScreen';
import { HistoryScreen } from './components/HistoryScreen';
import { WizardModal } from './components/WizardModal';
import { ProfileModal } from './components/ProfileModal';
import { AzureAIModal } from './components/AzureAIModal';

import { ScreenType, FileRecord, Taxonomy, UserProfile, RunHistoryItem, TaxonomyCategory, AIProviderStatus } from './types';
import { DEFAULT_TAXONOMY_JSON } from './data/defaultTaxonomy';
import { getGeneratedSampleFiles } from './data/sampleFiles';
import { classifyFile } from './utils/classifier';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenType>('results');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Active Taxonomy state
  const [taxonomy, setTaxonomy] = useState<Taxonomy>(DEFAULT_TAXONOMY_JSON);

  // Profiles state
  const [profiles, setProfiles] = useState<UserProfile[]>([
    {
      id: 'prof-default',
      name: 'Default Taxonomy',
      description: 'Standard multi-tier rule set covering 11 global categories',
      taxonomy: DEFAULT_TAXONOMY_JSON,
      createdAt: Date.now() - 3600000 * 24 * 7,
      updatedAt: Date.now() - 3600000 * 24 * 2
    },
    {
      id: 'prof-echt',
      name: 'ECHT Restaurant & Hospitality',
      description: 'Prioritized recipe keywords, Sysco supplier invoices, and staff shift rosters',
      taxonomy: DEFAULT_TAXONOMY_JSON,
      createdAt: Date.now() - 3600000 * 24 * 5,
      updatedAt: Date.now() - 3600000 * 24 * 1
    },
    {
      id: 'prof-dev',
      name: 'Developer Workstation',
      description: 'Strict security exclusions for .env, source repo classification, and build cleanups',
      taxonomy: DEFAULT_TAXONOMY_JSON,
      createdAt: Date.now() - 3600000 * 24 * 14,
      updatedAt: Date.now() - 3600000 * 24 * 3
    }
  ]);
  const [activeProfileId, setActiveProfileId] = useState<string>('prof-default');

  // Classified Files state
  const [files, setFiles] = useState<FileRecord[]>(() => {
    // Initialize with comprehensive test bench covering all 4 resolution stages
    const initialRaw = getGeneratedSampleFiles(75);
    return initialRaw.map(rf => classifyFile(rf, DEFAULT_TAXONOMY_JSON, true, true));
  });

  // Selected file for inspection drawer
  const [selectedFile, setSelectedFile] = useState<FileRecord | null>(null);

  // Modals state
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isAzureModalOpen, setIsAzureModalOpen] = useState(false);

  // Azure AI State
  const [aiStatus, setAiStatus] = useState<AIProviderStatus | null>(null);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);

  // Query AI provider telemetry
  const refreshAIStatus = async () => {
    try {
      const res = await fetch('/api/ai-provider-status');
      if (res.ok) {
        const data = await res.json();
        setAiStatus(data);
      }
    } catch (err) {
      console.error('Failed to query AI provider status', err);
    }
  };

  useEffect(() => {
    refreshAIStatus();
  }, []);

  // Run History state
  const [history, setHistory] = useState<RunHistoryItem[]>([
    {
      id: 'RUN-1042',
      timestamp: Date.now() - 3600000 * 3,
      status: 'completed',
      fileCount: 42,
      totalBytes: 184500000,
      sourceDirectory: '~/Downloads',
      targetDirectory: '~/Documents/Organized_Library',
      manifest: [
        {
          fileId: 'hist-1',
          fileName: 'Docker_v4.28.0_installer.dmg',
          sourcePath: '~/Downloads/Docker_v4.28.0_installer.dmg',
          destinationPath: '~/Documents/Organized_Library/Installers & System/Installers/Docker_v4.28.0_installer.dmg',
          size: 780000000,
          sha256: '9f83a042b8e8f2a1b9c7d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5'
        },
        {
          fileId: 'hist-2',
          fileName: 'Quarterly_Report.pdf',
          sourcePath: '~/Downloads/Quarterly_Report.pdf',
          destinationPath: '~/Documents/Organized_Library/Documents/PDF Documents/Quarterly_Report (1).pdf',
          size: 3840000,
          sha256: '7c82a1b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2'
        }
      ]
    },
    {
      id: 'RUN-1041',
      timestamp: Date.now() - 3600000 * 24 * 2,
      status: 'completed',
      fileCount: 128,
      totalBytes: 4280000000,
      sourceDirectory: '~/Desktop',
      targetDirectory: '~/Documents/Organized_Library',
      manifest: []
    }
  ]);

  // Load latest taxonomy from server on mount
  useEffect(() => {
    fetch('/api/taxonomy')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.groups && data.ignore_rules) {
          setTaxonomy(data);
        }
      })
      .catch(() => {
        // Fallback to default bundled taxonomy
      });
  }, []);

  // Sync profile when switched
  const handleSelectProfile = (id: string) => {
    setActiveProfileId(id);
    const prof = profiles.find(p => p.id === id);
    if (prof) {
      setTaxonomy(prof.taxonomy);
      // Reclassify active files with new profile taxonomy
      setFiles(prev => {
        return prev.map(f => {
          const raw = {
            id: f.id,
            name: f.name,
            path: f.path,
            relativePath: f.relativePath,
            size: f.size,
            modified: f.modified,
            sampleContent: f.contentSample
          };
          return classifyFile(raw, prof.taxonomy, true, true);
        });
      });
    }
  };

  // Reclassification on taxonomy update
  const handleUpdateTaxonomy = (newTaxonomy: Taxonomy) => {
    setTaxonomy(newTaxonomy);
    // Persist to server
    fetch('/api/taxonomy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTaxonomy)
    }).catch(() => {});

    // Update active profile
    setProfiles(prev => prev.map(p => {
      if (p.id === activeProfileId) {
        return { ...p, taxonomy: newTaxonomy, updatedAt: Date.now() };
      }
      return p;
    }));

    // Reclassify active bench
    setFiles(prev => {
      return prev.map(f => {
        const raw = {
          id: f.id,
          name: f.name,
          path: f.path,
          relativePath: f.relativePath,
          size: f.size,
          modified: f.modified,
          sampleContent: f.contentSample
        };
        return classifyFile(raw, newTaxonomy, true, true);
      });
    });
  };

  const handleResetToDefault = () => {
    handleUpdateTaxonomy(DEFAULT_TAXONOMY_JSON);
  };

  // Review Queue actions
  const handleAcceptFile = (fileId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          needsReview: false,
          status: 'accepted',
          confidence: 0.99
        };
      }
      return f;
    }));
  };

  const handleSkipFile = (fileId: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === fileId) {
        return {
          ...f,
          needsReview: false,
          status: 'skipped'
        };
      }
      return f;
    }));
  };

  const handleChangeFileCategory = (fileId: string, groupId: string, catId: string) => {
    const group = taxonomy.groups.find(g => g.id === groupId);
    const cat = group?.categories.find(c => c.id === catId);

    if (group && cat) {
      setFiles(prev => prev.map(f => {
        if (f.id === fileId) {
          return {
            ...f,
            targetGroupId: group.id,
            targetGroupName: group.name,
            targetGroupColor: group.color,
            targetCategoryId: cat.id,
            targetCategoryName: cat.name,
            needsReview: false,
            status: 'accepted',
            confidence: 1.0,
            whyExplanation: `Manually categorized by user into ${group.name} > ${cat.name}.`
          };
        }
        return f;
      }));
    }
  };

  const handleAcceptAllHighConfidence = () => {
    setFiles(prev => prev.map(f => {
      if (f.needsReview && f.confidence >= 0.70) {
        return {
          ...f,
          needsReview: false,
          status: 'accepted'
        };
      }
      return f;
    }));
  };

  // Azure AI Analysis Handlers
  const handleAzureAIBatchAnalyze = async () => {
    // Select review queue files or lower-confidence items
    const targetFiles = files.filter(f => f.needsReview || f.confidence < 0.85);
    if (targetFiles.length === 0) {
      alert('All files are already high-confidence or organized.');
      return;
    }

    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/ai-batch-analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          files: targetFiles.map(f => ({
            id: f.id,
            name: f.name,
            relativePath: f.relativePath || f.path,
            size: f.size,
            extension: f.extension,
            contentSample: f.contentSample
          })),
          taxonomy
        })
      });

      if (!res.ok) {
        throw new Error(`AI Batch classification failed (${res.statusText})`);
      }

      const data = await res.json();
      const results: Array<{
        fileId: string;
        targetGroupId: string;
        targetGroupName: string;
        targetCategoryId: string;
        targetCategoryName: string;
        confidence: number;
        whyExplanation: string;
        matchedSignals: string[];
        aiProvider: string;
        aiModel: string;
      }> = data.results || [];

      setFiles(prev => prev.map(f => {
        const match = results.find(r => r.fileId === f.id);
        if (!match) return f;
        const group = taxonomy.groups.find(g => g.id === match.targetGroupId);
        return {
          ...f,
          targetGroupId: match.targetGroupId,
          targetGroupName: match.targetGroupName,
          targetGroupColor: group?.color || f.targetGroupColor,
          targetCategoryId: match.targetCategoryId,
          targetCategoryName: match.targetCategoryName,
          confidence: match.confidence,
          whyExplanation: match.whyExplanation,
          matchedSignals: match.matchedSignals || [],
          matchEngine: 'ai_analysis' as const,
          aiProvider: (match.aiProvider === 'gemini' ? 'gemini' : 'azure') as 'azure' | 'gemini',
          aiModel: match.aiModel,
          needsReview: match.confidence < 0.75,
          status: (match.confidence >= 0.75 ? 'accepted' : 'pending') as FileRecord['status']
        };
      }));
    } catch (err: any) {
      console.error('Batch AI analysis error:', err);
      alert(`Azure AI Batch Analysis: ${err?.message || 'Failed to connect. Please open Azure AI settings in the navbar.'}`);
    } finally {
      setIsAiAnalyzing(false);
      refreshAIStatus();
    }
  };

  const handleAzureAIAnalyzeFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      const res = await fetch('/api/ai-classify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileRecord: {
            id: file.id,
            name: file.name,
            relativePath: file.relativePath || file.path,
            size: file.size,
            extension: file.extension,
            contentSample: file.contentSample
          },
          taxonomy
        })
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.message || 'Azure AI classification call failed.');
      }

      const classification = await res.json();
      const group = taxonomy.groups.find(g => g.id === classification.targetGroupId);

      const updatedFile: FileRecord = {
        ...file,
        targetGroupId: classification.targetGroupId,
        targetGroupName: classification.targetGroupName,
        targetGroupColor: group?.color || file.targetGroupColor,
        targetCategoryId: classification.targetCategoryId,
        targetCategoryName: classification.targetCategoryName,
        confidence: classification.confidence,
        whyExplanation: classification.whyExplanation,
        matchedSignals: classification.matchedSignals || [],
        matchEngine: 'ai_analysis' as const,
        aiProvider: (classification.aiProvider === 'gemini' ? 'gemini' : 'azure') as 'azure' | 'gemini',
        aiModel: classification.aiModel,
        needsReview: classification.confidence < 0.75,
        status: (classification.confidence >= 0.75 ? 'accepted' : 'pending') as FileRecord['status']
      };

      setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile(updatedFile);
      }
    } catch (err: any) {
      console.error('Single file Azure AI error:', err);
      alert(`Azure AI File Analysis: ${err?.message || 'Failed to contact Azure AI endpoint.'}`);
    } finally {
      refreshAIStatus();
    }
  };

  // Organize execution
  const handleExecuteOrganize = (runData: Omit<RunHistoryItem, 'id' | 'timestamp'>) => {
    const newRun: RunHistoryItem = {
      id: `RUN-${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: Date.now(),
      ...runData
    };
    setHistory(prev => [newRun, ...prev]);

    // Mark moved files as organized in state
    setFiles(prev => prev.map(f => {
      const moved = runData.manifest.find(m => m.fileId === f.id);
      if (moved) {
        return { ...f, status: 'organized' };
      }
      return f;
    }));
  };

  // Revert / Rollback
  const handleRevertRun = (runId: string) => {
    if (!confirm(`Revert run #${runId}? All files in this manifest will be safely restored to their original source locations.`)) {
      return;
    }

    setHistory(prev => prev.map(h => {
      if (h.id === runId) {
        return { ...h, status: 'reverted' };
      }
      return h;
    }));

    alert(`Run #${runId} reverted successfully. All original file positions restored.`);
  };

  // Profile Management
  const handleCreateProfile = (name: string, description: string) => {
    const newProf: UserProfile = {
      id: `prof-${Date.now()}`,
      name,
      description,
      taxonomy: JSON.parse(JSON.stringify(taxonomy)),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setProfiles(prev => [...prev, newProf]);
    setActiveProfileId(newProf.id);
  };

  const handleDuplicateProfile = (sourceId: string, newName: string) => {
    const source = profiles.find(p => p.id === sourceId);
    if (!source) return;
    const duplicated: UserProfile = {
      id: `prof-${Date.now()}`,
      name: newName,
      description: `Copy of ${source.name}`,
      taxonomy: JSON.parse(JSON.stringify(source.taxonomy)),
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
    setProfiles(prev => [...prev, duplicated]);
  };

  const handleDeleteProfile = (id: string) => {
    if (profiles.length <= 1) return;
    setProfiles(prev => prev.filter(p => p.id !== id));
    if (activeProfileId === id) {
      setActiveProfileId(profiles[0].id);
    }
  };

  const handleApplyCategoriesToProfile = (keptCategories: TaxonomyCategory[]) => {
    // Update active taxonomy with wizard categories
    const updated = JSON.parse(JSON.stringify(taxonomy)) as Taxonomy;
    for (const cat of keptCategories) {
      // Find matching group or attach to appropriate group
      const targetGroup = updated.groups.find(g => cat.name.toLowerCase().includes('echt') ? g.id === 'echt_restaurant' : g.id === 'documents');
      if (targetGroup && !targetGroup.categories.some(c => c.id === cat.id)) {
        targetGroup.categories.push(cat);
      }
    }
    handleUpdateTaxonomy(updated);
  };

  const reviewPendingCount = files.filter(f => f.needsReview).length;
  const cleanupCandidateCount = files.filter(f => f.status !== 'organized' && (f.cleanupCandidate || f.targetGroupId === 'temp_junk' || f.isDuplicate || f.extension === '.crdownload')).length;

  return (
    <div className="min-h-screen bg-[#070A0F] text-slate-100 font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        currentScreen={currentScreen}
        onSelectScreen={setCurrentScreen}
        reviewCount={reviewPendingCount}
        cleanupCount={cleanupCandidateCount}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onOpenWizard={() => setIsWizardOpen(true)}
        onOpenProfileManager={() => setIsProfileModalOpen(true)}
        onOpenAzureAIModal={() => setIsAzureModalOpen(true)}
        aiStatus={aiStatus}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* Screen Views */}
      <main className="pb-16">
        {currentScreen === 'scan' && (
          <ScanScreen
            onScanComplete={(newFiles) => {
              setFiles(newFiles);
              setCurrentScreen('results');
            }}
            onNavigateToResults={() => setCurrentScreen('results')}
            taxonomy={taxonomy}
            hasExistingResults={files.length > 0}
            existingFilesCount={files.length}
          />
        )}

        {currentScreen === 'results' && (
          <ResultsScreen
            files={files}
            taxonomy={taxonomy}
            selectedFile={selectedFile}
            onSelectFileForDetail={setSelectedFile}
            onCloseDrawer={() => setSelectedFile(null)}
            onAcceptClassification={handleAcceptFile}
            onRecategorize={handleChangeFileCategory}
            onNavigateToReview={() => setCurrentScreen('review')}
            onNavigateToOrganize={() => setCurrentScreen('organize')}
            onNavigateToCleanup={() => setCurrentScreen('cleanup')}
            searchQuery={searchQuery}
            aiStatus={aiStatus}
            onAzureAIBatchAnalyze={handleAzureAIBatchAnalyze}
            onAzureAIAnalyzeFile={handleAzureAIAnalyzeFile}
            isAiAnalyzing={isAiAnalyzing}
          />
        )}

        {currentScreen === 'review' && (
          <ReviewQueueScreen
            files={files}
            taxonomy={taxonomy}
            onAcceptFile={handleAcceptFile}
            onSkipFile={handleSkipFile}
            onChangeFileCategory={handleChangeFileCategory}
            onAcceptAllHighConfidence={handleAcceptAllHighConfidence}
            onNavigateToOrganize={() => setCurrentScreen('organize')}
            onAzureAIBatchAnalyze={handleAzureAIBatchAnalyze}
            onAzureAIAnalyzeFile={handleAzureAIAnalyzeFile}
            isAiAnalyzing={isAiAnalyzing}
            aiStatus={aiStatus}
          />
        )}

        {currentScreen === 'organize' && (
          <OrganizeScreen
            files={files}
            taxonomy={taxonomy}
            onExecuteOrganize={handleExecuteOrganize}
            onNavigateToHistory={() => setCurrentScreen('history')}
          />
        )}

        {currentScreen === 'cleanup' && (
          <CleanupScreen
            files={files}
            onExecuteQuarantine={(runData, quarantinePath) => {
              handleExecuteOrganize(runData);
            }}
            onNavigateToHistory={() => setCurrentScreen('history')}
            onRemoveFromCleanup={(fileId) => {
              setFiles(prev => prev.map(f => f.id === fileId ? { ...f, cleanupCandidate: false } : f));
            }}
          />
        )}

        {currentScreen === 'rules' && (
          <RulesScreen
            taxonomy={taxonomy}
            onUpdateTaxonomy={handleUpdateTaxonomy}
            onResetToDefault={handleResetToDefault}
          />
        )}

        {currentScreen === 'history' && (
          <HistoryScreen
            history={history}
            onRevertRun={handleRevertRun}
          />
        )}
      </main>

      {/* Azure AI Configuration Modal */}
      <AzureAIModal
        isOpen={isAzureModalOpen}
        onClose={() => setIsAzureModalOpen(false)}
        status={aiStatus}
        onRefreshStatus={refreshAIStatus}
      />

      {/* First-Run Setup Wizard Modal */}
      <WizardModal
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        taxonomy={taxonomy}
        onApplyCategoriesToProfile={handleApplyCategoriesToProfile}
        onCompleteWizard={() => setCurrentScreen('results')}
      />

      {/* Taxonomy Profile Management Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onDuplicateProfile={handleDuplicateProfile}
        onDeleteProfile={handleDeleteProfile}
      />
    </div>
  );
}
