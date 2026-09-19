import { DriveVolumeInfo } from '../types';

export const SYSTEM_DRIVE_C: DriveVolumeInfo = {
  letter: 'C:',
  label: 'Local Disk (C:)',
  mountPoint: 'C:\\',
  fileSystem: 'NTFS',
  totalBytes: 512110190592, // 476.8 GB (512 GB NVMe SSD)
  usedBytes: 305180000000,  // 284.2 GB Used (59.6%)
  freeBytes: 206930190592,  // 192.6 GB Free (40.4%)
  isSystemDrive: true,
  osName: 'Windows 11 Pro 64-bit',
  model: 'Samsung SSD 980 PRO 500GB NVMe M.2',
  systemReservedBytes: 32212254720 // 30 GB Windows Core System32 & Drivers (Permanently Protected)
};

export const SECONDARY_DRIVE_D: DriveVolumeInfo = {
  letter: 'D:',
  label: 'Data Storage (D:)',
  mountPoint: 'D:\\',
  fileSystem: 'NTFS',
  totalBytes: 1000204886016, // 931.5 GB (1 TB HDD)
  usedBytes: 420000000000,   // 391.1 GB Used
  freeBytes: 580204886016,   // 540.4 GB Free
  isSystemDrive: false,
  osName: 'Windows 11 Pro 64-bit',
  model: 'Seagate Barracuda 1TB SATA-III',
  systemReservedBytes: 0
};

export interface DriveSectorLocation {
  id: string;
  name: string;
  path: string;
  description: string;
  type: 'users' | 'temp' | 'system' | 'programs' | 'repos';
  isSafeForCleanup?: boolean;
  isSystemProtected?: boolean;
}

export const C_DRIVE_SECTORS: DriveSectorLocation[] = [
  {
    id: 'users_downloads',
    name: 'Downloads',
    path: 'C:\\Users\\Admin\\Downloads',
    description: 'User browser downloads, web installers, invoices, and temporary packages',
    type: 'users',
    isSafeForCleanup: true
  },
  {
    id: 'users_documents',
    name: 'Documents',
    path: 'C:\\Users\\Admin\\Documents',
    description: 'Work reports, tax files, agreements, spreadsheets, and archives',
    type: 'users'
  },
  {
    id: 'users_desktop',
    name: 'Desktop',
    path: 'C:\\Users\\Admin\\Desktop',
    description: 'Screenshots, quick drafts, untitled notes, and active workspace shortcuts',
    type: 'users'
  },
  {
    id: 'users_appdata_temp',
    name: 'AppData Local Temp',
    path: 'C:\\Users\\Admin\\AppData\\Local\\Temp',
    description: 'Application scratchpad files, installer extractions, crash dumps, and browser cache',
    type: 'temp',
    isSafeForCleanup: true
  },
  {
    id: 'windows_temp',
    name: 'Windows Temp & Logs',
    path: 'C:\\Windows\\Temp',
    description: 'OS installer temp files, Component-Based Servicing logs, and stale system dumps',
    type: 'temp',
    isSafeForCleanup: true
  },
  {
    id: 'users_repos',
    name: 'Source Code Repos',
    path: 'C:\\Users\\Admin\\source\\repos',
    description: 'Developer Git repositories, TypeScript projects, and local environment files',
    type: 'repos'
  },
  {
    id: 'program_files',
    name: 'Program Files',
    path: 'C:\\Program Files',
    description: 'Installed applications, runtime binaries, and software assets',
    type: 'programs'
  },
  {
    id: 'windows_system32',
    name: 'Windows System32 (Core OS)',
    path: 'C:\\Windows\\System32',
    description: 'Windows operating system core binaries and kernel drivers (Permanent Read-Only Lock)',
    type: 'system',
    isSystemProtected: true
  }
];
