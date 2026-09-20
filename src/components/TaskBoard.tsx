import React, { useState } from 'react';
import { Task, User, Status } from '../types';
import { Avatar } from './ui/Avatar';
import { format } from 'date-fns';
import { CheckCircle2, MessageSquare, ListTodo, Plus, Diamond } from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { Badge } from './ui/Badge';

interface TaskBoardProps {
  tasks: Task[];
  users: User[];
  onTaskClick: (task: Task) => void;
}

const COLUMNS: Status[] = ['To Do', 'In Progress', 'Review', 'Done'];

export function TaskBoard({ tasks, users, onTaskClick }: TaskBoardProps) {
  const { moveTask } = useStore();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const getPriorityBadgeVariant = (priority: Task['priority']) => {
    switch (priority) {
      case 'High': return 'error';
      case 'Medium': return 'alert';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const getAssignee = (id?: string) => users.find(u => u.id === id);

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    setTimeout(() => {
      const el = e.target as HTMLElement;
      el.style.opacity = '0.5';
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggedTaskId(null);
    const el = e.target as HTMLElement;
    el.style.opacity = '1';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, status: Status) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('taskId');
    if (taskId) {
      moveTask(taskId, status);
    }
  };

  return (
    <div className="flex gap-6 overflow-x-auto pb-4 h-full">
      {COLUMNS.map((column) => {
        const columnTasks = tasks.filter(t => t.status === column);
        
        return (
          <div 
            key={column} 
            className="flex-shrink-0 w-[300px] flex flex-col h-full bg-black-50/50 rounded-xl p-2"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, column)}
          >
            <div className="flex items-center justify-between mb-4 px-2 pt-2">
              <h3 className="font-semibold text-[14px] text-black">{column} <span className="text-black-400 font-normal ml-2">{columnTasks.length}</span></h3>
              <button className="text-black-400 hover:text-black">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="flex flex-col gap-3 overflow-y-auto px-1 pb-2">
              {columnTasks.map(task => {
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
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onTaskClick(task)}
                    className={cn(
                      "p-4 rounded-xl shadow-2xs border cursor-grab active:cursor-grabbing hover:shadow-md transition-all group flex flex-col gap-3",
                      isDone 
                        ? "bg-[#EDF7EE] border-[#D4EED8] hover:border-emerald-300"
                        : isDue 
                        ? "bg-[#FEF2F2] border-[#FECACA] hover:border-red-300"
                        : "bg-white border-black-200 hover:border-black-300"
                    )}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-1.5">
                        <Badge variant={getPriorityBadgeVariant(task.priority)}>{task.priority}</Badge>
                        {task.isMilestone && (
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            <Diamond className="w-3 h-3 fill-emerald-600 text-emerald-600" /> Milestone
                          </span>
                        )}
                      </div>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          moveTask(task.id, isDone ? 'To Do' : 'Done');
                        }}
                        className={cn(
                          "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                          isDone 
                            ? "border-emerald-600 bg-emerald-600 text-white" 
                            : isDue
                            ? "border-red-400 text-transparent hover:border-emerald-600 hover:text-emerald-600"
                            : "border-black-300 text-transparent hover:border-emerald-600 hover:text-emerald-600"
                        )}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h4 className={cn(
                      "font-medium text-[14px] leading-snug", 
                      isDone ? "text-emerald-950 font-semibold" : isDue ? "text-red-950 font-medium" : "text-black"
                    )}>
                      {task.title}
                    </h4>
                    
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2">
                        {task.assigneeId ? (
                          <Avatar initials={getAssignee(task.assigneeId)?.initials || '?'} src={getAssignee(task.assigneeId)?.avatarUrl} size="sm" />
                        ) : (
                          <div className="w-8 h-8 rounded-full border border-dashed border-black-300 flex items-center justify-center text-black-300">
                            <span className="text-[10px]">?</span>
                          </div>
                        )}
                        {task.dueDate && (
                          <span className={cn(
                            "text-[12px] font-medium",
                            isDue 
                              ? "text-red-700 bg-red-100/80 px-1.5 py-0.5 rounded font-semibold" 
                              : isDone
                              ? "text-emerald-700"
                              : "text-black-400"
                          )}>
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-black-400">
                        {task.subtasks?.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <ListTodo className="w-3.5 h-3.5" /> {task.subtasks.filter(s => s.isCompleted).length}/{task.subtasks.length}
                          </div>
                        )}
                        {task.comments?.length > 0 && (
                          <div className="flex items-center gap-1 text-[11px]">
                            <MessageSquare className="w-3.5 h-3.5" /> {task.comments.length}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
