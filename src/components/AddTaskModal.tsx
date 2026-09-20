import React, { useState, useRef } from 'react';
import { Task, Status, Priority, Attachment } from '../types';
import { useStore } from '../store';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { 
  X, Calendar, User as UserIcon, Tag, AlignLeft, CheckSquare, 
  ListTodo, Plus, Trash2, Lock, Globe, Paperclip, Upload, FileText 
} from 'lucide-react';
import { cn } from '../lib/utils';

interface AddTaskModalProps {
  onClose: () => void;
  defaultProjectId?: string;
  defaultSectionId?: string;
  defaultIsMilestone?: boolean;
  defaultIsApproval?: boolean;
}

export function AddTaskModal({ 
  onClose, defaultProjectId, defaultSectionId, 
  defaultIsMilestone = false, defaultIsApproval = false 
}: AddTaskModalProps) {
  const { addTask, users, projects, tasks, currentUser } = useStore();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<Status>('To Do');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [assigneeId, setAssigneeId] = useState<string>(currentUser.id);
  const [dueDate, setDueDate] = useState<string>('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(
    defaultProjectId ? [defaultProjectId] : (projects[0] ? [projects[0].id] : [])
  );
  const [sectionId, setSectionId] = useState<string | undefined>(defaultSectionId);
  const [isMilestone, setIsMilestone] = useState<boolean>(defaultIsMilestone);
  const [isApproval, setIsApproval] = useState<boolean>(defaultIsApproval);
  const [isPrivate, setIsPrivate] = useState<boolean>(true);
  const [dependencyIds, setDependencyIds] = useState<string[]>([]);
  const [subtasks, setSubtasks] = useState<{ id: string; title: string; isCompleted: boolean }[]>([]);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAddSubtask = () => {
    if (newSubtaskText.trim()) {
      setSubtasks([...subtasks, { id: `sub_${Date.now()}`, title: newSubtaskText.trim(), isCompleted: false }]);
      setNewSubtaskText('');
    }
  };

  const handleRemoveSubtask = (id: string) => {
    setSubtasks(subtasks.filter(s => s.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file: File) => {
      const newAtt: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString()
      };
      setAttachments(prev => [...prev, newAtt]);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(attachments.filter(a => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim()) {
      addTask({
        title: title.trim(),
        description: description.trim() || undefined,
        status,
        priority,
        isMilestone,
        isApproval,
        sectionId: sectionId || undefined,
        projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : (projects[0] ? [projects[0].id] : []),
        assigneeId: assigneeId || undefined,
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        isPrivate,
        dependencyIds,
        collaboratorIds: [currentUser.id, ...(assigneeId && assigneeId !== currentUser.id ? [assigneeId] : [])],
        subtasks,
        attachments
      });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-[620px] max-h-[90vh] shadow-2xl border border-black-200 flex flex-col relative overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-black-200 shrink-0">
          <div>
            <h2 className="text-[18px] font-bold text-black">Create New Task</h2>
            <p className="text-[12px] text-black-400">Specify details, dependencies, assignees, and projects</p>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-black-400 hover:text-black hover:bg-black-50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-black">
          
          {/* Title */}
          <div>
            <label className="block text-[13px] font-semibold text-black-600 mb-1">
              Task Title <span className="text-error-text">*</span>
            </label>
            <input 
              autoFocus
              type="text" 
              required
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-black-50 border border-black-200 rounded-xl px-3.5 py-2.5 text-[14px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-all"
              placeholder="e.g. Prepare presentation for stakeholders"
            />
          </div>

          {/* Assignee & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-black-600 mb-1 flex items-center gap-1.5">
                <UserIcon className="w-3.5 h-3.5 text-black-400" /> Assignee
              </label>
              <select 
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-black-50 border border-black-200 rounded-xl px-3 py-2 text-[13px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">Unassigned</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-[13px] font-semibold text-black-600 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-black-400" /> Due Date
              </label>
              <input 
                type="date" 
                value={dueDate} 
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-black-50 border border-black-200 rounded-xl px-3 py-2 text-[13px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-colors cursor-pointer"
              />
            </div>
          </div>

          {/* Status & Priority Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-black-600 mb-1">Status</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as Status)}
                className="w-full bg-black-50 border border-black-200 rounded-xl px-3 py-2 text-[13px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="To Do">To Do</option>
                <option value="In Progress">In Progress</option>
                <option value="Review">Review</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div>
              <label className="block text-[13px] font-semibold text-black-600 mb-1">Priority</label>
              <select 
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full bg-black-50 border border-black-200 rounded-xl px-3 py-2 text-[13px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="Low">Low Priority</option>
                <option value="Medium">Medium Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          {/* Projects Multi-Select */}
          <div>
            <label className="block text-[13px] font-semibold text-black-600 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-black-400" /> Projects
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-black-50 border border-black-200 rounded-xl">
              {projects.map(p => {
                const isSelected = selectedProjectIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id));
                      } else {
                        setSelectedProjectIds([...selectedProjectIds, p.id]);
                      }
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[12px] font-medium transition-all flex items-center gap-1.5",
                      isSelected 
                        ? "bg-black text-white shadow-xs" 
                        : "bg-white text-black-600 border border-black-200 hover:border-black-400"
                    )}
                  >
                    <span className={cn("w-2 h-2 rounded-full shrink-0", p.color)}></span>
                    {p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section & Milestone Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[13px] font-semibold text-black-600 mb-1">
                Project Section
              </label>
              <select
                value={sectionId || ''}
                onChange={(e) => setSectionId(e.target.value || undefined)}
                className="w-full bg-black-50 border border-black-200 rounded-xl px-3 py-2 text-[13px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-colors cursor-pointer"
              >
                <option value="">No Section (Default)</option>
                {selectedProjectIds.flatMap(pId => {
                  const p = projects.find(proj => proj.id === pId);
                  return (p?.sections || []).map(sec => (
                    <option key={sec.id} value={sec.id}>
                      {p?.name}: {sec.name}
                    </option>
                  ));
                })}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isMilestone}
                  onChange={(e) => setIsMilestone(e.target.checked)}
                  className="w-4 h-4 rounded border-black-300 text-mp-blue-600 focus:ring-0"
                />
                <span className="text-[13px] font-semibold text-black-700">
                  Mark as Milestone (e.g. key event or deadline)
                </span>
              </label>
            </div>
          </div>

          {/* Dependencies */}
          <div>
            <label className="block text-[13px] font-semibold text-black-600 mb-1 flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-black-400" /> Dependencies (Optional)
            </label>
            <select
              value=""
              onChange={(e) => {
                if (e.target.value && !dependencyIds.includes(e.target.value)) {
                  setDependencyIds([...dependencyIds, e.target.value]);
                }
              }}
              className="w-full bg-black-50 border border-black-200 rounded-xl px-3 py-2 text-[13px] font-medium text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-colors cursor-pointer"
            >
              <option value="">+ Select a blocking prerequisite task...</option>
              {tasks.filter(t => !dependencyIds.includes(t.id)).map(t => (
                <option key={t.id} value={t.id}>{t.title} ({t.status})</option>
              ))}
            </select>
            {dependencyIds.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {dependencyIds.map(depId => {
                  const depTask = tasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  return (
                    <span key={depId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[12px] bg-black-100 text-black">
                      <span className="font-medium">{depTask.title}</span>
                      <button 
                        type="button"
                        onClick={() => setDependencyIds(dependencyIds.filter(id => id !== depId))}
                        className="hover:text-error-text"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-[13px] font-semibold text-black-600 mb-1 flex items-center gap-1.5">
              <AlignLeft className="w-3.5 h-3.5 text-black-400" /> Description
            </label>
            <textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Provide background, expectations, and context..."
              className="w-full bg-black-50 border border-black-200 rounded-xl p-3 text-[13px] text-black focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Subtasks */}
          <div>
            <label className="block text-[13px] font-semibold text-black-600 mb-1 flex items-center gap-1.5">
              <ListTodo className="w-3.5 h-3.5 text-black-400" /> Subtasks
            </label>
            <div className="space-y-1.5 mb-2">
              {subtasks.map(s => (
                <div key={s.id} className="flex items-center justify-between px-3 py-1.5 bg-black-50 rounded-lg text-[13px]">
                  <span className="text-black">{s.title}</span>
                  <button type="button" onClick={() => handleRemoveSubtask(s.id)} className="text-black-400 hover:text-error-text">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input 
                type="text" 
                value={newSubtaskText}
                onChange={(e) => setNewSubtaskText(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSubtask(); } }}
                placeholder="Add subtask item..."
                className="flex-1 bg-black-50 border border-black-200 rounded-lg px-3 py-1.5 text-[13px] focus:outline-none focus:border-mp-blue-500 focus:bg-white"
              />
              <Button type="button" size="sm" variant="bordered" onClick={handleAddSubtask} disabled={!newSubtaskText.trim()}>
                Add
              </Button>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[13px] font-semibold text-black-600 flex items-center gap-1.5">
                <Paperclip className="w-3.5 h-3.5 text-black-400" /> Attachments
              </label>
              <button 
                type="button" 
                onClick={() => fileInputRef.current?.click()}
                className="text-[12px] font-medium text-mp-blue-600 hover:underline flex items-center gap-1"
              >
                <Upload className="w-3.5 h-3.5" /> Upload
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileUpload} 
                multiple 
                className="hidden" 
              />
            </div>
            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map(att => (
                  <div key={att.id} className="flex items-center justify-between px-3 py-1.5 bg-black-50 rounded-lg text-[12px]">
                    <span className="text-black truncate font-medium">{att.name}</span>
                    <button type="button" onClick={() => handleRemoveAttachment(att.id)} className="text-black-400 hover:text-error-text ml-2">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Privacy Toggle */}
          <div className="p-3 bg-black-50 border border-black-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPrivate ? <Lock className="w-4 h-4 text-black-500" /> : <Globe className="w-4 h-4 text-black-500" />}
              <div>
                <div className="text-[13px] font-medium text-black">
                  {isPrivate ? 'Private to you' : 'Public to workspace'}
                </div>
                <div className="text-[11px] text-black-400">
                  {isPrivate ? 'Only you and direct collaborators can see this task' : 'Visible to all members of HR.com'}
                </div>
              </div>
            </div>
            <button 
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className="text-[12px] font-semibold text-mp-blue-600 hover:underline"
            >
              {isPrivate ? 'Switch to Public' : 'Switch to Private'}
            </button>
          </div>

          {/* Footer Submit Buttons */}
          <div className="pt-4 border-t border-black-200 flex justify-end gap-3 shrink-0">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()}>Create Task</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
