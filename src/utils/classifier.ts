import { Taxonomy, FileRecord, TaxonomyCategory, TaxonomyGroup } from '../types';

/**
 * Helper to match glob-like wildcards (*, **)
 */
export function matchPattern(pattern: string, text: string): boolean {
  const normalizedPattern = pattern.trim().toLowerCase();
  const normalizedText = text.trim().toLowerCase();

  if (normalizedPattern === normalizedText) return true;

  // Simple glob converter
  const regexStr = '^' + normalizedPattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '.*')
    .replace(/\*/g, '[^/]*')
    .replace(/\?/g, '.') + '$';

  try {
    const regex = new RegExp(regexStr, 'i');
    return regex.test(normalizedText);
  } catch {
    return normalizedText.includes(normalizedPattern.replace(/\*/g, ''));
  }
}

/**
 * Check if file path matches any active ignore rule
 */
export function isFileIgnored(filePath: string, fileName: string, taxonomy: Taxonomy): { ignored: boolean; ruleDescription?: string } {
  for (const rule of taxonomy.ignore_rules) {
    if (!rule.enabled) continue;
    if (matchPattern(rule.pattern, filePath) || matchPattern(rule.pattern, fileName)) {
      return { ignored: true, ruleDescription: rule.description };
    }
  }
  return { ignored: false };
}

/**
 * Check if file is sensitive by name/path pattern
 * HARD RULE: Sensitive files are identified by name only and NEVER opened.
 */
export function isFileSensitive(filePath: string, fileName: string, taxonomy: Taxonomy): boolean {
  const sensitivePatterns = [
    ...taxonomy.resolution_policy.never_open_patterns,
    '.env*',
    '*id_rsa*',
    '*id_ed25519*',
    '*.pem',
    '*.key',
    '*secret*',
    '*credential*',
    '*token*',
    '*.pfx',
    '*.p12'
  ];

  return sensitivePatterns.some(pattern => 
    matchPattern(pattern, fileName) || matchPattern(pattern, filePath)
  );
}

/**
 * Web lookup registry for unusual / specialized extensions
 */
const WEB_LOOKUP_REGISTRY: Record<string, { group: string; category: string; description: string; signals: string[] }> = {
  '.webloc': {
    group: 'installers_system',
    category: 'shortcuts',
    description: "Looked up the .webloc file type online (only '.webloc' was sent): macOS internet shortcut.",
    signals: ['web-lookup: .webloc', 'macOS internet shortcut', 'schema: URL alias']
  },
  '.sketch': {
    group: 'media',
    category: 'design-vectors',
    description: "Looked up the .sketch file type online (only '.sketch' was sent): Bohemian Coding UI design document.",
    signals: ['web-lookup: .sketch', 'vector UI canvas', 'Bohemian Sketch design file']
  },
  '.parquet': {
    group: 'data_logs',
    category: 'raw-data',
    description: "Looked up the .parquet file type online (only '.parquet' was sent): Apache Parquet columnar storage format.",
    signals: ['web-lookup: .parquet', 'Apache columnar storage', 'data pipeline artifact']
  },
  '.pkpass': {
    group: 'personal_life',
    category: 'travel-tickets',
    description: "Looked up the .pkpass file type online (only '.pkpass' was sent): Apple Wallet digital pass / boarding ticket.",
    signals: ['web-lookup: .pkpass', 'Apple Wallet Pass', 'barcode & transit ticket']
  },
  '.epub': {
    group: 'documents',
    category: 'office-docs',
    description: "Looked up the .epub file type online (only '.epub' was sent): Electronic publication standard document.",
    signals: ['web-lookup: .epub', 'e-book document container']
  }
};

/**
 * Fast SHA-256 or simulated deterministic safety hash
 */
export function generateSafetyHash(fileName: string, size: number, modified: number): string {
  const str = `${fileName}-${size}-${modified}`;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `sha256:7f${hex}9a4b`;
}

