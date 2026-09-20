import React, { useState } from 'react';
import { Project } from '../../types';
import { useStore } from '../../store';
import { useToast } from '../ui/Toast';
import { LayoutDashboard, Check, X } from 'lucide-react';
import { Button } from '../ui/Button';

interface SaveTemplateModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function SaveTemplateModal({ project, isOpen, onClose }: SaveTemplateModalProps) {
  const { saveProjectAsTemplate } = useStore();
  const { showToast } = useToast();

  const [templateName, setTemplateName] = useState(`${project.name} Template`);
  const [description, setDescription] = useState(
    project.description || `Standard operating workflow based on ${project.name}`
  );

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!templateName.trim()) return;

    saveProjectAsTemplate(project.id, templateName.trim(), description.trim());
    showToast(`Saved template "${templateName.trim()}"!`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-black-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-black tracking-tight">
                Save as Template
              </h3>
              <p className="text-[12px] text-black-400 mt-0.5">
                Create a reusable blueprint from this project and its tasks
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
              Template Name
            </label>
            <input 
              type="text"
              required
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3.5 py-2 border border-black-200 rounded-xl text-[14px] text-black focus:outline-hidden focus:border-mp-blue-500"
              placeholder="e.g. Website Launch Checklist"
            />
          </div>

          <div>
            <label className="block text-[13px] font-bold text-black mb-1">
              Template Description
            </label>
            <textarea 
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 border border-black-200 rounded-xl text-[13px] text-black focus:outline-hidden focus:border-mp-blue-500 resize-none"
              placeholder="Explain when teammates should use this template..."
            />
          </div>

          <div className="pt-3 border-t border-black-100 flex items-center justify-end gap-2">
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
              <Check className="w-4 h-4" /> Save Template
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
