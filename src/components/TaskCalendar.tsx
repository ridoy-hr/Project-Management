import React, { useState, useMemo } from 'react';
import { Task, User } from '../types';
import { useStore } from '../store';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, CheckSquare, Check, User as UserIcon, Diamond 
} from 'lucide-react';
import { Button } from './ui/Button';
import { Avatar } from './ui/Avatar';
import { cn } from '../lib/utils';
import { 
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday, addMonths, subMonths, 
  parseISO 
} from 'date-fns';

interface TaskCalendarProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
  onAddTaskOnDate?: (dateStr: string) => void;
}

export function TaskCalendar({ tasks, users, onTaskClick, onAddTaskOnDate }: TaskCalendarProps) {
  const { projects, moveTask } = useStore();
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    // If there's a task in 2027 or 2026, let's find the closest relevant month or use today
    const taskWithDate = tasks.find(t => t.dueDate);
    if (taskWithDate && taskWithDate.dueDate) {
      try {
        return new Date(taskWithDate.dueDate);
      } catch {
        return new Date();
      }
    }
    return new Date();
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const goToToday = () => setCurrentMonth(new Date());

  const days = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth]);

  const getAssignee = (userId?: string) => users.find(u => u.id === userId);

  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'border-l-4 border-error-border bg-error-bg/30 text-error-text';
      case 'Medium': return 'border-l-4 border-alert-text bg-alert-bg/30 text-alert-text';
      case 'Low': return 'border-l-4 border-mp-blue-400 bg-mp-blue-50 text-mp-blue-800';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-black-200 shadow-sm flex flex-col h-full overflow-hidden">
      
      {/* Calendar Navigation Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-black-100 bg-white">
        <div className="flex items-center gap-4">
          <h2 className="text-[20px] font-bold text-black tracking-tight">
            {format(currentMonth, 'MMMM yyyy')}
          </h2>
          <div className="flex items-center border border-black-200 rounded-lg overflow-hidden bg-black-50/50">
            <button 
              onClick={prevMonth}
              className="p-1.5 hover:bg-black-100 text-black-600 transition-colors"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button 
              onClick={goToToday}
              className="px-3 py-1 text-[12px] font-semibold text-black hover:bg-black-100 border-x border-black-200 transition-colors"
            >
              Today
            </button>
            <button 
              onClick={nextMonth}
              className="p-1.5 hover:bg-black-100 text-black-600 transition-colors"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[12px] text-black-500 font-medium">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-error-border"></span> High
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-alert-text"></span> Medium
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-mp-blue-500"></span> Low
          </span>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-black-200 bg-black-50/70 text-[12px] font-semibold text-black-500 tracking-wider uppercase text-center py-2 shrink-0">
        <div>Sun</div>
        <div>Mon</div>
        <div>Tue</div>
        <div>Wed</div>
        <div>Thu</div>
        <div>Fri</div>
        <div>Sat</div>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr divide-x divide-y divide-black-100 overflow-y-auto min-h-[500px]">
        {days.map((day) => {
          const dayStr = format(day, 'yyyy-MM-dd');
          const dayTasks = tasks.filter(t => {
            if (!t.dueDate) return false;
            try {
              return isSameDay(parseISO(t.dueDate), day);
            } catch {
              return t.dueDate.startsWith(dayStr);
            }
          });

          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isCurrentDay = isToday(day);

          return (
            <div 
              key={day.toISOString()}
              className={cn(
                "p-2 flex flex-col min-h-[110px] transition-colors group relative",
                !isCurrentMonth ? "bg-black-50/30 text-black-300" : "bg-white text-black",
                isCurrentDay && "bg-mp-blue-50/20"
              )}
            >
              {/* Day Number Header */}
              <div className="flex items-center justify-between mb-1.5">
                <span 
                  className={cn(
                    "text-[12px] font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors",
                    isCurrentDay 
                      ? "bg-mp-blue-600 text-white shadow-2xs" 
                      : isCurrentMonth ? "text-black" : "text-black-400"
                  )}
                >
                  {format(day, 'd')}
                </span>

                {onAddTaskOnDate && (
                  <button 
                    onClick={() => onAddTaskOnDate(dayStr)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-black-100 text-black-400 hover:text-black transition-all"
                    title={`Add task on ${format(day, 'MMM d')}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Tasks for this day */}
              <div className="space-y-1 overflow-y-auto flex-1 max-h-[130px] pr-0.5">
                {dayTasks.map(task => {
                  const assignee = getAssignee(task.assigneeId);
                  const project = projects.find(p => task.projectIds.includes(p.id));
                  const isDone = task.status === 'Done';
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
                      onClick={() => onTaskClick(task)}
                      className={cn(
                        "text-[11px] p-1.5 rounded-md cursor-pointer hover:shadow-sm transition-all border",
                        isDone 
                          ? "bg-[#EDF7EE] border-[#D4EED8] text-emerald-950 font-medium"
                          : isDue
                          ? "bg-[#FEF2F2] border-[#FECACA] text-red-950 font-medium"
                          : cn("border-black-200/60 bg-white", getPriorityColor(task.priority))
                      )}
                    >
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <div className="flex items-center gap-1 min-w-0 flex-1">
                          {task.isMilestone && (
                            <Diamond className="w-3 h-3 shrink-0 fill-emerald-600 text-emerald-600" />
                          )}
                          <span className={cn(
                            "font-semibold truncate leading-tight", 
                            isDone ? "text-emerald-900" : isDue ? "text-red-900" : task.isMilestone ? "text-emerald-700" : ""
                          )}>
                            {task.title}
                          </span>
                        </div>
                        {isDone ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : assignee ? (
                          <Avatar 
                            initials={assignee.initials} 
                            src={assignee.avatarUrl} 
                            size="sm" 
                            className="w-4 h-4 text-[8px] shrink-0" 
                          />
                        ) : null}
                      </div>

                      {project && (
                        <div className="flex items-center gap-1 text-[10px] text-black-500 font-normal truncate">
                          <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", project.color)}></span>
                          <span className="truncate">{project.name}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
