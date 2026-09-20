import React, { useState, useRef, useEffect } from 'react';
import { 
  Zap, 
  Pencil, 
  Layers, 
  Copy, 
  ListTree, 
  Grid2X2, 
  EyeOff, 
  Eye,
  Trash2, 
  ChevronRight,
  Plus,
  Check
} from 'lucide-react';
import { useStore } from '../store';
import { useToast } from './ui/Toast';

interface SectionMenuProps {
  sectionId: string;
  sectionName: string;
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
  onRename: () => void;
  onExpandAllSubtasks?: () => void;
  onCollapseAllSubtasks?: () => void;
  onExpandAllGroups?: () => void;
  onCollapseAllGroups?: () => void;
  hideEmptyGroups: boolean;
  onToggleHideEmptyGroups: () => void;
}

export function SectionMenu({
  sectionId,
  sectionName,
  projectId,
  isOpen,
  onClose,
  onRename,
  onExpandAllSubtasks,
  onCollapseAllSubtasks,
  onExpandAllGroups,
  onCollapseAllGroups,
  hideEmptyGroups,
  onToggleHideEmptyGroups
}: SectionMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const { addSectionAbove, addSectionBelow, duplicateSection, deleteSection } = useStore();
  const { showToast } = useToast();

  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleAddAutomation = (ruleName: string) => {
    showToast(`Rule added to "${sectionName}": ${ruleName}`, 'success');
    onClose();
  };

  const handleAddSectionAbove = () => {
    addSectionAbove(sectionId, 'New Section');
    showToast('New section added above', 'success');
    onClose();
  };

  const handleAddSectionBelow = () => {
    addSectionBelow(sectionId, 'New Section');
    showToast('New section added below', 'success');
    onClose();
  };

  const handleDuplicate = () => {
    duplicateSection(sectionId);
    showToast(`Duplicated section "${sectionName}"`, 'success');
    onClose();
  };

  const handleDelete = () => {
    deleteSection(sectionId);
    showToast(`Deleted section "${sectionName}"`, 'info');
    onClose();
  };

  return (
    <div 
      ref={menuRef}
      className="absolute left-0 top-full mt-1 w-64 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[13px] text-black select-none animate-in fade-in zoom-in-95 duration-100"
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Add automation to section */}
      <div 
        className="relative"
        onMouseEnter={() => setActiveSubmenu('automation')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          onClick={() => setActiveSubmenu(activeSubmenu === 'automation' ? null : 'automation')}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Zap className="w-4 h-4 text-red-500 fill-red-500 shrink-0" />
            <span className="font-medium text-black">Add automation to section</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-black-400" />
        </button>

        {activeSubmenu === 'automation' && (
          <div className="absolute left-full top-0 ml-0.5 w-60 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[12px]">
            <button
              onClick={() => handleAddAutomation('Assign new tasks to me')}
              className="w-full text-left px-3 py-2 hover:bg-black-50 flex items-center gap-2 text-black"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>When task added → Assign to me</span>
            </button>
            <button
              onClick={() => handleAddAutomation('Mark completed tasks Done')}
              className="w-full text-left px-3 py-2 hover:bg-black-50 flex items-center gap-2 text-black"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>When status changes → Notify team</span>
            </button>
            <button
              onClick={() => handleAddAutomation('Set priority based on due date')}
              className="w-full text-left px-3 py-2 hover:bg-black-50 flex items-center gap-2 text-black"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>When due date near → High priority</span>
            </button>
            <div className="border-t border-black-100 my-1" />
            <button
              onClick={() => handleAddAutomation('Custom rule created')}
              className="w-full text-left px-3 py-2 hover:bg-black-50 flex items-center gap-2 text-mp-blue-600 font-medium"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add custom rule...</span>
            </button>
          </div>
        )}
      </div>

      {/* 2. Rename section */}
      <button
        type="button"
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black-50 transition-colors"
      >
        <Pencil className="w-4 h-4 text-black-500 shrink-0" />
        <span className="font-medium text-black">Rename section</span>
      </button>

      {/* 3. Add section > */}
      <div 
        className="relative"
        onMouseEnter={() => setActiveSubmenu('add-section')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          onClick={() => setActiveSubmenu(activeSubmenu === 'add-section' ? null : 'add-section')}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Layers className="w-4 h-4 text-black-500 shrink-0" />
            <span className="font-medium text-black">Add section</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-black-400" />
        </button>

        {activeSubmenu === 'add-section' && (
          <div className="absolute left-full top-0 ml-0.5 w-48 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[12px]">
            <button
              onClick={handleAddSectionAbove}
              className="w-full text-left px-3 py-2 hover:bg-black-50 flex items-center gap-2 text-black"
            >
              <span>Add section above</span>
            </button>
            <button
              onClick={handleAddSectionBelow}
              className="w-full text-left px-3 py-2 hover:bg-black-50 flex items-center gap-2 text-black"
            >
              <span>Add section below</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Duplicate section */}
      <button
        type="button"
        onClick={handleDuplicate}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black-50 transition-colors"
      >
        <Copy className="w-4 h-4 text-black-500 shrink-0" />
        <span className="font-medium text-black">Duplicate section</span>
      </button>

      {/* 5. Expand or collapse subtasks > */}
      <div 
        className="relative"
        onMouseEnter={() => setActiveSubmenu('subtasks')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          onClick={() => setActiveSubmenu(activeSubmenu === 'subtasks' ? null : 'subtasks')}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <ListTree className="w-4 h-4 text-black-500 shrink-0" />
            <span className="font-medium text-black">Expand or collapse subtasks</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-black-400" />
        </button>

        {activeSubmenu === 'subtasks' && (
          <div className="absolute left-full top-0 ml-0.5 w-44 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[12px]">
            <button
              onClick={() => {
                if (onExpandAllSubtasks) onExpandAllSubtasks();
                showToast('All subtasks expanded', 'info');
                onClose();
              }}
              className="w-full text-left px-3 py-2 hover:bg-black-50 text-black"
            >
              Expand all subtasks
            </button>
            <button
              onClick={() => {
                if (onCollapseAllSubtasks) onCollapseAllSubtasks();
                showToast('All subtasks collapsed', 'info');
                onClose();
              }}
              className="w-full text-left px-3 py-2 hover:bg-black-50 text-black"
            >
              Collapse all subtasks
            </button>
          </div>
        )}
      </div>

      {/* 6. Expand or collapse groups > */}
      <div 
        className="relative"
        onMouseEnter={() => setActiveSubmenu('groups')}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          onClick={() => setActiveSubmenu(activeSubmenu === 'groups' ? null : 'groups')}
          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-black-50 transition-colors"
        >
          <div className="flex items-center gap-2.5">
            <Grid2X2 className="w-4 h-4 text-black-500 shrink-0" />
            <span className="font-medium text-black">Expand or collapse groups</span>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-black-400" />
        </button>

        {activeSubmenu === 'groups' && (
          <div className="absolute left-full top-0 ml-0.5 w-44 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[12px]">
            <button
              onClick={() => {
                if (onExpandAllGroups) onExpandAllGroups();
                showToast('All groups expanded', 'info');
                onClose();
              }}
              className="w-full text-left px-3 py-2 hover:bg-black-50 text-black"
            >
              Expand all groups
            </button>
            <button
              onClick={() => {
                if (onCollapseAllGroups) onCollapseAllGroups();
                showToast('All groups collapsed', 'info');
                onClose();
              }}
              className="w-full text-left px-3 py-2 hover:bg-black-50 text-black"
            >
              Collapse all groups
            </button>
          </div>
        )}
      </div>

      {/* 7. Hide all empty groups */}
      <button
        type="button"
        onClick={() => {
          onToggleHideEmptyGroups();
          showToast(hideEmptyGroups ? 'Showing all groups' : 'Hiding empty groups', 'info');
          onClose();
        }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-black-50 transition-colors"
      >
        {hideEmptyGroups ? (
          <Eye className="w-4 h-4 text-black-500 shrink-0" />
        ) : (
          <EyeOff className="w-4 h-4 text-black-500 shrink-0" />
        )}
        <span className="font-medium text-black">
          {hideEmptyGroups ? 'Show all empty groups' : 'Hide all empty groups'}
        </span>
      </button>

      <div className="border-t border-black-100 my-1" />

      {/* 8. Delete section */}
      <button
        type="button"
        onClick={handleDelete}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-red-50 text-red-600 transition-colors"
      >
        <Trash2 className="w-4 h-4 shrink-0 text-red-500" />
        <span className="font-medium">Delete section</span>
      </button>
    </div>
  );
}
