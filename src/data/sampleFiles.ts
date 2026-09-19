export interface RawSampleFile {
  id: string;
  name: string;
  path: string;
  relativePath: string;
  size: number;
  modified: number;
  sampleContent?: string;
  drive?: string;
  systemProtected?: boolean;
  folderLocation?: string;
}

export const C_DRIVE_SAMPLE_FILES: RawSampleFile[] = [
  // 1. Critical test case: Sensitive credentials on C: drive (Guarded: NEVER opened read-only)
  {
    id: 'f-env-local',
    name: '.env.local',
    path: 'C:\\Users\\Admin\\source\\repos\\web-portal\\.env.local',
    relativePath: 'source\\repos\\web-portal\\.env.local',
    size: 842,
    modified: Date.now() - 3600000 * 24 * 3,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\source\\repos'
  },
  {
    id: 'f-id-rsa',
    name: 'id_rsa.pub',
    path: 'C:\\Users\\Admin\\.ssh\\id_rsa.pub',
    relativePath: '.ssh\\id_rsa.pub',
    size: 738,
    modified: Date.now() - 3600000 * 24 * 40,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\.ssh'
  },
  {
    id: 'f-jwt-secret',
    name: 'jwt_secret.key',
    path: 'C:\\Users\\Admin\\source\\repos\\api\\jwt_secret.key',
    relativePath: 'source\\repos\\api\\jwt_secret.key',
    size: 256,
    modified: Date.now() - 3600000 * 24 * 12,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\source\\repos'
  },

  // 2. Windows OS Core Protected Files (Read-Only Guaranteed, NEVER moved or deleted)
  {
    id: 'f-pagefile',
    name: 'pagefile.sys',
    path: 'C:\\pagefile.sys',
    relativePath: 'pagefile.sys',
    size: 16777216000, // 16 GB Virtual Memory
    modified: Date.now() - 3600000 * 1,
    drive: 'C:',
    systemProtected: true,
    folderLocation: 'C:\\ (Root Partition)'
  },
  {
    id: 'f-hiberfil',
    name: 'hiberfil.sys',
    path: 'C:\\hiberfil.sys',
    relativePath: 'hiberfil.sys',
    size: 12884901888, // 12.8 GB Fast Startup Hibernate File
    modified: Date.now() - 3600000 * 6,
    drive: 'C:',
    systemProtected: true,
    folderLocation: 'C:\\ (Root Partition)'
  },
  {
    id: 'f-ntoskrnl',
    name: 'ntoskrnl.exe',
    path: 'C:\\Windows\\System32\\ntoskrnl.exe',
    relativePath: 'Windows\\System32\\ntoskrnl.exe',
    size: 12450000,
    modified: Date.now() - 3600000 * 24 * 90,
    drive: 'C:',
    systemProtected: true,
    folderLocation: 'C:\\Windows\\System32'
  },

  // 3. Candidates for Cleanup on C: Drive (AppData Local Temp, Windows Temp, Incomplete Downloads)
  {
    id: 'f-partial-dl',
    name: 'ubuntu-24.04-desktop-amd64.iso.crdownload',
    path: 'C:\\Users\\Admin\\Downloads\\ubuntu-24.04-desktop-amd64.iso.crdownload',
    relativePath: 'Users\\Admin\\Downloads\\ubuntu-24.04-desktop-amd64.iso.crdownload',
    size: 1840000000, // 1.84 GB partial download
    modified: Date.now() - 3600000 * 2,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Downloads'
  },
  {
    id: 'f-win-temp-cab',
    name: 'cab_4821_3.tmp',
    path: 'C:\\Windows\\Temp\\cab_4821_3.tmp',
    relativePath: 'Windows\\Temp\\cab_4821_3.tmp',
    size: 420000000, // 420 MB Windows Update temporary archive
    modified: Date.now() - 3600000 * 24 * 18,
    drive: 'C:',
    folderLocation: 'C:\\Windows\\Temp'
  },
  {
    id: 'f-appdata-vscode-installer',
    name: 'VSCodeSetup-x64-1.87.2-stale.exe',
    path: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\VSCodeSetup-x64-1.87.2-stale.exe',
    relativePath: 'Users\\Admin\\AppData\\Local\\Temp\\VSCodeSetup-x64-1.87.2-stale.exe',
    size: 94000000,
    modified: Date.now() - 3600000 * 24 * 45,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\AppData\\Local\\Temp'
  },
  {
    id: 'f-crash-dump-dmp',
    name: 'MEMORY_CRASH_20240401.dmp',
    path: 'C:\\Users\\Admin\\AppData\\Local\\Temp\\CrashDumps\\MEMORY_CRASH_20240401.dmp',
    relativePath: 'Users\\Admin\\AppData\\Local\\Temp\\CrashDumps\\MEMORY_CRASH_20240401.dmp',
    size: 680000000, // 680 MB memory dump
    modified: Date.now() - 3600000 * 24 * 30,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\AppData\\Local\\Temp'
  },
  {
    id: 'f-docker-installer',
    name: 'Docker Desktop Installer.exe',
    path: 'C:\\Users\\Admin\\Downloads\\Docker Desktop Installer.exe',
    relativePath: 'Users\\Admin\\Downloads\\Docker Desktop Installer.exe',
    size: 580000000, // 580 MB stale installer
    modified: Date.now() - 3600000 * 24 * 90,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Downloads'
  },
  {
    id: 'f-untitled-draft',
    name: 'untitled_notes_scratchpad.tmp',
    path: 'C:\\Users\\Admin\\Desktop\\untitled_notes_scratchpad.tmp',
    relativePath: 'Users\\Admin\\Desktop\\untitled_notes_scratchpad.tmp',
    size: 14200,
    modified: Date.now() - 3600000 * 3,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Desktop'
  },
  {
    id: 'f-node-duplicate',
    name: 'nodejs-v20.11.0-x64 (1).msi',
    path: 'C:\\Users\\Admin\\Downloads\\nodejs-v20.11.0-x64 (1).msi',
    relativePath: 'Users\\Admin\\Downloads\\nodejs-v20.11.0-x64 (1).msi',
    size: 32500000,
    modified: Date.now() - 3600000 * 24 * 60,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Downloads'
  },

  // 4. Critical test case: Content Check (ECHT Restaurant culinary recipe on C: drive)
  {
    id: 'f-notes-draft',
    name: 'notes_draft.md',
    path: 'C:\\Users\\Admin\\Documents\\ECHT_Kitchen\\notes_draft.md',
    relativePath: 'Users\\Admin\\Documents\\ECHT_Kitchen\\notes_draft.md',
    size: 4200,
    modified: Date.now() - 3600000 * 5,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents',
    sampleContent: `# Spiced Braised Duck Confit
- Yield: 4 portions
- Prep time: 25m
- Cook time: 3h 15m
### Ingredients
- 4 duck legs
- 2 tbsp kosher salt
- 50ml extra virgin olive oil
- 4 cloves minced garlic
- 2 sprigs fresh rosemary
### Directions
Rub duck legs thoroughly with kosher salt and black pepper. Simmer gently in duck fat until tender. Kitchen test batch.`
  },

  // 5. Critical test case: Web Lookup (.webloc & .pkpass on C: drive)
  {
    id: 'f-bookmark-webloc',
    name: 'cloud_console_bookmark.webloc',
    path: 'C:\\Users\\Admin\\Desktop\\cloud_console_bookmark.webloc',
    relativePath: 'Users\\Admin\\Desktop\\cloud_console_bookmark.webloc',
    size: 420,
    modified: Date.now() - 3600000 * 18,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Desktop'
  },
  {
    id: 'f-sketch-ui',
    name: 'mobile_dashboard.sketch',
    path: 'C:\\Users\\Admin\\Downloads\\mobile_dashboard.sketch',
    relativePath: 'Users\\Admin\\Downloads\\mobile_dashboard.sketch',
    size: 14200000,
    modified: Date.now() - 3600000 * 48,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Downloads'
  },
  {
    id: 'f-pipeline-parquet',
    name: 'telemetry_q1.parquet',
    path: 'C:\\Users\\Admin\\Documents\\Analytics\\telemetry_q1.parquet',
    relativePath: 'Users\\Admin\\Documents\\Analytics\\telemetry_q1.parquet',
    size: 8900000,
    modified: Date.now() - 3600000 * 72,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-boarding-pass',
    name: 'united_flight_sfo.pkpass',
    path: 'C:\\Users\\Admin\\Downloads\\united_flight_sfo.pkpass',
    relativePath: 'Users\\Admin\\Downloads\\united_flight_sfo.pkpass',
    size: 32000,
    modified: Date.now() - 3600000 * 140,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Downloads'
  },

  // 6. Ambiguous / Review Queue items on C: drive
  {
    id: 'f-export-0412',
    name: 'export_0412.json',
    path: 'C:\\Users\\Admin\\Downloads\\export_0412.json',
    relativePath: 'Users\\Admin\\Downloads\\export_0412.json',
    size: 34800,
    modified: Date.now() - 3600000 * 8,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Downloads'
  },
  {
    id: 'f-scan-0093',
    name: 'scan_0093.pdf',
    path: 'C:\\Users\\Admin\\Documents\\Scans\\scan_0093.pdf',
    relativePath: 'Users\\Admin\\Documents\\Scans\\scan_0093.pdf',
    size: 2150000,
    modified: Date.now() - 3600000 * 96,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-untitled-file',
    name: 'untitled_file',
    path: 'C:\\Users\\Admin\\Desktop\\untitled_file',
    relativePath: 'Users\\Admin\\Desktop\\untitled_file',
    size: 12400,
    modified: Date.now() - 3600000 * 2,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Desktop'
  },
  {
    id: 'f-notes-meeting',
    name: 'meeting_sync.txt',
    path: 'C:\\Users\\Admin\\Documents\\meeting_sync.txt',
    relativePath: 'Users\\Admin\\Documents\\meeting_sync.txt',
    size: 2800,
    modified: Date.now() - 3600000 * 30,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },

  // 7. Standard high-confidence name rule matches across C: Drive
  {
    id: 'f-quarterly-report',
    name: 'Quarterly_Report.pdf',
    path: 'C:\\Users\\Admin\\Documents\\Quarterly_Report.pdf',
    relativePath: 'Users\\Admin\\Documents\\Quarterly_Report.pdf',
    size: 3840000,
    modified: Date.now() - 3600000 * 12,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-clean-screenshot',
    name: 'CleanShot 2024-04-12 at 10.42.18.png',
    path: 'C:\\Users\\Admin\\Desktop\\CleanShot 2024-04-12 at 10.42.18.png',
    relativePath: 'Users\\Admin\\Desktop\\CleanShot 2024-04-12 at 10.42.18.png',
    size: 1420000,
    modified: Date.now() - 3600000 * 14,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Desktop'
  },
  {
    id: 'f-sysco-inv',
    name: 'Sysco_Invoice_99214_BOH.pdf',
    path: 'C:\\Users\\Admin\\Documents\\ECHT\\Invoices\\Sysco_Invoice_99214_BOH.pdf',
    relativePath: 'Users\\Admin\\Documents\\ECHT\\Invoices\\Sysco_Invoice_99214_BOH.pdf',
    size: 512000,
    modified: Date.now() - 3600000 * 80,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-shift-sch',
    name: 'ECHT_Staff_Roster_Week14.xlsx',
    path: 'C:\\Users\\Admin\\Documents\\ECHT\\Schedules\\ECHT_Staff_Roster_Week14.xlsx',
    relativePath: 'Users\\Admin\\Documents\\ECHT\\Schedules\\ECHT_Staff_Roster_Week14.xlsx',
    size: 245000,
    modified: Date.now() - 3600000 * 20,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-db-dump',
    name: 'prod_database_dump_20240315.sql',
    path: 'C:\\Users\\Admin\\Documents\\Backups\\prod_database_dump_20240315.sql',
    relativePath: 'Users\\Admin\\Documents\\Backups\\prod_database_dump_20240315.sql',
    size: 284000000,
    modified: Date.now() - 3600000 * 110,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-w2-tax',
    name: 'W2_Tax_Year_2023_Official.pdf',
    path: 'C:\\Users\\Admin\\Documents\\Taxes\\W2_Tax_Year_2023_Official.pdf',
    relativePath: 'Users\\Admin\\Documents\\Taxes\\W2_Tax_Year_2023_Official.pdf',
    size: 420000,
    modified: Date.now() - 3600000 * 500,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-resume-alex',
    name: 'Resume_Alex_Morgan_SeniorEngineer.pdf',
    path: 'C:\\Users\\Admin\\Documents\\Career\\Resume_Alex_Morgan_SeniorEngineer.pdf',
    relativePath: 'Users\\Admin\\Documents\\Career\\Resume_Alex_Morgan_SeniorEngineer.pdf',
    size: 195000,
    modified: Date.now() - 3600000 * 300,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-client-nda',
    name: 'Master_Services_Agreement_NDA_Signed.pdf',
    path: 'C:\\Users\\Admin\\Documents\\Contracts\\Master_Services_Agreement_NDA_Signed.pdf',
    relativePath: 'Users\\Admin\\Documents\\Contracts\\Master_Services_Agreement_NDA_Signed.pdf',
    size: 890000,
    modified: Date.now() - 3600000 * 400,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-zip-archive',
    name: 'Photos_Backup_Japan_2023.zip',
    path: 'C:\\Users\\Admin\\Documents\\Archives\\Photos_Backup_Japan_2023.zip',
    relativePath: 'Users\\Admin\\Documents\\Archives\\Photos_Backup_Japan_2023.zip',
    size: 1840000000,
    modified: Date.now() - 3600000 * 900,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Documents'
  },
  {
    id: 'f-source-ts',
    name: 'ClassifierEngine.tsx',
    path: 'C:\\Users\\Admin\\source\\repos\\SorterApp\\src\\ClassifierEngine.tsx',
    relativePath: 'source\\repos\\SorterApp\\src\\ClassifierEngine.tsx',
    size: 28400,
    modified: Date.now() - 3600000 * 4,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\source\\repos'
  },
  {
    id: 'f-camera-raw',
    name: 'DSC_09421.CR2',
    path: 'C:\\Users\\Admin\\Pictures\\Camera\\DSC_09421.CR2',
    relativePath: 'Users\\Admin\\Pictures\\Camera\\DSC_09421.CR2',
    size: 28400000,
    modified: Date.now() - 3600000 * 240,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Pictures'
  },
  {
    id: 'f-podcast-ep',
    name: 'Tech_Talk_Ep42_Final_Master.mp3',
    path: 'C:\\Users\\Admin\\Videos\\Podcasts\\Tech_Talk_Ep42_Final_Master.mp3',
    relativePath: 'Users\\Admin\\Videos\\Podcasts\\Tech_Talk_Ep42_Final_Master.mp3',
    size: 64000000,
    modified: Date.now() - 3600000 * 120,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Videos'
  },
  {
    id: 'f-product-video',
    name: 'Sorter_Demo_Walkthrough_4K.mp4',
    path: 'C:\\Users\\Admin\\Videos\\Recordings\\Sorter_Demo_Walkthrough_4K.mp4',
    relativePath: 'Users\\Admin\\Videos\\Recordings\\Sorter_Demo_Walkthrough_4K.mp4',
    size: 420000000,
    modified: Date.now() - 3600000 * 45,
    drive: 'C:',
    folderLocation: 'C:\\Users\\Admin\\Videos'
  }
];

