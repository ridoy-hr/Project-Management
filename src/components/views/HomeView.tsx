import React, { useState, useMemo } from 'react';
import { Task, Project } from '../../types';
import { useStore } from '../../store';
import { 
  CheckCircle2, Users, Sparkles, Plus, 
  ArrowUpRight, List, LayoutGrid, Calendar as CalendarIcon, 
  Filter, ArrowUpDown, ChevronDown, Check, MoreHorizontal
} from 'lucide-react';
import { format } from 'date-fns';
import { ViewState } from '../../App';
import { Avatar } from '../ui/Avatar';
import { TaskBoard } from '../TaskBoard';
import { TaskCalendar } from '../TaskCalendar';
import { cn } from '../../lib/utils';
import { MyDayEmailWidgets } from './MyDayEmailWidgets';

export function HomeView({ 
  onTaskClick, 
  onNavigate,
  onAddTask
}: { 
  onTaskClick: (task: Task) => void; 
  onNavigate: (state: ViewState) => void; 
  onAddTask?: () => void;
}) {
  const { tasks, currentUser, projects, users } = useStore();
  const [viewMode, setViewMode] = useState<'list' | 'board' | 'calendar' | 'files'>('list');

  // Basic stats
  const myOpenTasks = tasks.filter(t => t.status !== 'Done').length;
  const assignedToMe = tasks.filter(t => t.assigneeId === currentUser.id).length;
  const upcomingDeadlines = tasks.filter(t => t.dueDate && new Date(t.dueDate) > new Date() && t.status !== 'Done').length;
  const highPriority = tasks.filter(t => t.priority === 'High' && t.status !== 'Done').length;

  const projectColors: Record<string, string> = {
    'p1': 'bg-purple-500',
    'p2': 'bg-emerald-500',
    'p3': 'bg-amber-500',
    'p4': 'bg-cyan-500',
    'p0': 'bg-blue-500'
  };

  // Grouped tasks (mocked grouping based on due dates/status for visual match)
  const todayTasks = tasks.slice(0, 4);
  const thisWeekTasks = tasks.slice(4, 8);
  const nextWeekTasks = tasks.slice(8, 11);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#F5F7FA] overflow-hidden p-6 gap-6">
      
      {/* Header Banner */}
      <div className="shrink-0 relative h-32 rounded-2xl overflow-hidden border border-slate-200 flex flex-col justify-center px-8 shadow-sm">
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-90"
          style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1579546929518-9e396f3cc809?q=80&w=2940&auto=format&fit=crop)' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/80 to-transparent"></div>
        <div className="relative z-10 max-w-xl">
          <h1 className="text-[28px] font-bold text-slate-900 tracking-tight mb-1">
            Good morning, {currentUser.name.split(' ')[0]}! 👋
          </h1>
          <p className="text-[15px] font-medium text-slate-700">
            Here's what's happening with your projects today. Your work, shaped around you.
          </p>
        </div>
      </div>

      {/* Main Split Content Area */}
      <div className="flex-1 min-h-0 flex gap-6">
        
        {/* Left Main Area (flex-1) */}
        <div className="flex-1 min-w-0 flex flex-col gap-6 h-full">
          
          {/* Summary Cards */}
          <div className="grid grid-cols-4 gap-4 shrink-0">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-black leading-none mb-1">{myOpenTasks}</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">My Open Tasks</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-purple-100 shadow-sm flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-black leading-none mb-1">{assignedToMe}</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">Assigned to Me</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-emerald-100 shadow-sm flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-black leading-none mb-1">{upcomingDeadlines}</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">Deadlines</div>
              </div>
            </div>
            <div className="bg-white rounded-xl p-4 border border-pink-100 shadow-sm flex gap-3 items-center">
              <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-500 shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xl font-bold text-black leading-none mb-1">{highPriority}</div>
                <div className="text-[11px] text-slate-500 font-bold uppercase tracking-wider truncate">High Priority</div>
              </div>
            </div>
          </div>

          <MyDayEmailWidgets />

          {/* My Tasks */}
          <div className="flex-1 min-h-0 flex flex-col bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-4 pb-2 border-b border-slate-100">
              <h2 className="text-lg font-bold text-black">My Tasks</h2>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-4">
                  {['list', 'board', 'calendar', 'files'].map(mode => (
                    <button 
                      key={mode}
                      onClick={() => setViewMode(mode as any)}
                      className={cn(
                        "pb-2 text-xs font-bold capitalize transition-colors border-b-2",
                        viewMode === mode ? "border-indigo-600 text-indigo-600" : "border-transparent text-slate-500 hover:text-slate-800"
                      )}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
                <div className="w-px h-4 bg-slate-200 mx-2"></div>
                <button className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-md text-[11px] text-slate-600 font-bold transition-colors">
                  <Filter className="w-3 h-3" /> Filter <ChevronDown className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* List View */}
            {viewMode === 'list' && (
            <div className="flex-1 overflow-y-auto">
              {/* Header Row */}
              <div className="grid grid-cols-[16px_3fr_2fr_1fr_1fr_1fr_24px] gap-4 px-6 py-3 border-b border-slate-100 text-[12px] font-semibold text-slate-400">
                <div></div>
                <div>Task</div>
                <div>Project</div>
                <div>Priority</div>
                <div>Due Date</div>
                <div>Status</div>
                <div></div>
              </div>
              
              {/* Today Section */}
              <div className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-black border-b border-slate-50 bg-white">
                <div className="w-2 h-2 rounded-full bg-blue-500" /> Today
              </div>
              {todayTasks.map(task => (
                <div key={task.id} className="grid grid-cols-[16px_3fr_2fr_1fr_1fr_1fr_24px] gap-4 px-6 py-3 border-b border-slate-50 items-center text-[13px] hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onTaskClick(task)}>
                  <div className="w-4 h-4 rounded border border-slate-300" />
                  <div className="text-slate-800 font-medium truncate">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", projectColors[task.projectIds[0]] || 'bg-slate-400')} />
                    <span className="text-slate-600 truncate">{projects.find(p => p.id === task.projectIds[0])?.name || 'Project'}</span>
                  </div>
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", 
                      task.priority === 'High' ? "bg-red-50 text-red-600 border-red-100" :
                      task.priority === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>{task.priority}</span>
                  </div>
                  <div className="text-slate-500">{task.dueDate === format(new Date(), 'yyyy-MM-dd') ? 'Today' : (task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'None')}</div>
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      task.status === 'Done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      task.status === 'In Progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>{task.status}</span>
                  </div>
                  <button className="text-slate-400 hover:text-black opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              ))}

              {/* This Week Section */}
              <div className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-black border-b border-slate-50 bg-white">
                <div className="w-2 h-2 rounded-full bg-emerald-500" /> This Week
              </div>
              {thisWeekTasks.map(task => (
                <div key={task.id} className="grid grid-cols-[16px_3fr_2fr_1fr_1fr_1fr_24px] gap-4 px-6 py-3 border-b border-slate-50 items-center text-[13px] hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onTaskClick(task)}>
                  <div className="w-4 h-4 rounded border border-slate-300" />
                  <div className="text-slate-800 font-medium truncate">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", projectColors[task.projectIds[0]] || 'bg-slate-400')} />
                    <span className="text-slate-600 truncate">{projects.find(p => p.id === task.projectIds[0])?.name || 'Project'}</span>
                  </div>
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", 
                      task.priority === 'High' ? "bg-red-50 text-red-600 border-red-100" :
                      task.priority === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>{task.priority}</span>
                  </div>
                  <div className="text-slate-500">{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'None'}</div>
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      task.status === 'Done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      task.status === 'In Progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      task.status === 'Review' ? "bg-purple-50 text-purple-600 border-purple-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>{task.status}</span>
                  </div>
                  <button className="text-slate-400 hover:text-black opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              ))}

              {/* Next Week Section */}
              <div className="px-6 py-4 flex items-center gap-2 text-sm font-bold text-black border-b border-slate-50 bg-white">
                <div className="w-2 h-2 rounded-full bg-purple-500" /> Next Week
              </div>
              {nextWeekTasks.map(task => (
                <div key={task.id} className="grid grid-cols-[16px_3fr_2fr_1fr_1fr_1fr_24px] gap-4 px-6 py-3 border-b border-slate-50 items-center text-[13px] hover:bg-slate-50 transition-colors group cursor-pointer" onClick={() => onTaskClick(task)}>
                  <div className="w-4 h-4 rounded border border-slate-300" />
                  <div className="text-slate-800 font-medium truncate">{task.title}</div>
                  <div className="flex items-center gap-2">
                    <div className={cn("w-2 h-2 rounded-full", projectColors[task.projectIds[0]] || 'bg-slate-400')} />
                    <span className="text-slate-600 truncate">{projects.find(p => p.id === task.projectIds[0])?.name || 'Project'}</span>
                  </div>
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border", 
                      task.priority === 'High' ? "bg-red-50 text-red-600 border-red-100" :
                      task.priority === 'Medium' ? "bg-amber-50 text-amber-600 border-amber-100" :
                      "bg-emerald-50 text-emerald-600 border-emerald-100"
                    )}>{task.priority}</span>
                  </div>
                  <div className="text-slate-500">{task.dueDate ? format(new Date(task.dueDate), 'MMM d') : 'None'}</div>
                  <div>
                    <span className={cn("px-2.5 py-0.5 rounded-full text-[11px] font-bold border",
                      task.status === 'Done' ? "bg-emerald-50 text-emerald-600 border-emerald-100" :
                      task.status === 'In Progress' ? "bg-blue-50 text-blue-600 border-blue-100" :
                      "bg-slate-50 text-slate-600 border-slate-200"
                    )}>{task.status}</span>
                  </div>
                  <button className="text-slate-400 hover:text-black opacity-0 group-hover:opacity-100"><MoreHorizontal className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
            )}
            
            {viewMode === 'board' && (
              <div className="flex-1 overflow-auto bg-slate-50/50">
                <TaskBoard tasks={tasks} users={users} onTaskClick={onTaskClick} />
              </div>
            )}

            {viewMode === 'calendar' && (
              <div className="flex-1 overflow-auto min-h-[500px]">
                <TaskCalendar 
                  tasks={tasks} 
                  users={users} 
                  onTaskClick={onTaskClick} 
                  onAddTaskOnDate={onAddTask}
                />
              </div>
            )}

            {viewMode === 'files' && (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-8">
                <LayoutGrid className="w-12 h-12 mb-4 opacity-20" />
                <p>No files attached yet.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Widgets */}
        <div className="w-[300px] flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar pr-1 pb-2">
          
          {/* Upcoming This Week */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><CalendarIcon className="w-4 h-4 text-slate-500" /> Upcoming This Week</h3>
              <a href="#" className="text-[12px] font-semibold text-blue-600 hover:underline">View all</a>
            </div>
            <div className="space-y-4">
              <div className="flex gap-4">
                <div className="text-xs font-semibold text-slate-500 w-8">Tue<br/>Sep 2</div>
                <div className="flex-1 border-l-2 border-purple-500 pl-3">
                  <div className="text-[13px] font-bold text-slate-800">HRWest 2025 Planning</div>
                  <div className="text-[11px] text-slate-500">10:00 AM - 11:00 AM</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-xs font-semibold text-slate-500 w-8">Wed<br/>Sep 3</div>
                <div className="flex-1 border-l-2 border-emerald-500 pl-3">
                  <div className="text-[13px] font-bold text-slate-800">Marketing Sync</div>
                  <div className="text-[11px] text-slate-500">2:00 PM - 3:00 PM</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-xs font-semibold text-slate-500 w-8">Thu<br/>Sep 4</div>
                <div className="flex-1 border-l-2 border-amber-500 pl-3">
                  <div className="text-[13px] font-bold text-slate-800">Vendor Call</div>
                  <div className="text-[11px] text-slate-500">11:00 AM - 12:00 PM</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="text-xs font-semibold text-slate-500 w-8">Fri<br/>Sep 5</div>
                <div className="flex-1 border-l-2 border-blue-500 pl-3">
                  <div className="text-[13px] font-bold text-slate-800">Design Review</div>
                  <div className="text-[11px] text-slate-500">1:00 PM - 2:30 PM</div>
                </div>
              </div>
            </div>
          </div>

          {/* Team */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-slate-500" /> Team</h3>
              <a href="#" className="text-[12px] font-semibold text-blue-600 hover:underline">View all</a>
            </div>
            <div className="flex items-center gap-2">
              {users.slice(0, 5).map(u => (
                <div key={u.id}>
                  <Avatar size="sm" src={u.avatarUrl} initials={u.initials} className="ring-2 ring-white" />
                </div>
              ))}
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[11px] font-bold text-slate-600 ring-2 ring-white">
                +3
              </div>
            </div>
          </div>

          {/* Project Progress */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 shrink-0">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-500"><path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/></svg>
              Project Progress
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-purple-500" /> HRWest 2025
                  </div>
                  <span className="font-bold text-slate-600">75%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" /> Marketing Campaign
                  </div>
                  <span className="font-bold text-slate-600">60%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-amber-500" /> HR.com Awards
                  </div>
                  <span className="font-bold text-slate-600">45%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '45%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between text-[12px] mb-1">
                  <div className="flex items-center gap-2 font-medium text-slate-700">
                    <div className="w-2 h-2 rounded-full bg-cyan-500" /> HR Research
                  </div>
                  <span className="font-bold text-slate-600">80%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Promo Card */}
          <div className="bg-[#F8F5FF] border border-purple-100 rounded-2xl p-5 relative overflow-hidden shrink-0">
            <div className="relative z-10">
              <Sparkles className="w-6 h-6 text-indigo-600 mb-2" />
              <h4 className="text-indigo-950 font-bold text-[14px] leading-tight mb-2">Big ideas. Better together.</h4>
              <p className="text-slate-600 text-[12px] mb-4">
                Plan your work, track progress, meet your goals.
              </p>
              <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-[13px] font-bold py-2 px-4 rounded-lg transition-colors">
                Create a Project
              </button>
            </div>
            <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-gradient-to-tl from-emerald-400 to-teal-400 rounded-full opacity-80 blur-xl"></div>
            <div className="absolute -bottom-4 -right-12 w-28 h-28 bg-gradient-to-tl from-indigo-500 to-purple-500 rounded-full opacity-80 blur-lg"></div>
          </div>

        </div>
      </div>
    </div>
  );
}
