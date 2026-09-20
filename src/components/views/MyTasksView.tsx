import React, { useState, useMemo } from 'react';
import { Task, User } from '../../types';
import { useStore } from '../../store';
import { 
  CheckCircle2, List, LayoutGrid, Calendar as CalendarIcon, Plus, 
  Filter, ArrowUpDown, Check, User as UserIcon, ChevronDown, Sparkles, X
} from 'lucide-react';
import { TaskList, CustomSectionGroup } from '../TaskList';
import { TaskBoard } from '../TaskBoard';
import { TaskCalendar } from '../TaskCalendar';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

export function MyTasksView({ 
  onTaskClick,
  onAddTask
}: { 
  onTaskClick: (task: Task) => void;
  onAddTask?: () => void;
}) {
  const { tasks, currentUser, users, searchQuery, addTask } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar'>('list');
  const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);
  const [statusFilter, setStatusFilter] = useState<'all' | 'incomplete' | 'completed'>('all');
  const [statFilter, setStatFilter] = useState<'all' | 'overdue' | 'completed'>('all');
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'alphabetical' | 'status'>('due_date');
  const [isUserPickerOpen, setIsUserPickerOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);

  const selectedUser = users.find(u => u.id === selectedUserId) || currentUser;

  // Filter tasks assigned to the selected user and matching search query
  const rawUserTasks = useMemo(() => {
    return tasks.filter(t => 
      t.assigneeId === selectedUserId && 
      (t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       t.description?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [tasks, selectedUserId, searchQuery]);

  // Apply status and quick stat filters
  const filteredUserTasks = useMemo(() => {
    return rawUserTasks.filter(t => {
      if (statFilter === 'overdue') {
        if (t.status === 'Done' || !t.dueDate) return false;
        const d = new Date(t.dueDate);
        const today = new Date();
        return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() <= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      }
      if (statFilter === 'completed' || statusFilter === 'completed') {
        return t.status === 'Done';
      }
      if (statusFilter === 'incomplete') {
        return t.status !== 'Done';
      }
      return true;
    });
  }, [rawUserTasks, statusFilter, statFilter]);

  // Calculate Asana-style Smart Sections for My Tasks
  const customSections: CustomSectionGroup[] = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const nextWeekEnd = todayStart + (7 * 24 * 60 * 60 * 1000);

    const overdueAndToday: Task[] = [];
    const nextWeek: Task[] = [];
    const later: Task[] = [];
    const recentlyAssigned: Task[] = [];
    const completed: Task[] = [];

    filteredUserTasks.forEach(task => {
      if (task.status === 'Done') {
        completed.push(task);
        return;
      }

      if (!task.dueDate) {
        recentlyAssigned.push(task);
        return;
      }

      try {
        const d = new Date(task.dueDate);
        const taskTime = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        
        if (taskTime <= todayStart) {
          overdueAndToday.push(task);
        } else if (taskTime <= nextWeekEnd) {
          nextWeek.push(task);
        } else {
          later.push(task);
        }
      } catch {
        recentlyAssigned.push(task);
      }
    });

    // Helper sort
    const sortTasks = (list: Task[]) => {
      return [...list].sort((a, b) => {
        if (sortBy === 'priority') {
          const pRank: Record<string, number> = { Urgent: 4, High: 3, Medium: 2, Low: 1 };
          return (pRank[b.priority] || 0) - (pRank[a.priority] || 0);
        }
        if (sortBy === 'alphabetical') {
          return a.title.localeCompare(b.title);
        }
        if (sortBy === 'status') {
          const sRank: Record<string, number> = { 'To Do': 1, 'In Progress': 2, 'Review': 3, 'Done': 4 };
          return (sRank[a.status] || 0) - (sRank[b.status] || 0);
        }
        // default due date
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      });
    };

    const sectionsList: CustomSectionGroup[] = [];

    if (statFilter === 'overdue') {
      sectionsList.push({
        id: 'sec-today',
        name: 'Do Today & Overdue',
        tasks: sortTasks(overdueAndToday),
      });
      return sectionsList;
    }

    if (statFilter === 'completed') {
      sectionsList.push({
        id: 'sec-completed',
        name: 'Completed',
        tasks: sortTasks(completed),
      });
      return sectionsList;
    }

    if (overdueAndToday.length > 0 || statusFilter !== 'completed') {
      sectionsList.push({
        id: 'sec-today',
        name: 'Do Today & Overdue',
        tasks: sortTasks(overdueAndToday),
      });
    }

    if (nextWeek.length > 0 || statusFilter !== 'completed') {
      sectionsList.push({
        id: 'sec-next-week',
        name: 'Do Next Week',
        tasks: sortTasks(nextWeek),
      });
    }

    if (later.length > 0 || statusFilter !== 'completed') {
      sectionsList.push({
        id: 'sec-later',
        name: 'Do Later',
        tasks: sortTasks(later),
      });
    }

    if (recentlyAssigned.length > 0 || statusFilter !== 'completed') {
      sectionsList.push({
        id: 'sec-recent',
        name: 'Recently Assigned',
        tasks: sortTasks(recentlyAssigned),
      });
    }

    if (completed.length > 0 || statusFilter === 'completed') {
      sectionsList.push({
        id: 'sec-completed',
        name: 'Completed',
        tasks: sortTasks(completed),
      });
    }

    return sectionsList;
  }, [filteredUserTasks, statusFilter, statFilter, sortBy]);

  // Quick add task for current user
  const handleQuickAdd = () => {
    addTask({
      title: 'New task',
      status: 'To Do',
      priority: 'Medium',
      assigneeId: selectedUserId,
      dueDate: new Date().toISOString().split('T')[0],
      projectIds: [],
      isPrivate: false,
      collaboratorIds: [selectedUserId],
      dependencyIds: [],
    });
  };

  const completedCount = rawUserTasks.filter(t => t.status === 'Done').length;
  const overdueCount = rawUserTasks.filter(t => {
    if (t.status === 'Done' || !t.dueDate) return false;
    const d = new Date(t.dueDate);
    const today = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() <= new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  }).length;

  return (
    <div className="flex-1 flex flex-col h-full bg-page-bg">
      {/* Header Bar */}
      <div className="px-8 pt-6 pb-3 shrink-0 bg-white border-b border-black-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mp-blue-50 flex items-center justify-center text-mp-blue-600 border border-mp-blue-200 shadow-2xs">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-black tracking-tight">My Tasks</h1>
                
                {/* User Switcher Dropdown */}
                <div className="relative">
                  <button 
                    onClick={() => setIsUserPickerOpen(!isUserPickerOpen)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black-50 hover:bg-black-100 text-black text-[12px] font-semibold border border-black-200 transition-colors cursor-pointer"
                  >
                    <Avatar initials={selectedUser.initials} src={selectedUser.avatarUrl} size="xs" className="w-4 h-4 text-[9px]" />
                    <span>{selectedUser.name} {selectedUser.id === currentUser.id ? '(You)' : ''}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-black-400" />
                  </button>

                  {isUserPickerOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-[220px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-1.5 animate-in fade-in duration-150">
                      <div className="px-2 py-1 text-[11px] font-bold text-black-400 uppercase tracking-wider border-b border-black-100 mb-1">
                        View tasks for
                      </div>
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setIsUserPickerOpen(false);
                          }}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] transition-colors flex items-center justify-between",
                            selectedUserId === u.id ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" : "hover:bg-black-50 text-black"
                          )}
                        >
                          <div className="flex items-center gap-2">
                            <Avatar initials={u.initials} src={u.avatarUrl} size="xs" className="w-5 h-5 text-[10px]" />
                            <span>{u.name} {u.id === currentUser.id ? '(You)' : ''}</span>
                          </div>
                          {selectedUserId === u.id && <Check className="w-3.5 h-3.5" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Stats badges - Interactive & Sortable */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setStatFilter('all');
                    setStatusFilter('all');
                  }}
                  className={cn(
                    "text-[12px] font-medium px-2.5 py-0.5 rounded-full transition-all cursor-pointer border select-none flex items-center gap-1.5 active:scale-95",
                    statFilter === 'all'
                      ? "bg-black-100 text-black border-black-300 font-semibold shadow-2xs"
                      : "bg-transparent text-black-500 border-transparent hover:bg-black-100/70 hover:text-black hover:border-black-200"
                  )}
                  title="Click to view all tasks"
                >
                  <span>{rawUserTasks.length} total tasks</span>
                </button>

                {overdueCount > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (statFilter === 'overdue') {
                        setStatFilter('all');
                        setStatusFilter('all');
                      } else {
                        setStatFilter('overdue');
                        setStatusFilter('incomplete');
                        setSortBy('due_date');
                      }
                    }}
                    className={cn(
                      "text-[11px] font-bold px-2.5 py-0.5 rounded-full transition-all cursor-pointer border select-none flex items-center gap-1.5 active:scale-95",
                      statFilter === 'overdue'
                        ? "bg-[#FDE8E8] text-[#9B1C1C] border-[#F8B4B4] ring-2 ring-red-300 shadow-2xs font-extrabold"
                        : "bg-red-100 text-red-700 border-red-200 hover:bg-red-200/90 hover:border-red-300"
                    )}
                    title={statFilter === 'overdue' ? "Click to clear filter" : "Click to filter & sort by due today / overdue"}
                  >
                    <span>{overdueCount} due today / overdue</span>
                    {statFilter === 'overdue' && <X className="w-3 h-3 text-red-700 stroke-[2.5]" />}
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    if (statFilter === 'completed') {
                      setStatFilter('all');
                      setStatusFilter('all');
                    } else {
                      setStatFilter('completed');
                      setStatusFilter('completed');
                    }
                  }}
                  className={cn(
                    "text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-all cursor-pointer border select-none flex items-center gap-1.5 active:scale-95",
                    statFilter === 'completed'
                      ? "bg-[#DEF7EC] text-[#03543F] border-[#84E1BC] ring-2 ring-emerald-300 shadow-2xs font-extrabold"
                      : "bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-200/90 hover:border-emerald-300"
                  )}
                  title={statFilter === 'completed' ? "Click to clear filter" : "Click to filter completed tasks"}
                >
                  <span>{completedCount} completed</span>
                  {statFilter === 'completed' && <X className="w-3 h-3 text-emerald-800 stroke-[2.5]" />}
                </button>

                {statFilter !== 'all' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatFilter('all');
                      setStatusFilter('all');
                    }}
                    className="text-[11px] font-medium text-mp-blue-600 hover:text-mp-blue-800 hover:underline flex items-center gap-0.5 ml-1 transition-colors cursor-pointer"
                  >
                    <span>Reset filter</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5">
            {/* Filter menu */}
            <div className="relative">
              <button
                onClick={() => { setIsFilterMenuOpen(!isFilterMenuOpen); setIsSortMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors shadow-2xs",
                  statusFilter !== 'all' || statFilter !== 'all'
                    ? "bg-mp-blue-50 border-mp-blue-300 text-mp-blue-700" 
                    : "border-black-200 bg-white text-black-600 hover:text-black hover:bg-black-50"
                )}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>
                  {statFilter === 'overdue' ? 'Due today / Overdue' : statusFilter === 'all' ? 'All tasks' : statusFilter === 'incomplete' ? 'Incomplete' : 'Completed'}
                </span>
                <ChevronDown className="w-3 h-3 text-black-400" />
              </button>

              {isFilterMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[170px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-1.5 space-y-1 animate-in fade-in duration-150">
                  {[
                    { id: 'all', label: 'All tasks' },
                    { id: 'incomplete', label: 'Incomplete' },
                    { id: 'completed', label: 'Completed' },
                    { id: 'overdue', label: 'Due today / Overdue' }
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => { 
                        if (f.id === 'overdue') {
                          setStatFilter('overdue');
                          setStatusFilter('incomplete');
                          setSortBy('due_date');
                        } else {
                          setStatFilter(f.id === 'completed' ? 'completed' : 'all');
                          setStatusFilter(f.id as any);
                        }
                        setIsFilterMenuOpen(false); 
                      }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-between",
                        (f.id === 'overdue' && statFilter === 'overdue') || (statFilter !== 'overdue' && statusFilter === f.id)
                          ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" 
                          : "hover:bg-black-50 text-black"
                      )}
                    >
                      {f.label}
                      {((f.id === 'overdue' && statFilter === 'overdue') || (statFilter !== 'overdue' && statusFilter === f.id)) && (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Sort menu */}
            <div className="relative">
              <button
                onClick={() => { setIsSortMenuOpen(!isSortMenuOpen); setIsFilterMenuOpen(false); }}
                className={cn(
                  "flex items-center gap-1.5 text-[12px] font-semibold px-2.5 py-1.5 rounded-lg border transition-colors shadow-2xs",
                  sortBy !== 'due_date'
                    ? "bg-mp-blue-50 border-mp-blue-300 text-mp-blue-700"
                    : "border-black-200 bg-white text-black-600 hover:text-black hover:bg-black-50"
                )}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                <span>
                  Sort: {sortBy === 'due_date' ? 'Due Date' : sortBy === 'priority' ? 'Priority' : sortBy === 'alphabetical' ? 'Alphabetical' : 'Status'}
                </span>
                <ChevronDown className="w-3 h-3 text-black-400" />
              </button>

              {isSortMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-[170px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-1.5 space-y-1 animate-in fade-in duration-150">
                  {[
                    { id: 'due_date', label: 'Due Date' },
                    { id: 'priority', label: 'Priority' },
                    { id: 'alphabetical', label: 'Alphabetical' },
                    { id: 'status', label: 'Status' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => { setSortBy(s.id as any); setIsSortMenuOpen(false); }}
                      className={cn(
                        "w-full text-left px-2.5 py-1.5 rounded-lg text-[12px] font-medium transition-colors flex items-center justify-between",
                        sortBy === s.id ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" : "hover:bg-black-50 text-black"
                      )}
                    >
                      {s.label}
                      {sortBy === s.id && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* + Add Task button */}
            <Button 
              onClick={onAddTask || handleQuickAdd}
              size="sm" 
              className="h-8 gap-1.5 px-3 bg-[#00875A] hover:bg-[#007048] text-white rounded-lg shadow-2xs font-semibold text-[12px]"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Task</span>
            </Button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setViewMode('list')}
            className={cn(
              "flex items-center gap-2 pb-2 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer",
              viewMode === 'list' ? "border-black text-black" : "border-transparent text-black-400 hover:text-black"
            )}
          >
            <List className="w-4 h-4" /> List
          </button>
          <button 
            onClick={() => setViewMode('board')}
            className={cn(
              "flex items-center gap-2 pb-2 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer",
              viewMode === 'board' ? "border-black text-black" : "border-transparent text-black-400 hover:text-black"
            )}
          >
            <LayoutGrid className="w-4 h-4" /> Board
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={cn(
              "flex items-center gap-2 pb-2 text-[13px] font-semibold border-b-2 transition-colors cursor-pointer",
              viewMode === 'calendar' ? "border-black text-black" : "border-transparent text-black-400 hover:text-black"
            )}
          >
            <CalendarIcon className="w-4 h-4" /> Calendar
          </button>
        </div>
      </div>
      
      {/* View Content Body */}
      <div className="flex-1 overflow-y-auto px-8 py-5">
        {viewMode === 'list' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-black-200 overflow-hidden shadow-2xs">
              <TaskList 
                tasks={filteredUserTasks} 
                users={users} 
                customSections={customSections}
                showProjectsColumn={true}
                onTaskClick={onTaskClick} 
                onQuickAddTask={onAddTask}
              />
            </div>
          </div>
        )}

        {viewMode === 'board' && (
          <TaskBoard tasks={filteredUserTasks} users={users} onTaskClick={onTaskClick} />
        )}

        {viewMode === 'calendar' && (
          <div className="h-[740px]">
            <TaskCalendar tasks={filteredUserTasks} users={users} onTaskClick={onTaskClick} />
          </div>
        )}
      </div>
    </div>
  );
}