// Alias for backwards compatibility
export const SAMPLE_FILES_BENCH = C_DRIVE_SAMPLE_FILES;

/**
 * Generate a complete, realistic C: drive file catalog across all sectors of the computer
 */
export function getGeneratedSampleFiles(count = 85): RawSampleFile[] {
  const result: RawSampleFile[] = [...C_DRIVE_SAMPLE_FILES];
  const templates = [
    { prefix: 'Invoice_TechServices_', ext: '.pdf', size: 180000, dir: 'C:\\Users\\Admin\\Documents\\Invoices', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'Screen_Shot_2024-03-', ext: '.png', size: 840000, dir: 'C:\\Users\\Admin\\Desktop', folder: 'C:\\Users\\Admin\\Desktop' },
    { prefix: 'analytics_export_week_', ext: '.csv', size: 450000, dir: 'C:\\Users\\Admin\\Documents\\Data', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'pitch_deck_series_a_v', ext: '.pptx', size: 6800000, dir: 'C:\\Users\\Admin\\Documents\\Pitch', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'user_component_', ext: '.tsx', size: 12000, dir: 'C:\\Users\\Admin\\source\\repos\\src\\components', folder: 'C:\\Users\\Admin\\source\\repos' },
    { prefix: 'deploy_script_v', ext: '.sh', size: 3400, dir: 'C:\\Users\\Admin\\source\\repos\\scripts', folder: 'C:\\Users\\Admin\\source\\repos' },
    { prefix: 'medical_lab_results_', ext: '.pdf', size: 390000, dir: 'C:\\Users\\Admin\\Documents\\Health', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'residential_lease_addendum_', ext: '.docx', size: 110000, dir: 'C:\\Users\\Admin\\Documents\\Home', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'flight_confirmation_pnr_', ext: '.pdf', size: 280000, dir: 'C:\\Users\\Admin\\Documents\\Travel', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'echt_dinner_menu_spring_', ext: '.pdf', size: 1200000, dir: 'C:\\Users\\Admin\\Documents\\ECHT', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'echt_prep_guide_batch_', ext: '.md', size: 5400, dir: 'C:\\Users\\Admin\\Documents\\ECHT\\Recipes', folder: 'C:\\Users\\Admin\\Documents', content: 'kosher salt, olive oil, prep time: 40m, yield: 12 portions' },
    { prefix: 'debug_crash_dump_', ext: '.log', size: 48000, dir: 'C:\\Windows\\Temp', folder: 'C:\\Windows\\Temp' },
    { prefix: 'cache_temp_file_', ext: '.tmp', size: 14500000, dir: 'C:\\Users\\Admin\\AppData\\Local\\Temp', folder: 'C:\\Users\\Admin\\AppData\\Local\\Temp' },
    { prefix: 'old_client_archive_', ext: '.zip', size: 45000000, dir: 'C:\\Users\\Admin\\Documents\\Archives', folder: 'C:\\Users\\Admin\\Documents' },
    { prefix: 'package_installer_setup_', ext: '.exe', size: 38000000, dir: 'C:\\Users\\Admin\\Downloads', folder: 'C:\\Users\\Admin\\Downloads' }
  ];

  let idCounter = 100;
  while (result.length < count) {
    const t = templates[idCounter % templates.length];
    const num = (idCounter * 17) % 999;
    const name = `${t.prefix}${num}${t.ext}`;
    const fullPath = `${t.dir}\\${name}`;
    const relPath = fullPath.replace('C:\\', '');

    result.push({
      id: `gen-c-${idCounter}`,
      name,
      path: fullPath,
      relativePath: relPath,
      size: Math.floor(t.size * (0.6 + Math.random() * 0.8)),
      modified: Date.now() - Math.floor(Math.random() * 3600000 * 24 * 60),
      sampleContent: t.content,
      drive: 'C:',
      folderLocation: t.folder
    });
    idCounter++;
  }

  return result;
}
