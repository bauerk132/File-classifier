import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Trash2, 
  Edit2, 
  Check, 
  Plus, 
  Sparkles,
  Layers,
  FolderTree
} from 'lucide-react';
import { UserProfile, Taxonomy } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profiles: UserProfile[];
  activeProfileId: string;
  onSelectProfile: (id: string) => void;
  onCreateProfile: (name: string, description: string) => void;
  onDuplicateProfile: (sourceId: string, newName: string) => void;
  onDeleteProfile: (id: string) => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  profiles,
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  onDuplicateProfile,
  onDeleteProfile
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDesc, setNewProfileDesc] = useState('');

  if (!isOpen) return null;

  const handleCreate = () => {
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim(), newProfileDesc.trim());
    setIsCreating(false);
    setNewProfileName('');
    setNewProfileDesc('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#0C1019] border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] text-slate-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-[#0F1420] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <FolderTree className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Taxonomy Profile Manager</h3>
              <p className="text-xs text-slate-400">Switch or duplicate personalized classification rule profiles</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available Profiles</span>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New Profile</span>
              </button>
            )}
          </div>

          {/* Create new profile input */}
          {isCreating && (
            <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 space-y-3 text-xs">
              <div className="font-bold text-white">Create New Classification Profile</div>
              <input
                type="text"
                value={newProfileName}
                onChange={(e) => setNewProfileName(e.target.value)}
                placeholder="Profile Name (e.g. Photography Workstation, Legal Archive)"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
                autoFocus
              />
              <input
                type="text"
                value={newProfileDesc}
                onChange={(e) => setNewProfileDesc(e.target.value)}
                placeholder="Short description..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white"
              />
              <div className="flex justify-end gap-2 pt-1">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="px-4 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold"
                >
                  Create
                </button>
              </div>
            </div>
          )}

          {/* Profiles list */}
          <div className="space-y-2.5">
            {profiles.map(p => {
              const isActive = p.id === activeProfileId;
              return (
                <div
                  key={p.id}
                  className={`p-4 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                    isActive 
                      ? 'bg-cyan-950/20 border-cyan-500/60 shadow-md' 
                      : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{p.name}</span>
                      {isActive && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                          Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">{p.description}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      Last edited {new Date(p.updatedAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isActive && (
                      <button
                        onClick={() => {
                          onSelectProfile(p.id);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 hover:text-slate-950 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                      >
                        Activate
                      </button>
                    )}

                    <button
                      onClick={() => onDuplicateProfile(p.id, `${p.name} (Copy)`)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                      title="Duplicate profile"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    {profiles.length > 1 && (
                      <button
                        onClick={() => onDeleteProfile(p.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        title="Delete profile"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-[#0F1420] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
