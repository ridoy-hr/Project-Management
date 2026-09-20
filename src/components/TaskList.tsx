import React, { useState } from 'react';
import { Task, User, Project, ProjectSection } from '../types';
import { Badge } from './ui/Badge';
import { Avatar } from './ui/Avatar';
import { format } from 'date-fns';
import { 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Diamond, 
  Award,
  Calendar as CalendarIcon, 
  User as UserIcon, 
  MoreHorizontal, 
  ListTodo, 
  MessageSquare,
  Paperclip,
  GripVertical,
  Check,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  X
} from 'lucide-react';
import { useStore } from '../store';
import { cn } from '../lib/utils';
import { SectionMenu } from './SectionMenu';

export type SortColumn = 'title' | 'project' | 'assignee' | 'dueDate' | 'status';
export type SortDirection = 'asc' | 'desc';

export interface CustomSectionGroup {
  id: string;
  name: string;
  tasks: Task[];
  accentColor?: string;
}

interface TaskListProps {
  tasks: Task[];
  users: User[];
  project?: Project | null;
  customSections?: CustomSectionGroup[];
  showProjectsColumn?: boolean;
  activeSortColumn?: SortColumn | null;
  activeSortDirection?: SortDirection | null;
  onSortChange?: (column: SortColumn | null, direction: SortDirection | null) => void;
  onTaskClick: (task: Task) => void;
  onQuickAddTask?: (sectionId?: string) => void;
}

