import React, { useState } from 'react';
import { useStore } from '../../store';
import { Goal, Project, Task } from '../../types';
import { ViewState } from '../../App';
import { 
  Target, Plus, CheckCircle2, AlertTriangle, ArrowUpRight, 
  TrendingUp, Calendar, Users, X, Edit3, Award 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface GoalsViewProps {
  onNavigate: (state: ViewState) => void;
  onTaskClick: (task: Task) => void;
}

export function GoalsView({ onNavigate, onTaskClick }: GoalsViewProps) {
  const { goals, projects, users, currentUser, updateGoalProgress, addGoal } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingGoalId, setEditingGoalId] = useState<string | null>(null);
  const [editProgress, setEditProgress] = useState<number>(50);

  // New goal form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTimeframe, setNewTimeframe] = useState('Q4 2026');
  const [newTargetMetric, setNewTargetMetric] = useState('100% Complete');
  const [newLinkedProjects, setNewLinkedProjects] = useState<string[]>([]);

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    addGoal({
      title: newTitle.trim(),
      description: newDescription.trim(),
      ownerId: currentUser.id,
      timeframe: newTimeframe,
      progress: 0,
      targetMetric: newTargetMetric || '100% Complete',
      currentMetric: 'Initiated',
      health: 'On Track',
      linkedProjectIds: newLinkedProjects
    });
    setNewTitle('');
    setNewDescription('');
    setNewLinkedProjects([]);
    setIsAddModalOpen(false);
  };

  const handleSaveProgress = (goalId: string) => {
    updateGoalProgress(goalId, editProgress, `${editProgress}% Delivered`);
    setEditingGoalId(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-page-bg overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 bg-white border-b border-black-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-black tracking-tight">Goals & Strategic OKRs</h1>
                <span className="text-[12px] bg-black-100 text-black-600 px-2 py-0.5 rounded-full font-medium">
                  {goals.length} active
                </span>
              </div>
              <p className="text-[13px] text-black-500">Connect strategic organizational objectives directly to execution projects</p>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="h-8.5 px-3.5 gap-1.5 shadow-2xs">
            <Plus className="w-4 h-4" /> Add Goal
          </Button>
        </div>
      </div>

      {/* Surface */}
      <div className="px-8 py-6 space-y-6">
        {/* Metric summary banner */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-black-400 uppercase tracking-wider block">Average OKR Velocity</span>
              <span className="text-[26px] font-bold text-black mt-1 block">
                {Math.round(goals.reduce((acc, g) => acc + g.progress, 0) / (goals.length || 1))}%
              </span>
              <span className="text-[12px] text-success-border font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> Pace on schedule
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Award className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-black-400 uppercase tracking-wider block">Goals on Track</span>
              <span className="text-[26px] font-bold text-black mt-1 block">
                {goals.filter(g => g.health === 'On Track').length} / {goals.length}
              </span>
              <span className="text-[12px] text-black-400 font-medium mt-1 block">100% health transparency</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-success-bg text-success-text flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm flex items-center justify-between">
            <div>
              <span className="text-[12px] font-semibold text-black-400 uppercase tracking-wider block">Connected Workspaces</span>
              <span className="text-[26px] font-bold text-black mt-1 block">{projects.length} Initiatives</span>
              <span className="text-[12px] text-black-400 font-medium mt-1 block">All teams aligned</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Goals Cards List */}
        <div className="space-y-4">
          {goals.map(goal => {
            const owner = users.find(u => u.id === goal.ownerId) || users[0];
            const linkedProjs = projects.filter(p => goal.linkedProjectIds.includes(p.id));

            return (
              <div key={goal.id} className="bg-white rounded-2xl border border-black-200 shadow-sm p-6 space-y-4 hover:border-black-300 transition-all">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700">
                        {goal.timeframe}
                      </span>
                      <Badge variant={goal.health === 'On Track' ? 'success' : 'alert'}>
                        {goal.health}
                      </Badge>
                    </div>
                    <h2 className="text-[18px] font-bold text-black tracking-tight">{goal.title}</h2>
                    <p className="text-[13px] text-black-500 max-w-2xl">{goal.description}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Avatar initials={owner.initials} src={owner.avatarUrl} size="sm" />
                    <div className="text-right">
                      <div className="text-[12px] font-bold text-black">{owner.name}</div>
                      <div className="text-[11px] text-black-400">Goal Owner</div>
                    </div>
                  </div>
                </div>

                {/* Progress Bar & Interactive Slider */}
                <div className="space-y-2 bg-black-50/50 p-4 rounded-xl border border-black-100">
                  <div className="flex items-center justify-between text-[13px]">
                    <span className="font-semibold text-black">Progress Metric: {goal.currentMetric} / {goal.targetMetric}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-black">{goal.progress}%</span>
                      <button 
                        onClick={() => {
                          setEditingGoalId(goal.id);
                          setEditProgress(goal.progress);
                        }}
                        className="text-[12px] font-medium text-mp-blue-600 hover:text-mp-blue-700 hover:underline flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Update
                      </button>
                    </div>
                  </div>

                  <div className="w-full bg-black-200 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>

                  {editingGoalId === goal.id && (
                    <div className="pt-3 border-t border-black-200 flex items-center gap-4 animate-in fade-in duration-150">
                      <span className="text-[12px] font-bold text-black shrink-0">Adjust: {editProgress}%</span>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={editProgress}
                        onChange={(e) => setEditProgress(Number(e.target.value))}
                        className="w-full accent-purple-600 cursor-pointer"
                      />
                      <Button size="sm" onClick={() => handleSaveProgress(goal.id)} className="h-7 text-[12px] px-2.5">
                        Save
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditingGoalId(null)} className="h-7 text-[12px] px-2">
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>

                {/* Linked Projects Chips */}
                {linkedProjs.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="text-[12px] font-semibold text-black-400">Supporting Projects:</span>
                    {linkedProjs.map(p => (
                      <button
                        key={p.id}
                        onClick={() => onNavigate({ type: 'project', id: p.id })}
                        className="px-2.5 py-1 rounded-lg bg-black-100 hover:bg-black-200 text-black text-[12px] font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <span className={cn("w-2 h-2 rounded-full", p.color)}></span>
                        {p.name}
                        <ArrowUpRight className="w-3 h-3 text-black-400" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-[520px] shadow-2xl border border-black-200 relative">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-black-400 hover:text-black rounded-lg hover:bg-black-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Target className="w-5 h-5" />
              </div>
              <h2 className="text-[18px] font-bold text-black">Create Strategic Goal</h2>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Goal Objective</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Scale enterprise ARR to $10M"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full text-[14px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-purple-600"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Description & Key Results</label>
                <textarea 
                  placeholder="Define measurable metrics and qualitative milestones..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-[13px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-purple-600 min-h-[70px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Timeframe</label>
                  <input 
                    type="text" 
                    value={newTimeframe}
                    onChange={(e) => setNewTimeframe(e.target.value)}
                    className="w-full text-[13px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Target Metric</label>
                  <input 
                    type="text" 
                    value={newTargetMetric}
                    onChange={(e) => setNewTargetMetric(e.target.value)}
                    className="w-full text-[13px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Link Supporting Projects</label>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1 border border-black-200 rounded-xl">
                  {projects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-black-50 rounded-lg cursor-pointer text-[12px]">
                      <input 
                        type="checkbox" 
                        checked={newLinkedProjects.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewLinkedProjects([...newLinkedProjects, p.id]);
                          } else {
                            setNewLinkedProjects(newLinkedProjects.filter(id => id !== p.id));
                          }
                        }}
                        className="rounded border-black-300 text-purple-600 focus:ring-purple-500"
                      />
                      <span className="truncate font-medium text-black">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black-100">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Goal</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
