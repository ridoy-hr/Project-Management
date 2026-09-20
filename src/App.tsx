/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { Topbar } from './components/Topbar';
import { TaskList } from './components/TaskList';
import { TaskBoard } from './components/TaskBoard';
import { TaskCalendar } from './components/TaskCalendar';
import { TaskDetailsModal } from './components/TaskDetailsModal';
import { AddTaskModal } from './components/AddTaskModal';
import { DeleteProjectModal } from './components/modals/DeleteProjectModal';
import { InboxView } from './components/views/InboxView';
import { MyTasksView } from './components/views/MyTasksView';
import { HomeView } from './components/views/HomeView';
import { MemoriesView } from './components/views/MemoriesView';
import { TemplatesView } from './components/views/TemplatesView';
import { TeamsView } from './components/views/TeamsView';
import { Task } from './types';
import { Button } from './components/ui/Button';
import { List, LayoutGrid, Calendar as CalendarIcon, Filter, ArrowUpDown, Plus, Check, ChevronDown, X, Star, FileSpreadsheet } from 'lucide-react';
import { cn } from './lib/utils';
import { useStore } from './store';
import { ToastProvider } from './components/ui/Toast';
import { ProjectDropdownMenu } from './components/ProjectDropdownMenu';
import { AddTaskDropdown } from './components/AddTaskDropdown';
import { GoogleSheetSyncModal } from './components/modals/GoogleSheetSyncModal';
import { initFirebaseSync } from './lib/firebaseSync';

export type ViewState = { 
  type: 'project' | 'home' | 'my-tasks' | 'inbox' | 'memories' | 'portfolios' | 'goals' | 'teams' | 'templates'; 
  id?: string 
};

