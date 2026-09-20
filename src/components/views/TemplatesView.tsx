import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { ViewState } from '../../App';
import { Layout, Users, Rocket, Plus, ChevronRight, Briefcase, Star, Folder, Edit2, Trash2, Save, X, PlusCircle, Check, ArrowLeft, MoreHorizontal, CheckCircle2, ChevronDown, List, LayoutDashboard, Clock, MessageSquare, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import { ProjectTemplate, TemplateTask } from '../../types';
import { Avatar } from '../ui/Avatar';
import { format } from 'date-fns';

const iconMap = {
  Layout,
  Users,
  Rocket,
  Briefcase,
  Star,
  Folder
} as Record<string, React.ElementType>;

const ICONS = Object.keys(iconMap);
const COLORS = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 
  'bg-red-500', 'bg-yellow-500', 'bg-indigo-500', 
  'bg-pink-500', 'bg-teal-500'
];

export function TemplatesView({ onNavigate }: { onNavigate: (state: ViewState) => void }) {
  const { templates, createProjectFromTemplate, addTemplate, updateTemplate, deleteTemplate, users, currentUser } = useStore();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  
  // Modes: gallery, edit, create, use
  const [mode, setMode] = useState<'gallery' | 'edit' | 'create' | 'use'>('gallery');
  const [step, setStep] = useState<'content' | 'settings'>('content');
  
  const [projectName, setProjectName] = useState('');
  const [referenceDate, setReferenceDate] = useState<string>(new Date().toISOString().split('T')[0]);

  const [draft, setDraft] = useState<Omit<ProjectTemplate, 'id'>>({
    name: '', description: '', icon: 'Layout', color: 'bg-blue-500', tasks: []
  });

  const activeTemplate = templates.find(t => t.id === selectedTemplate);

  useEffect(() => {
    if (mode === 'edit' && activeTemplate) {
      setDraft({
        name: activeTemplate.name,
        description: activeTemplate.description,
        icon: activeTemplate.icon,
        color: activeTemplate.color,
        tasks: activeTemplate.tasks.map(t => ({ ...t }))
      });
      setStep('content');
    } else if (mode === 'create') {
      setDraft({
        name: 'New Template',
        description: '',
        icon: 'Layout',
        color: 'bg-blue-500',
        tasks: []
      });
      setStep('content');
    }
  }, [mode, activeTemplate]);

  const handleUse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTemplate || !projectName.trim()) return;
    
    const newProjectId = createProjectFromTemplate(activeTemplate.id, projectName, referenceDate);
    if (newProjectId) {
      onNavigate({ type: 'project', id: newProjectId });
    }
  };

  const handleSaveDraft = () => {
    if (!draft.name.trim()) return;
    if (mode === 'create') {
      addTemplate(draft);
    } else if (mode === 'edit' && activeTemplate) {
      updateTemplate(activeTemplate.id, draft);
    }
    setMode('gallery');
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this template?')) {
      deleteTemplate(id);
    }
  };

  const updateDraftTask = (index: number, updates: Partial<TemplateTask>) => {
    const newTasks = [...draft.tasks];
    newTasks[index] = { ...newTasks[index], ...updates };
    setDraft({ ...draft, tasks: newTasks });
  };

  const removeDraftTask = (index: number) => {
    const newTasks = [...draft.tasks];
    newTasks.splice(index, 1);
    setDraft({ ...draft, tasks: newTasks });
  };

  const addDraftTask = () => {
    setDraft({
      ...draft,
      tasks: [...draft.tasks, { title: '', status: 'To Do', priority: 'Medium', sectionName: 'General', dayOffset: 0 }]
    });
  };

  if (mode === 'gallery') {
    return (
      <div className="flex flex-col h-full bg-[#F9F9F9] p-10 overflow-y-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-[24px] font-bold text-black">Project Templates</h1>
            <p className="text-black-500 text-[14px] mt-1">Standardize workflows and launch projects instantly.</p>
          </div>
          <Button 
            onClick={() => {
              setSelectedTemplate(null);
              setMode('create');
            }}
            className="bg-mp-blue-600 hover:bg-mp-blue-700 text-white shadow-sm font-semibold h-9 px-4 gap-1.5"
          >
            <Plus className="w-4 h-4" /> New Template
          </Button>
        </div>

        {templates.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-black-200 rounded-2xl bg-white">
            <Layout className="w-12 h-12 text-black-300 mx-auto mb-4" />
            <h3 className="text-[16px] font-bold text-black">No templates yet</h3>
            <p className="text-black-500 text-[13px] mt-1 mb-4">Create your first template to get started.</p>
            <Button onClick={() => setMode('create')} className="bg-white border border-black-200 text-black shadow-xs hover:bg-black-50">
              Create template
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map(template => {
              const Icon = iconMap[template.icon] || Layout;
              return (
                <div key={template.id} className="bg-white rounded-2xl border border-black-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-md transition-all">
                  <div className="p-6 flex-1 cursor-pointer" onClick={() => {
                    setSelectedTemplate(template.id);
                    setProjectName(template.name);
                    setMode('use');
                  }}>
                    <div className="flex items-start justify-between mb-4">
                      <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white", template.color)}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTemplate(template.id);
                            setMode('edit');
                          }}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black-50 text-black-400 hover:text-black transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={(e) => handleDelete(template.id, e)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-black-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="text-[16px] font-bold text-black leading-tight mb-1">{template.name}</h3>
                    <p className="text-[13px] text-black-500 line-clamp-2">{template.description}</p>
                    <div className="mt-4 flex items-center gap-2 text-[12px] font-medium text-black-400">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {template.tasks.length} standard tasks
                    </div>
                  </div>
                  <div className="px-6 py-4 bg-black-50 border-t border-black-100">
                    <Button 
                      onClick={() => {
                        setSelectedTemplate(template.id);
                        setProjectName(template.name);
                        setMode('use');
                      }}
                      className="w-full bg-white border border-black-200 text-black font-semibold shadow-xs hover:bg-black-100 justify-center"
                    >
                      Use Template
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (mode === 'edit' || mode === 'create') {
    return (
      <div className="flex h-full bg-white w-full">
        {/* Sidebar */}
        <div className="w-[300px] bg-[#F9F9F9] border-r border-black-100 flex flex-col shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)] shrink-0 z-10">
          <div className="p-6">
            <h2 className="text-[20px] font-bold text-black tracking-tight mb-8">Build your template</h2>
            
            <div className="relative before:absolute before:left-3.5 before:top-4 before:bottom-4 before:w-0.5 before:bg-black-200">
              <button 
                onClick={() => setStep('content')} 
                className="w-full flex items-center gap-3 p-1.5 text-left relative z-10 group bg-[#F9F9F9]"
              >
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all shadow-sm ring-4 ring-[#F9F9F9]", step === 'content' ? "bg-mp-blue-600 text-white" : "bg-white text-black-400 border border-black-200")}>1</div>
                <span className={cn("text-[13px] font-semibold", step === 'content' ? "text-black" : "text-black-500 group-hover:text-black")}>Project content</span>
              </button>
              
              <div className="pl-11 py-2 text-[11px] text-black-400 font-medium">Overview (Optional)</div>

              <button 
                onClick={() => setStep('settings')} 
                className="w-full flex items-center gap-3 p-1.5 text-left relative z-10 group bg-[#F9F9F9] mt-2"
              >
                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[12px] font-bold transition-all shadow-sm ring-4 ring-[#F9F9F9]", step === 'settings' ? "bg-mp-blue-600 text-white" : "bg-white text-black-400 border border-black-200")}>2</div>
                <span className={cn("text-[13px] font-semibold", step === 'settings' ? "text-black" : "text-black-500 group-hover:text-black")}>Settings</span>
              </button>
            </div>
          </div>
          
          <div className="px-6 mt-4">
            <p className="text-[12px] text-black-500 leading-relaxed mb-4">Add or edit this template's default tasks, assignees, and due dates.</p>
            <Button onClick={handleSaveDraft} className="w-full bg-white border border-black-200 text-black shadow-xs hover:bg-black-50 justify-center">
              Finish
            </Button>
            <Button onClick={() => setMode('gallery')} className="w-full mt-2 border-transparent bg-transparent text-black-500 hover:text-black justify-center shadow-none">
              Cancel
            </Button>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden min-w-0">
          <div className="h-[64px] border-b border-black-100 flex items-center px-6 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 border-2 border-dashed border-black-300 rounded flex items-center justify-center text-black-300">
                <List className="w-3 h-3" />
              </div>
              <h1 className="text-[20px] font-bold text-black">{draft.name || 'Untitled Template'}</h1>
            </div>
          </div>
          
          {step === 'content' && (
            <div className="flex items-center gap-6 px-8 border-b border-black-100 pt-3 shrink-0 overflow-x-auto">
              <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Overview</div>
              <div className="pb-3 border-b-2 border-mp-blue-600 text-mp-blue-700 text-[13px] font-semibold">List</div>
              <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Board</div>
              <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Timeline</div>
              <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Dashboard</div>
              <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Calendar</div>
            </div>
          )}
          
          <div className="flex-1 overflow-y-auto bg-white">
            {step === 'content' && (
              <div className="p-8">
                <Button onClick={addDraftTask} className="bg-mp-blue-600 hover:bg-mp-blue-700 text-white gap-1.5 h-8 px-3 text-[12px] shadow-sm mb-6 rounded-md font-medium">
                  <Plus className="w-3.5 h-3.5" /> Add task
                </Button>
                
                <div className="border border-black-100 border-b-0 rounded-t-xl overflow-hidden min-w-[800px]">
                  <div className="flex items-center bg-white border-b border-black-200 text-[12px] font-semibold text-black-400 h-10 px-4 shrink-0">
                    <div className="w-[30px] shrink-0"></div>
                    <div className="flex-1 min-w-[300px]">Name</div>
                    <div className="w-[180px] shrink-0 border-l border-black-100 pl-4 h-full flex items-center">Assignee</div>
                    <div className="w-[160px] shrink-0 border-l border-black-100 pl-4 h-full flex items-center">Due date (offset)</div>
                    <div className="w-[140px] shrink-0 border-l border-black-100 pl-4 h-full flex items-center">Section</div>
                    <div className="w-[40px] shrink-0"></div>
                  </div>
                  <div className="divide-y divide-black-100 border-b border-black-100">
                    {draft.tasks.map((task, idx) => (
                      <div key={idx} className="flex items-stretch px-4 h-11 bg-white hover:bg-black-50 transition-colors group">
                        <div className="w-[30px] shrink-0 flex items-center">
                          <CheckCircle2 className="w-4 h-4 text-black-300" />
                        </div>
                        <div className="flex-1 min-w-[300px] flex items-center pr-4">
                          <input
                            type="text"
                            value={task.title}
                            onChange={e => updateDraftTask(idx, { title: e.target.value })}
                            className="w-full text-[13px] bg-transparent outline-none border-b border-transparent focus:border-mp-blue-300"
                            placeholder="Write a task name"
                          />
                        </div>
                        <div className="w-[180px] shrink-0 border-l border-black-100 pl-4 flex items-center">
                          <div className="flex items-center gap-2 w-full">
                            {task.assigneeId ? (
                              <Avatar size="xs" className="w-5 h-5" initials={users.find(u => u.id === task.assigneeId)?.initials || '?'} src={users.find(u => u.id === task.assigneeId)?.avatarUrl} />
                            ) : (
                              <div className="w-5 h-5 rounded-full border border-dashed border-black-300 flex items-center justify-center bg-black-50 shrink-0">
                                <Users className="w-3 h-3 text-black-300" />
                              </div>
                            )}
                            <select 
                              value={task.assigneeId || ''} 
                              onChange={e => updateDraftTask(idx, { assigneeId: e.target.value })}
                              className="w-full text-[12px] bg-transparent outline-none text-black-700 cursor-pointer appearance-none truncate pr-2"
                            >
                              <option value="">Unassigned</option>
                              {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                            </select>
                          </div>
                        </div>
                        <div className="w-[160px] shrink-0 border-l border-black-100 pl-4 flex items-center">
                          <input 
                            type="number"
                            value={task.dayOffset || 0}
                            onChange={e => updateDraftTask(idx, { dayOffset: parseInt(e.target.value) || 0 })}
                            className="w-12 text-[12px] border border-black-200 rounded px-1.5 py-0.5 text-center mr-2 outline-none focus:border-mp-blue-400 bg-white"
                          />
                          <span className="text-[12px] text-black-500 whitespace-nowrap">days offset</span>
                        </div>
                        <div className="w-[140px] shrink-0 border-l border-black-100 pl-4 pr-2 flex items-center">
                          <input 
                            type="text"
                            value={task.sectionName || ''}
                            onChange={e => updateDraftTask(idx, { sectionName: e.target.value })}
                            className="w-full text-[12px] bg-transparent outline-none border-b border-transparent focus:border-mp-blue-300 text-black-600"
                            placeholder="Section..."
                          />
                        </div>
                        <div className="w-[40px] shrink-0 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => removeDraftTask(idx)} className="p-1 text-black-400 hover:text-red-500 rounded hover:bg-black-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {draft.tasks.length === 0 && (
                      <div className="py-12 text-center bg-black-50">
                        <p className="text-[13px] text-black-400 font-medium">Click "Add task" to build out your template.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {step === 'settings' && (
              <div className="p-10 max-w-3xl">
                <h2 className="text-[20px] font-bold text-black mb-8 border-b border-black-100 pb-4">Template settings</h2>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-[12px] font-semibold text-black-600 mb-2">Title of Template</label>
                    <input
                      type="text"
                      value={draft.name}
                      onChange={e => setDraft({ ...draft, name: e.target.value })}
                      className="w-full h-10 px-3 text-[14px] border border-black-200 rounded-md outline-none focus:border-mp-blue-500 focus:ring-1 focus:ring-mp-blue-500 shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-black-600 mb-2">Description</label>
                    <textarea
                      value={draft.description}
                      onChange={e => setDraft({ ...draft, description: e.target.value })}
                      className="w-full h-24 p-3 text-[14px] border border-black-200 rounded-md outline-none focus:border-mp-blue-500 focus:ring-1 focus:ring-mp-blue-500 resize-none shadow-2xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div>
                      <label className="block text-[12px] font-semibold text-black-600 mb-2">Template Icon</label>
                      <div className="flex flex-wrap gap-2">
                        {ICONS.map(iconName => {
                          const Icon = iconMap[iconName];
                          return (
                            <button
                              key={iconName}
                              onClick={() => setDraft({ ...draft, icon: iconName })}
                              className={cn(
                                "w-10 h-10 rounded-lg flex items-center justify-center border transition-all",
                                draft.icon === iconName ? "border-mp-blue-500 bg-mp-blue-50 text-mp-blue-600 shadow-xs" : "border-black-200 text-black-500 hover:bg-black-50"
                              )}
                            >
                              <Icon className="w-5 h-5" />
                            </button>
                          );
                        })}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-semibold text-black-600 mb-2">Template Color</label>
                      <div className="flex flex-wrap gap-2">
                        {COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => setDraft({ ...draft, color })}
                            className={cn(
                              "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                              draft.color === color ? "border-black shadow-sm" : "border-transparent",
                              color
                            )}
                          >
                            {draft.color === color && <Check className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-8">
                    <h3 className="text-[16px] font-bold text-black mb-1">Template access</h3>
                    <p className="text-[13px] text-black-500 mb-4">These people will have access to edit or view the template.</p>
                    <div className="flex items-center gap-2 mb-4">
                      <input type="text" placeholder="Invite Asana members..." className="flex-1 h-10 px-3 text-[14px] border border-black-200 rounded-md outline-none focus:border-mp-blue-500" />
                      <Button variant="outline" className="h-10">Invite members</Button>
                    </div>
                    
                    <div className="space-y-0 border border-black-100 rounded-lg overflow-hidden divide-y divide-black-100">
                      <div className="p-3 bg-white flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar size="sm" initials={currentUser.initials} src={currentUser.avatarUrl} />
                          <div>
                            <p className="text-[14px] font-medium text-black">{currentUser.name}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-[13px] text-black-500 font-medium px-2 py-1">
                          Owner <ChevronDown className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'use' && activeTemplate) {
    return (
      <div className="flex h-full bg-white w-full">
        {/* Use Wizard Sidebar */}
        <div className="w-[340px] bg-[#F9F9F9] border-r border-black-100 flex flex-col shadow-[inset_-1px_0_0_rgba(0,0,0,0.05)] shrink-0 p-8 overflow-y-auto z-10">
          <button 
            onClick={() => setMode('gallery')} 
            className="flex items-center gap-1 text-[13px] font-medium text-mp-blue-600 hover:text-mp-blue-700 mb-6 group w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" /> Back
          </button>
          
          <h2 className="text-[24px] font-bold text-black tracking-tight mb-8">New project</h2>
          
          <form onSubmit={handleUse} className="space-y-6">
            <div>
              <label className="block text-[12px] font-semibold text-black-500 mb-2">Template</label>
              <div className="text-[14px] font-bold text-black leading-snug">{activeTemplate.name}</div>
            </div>
            
            <div>
              <label className="block text-[12px] font-semibold text-black-500 mb-2">Project name</label>
              <input
                autoFocus
                required
                type="text"
                value={projectName}
                onChange={e => setProjectName(e.target.value)}
                className="w-full h-10 px-3 text-[14px] border border-mp-blue-500 rounded-md focus:outline-none focus:ring-1 focus:ring-mp-blue-500 shadow-2xs bg-white"
              />
            </div>
            
            <div>
              <label className="block text-[12px] font-semibold text-black-500 mb-2">Privacy</label>
              <select className="w-full h-10 px-3 text-[14px] border border-black-200 rounded-md bg-white focus:outline-none focus:border-mp-blue-500 shadow-2xs">
                <option>Private to me</option>
                <option>Workspace (Public)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-[12px] font-semibold text-black-500 mb-2">Choose a reference date</label>
              <input
                required
                type="date"
                value={referenceDate}
                onChange={e => setReferenceDate(e.target.value)}
                className="w-full h-10 px-3 text-[14px] border border-black-200 rounded-md focus:outline-none focus:border-mp-blue-500 shadow-2xs bg-white"
              />
              <p className="text-[12px] text-black-400 mt-2 leading-relaxed">
                Tasks will be scheduled automatically based on this date.
              </p>
            </div>
            
            <div className="pt-4">
              <Button type="submit" className="w-full bg-mp-blue-600 hover:bg-mp-blue-700 text-white font-semibold h-10 shadow-sm rounded-md">
                Create project
              </Button>
            </div>
          </form>
        </div>
        
        {/* Main Content - Preview */}
        <div className="flex-1 flex flex-col h-full bg-white overflow-hidden min-w-0">
          <div className="h-[64px] border-b border-black-100 flex items-center px-6 shrink-0 bg-white">
            <div className="flex items-center gap-3">
              <div className={cn("w-8 h-8 rounded-md flex items-center justify-center text-white shadow-sm", activeTemplate.color)}>
                {React.createElement(iconMap[activeTemplate.icon] || Layout, { className: "w-4 h-4" })}
              </div>
              <h1 className="text-[20px] font-bold text-black truncate">{projectName || activeTemplate.name}</h1>
            </div>
          </div>
          
          <div className="flex items-center gap-6 px-8 border-b border-black-100 pt-3 shrink-0 overflow-x-auto">
            <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Overview</div>
            <div className="pb-3 border-b-2 border-mp-blue-600 text-mp-blue-700 text-[13px] font-semibold">List</div>
            <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Board</div>
            <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Timeline</div>
            <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Dashboard</div>
            <div className="pb-3 border-b-2 border-transparent text-black-500 text-[13px] font-semibold">Calendar</div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-8">
            <div className="border border-black-100 rounded-lg overflow-hidden min-w-[600px] shadow-sm">
              <div className="flex items-center bg-white border-b border-black-200 text-[12px] font-semibold text-black-400 h-10 px-4">
                <div className="w-[30px]"></div>
                <div className="flex-1 min-w-[200px]">Task name</div>
                <div className="w-[180px] shrink-0 border-l border-black-100 pl-4">Assignee</div>
                <div className="w-[140px] shrink-0 border-l border-black-100 pl-4">Due date</div>
              </div>
              
              <div className="divide-y divide-black-100">
                {activeTemplate.tasks.map((task, idx) => {
                  let computedDateStr = 'No date';
                  if (task.dayOffset !== undefined && referenceDate) {
                    const d = new Date(referenceDate);
                    d.setDate(d.getDate() + task.dayOffset);
                    computedDateStr = format(d, 'MMM d');
                  }
                  
                  return (
                    <div key={idx} className="flex items-center px-4 h-11 bg-white">
                      <div className="w-[30px] shrink-0">
                        <CheckCircle2 className="w-4 h-4 text-black-200" />
                      </div>
                      <div className="flex-1 min-w-[200px] pr-4">
                        <span className="text-[13px] text-black font-medium">{task.title}</span>
                      </div>
                      <div className="w-[180px] shrink-0 border-l border-black-100 pl-4 flex items-center gap-2">
                        {task.assigneeId ? (
                          <>
                            <Avatar size="xs" className="w-5 h-5" initials={users.find(u => u.id === task.assigneeId)?.initials || '?'} src={users.find(u => u.id === task.assigneeId)?.avatarUrl} />
                            <span className="text-[12px] text-black-600 truncate">{users.find(u => u.id === task.assigneeId)?.name || 'Unassigned'}</span>
                          </>
                        ) : (
                          <>
                            <div className="w-5 h-5 rounded-full border border-dashed border-black-300 flex items-center justify-center bg-black-50">
                              <Users className="w-3 h-3 text-black-300" />
                            </div>
                            <span className="text-[12px] text-black-400 italic">Unassigned</span>
                          </>
                        )}
                      </div>
                      <div className="w-[140px] shrink-0 border-l border-black-100 pl-4 flex items-center">
                        <span className="text-[12px] text-black-600 font-medium">
                          {task.dayOffset !== undefined ? computedDateStr : '--'}
                        </span>
                      </div>
                    </div>
                  );
                })}
                {activeTemplate.tasks.length === 0 && (
                  <div className="py-8 text-center bg-black-50">
                    <p className="text-[13px] text-black-400">This template has no tasks configured.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
