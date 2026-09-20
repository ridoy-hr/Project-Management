import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Project } from '../../types';
import { useStore } from '../../store';
import { Trash2, AlertTriangle, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';
import { cn } from '../../lib/utils';

interface DeleteProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteProjectModal({ project, isOpen, onClose, onConfirm }: DeleteProjectModalProps) {
  const { tasks } = useStore();
  const { showToast } = useToast();

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  const projectTasks = tasks.filter(t => t.projectIds.includes(project.id));
  const sectionsCount = project.sections?.length || 0;

  const modalContent = (
    <div 
      id="delete-project-modal-backdrop"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        id="delete-project-modal-card"
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="w-12 h-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
              <Trash2 className="w-6 h-6" />
            </div>
            <button 
              id="delete-project-close-button"
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-black-400 hover:text-black hover:bg-black-50 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="mt-4">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn("w-3 h-3 rounded-full shrink-0", project.color || 'bg-mp-blue-default')} />
              <span className="text-[12px] font-semibold text-black-500 uppercase tracking-wider">Project Removal</span>
            </div>
            <h3 className="text-[19px] font-bold text-black tracking-tight">
              Delete &ldquo;{project.name}&rdquo;?
            </h3>
            <p className="text-[13px] text-black-600 mt-2 leading-relaxed">
              This will permanently delete <strong className="text-black font-semibold">{project.name}</strong> along with its{' '}
              <span className="text-black font-semibold">{projectTasks.length} {projectTasks.length === 1 ? 'task' : 'tasks'}</span> and{' '}
              <span className="text-black font-semibold">{sectionsCount} {sectionsCount === 1 ? 'section' : 'sections'}</span>.
            </p>
            
            <div className="mt-4 p-3 bg-amber-50 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-amber-900 text-[12px]">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>This action cannot be undone. All custom fields, subtasks, comments, and attachments in this project will be deleted.</span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-black-50/60 border-t border-black-100 flex items-center justify-end gap-2.5">
          <Button
            id="delete-project-cancel-button"
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-[13px] h-9 px-4 cursor-pointer"
          >
            Cancel
          </Button>
          <button
            id="delete-project-confirm-button"
            type="button"
            onClick={() => {
              onConfirm();
              showToast(`Deleted "${project.name}"`, 'error');
              onClose();
            }}
            className="inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold h-9 px-4 rounded-lg bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white shadow-xs transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete Project
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