export function TaskList({ 
  tasks, 
  users, 
  project, 
  customSections,
  showProjectsColumn = false,
  activeSortColumn,
  activeSortDirection,
  onSortChange,
  onTaskClick, 
  onQuickAddTask 
}: TaskListProps) {
  const { 
    moveTask, 
    addTask, 
    updateTask, 
    addSection, 
    renameSection, 
    deleteSection, 
    projects 
  } = useStore();

  // Column sorting state
  const [internalSortColumn, setInternalSortColumn] = useState<SortColumn | null>(null);
  const [internalSortDirection, setInternalSortDirection] = useState<SortDirection | null>(null);

  const sortColumn = activeSortColumn !== undefined ? activeSortColumn : internalSortColumn;
  const sortDirection = activeSortDirection !== undefined ? activeSortDirection : internalSortDirection;

  const handleSortColumn = (col: SortColumn) => {
    let nextCol: SortColumn | null = col;
    let nextDir: SortDirection | null = 'asc';

    if (sortColumn !== col) {
      nextCol = col;
      nextDir = 'asc';
    } else if (sortDirection === 'asc') {
      nextCol = col;
      nextDir = 'desc';
    } else {
      nextCol = null;
      nextDir = null;
    }

    if (activeSortColumn === undefined) {
      setInternalSortColumn(nextCol);
      setInternalSortDirection(nextDir);
    }
    if (onSortChange) {
      onSortChange(nextCol, nextDir);
    }
  };

  const handleClearSort = () => {
    if (activeSortColumn === undefined) {
      setInternalSortColumn(null);
      setInternalSortDirection(null);
    }
    if (onSortChange) {
      onSortChange(null, null);
    }
  };

  const sortTaskList = (taskList: Task[]): Task[] => {
    if (!sortColumn || !sortDirection) return taskList;

    return [...taskList].sort((a, b) => {
      let comp = 0;

      if (sortColumn === 'title') {
        comp = a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortColumn === 'project') {
        const projA = projects.find(p => a.projectIds.includes(p.id))?.name || '';
        const projB = projects.find(p => b.projectIds.includes(p.id))?.name || '';
        if (!projA && !projB) comp = 0;
        else if (!projA) comp = 1;
        else if (!projB) comp = -1;
        else comp = projA.localeCompare(projB, undefined, { sensitivity: 'base' });
      } else if (sortColumn === 'assignee') {
        const uA = users.find(u => u.id === a.assigneeId)?.name || '';
        const uB = users.find(u => u.id === b.assigneeId)?.name || '';
        if (!uA && !uB) comp = 0;
        else if (!uA) comp = 1;
        else if (!uB) comp = -1;
        else comp = uA.localeCompare(uB, undefined, { sensitivity: 'base' });
      } else if (sortColumn === 'dueDate') {
        if (!a.dueDate && !b.dueDate) comp = 0;
        else if (!a.dueDate) comp = 1;
        else if (!b.dueDate) comp = -1;
        else comp = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      } else if (sortColumn === 'status') {
        const statusRank: Record<string, number> = {
          'To Do': 1,
          'In Progress': 2,
          'Review': 3,
          'Done': 4
        };
        comp = (statusRank[a.status] || 0) - (statusRank[b.status] || 0);
      }

      return sortDirection === 'desc' ? -comp : comp;
    });
  };
  
  // Collapse state for sections (defaults to open)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  
  // Subtasks expanded state
  const [expandedSubtasks, setExpandedSubtasks] = useState<Record<string, boolean>>({});

  // Section options menu open state
  const [openSectionMenuId, setOpenSectionMenuId] = useState<string | null>(null);

  // Hide empty groups toggle
  const [hideEmptyGroups, setHideEmptyGroups] = useState(false);

  // Quick assignee picker popover
  const [assigneePickerTaskId, setAssigneePickerTaskId] = useState<string | null>(null);

  // Quick status picker popover
  const [statusPickerTaskId, setStatusPickerTaskId] = useState<string | null>(null);

  // Quick date picker task id
  const [datePickerTaskId, setDatePickerTaskId] = useState<string | null>(null);

  // Inline quick task add
  const [addingTaskSectionId, setAddingTaskSectionId] = useState<string | null>(null);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');

  // Add new section
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');

  // Edit section name
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState('');

  const toggleSectionCollapse = (secId: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [secId]: !prev[secId]
    }));
  };

  const toggleSubtasks = (taskId: string) => {
    setExpandedSubtasks(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleExpandAllSubtasks = () => {
    const next: Record<string, boolean> = {};
    tasks.forEach(t => {
      if (t.subtasks && t.subtasks.length > 0) {
        next[t.id] = true;
      }
    });
    setExpandedSubtasks(next);
  };

  const handleCollapseAllSubtasks = () => {
    setExpandedSubtasks({});
  };

  const handleExpandAllGroups = () => {
    setCollapsedSections({});
  };

  const handleCollapseAllGroups = () => {
    const next: Record<string, boolean> = {};
    const allSecs = project?.sections || [];
    allSecs.forEach(s => {
      next[s.id] = true;
    });
    if (customSections) {
      customSections.forEach(cs => {
        next[cs.id] = true;
      });
    }
    setCollapsedSections(next);
  };

  const getAssignee = (id?: string) => users.find(u => u.id === id);

  const formatTaskDueDate = (dueDateStr?: string, isDone?: boolean) => {
    if (!dueDateStr) return null;
    try {
      const due = new Date(dueDateStr);
      const today = new Date();
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
      const dueStart = new Date(due.getFullYear(), due.getMonth(), due.getDate()).getTime();
      const oneDay = 24 * 60 * 60 * 1000;

      const isYesterday = (todayStart - dueStart) === oneDay;
      const isOverdue = !isDone && dueStart < todayStart;

      let label = format(due, 'MMM d');
      if (isYesterday) {
        label = 'Yesterday';
      }

      return { label, isOverdue, isYesterday };
    } catch {
      return { label: dueDateStr, isOverdue: false, isYesterday: false };
    }
  };

  const sections: ProjectSection[] = project?.sections && project.sections.length > 0 
    ? [...project.sections].sort((a, b) => a.order - b.order)
    : [];

  const handleCreateQuickTask = (secId?: string) => {
    if (!quickTaskTitle.trim()) {
      setAddingTaskSectionId(null);
      return;
    }
    addTask({
      title: quickTaskTitle.trim(),
      status: 'To Do',
      priority: 'Medium',
      sectionId: secId,
      projectIds: project ? [project.id] : [],
      isPrivate: false,
      collaboratorIds: [],
      dependencyIds: [],
    });
    setQuickTaskTitle('');
    setAddingTaskSectionId(null);
  };

  const handleCreateNewSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSectionName.trim() && project) {
      addSection(project.id, newSectionName.trim());
      setNewSectionName('');
      setIsAddingSection(false);
    }
  };

  const handleSaveRenameSection = (secId: string) => {
    if (editingSectionName.trim()) {
      renameSection(secId, editingSectionName.trim());
    }
    setEditingSectionId(null);
  };

  const shouldShowProjects = showProjectsColumn || !project;

  const renderColumnHeader = (
    col: SortColumn, 
    label: string, 
    containerClass: string
  ) => {
    const isSorted = sortColumn === col;
    return (
      <div className={containerClass}>
        <button
          type="button"
          onClick={() => handleSortColumn(col)}
          className={cn(
            "group/col inline-flex items-center gap-1.5 py-1 px-2 -ml-2 rounded-md transition-all cursor-pointer select-none text-[12px] font-semibold text-left",
            isSorted 
              ? "text-black bg-black-100/90 font-bold shadow-2xs" 
              : "text-black-500 hover:text-black hover:bg-black-100/70"
          )}
          title={`Click to sort by ${label} ${isSorted ? (sortDirection === 'asc' ? '(Descending)' : '(Clear sort)') : '(Ascending)'}`}
        >
          <span>{label}</span>
          {isSorted ? (
            sortDirection === 'asc' ? (
              <ArrowUp className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            ) : (
              <ArrowDown className="w-3.5 h-3.5 text-black stroke-[2.5]" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-black-400 opacity-0 group-hover/col:opacity-100 transition-opacity" />
          )}
        </button>
      </div>
    );
  };

  const renderTaskRows = (taskList: Task[], sectionId?: string) => {
    const sortedTasks = sortTaskList(taskList);
    return (
      <>
        {sortedTasks.map(task => {
          const assignee = getAssignee(task.assigneeId);
          const isDone = task.status === 'Done';
          const dueDateInfo = formatTaskDueDate(task.dueDate, isDone);
          const taskProjects = projects.filter(p => task.projectIds.includes(p.id));
          const hasSubtasks = task.subtasks && task.subtasks.length > 0;
          const isSubtaskOpen = !!expandedSubtasks[task.id];

          return (
            <React.Fragment key={task.id}>
              <div 
                onClick={() => onTaskClick(task)}
                className={cn(
                  "group flex items-center transition-colors cursor-pointer text-[13px] h-[48px] px-4 relative select-none border-b border-black-100",
                  isDone 
                    ? "bg-[#FCFDFD] hover:bg-[#F4F6F6] text-black-500" 
                    : dueDateInfo?.isOverdue
                    ? "bg-[#FFFDFD] hover:bg-[#FFF5F5] text-black"
                    : "bg-white hover:bg-[#F9F8F8] text-black"
                )}
              >
                {/* Drag Grip Handle */}
                <div className="w-5 shrink-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <GripVertical className="w-3.5 h-3.5 text-black-400 cursor-grab" />
                </div>

                {/* Subtask expand chevron if task has subtasks */}
                {hasSubtasks ? (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSubtasks(task.id);
                    }}
                    className="w-4 h-4 mr-1 flex items-center justify-center text-black-400 hover:text-black transition-transform"
                    title={isSubtaskOpen ? "Collapse subtasks" : "Expand subtasks"}
                  >
                    {isSubtaskOpen ? (
                      <ChevronDown className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5" />
                    )}
                  </button>
                ) : (
                  <div className="w-4 h-4 mr-1" />
                )}

                {/* Task Name & Completion / Milestone Icon */}
                <div className="flex-1 flex items-center gap-2.5 min-w-0 pr-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      moveTask(task.id, isDone ? 'To Do' : 'Done');
                    }}
                    className="shrink-0 p-0.5 transition-transform active:scale-90"
                    title={isDone ? "Mark incomplete" : "Mark complete"}
                  >
                    {task.isMilestone ? (
                      <Diamond className={cn(
                        "w-4 h-4 transition-colors", 
                        isDone ? "fill-emerald-600 text-emerald-600" : "text-emerald-600 hover:fill-emerald-100 stroke-[1.8]"
                      )} />
                    ) : task.isApproval ? (
                      <Award className={cn(
                        "w-4.5 h-4.5 transition-colors",
                        isDone ? "text-amber-500 fill-amber-500" : "text-amber-500 hover:fill-amber-100 stroke-[1.8]"
                      )} />
                    ) : isDone ? (
                      <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 fill-emerald-500 text-white" />
                    ) : (
                      <Circle className="w-4.5 h-4.5 text-black-300 hover:text-emerald-600 transition-colors" />
                    )}
                  </button>

                  <span className={cn(
                    "truncate tracking-tight font-medium text-[13.5px]",
                    isDone 
                      ? "text-black-400 line-through" 
                      : "text-black-800"
                  )}>
                    {task.title}
                  </span>

                  {/* Comments count */}
                  {task.comments && task.comments.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-black-400 font-medium shrink-0 ml-1">
                      <span>{task.comments.length}</span>
                      <MessageSquare className="w-3 h-3 text-black-400" />
                    </span>
                  )}

                  {/* Attachments count */}
                  {task.attachments && task.attachments.length > 0 && (
                    <span className="flex items-center gap-0.5 text-[11px] text-black-400 font-medium shrink-0 ml-0.5">
                      <span>{task.attachments.length}</span>
                      <Paperclip className="w-3 h-3 text-black-400" />
                    </span>
                  )}
                </div>

                {/* Projects Column (if needed) */}
                {shouldShowProjects && (
                  <div className="w-[160px] shrink-0 flex items-center gap-1.5 overflow-hidden pr-2">
                    {taskProjects.length > 0 ? (
                      taskProjects.slice(0, 1).map(p => (
                        <span 
                          key={p.id} 
                          className="inline-flex items-center gap-1 text-[11px] font-medium bg-black-50 border border-black-200/80 px-2 py-0.5 rounded-full truncate max-w-[140px]"
                          title={p.name}
                        >
                          <span className={cn("w-2 h-2 rounded-full shrink-0", p.color)}></span>
                          <span className="truncate">{p.name}</span>
                        </span>
                      ))
                    ) : (
                      <span className="text-[11px] text-black-300">-</span>
                    )}
                  </div>
                )}

                {/* Assignee Column */}
                <div 
                  className="w-[170px] shrink-0 flex items-center gap-2 pr-2 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {assignee ? (
                    <button
                      type="button"
                      onClick={() => setAssigneePickerTaskId(assigneePickerTaskId === task.id ? null : task.id)}
                      className="flex items-center gap-2 min-w-0 hover:bg-black-50 py-1 px-1.5 rounded-md transition-colors text-left"
                    >
                      <Avatar 
                        initials={assignee.initials} 
                        src={assignee.avatarUrl} 
                        size="xs" 
                        className="w-5 h-5 rounded-full text-[9px] shrink-0"
                      />
                      <span className="text-[13px] text-black-700 truncate font-medium max-w-[120px]">
                        {assignee.name}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAssigneePickerTaskId(assigneePickerTaskId === task.id ? null : task.id)}
                      className="w-6 h-6 rounded-full border border-dashed border-black-300 flex items-center justify-center text-black-400 hover:text-black hover:border-black-500 transition-colors"
                      title="Assign task"
                    >
                      <UserIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Inline Assignee Selector */}
                  {assigneePickerTaskId === task.id && (
                    <div className="absolute left-0 top-full mt-1 w-52 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[12px]">
                      <button
                        onClick={() => {
                          updateTask(task.id, { assigneeId: undefined });
                          setAssigneePickerTaskId(null);
                        }}
                        className="w-full text-left px-3 py-1.5 hover:bg-black-50 text-black-500 flex items-center gap-2"
                      >
                        <UserIcon className="w-3.5 h-3.5" />
                        <span>Unassigned</span>
                      </button>
                      <div className="border-t border-black-100 my-1" />
                      {users.map(u => (
                        <button
                          key={u.id}
                          onClick={() => {
                            updateTask(task.id, { assigneeId: u.id });
                            setAssigneePickerTaskId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black-50 flex items-center gap-2 text-black"
                        >
                          <Avatar initials={u.initials} src={u.avatarUrl} size="xs" className="w-4 h-4 rounded-full text-[8px]" />
                          <span className="truncate">{u.name}</span>
                          {task.assigneeId === u.id && <Check className="w-3 h-3 text-emerald-600 ml-auto" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Due Date Column */}
                <div 
                  className="w-[120px] shrink-0 pr-2 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  {task.dueDate ? (
                    <button
                      type="button"
                      onClick={() => setDatePickerTaskId(datePickerTaskId === task.id ? null : task.id)}
                      className="hover:bg-black-50 px-1 py-0.5 rounded transition-colors"
                    >
                      <span className={cn(
                        "text-[12.5px]",
                        dueDateInfo?.isOverdue
                          ? "text-[#D13438] font-medium"
                          : isDone
                          ? "text-black-500 font-normal"
                          : "text-black-700 font-normal"
                      )}>
                        {dueDateInfo?.label}
                      </span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setDatePickerTaskId(datePickerTaskId === task.id ? null : task.id)}
                      className="w-6 h-6 rounded-full border border-dashed border-black-300 flex items-center justify-center text-black-400 hover:text-black hover:border-black-500 transition-colors"
                      title="Set due date"
                    >
                      <CalendarIcon className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {/* Inline Date Picker */}
                  {datePickerTaskId === task.id && (
                    <div className="absolute left-0 top-full mt-1 bg-white p-2 rounded-lg shadow-xl border border-black-200 z-50 text-[12px]">
                      <input 
                        type="date" 
                        defaultValue={task.dueDate || ''}
                        onChange={(e) => {
                          updateTask(task.id, { dueDate: e.target.value || undefined });
                          setDatePickerTaskId(null);
                        }}
                        className="border border-black-300 rounded px-2 py-1 outline-none text-black"
                      />
                      <button
                        onClick={() => {
                          updateTask(task.id, { dueDate: undefined });
                          setDatePickerTaskId(null);
                        }}
                        className="block mt-1 text-[11px] text-red-600 hover:underline"
                      >
                        Clear date
                      </button>
                    </div>
                  )}
                </div>

                {/* Status Column */}
                <div 
                  className="w-[120px] shrink-0 pr-2 relative"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    onClick={() => setStatusPickerTaskId(statusPickerTaskId === task.id ? null : task.id)}
                    className={cn(
                      "text-[11.5px] font-medium px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 border transition-colors",
                      task.status === 'Done'
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                        : task.status === 'In Progress'
                        ? "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                        : task.status === 'Review'
                        ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                        : "bg-black-50 text-black-700 border-black-200 hover:bg-black-100"
                    )}
                  >
                    <span>{task.status}</span>
                  </button>

                  {/* Status Picker Menu */}
                  {statusPickerTaskId === task.id && (
                    <div className="absolute left-0 top-full mt-1 w-36 bg-white rounded-lg shadow-xl border border-black-200 py-1 z-50 text-[12px]">
                      {(['To Do', 'In Progress', 'Review', 'Done'] as Task['status'][]).map(st => (
                        <button
                          key={st}
                          onClick={() => {
                            moveTask(task.id, st);
                            setStatusPickerTaskId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-black-50 flex items-center justify-between text-black"
                        >
                          <span>{st}</span>
                          {task.status === st && <Check className="w-3 h-3 text-emerald-600" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Render Subtasks when expanded */}
              {hasSubtasks && isSubtaskOpen && (
                <div className="bg-[#FAF9F9] pl-10 border-b border-black-100">
                  {task.subtasks!.map(sub => (
                    <div 
                      key={sub.id}
                      className="flex items-center h-[38px] text-[12.5px] border-b border-black-50 last:border-0 pr-4 hover:bg-black-50 transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => {
                          const updated = task.subtasks!.map(s => s.id === sub.id ? { ...s, isCompleted: !s.isCompleted } : s);
                          updateTask(task.id, { subtasks: updated });
                        }}
                        className="p-1 mr-2 text-black-400 hover:text-emerald-600 transition-colors"
                      >
                        {sub.isCompleted ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-500 text-white" />
                        ) : (
                          <Circle className="w-3.5 h-3.5 text-black-300 hover:text-emerald-600" />
                        )}
                      </button>
                      <span className={cn(
                        "flex-1 truncate",
                        sub.isCompleted ? "text-black-400 line-through" : "text-black-700"
                      )}>
                        {sub.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* Inline Add Task Input */}
        {addingTaskSectionId === sectionId ? (
          <div className="flex items-center border-b border-black-100 px-6 h-[44px] bg-white">
            <Circle className="w-4 h-4 text-black-300 shrink-0 mr-2.5" />
            <input 
              autoFocus
              type="text"
              value={quickTaskTitle}
              onChange={(e) => setQuickTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateQuickTask(sectionId);
                if (e.key === 'Escape') setAddingTaskSectionId(null);
              }}
              onBlur={() => handleCreateQuickTask(sectionId)}
              placeholder="Write a task name..."
              className="w-full text-[13px] outline-none bg-transparent placeholder-black-400 text-black font-medium"
            />
          </div>
        ) : (
          <div 
            onClick={() => {
              if (onQuickAddTask) {
                onQuickAddTask(sectionId);
              } else {
                setAddingTaskSectionId(sectionId || 'unsectioned');
                setQuickTaskTitle('');
              }
            }}
            className="flex items-center px-6 h-[40px] text-[13px] text-black-400 hover:text-black cursor-pointer hover:bg-black-50 transition-colors border-b border-black-100"
          >
            <span className="text-[13px] text-black-400 hover:text-black font-medium ml-4">
              Add task...
            </span>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-black-200 overflow-visible shadow-2xs">
      
      {/* Table Column Header */}
      <div className="flex items-center border-b border-black-200 bg-white text-[12px] font-semibold text-black-500 h-[42px] px-4 select-none relative">
        <div className="w-5 shrink-0" />
        <div className="w-4 mr-1 shrink-0" />
        {renderColumnHeader('title', 'Name', 'flex-1')}
        {shouldShowProjects && renderColumnHeader('project', 'Project', 'w-[160px] shrink-0')}
        {renderColumnHeader('assignee', 'Assignee', 'w-[170px] shrink-0')}
        {renderColumnHeader('dueDate', 'Due date', 'w-[120px] shrink-0')}
        {renderColumnHeader('status', 'Status', 'w-[120px] shrink-0')}

        {sortColumn && (
          <div className="ml-auto flex items-center gap-1.5 pl-2">
            <span className="text-[11px] font-medium text-black-400 hidden sm:inline">
              Sorted by <strong className="text-black capitalize">{sortColumn === 'dueDate' ? 'due date' : sortColumn === 'title' ? 'name' : sortColumn}</strong> ({sortDirection === 'asc' ? 'Asc' : 'Desc'})
            </span>
            <button
              type="button"
              onClick={handleClearSort}
              className="flex items-center gap-1 text-[11px] font-semibold text-black-600 hover:text-black bg-black-100/80 hover:bg-black-200/90 px-2 py-0.5 rounded-full transition-colors border border-black-200 cursor-pointer shadow-2xs"
              title="Clear sort and return to default view"
            >
              <span>Reset sort</span>
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Custom Sections Mode (e.g. My Tasks Sections) */}
      {customSections && customSections.length > 0 ? (
        <div className="divide-y divide-black-100/70">
          {customSections.map(sec => {
            if (hideEmptyGroups && sec.tasks.length === 0) return null;
            const isCollapsed = !!collapsedSections[sec.id];
            return (
              <div key={sec.id} className="py-2">
                <div className="flex items-center justify-between px-4 py-1.5 group">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    <button 
                      onClick={() => toggleSectionCollapse(sec.id)}
                      className="p-1 hover:bg-black-100 rounded text-black-500 hover:text-black transition-colors"
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <h3 className="text-[14px] font-bold text-black tracking-tight">
                      {sec.name}
                    </h3>
                    <span className="text-[11px] font-semibold text-black-400 bg-black-100 px-2 py-0.5 rounded-full ml-1.5">
                      {sec.tasks.length}
                    </span>
                  </div>
                </div>

                {!isCollapsed && (
                  <div>
                    {renderTaskRows(sec.tasks, sec.id)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : sections.length > 0 ? (
        /* Structured Sections Mode from Project (e.g. July-Sept 2026, Jan-June 2026) */
        <div className="divide-y divide-black-100/60">
          {(() => {
            const unsectionedTasks = tasks.filter(t => !t.sectionId || !sections.some(s => s.id === t.sectionId));
            if (unsectionedTasks.length === 0) return null;
            return (
              <div className="py-2.5 bg-black-50/40">
                <div className="flex items-center justify-between px-4 py-1.5 group">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="font-bold text-[14px] text-black">
                      (No Section)
                    </span>
                    <span className="text-[11px] font-semibold text-black-500 bg-black-100 px-2 py-0.5 rounded-full">
                      {unsectionedTasks.length}
                    </span>
                  </div>
                </div>
                <div>
                  {renderTaskRows(unsectionedTasks, undefined)}
                </div>
              </div>
            );
          })()}

          {sections.map(sec => {
            const sectionTasks = tasks.filter(t => t.sectionId === sec.id);
            if (hideEmptyGroups && sectionTasks.length === 0) return null;
            const isCollapsed = !!collapsedSections[sec.id];
            const isMenuOpen = openSectionMenuId === sec.id;

            return (
              <div key={sec.id} className="py-2.5">
                {/* Section Header Row */}
                <div className="flex items-center justify-between px-4 py-1.5 group">
                  <div className="flex items-center gap-1.5 flex-1 min-w-0">
                    {/* Grip Handle for Section Reordering */}
                    <div className="w-5 shrink-0 flex items-center justify-center cursor-grab text-black-400 hover:text-black">
                      <GripVertical className="w-3.5 h-3.5" />
                    </div>

                    {/* Collapse chevron */}
                    <button 
                      onClick={() => toggleSectionCollapse(sec.id)}
                      className="p-1 hover:bg-black-100 rounded text-black-600 hover:text-black transition-colors"
                    >
                      {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>

                    {editingSectionId === sec.id ? (
                      <div className="flex items-center gap-1.5">
                        <input 
                          autoFocus
                          type="text" 
                          value={editingSectionName} 
                          onChange={(e) => setEditingSectionName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRenameSection(sec.id);
                            if (e.key === 'Escape') setEditingSectionId(null);
                          }}
                          className="font-bold text-[14px] text-black border border-mp-blue-500 rounded px-1.5 py-0.5 outline-none"
                        />
                        <button 
                          onClick={() => handleSaveRenameSection(sec.id)}
                          className="px-2 py-0.5 bg-black text-white text-[11px] rounded font-medium"
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <h3 
                          onClick={() => toggleSectionCollapse(sec.id)}
                          className="text-[14px] font-bold text-black tracking-tight cursor-pointer hover:text-mp-blue-700 transition-colors"
                        >
                          {sec.name}
                        </h3>

                        {/* Direct + button on header */}
                        <button
                          type="button"
                          onClick={() => {
                            setAddingTaskSectionId(sec.id);
                            setQuickTaskTitle('');
                          }}
                          className="w-6 h-6 rounded flex items-center justify-center text-black-500 hover:text-black hover:bg-black-100 transition-colors"
                          title="Add task to section"
                        >
                          <Plus className="w-4 h-4" />
                        </button>

                        {/* Section Options ... Menu Trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenSectionMenuId(isMenuOpen ? null : sec.id);
                            }}
                            className={cn(
                              "w-6 h-6 rounded flex items-center justify-center text-black-500 hover:text-black hover:bg-black-100 transition-colors",
                              isMenuOpen && "bg-black-100 text-black"
                            )}
                            title="Section options"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </button>

                          {/* Section Options Dropdown Component */}
                          <SectionMenu 
                            sectionId={sec.id}
                            sectionName={sec.name}
                            projectId={project ? project.id : ''}
                            isOpen={isMenuOpen}
                            onClose={() => setOpenSectionMenuId(null)}
                            onRename={() => {
                              setEditingSectionId(sec.id);
                              setEditingSectionName(sec.name);
                            }}
                            onExpandAllSubtasks={handleExpandAllSubtasks}
                            onCollapseAllSubtasks={handleCollapseAllSubtasks}
                            onExpandAllGroups={handleExpandAllGroups}
                            onCollapseAllGroups={handleCollapseAllGroups}
                            hideEmptyGroups={hideEmptyGroups}
                            onToggleHideEmptyGroups={() => setHideEmptyGroups(!hideEmptyGroups)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Task Rows */}
                {!isCollapsed && (
                  <div>
                    {renderTaskRows(sectionTasks, sec.id)}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add Section Button / Form */}
          <div className="p-4 bg-white">
            {isAddingSection ? (
              <form onSubmit={handleCreateNewSection} className="flex items-center gap-2">
                <input 
                  autoFocus
                  type="text" 
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  placeholder="New Section Name (e.g., Oct-Dec 2026...)"
                  className="px-3 py-1.5 border border-black-300 rounded-lg text-[13px] text-black w-[320px] outline-none focus:border-mp-blue-500 font-medium"
                />
                <button 
                  type="submit" 
                  className="px-3 py-1.5 bg-black text-white text-[12px] font-semibold rounded-lg hover:bg-black-800 transition-colors"
                >
                  Add Section
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAddingSection(false)} 
                  className="px-3 py-1.5 text-black-500 hover:text-black text-[12px] transition-colors"
                >
                  Cancel
                </button>
              </form>
            ) : (
              <button 
                onClick={() => setIsAddingSection(true)}
                className="flex items-center gap-2 text-[13px] font-semibold text-black-500 hover:text-black transition-colors"
              >
                <Plus className="w-4 h-4 text-black-400" />
                <span>Add section</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Fallback Flat List if project has no sections */
        <div>
          {renderTaskRows(tasks, undefined)}
          {project && (
            <div className="p-4 bg-white border-t border-black-100">
              <button 
                onClick={() => setIsAddingSection(true)}
                className="flex items-center gap-2 text-[13px] font-semibold text-black-500 hover:text-black transition-colors"
              >
                <Plus className="w-4 h-4 text-black-400" />
                <span>Add section</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
