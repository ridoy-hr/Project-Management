import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Project } from '../../types';
import { useStore } from '../../store';
import { useToast } from '../ui/Toast';
import { 
  Upload, FileSpreadsheet, Check, AlertCircle, 
  X, Download, ArrowRight, Table, Sparkles
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { parseTasksFromSpreadsheet, ParsedCsvTask } from '../../lib/csvParser';

interface ImportTasksModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onImportComplete?: (count: number) => void;
}

export function ImportTasksModal({ project, isOpen, onClose, onImportComplete }: ImportTasksModalProps) {
  const { importTasksToProject, users } = useStore();
  const { showToast } = useToast();
  
  const [dragActive, setDragActive] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedCsvTask[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const processFile = async (file: File) => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);

    try {
      const tasksList = await parseTasksFromSpreadsheet(file);
      setParsedRows(tasksList);
    } catch (err: unknown) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to parse file. Please upload a valid CSV or Excel file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleConfirmImport = () => {
    if (parsedRows.length === 0) return;
    const addedCount = importTasksToProject(project.id, parsedRows);
    showToast(`Successfully imported ${addedCount} tasks into ${project.name}!`, 'success');
    if (onImportComplete) {
      onImportComplete(addedCount);
    }
    onClose();
  };

  const downloadSampleTemplate = () => {
    const sampleData = [
      {
        'Task Name': 'Implement responsive navigation',
        'Description': 'Update mobile drawer and desktop topbar breakpoints',
        'Status': 'In Progress',
        'Priority': 'High',
        'Due Date': '2026-09-25',
        'Assignee': users[0]?.name || 'Alex Morgan',
        'Section': 'Core Infrastructure & UX'
      },
      {
        'Task Name': 'Optimize asset bundle size',
        'Description': 'Run code-splitting pass and tree shake unused lucide icons',
        'Status': 'To Do',
        'Priority': 'Medium',
        'Due Date': '2026-09-30',
        'Assignee': users[1]?.name || 'Taylor Chen',
        'Section': 'Testing & Rollout'
      },
      {
        'Task Name': 'QA accessibility pass',
        'Description': 'Verify keyboard navigation and screen reader tags',
        'Status': 'To Do',
        'Priority': 'Low',
        'Due Date': '2026-10-05',
        'Assignee': users[2]?.name || 'Jordan Lee',
        'Section': 'Testing & Rollout'
      }
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tasks');
    XLSX.writeFile(wb, `sample-tasks-template.csv`);
    showToast('Downloaded sample CSV template', 'info');
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-black-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-black tracking-tight flex items-center gap-2">
                Import Tasks to {project.name}
              </h3>
              <p className="text-[12px] text-black-400 mt-0.5">
                Upload a CSV or Excel spreadsheet (.xlsx, .xls) with task details
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

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-150 flex flex-col items-center justify-center",
              dragActive 
                ? "border-mp-blue-500 bg-mp-blue-50/50 scale-[0.99]" 
                : "border-black-200 hover:border-mp-blue-400 hover:bg-black-50/40 bg-[#FAFAFB]"
            )}
          >
            <input 
              ref={fileInputRef}
              type="file"
              accept=".csv, .xlsx, .xls, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-black-100 flex items-center justify-center text-mp-blue-600 mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-[14px] font-semibold text-black">
              Click to browse or drag & drop spreadsheet
            </p>
            <p className="text-[12px] text-black-400 mt-1">
              Supports CSV, Excel (.xlsx, .xls) with standard columns
            </p>

            {fileName && (
              <div className="mt-3 px-3 py-1.5 bg-white border border-black-200 rounded-lg text-[12px] font-medium text-black flex items-center gap-2 shadow-2xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                <span>Selected: {fileName}</span>
              </div>
            )}
          </div>

          {/* Quick template guide */}
          <div className="flex items-center justify-between text-[12px] text-black-500 bg-black-50/70 p-3 rounded-xl border border-black-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-mp-blue-600" />
              <span>Columns recognized: <strong>Task Name, Description, Status, Priority, Due Date, Assignee, Section</strong></span>
            </div>
            <button
              type="button"
              onClick={downloadSampleTemplate}
              className="text-mp-blue-600 hover:text-mp-blue-700 font-semibold flex items-center gap-1 hover:underline shrink-0"
            >
              <Download className="w-3.5 h-3.5" /> Sample CSV
            </button>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-[13px] flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Parsed Preview */}
          {parsedRows.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-[13px] font-bold text-black flex items-center gap-2">
                  <Table className="w-4 h-4 text-black-500" />
                  Ready to import ({parsedRows.length} tasks detected)
                </h4>
                <span className="text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold">
                  Valid spreadsheet
                </span>
              </div>

              <div className="border border-black-100 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-black-100">
                {parsedRows.slice(0, 15).map((row, idx) => (
                  <div key={idx} className="p-2.5 px-3.5 flex items-center justify-between text-[12px] hover:bg-black-50/50">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-semibold text-black truncate">{row.title}</p>
                      {row.description && (
                        <p className="text-black-400 text-[11px] truncate">{row.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {row.sectionName && (
                        <span className="text-[10px] bg-black-100 text-black-600 px-2 py-0.5 rounded-md font-medium">
                          {row.sectionName}
                        </span>
                      )}
                      <Badge 
                        variant={row.priority === 'High' ? 'error' : row.priority === 'Medium' ? 'alert' : 'default'} 
                        className="text-[10px] py-0 px-1.5"
                      >
                        {row.priority}
                      </Badge>
                      <span className="text-[11px] text-black-400">
                        {row.dueDate || 'No due date'}
                      </span>
                    </div>
                  </div>
                ))}
                {parsedRows.length > 15 && (
                  <div className="p-2 text-center text-[11px] text-black-400 bg-black-50">
                    + {parsedRows.length - 15} more tasks in file
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black-50/60 border-t border-black-100 flex items-center justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-[13px] h-9 px-4"
          >
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirmImport}
              disabled={parsedRows.length === 0 || isLoading}
              className={cn(
                "inline-flex items-center justify-center gap-1.5 text-[13px] font-semibold h-9 px-4 rounded-lg text-white shadow-xs transition-colors",
                parsedRows.length > 0 && !isLoading
                  ? "bg-mp-blue-600 hover:bg-mp-blue-700 cursor-pointer"
                  : "bg-black-300 cursor-not-allowed"
              )}
            >
              <Check className="w-4 h-4" />
              Import {parsedRows.length > 0 ? `${parsedRows.length} Tasks` : 'Tasks'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
