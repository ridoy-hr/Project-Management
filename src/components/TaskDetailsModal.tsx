import React, { useState, useRef } from 'react';
import { Task, Status, User, Attachment } from '../types';
import { 
  X, Calendar, User as UserIcon, Tag, AlignLeft, CheckSquare, 
  MessageSquare, History, ListTodo, Plus, Trash2, Lock, Globe, 
  Share2, Paperclip, Upload, FileText, Download, Check, Link as LinkIcon, 
  Users, Search, ChevronRight, Eye, Diamond, Award
} from 'lucide-react';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { Badge } from './ui/Badge';
import { format } from 'date-fns';
import { useStore } from '../store';
import { cn } from '../lib/utils';

interface TaskDetailsModalProps {
  task: Task | null;
  onClose: () => void;
  onSelectTask?: (task: Task) => void;
}

export function TaskDetailsModal({ task, onClose, onSelectTask }: TaskDetailsModalProps) {
  const { 
    tasks, users, currentUser, projects, updateTask, addComment, 
    moveTask, toggleSubtask, addSubtask, deleteTask,
    addAttachment, removeAttachment, addDependency, removeDependency,
    addCollaborator, removeCollaborator 
  } = useStore();
  
  const [commentText, setCommentText] = useState('');
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  
  // Assignee Dropdown
  const [isAssigneeDropdownOpen, setIsAssigneeDropdownOpen] = useState(false);
  const [assigneeSearch, setAssigneeSearch] = useState('');
  
  // Delete Dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Share Modal
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  
  // Collaborators Popover
  const [isCollaboratorsOpen, setIsCollaboratorsOpen] = useState(false);
  const [collaboratorSearch, setCollaboratorSearch] = useState('');

  // Dependencies Popover
  const [isDepDropdownOpen, setIsDepDropdownOpen] = useState(false);
  const [depSearch, setDepSearch] = useState('');

  // File Upload Ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  if (!task) return null;

  const assignee = users.find(u => u.id === task.assigneeId);
  const taskProjects = projects.filter(p => task.projectIds.includes(p.id));
  const collaboratorIds = task.collaboratorIds || [currentUser.id];
  const collaborators = collaboratorIds.map(id => users.find(u => u.id === id)).filter(Boolean) as User[];
  const dependencyIds = task.dependencyIds || [];
  const dependencyTasks = dependencyIds.map(id => tasks.find(t => t.id === id)).filter(Boolean) as Task[];
  const attachments = task.attachments || [];

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTask(task.id, { title: e.target.value });
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTask(task.id, { description: e.target.value });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(task.id, commentText);
      setCommentText('');
    }
  };
  
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, newSubtaskTitle);
      setNewSubtaskTitle('');
      setIsAddingSubtask(false);
    }
  };

  const handleDelete = () => {
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    deleteTask(task.id);
    onClose();
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    
    Array.from(files).forEach((file: File) => {
      const newAttachment: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString()
      };
      addAttachment(task.id, newAttachment);
    });
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file: File) => {
      const newAttachment: Attachment = {
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        name: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        createdAt: new Date().toISOString()
      };
      addAttachment(task.id, newAttachment);
    });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* Delete Confirmation Modal */}
      {isDeleteDialogOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-2xl border border-black-200">
            <h2 className="text-[18px] font-bold text-black mb-2">Delete Task?</h2>
            <p className="text-[14px] text-black-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-black">"{task.title}"</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsDeleteDialogOpen(false)}>Cancel</Button>
              <Button onClick={confirmDelete} className="bg-error-border hover:bg-error-text text-white border-0">Delete</Button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 w-[520px] shadow-2xl border border-black-200 relative animate-in zoom-in-95 duration-150">
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-black-400 hover:text-black hover:bg-black-50 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
                <Share2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-[18px] font-bold text-black">Share this task</h2>
                <p className="text-[13px] text-black-500">Collaborate with your team or share via secure link</p>
              </div>
            </div>

            {/* Link Sharing Box */}
            <div className="p-3 bg-black-50 rounded-xl border border-black-200 mb-5 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] text-black-600 truncate flex-1">
                <LinkIcon className="w-4 h-4 text-black-400 shrink-0" />
                <span className="truncate">https://hr.com/tasks/{task.id}</span>
              </div>
              <Button 
                size="sm" 
                variant="bordered"
                onClick={handleCopyLink}
                className={cn("h-8 text-[12px] px-3 gap-1.5 shrink-0 transition-all", copySuccess && "bg-success-bg text-success-text border-success-border")}
              >
                {copySuccess ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><LinkIcon className="w-3.5 h-3.5" /> Copy Link</>}
              </Button>
            </div>

            {/* Privacy toggle in share modal */}
            <div className="p-3 border border-black-200 rounded-xl mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {task.isPrivate !== false ? (
                  <div className="w-8 h-8 rounded-lg bg-alert-bg text-alert-text flex items-center justify-center">
                    <Lock className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-8 h-8 rounded-lg bg-success-bg text-success-text flex items-center justify-center">
                    <Globe className="w-4 h-4" />
                  </div>
                )}
                <div>
                  <div className="text-[13px] font-medium text-black">
                    {task.isPrivate !== false ? 'Private to collaborators' : 'Anyone at HR.com with the link'}
                  </div>
                  <div className="text-[12px] text-black-400">
                    {task.isPrivate !== false ? 'Only people explicitly invited can access this task' : 'All workspace members can view and collaborate'}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => updateTask(task.id, { isPrivate: task.isPrivate === false })}
                className="text-[12px] font-semibold text-mp-blue-600 hover:text-mp-blue-700 hover:underline shrink-0"
              >
                {task.isPrivate !== false ? 'Make public' : 'Make private'}
              </button>
            </div>

            {/* Invite members */}
            <div className="space-y-3 mb-4">
              <label className="text-[13px] font-medium text-black">Task Collaborators ({collaborators.length})</label>
              <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1">
                {collaborators.map(user => (
                  <div key={user.id} className="flex items-center justify-between py-1.5 px-2 hover:bg-black-50 rounded-lg">
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={user.initials} src={user.avatarUrl} size="sm" className="w-7 h-7 text-[11px]" />
                      <div>
                        <div className="text-[13px] font-medium text-black">{user.name}</div>
                        <div className="text-[11px] text-black-400">{user.role === 'admin' ? 'Admin' : 'Member'}</div>
                      </div>
                    </div>
                    {user.id !== currentUser.id && (
                      <button 
                        onClick={() => removeCollaborator(task.id, user.id)}
                        className="text-[12px] text-error-text hover:underline"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-black-100">
              <Button onClick={() => setIsShareModalOpen(false)}>Done</Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Drawer Container */}
      <div className="w-[640px] h-full bg-white shadow-2xl flex flex-col transform transition-transform duration-300 border-l border-black-200">
        
        {/* Top Header Toolbar */}
        <div className="flex items-center justify-between px-6 py-3.5 border-b border-black-200 shrink-0 bg-white">
          <div className="flex items-center gap-3">
            <Button 
              onClick={() => moveTask(task.id, task.status === 'Done' ? 'To Do' : 'Done')}
              variant="bordered" 
              size="sm" 
              className={cn(
                "h-8 rounded-lg text-[12px] px-3 gap-2 border-black-200 transition-colors shadow-2xs font-medium",
                task.status === 'Done' 
                  ? "bg-success-bg border-success-border text-success-text" 
                  : "hover:bg-success-bg hover:border-success-border hover:text-success-text"
              )}
            >
              <CheckSquare className="w-4 h-4" />
              {task.status === 'Done' ? 'Completed' : 'Mark Complete'}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            
            {/* Editable Collaborators Avatar Stack */}
            <div className="relative">
              <div 
                onClick={() => setIsCollaboratorsOpen(!isCollaboratorsOpen)}
                className="flex items-center cursor-pointer hover:opacity-85 p-1 rounded-lg transition-all group"
                title="Manage collaborators"
              >
                <div className="flex -space-x-2">
                  {collaborators.slice(0, 3).map((collab) => (
                    <div key={collab.id}>
                      <Avatar 
                        initials={collab.initials} 
                        src={collab.avatarUrl} 
                        size="sm" 
                        className="w-7 h-7 border-2 border-white text-[10px] shadow-2xs" 
                      />
                    </div>
                  ))}
                  {collaborators.length === 0 && (
                    <div className="w-7 h-7 rounded-full border-2 border-dashed border-black-300 flex items-center justify-center text-black-400">
                      <Users className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <div className="ml-1.5 w-6 h-6 rounded-full border border-black-200 flex items-center justify-center text-[12px] text-black-500 group-hover:border-black group-hover:text-black transition-colors">
                  <Plus className="w-3 h-3" />
                </div>
              </div>

              {/* Collaborators Manager Popover */}
              {isCollaboratorsOpen && (
                <div className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between px-2 py-1 mb-2 border-b border-black-100">
                    <span className="text-[12px] font-semibold text-black uppercase tracking-wider">Collaborators</span>
                    <button onClick={() => setIsCollaboratorsOpen(false)} className="text-black-400 hover:text-black">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  
                  <div className="px-1 mb-2">
                    <div className="flex items-center gap-2 bg-black-50 rounded-md px-2 py-1 border border-black-200">
                      <Search className="w-3.5 h-3.5 text-black-400" />
                      <input 
                        type="text"
                        placeholder="Search team..." 
                        value={collaboratorSearch}
                        onChange={(e) => setCollaboratorSearch(e.target.value)}
                        className="w-full text-[12px] bg-transparent outline-none"
                      />
                    </div>
                  </div>

                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {users
                      .filter(u => u.name.toLowerCase().includes(collaboratorSearch.toLowerCase()))
                      .map(u => {
                        const isCollab = collaboratorIds.includes(u.id);
                        return (
                          <div 
                            key={u.id}
                            onClick={() => {
                              if (isCollab) {
                                removeCollaborator(task.id, u.id);
                              } else {
                                addCollaborator(task.id, u.id);
                              }
                            }}
                            className="flex items-center justify-between p-1.5 rounded-lg hover:bg-black-50 cursor-pointer text-[13px]"
                          >
                            <div className="flex items-center gap-2">
                              <Avatar initials={u.initials} src={u.avatarUrl} size="sm" className="w-6 h-6 text-[10px]" />
                              <span className="font-medium text-black">{u.name}</span>
                            </div>
                            <span className={cn("text-[11px] px-1.5 py-0.5 rounded font-medium", isCollab ? "bg-success-bg text-success-text" : "text-black-400 hover:text-black")}>
                              {isCollab ? 'Joined' : '+ Add'}
                            </span>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>

            {/* Share Button */}
            <button 
              onClick={() => setIsShareModalOpen(true)}
              className="text-[12px] font-medium border border-black-200 px-3 py-1.5 rounded-md hover:bg-black-50 transition-colors flex items-center gap-1.5 text-black shadow-2xs"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>

            <div className="w-px h-4 bg-black-200 mx-1"></div>

            {/* Delete Button */}
            <button 
              onClick={handleDelete} 
              className="p-1.5 text-black-400 hover:text-error-text hover:bg-error-bg rounded-lg transition-colors" 
              title="Delete Task"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            {/* Close Drawer */}
            <button 
              onClick={onClose} 
              className="p-1.5 text-black-400 hover:text-black hover:bg-black-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Privacy Banner (Replaces "This task is visible to HR.com") */}
        <div className="px-6 py-2 border-b border-black-100 flex items-center justify-between text-[12px] bg-black-50/70 shrink-0">
          <div className="flex items-center gap-2 text-black-600">
            {task.isPrivate !== false ? (
              <Lock className="w-3.5 h-3.5 text-black-500 shrink-0" />
            ) : (
              <Globe className="w-3.5 h-3.5 text-black-500 shrink-0" />
            )}
            <span>{task.isPrivate !== false ? 'This task is private to you.' : 'This task is public to HR.com.'}</span>
          </div>
          <button 
            onClick={() => updateTask(task.id, { isPrivate: task.isPrivate === false })}
            className="text-[11px] font-semibold border border-black-200 bg-white hover:bg-black-50 px-2.5 py-1 rounded transition-colors text-black shadow-2xs cursor-pointer"
          >
            {task.isPrivate !== false ? 'Make public' : 'Make private'}
          </button>
        </div>

        {/* Scrollable Main Task Content */}
        <div 
          className={cn("flex-1 overflow-y-auto transition-colors", isDraggingFile && "bg-mp-blue-50/50")}
          onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
          onDragLeave={() => setIsDraggingFile(false)}
          onDrop={handleDrop}
        >
          <div className="p-8">
            
            {/* Milestone/Approval Badge */}
            {(task.isMilestone || task.isApproval) && (
              <div className="flex items-center gap-1.5 mb-2">
                {task.isMilestone ? (
                  <Badge variant="success" className="gap-1 px-1.5 py-0.5">
                    <Diamond className="w-3 h-3 fill-current" /> Milestone
                  </Badge>
                ) : (
                  <Badge variant="alert" className="gap-1 px-1.5 py-0.5">
                    <Award className="w-3 h-3 fill-current" /> Approval
                  </Badge>
                )}
              </div>
            )}

            {/* Title Input */}
            <input 
              className="text-[24px] font-bold tracking-tight text-black mb-6 w-full focus:outline-none focus:bg-black-50/70 p-1.5 -ml-1.5 rounded-lg transition-colors"
              value={task.title}
              placeholder="Task title..."
              onChange={handleTitleChange}
            />

            <div className="space-y-4">
              
              {/* Assignee */}
              <div className="grid grid-cols-[140px_1fr] items-center relative">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                  <UserIcon className="w-4 h-4" /> Assignee
                </span>
                <div className="relative">
                  <div 
                    onClick={() => setIsAssigneeDropdownOpen(!isAssigneeDropdownOpen)}
                    className="flex items-center gap-2.5 cursor-pointer hover:bg-black-50 p-1.5 -ml-1.5 rounded-lg w-fit transition-colors group"
                  >
                    {assignee ? (
                      <>
                        <Avatar initials={assignee.initials} src={assignee.avatarUrl} size="sm" className="w-7 h-7 text-[11px]" />
                        <span className="text-[14px] font-medium text-black">{assignee.name}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            updateTask(task.id, { assigneeId: undefined });
                          }}
                          className="ml-1 text-black-400 hover:text-black opacity-0 group-hover:opacity-100 p-0.5"
                          title="Clear assignee"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-2 text-black-400">
                        <span className="text-[13px] border border-dashed border-black-300 rounded-full w-7 h-7 flex items-center justify-center">?</span>
                        <span className="text-[13px]">Assign task</span>
                      </div>
                    )}
                  </div>
                  
                  {isAssigneeDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1 w-[260px] bg-white border border-black-200 shadow-xl rounded-xl z-50 overflow-hidden animate-in fade-in duration-150">
                      <div className="p-2 border-b border-black-100">
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Name or email" 
                          value={assigneeSearch}
                          onChange={(e) => setAssigneeSearch(e.target.value)}
                          className="w-full text-[13px] px-2 py-1.5 bg-black-50 rounded focus:outline-none focus:border-mp-blue-500 border border-transparent"
                        />
                      </div>
                      <div className="max-h-[200px] overflow-y-auto p-1">
                        {users.filter(u => u.name.toLowerCase().includes(assigneeSearch.toLowerCase())).map(u => (
                          <div 
                            key={u.id}
                            onClick={() => {
                              updateTask(task.id, { assigneeId: u.id });
                              setIsAssigneeDropdownOpen(false);
                              setAssigneeSearch('');
                            }}
                            className="flex items-center gap-3 px-2 py-2 hover:bg-black-50 rounded-lg cursor-pointer"
                          >
                            <Avatar initials={u.initials} src={u.avatarUrl} size="sm" className="w-6 h-6 text-[10px]" />
                            <span className="text-[13px] font-medium text-black">{u.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Due Date */}
              <div className="grid grid-cols-[140px_1fr] items-center">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Due date
                </span>
                <div>
                  <input 
                    type="date"
                    value={task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : ''}
                    onChange={(e) => {
                      const newDate = e.target.value ? new Date(e.target.value).toISOString() : undefined;
                      updateTask(task.id, { dueDate: newDate });
                    }}
                    className="text-[13px] font-medium text-black bg-transparent hover:bg-black-50 border border-transparent hover:border-black-200 rounded-md px-2 py-1 outline-none focus:border-mp-blue-500 transition-colors cursor-pointer"
                  />
                </div>
              </div>
              
              {/* Dependencies Section (ACTIVE) */}
              <div className="grid grid-cols-[140px_1fr] items-start">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2 pt-1.5">
                  <div className="w-4 h-4 border-2 border-black-400 rounded-full flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-black-400 rounded-full"></div>
                  </div> 
                  Dependencies
                </span>
                
                <div className="space-y-2">
                  {/* Linked Dependencies List */}
                  {dependencyTasks.length > 0 && (
                    <div className="space-y-1.5">
                      {dependencyTasks.map(dep => (
                        <div 
                          key={dep.id} 
                          className="flex items-center justify-between bg-black-50 border border-black-200 px-2.5 py-1.5 rounded-lg group"
                        >
                          <div 
                            onClick={() => onSelectTask && onSelectTask(dep)}
                            className="flex items-center gap-2 text-[13px] cursor-pointer hover:text-mp-blue-600 truncate flex-1 mr-2"
                          >
                            <span className={cn("w-2 h-2 rounded-full shrink-0", dep.status === 'Done' ? "bg-success-border" : "bg-alert-text")}></span>
                            <span className="truncate font-medium">{dep.title}</span>
                            <Badge variant="default" className="text-[10px] py-0 px-1.5 shrink-0">{dep.status}</Badge>
                          </div>
                          <button 
                            onClick={() => removeDependency(task.id, dep.id)}
                            className="text-black-400 hover:text-error-text p-1 transition-colors"
                            title="Remove dependency"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Dependency Dropdown */}
                  <div className="relative">
                    <button 
                      onClick={() => setIsDepDropdownOpen(!isDepDropdownOpen)}
                      className="text-[13px] font-medium text-black-500 hover:text-black flex items-center gap-1.5 p-1 -ml-1 rounded-md hover:bg-black-50 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add dependency
                    </button>

                    {isDepDropdownOpen && (
                      <div className="absolute top-full left-0 mt-1 w-[320px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-2 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-black-100">
                          <span className="text-[12px] font-semibold text-black">Select blocking task</span>
                          <button onClick={() => setIsDepDropdownOpen(false)} className="text-black-400 hover:text-black">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <input 
                          type="text" 
                          autoFocus
                          placeholder="Search tasks..." 
                          value={depSearch}
                          onChange={(e) => setDepSearch(e.target.value)}
                          className="w-full text-[12px] px-2 py-1.5 mb-2 bg-black-50 rounded border border-black-200 outline-none"
                        />
                        <div className="max-h-[180px] overflow-y-auto space-y-1">
                          {tasks
                            .filter(t => t.id !== task.id && !dependencyIds.includes(t.id))
                            .filter(t => t.title.toLowerCase().includes(depSearch.toLowerCase()))
                            .map(t => (
                              <div 
                                key={t.id}
                                onClick={() => {
                                  addDependency(task.id, t.id);
                                  setIsDepDropdownOpen(false);
                                  setDepSearch('');
                                }}
                                className="flex items-center justify-between p-1.5 hover:bg-black-50 rounded-lg cursor-pointer text-[12px]"
                              >
                                <span className="font-medium text-black truncate mr-2">{t.title}</span>
                                <Badge variant="default" className="text-[10px] shrink-0">{t.status}</Badge>
                              </div>
                            ))}
                          {tasks.filter(t => t.id !== task.id && !dependencyIds.includes(t.id)).length === 0 && (
                            <p className="text-[12px] text-black-400 p-2 text-center">No other tasks available</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Projects (Multi-homing) */}
              <div className="grid grid-cols-[140px_1fr] items-center">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Projects
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  {taskProjects.map(p => (
                    <span key={p.id} className={cn("px-2.5 py-1 rounded-md text-[12px] font-medium text-white flex items-center gap-1.5 shadow-2xs", p.color)}>
                      {p.name}
                      <button 
                        onClick={() => updateTask(task.id, { projectIds: task.projectIds.filter(id => id !== p.id) })}
                        className="hover:text-black-200 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                  <select
                    onChange={(e) => {
                      if (e.target.value && !task.projectIds.includes(e.target.value)) {
                        updateTask(task.id, { projectIds: [...task.projectIds, e.target.value] });
                      }
                      e.target.value = '';
                    }}
                    className="text-[12px] text-black-400 hover:text-black bg-transparent hover:bg-black-50 border border-transparent hover:border-black-200 rounded-md px-1.5 py-1 outline-none transition-colors cursor-pointer"
                  >
                    <option value="">+ Add to project</option>
                    {projects.filter(p => !task.projectIds.includes(p.id)).map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Section & Milestone */}
              <div className="grid grid-cols-[140px_1fr] items-center">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                  <ListTodo className="w-4 h-4" /> Section
                </span>
                <div className="flex items-center gap-4 flex-wrap">
                  <select
                    value={task.sectionId || ''}
                    onChange={(e) => updateTask(task.id, { sectionId: e.target.value || undefined })}
                    className="text-[13px] font-medium bg-black-50 border border-black-200 rounded-md px-2 py-1 outline-none hover:bg-black-100 transition-colors cursor-pointer"
                  >
                    <option value="">No Section</option>
                    {task.projectIds.flatMap(pId => {
                      const p = projects.find(proj => proj.id === pId);
                      return (p?.sections || []).map(sec => (
                        <option key={sec.id} value={sec.id}>
                          {p?.name}: {sec.name}
                        </option>
                      ));
                    })}
                  </select>

                  <label className="flex items-center gap-1.5 cursor-pointer select-none text-[12px] font-medium text-black-600">
                    <input 
                      type="checkbox" 
                      checked={!!task.isMilestone} 
                      onChange={(e) => updateTask(task.id, { isMilestone: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-black-300 text-emerald-600" 
                    />
                    Mark as Milestone
                  </label>
                </div>
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-[140px_1fr] items-center">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-black-400"></div> Status & Priority
                </span>
                <div className="flex items-center gap-3">
                  <select 
                    value={task.status}
                    onChange={(e) => moveTask(task.id, e.target.value as Status)}
                    className="text-[13px] font-medium bg-black-50 border border-black-200 rounded-md px-2 py-1 outline-none hover:bg-black-100 transition-colors cursor-pointer"
                  >
                    {['To Do', 'In Progress', 'Review', 'Done'].map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <select 
                    value={task.priority}
                    onChange={(e) => updateTask(task.id, { priority: e.target.value as Task['priority'] })}
                    className="text-[13px] font-medium bg-black-50 border border-black-200 rounded-md px-2 py-1 outline-none hover:bg-black-100 transition-colors cursor-pointer"
                  >
                    {['Low', 'Medium', 'High'].map(pr => <option key={pr} value={pr}>{pr} Priority</option>)}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="pt-5 border-t border-black-100">
                <span className="text-[13px] text-black-400 font-medium flex items-center gap-2 mb-3">
                  <AlignLeft className="w-4 h-4" /> Description
                </span>
                <div className="border border-black-200 focus-within:border-mp-blue-500 rounded-xl overflow-hidden transition-colors bg-black-50/50 focus-within:bg-white group">
                  <div className="flex items-center gap-2 px-3 py-1.5 border-b border-black-200 bg-white">
                    <button className="text-[13px] font-bold text-black-400 hover:text-black w-6 h-6 flex items-center justify-center rounded hover:bg-black-50">B</button>
                    <button className="text-[13px] italic text-black-400 hover:text-black w-6 h-6 flex items-center justify-center rounded hover:bg-black-50">I</button>
                    <button className="text-[13px] underline text-black-400 hover:text-black w-6 h-6 flex items-center justify-center rounded hover:bg-black-50">U</button>
                    <div className="w-px h-3.5 bg-black-200 mx-1"></div>
                    <button className="text-black-400 hover:text-black w-6 h-6 flex items-center justify-center rounded hover:bg-black-50">
                      <ListTodo className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <textarea 
                    className="w-full text-[14px] text-black leading-relaxed min-h-[90px] p-3.5 bg-transparent resize-y outline-none"
                    placeholder="Add more details, bullet points, or expectations to this task..."
                    value={task.description || ''}
                    onChange={handleDescriptionChange}
                  />
                </div>
              </div>

              {/* Subtasks */}
              <div className="pt-5 border-t border-black-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                    <ListTodo className="w-4 h-4" /> Subtasks ({task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length})
                  </span>
                </div>
                
                <div className="space-y-2">
                  {task.subtasks.map(sub => (
                    <div key={sub.id} className="flex items-center gap-3 p-1.5 rounded-lg hover:bg-black-50 group">
                      <button 
                        onClick={() => toggleSubtask(task.id, sub.id)}
                        className={cn(
                          "w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0", 
                          sub.isCompleted ? "bg-emerald-600 border-emerald-600 text-white" : "border-black-300 text-transparent hover:border-emerald-600"
                        )}
                      >
                        <CheckSquare className="w-3 h-3" />
                      </button>
                      <span className={cn("text-[13px] flex-1", sub.isCompleted ? "text-emerald-800 font-medium bg-emerald-50/80 px-2 py-0.5 rounded" : "text-black")}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                  
                  {isAddingSubtask ? (
                    <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
                      <input 
                        type="text"
                        autoFocus
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        placeholder="What needs to be done?"
                        className="text-[13px] bg-transparent border-b border-mp-blue-500 focus:outline-none flex-1 py-1"
                        onBlur={() => {
                          if (!newSubtaskTitle.trim()) setIsAddingSubtask(false);
                        }}
                      />
                      <Button size="sm" type="submit" disabled={!newSubtaskTitle.trim()} className="h-7 text-[12px] px-2 py-0">Add</Button>
                    </form>
                  ) : (
                    <button 
                      onClick={() => setIsAddingSubtask(true)} 
                      className="text-[13px] text-black-500 hover:text-black flex items-center gap-1.5 pt-1.5 p-1 rounded hover:bg-black-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" /> Add subtask
                    </button>
                  )}
                </div>
              </div>

              {/* Attachments / File Upload Option */}
              <div className="pt-5 border-t border-black-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[13px] text-black-400 font-medium flex items-center gap-2">
                    <Paperclip className="w-4 h-4" /> Attachments ({attachments.length})
                  </span>
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[12px] font-medium text-mp-blue-600 hover:text-mp-blue-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload file
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    multiple 
                    className="hidden" 
                  />
                </div>

                {/* Upload Area / List */}
                <div className="space-y-2">
                  {attachments.map(att => (
                    <div 
                      key={att.id}
                      className="flex items-center justify-between p-2.5 bg-black-50 border border-black-200 rounded-xl hover:border-black-300 transition-all group"
                    >
                      <div className="flex items-center gap-3 truncate mr-2">
                        <div className="w-8 h-8 rounded-lg bg-white border border-black-200 flex items-center justify-center text-black-500 shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="text-[13px] font-medium text-black truncate">{att.name}</div>
                          <div className="text-[11px] text-black-400">
                            {formatFileSize(att.size)} • {format(new Date(att.createdAt), 'MMM d, h:mm a')}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <a 
                          href={att.url || '#'} 
                          download={att.name}
                          className="p-1.5 text-black-400 hover:text-black hover:bg-white rounded-md transition-colors"
                          title="Download"
                          onClick={(e) => {
                            if (!att.url) {
                              e.preventDefault();
                              alert(`Simulated download for: ${att.name}`);
                            }
                          }}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button 
                          onClick={() => removeAttachment(task.id, att.id)}
                          className="p-1.5 text-black-400 hover:text-error-text hover:bg-white rounded-md transition-colors"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {attachments.length === 0 && (
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-black-300 rounded-xl p-4 text-center cursor-pointer hover:bg-black-50/50 hover:border-black-400 transition-all"
                    >
                      <Upload className="w-5 h-5 mx-auto text-black-400 mb-1" />
                      <p className="text-[13px] text-black-500">
                        Drag and drop files here, or <span className="text-mp-blue-600 font-medium">browse</span>
                      </p>
                      <p className="text-[11px] text-black-400 mt-0.5">Supports documents, images, spreadsheets, and archives</p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
          
          {/* Tabs for Comments / Activity Log */}
          <div className="px-8 mt-2">
             <div className="flex gap-6 border-b border-black-200">
                <button 
                  onClick={() => setActiveTab('comments')}
                  className={cn("pb-3 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'comments' ? "border-black text-black" : "border-transparent text-black-400")}
                >
                  <MessageSquare className="w-4 h-4" /> Comments ({task.comments.length})
                </button>
                <button 
                  onClick={() => setActiveTab('history')}
                  className={cn("pb-3 text-[14px] font-medium border-b-2 transition-colors flex items-center gap-2", activeTab === 'history' ? "border-black text-black" : "border-transparent text-black-400")}
                >
                  <History className="w-4 h-4" /> Activity Log
                </button>
             </div>

             <div className="py-6">
                {activeTab === 'comments' && (
                  <div className="space-y-5">
                    {task.comments.map(comment => {
                      const commenter = users.find(u => u.id === comment.userId);
                      return (
                        <div key={comment.id} className="flex gap-3.5">
                           <Avatar initials={commenter?.initials || '?'} src={commenter?.avatarUrl} size="sm" />
                           <div className="flex-1">
                             <div className="flex items-center gap-2 mb-1">
                               <span className="text-[13px] font-semibold text-black">{commenter?.name}</span>
                               <span className="text-[11px] text-black-400">{format(new Date(comment.createdAt), 'MMM d, h:mm a')}</span>
                             </div>
                             <div className="text-[13px] text-black-600 bg-black-50 p-2.5 rounded-xl border border-black-100 leading-relaxed">
                               {comment.text}
                             </div>
                           </div>
                        </div>
                      );
                    })}
                    {task.comments.length === 0 && <p className="text-[13px] text-black-400 text-center py-2">No comments yet. Start the conversation below.</p>}
                  </div>
                )}
                
                {activeTab === 'history' && (
                  <div className="space-y-3">
                    {task.auditLogs.map(log => (
                       <div key={log.id} className="flex gap-3 items-center text-[12px]">
                          <div className="w-2 h-2 rounded-full bg-black-300 shrink-0" />
                          <p className="text-black-600 flex-1">{log.text}</p>
                          <span className="text-black-400 shrink-0">{format(new Date(log.createdAt), 'MMM d, h:mm a')}</span>
                       </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        </div>

        {/* Comment Input Footer */}
        <div className="p-4 border-t border-black-200 bg-white mt-auto shrink-0 shadow-xs">
           <form onSubmit={submitComment} className="flex gap-3 items-center">
             <Avatar initials={currentUser.initials} src={currentUser.avatarUrl} size="sm" />
             <input 
               type="text" 
               value={commentText}
               onChange={(e) => setCommentText(e.target.value)}
               placeholder="Ask a question or post an update..." 
               className="flex-1 bg-black-50 border border-black-200 rounded-xl px-4 py-2 text-[13px] focus:outline-none focus:border-mp-blue-500 focus:bg-white transition-all" 
             />
             <Button type="submit" size="sm" disabled={!commentText.trim()} className="h-9 px-4 text-[13px]">
               Comment
             </Button>
           </form>
        </div>
      </div>
    </div>
  );
}