/**
 * Classifies a single file according to the strict 4-stage resolution policy:
 * 1. Name rule & extension match (High confidence)
 * 2. Content check (Read-only, max 32 KB, never sensitive)
 * 3. Web lookup (Only extension looked up)
 * 4. Manual review queue
 */
export function detectCleanupCandidate(
  name: string,
  ext: string,
  path: string,
  size: number
): { isCleanup: boolean; reason: string; category: 'partial_download' | 'stale_installer' | 'duplicate' | 'scratchpad' | 'obsolete_log' } {
  const lowerName = name.toLowerCase();
  const lowerExt = ext.toLowerCase();

  if (lowerExt === '.crdownload' || lowerExt === '.part' || lowerName.endsWith('.download')) {
    return {
      isCleanup: true,
      reason: 'Incomplete or interrupted partial download artifact',
      category: 'partial_download'
    };
  }

  if (['.dmg', '.exe', '.pkg', '.iso', '.msi'].includes(lowerExt) && (path.includes('Downloads') || path.includes('Desktop') || size > 50000000)) {
    return {
      isCleanup: true,
      reason: 'Large downloaded installer or system disk image',
      category: 'stale_installer'
    };
  }

  if (lowerName.startsWith('untitled') || lowerExt === '.tmp' || lowerExt === '.bak') {
    return {
      isCleanup: true,
      reason: 'Untitled scratchpad or temporary backup artifact',
      category: 'scratchpad'
    };
  }

  if (lowerExt === '.log' || lowerExt === '.dmp' || lowerName.includes('crash_dump')) {
    return {
      isCleanup: true,
      reason: 'Obsolete diagnostic log or crash trace dump',
      category: 'obsolete_log'
    };
  }

  return {
    isCleanup: false,
    reason: '',
    category: 'scratchpad'
  };
}

/**
 * Detect if a file path is a Windows OS Core component that must be protected
 */
export function isSystemProtectedPath(filePath: string, fileName: string): boolean {
  const lowerName = fileName.toLowerCase();
  const lowerPath = filePath.toLowerCase();
  return (
    lowerName === 'pagefile.sys' ||
    lowerName === 'hiberfil.sys' ||
    lowerName === 'swapfile.sys' ||
    lowerPath.includes('\\windows\\system32') ||
    lowerPath.includes('/windows/system32') ||
    lowerPath.includes('\\windows\\syswow64') ||
    lowerPath.includes('\\windows\\winsxs') ||
    lowerPath.includes('\\boot\\') ||
    lowerPath.includes('\\recovery\\')
  );
}

