import React, { useState } from 'react';
import { useStore } from '../../store';
import { Task, AIMemoryNote } from '../../types';
import { 
  Sparkles, Brain, Clock, TrendingUp, AlertTriangle, Users, 
  Pin, Trash2, Plus, RefreshCw, Send, CheckCircle2, ChevronRight, 
  Lightbulb, ArrowRight, FileText, Check 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

export function MemoriesView({ onTaskClick }: { onTaskClick: (task: Task) => void }) {
  const { 
    tasks, projects, users, memories, currentUser, 
    addMemoryNote, deleteMemoryNote, togglePinMemoryNote 
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [askPrompt, setAskPrompt] = useState<string>('');
  const [isAddingCustomNote, setIsAddingCustomNote] = useState<boolean>(false);
  const [customTitle, setCustomTitle] = useState('');
  const [customContent, setCustomContent] = useState('');
  const [customCategory, setCustomCategory] = useState<AIMemoryNote['category']>('insight');
  const [copiedNoteId, setCopiedNoteId] = useState<string | null>(null);

  // Compute workspace activity metrics for memory engine
  const completedTasks = tasks.filter(t => t.status === 'Done');
  const inProgressTasks = tasks.filter(t => t.status === 'In Progress');
  const highPriorityTasks = tasks.filter(t => t.priority === 'High');
  const dependentTasksCount = tasks.filter(t => (t.dependencyIds || []).length > 0).length;

  const filteredMemories = memories.filter(m => {
    if (activeCategory === 'all') return true;
    return m.category === activeCategory;
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      // Synthesize a fresh intelligent learning note based on current live data
      const sampleInsights: Omit<AIMemoryNote, 'id' | 'createdAt'>[] = [
        {
          title: `Milestone Velocity: ${completedTasks.length} tasks closed this cycle`,
          category: 'workflow',
          content: `Your workspace velocity is trending upward. ${completedTasks.length} tasks are marked completed across ${projects.length} active initiatives. Most rapid throughput occurred on tasks assigned to ${currentUser.name}.`,
          tags: ['Velocity', 'Milestone', 'Productivity'],
          isPinned: true
        },
        {
          title: 'Dependency Risk Detected: Upstream Blockers',
          category: 'insight',
          content: `${dependentTasksCount} task(s) in the workspace have prerequisite dependencies. Tasks in "Website Redesign" and "Talent Acquisition" have tight deadlines that depend on earlier wireframes.`,
          tags: ['Risk Analysis', 'Dependencies', 'Timeline'],
          isPinned: false
        }
      ];

      sampleInsights.forEach(item => addMemoryNote(item));
      setIsGenerating(false);
    }, 900);
  };

  const handleAskMemory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!askPrompt.trim()) return;

    setIsGenerating(true);
    const userQuestion = askPrompt;
    setAskPrompt('');

    setTimeout(() => {
      addMemoryNote({
        title: `AI Answer: "${userQuestion}"`,
        category: 'decision',
        content: `Analysis of workspace activities indicates: High priority items (${highPriorityTasks.map(t => t.title).join(', ')}) require primary focus. Cross-project dependencies between Website Redesign and Marketing campaigns are proceeding steadily.`,
        tags: ['AI Query', 'Activity Synthesis'],
        isPinned: false
      });
      setIsGenerating(false);
    }, 800);
  };

  const handleCreateCustomNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim() || !customContent.trim()) return;

    addMemoryNote({
      title: customTitle.trim(),
      category: customCategory,
      content: customContent.trim(),
      tags: ['Manual Reflection', customCategory],
      isPinned: false
    });

    setCustomTitle('');
    setCustomContent('');
    setIsAddingCustomNote(false);
  };

  const handleCopyNote = (note: AIMemoryNote) => {
    navigator.clipboard.writeText(`${note.title}\n\n${note.content}`);
    setCopiedNoteId(note.id);
    setTimeout(() => setCopiedNoteId(null), 2000);
  };

  const getCategoryColor = (cat: AIMemoryNote['category']) => {
    switch (cat) {
      case 'workflow': return 'bg-mp-blue-50 text-mp-blue-700 border-mp-blue-200';
      case 'insight': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'decision': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'recommendation': return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-white text-black overflow-y-auto">
      
      {/* Header Banner */}
      <div className="px-8 py-6 border-b border-black-100 bg-gradient-to-r from-purple-50/50 via-white to-mp-blue-50/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-2xs">
                <Brain className="w-5 h-5" />
              </div>
              <h1 className="text-[24px] font-bold text-black tracking-tight">Memories</h1>
              <span className="text-[11px] font-bold uppercase tracking-wider bg-purple-600 text-white px-2 py-0.5 rounded-full shadow-2xs">
                AI Powered
              </span>
            </div>
            <p className="text-[14px] text-black-500 max-w-2xl">
              Continuously understands your work patterns, dependencies, collaboration rhythms, and generates actionable intelligence notes.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="bordered"
              onClick={() => setIsAddingCustomNote(!isAddingCustomNote)}
              className="text-[13px] h-9 gap-1.5 border-black-200"
            >
              <Plus className="w-4 h-4" /> Add Note
            </Button>
            <Button 
              onClick={handleRegenerate}
              disabled={isGenerating}
              className="text-[13px] h-9 gap-1.5 bg-purple-600 hover:bg-purple-700 text-white border-0 shadow-2xs"
            >
              <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
              {isGenerating ? 'Learning from activity...' : 'Refresh AI Insights'}
            </Button>
          </div>
        </div>

        {/* Real-time Workspace Metrics Pill Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          <div className="p-3 bg-white rounded-xl border border-black-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-black-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-border" /> Completion Rate
            </div>
            <div className="text-[18px] font-bold text-black">
              {tasks.length > 0 ? Math.round((completedTasks.length / tasks.length) * 100) : 0}%
              <span className="text-[12px] font-normal text-black-400 ml-1.5">({completedTasks.length}/{tasks.length})</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-black-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-black-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-alert-text" /> Dependent Tasks
            </div>
            <div className="text-[18px] font-bold text-black">
              {dependentTasksCount}
              <span className="text-[12px] font-normal text-black-400 ml-1.5">linked blockers</span>
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-black-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-black-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-mp-blue-500" /> Peak Hours
            </div>
            <div className="text-[18px] font-bold text-black">
              9:30 AM - 1 PM
            </div>
          </div>

          <div className="p-3 bg-white rounded-xl border border-black-200/80 shadow-2xs">
            <div className="text-[11px] font-semibold text-black-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-purple-600" /> Active Team
            </div>
            <div className="text-[18px] font-bold text-black">
              {users.length} members
            </div>
          </div>
        </div>
      </div>

      {/* Query Bar */}
      <div className="px-8 py-4 border-b border-black-100 bg-white">
        <form onSubmit={handleAskMemory} className="flex gap-2">
          <div className="relative flex-1">
            <Sparkles className="w-4 h-4 text-purple-600 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input 
              type="text"
              value={askPrompt}
              onChange={(e) => setAskPrompt(e.target.value)}
              placeholder="Ask AI Memory anything: 'What dependencies are pending?', 'Summarize team activity'..."
              className="w-full pl-10 pr-4 py-2 bg-black-50 border border-black-200 rounded-xl text-[13px] text-black focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
            />
          </div>
          <Button 
            type="submit" 
            disabled={!askPrompt.trim() || isGenerating}
            className="h-10 text-[13px] px-4 gap-1.5 bg-black text-white hover:bg-black-800"
          >
            <Send className="w-3.5 h-3.5" /> Ask AI
          </Button>
        </form>
      </div>

      {/* New Note Form */}
      {isAddingCustomNote && (
        <div className="px-8 py-4 bg-purple-50/40 border-b border-purple-200">
          <form onSubmit={handleCreateCustomNote} className="max-w-2xl space-y-3 bg-white p-4 rounded-xl border border-purple-200 shadow-sm">
            <div className="flex items-center justify-between">
              <h3 className="text-[14px] font-bold text-black flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-600" /> Log Memory / Observation
              </h3>
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value as AIMemoryNote['category'])}
                className="text-[12px] bg-black-50 border border-black-200 rounded-md px-2 py-1 outline-none"
              >
                <option value="insight">Insight</option>
                <option value="workflow">Workflow</option>
                <option value="decision">Decision</option>
                <option value="recommendation">Recommendation</option>
              </select>
            </div>

            <input 
              type="text"
              required
              placeholder="Title (e.g. Talent Acquisition sync takeaways)..."
              value={customTitle}
              onChange={(e) => setCustomTitle(e.target.value)}
              className="w-full text-[13px] px-3 py-1.5 border border-black-200 rounded-lg outline-none focus:border-purple-500"
            />

            <textarea 
              required
              rows={3}
              placeholder="Observation, context, or takeaways for the AI to retain..."
              value={customContent}
              onChange={(e) => setCustomContent(e.target.value)}
              className="w-full text-[13px] p-3 border border-black-200 rounded-lg outline-none focus:border-purple-500 resize-none"
            />

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setIsAddingCustomNote(false)}>Cancel</Button>
              <Button type="submit" size="sm" className="bg-purple-600 text-white hover:bg-purple-700">Save to Memory</Button>
            </div>
          </form>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="px-8 py-3 flex items-center justify-between border-b border-black-100 bg-black-50/30">
        <div className="flex items-center gap-2">
          {[
            { id: 'all', label: 'All Learnings' },
            { id: 'workflow', label: 'Workflows' },
            { id: 'insight', label: 'Insights' },
            { id: 'decision', label: 'Decisions' },
            { id: 'recommendation', label: 'Recommendations' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "text-[12px] font-semibold px-3 py-1 rounded-full transition-all border",
                activeCategory === cat.id 
                  ? "bg-black text-white border-black shadow-2xs" 
                  : "bg-white text-black-600 border-black-200 hover:border-black-300"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-black-400 font-medium">{filteredMemories.length} notes</span>
      </div>

      {/* Memories Notes Feed */}
      <div className="flex-1 p-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {filteredMemories.map(note => (
            <div 
              key={note.id}
              className={cn(
                "p-5 rounded-2xl border transition-all hover:shadow-md bg-white relative group",
                note.isPinned ? "border-purple-300 shadow-xs" : "border-black-200"
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className={cn("text-[11px] font-bold px-2.5 py-0.5 rounded-full border capitalize", getCategoryColor(note.category))}>
                    {note.category}
                  </span>
                  <h3 className="text-[16px] font-bold text-black tracking-tight">{note.title}</h3>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button 
                    onClick={() => togglePinMemoryNote(note.id)}
                    className={cn(
                      "p-1.5 rounded-md hover:bg-black-50 transition-colors",
                      note.isPinned ? "text-purple-600" : "text-black-300 hover:text-black"
                    )}
                    title={note.isPinned ? "Unpin note" : "Pin note"}
                  >
                    <Pin className={cn("w-4 h-4", note.isPinned && "fill-current")} />
                  </button>

                  <button 
                    onClick={() => handleCopyNote(note)}
                    className="p-1.5 text-black-400 hover:text-black hover:bg-black-50 rounded-md transition-colors"
                    title="Copy note"
                  >
                    {copiedNoteId === note.id ? <Check className="w-4 h-4 text-success-text" /> : <FileText className="w-4 h-4" />}
                  </button>

                  <button 
                    onClick={() => deleteMemoryNote(note.id)}
                    className="p-1.5 text-black-400 hover:text-error-text hover:bg-error-bg/50 rounded-md transition-colors"
                    title="Delete note"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <p className="text-[14px] text-black-600 leading-relaxed mb-3">
                {note.content}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-black-100 text-[12px] text-black-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {note.tags.map(tag => (
                    <span key={tag} className="bg-black-50 text-black-500 px-2 py-0.5 rounded text-[11px] font-medium">
                      #{tag}
                    </span>
                  ))}
                </div>
                <span>{format(new Date(note.createdAt), 'MMM d, h:mm a')}</span>
              </div>
            </div>
          ))}

          {filteredMemories.length === 0 && (
            <div className="text-center py-16 text-black-400">
              <Brain className="w-12 h-12 mx-auto mb-3 opacity-30 text-purple-600" />
              <p className="text-[15px] font-medium text-black">No memories in this category</p>
              <p className="text-[13px] text-black-400 mt-1">Click 'Refresh AI Insights' to synthesize new learnings from your tasks.</p>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
