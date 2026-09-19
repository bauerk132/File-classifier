export interface IgnoreRule {
  id: string;
  pattern: string;
  description: string;
  scope: 'Folder wildcard' | 'VCS directory' | 'System files' | 'Temp & lock' | 'System hidden' | 'Extension glob' | 'both' | 'file' | 'folder';
  enabled: boolean;
  reason?: string;
}

export interface TaxonomyCategory {
  id: string;
  name: string;
  priority: number;
  extensions?: string[];
  name_patterns?: string[];
  folder_hints?: string[];
  sensitive?: boolean;
  description?: string;
  content_keywords?: string[];
}

export interface TaxonomyGroup {
  id: string;
  name: string;
  color: string;
  categories: TaxonomyCategory[];
}

export interface ResolutionPolicy {
  dry_run_default: boolean;
  max_content_check_bytes: number;
  never_open_patterns: string[];
  confidence_threshold_auto: number;
  chunk_size: number;
  allow_overwrite: boolean;
}

export interface Taxonomy {
  version: string;
  name: string;
  description: string;
  resolution_policy: ResolutionPolicy;
  ignore_rules: IgnoreRule[];
  groups: TaxonomyGroup[];
}

export type MatchEngine = 'name_rule' | 'content_check' | 'web_lookup' | 'manual' | 'ignored';

export interface DriveVolumeInfo {
  letter: string; // 'C:' or 'D:'
  label: string; // 'Local Disk (C:)'
  mountPoint: string; // 'C:\\'
  fileSystem: string; // 'NTFS'
  totalBytes: number; // e.g. 512,110,190,592 (476.8 GB)
  usedBytes: number; // e.g. 305,180,000,000 (284.2 GB)
  freeBytes: number; // e.g. 206,930,190,592 (192.6 GB)
  isSystemDrive: boolean;
  osName: string; // 'Windows 11 Pro 64-bit'
  model: string; // 'Samsung SSD 980 PRO 500GB'
  systemReservedBytes?: number;
}

export type DriveScope = 'all_c' | 'users_dir' | 'temp_cache' | 'program_files' | 'custom';

export interface FileRecord {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  extension: string;
  size: number;
  modified: number;
  drive?: string;
  systemProtected?: boolean;
  folderLocation?: string;
  targetGroupId: string;
  targetGroupName: string;
  targetGroupColor: string;
  targetCategoryId: string;
  targetCategoryName: string;
  confidence: number;
  matchEngine: MatchEngine;
  ruleIdentifier: string;
  whyExplanation: string;
  matchedSignals: string[];
  sensitive: boolean;
  isDuplicate: boolean;
  duplicateOf?: string;
  needsReview: boolean;
  status: 'pending' | 'accepted' | 'changed' | 'skipped' | 'organized';
  safetyHash: string;
  destinationPath: string;
  conflictStatus?: 'none' | 'exists_destination';
  conflictResolution?: 'skip' | 'rename_number';
  fileHandle?: any;
  sampleContent?: string;
  contentSample?: string;
  cleanupCandidate?: boolean;
  cleanupReason?: string;
}

export interface CleanupCandidate {
  file: FileRecord;
  categoryReason: 'partial_download' | 'stale_installer' | 'duplicate' | 'scratchpad' | 'obsolete_log';
  reasonLabel: string;
  explanation: string;
  potentialSavingsBytes: number;
  selected: boolean;
}

export interface QuarantineStagingPlan {
  quarantineDirectory: string;
  holdingDurationDays: number;
  deletePolicy: 'manual_user_review' | 'prompt_after_holding' | 'move_to_trash';
  manifestSaved: boolean;
}

export interface ScanTelemetry {
  rootPathsCount: number;
  filesCataloged: number;
  totalEstimated: number;
  fileTypesCount: number;
  elapsedSeconds: number;
  speedFilesPerSec: number;
  topExtensions: Array<{ ext: string; count: number }>;
}

export interface UserProfile {
  id: string;
  name: string;
  description?: string;
  isDefault?: boolean;
  active?: boolean;
  taxonomy: Taxonomy;
  createdAt: number;
  updatedAt: number;
}

export interface ManifestMove {
  fileId: string;
  fileName: string;
  sourcePath: string;
  destinationPath: string;
  size: number;
  sha256: string;
}

export interface RunHistoryItem {
  id: string;
  timestamp: number;
  status: 'completed' | 'reverted';
  fileCount: number;
  totalBytes: number;
  sourceDirectory: string;
  targetDirectory: string;
  manifest: ManifestMove[];
}

export type ScreenType = 'wizard' | 'scan' | 'results' | 'review' | 'organize' | 'cleanup' | 'rules' | 'history';