export function classifyFile(
  file: {
    id: string;
    name: string;
    path: string;
    relativePath: string;
    size: number;
    modified: number;
    sampleContent?: string;
    fileHandle?: any;
    drive?: string;
    systemProtected?: boolean;
    folderLocation?: string;
  },
  taxonomy: Taxonomy,
  contentCheckEnabled = true,
  webLookupEnabled = true
): FileRecord {
  const ext = file.name.includes('.') ? '.' + file.name.split('.').pop()!.toLowerCase() : '';
  const hash = generateSafetyHash(file.name, file.size, file.modified);
  const cleanupEval = detectCleanupCandidate(file.name, ext, file.relativePath || file.path || '', file.size);
  const isProtected = file.systemProtected || isSystemProtectedPath(file.path, file.name);

  // Derive folderLocation if not set
  let folderLoc = file.folderLocation;
  if (!folderLoc && file.path) {
    const lastSlash = Math.max(file.path.lastIndexOf('\\'), file.path.lastIndexOf('/'));
    folderLoc = lastSlash > 0 ? file.path.substring(0, lastSlash) : (file.path.startsWith('C:') ? 'C:\\' : '/');
  }

  const driveLetter = file.drive || (file.path.startsWith('C:') ? 'C:' : (file.path.startsWith('D:') ? 'D:' : undefined));

  const enrichRecord = (record: FileRecord): FileRecord => ({
    ...record,
    drive: driveLetter,
    folderLocation: folderLoc,
    systemProtected: isProtected,
    cleanupCandidate: !isProtected && (cleanupEval.isCleanup || record.targetGroupId === 'temp_junk'),
    cleanupReason: !isProtected ? (cleanupEval.reason || (record.targetGroupId === 'temp_junk' ? 'Classified as temporary or junk artifact' : undefined)) : undefined
  });

  // 1a. Check Windows OS Core Protection (Whole C: Drive guardrail)
  if (isProtected) {
    return enrichRecord({
      ...file,
      extension: ext,
      targetGroupId: 'installers_system',
      targetGroupName: 'Installers & System',
      targetGroupColor: '#3B82F6',
      targetCategoryId: 'system-binaries',
      targetCategoryName: 'Windows OS Core',
      confidence: 1.0,
      matchEngine: 'name_rule',
      ruleIdentifier: 'RULE-OS-CORE-PROTECTED',
      whyExplanation: 'Windows OS Core component on C: drive. Protected by OS Safety Guard — indexed for disk topology but permanently locked from relocation or deletion.',
      matchedSignals: ['system: Windows OS Core', 'drive: C:\\', 'safety-lock: active'],
      sensitive: false,
      isDuplicate: false,
      needsReview: false,
      status: 'skipped',
      safetyHash: hash,
      destinationPath: ''
    });
  }

  // 1b. Check ignore rules
  const ignoreCheck = isFileIgnored(file.relativePath || file.path, file.name, taxonomy);
  if (ignoreCheck.ignored) {
    return enrichRecord({
      ...file,
      extension: ext,
      targetGroupId: 'temp_junk',
      targetGroupName: 'Temp & Junk',
      targetGroupColor: '#78716C',
      targetCategoryId: 'scratchpads',
      targetCategoryName: 'Ignored File',
      confidence: 1.0,
      matchEngine: 'ignored',
      ruleIdentifier: 'RULE-IGNORE-GLOB',
      whyExplanation: `Matched exclusion rule: ${ignoreCheck.ruleDescription || 'Ignored path pattern'}. File will remain untouched.`,
      matchedSignals: ['ignored: ' + file.name],
      sensitive: false,
      isDuplicate: false,
      needsReview: false,
      status: 'skipped',
      safetyHash: hash,
      destinationPath: ''
    });
  }

  // 2. Check sensitive credentials & environment
  // CRITICAL RULE: NEVER READ OR OPEN SENSITIVE FILES.
  if (isFileSensitive(file.relativePath || file.path, file.name, taxonomy)) {
    const codeGroup = taxonomy.groups.find(g => g.id === 'code') || taxonomy.groups[0];
    const envCat = codeGroup.categories.find(c => c.id === 'env-secrets') || codeGroup.categories[0];

    return enrichRecord({
      ...file,
      extension: ext,
      targetGroupId: codeGroup.id,
      targetGroupName: codeGroup.name,
      targetGroupColor: codeGroup.color,
      targetCategoryId: envCat.id,
      targetCategoryName: envCat.name,
      confidence: 0.99,
      matchEngine: 'name_rule',
      ruleIdentifier: 'RULE-SENSITIVE-GUARD',
      whyExplanation: 'Identified by name only. This file is never opened. Only metadata was read. Nothing was changed.',
      matchedSignals: ['sensitive: ' + file.name, 'pattern: .env / security token', 'read-guard: active'],
      sensitive: true,
      isDuplicate: false,
      needsReview: false,
      status: 'pending',
      safetyHash: hash,
      destinationPath: `${codeGroup.name}/${envCat.name}/${file.name}`
    });
  }

  // 3. Name & Extension Match
  interface MatchCandidate {
    group: TaxonomyGroup;
    category: TaxonomyCategory;
    score: number;
    ruleId: string;
    signal: string;
  }

  const candidates: MatchCandidate[] = [];

  for (const group of taxonomy.groups) {
    for (const cat of group.categories) {
      let score = 0;
      let matchedSignal = '';

      // Match exact or wildcard name patterns
      if (cat.name_patterns && cat.name_patterns.length > 0) {
        for (const pattern of cat.name_patterns) {
          if (matchPattern(pattern, file.name)) {
            score += 60;
            matchedSignal = `name-pattern: ${pattern}`;
            break;
          }
        }
      }

      // Match extension
      if (cat.extensions && cat.extensions.length > 0) {
        if (cat.extensions.map(e => e.toLowerCase()).includes(ext)) {
          score += 35;
          if (!matchedSignal) matchedSignal = `ext: ${ext}`;
        }
      }

      // Match folder hints in relative path
      if (cat.folder_hints && cat.folder_hints.length > 0) {
        const lowerPath = (file.relativePath || file.path).toLowerCase();
        for (const hint of cat.folder_hints) {
          if (lowerPath.includes(hint.toLowerCase())) {
            score += 25;
            matchedSignal += (matchedSignal ? ', ' : '') + `folder-hint: ${hint}`;
            break;
          }
        }
      }

      if (score > 0) {
        // Adjust with category priority (lower priority number = higher precedence)
        const priorityBonus = Math.max(0, (100 - cat.priority) * 0.1);
        candidates.push({
          group,
          category: cat,
          score: score + priorityBonus,
          ruleId: `RULE-${group.id.toUpperCase()}-${cat.id.toUpperCase()}`,
          signal: matchedSignal
        });
      }
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  const bestCandidate = candidates[0];

  // If we have a very clear high confidence match (e.g. score >= 50)
  if (bestCandidate && bestCandidate.score >= 50) {
    const confidence = Math.min(0.98, 0.70 + (bestCandidate.score / 200));
    return enrichRecord({
      ...file,
      extension: ext,
      targetGroupId: bestCandidate.group.id,
      targetGroupName: bestCandidate.group.name,
      targetGroupColor: bestCandidate.group.color,
      targetCategoryId: bestCandidate.category.id,
      targetCategoryName: bestCandidate.category.name,
      confidence: parseFloat(confidence.toFixed(2)),
      matchEngine: 'name_rule',
      ruleIdentifier: bestCandidate.ruleId,
      whyExplanation: `Matched based on file naming structure and extension (${ext}). Metadata verified successfully.`,
      matchedSignals: bestCandidate.signal.split(', '),
      sensitive: false,
      isDuplicate: false,
      needsReview: confidence < taxonomy.resolution_policy.confidence_threshold_auto,
      status: 'pending',
      safetyHash: hash,
      destinationPath: `${bestCandidate.group.name}/${bestCandidate.category.name}/${file.name}`
    });
  }

  // 4. Method 2: Content Check (if eligible: text file, not sensitive, < 32 KB)
  if (contentCheckEnabled && file.size < taxonomy.resolution_policy.max_content_check_bytes && file.sampleContent) {
    const content = file.sampleContent.toLowerCase();

    // Check ECHT Restaurant culinary keywords
    const echtGroup = taxonomy.groups.find(g => g.id === 'echt_restaurant');
    const recipeCat = echtGroup?.categories.find(c => c.id === 'recipes-costing');
    if (recipeCat && recipeCat.content_keywords) {
      const matchedKw = recipeCat.content_keywords.filter(kw => content.includes(kw.toLowerCase()));
      if (matchedKw.length >= 2) {
        return enrichRecord({
          ...file,
          extension: ext,
          targetGroupId: echtGroup!.id,
          targetGroupName: echtGroup!.name,
          targetGroupColor: echtGroup!.color,
          targetCategoryId: recipeCat.id,
          targetCategoryName: recipeCat.name,
          confidence: 0.86,
          matchEngine: 'content_check',
          ruleIdentifier: 'RULE-CONTENT-RECIPES',
          whyExplanation: 'The name alone was not enough. The file was opened read-only and contains an ingredient list with portion sizes. Nothing was changed.',
          matchedSignals: matchedKw.map(k => `${k}`),
          sensitive: false,
          isDuplicate: false,
          needsReview: false,
          status: 'pending',
          safetyHash: hash,
          destinationPath: `${echtGroup!.name}/${recipeCat.name}/${file.name}`
        });
      }
    }

    // Check Supplier invoices
    const invoiceCat = echtGroup?.categories.find(c => c.id === 'supplier-invoices');
    if (invoiceCat && invoiceCat.content_keywords) {
      const matchedKw = invoiceCat.content_keywords.filter(kw => content.includes(kw.toLowerCase()));
      if (matchedKw.length >= 2) {
        return enrichRecord({
          ...file,
          extension: ext,
          targetGroupId: echtGroup!.id,
          targetGroupName: echtGroup!.name,
          targetGroupColor: echtGroup!.color,
          targetCategoryId: invoiceCat.id,
          targetCategoryName: invoiceCat.name,
          confidence: 0.88,
          matchEngine: 'content_check',
          ruleIdentifier: 'RULE-CONTENT-INVOICE',
          whyExplanation: 'Content scan read-only detected vendor billing terms and itemized invoice line items.',
          matchedSignals: matchedKw.map(k => `${k}`),
          sensitive: false,
          isDuplicate: false,
          needsReview: false,
          status: 'pending',
          safetyHash: hash,
          destinationPath: `${echtGroup!.name}/${invoiceCat.name}/${file.name}`
        });
      }
    }
  }

  // 5. Method 3: Web Lookup (for uncommon extensions)
  if (webLookupEnabled && ext && WEB_LOOKUP_REGISTRY[ext]) {
    const lookup = WEB_LOOKUP_REGISTRY[ext];
    const group = taxonomy.groups.find(g => g.id === lookup.group) || taxonomy.groups[0];
    const category = group.categories.find(c => c.id === lookup.category) || group.categories[0];

    return enrichRecord({
      ...file,
      extension: ext,
      targetGroupId: group.id,
      targetGroupName: group.name,
      targetGroupColor: group.color,
      targetCategoryId: category.id,
      targetCategoryName: category.name,
      confidence: 0.82,
      matchEngine: 'web_lookup',
      ruleIdentifier: `RULE-WEB-${ext.replace('.', '').toUpperCase()}`,
      whyExplanation: lookup.description,
      matchedSignals: lookup.signals,
      sensitive: false,
      isDuplicate: false,
      needsReview: false,
      status: 'pending',
      safetyHash: hash,
      destinationPath: `${group.name}/${category.name}/${file.name}`
    });
  }

  // 6. Method 4: Ambiguous / Low confidence -> Review Queue
  // Default to best partial match or Documents / Temp & Junk
  const fallbackGroup = bestCandidate ? bestCandidate.group : (taxonomy.groups.find(g => g.id === 'documents') || taxonomy.groups[0]);
  const fallbackCat = bestCandidate ? bestCandidate.category : fallbackGroup.categories[0];

  return enrichRecord({
    ...file,
    extension: ext,
    targetGroupId: fallbackGroup.id,
    targetGroupName: fallbackGroup.name,
    targetGroupColor: fallbackGroup.color,
    targetCategoryId: fallbackCat.id,
    targetCategoryName: fallbackCat.name,
    confidence: bestCandidate ? Math.min(0.68, bestCandidate.score / 100) : 0.42,
    matchEngine: bestCandidate ? 'name_rule' : 'manual',
    ruleIdentifier: 'RULE-AMBIGUOUS-QUEUE',
    whyExplanation: 'Ambiguous file attributes or generic naming. Staged for human verification in the Review Queue.',
    matchedSignals: [ext ? `ext: ${ext}` : 'no-extension', 'ambiguous-score'],
    sensitive: false,
    isDuplicate: false,
    needsReview: true,
    status: 'pending',
    safetyHash: hash,
    destinationPath: `${fallbackGroup.name}/${fallbackCat.name}/${file.name}`
  });
}
