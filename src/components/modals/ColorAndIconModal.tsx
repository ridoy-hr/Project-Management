import React, { useState } from 'react';
import { Project } from '../../types';
import { useStore } from '../../store';
import { useToast } from '../ui/Toast';
import { 
  Palette, Check, X, Folder, Rocket, Target, 
  CheckSquare, Zap, Globe, Sparkles, Layers, 
  Briefcase, Code, Bookmark, Heart 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface ColorAndIconModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

const COLOR_OPTIONS = [
  { name: 'Teal Blue', value: 'bg-[#407B88]' },
  { name: 'myPeople Blue', value: 'bg-mp-blue-500' },
  { name: 'Emerald Green', value: 'bg-emerald-500' },
  { name: 'Mint Green', value: 'bg-mp-green-500' },
  { name: 'Indigo', value: 'bg-indigo-500' },
  { name: 'Purple', value: 'bg-purple-500' },
  { name: 'Rose', value: 'bg-rose-500' },
  { name: 'Amber', value: 'bg-amber-500' },
  { name: 'Orange', value: 'bg-orange-500' },
  { name: 'Cyan', value: 'bg-cyan-500' },
  { name: 'Dark Slate', value: 'bg-slate-700' },
  { name: 'Neutral Gray', value: 'bg-black-600' },
];

const ICON_OPTIONS = [
  { id: 'folder', name: 'Folder', icon: Folder },
  { id: 'rocket', name: 'Rocket', icon: Rocket },
  { id: 'target', name: 'Target', icon: Target },
  { id: 'check-square', name: 'Tasks', icon: CheckSquare },
  { id: 'zap', name: 'Zap', icon: Zap },
  { id: 'globe', name: 'Globe', icon: Globe },
  { id: 'sparkles', name: 'Sparkles', icon: Sparkles },
  { id: 'layers', name: 'Layers', icon: Layers },
  { id: 'briefcase', name: 'Briefcase', icon: Briefcase },
  { id: 'code', name: 'Code', icon: Code },
  { id: 'bookmark', name: 'Bookmark', icon: Bookmark },
  { id: 'heart', name: 'Heart', icon: Heart },
];

export function ColorAndIconModal({ project, isOpen, onClose }: ColorAndIconModalProps) {
  const { updateProject } = useStore();
  const { showToast } = useToast();

  const [selectedColor, setSelectedColor] = useState(project.color || 'bg-[#407B88]');
  const [selectedIcon, setSelectedIcon] = useState(project.icon || 'folder');

  if (!isOpen) return null;

  const handleSave = () => {
    updateProject(project.id, {
      color: selectedColor,
      icon: selectedIcon
    });
    showToast(`Updated color and icon for "${project.name}"`, 'success');
    onClose();
  };

  const SelectedIconComp = ICON_OPTIONS.find(i => i.id === selectedIcon)?.icon || Folder;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-black-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl text-white flex items-center justify-center shadow-xs transition-colors", selectedColor)}>
              <SelectedIconComp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-black tracking-tight">
                Set Color & Icon
              </h3>
              <p className="text-[12px] text-black-400 mt-0.5">
                Customize project appearance in sidebar & header
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

        <div className="p-6 space-y-5">
          {/* Color swatches */}
          <div>
            <h4 className="text-[12px] font-bold text-black-500 uppercase tracking-wider mb-2.5">
              Select Color
            </h4>
            <div className="grid grid-cols-6 gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setSelectedColor(c.value)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-transform hover:scale-105 shadow-2xs",
                    c.value,
                    selectedColor === c.value && "ring-3 ring-black/20 scale-105"
                  )}
                  title={c.name}
                >
                  {selectedColor === c.value && <Check className="w-4 h-4 text-white drop-shadow-xs" />}
                </button>
              ))}
            </div>
          </div>

          {/* Icon picker */}
          <div>
            <h4 className="text-[12px] font-bold text-black-500 uppercase tracking-wider mb-2.5">
              Select Icon
            </h4>
            <div className="grid grid-cols-6 gap-2">
              {ICON_OPTIONS.map((item) => {
                const Icon = item.icon;
                const isSelected = selectedIcon === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedIcon(item.id)}
                    className={cn(
                      "p-2.5 rounded-xl border flex flex-col items-center justify-center transition-colors",
                      isSelected 
                        ? "border-mp-blue-500 bg-mp-blue-50/50 text-mp-blue-600 font-bold" 
                        : "border-black-100 hover:border-black-300 text-black-600 hover:bg-black-50"
                    )}
                    title={item.name}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-black-50/60 border-t border-black-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-[13px] h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="text-[13px] h-9 px-5 gap-1.5 shadow-2xs"
          >
            <Check className="w-4 h-4" /> Apply Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
