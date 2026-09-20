import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Project } from '../types';
import { useStore } from '../store';
import { useToast } from './ui/Toast';
import { 
  Settings, Users, Star, ChevronRight, Link, 
  Copy, LayoutDashboard, FolderPlus, Download, 
  Upload, Archive, Trash2, Check, FileSpreadsheet,
  FileCode, RefreshCw
} from 'lucide-react';
import { cn } from '../lib/utils';
import { ImportTasksModal } from './modals/ImportTasksModal';
import { ProjectSettingsModal } from './modals/ProjectSettingsModal';
import { ProjectPermissionsModal } from './modals/ProjectPermissionsModal';
import { ColorAndIconModal } from './modals/ColorAndIconModal';
import { AddToPortfolioModal } from './modals/AddToPortfolioModal';
import { SaveTemplateModal } from './modals/SaveTemplateModal';
import { GoogleSheetSyncModal } from './modals/GoogleSheetSyncModal';
import { parseTasksFromSpreadsheet } from '../lib/csvParser';

interface ProjectDropdownMenuProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToProject?: (projectId: string) => void;
  onProjectDeleted?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function ProjectDropdownMenu({
  project,
  isOpen,
  onClose,
  onNavigateToProject,
  onProjectDeleted,
  className,
  style
}: ProjectDropdownMenuProps) {
  const { 
    tasks, users, deleteProject, duplicateProject, 
    toggleArchiveProject, importTasksToProject,
    setProjectPendingDelete
  } = useStore();
  const { showToast } = useToast();

  // Modals state
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isColorModalOpen, setIsColorModalOpen] = useState(false);
  const [isPortfolioModalOpen, setIsPortfolioModalOpen] = useState(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false);
  const [isGoogleSheetModalOpen, setIsGoogleSheetModalOpen] = useState(false);

  // Submenu states
  const [activeSubmenu, setActiveSubmenu] = useState<'none' | 'import' | 'export' | 'color'>('none');
  const directFileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen && !isImportModalOpen && !isSettingsModalOpen && 
      !isPermissionsModalOpen && !isColorModalOpen && !isPortfolioModalOpen && !isTemplateModalOpen && !isGoogleSheetModalOpen) {
    return null;
  }

  // Handle Copy Project Link
  const handleCopyLink = async () => {
    try {
      const url = `${window.location.origin}${window.location.pathname}?project=${project.id}`;
      await navigator.clipboard.writeText(url);
      showToast('Project link copied to clipboard!', 'success');
    } catch {
      showToast('Copied project reference to clipboard', 'info');
    }
    onClose();
  };

  // Handle Duplicate Project
  const handleDuplicate = () => {
    const newProjectId = duplicateProject(project.id);
    showToast(`Project duplicated as "${project.name} (Copy)"`, 'success');
    onClose();
    if (onNavigateToProject) {
      onNavigateToProject(newProjectId);
    }
  };

  // Handle Archive Project
  const handleArchive = () => {
    toggleArchiveProject(project.id);
    showToast(project.isArchived ? `Unarchived ${project.name}` : `Archived ${project.name}`, 'info');
    onClose();
  };

  // Export as CSV
  const handleExportCSV = () => {
    const projectTasks = tasks.filter(t => t.projectIds.includes(project.id));
    if (projectTasks.length === 0) {
      showToast('No tasks to export in this project', 'info');
      onClose();
      return;
    }

    const exportData = projectTasks.map(t => {
      const assignee = users.find(u => u.id === t.assigneeId);
      const section = (project.sections || []).find(s => s.id === t.sectionId);
      return {
        'Task Name': t.title,
        'Description': t.description || '',
        'Status': t.status,
        'Priority': t.priority,
        'Due Date': t.dueDate || '',
        'Assignee': assignee?.name || '',
        'Section': section?.name || '',
        'Completed': t.status === 'Done' ? 'Yes' : 'No'
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, `${project.name.toLowerCase().replace(/\s+/g, '-')}-tasks.csv`);
    showToast('Exported tasks to CSV', 'success');
    onClose();
  };

  // Export as JSON
  const handleExportJSON = () => {
    const projectTasks = tasks.filter(t => t.projectIds.includes(project.id));
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({
      project,
      tasks: projectTasks
    }, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${project.name.toLowerCase().replace(/\s+/g, '-')}-export.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported project data to JSON', 'success');
    onClose();
  };

  // Direct file input change (immediate import)
  const handleDirectFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsed = await parseTasksFromSpreadsheet(file);
      if (parsed.length > 0) {
        const added = importTasksToProject(project.id, parsed);
        showToast(`Imported and saved ${added} tasks into ${project.name}!`, 'success');
      } else {
        showToast('No readable tasks found in file', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to parse file. Opening file importer...', 'error');
      setIsImportModalOpen(true);
    }

    if (directFileInputRef.current) directFileInputRef.current.value = '';
    onClose();
  };

  return (
    <>
      {/* Hidden file input for direct file upload */}
      <input
        ref={directFileInputRef}
        type="file"
        accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
        onChange={handleDirectFileChange}
        className="hidden"
      />

      {/* Main Dropdown Menu */}
      {isOpen && (
        <div 
          style={style}
          className={cn(
            "w-64 bg-white border border-black-200 shadow-xl rounded-xl z-50 py-1.5 animate-in fade-in duration-100 select-none",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Edit project settings */}
          <button 
            type="button"
            onClick={() => {
              setIsSettingsModalOpen(true);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Settings className="w-4 h-4 text-black-500" /> Edit project settings
          </button>

          {/* 2. Manage project permissions */}
          <button 
            type="button"
            onClick={() => {
              setIsPermissionsModalOpen(true);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-black-500" /> Manage project permissions
            </div>
            <Star className="w-3.5 h-3.5 text-yellow-500" />
          </button>

          {/* 3. Set color & icon */}
          <button 
            type="button"
            onClick={() => {
              setIsColorModalOpen(true);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className={cn("w-4 h-4 rounded shadow-2xs", project.color)} /> Set color & icon
            </div>
            <ChevronRight className="w-4 h-4 text-black-400" />
          </button>

          <div className="my-1 border-t border-black-100" />

          {/* 4. Copy project link */}
          <button 
            type="button"
            onClick={handleCopyLink}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Link className="w-4 h-4 text-black-500" /> Copy project link
          </button>

          {/* 5. Duplicate */}
          <button 
            type="button"
            onClick={handleDuplicate}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Copy className="w-4 h-4 text-black-500" /> Duplicate
          </button>

          {/* 6. Save as template */}
          <button 
            type="button"
            onClick={() => {
              setIsTemplateModalOpen(true);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <LayoutDashboard className="w-4 h-4 text-black-500" /> Save as template
          </button>

          {/* 7. Add to portfolio */}
          <button 
            type="button"
            onClick={() => {
              setIsPortfolioModalOpen(true);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-black-500" /> Add to portfolio
            </div>
            <Star className="w-3.5 h-3.5 text-yellow-500" />
          </button>

          <div className="my-1 border-t border-black-100" />

          {/* 8. Import with hover/click options */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveSubmenu('import')}
            onMouseLeave={() => setActiveSubmenu('none')}
          >
            <button 
              type="button"
              onClick={() => {
                setIsImportModalOpen(true);
                onClose();
              }}
              className={cn(
                "w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center justify-between cursor-pointer transition-colors",
                activeSubmenu === 'import' && "bg-black-50 text-mp-blue-600"
              )}
            >
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-black-500" /> Import
              </div>
              <ChevronRight className="w-4 h-4 text-black-400" />
            </button>

            {activeSubmenu === 'import' && (
              <div className="absolute left-full top-0 ml-1 w-56 bg-white border border-black-200 shadow-xl rounded-xl py-1 z-[60] animate-in fade-in duration-75">
                <button
                  type="button"
                  onClick={() => {
                    setIsImportModalOpen(true);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] text-black hover:bg-black-50 flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-mp-blue-600" /> CSV or Excel spreadsheet
                </button>
                <button
                  type="button"
                  onClick={() => {
                    directFileInputRef.current?.click();
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] text-black hover:bg-black-50 flex items-center gap-2 font-medium border-t border-black-50"
                >
                  <Upload className="w-4 h-4 text-emerald-600" /> Quick upload file (.csv, .xlsx)
                </button>
              </div>
            )}
          </div>

          {/* 9. Export or sync */}
          <div 
            className="relative"
            onMouseEnter={() => setActiveSubmenu('export')}
            onMouseLeave={() => setActiveSubmenu('none')}
          >
            <button 
              type="button"
              onClick={() => setActiveSubmenu(activeSubmenu === 'export' ? 'none' : 'export')}
              className={cn(
                "w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center justify-between cursor-pointer transition-colors",
                activeSubmenu === 'export' && "bg-black-50 text-mp-blue-600"
              )}
            >
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-black-500" /> Export or sync
              </div>
              <ChevronRight className="w-4 h-4 text-black-400" />
            </button>

            {activeSubmenu === 'export' && (
              <div className="absolute left-full top-0 ml-1 w-52 bg-white border border-black-200 shadow-xl rounded-xl py-1 z-[60] animate-in fade-in duration-75">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="w-full text-left px-3 py-2 text-[12px] text-black hover:bg-black-50 flex items-center gap-2 font-medium"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Export as CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportJSON}
                  className="w-full text-left px-3 py-2 text-[12px] text-black hover:bg-black-50 flex items-center gap-2 font-medium"
                >
                  <FileCode className="w-4 h-4 text-mp-blue-600" /> Export as JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsGoogleSheetModalOpen(true);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] text-black hover:bg-emerald-50 flex items-center gap-2 font-medium text-emerald-700"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> Google Sheets (Live 2-Way)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Project synchronized with cloud workspace', 'info');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 text-[12px] text-black hover:bg-black-50 flex items-center gap-2 font-medium border-t border-black-50"
                >
                  <RefreshCw className="w-4 h-4 text-black-400" /> Sync status
                </button>
              </div>
            )}
          </div>

          {/* 10. Google Sheet 2-Way Sync (Asana Mode) */}
          <button 
            type="button"
            onClick={() => {
              setIsGoogleSheetModalOpen(true);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-emerald-50 flex items-center justify-between cursor-pointer transition-colors"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> 
              <span className="font-medium">
                {project.connectedSheet ? 'Google Sheet Sync' : 'Connect Google Sheet'}
              </span>
            </div>
            {project.connectedSheet ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-semibold px-1.5 py-0.5 rounded-full">
                Connected
              </span>
            ) : (
              <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium px-1.5 py-0.5 rounded-md">
                2-Way
              </span>
            )}
          </button>

          {/* 11. Archive */}
          <button 
            type="button"
            onClick={handleArchive}
            className="w-full text-left px-3 py-1.5 text-[13px] text-black hover:bg-black-50 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Archive className="w-4 h-4 text-black-500" /> {project.isArchived ? 'Unarchive' : 'Archive'}
          </button>

          <div className="my-1 border-t border-black-100" />

          {/* 11. Delete project (Confirmation popup) */}
          <button 
            id="menu-delete-project-btn"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setProjectPendingDelete(project);
              onClose();
            }}
            className="w-full text-left px-3 py-1.5 text-[13px] text-red-600 hover:bg-red-50 flex items-center gap-2 cursor-pointer transition-colors"
          >
            <Trash2 className="w-4 h-4" /> Delete project
          </button>
        </div>
      )}

      {/* Confirmation Dialogs & Modals */}
      <ImportTasksModal
        project={project}
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />

      <ProjectSettingsModal
        project={project}
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />

      <ProjectPermissionsModal
        project={project}
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
      />

      <ColorAndIconModal
        project={project}
        isOpen={isColorModalOpen}
        onClose={() => setIsColorModalOpen(false)}
      />

      <AddToPortfolioModal
        project={project}
        isOpen={isPortfolioModalOpen}
        onClose={() => setIsPortfolioModalOpen(false)}
      />

      <SaveTemplateModal
        project={project}
        isOpen={isTemplateModalOpen}
        onClose={() => setIsTemplateModalOpen(false)}
      />

      <GoogleSheetSyncModal
        project={project}
        isOpen={isGoogleSheetModalOpen}
        onClose={() => setIsGoogleSheetModalOpen(false)}
        onToast={showToast}
      />
    </>
  );
}