export default function App() {
  const { 
    tasks, projects, users, currentUser, searchQuery, 
    toggleProjectStar, deleteProject,
    projectPendingDelete, setProjectPendingDelete,
    createTasksFromGoogleSheetRows
  } = useStore();
  const [viewState, setViewState] = useState<ViewState>({ type: 'project', id: projects[0]?.id });
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [addTaskOptions, setAddTaskOptions] = useState<{ isOpen: boolean; isMilestone?: boolean; isApproval?: boolean }>({ isOpen: false });
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isHeaderSheetModalOpen, setIsHeaderSheetModalOpen] = useState(false);
  const projectMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    initFirebaseSync();
    function handleClickOutside(e: MouseEvent) {
      if (projectMenuRef.current && !projectMenuRef.current.contains(e.target as Node)) {
        setIsProjectMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Real-time synchronization for tasks sent from Google Sheets Apps Script
  React.useEffect(() => {
    if (viewState.type !== 'project' || !viewState.id) return;
    const currentProjId = viewState.id;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${currentProjId}/pending-sheet-tasks`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.tasks && data.tasks.length > 0) {
          createTasksFromGoogleSheetRows(currentProjId, data.tasks);
        }
      } catch {
        // background poll
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [viewState.type, viewState.id, createTasksFromGoogleSheetRows]);
  
  // Project View Filter & Sort
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'none' | 'dueDate' | 'priority' | 'title'>('none');

  const activeProject = viewState.type === 'project' ? projects.find(p => p.id === viewState.id) : null;

  // Filtered & Sorted Tasks for Active Project
  const projectTasks = useMemo(() => {
    if (viewState.type !== 'project' || !viewState.id) return [];
    
    let list = tasks.filter(t => t.projectIds.includes(viewState.id!));
    
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(t => t.title.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q));
    }

    if (statusFilter === 'completed') {
      list = list.filter(t => t.status === 'Done');
    } else if (statusFilter === 'incomplete') {
      list = list.filter(t => t.status !== 'Done');
    }

    if (assigneeFilter !== 'all') {
      if (assigneeFilter === 'unassigned') {
        list = list.filter(t => !t.assigneeId);
      } else {
        list = list.filter(t => t.assigneeId === assigneeFilter);
      }
    }

    if (sortOption === 'dueDate') {
      list = [...list].sort((a, b) => {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    } else if (sortOption === 'priority') {
      const weight = { High: 3, Medium: 2, Low: 1 };
      list = [...list].sort((a, b) => weight[b.priority] - weight[a.priority]);
    } else if (sortOption === 'title') {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [tasks, viewState, searchQuery, statusFilter, assigneeFilter, sortOption]);

  const activeFilterCount = (statusFilter !== 'all' ? 1 : 0) + (assigneeFilter !== 'all' ? 1 : 0);

  const { addSection } = useStore();

  const handleCreateTask = (options?: { isMilestone?: boolean; isApproval?: boolean; sectionId?: string } | string) => {
    if (typeof options === 'string') {
      setAddTaskOptions({ isOpen: true, sectionId: options });
    } else {
      setAddTaskOptions({ isOpen: true, ...options });
    }
  };

  return (
    <ToastProvider>
      <div className="flex h-screen bg-[#F5F7FA] overflow-hidden">
        <Sidebar activeViewState={viewState} onViewSelect={(type, id) => setViewState({ type, id })} />
        
        <main className="flex-1 flex flex-col h-screen min-w-0">
          <Topbar onAddTask={handleCreateTask} onNavigate={setViewState} />
          
          {viewState.type === 'project' && (
            <>
              {/* Project Header */}
              <div className="px-8 pt-6 pb-2 shrink-0 bg-white border-b border-black-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3 relative group">
                    <div className={cn("w-4 h-4 rounded-md shadow-2xs", activeProject?.color)}></div>
                    <h1 className="text-[22px] font-bold text-black tracking-tight">{activeProject?.name}</h1>
                    
                    {/* Project Dropdown */}
                    <div className="relative" ref={projectMenuRef}>
                      <button 
                        onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
                        className="p-1 rounded-md hover:bg-black-100 text-black-400 hover:text-black transition-colors"
                      >
                        <ChevronDown className="w-5 h-5" />
                      </button>
                      {activeProject && (
                        <ProjectDropdownMenu
                          project={activeProject}
                          isOpen={isProjectMenuOpen}
                          onClose={() => setIsProjectMenuOpen(false)}
                          onNavigateToProject={(newProjId) => {
                            setViewState({ type: 'project', id: newProjId });
                            setIsProjectMenuOpen(false);
                          }}
                          onProjectDeleted={() => {
                            setViewState({ type: 'home' });
                            setIsProjectMenuOpen(false);
                          }}
                          className="absolute left-0 top-full mt-1"
                        />
                      )}
                    </div>

                    <button 
                      onClick={() => activeProject && toggleProjectStar(activeProject.id)}
                      className={cn("p-1 rounded-md transition-colors", activeProject?.isStarred ? "text-yellow-500 hover:text-yellow-600" : "text-black-200 hover:text-yellow-400 opacity-0 group-hover:opacity-100")}
                    >
                      <Star className="w-5 h-5 fill-current" />
                    </button>

                    <span className="text-[12px] bg-black-100 text-black-600 px-2 py-0.5 rounded-full font-medium ml-2">
                      {projectTasks.length} tasks
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Google Sheets Sync Button */}
                    <button
                      type="button"
                      onClick={() => setIsHeaderSheetModalOpen(true)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-2xs",
                        activeProject?.connectedSheet
                          ? "bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                          : "bg-white border-black-200 text-black-700 hover:bg-black-50 hover:border-black-300"
                      )}
                      title={activeProject?.connectedSheet ? "Google Sheet 2-Way Sync Active - Click to Manage" : "Connect Google Sheet to this project"}
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{activeProject?.connectedSheet ? 'Google Sheet Synced' : 'Connect Sheet'}</span>
                      {activeProject?.connectedSheet && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ml-0.5 animate-pulse"></span>
                      )}
                    </button>

                    <AddTaskDropdown 
                      onAddStandardTask={() => handleCreateTask()}
                      onAddApproval={() => handleCreateTask({ isApproval: true })}
                      onAddMilestone={() => handleCreateTask({ isMilestone: true })}
                      onAddSection={() => {
                        if (activeProject) addSection(activeProject.id, 'New Section');
                      }}
                    />
                  </div>
                </div>
              
              <div className="flex items-center justify-between">
                
                {/* View Mode Tabs: List | Board | Calendar */}
                <div className="flex items-center gap-6">
                  <button 
                    onClick={() => setViewMode('list')}
                    className={cn(
                      "flex items-center gap-2 pb-3 text-[13px] font-semibold border-b-2 transition-colors",
                      viewMode === 'list' ? "border-black text-black" : "border-transparent text-black-400 hover:text-black"
                    )}
                  >
                    <List className="w-4 h-4" /> List
                  </button>
                  <button 
                    onClick={() => setViewMode('board')}
                    className={cn(
                      "flex items-center gap-2 pb-3 text-[13px] font-semibold border-b-2 transition-colors",
                      viewMode === 'board' ? "border-black text-black" : "border-transparent text-black-400 hover:text-black"
                    )}
                  >
                    <LayoutGrid className="w-4 h-4" /> Board
                  </button>
                  <button 
                    onClick={() => setViewMode('calendar')}
                    className={cn(
                      "flex items-center gap-2 pb-3 text-[13px] font-semibold border-b-2 transition-colors",
                      viewMode === 'calendar' ? "border-black text-black" : "border-transparent text-black-400 hover:text-black"
                    )}
                  >
                    <CalendarIcon className="w-4 h-4" /> Calendar
                  </button>
                </div>
                
                {/* Filter and Sort Controls */}
                <div className="flex items-center gap-2.5 pb-2 relative">
                  
                  {/* Filter Dropdown */}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); }}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors shadow-2xs cursor-pointer whitespace-nowrap",
                        activeFilterCount > 0 ? "bg-mp-blue-50 border-mp-blue-300 text-mp-blue-700" : "border-black-200 bg-white text-black-600 hover:text-black hover:bg-black-50"
                      )}
                    >
                      <Filter className="w-3.5 h-3.5 shrink-0" /> 
                      <span>Filter {activeFilterCount > 0 ? `(${activeFilterCount})` : ''}</span>
                      <ChevronDown className="w-3 h-3 text-black-400 shrink-0" />
                    </button>

                    {isFilterOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-[240px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-3 space-y-3 animate-in fade-in duration-150">
                        <div className="flex items-center justify-between border-b border-black-100 pb-1.5">
                          <span className="text-[12px] font-bold text-black">Filter Tasks</span>
                          {activeFilterCount > 0 && (
                            <button 
                              onClick={() => { setStatusFilter('all'); setAssigneeFilter('all'); }}
                              className="text-[11px] text-mp-blue-600 font-semibold hover:underline"
                            >
                              Reset
                            </button>
                          )}
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-black-400 uppercase tracking-wider block mb-1">Status</label>
                          <select 
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value as any)}
                            className="w-full text-[12px] bg-black-50 border border-black-200 rounded-md p-1.5 outline-none font-medium"
                          >
                            <option value="all">All statuses</option>
                            <option value="incomplete">Incomplete only</option>
                            <option value="completed">Completed only</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-semibold text-black-400 uppercase tracking-wider block mb-1">Assignee</label>
                          <select 
                            value={assigneeFilter}
                            onChange={(e) => setAssigneeFilter(e.target.value)}
                            className="w-full text-[12px] bg-black-50 border border-black-200 rounded-md p-1.5 outline-none font-medium"
                          >
                            <option value="all">All assignees</option>
                            <option value={currentUser.id}>Assigned to me</option>
                            <option value="unassigned">Unassigned</option>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                          </select>
                        </div>
                        <Button size="sm" onClick={() => setIsFilterOpen(false)} className="w-full h-7 text-[12px]">Done</Button>
                      </div>
                    )}
                  </div>

                  {/* Sort Dropdown */}
                  <div className="relative">
                    <button 
                      type="button"
                      onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); }}
                      className={cn(
                        "inline-flex items-center gap-1.5 text-[12px] font-semibold px-3 py-1.5 rounded-lg border transition-colors shadow-2xs cursor-pointer whitespace-nowrap",
                        sortOption !== 'none' ? "bg-mp-blue-50 border-mp-blue-300 text-mp-blue-700" : "border-black-200 bg-white text-black-600 hover:text-black hover:bg-black-50"
                      )}
                    >
                      <ArrowUpDown className="w-3.5 h-3.5 shrink-0" /> 
                      <span>Sort: {sortOption === 'none' ? 'Default' : sortOption === 'dueDate' ? 'Due date' : sortOption === 'priority' ? 'Priority' : 'Name'}</span>
                      <ChevronDown className="w-3 h-3 text-black-400 shrink-0" />
                    </button>

                    {isSortOpen && (
                      <div className="absolute left-0 top-full mt-1.5 w-[180px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-1.5 space-y-1 animate-in fade-in duration-150">
                        {[
                          { id: 'none', label: 'Default order' },
                          { id: 'dueDate', label: 'Due date' },
                          { id: 'priority', label: 'Priority' },
                          { id: 'title', label: 'Alphabetical' },
                        ].map(opt => (
                          <button
                            key={opt.id}
                            onClick={() => { setSortOption(opt.id as any); setIsSortOpen(false); }}
                            className={cn(
                              "w-full text-left px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center justify-between",
                              sortOption === opt.id ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" : "hover:bg-black-50 text-black"
                            )}
                          >
                            {opt.label}
                            {sortOption === opt.id && <Check className="w-3.5 h-3.5" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            </div>

            {/* Main View Content Area */}
            <div className="flex-1 overflow-y-auto px-8 py-4">
              {viewMode === 'list' && (
                <TaskList 
                  tasks={projectTasks} 
                  users={users} 
                  project={activeProject}
                  onTaskClick={setSelectedTask} 
                  onQuickAddTask={handleCreateTask}
                />
              )}
              {viewMode === 'board' && (
                <TaskBoard tasks={projectTasks} users={users} onTaskClick={setSelectedTask} />
              )}
              {viewMode === 'calendar' && (
                <div className="h-[740px]">
                  <TaskCalendar 
                    tasks={projectTasks} 
                    users={users} 
                    onTaskClick={setSelectedTask} 
                    onAddTaskOnDate={() => handleCreateTask()}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {viewState.type === 'home' && (
          <HomeView 
            onTaskClick={setSelectedTask} 
            onNavigate={setViewState} 
            onAddTask={handleCreateTask} 
          />
        )}
        {viewState.type === 'my-tasks' && (
          <MyTasksView 
            onTaskClick={setSelectedTask} 
            onAddTask={handleCreateTask} 
          />
        )}
        {viewState.type === 'inbox' && <InboxView onTaskClick={setSelectedTask} />}
        {viewState.type === 'memories' && <MemoriesView onTaskClick={setSelectedTask} />}
        {viewState.type === 'templates' && <TemplatesView onNavigate={setViewState} />}
        {viewState.type === 'portfolios' && <HomeView onTaskClick={setSelectedTask} onNavigate={setViewState} onAddTask={handleCreateTask} />}
        {viewState.type === 'goals' && <HomeView onTaskClick={setSelectedTask} onNavigate={setViewState} onAddTask={handleCreateTask} />}
        {viewState.type === 'teams' && <TeamsView onNavigate={setViewState} onTaskClick={setSelectedTask} />}
      </main>

      <TaskDetailsModal 
        task={tasks.find(t => t.id === selectedTask?.id) || null} 
        onClose={() => setSelectedTask(null)}
        onSelectTask={(t) => setSelectedTask(t)}
      />
      {addTaskOptions.isOpen && (
        <AddTaskModal 
          onClose={() => setAddTaskOptions({ isOpen: false })} 
          defaultProjectId={viewState.type === 'project' ? viewState.id : undefined} 
          defaultIsMilestone={addTaskOptions.isMilestone}
          defaultIsApproval={addTaskOptions.isApproval}
        />
      )}

      {projectPendingDelete && (
        <DeleteProjectModal 
          project={projectPendingDelete}
          isOpen={Boolean(projectPendingDelete)}
          onClose={() => setProjectPendingDelete(null)}
          onConfirm={() => {
            const pid = projectPendingDelete.id;
            deleteProject(pid);
            if (viewState.type === 'project' && viewState.id === pid) {
              const remaining = projects.filter(p => p.id !== pid);
              if (remaining.length > 0) {
                setViewState({ type: 'project', id: remaining[0].id });
              } else {
                setViewState({ type: 'home' });
              }
            }
            setProjectPendingDelete(null);
          }}
        />
      )}

      {activeProject && (
        <GoogleSheetSyncModal
          project={activeProject}
          isOpen={isHeaderSheetModalOpen}
          onClose={() => setIsHeaderSheetModalOpen(false)}
        />
      )}
      </div>
    </ToastProvider>
  );
}
