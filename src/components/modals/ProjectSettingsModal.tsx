import React, { useState } from 'react';
import { Project } from '../../types';
import { useStore } from '../../store';
import { useToast } from '../ui/Toast';
import { Settings, Lock, Globe, Check, X, HeartPulse, Trash2 } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectSettingsModal({ project, isOpen, onClose }: ProjectSettingsModalProps) {
  const { updateProject, setProjectPendingDelete } = useStore();
  const { showToast } = useToast();

  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [isPublic, setIsPublic] = useState(project.isPublic);
  const [health, setHealth] = useState<'On Track' | 'At Risk' | 'Off Track'>(project.health || 'On Track');
  const [statusUpdate, setStatusUpdate] = useState(project.statusUpdate || '');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProject(project.id, {
      name: name.trim(),
      description: description.trim() || undefined,
      isPublic,
      health,
      statusUpdate: statusUpdate.trim() || undefined
    });

    showToast(`Updated settings for "${name.trim()}"`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-black-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-black tracking-tight">
                Project Settings
              </h3>
              <p className="text-[12px] text-black-400 mt-0.5">
                Manage name, description, privacy, and health status
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-black-400 hover:text-black hover:bg-black-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          <div>
            <label className="block text-[13px] font-bold text-black mb-1">
              Project Name
            </label>
            <input 
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 border border-black-200 rounded-xl text-[14px] text-black focus:outline-hidden focus:border-mp-blue-500 focus:ring-2 focus:ring-mp-blue-500/20"
              placeholder="e.g. Website Redesign"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-black mb-1">
              Description
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-black-200 rounded-xl text-[13px] text-black focus:outline-hidden focus:border-mp-blue-500 focus:ring-2 focus:ring-mp-blue-500/20 resize-none"
              placeholder="Describe project purpose and deliverables..."
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-black mb-1.5 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-black-500" /> Project Health
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['On Track', 'At Risk', 'Off Track'] as const).map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setHealth(h)}
                  className={cn(
                    "py-2 px-3 rounded-xl border text-[13px] font-semibold transition-all flex items-center justify-center gap-1.5",
                    health === h
                      ? h === 'On Track'
                        ? "bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-500/20"
                        : h === 'At Risk'
                        ? "bg-amber-50 border-amber-300 text-amber-800 ring-2 ring-amber-500/20"
                        : "bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-500/20"
                      : "border-black-200 hover:bg-black-50 text-black-600"
                  )}
                >
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    h === 'On Track' ? "bg-emerald-500" : h === 'At Risk' ? "bg-amber-500" : "bg-rose-500"
                  )} />
                  {h}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[13px] font-bold text-black mb-1">
              Latest Status Update
            </label>
            <input 
              type="text"
              value={statusUpdate}
              onChange={(e) => setStatusUpdate(e.target.value)}
              className="w-full px-3.5 py-2 border border-black-200 rounded-xl text-[13px] text-black focus:outline-hidden focus:border-mp-blue-500 focus:ring-2 focus:ring-mp-blue-500/20"
              placeholder="e.g. Design reviews complete, frontend sprinting"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-black mb-1.5">
              Privacy & Visibility
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setIsPublic(true)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  isPublic 
                    ? "border-mp-blue-500 bg-mp-blue-50/40 ring-2 ring-mp-blue-500/20" 
                    : "border-black-200 hover:bg-black-50"
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-[13px] text-black">
                  <Globe className="w-4 h-4 text-mp-blue-600" /> Public
                </div>
                <p className="text-[11px] text-black-400 mt-1">
                  Visible to everyone in your workspace
                </p>
              </button>

              <button
                type="button"
                onClick={() => setIsPublic(false)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all",
                  !isPublic 
                    ? "border-mp-blue-500 bg-mp-blue-50/40 ring-2 ring-mp-blue-500/20" 
                    : "border-black-200 hover:bg-black-50"
                )}
              >
                <div className="flex items-center gap-2 font-semibold text-[13px] text-black">
                  <Lock className="w-4 h-4 text-amber-600" /> Private
                </div>
                <p className="text-[11px] text-black-400 mt-1">
                  Only project members can view and edit
                </p>
              </button>
            </div>
          </div>

          <div className="pt-3 border-t border-black-100 flex items-center justify-between gap-2">
            <button
              id="settings-modal-delete-project-btn"
              type="button"
              onClick={() => {
                onClose();
                setProjectPendingDelete(project);
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> Delete Project
            </button>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="text-[13px] h-9 px-4"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="text-[13px] h-9 px-5 gap-1.5 shadow-2xs"
              >
                <Check className="w-4 h-4" /> Save Changes
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
