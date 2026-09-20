import React, { useState, useMemo } from 'react';
import { Task, Project } from '../../types';
import { useStore } from '../../store';
import { 
  Bell, Check, Inbox, MoreHorizontal, Filter, ArrowUpDown, 
  LayoutList, Plus, Bookmark, Archive, ThumbsUp, MessageSquare, 
  ChevronDown, X, CheckSquare, Search, Tag, Calendar, User as UserIcon,
  CheckCheck, MailOpen, Mail
} from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { format } from 'date-fns';

type SortOption = 'newest' | 'oldest' | 'dueDate' | 'priority' | 'alphabetical';
type StatusFilter = 'all' | 'incomplete' | 'completed';
type DensityOption = 'detailed' | 'compact';

export function InboxView({ onTaskClick }: { onTaskClick: (task: Task) => void }) {
  const { 
    tasks, currentUser, users, projects, archivedNotificationIds, 
    readNotificationIds, archiveNotification, markNotificationAsRead,
    markNotificationAsUnread, markAllNotificationsAsRead, toggleBookmark, moveTask 
  } = useStore();

  const unreadCount = tasks.filter(
    t => !(archivedNotificationIds || []).includes(t.id) && !(readNotificationIds || []).includes(t.id)
  ).length;
  
  const [activeTab, setActiveTab] = useState<'activity' | 'bookmarks' | 'archive' | 'mentioned'>('activity');
  
  // Filter & Sort State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isDensityOpen, setIsDensityOpen] = useState(false);
  
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [density, setDensity] = useState<DensityOption>('detailed');

  // Active filter count
  const activeFilterCount = (selectedProjectId !== 'all' ? 1 : 0) + 
    (statusFilter !== 'all' ? 1 : 0) + 
    (selectedAssigneeId !== 'all' ? 1 : 0) +
    (searchQuery.trim() ? 1 : 0);

  // Filter tasks based on activeTab, project, status, assignee, and search
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Tab filter
      if (activeTab === 'archive') {
        if (!archivedNotificationIds.includes(task.id)) return false;
      } else {
        if (archivedNotificationIds.includes(task.id)) return false;
      }

      if (activeTab === 'bookmarks') {
        if (!task.bookmarked) return false;
      }

      if (activeTab === 'mentioned') {
        const isAssigned = task.assigneeId === currentUser.id;
        const hasMention = task.comments.some(c => c.text.toLowerCase().includes(currentUser.name.toLowerCase()) || c.text.includes('@'));
        if (!isAssigned && !hasMention) return false;
      }

      // 2. Project filter
      if (selectedProjectId !== 'all' && !task.projectIds.includes(selectedProjectId)) {
        return false;
      }

      // 3. Status filter
      if (statusFilter === 'completed' && task.status !== 'Done') return false;
      if (statusFilter === 'incomplete' && task.status === 'Done') return false;

      // 4. Assignee filter
      if (selectedAssigneeId !== 'all') {
        if (selectedAssigneeId === 'unassigned') {
          if (task.assigneeId) return false;
        } else if (task.assigneeId !== selectedAssigneeId) {
          return false;
        }
      }

      // 5. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(q);
        const matchesDesc = task.description?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      return true;
    });
  }, [tasks, activeTab, archivedNotificationIds, selectedProjectId, statusFilter, selectedAssigneeId, searchQuery, currentUser]);

  // Sort tasks
  const sortedTasks = useMemo(() => {
    const list = [...filteredTasks];
    switch (sortOption) {
      case 'newest':
        return list.reverse();
      case 'oldest':
        return list;
      case 'dueDate':
        return list.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
        });
      case 'priority': {
        const weight = { High: 3, Medium: 2, Low: 1 };
        return list.sort((a, b) => weight[b.priority] - weight[a.priority]);
      }
      case 'alphabetical':
        return list.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return list;
    }
  }, [filteredTasks, sortOption]);

  // Group sorted tasks by project for Asana-style inbox grouping
  const projectGroups = useMemo(() => {
    return projects.map(project => {
      const pTasks = sortedTasks.filter(t => t.projectIds.includes(project.id));
      return {
        project,
        tasks: pTasks,
        hasUnread: pTasks.length > 0
      };
    }).filter(group => group.tasks.length > 0);
  }, [projects, sortedTasks]);

  const handleArchiveGroup = (groupId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const group = projectGroups.find(g => g.project.id === groupId);
    if (group) {
      group.tasks.forEach(t => {
        archiveNotification(t.id);
        markNotificationAsRead(t.id);
      });
    }
  };

  const clearFilters = () => {
    setSelectedProjectId('all');
    setStatusFilter('all');
    setSelectedAssigneeId('all');
    setSearchQuery('');
  };

  const getSortLabel = () => {
    switch (sortOption) {
      case 'newest': return 'Newest';
      case 'oldest': return 'Oldest';
      case 'dueDate': return 'Due Date';
      case 'priority': return 'Priority';
      case 'alphabetical': return 'A to Z';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-black relative">
      
      {/* Header */}
      <div className="flex justify-between items-center px-8 py-4 shrink-0 border-b border-black-100">
        <div className="flex items-center gap-3">
          <h1 className="text-[24px] font-bold tracking-tight text-black">Inbox</h1>
          <span className="text-[13px] bg-black-100 text-black-600 px-2.5 py-0.5 rounded-full font-medium">
            {sortedTasks.length} {sortedTasks.length === 1 ? 'task' : 'tasks'}
          </span>
          {unreadCount > 0 && (
            <span className="text-[12px] bg-mp-green-50 text-mp-green-700 border border-mp-green-200 px-2 py-0.5 rounded-full font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-mp-green-500 animate-pulse" />
              {unreadCount} unread
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button 
              onClick={markAllNotificationsAsRead}
              className="text-[13px] border border-black-200 rounded-lg px-3 py-1.5 hover:bg-black-50 transition-colors font-medium text-black shadow-2xs flex items-center gap-1.5"
              title="Mark all notifications as read"
            >
              <CheckCheck className="w-3.5 h-3.5 text-mp-blue-600" />
              Mark all as read
            </button>
          )}
          <button 
            onClick={clearFilters}
            className="text-[13px] border border-black-200 rounded-lg px-3 py-1.5 hover:bg-black-50 transition-colors font-medium text-black shadow-2xs"
          >
            Reset view
          </button>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="px-8 border-b border-black-200 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setActiveTab('activity')}
            className={cn(
              "text-[13px] font-semibold pb-2.5 -mb-[1px] transition-colors border-b-2 flex items-center gap-1.5", 
              activeTab === 'activity' ? "text-mp-blue-600 border-mp-blue-600" : "text-black-500 hover:text-black border-transparent"
            )}
          >
            Activity
          </button>
          <button 
            onClick={() => setActiveTab('bookmarks')}
            className={cn(
              "text-[13px] font-semibold pb-2.5 -mb-[1px] transition-colors border-b-2 flex items-center gap-1.5", 
              activeTab === 'bookmarks' ? "text-mp-blue-600 border-mp-blue-600" : "text-black-500 hover:text-black border-transparent"
            )}
          >
            <Bookmark className="w-3.5 h-3.5" /> Bookmarks
          </button>
          <button 
            onClick={() => setActiveTab('archive')}
            className={cn(
              "text-[13px] font-semibold pb-2.5 -mb-[1px] transition-colors border-b-2 flex items-center gap-1.5", 
              activeTab === 'archive' ? "text-mp-blue-600 border-mp-blue-600" : "text-black-500 hover:text-black border-transparent"
            )}
          >
            <Archive className="w-3.5 h-3.5" /> Archive
          </button>
          <button 
            onClick={() => setActiveTab('mentioned')}
            className={cn(
              "text-[13px] font-semibold pb-2.5 -mb-[1px] transition-colors border-b-2 flex items-center gap-1.5", 
              activeTab === 'mentioned' ? "text-mp-blue-600 border-mp-blue-600" : "text-black-500 hover:text-black border-transparent"
            )}
          >
            @Mentioned
          </button>
        </div>
      </div>

      {/* Filter / Sort Toolbar */}
      <div className="px-8 py-2.5 border-b border-black-100 flex justify-between items-center shrink-0 bg-black-50/40 relative">
        <div className="flex items-center gap-3">
          
          {/* Filter Popover Button */}
          <div className="relative">
            <button 
              onClick={() => { setIsFilterOpen(!isFilterOpen); setIsSortOpen(false); setIsDensityOpen(false); }}
              className={cn(
                "flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1.5 rounded-lg border transition-all shadow-2xs",
                activeFilterCount > 0 
                  ? "bg-mp-blue-50 border-mp-blue-300 text-mp-blue-700" 
                  : "bg-white border-black-200 text-black hover:bg-black-50"
              )}
            >
              <Filter className="w-3.5 h-3.5" /> Filter
              {activeFilterCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-mp-blue-600 text-white text-[10px] flex items-center justify-center font-bold">
                  {activeFilterCount}
                </span>
              )}
              <ChevronDown className="w-3 h-3 ml-0.5 text-black-400" />
            </button>

            {/* Filter Dropdown */}
            {isFilterOpen && (
              <div className="absolute top-full left-0 mt-2 w-[300px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-4 space-y-4 animate-in fade-in duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-black-100">
                  <span className="text-[13px] font-bold text-black">Filter Inbox</span>
                  {activeFilterCount > 0 && (
                    <button onClick={clearFilters} className="text-[11px] text-mp-blue-600 font-semibold hover:underline">
                      Clear all
                    </button>
                  )}
                </div>

                {/* Search in inbox */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-black-400 mb-1">Keywords</label>
                  <div className="flex items-center gap-2 bg-black-50 border border-black-200 rounded-lg px-2.5 py-1.5">
                    <Search className="w-3.5 h-3.5 text-black-400" />
                    <input 
                      type="text" 
                      placeholder="Search title, desc..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full text-[12px] bg-transparent outline-none text-black"
                    />
                  </div>
                </div>

                {/* Project Filter */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-black-400 mb-1">Project</label>
                  <select 
                    value={selectedProjectId}
                    onChange={(e) => setSelectedProjectId(e.target.value)}
                    className="w-full text-[13px] bg-black-50 border border-black-200 rounded-lg px-2.5 py-1.5 outline-none font-medium text-black cursor-pointer"
                  >
                    <option value="all">All Projects</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-black-400 mb-1">Completion</label>
                  <div className="grid grid-cols-3 gap-1 bg-black-50 p-1 rounded-lg border border-black-200">
                    {(['all', 'incomplete', 'completed'] as StatusFilter[]).map(st => (
                      <button
                        key={st}
                        onClick={() => setStatusFilter(st)}
                        className={cn(
                          "py-1 text-[11px] font-medium rounded capitalize transition-all",
                          statusFilter === st ? "bg-white text-black shadow-xs font-semibold" : "text-black-500 hover:text-black"
                        )}
                      >
                        {st}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Assignee Filter */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-wider text-black-400 mb-1">Assignee</label>
                  <select 
                    value={selectedAssigneeId}
                    onChange={(e) => setSelectedAssigneeId(e.target.value)}
                    className="w-full text-[13px] bg-black-50 border border-black-200 rounded-lg px-2.5 py-1.5 outline-none font-medium text-black cursor-pointer"
                  >
                    <option value="all">All Team</option>
                    <option value={currentUser.id}>Assigned to me ({currentUser.name})</option>
                    <option value="unassigned">Unassigned</option>
                    {users.filter(u => u.id !== currentUser.id).map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 border-t border-black-100 flex justify-end">
                  <button 
                    onClick={() => setIsFilterOpen(false)}
                    className="text-[12px] bg-black text-white px-3 py-1 rounded-lg font-medium"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sort Popover Button */}
          <div className="relative">
            <button 
              onClick={() => { setIsSortOpen(!isSortOpen); setIsFilterOpen(false); setIsDensityOpen(false); }}
              className="flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1.5 rounded-lg border border-black-200 bg-white text-black hover:bg-black-50 transition-colors shadow-2xs"
            >
              <ArrowUpDown className="w-3.5 h-3.5 text-black-500" /> Sort: {getSortLabel()}
              <ChevronDown className="w-3 h-3 ml-0.5 text-black-400" />
            </button>

            {isSortOpen && (
              <div className="absolute top-full left-0 mt-2 w-[220px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
                <div className="px-2 py-1 text-[11px] font-semibold text-black-400 uppercase tracking-wider border-b border-black-100 mb-1">
                  Sort Order
                </div>
                {[
                  { id: 'newest', label: 'Newest First' },
                  { id: 'oldest', label: 'Oldest First' },
                  { id: 'dueDate', label: 'Due Date' },
                  { id: 'priority', label: 'Priority' },
                  { id: 'alphabetical', label: 'Alphabetical (A-Z)' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      setSortOption(opt.id as SortOption);
                      setIsSortOpen(false);
                    }}
                    className={cn(
                      "w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between",
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

          {/* Density Toggle */}
          <div className="relative">
            <button 
              onClick={() => { setIsDensityOpen(!isDensityOpen); setIsFilterOpen(false); setIsSortOpen(false); }}
              className="flex items-center gap-1.5 text-[13px] font-medium px-2.5 py-1.5 rounded-lg border border-black-200 bg-white text-black hover:bg-black-50 transition-colors shadow-2xs"
            >
              <LayoutList className="w-3.5 h-3.5 text-black-500" /> Density: {density === 'detailed' ? 'Detailed' : 'Compact'}
              <ChevronDown className="w-3 h-3 ml-0.5 text-black-400" />
            </button>

            {isDensityOpen && (
              <div className="absolute top-full left-0 mt-2 w-[180px] bg-white border border-black-200 shadow-xl rounded-xl z-50 p-2 space-y-1 animate-in fade-in duration-150">
                <button
                  onClick={() => { setDensity('detailed'); setIsDensityOpen(false); }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between",
                    density === 'detailed' ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" : "hover:bg-black-50 text-black"
                  )}
                >
                  Detailed View
                  {density === 'detailed' && <Check className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => { setDensity('compact'); setIsDensityOpen(false); }}
                  className={cn(
                    "w-full text-left px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors flex items-center justify-between",
                    density === 'compact' ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" : "hover:bg-black-50 text-black"
                  )}
                >
                  Compact View
                  {density === 'compact' && <Check className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Clear filters pill */}
        {activeFilterCount > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-[12px] text-black-500">Filtered: {sortedTasks.length} results</span>
            <button 
              onClick={clearFilters}
              className="text-[12px] text-error-text font-semibold hover:underline flex items-center gap-0.5"
            >
              <X className="w-3 h-3" /> Reset
            </button>
          </div>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto">
        {projectGroups.length === 0 ? (
          <div className="text-center text-black-400 mt-20 p-8">
            <Inbox className="w-12 h-12 mx-auto mb-4 opacity-40 text-black-400" />
            <p className="text-[15px] font-medium text-black">No notifications found</p>
            <p className="text-[13px] text-black-400 mt-1">
              {activeFilterCount > 0 
                ? 'Try adjusting or clearing your filters to see more tasks.' 
                : "You're all caught up for this section!"}
            </p>
            {activeFilterCount > 0 && (
              <button 
                onClick={clearFilters}
                className="mt-4 text-[13px] bg-black text-white px-4 py-2 rounded-lg font-medium"
              >
                Clear all filters
              </button>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-center justify-center my-6 relative">
               <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                 <div className="w-full border-t border-black-100"></div>
               </div>
               <span className="bg-white px-4 text-[12px] font-semibold uppercase tracking-wider text-black-400 z-10">
                 Workspace Activity
               </span>
            </div>
            
            <div className="max-w-4xl mx-auto pb-12 space-y-8 px-6">
              {projectGroups.map(group => (
                <div key={group.project.id} className="bg-white border border-black-200 rounded-2xl overflow-hidden shadow-xs">
                  
                  {/* Group Header */}
                  <div className="px-5 py-3.5 bg-black-50/50 border-b border-black-100 flex items-center justify-between group/header">
                    <div className="flex items-center gap-2.5">
                      <span className={cn("w-3 h-3 rounded-md", group.project.color)}></span>
                      <h2 className="text-[15px] font-bold text-black">{group.project.name}</h2>
                      <span className="text-[12px] bg-black-200/60 text-black-600 px-2 py-0.5 rounded-full font-medium">
                        {group.tasks.length}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button 
                        onClick={(e) => handleArchiveGroup(group.project.id, e)}
                        className="text-[12px] font-medium text-black-500 hover:text-black border border-black-200 bg-white px-2.5 py-1 rounded-md shadow-2xs hover:bg-black-50 transition-colors flex items-center gap-1.5" 
                        title="Archive group"
                      >
                        <Archive className="w-3.5 h-3.5" /> 
                        {activeTab === 'archive' ? 'Unarchive' : 'Archive all'}
                      </button>
                    </div>
                  </div>
                  
                  {/* Tasks List within Project */}
                  <div className="divide-y divide-black-100">
                    {group.tasks.map((task) => {
                      const assignee = users.find(u => u.id === task.assigneeId);
                      const isDone = task.status === 'Done';
                      const isUnread = !(readNotificationIds || []).includes(task.id) && !archivedNotificationIds.includes(task.id);
                      const isDue = !isDone && !!task.dueDate && (() => {
                        try {
                          const due = new Date(task.dueDate);
                          const today = new Date();
                          return new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime() <= 
                                 new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
                        } catch {
                          return false;
                        }
                      })();

                      return (
                        <div 
                          key={task.id}
                          onClick={() => {
                            markNotificationAsRead(task.id);
                            onTaskClick(task);
                          }}
                          className={cn(
                            "flex items-center justify-between cursor-pointer transition-colors group/item",
                            isDone 
                              ? "bg-[#EDF7EE] hover:bg-[#E3F3E6] text-emerald-950" 
                              : isDue 
                              ? "bg-[#FEF2F2] hover:bg-[#FEE2E2] text-red-950" 
                              : isUnread
                              ? "bg-mp-blue-50/20 hover:bg-mp-blue-50/50 text-black"
                              : "hover:bg-black-50/50 text-black",
                            density === 'detailed' ? "px-5 py-3" : "px-5 py-2"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1 mr-4">
                            {isUnread && (
                              <span 
                                className="w-2 h-2 rounded-full bg-mp-blue-600 shrink-0" 
                                title="Unread notification"
                              />
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                moveTask(task.id, isDone ? 'To Do' : 'Done');
                              }}
                              className={cn(
                                "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0",
                                isDone 
                                  ? "border-emerald-600 bg-emerald-600 text-white" 
                                  : isDue
                                  ? "border-red-400 text-transparent hover:border-emerald-600 hover:text-emerald-600"
                                  : "border-black-300 group-hover/item:border-emerald-600 text-transparent hover:text-emerald-600"
                              )}
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className={cn(
                                  "text-[13px] truncate",
                                  isDone 
                                    ? "text-emerald-900 font-semibold" 
                                    : isDue 
                                    ? "text-red-950 font-medium" 
                                    : isUnread 
                                    ? "text-black font-bold" 
                                    : "text-black font-medium"
                                )}>
                                  {task.title}
                                </span>
                                {task.priority === 'High' && (
                                  <Badge variant="error" className="text-[10px] px-1.5 py-0 shrink-0">High</Badge>
                                )}
                              </div>
                              
                              {density === 'detailed' && task.description && (
                                <p className={cn(
                                  "text-[12px] truncate mt-0.5",
                                  isDone ? "text-emerald-700/80" : isDue ? "text-red-700/80" : "text-black-400"
                                )}>
                                  {task.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Meta items & action badges */}
                          <div className="flex items-center gap-3.5 shrink-0">
                            {assignee ? (
                              <div className="flex items-center gap-1.5" title={`Assigned to ${assignee.name}`}>
                                <Avatar initials={assignee.initials} src={assignee.avatarUrl} size="sm" className="w-6 h-6 text-[10px]" />
                                {density === 'detailed' && (
                                  <span className="text-[12px] text-black-500 hidden md:inline">{assignee.name.split(' ')[0]}</span>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-black-300 italic">Unassigned</span>
                            )}

                            {task.dueDate && (
                              <span className={cn(
                                "text-[12px] font-medium whitespace-nowrap flex items-center gap-1 px-1.5 py-0.5 rounded",
                                isDue ? "bg-red-100 text-red-700 font-bold" : isDone ? "text-emerald-700" : "text-black-500"
                              )}>
                                <Calendar className="w-3 h-3" />
                                {format(new Date(task.dueDate), 'MMM d')}
                              </span>
                            )}

                            {/* Mark read/unread toggle */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                if (isUnread) {
                                  markNotificationAsRead(task.id);
                                } else {
                                  markNotificationAsUnread(task.id);
                                }
                              }}
                              className={cn(
                                "p-1.5 rounded-md hover:bg-black-100 transition-colors",
                                isUnread ? "text-mp-blue-600 hover:text-mp-blue-700" : "text-black-300 hover:text-black"
                              )}
                              title={isUnread ? "Mark as read" : "Mark as unread"}
                            >
                              {isUnread ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(task.id);
                              }}
                              className={cn(
                                "p-1.5 rounded-md hover:bg-black-100 transition-colors",
                                task.bookmarked ? "text-mp-blue-600" : "text-black-300 hover:text-black"
                              )}
                              title={task.bookmarked ? "Bookmarked" : "Bookmark task"}
                            >
                              <Bookmark className={cn("w-4 h-4", task.bookmarked && "fill-current")} />
                            </button>

                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveNotification(task.id);
                              }}
                              className="p-1.5 text-black-300 hover:text-black rounded-md hover:bg-black-100 transition-colors"
                              title={archivedNotificationIds.includes(task.id) ? "Unarchive" : "Archive"}
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
