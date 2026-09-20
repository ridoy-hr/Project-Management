import React, { useState, useEffect, useRef } from 'react';
import { 
  Home, CheckCircle2, Bell, Star, Search, Plus, 
  LayoutDashboard, ChevronDown, Sparkles, Users,
  PanelLeftClose, PanelLeftOpen, MoreHorizontal
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { ViewState } from '../App';
import { ProjectDropdownMenu } from './ProjectDropdownMenu';
import { AIWorkflowModal } from './AIWorkflowModal';

interface SidebarProps {
  activeViewState: ViewState;
  onViewSelect: (type: ViewState['type'], id?: string) => void;
}

export function Sidebar({ activeViewState, onViewSelect }: SidebarProps) {
  const { 
    projects, addProject, teams, toggleProjectStar, deleteProject, 
    tasks, archivedNotificationIds, readNotificationIds 
  } = useStore();
  
  const unreadCount = tasks.filter(
    t => !(archivedNotificationIds || []).includes(t.id) && !(readNotificationIds || []).includes(t.id)
  ).length;

  const [isAddingProject, setIsAddingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  const [draggedProjectIndex, setDraggedProjectIndex] = useState<number | null>(null);
  const [dragOverProjectIndex, setDragOverProjectIndex] = useState<number | null>(null);

  const [sidebarWidth, setSidebarWidth] = useState(240);
  const isResizing = useRef(false);

  // Sidebar minimized state (persisted to localStorage)
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      return localStorage.getItem('mypeople_sidebar_minimized') === 'true';
    } catch {
      return false;
    }
  });

  const toggleMinimize = () => {
    setIsMinimized(prev => {
      const next = !prev;
      try {
        localStorage.setItem('mypeople_sidebar_minimized', String(next));
      } catch {}
      return next;
    });
  };
  
  const [contextMenu, setContextMenu] = useState<{ projectId: string, x: number, y: number } | null>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target as Node)) {
        setContextMenu(null);
      }
    }
    
    function handleMouseMove(e: MouseEvent) {
      if (!isResizing.current) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200;
      if (newWidth > 600) newWidth = 600;
      setSidebarWidth(newWidth);
      if (isMinimized) {
        setIsMinimized(false);
        try {
          localStorage.setItem('mypeople_sidebar_minimized', 'false');
        } catch {}
      }
    }
    
    function handleMouseUp() {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isMinimized]);

  const handleContextMenu = (e: React.MouseEvent, projectId: string) => {
    e.preventDefault();
    setContextMenu({
      projectId,
      x: e.clientX,
      y: e.clientY
    });
  };

  const isTypeActive = (type: string) => activeViewState.type === type;
  const isProjectActive = (id: string) => activeViewState.type === 'project' && activeViewState.id === id;

  const handleAddProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      addProject(newProjectName);
      setNewProjectName('');
      setIsAddingProject(false);
    }
  };

  return (
    <aside 
      className={cn(
        "relative h-screen bg-gradient-to-b from-mp-blue-900 to-mp-blue-800 flex flex-col shrink-0 text-mp-blue-100 border-r border-mp-blue-900 transition-[width] duration-300 ease-in-out select-none",
        isMinimized ? "w-[68px]" : ""
      )}
      style={{ width: isMinimized ? 68 : sidebarWidth }}
    >
      {/* Resizer Handle */}
      {!isMinimized && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-mp-green-500 z-50 transition-colors"
          onMouseDown={(e) => {
            e.preventDefault();
            isResizing.current = true;
            document.body.style.cursor = 'col-resize';
          }}
        />
      )}
      
      {/* Header with Logo and Expand/Minimize Toggle Icon */}
      <div className={cn(
        "h-[64px] flex items-center mb-1 shrink-0 transition-all",
        isMinimized ? "justify-center px-2" : "justify-between pl-5 pr-3.5"
      )}>
        {!isMinimized && (
          <div className="flex items-center gap-2 overflow-hidden">
            <img 
              src="https://mypeople.ai/images/mypeople_logo_new.png" 
              alt="MyPeople Logo" 
              className="h-7 w-auto object-contain brightness-0 invert opacity-90 transition-opacity" 
            />
          </div>
        )}
        <button
          type="button"
          onClick={toggleMinimize}
          className={cn(
            "p-1.5 rounded-lg text-mp-blue-200 hover:text-white hover:bg-white/10 active:scale-95 transition-all cursor-pointer flex items-center justify-center",
            isMinimized ? "w-10 h-10 bg-white/5 hover:bg-white/15" : ""
          )}
          title={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
          aria-label={isMinimized ? "Expand sidebar" : "Minimize sidebar"}
        >
          {isMinimized ? (
            <PanelLeftOpen className="w-5 h-5 text-white" />
          ) : (
            <PanelLeftClose className="w-5 h-5" />
          )}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 space-y-4 no-scrollbar pb-4">
        <ul className="space-y-0.5">
          <li>
            <button 
              onClick={() => onViewSelect('home')}
              title={isMinimized ? "Home" : undefined}
              className={cn(
                "flex items-center rounded-lg transition-colors text-[14px]", 
                isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full gap-3 px-3 py-1.5",
                isTypeActive('home') ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
              )}
            >
              <Home className="w-4 h-4 opacity-80 shrink-0" />
              {!isMinimized && <span>Home</span>}
            </button>
          </li>
          <li>
            <button 
              onClick={() => onViewSelect('my-tasks')}
              title={isMinimized ? "My Tasks" : undefined}
              className={cn(
                "flex items-center rounded-lg transition-colors text-[14px]", 
                isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full gap-3 px-3 py-1.5",
                isTypeActive('my-tasks') ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
              )}
            >
              <CheckCircle2 className="w-4 h-4 opacity-80 shrink-0" />
              {!isMinimized && <span>My Tasks</span>}
            </button>
          </li>
          <li>
            <button 
               onClick={() => onViewSelect('inbox')}
               title={isMinimized ? `Inbox (${unreadCount} unread)` : undefined}
               className={cn(
                 "relative flex items-center rounded-lg transition-colors text-[14px]", 
                 isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full justify-between px-3 py-1.5",
                 isTypeActive('inbox') ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
               )}
            >
              <div className={cn("flex items-center", isMinimized ? "" : "gap-3")}>
                <Bell className="w-4 h-4 opacity-80 shrink-0" />
                {!isMinimized && <span>Inbox</span>}
              </div>
              {unreadCount > 0 && (
                isMinimized ? (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-mp-green-500 rounded-full ring-2 ring-mp-blue-900" />
                ) : (
                  <span className="text-[10px] bg-mp-green-500 text-white font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )
              )}
            </button>
          </li>
          <li>
            <button 
               onClick={() => onViewSelect('memories')}
               title={isMinimized ? "Memories (AI)" : undefined}
               className={cn(
                 "flex items-center rounded-lg transition-colors text-[14px]", 
                 isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full justify-between px-3 py-1.5",
                 isTypeActive('memories') ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
               )}
            >
              <div className={cn("flex items-center", isMinimized ? "" : "gap-3")}>
                <Sparkles className="w-4 h-4 opacity-80 shrink-0" />
                {!isMinimized && <span>Memories</span>}
              </div>
              {!isMinimized && (
                <span className="text-[10px] bg-mp-blue-500/50 text-mp-blue-50 font-bold px-1.5 py-0.5 rounded-md">
                  AI
                </span>
              )}
            </button>
          </li>
          <li>
            <button 
               onClick={() => onViewSelect('templates')}
               title={isMinimized ? "Templates" : undefined}
               className={cn(
                 "flex items-center rounded-lg transition-colors text-[14px]", 
                 isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full gap-3 px-3 py-1.5",
                 isTypeActive('templates') ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
               )}
            >
              <LayoutDashboard className="w-4 h-4 opacity-80 shrink-0" />
              {!isMinimized && <span>Templates</span>}
            </button>
          </li>
        </ul>

        {/* Starred */}
        <div>
          <div className={cn(
            "flex items-center text-mp-blue-200",
            isMinimized ? "justify-center py-1.5" : "px-3 py-1.5 mt-2"
          )}>
            <div className="flex items-center gap-3" title={isMinimized ? "Starred" : undefined}>
              <Star className="w-4 h-4 opacity-80 shrink-0" />
              {!isMinimized && <span className="text-[14px] font-medium">Starred</span>}
            </div>
          </div>
          <ul className={cn("mt-0.5 space-y-0.5", isMinimized ? "" : "pl-4")}>
            {projects.filter(p => p.isStarred).map(project => (
              <li key={`fav-${project.id}`} className="relative group">
                <button 
                  onClick={() => onViewSelect('project', project.id)} 
                  onContextMenu={(e) => handleContextMenu(e, project.id)}
                  title={project.name}
                  className={cn(
                    "flex items-center justify-between rounded-lg transition-colors text-[14px]",
                    isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full px-3 py-1.5 text-left",
                    isProjectActive(project.id) ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
                  )}
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", project.color)}></span>
                    {!isMinimized && <span className="truncate">{project.name}</span>}
                  </div>
                  {!isMinimized && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          projectId: project.id,
                          x: rect.right + 4,
                          y: rect.top
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 text-mp-blue-200 hover:text-white transition-opacity shrink-0 cursor-pointer"
                      title="Project options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Projects */}
        <div>
          <div className={cn(
            "flex items-center group cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-mp-blue-200 mt-1",
            isMinimized ? "justify-center py-1.5" : "justify-between px-3 py-1.5"
          )}>
            <div className="flex items-center gap-3" title={isMinimized ? "Projects" : undefined}>
              <LayoutDashboard className="w-4 h-4 opacity-80 shrink-0" />
              {!isMinimized && <span className="text-[14px] font-medium">Projects</span>}
            </div>
            {!isMinimized && (
              <button onClick={(e) => { e.stopPropagation(); setIsAddingProject(true); }} className="p-1 rounded hover:bg-white/20 text-mp-blue-300 hover:text-white">
                <Plus className="w-4 h-4" />
              </button>
            )}
          </div>
          <ul className={cn("mt-0.5 space-y-0.5", isMinimized ? "" : "pl-4")}>
            {projects.map((project, index) => (
              <li 
                key={project.id}
                draggable={!isMinimized}
                onDragStart={(e) => {
                  setDraggedProjectIndex(index);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverProjectIndex(index);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedProjectIndex !== null && dragOverProjectIndex !== null && draggedProjectIndex !== dragOverProjectIndex) {
                    useStore.getState().reorderProjects(draggedProjectIndex, dragOverProjectIndex);
                  }
                  setDraggedProjectIndex(null);
                  setDragOverProjectIndex(null);
                }}
                onDragEnd={() => {
                  setDraggedProjectIndex(null);
                  setDragOverProjectIndex(null);
                }}
                className={cn(
                  "relative group transition-all",
                  dragOverProjectIndex === index 
                    ? (draggedProjectIndex! < index ? "border-b-2 border-mp-green-500" : "border-t-2 border-mp-green-500") 
                    : "border-b-2 border-transparent border-t-2 border-transparent"
                )}
              >
                <button
                  onClick={() => onViewSelect('project', project.id)}
                  onContextMenu={(e) => handleContextMenu(e, project.id)}
                  title={project.name}
                  className={cn(
                    "flex items-center justify-between rounded-lg transition-colors text-[14px]",
                    isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full px-3 py-1.5 text-left",
                    isProjectActive(project.id)
                      ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" 
                      : "text-mp-blue-100 hover:bg-white/10 hover:text-white font-medium"
                  )}
                >
                  <div className="flex items-center gap-3 truncate min-w-0">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", project.color)}></span>
                    {!isMinimized && <span className="truncate">{project.name}</span>}
                  </div>
                  {!isMinimized && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        const rect = e.currentTarget.getBoundingClientRect();
                        setContextMenu({
                          projectId: project.id,
                          x: rect.right + 4,
                          y: rect.top
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-white/20 text-mp-blue-200 hover:text-white transition-opacity shrink-0 cursor-pointer"
                      title="Project options"
                    >
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </span>
                  )}
                </button>
              </li>
            ))}
            {!isMinimized && isAddingProject && (
              <li>
                <form onSubmit={handleAddProject} className="flex items-center gap-3 px-3 py-1.5">
                   <span className="w-2.5 h-2.5 rounded-full bg-black-300"></span>
                   <input
                     autoFocus
                     type="text"
                     value={newProjectName}
                     onChange={(e) => setNewProjectName(e.target.value)}
                     onBlur={() => { if (!newProjectName.trim()) setIsAddingProject(false); }}
                     className="bg-transparent border-b border-mp-blue-600 text-[14px] text-black w-full outline-none focus:border-mp-blue-600 font-medium"
                     placeholder="New project"
                   />
                </form>
              </li>
            )}
          </ul>
        </div>

        {/* Teams / People */}
        <div>
          <div 
            onClick={() => onViewSelect('teams')}
            className={cn(
              "flex items-center group cursor-pointer hover:bg-white/10 rounded-lg transition-colors text-mp-blue-200 mt-1",
              isMinimized ? "justify-center py-1.5" : "justify-between px-3 py-1.5"
            )}
            title={isMinimized ? "People" : undefined}
          >
            <div className="flex items-center gap-3">
              <Users className="w-4 h-4 opacity-80 shrink-0" />
              {!isMinimized && <span className="text-[14px] font-medium">People</span>}
            </div>
            {!isMinimized && <span className="text-[12px] opacity-60 font-bold">{teams.length}</span>}
          </div>
          <ul className={cn("mt-0.5 space-y-0.5", isMinimized ? "" : "pl-4")}>
            {teams.map((team) => (
              <li key={team.id}>
                <button
                  onClick={() => onViewSelect('teams')}
                  title={team.name}
                  className={cn(
                    "flex items-center rounded-lg transition-colors text-[14px] hover:bg-white/10 hover:text-white",
                    isMinimized ? "justify-center w-10 h-10 mx-auto" : "w-full gap-3 px-3 py-1.5 text-left",
                    isTypeActive('teams') ? "bg-mp-blue-default/80 text-white font-medium shadow-sm" : "text-mp-blue-100 font-medium"
                  )}
                >
                  <span className={cn("w-2 h-2 rounded-full shrink-0", team.iconColor)}></span>
                  {!isMinimized && <span className="truncate">{team.name}</span>}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Bottom Section: AI Workflow Builder & Cloud Persistence */}
      <div className={cn(
        "shrink-0 p-3 border-t border-white/10 bg-black/10 transition-all",
        isMinimized ? "px-1.5 flex flex-col items-center" : ""
      )}>
        {/* AI Workflow Creator Button */}
        <button
          type="button"
          onClick={() => setIsAIModalOpen(true)}
          className={cn(
            "w-full flex items-center rounded-xl bg-gradient-to-r from-mp-blue-500 to-indigo-600 hover:from-mp-blue-400 hover:to-indigo-500 text-white shadow-md hover:shadow-lg transition-all cursor-pointer font-semibold text-xs active:scale-98 group",
            isMinimized ? "justify-center w-10 h-10 p-0" : "gap-2.5 px-3 py-2.5 text-left"
          )}
          title="AI Workflow Builder"
        >
          <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
            <Sparkles className="w-3.5 h-3.5 text-white" />
          </div>
          {!isMinimized && (
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs truncate">AI Workflow Builder</span>
              </div>
              <span className="text-[10px] text-white/80 block truncate">Create project & tasks with AI</span>
            </div>
          )}
        </button>

        {/* Cloud Persistence Badge */}
        {!isMinimized && (
          <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-mp-blue-200/80">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-medium">Firebase Synced</span>
            </div>
            <span className="text-[10px] text-white/50">Firestore DB</span>
          </div>
        )}
      </div>
      
      {/* AI Workflow Generation Modal */}
      <AIWorkflowModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onProjectCreated={(newProjectId) => onViewSelect('project', newProjectId)}
      />
      
      {contextMenu && (() => {
        const project = projects.find(p => p.id === contextMenu.projectId);
        if (!project) return null;
        return (
          <div ref={contextMenuRef}>
            <ProjectDropdownMenu
              project={project}
              isOpen={Boolean(contextMenu)}
              onClose={() => setContextMenu(null)}
              onNavigateToProject={(newProjId) => {
                onViewSelect('project', newProjId);
                setContextMenu(null);
              }}
              onProjectDeleted={() => {
                if (activeViewState.type === 'project' && activeViewState.id === project.id) {
                  onViewSelect('home');
                }
                setContextMenu(null);
              }}
              style={{
                position: 'fixed',
                top: Math.min(contextMenu.y, window.innerHeight - 380),
                left: Math.min(contextMenu.x, window.innerWidth - 270),
                zIndex: 100
              }}
            />
          </div>
        );
      })()}
    </aside>
  );
}

