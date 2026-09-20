import React, { useState } from 'react';
import { 
  Sparkles, X, Calendar, CheckSquare, Layers, 
  ArrowRight, Loader2, CheckCircle2, Wand2, Plus
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { useStore } from '../store';
import { generateProjectWorkflow, GeneratedWorkflow } from '../lib/aiWorkflow';
import { Project, Task, ProjectSection, Priority, Status } from '../types';
import { syncProjectToFirebase, syncTaskToFirebase, syncMemoryToFirebase } from '../lib/firebaseSync';

interface AIWorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (projectId: string) => void;
}

const PRESET_PROMPTS = [
  "Launch a new mobile app with QA testing, App Store submission, and launch campaign",
  "Website redesign with wireframes, frontend build, content migration, and SEO audit",
  "Q3 Marketing Campaign with asset creation, influencer outreach, and webinar",
  "2-week agile engineering sprint for core authentication and dashboard features",
  "Enterprise client onboarding workflow with security reviews and contract sign-off"
];

export function AIWorkflowModal({ isOpen, onClose, onProjectCreated }: AIWorkflowModalProps) {
  const { addProject, updateProject, addTask, addMemoryNote, users, currentUser } = useStore();

  const [prompt, setPrompt] = useState('');
  const [deadline, setDeadline] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedWorkflow, setGeneratedWorkflow] = useState<GeneratedWorkflow | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateProjectWorkflow(prompt, deadline, users);
      setGeneratedWorkflow(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateProjectAndWorkflow = async () => {
    if (!generatedWorkflow) return;
    setIsCreating(true);

    try {
      const projectId = `p_${Date.now()}`;

      // Build sections
      const sections: ProjectSection[] = generatedWorkflow.sections.map((sec, idx) => ({
        id: `sec_${Date.now()}_${idx}`,
        projectId,
        name: sec.name,
        order: sec.order || idx + 1
      }));

      const newProject: Project = {
        id: projectId,
        name: generatedWorkflow.projectName,
        color: generatedWorkflow.color || 'bg-mp-blue-500',
        isPublic: true,
        ownerId: currentUser.id,
        description: generatedWorkflow.description || `AI generated workflow for: ${prompt}`,
        health: 'On Track',
        sections
      };

      // 1. Add project to store & Firebase
      useStore.setState((state) => ({
        projects: [...state.projects, newProject]
      }));
      await syncProjectToFirebase(newProject);

      // 2. Create tasks
      const newTasks: Task[] = generatedWorkflow.tasks.map((t, idx) => {
        const matchingSection = sections.find(s => s.name.toLowerCase() === t.sectionName.toLowerCase()) || sections[0];
        const taskDueDate = deadline 
          ? format(addDays(new Date(), Math.min(t.dayOffset || (idx * 3 + 1), 60)), 'yyyy-MM-dd')
          : undefined;

        // Assign user round-robin or randomly
        const assignee = users[idx % users.length] || currentUser;

        const task: Task = {
          id: `t_${Date.now()}_${idx}`,
          title: t.title,
          description: t.description || '',
          status: (t.status as Status) || 'To Do',
          priority: (t.priority as Priority) || 'Medium',
          assigneeId: assignee.id,
          dueDate: taskDueDate,
          sectionId: matchingSection ? matchingSection.id : undefined,
          projectIds: [projectId],
          subtasks: (t.subtasks || []).map((stTitle, stIdx) => ({
            id: `sub_${Date.now()}_${idx}_${stIdx}`,
            title: stTitle,
            isCompleted: false
          })),
          comments: [],
          auditLogs: [{
            id: Date.now().toString(),
            text: `Generated via AI Workflow Architect`,
            createdAt: new Date().toISOString()
          }],
          customFields: {}
        };

        return task;
      });

      // Update store tasks and sync to Firebase
      useStore.setState((state) => ({
        tasks: [...state.tasks, ...newTasks]
      }));

      for (const t of newTasks) {
        await syncTaskToFirebase(t);
      }

      // 3. Save an AI Memory Note about this workflow creation
      const memoryNote = {
        id: `m_${Date.now()}`,
        title: `Workflow: ${generatedWorkflow.projectName}`,
        category: 'workflow' as const,
        content: `Created ${generatedWorkflow.projectName} with ${sections.length} phases and ${newTasks.length} tasks. Target deadline: ${deadline || 'flexible'}. Core initiative: "${prompt}".`,
        tags: ['AI-Workflow', 'Project', 'Automated'],
        createdAt: new Date().toISOString(),
        isPinned: true
      };

      useStore.setState((state) => ({
        memories: [memoryNote, ...state.memories]
      }));
      await syncMemoryToFirebase(memoryNote);

      // Navigate to project
      onProjectCreated(projectId);
      onClose();
    } catch (err) {
      console.error('Error creating project workflow:', err);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden text-black animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-black-100 flex items-center justify-between bg-gradient-to-r from-mp-blue-50/70 to-indigo-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-mp-blue-default text-white flex items-center justify-center shadow-sm">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-black flex items-center gap-2">
                AI Project & Workflow Architect
                <span className="text-[10px] font-semibold tracking-wide bg-mp-blue-100 text-mp-blue-800 px-2 py-0.5 rounded-full border border-mp-blue-200">
                  Gemini Powered
                </span>
              </h2>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-black-400 hover:text-black hover:bg-black-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {/* Prompt description */}
          <div>
            <label className="block text-xs font-bold text-black-700 uppercase tracking-wider mb-2">
              What project do you want to organize?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g. Build an enterprise client onboarding workflow with legal security reviews, staging integration, and kickoff milestones with a 4-week deadline..."
              rows={3}
              className="w-full text-sm p-3 rounded-xl border border-black-200 bg-black-50/50 focus:bg-white focus:border-mp-blue-500 focus:ring-2 focus:ring-mp-blue-100 transition-all outline-none resize-none font-medium text-black placeholder:text-black-400"
            />
          </div>

          {/* Project Deadline */}
          <div className="flex items-center gap-4 pt-1">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-bold text-black-700 uppercase tracking-wider mb-1.5">
                Target Deadline
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-full text-xs font-semibold p-2.5 pl-9 rounded-xl border border-black-200 bg-white focus:border-mp-blue-500 outline-none"
                />
                <Calendar className="w-4 h-4 text-black-400 absolute left-3 top-3 pointer-events-none" />
              </div>
            </div>

            <div className="w-full sm:w-1/2 pt-5">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={!prompt.trim() || isGenerating}
                className="w-full h-10 inline-flex items-center justify-center gap-2 bg-mp-blue-default hover:bg-mp-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Architecting Workflow...</span>
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>{generatedWorkflow ? 'Regenerate Workflow' : 'Generate Project Workflow'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Generated Workflow Preview */}
          {generatedWorkflow && (
            <div className="mt-4 border border-mp-blue-200 bg-mp-blue-50/40 rounded-xl p-4 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${generatedWorkflow.color || 'bg-mp-blue-500'}`} />
                  <h3 className="font-bold text-sm text-black">{generatedWorkflow.projectName}</h3>
                </div>
                <span className="text-[11px] bg-white border border-mp-blue-200 text-mp-blue-700 font-semibold px-2 py-0.5 rounded-full">
                  {generatedWorkflow.sections.length} Sections • {generatedWorkflow.tasks.length} Tasks
                </span>
              </div>

              <p className="text-xs text-black-600 font-medium">
                {generatedWorkflow.summary || generatedWorkflow.description}
              </p>

              {/* Sections & Tasks list */}
              <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                {generatedWorkflow.sections.map((sec, secIdx) => {
                  const secTasks = generatedWorkflow.tasks.filter(
                    t => t.sectionName.toLowerCase() === sec.name.toLowerCase()
                  );

                  return (
                    <div key={secIdx} className="bg-white rounded-lg border border-black-150 p-2.5 shadow-2xs">
                      <div className="flex items-center justify-between pb-1.5 border-b border-black-100">
                        <span className="text-xs font-bold text-black flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-mp-blue-600" />
                          {sec.name}
                        </span>
                        <span className="text-[10px] text-black-400 font-semibold">
                          {secTasks.length} {secTasks.length === 1 ? 'task' : 'tasks'}
                        </span>
                      </div>

                      <div className="mt-2 space-y-1.5">
                        {secTasks.map((task, tIdx) => (
                          <div key={tIdx} className="flex items-center justify-between text-xs py-1 px-1.5 rounded hover:bg-black-50">
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <CheckSquare className="w-3.5 h-3.5 text-black-400 shrink-0" />
                              <span className="font-medium text-black truncate">{task.title}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                                task.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-200' :
                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                'bg-black-100 text-black-600'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-[11px] text-black-500 font-medium">
                                +{task.dayOffset || tIdx * 3}d
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-black-100 bg-black-50/50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-semibold text-black-600 hover:text-black px-3 py-2 rounded-lg hover:bg-black-100 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {generatedWorkflow && (
            <button
              type="button"
              onClick={handleCreateProjectAndWorkflow}
              disabled={isCreating}
              className="inline-flex items-center gap-2 bg-mp-blue-default hover:bg-mp-blue-700 text-white font-semibold text-xs px-4 py-2 rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Creating & Syncing to Cloud...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Create Project & Workflow</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
