import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Task, Project, User, Status, Priority, TemplateTask, Attachment, AIMemoryNote, Portfolio, Goal, Team, ProjectTemplate, ConnectedSheetConfig } from './types';
import { initialTasks, projects, users, initialMemories, initialPortfolios, initialGoals, initialTeams, initialTemplates } from './data';
import { 
  syncProjectToFirebase, 
  deleteProjectFromFirebase, 
  syncTaskToFirebase, 
  syncTasksBatchToFirebase,
  deleteTaskFromFirebase, 
  syncMemoryToFirebase, 
  deleteMemoryFromFirebase 
} from './lib/firebaseSync';

interface AppState {
  tasks: Task[];
  projects: Project[];
  users: User[];
  currentUser: User;
  searchQuery: string;
  archivedNotificationIds: string[];
  readNotificationIds: string[];
  memories: AIMemoryNote[];
  portfolios: Portfolio[];
  goals: Goal[];
  teams: Team[];
  templates: ProjectTemplate[];
  
  setSearchQuery: (query: string) => void;
  setCurrentUser: (userId: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  addTask: (task: Omit<Task, 'id' | 'comments' | 'auditLogs' | 'subtasks' | 'customFields'> & { subtasks?: Task['subtasks']; attachments?: Attachment[] }) => void;
  moveTask: (taskId: string, newStatus: Status) => void;
  addComment: (taskId: string, text: string) => void;
  toggleSubtask: (taskId: string, subtaskId: string) => void;
  addSubtask: (taskId: string, title: string) => void;
  deleteTask: (taskId: string) => void;
  addProject: (name: string, description?: string) => string;
  updateProject: (id: string, updates: Partial<Project>) => void;
  archiveNotification: (notifId: string) => void;
  markNotificationAsRead: (notifId: string) => void;
  markNotificationAsUnread: (notifId: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // New features
  toggleBookmark: (taskId: string) => void;
  addAttachment: (taskId: string, attachment: Attachment) => void;
  removeAttachment: (taskId: string, attachmentId: string) => void;
  addDependency: (taskId: string, dependencyTaskId: string) => void;
  removeDependency: (taskId: string, dependencyTaskId: string) => void;
  addCollaborator: (taskId: string, userId: string) => void;
  removeCollaborator: (taskId: string, userId: string) => void;
  
  // AI Memories
  addMemoryNote: (note: Omit<AIMemoryNote, 'id' | 'createdAt'>) => void;
  deleteMemoryNote: (id: string) => void;
  togglePinMemoryNote: (id: string) => void;

  // Goals & Portfolios & Teams
  updateGoalProgress: (goalId: string, progress: number, currentMetric?: string) => void;
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  addPortfolio: (portfolio: Omit<Portfolio, 'id'>) => void;
  addTeamMember: (teamId: string, userId: string) => void;

  // Sections
  addSection: (projectId: string, name: string) => void;
  addSectionAbove: (targetSectionId: string, name: string) => void;
  addSectionBelow: (targetSectionId: string, name: string) => void;
  duplicateSection: (sectionId: string) => string;
  renameSection: (sectionId: string, name: string) => void;
  deleteSection: (sectionId: string) => void;
  moveTaskToSection: (taskId: string, sectionId?: string) => void;

  toggleProjectStar: (projectId: string) => void;
  projectPendingDelete: Project | null;
  setProjectPendingDelete: (project: Project | null) => void;
  deleteProject: (projectId: string) => void;
  reorderProjects: (startIndex: number, endIndex: number) => void;
  duplicateProject: (projectId: string) => string;
  saveProjectAsTemplate: (projectId: string, templateName?: string, description?: string) => string;
  addProjectToPortfolio: (projectId: string, portfolioId: string) => void;
  removeProjectFromPortfolio: (projectId: string, portfolioId: string) => void;
  importTasksToProject: (projectId: string, tasksToImport: Array<{
    title: string;
    description?: string;
    status?: Status;
    priority?: Priority;
    assigneeNameOrId?: string;
    dueDate?: string;
    sectionName?: string;
  }>) => number;
  toggleArchiveProject: (projectId: string) => void;
  
  // Google Sheets 2-Way Sync
  connectSheetToProject: (projectId: string, config: ConnectedSheetConfig) => void;
  disconnectSheetFromProject: (projectId: string) => void;
  createTasksFromGoogleSheetRows: (
    projectId: string,
    rows: Array<{
      title: string;
      sectionName?: string;
      status?: Status;
      priority?: Priority;
      dueDate?: string;
      assignee?: string;
      taskId?: string;
      rowIndex: number;
    }>
  ) => Task[];

  // Templates
  createProjectFromTemplate: (templateId: string, projectName: string, referenceDate?: string) => string;
  addTemplate: (template: Omit<ProjectTemplate, 'id'>) => string;
  updateTemplate: (id: string, updates: Partial<ProjectTemplate>) => void;
  deleteTemplate: (id: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      tasks: initialTasks,
      projects: projects,
      users: users,
      currentUser: users[0],
      searchQuery: '',
      archivedNotificationIds: [],
      readNotificationIds: initialTasks.slice(3).map(t => t.id),
      memories: initialMemories,
      portfolios: initialPortfolios,
      goals: initialGoals,
      teams: initialTeams,
      templates: initialTemplates,

      setSearchQuery: (query) => set({ searchQuery: query }),
      setCurrentUser: (userId) => set((state) => {
        const u = state.users.find(user => user.id === userId);
        return u ? { currentUser: u } : state;
      }),
      
      updateTask: (id, updates) => set((state) => {
        const task = state.tasks.find(t => t.id === id);
        if (!task) return state;
        const newAudit = { id: Date.now().toString(), text: `Task details updated`, createdAt: new Date().toISOString() };
        const updatedTask = { ...task, ...updates, auditLogs: [newAudit, ...task.auditLogs] };
        syncTaskToFirebase(updatedTask);
        return {
          tasks: state.tasks.map(t => t.id === id ? updatedTask : t)
        };
      }),
      
      addTask: (task) => {
        let createdTask: Task | null = null;
        set((state) => {
          const newTask: Task = {
            ...task,
            id: `t${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            comments: [],
            auditLogs: [{ id: Date.now().toString(), text: 'Task created', createdAt: new Date().toISOString() }],
            subtasks: task.subtasks || [],
            attachments: task.attachments || [],
            dependencyIds: task.dependencyIds || [],
            collaboratorIds: task.collaboratorIds || [state.currentUser.id],
            customFields: {}
          };
          createdTask = newTask;
          syncTaskToFirebase(newTask);
          return {
            tasks: [...state.tasks, newTask]
          };
        });

        // 2-Way Sync: If parent project is connected to a Google Sheet, append row to the sheet
        if (createdTask) {
          const t = createdTask as Task;
          const currentState = get();
          const connectedProj = currentState.projects.find(
            p => t.projectIds.includes(p.id) && p.connectedSheet?.spreadsheetId
          );
          if (connectedProj?.connectedSheet) {
            import('./lib/googleAuth').then(({ getAccessToken }) => {
              getAccessToken().then(token => {
                if (token && connectedProj.connectedSheet) {
                  import('./lib/googleSheetsService').then(({ appendTaskRowToSheet }) => {
                    const sec = connectedProj.sections?.find(s => s.id === t.sectionId)?.name;
                    const assignee = currentState.users.find(u => u.id === t.assigneeId)?.name;
                    appendTaskRowToSheet(
                      connectedProj.connectedSheet!.spreadsheetId,
                      connectedProj.connectedSheet!.sheetTitle || 'Sheet1',
                      t,
                      sec,
                      assignee,
                      token
                    ).catch(err => {
                      console.warn('Background sync to Google Sheet error:', err);
                    });
                  });
                }
              });
            });
          }
        }
      },
      
      moveTask: (taskId, newStatus) => set((state) => {
        const task = state.tasks.find(t => t.id === taskId);
        if (!task || task.status === newStatus) return state;
        const newAudit = { id: Date.now().toString(), text: `Moved to ${newStatus}`, createdAt: new Date().toISOString() };
        const updatedTask = { ...task, status: newStatus, auditLogs: [newAudit, ...task.auditLogs] };
        syncTaskToFirebase(updatedTask);
        return {
          tasks: state.tasks.map(t => t.id === taskId ? updatedTask : t)
        };
      }),
      
      addComment: (taskId, text) => set((state) => {
        const newComment = { id: Date.now().toString(), userId: state.currentUser.id, text, createdAt: new Date().toISOString() };
        const newAudit = { id: (Date.now() + 1).toString(), text: `Added a comment`, createdAt: new Date().toISOString() };
        return {
          tasks: state.tasks.map(t => t.id === taskId ? { ...t, comments: [...t.comments, newComment], auditLogs: [newAudit, ...t.auditLogs] } : t)
        };
      }),
      
      toggleSubtask: (taskId, subtaskId) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            subtasks: t.subtasks.map(s => s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s)
          };
        })
      })),

      addSubtask: (taskId, title) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const newSub = { id: `s${Date.now()}`, title, isCompleted: false };
          return { ...t, subtasks: [...t.subtasks, newSub] };
        })
      })),
      
      deleteTask: (taskId) => {
        deleteTaskFromFirebase(taskId);
        set((state) => ({
          tasks: state.tasks.filter(t => t.id !== taskId)
        }));
      },

      addProject: (name, description) => {
        const id = `p${Date.now()}`;
        const newProj: Project = { 
          id, 
          name, 
          color: 'bg-mp-blue-500', 
          isPublic: true,
          ownerId: get().currentUser.id,
          description: description || 'New enterprise workspace initiative.',
          health: 'On Track'
        };
        set((state) => ({
          projects: [...state.projects, newProj]
        }));
        syncProjectToFirebase(newProj);
        return id;
      },

      updateProject: (id, updates) => {
        set((state) => {
          const updatedProjects = state.projects.map(p => p.id === id ? { ...p, ...updates } : p);
          const updated = updatedProjects.find(p => p.id === id);
          if (updated) syncProjectToFirebase(updated);
          return { projects: updatedProjects };
        });
      },

      toggleProjectStar: (projectId) => {
        set((state) => {
          const updatedProjects = state.projects.map(p => 
            p.id === projectId ? { ...p, isStarred: !p.isStarred } : p
          );
          const updated = updatedProjects.find(p => p.id === projectId);
          if (updated) syncProjectToFirebase(updated);
          return { projects: updatedProjects };
        });
      },

      projectPendingDelete: null,
      setProjectPendingDelete: (project) => set({ projectPendingDelete: project }),

      deleteProject: (projectId) => {
        deleteProjectFromFirebase(projectId);
        set((state) => ({
          projectPendingDelete: state.projectPendingDelete?.id === projectId ? null : state.projectPendingDelete,
          projects: state.projects.filter(p => p.id !== projectId),
          portfolios: state.portfolios.map(port => ({
            ...port,
            projectIds: port.projectIds.filter(id => id !== projectId)
          })),
          tasks: state.tasks
            .map(t => ({
              ...t,
              projectIds: t.projectIds.filter(id => id !== projectId)
            }))
            .filter(t => t.projectIds.length > 0)
        }));
      },

      duplicateProject: (projectId) => {
        const state = get();
        const originalProject = state.projects.find(p => p.id === projectId);
        if (!originalProject) return projectId;
        
        const newProjectId = `p_${Date.now()}`;
        const sectionIdMap: Record<string, string> = {};
        
        const newSections = (originalProject.sections || []).map(sec => {
          const newSecId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
          sectionIdMap[sec.id] = newSecId;
          return {
            ...sec,
            id: newSecId,
            projectId: newProjectId
          };
        });

        const newProject: Project = {
          ...originalProject,
          id: newProjectId,
          name: `${originalProject.name} (Copy)`,
          sections: newSections,
          isStarred: false
        };

        const originalTasks = state.tasks.filter(t => t.projectIds.includes(projectId));
        const newTasks: Task[] = originalTasks.map((t, idx) => {
          const newTaskId = `t_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`;
          return {
            ...t,
            id: newTaskId,
            projectIds: [newProjectId],
            sectionId: t.sectionId ? sectionIdMap[t.sectionId] || undefined : undefined,
            subtasks: t.subtasks.map(s => ({ ...s, id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })),
            auditLogs: [{ id: Date.now().toString(), text: `Duplicated from ${originalProject.name}`, createdAt: new Date().toISOString() }]
          };
        });

        set({
          projects: [...state.projects, newProject],
          tasks: [...state.tasks, ...newTasks]
        });

        return newProjectId;
      },

      saveProjectAsTemplate: (projectId, templateName, description) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project) return '';

        const projectTasks = state.tasks.filter(t => t.projectIds.includes(projectId));
        const templateTasks: TemplateTask[] = projectTasks.map(t => {
          const sec = (project.sections || []).find(s => s.id === t.sectionId);
          return {
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            sectionName: sec?.name,
            assigneeId: t.assigneeId
          };
        });

        const newTpl: ProjectTemplate = {
          id: `tpl_${Date.now()}`,
          name: templateName || `${project.name} Template`,
          description: description || project.description || `Template created from ${project.name}`,
          icon: project.icon || 'rocket',
          color: project.color,
          tasks: templateTasks
        };

        set({
          templates: [...state.templates, newTpl]
        });

        return newTpl.id;
      },

      addProjectToPortfolio: (projectId, portfolioId) => set((state) => ({
        portfolios: state.portfolios.map(port => {
          if (port.id !== portfolioId) return port;
          if (port.projectIds.includes(projectId)) return port;
          return { ...port, projectIds: [...port.projectIds, projectId] };
        })
      })),

      removeProjectFromPortfolio: (projectId, portfolioId) => set((state) => ({
        portfolios: state.portfolios.map(port => {
          if (port.id !== portfolioId) return port;
          return { ...port, projectIds: port.projectIds.filter(id => id !== projectId) };
        })
      })),

      importTasksToProject: (projectId, tasksToImport) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project || tasksToImport.length === 0) return 0;
        
        let updatedSections = [...(project.sections || [])];
        const getOrCreateSectionId = (secName?: string) => {
          if (!secName || !secName.trim()) {
            // If project already has sections, assign to the first section so tasks appear grouped
            return updatedSections.length > 0 ? updatedSections[0].id : undefined;
          }
          const cleanName = secName.trim();
          const existing = updatedSections.find(s => s.name.toLowerCase() === cleanName.toLowerCase());
          if (existing) return existing.id;
          const newSec = {
            id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId,
            name: cleanName,
            order: updatedSections.length + 1
          };
          updatedSections.push(newSec);
          return newSec.id;
        };

        const newTasks: Task[] = tasksToImport.map((t, idx) => {
          const sectionId = getOrCreateSectionId(t.sectionName);
          
          let assigneeId: string | undefined = undefined;
          if (t.assigneeNameOrId) {
            const trimmed = t.assigneeNameOrId.trim().toLowerCase();
            const user = state.users.find(u => 
              u.id.toLowerCase() === trimmed || 
              u.name.toLowerCase().includes(trimmed) ||
              u.initials.toLowerCase() === trimmed
            );
            if (user) assigneeId = user.id;
          }

          return {
            id: `t_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
            title: t.title?.trim() || 'Imported Task',
            description: t.description || '',
            status: (['To Do', 'In Progress', 'Review', 'Done'].includes(t.status || '') ? t.status : 'To Do') as Status,
            priority: (['Low', 'Medium', 'High'].includes(t.priority || '') ? t.priority : 'Medium') as Priority,
            assigneeId: assigneeId || state.currentUser.id,
            dueDate: t.dueDate || undefined,
            sectionId,
            projectIds: [projectId],
            subtasks: [],
            comments: [],
            auditLogs: [{ id: Date.now().toString(), text: 'Imported from file', createdAt: new Date().toISOString() }],
            attachments: [],
            collaboratorIds: [state.currentUser.id],
            customFields: {}
          };
        });

        const updatedProject: Project = {
          ...project,
          sections: updatedSections
        };

        set((currentState) => ({
          projects: currentState.projects.map(p => p.id === projectId ? updatedProject : p),
          tasks: [...currentState.tasks, ...newTasks]
        }));

        // Persist to Firebase Firestore
        syncProjectToFirebase(updatedProject);
        syncTasksBatchToFirebase(newTasks);

        return newTasks.length;
      },

      toggleArchiveProject: (projectId) => set((state) => ({
        projects: state.projects.map(p => p.id === projectId ? { ...p, isArchived: !p.isArchived } : p)
      })),

      connectSheetToProject: (projectId, config) => set((state) => {
        const updatedProjects = state.projects.map(p => {
          if (p.id !== projectId) return p;
          const updated = { ...p, connectedSheet: config };
          syncProjectToFirebase(updated);
          return updated;
        });
        return { projects: updatedProjects };
      }),

      disconnectSheetFromProject: (projectId) => set((state) => {
        const updatedProjects = state.projects.map(p => {
          if (p.id !== projectId) return p;
          const { connectedSheet, ...rest } = p;
          syncProjectToFirebase(rest as Project);
          return rest as Project;
        });
        return { projects: updatedProjects };
      }),

      createTasksFromGoogleSheetRows: (projectId, rows) => {
        const state = get();
        const project = state.projects.find(p => p.id === projectId);
        if (!project || !rows || rows.length === 0) return [];

        let updatedSections = [...(project.sections || [])];
        const getOrCreateSectionId = (secName?: string) => {
          if (!secName || !secName.trim()) {
            return updatedSections.length > 0 ? updatedSections[0].id : undefined;
          }
          const cleanName = secName.trim();
          const existing = updatedSections.find(s => s.name.toLowerCase() === cleanName.toLowerCase());
          if (existing) return existing.id;

          const newSec = {
            id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId: project.id,
            name: cleanName,
            order: updatedSections.length + 1
          };
          updatedSections.push(newSec);
          return newSec.id;
        };

        const existingTasks = state.tasks;
        const processedTasks: Task[] = [];
        const newTasksToAppend: Task[] = [];
        let updatedExistingTasks = [...existingTasks];

        rows.forEach((row, idx) => {
          const cleanTitle = (row.title || '').trim();
          if (!cleanTitle) return;

          const existingTaskIndex = row.taskId ? updatedExistingTasks.findIndex(t => t.id === row.taskId) : -1;
          const sectionId = getOrCreateSectionId(row.sectionName);

          let assigneeId: string | undefined = undefined;
          if (row.assignee) {
            const trimmedAssignee = row.assignee.toLowerCase();
            const matchedUser = state.users.find(u => 
              u.id.toLowerCase() === trimmedAssignee || 
              u.name.toLowerCase() === trimmedAssignee ||
              u.name.toLowerCase().includes(trimmedAssignee)
            );
            if (matchedUser) assigneeId = matchedUser.id;
          }

          if (existingTaskIndex !== -1) {
            const existing = updatedExistingTasks[existingTaskIndex];
            const updated = {
              ...existing,
              title: cleanTitle,
              sectionId: sectionId !== undefined ? sectionId : existing.sectionId,
              status: row.status || existing.status,
              priority: row.priority || existing.priority,
              dueDate: row.dueDate || existing.dueDate,
              assigneeId: assigneeId || existing.assigneeId,
              auditLogs: [{ id: Date.now().toString(), text: `Updated via Google Sheet sync`, createdAt: new Date().toISOString() }, ...existing.auditLogs]
            };
            updatedExistingTasks[existingTaskIndex] = updated;
            processedTasks.push(updated);
            syncTaskToFirebase(updated);
          } else {
            const newTask: Task = {
              id: row.taskId && row.taskId.startsWith('t') ? row.taskId : `t${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
              title: cleanTitle,
              status: row.status || 'To Do',
              priority: row.priority || 'Medium',
              assigneeId: assigneeId || state.currentUser.id,
              dueDate: row.dueDate,
              sectionId,
              projectIds: [projectId],
              subtasks: [],
              comments: [],
              auditLogs: [{ id: Date.now().toString(), text: `Created from Google Spreadsheet row #${row.rowIndex}`, createdAt: new Date().toISOString() }],
              customFields: {}
            };
            newTasksToAppend.push(newTask);
            processedTasks.push(newTask);
          }
        });

        const updatedProject: Project = {
          ...project,
          sections: updatedSections,
          connectedSheet: project.connectedSheet ? {
            ...project.connectedSheet,
            lastSyncedAt: new Date().toISOString()
          } : undefined
        };

        set((currentState) => ({
          projects: currentState.projects.map(p => p.id === projectId ? updatedProject : p),
          tasks: [...updatedExistingTasks, ...newTasksToAppend]
        }));

        syncProjectToFirebase(updatedProject);
        if (newTasksToAppend.length > 0) {
          syncTasksBatchToFirebase(newTasksToAppend);
        }

        return processedTasks;
      },

      reorderProjects: (startIndex, endIndex) => set((state) => {
        const result = Array.from(state.projects);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);
        return { projects: result };
      }),

      archiveNotification: (notifId) => set((state) => {
        const currentArchived = state.archivedNotificationIds || [];
        const currentRead = state.readNotificationIds || [];
        const isArchived = currentArchived.includes(notifId);
        return {
          archivedNotificationIds: isArchived
            ? currentArchived.filter(id => id !== notifId)
            : [...currentArchived, notifId],
          readNotificationIds: isArchived
            ? currentRead
            : (currentRead.includes(notifId) ? currentRead : [...currentRead, notifId])
        };
      }),

      markNotificationAsRead: (notifId) => set((state) => {
        const currentRead = state.readNotificationIds || [];
        if (currentRead.includes(notifId)) return state;
        return { readNotificationIds: [...currentRead, notifId] };
      }),

      markNotificationAsUnread: (notifId) => set((state) => {
        const currentRead = state.readNotificationIds || [];
        return { readNotificationIds: currentRead.filter(id => id !== notifId) };
      }),

      markAllNotificationsAsRead: () => set((state) => ({
        readNotificationIds: state.tasks.map(t => t.id)
      })),

      createProjectFromTemplate: (templateId, projectName, referenceDate) => {
        const state = get();
        const template = state.templates.find(t => t.id === templateId);
        if (!template) return '';

        const projectId = `p${Date.now()}`;
        
        // Map unique sections
        const sectionNames = Array.from(new Set(template.tasks.map(t => t.sectionName).filter(Boolean))) as string[];
        const sections = sectionNames.map((name, idx) => ({
          id: `sec_${Date.now()}_${idx}`,
          projectId,
          name,
          order: idx + 1
        }));

        const newProject: Project = {
          id: projectId,
          name: projectName,
          color: template.color,
          isPublic: true,
          ownerId: state.currentUser.id,
          description: `Created from ${template.name} template.`,
          health: 'On Track',
          sections
        };

        const newTasks: Task[] = template.tasks.map((t, idx) => {
          let dueDate;
          if (t.dayOffset !== undefined) {
            const date = referenceDate ? new Date(referenceDate) : new Date();
            date.setDate(date.getDate() + t.dayOffset);
            dueDate = date.toISOString().split('T')[0];
          }

          let sectionId;
          if (t.sectionName) {
            sectionId = sections.find(s => s.name === t.sectionName)?.id;
          }

          return {
            id: `t${Date.now()}_${idx}`,
            title: t.title,
            description: t.description,
            status: t.status,
            priority: t.priority,
            dueDate,
            sectionId,
            projectIds: [projectId],
            assigneeId: t.assigneeId || state.currentUser.id, // Assign to creator by default if none specified
            subtasks: [],
            comments: [],
            auditLogs: [{ id: Date.now().toString(), text: 'Created from template', createdAt: new Date().toISOString() }],
            attachments: [],
            customFields: {},
            collaboratorIds: [state.currentUser.id]
          };
        });

        set((state) => ({
          projects: [...state.projects, newProject],
          tasks: [...state.tasks, ...newTasks]
        }));

        return projectId;
      },

      addTemplate: (template) => {
        const id = `tpl_${Date.now()}`;
        set((state) => ({ templates: [...state.templates, { ...template, id }] }));
        return id;
      },

      updateTemplate: (id, updates) => set((state) => ({
        templates: state.templates.map(t => t.id === id ? { ...t, ...updates } : t)
      })),

      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter(t => t.id !== id)
      })),

      toggleBookmark: (taskId) => set((state) => ({
        tasks: state.tasks.map(t => t.id === taskId ? { ...t, bookmarked: !t.bookmarked } : t)
      })),

      addAttachment: (taskId, attachment) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const current = t.attachments || [];
          return { ...t, attachments: [...current, attachment] };
        })
      })),

      removeAttachment: (taskId, attachmentId) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, attachments: (t.attachments || []).filter(a => a.id !== attachmentId) };
        })
      })),

      addDependency: (taskId, dependencyTaskId) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const current = t.dependencyIds || [];
          if (current.includes(dependencyTaskId)) return t;
          return { ...t, dependencyIds: [...current, dependencyTaskId] };
        })
      })),

      removeDependency: (taskId, dependencyTaskId) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, dependencyIds: (t.dependencyIds || []).filter(id => id !== dependencyTaskId) };
        })
      })),

      addCollaborator: (taskId, userId) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          const current = t.collaboratorIds || [];
          if (current.includes(userId)) return t;
          return { ...t, collaboratorIds: [...current, userId] };
        })
      })),

      removeCollaborator: (taskId, userId) => set((state) => ({
        tasks: state.tasks.map(t => {
          if (t.id !== taskId) return t;
          return { ...t, collaboratorIds: (t.collaboratorIds || []).filter(id => id !== userId) };
        })
      })),

      addMemoryNote: (note) => {
        const newMem: AIMemoryNote = {
          ...note,
          id: `m${Date.now()}`,
          createdAt: new Date().toISOString()
        };
        syncMemoryToFirebase(newMem);
        set((state) => ({
          memories: [newMem, ...state.memories]
        }));
      },

      deleteMemoryNote: (id) => {
        deleteMemoryFromFirebase(id);
        set((state) => ({
          memories: state.memories.filter(m => m.id !== id)
        }));
      },

      togglePinMemoryNote: (id) => {
        set((state) => {
          const updatedMemories = state.memories.map(m => m.id === id ? { ...m, isPinned: !m.isPinned } : m);
          const target = updatedMemories.find(m => m.id === id);
          if (target) syncMemoryToFirebase(target);
          return { memories: updatedMemories };
        });
      },

      updateGoalProgress: (goalId, progress, currentMetric) => set((state) => ({
        goals: state.goals.map(g => g.id === goalId ? { 
          ...g, 
          progress, 
          ...(currentMetric ? { currentMetric } : {}),
          health: progress >= 60 ? 'On Track' : progress >= 30 ? 'At Risk' : 'Off Track'
        } : g)
      })),

      addGoal: (goal) => set((state) => ({
        goals: [...state.goals, { ...goal, id: `g${Date.now()}` }]
      })),

      addPortfolio: (portfolio) => set((state) => ({
        portfolios: [...state.portfolios, { ...portfolio, id: `port${Date.now()}` }]
      })),

      addTeamMember: (teamId, userId) => set((state) => ({
        teams: state.teams.map(t => {
          if (t.id !== teamId) return t;
          if (t.memberIds.includes(userId)) return t;
          return { ...t, memberIds: [...t.memberIds, userId] };
        })
      })),

      addSection: (projectId, name) => set((state) => {
        const updatedProjects = state.projects.map(p => {
          if (p.id !== projectId) return p;
          const currentSections = p.sections || [];
          const newSection = {
            id: `sec_${Date.now()}`,
            projectId,
            name: name.trim(),
            order: currentSections.length + 1
          };
          return { ...p, sections: [...currentSections, newSection] };
        });
        const target = updatedProjects.find(p => p.id === projectId);
        if (target) syncProjectToFirebase(target);
        return { projects: updatedProjects };
      }),

      addSectionAbove: (targetSectionId, name) => set((state) => {
        let modifiedProj: Project | undefined;
        const updatedProjects = state.projects.map(p => {
          const sections = p.sections || [];
          const targetIndex = sections.findIndex(s => s.id === targetSectionId);
          if (targetIndex === -1) return p;

          const newSection = {
            id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId: p.id,
            name: name.trim() || 'New Section',
            order: targetIndex + 1
          };

          const updatedSections = [...sections];
          updatedSections.splice(targetIndex, 0, newSection);
          const reordered = updatedSections.map((s, idx) => ({ ...s, order: idx + 1 }));
          const updated = { ...p, sections: reordered };
          modifiedProj = updated;
          return updated;
        });
        if (modifiedProj) syncProjectToFirebase(modifiedProj);
        return { projects: updatedProjects };
      }),

      addSectionBelow: (targetSectionId, name) => set((state) => {
        let modifiedProj: Project | undefined;
        const updatedProjects = state.projects.map(p => {
          const sections = p.sections || [];
          const targetIndex = sections.findIndex(s => s.id === targetSectionId);
          if (targetIndex === -1) return p;

          const newSection = {
            id: `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            projectId: p.id,
            name: name.trim() || 'New Section',
            order: targetIndex + 2
          };

          const updatedSections = [...sections];
          updatedSections.splice(targetIndex + 1, 0, newSection);
          const reordered = updatedSections.map((s, idx) => ({ ...s, order: idx + 1 }));
          const updated = { ...p, sections: reordered };
          modifiedProj = updated;
          return updated;
        });
        if (modifiedProj) syncProjectToFirebase(modifiedProj);
        return { projects: updatedProjects };
      }),

      duplicateSection: (sectionId) => {
        const state = get();
        let newSecId = '';
        let targetProject: Project | undefined;
        let originalSecName = '';

        for (const p of state.projects) {
          const found = (p.sections || []).find(s => s.id === sectionId);
          if (found) {
            targetProject = p;
            originalSecName = found.name;
            break;
          }
        }

        if (!targetProject) return '';

        newSecId = `sec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const sections = targetProject.sections || [];
        const targetIndex = sections.findIndex(s => s.id === sectionId);

        const duplicatedSec = {
          id: newSecId,
          projectId: targetProject.id,
          name: `${originalSecName} (Copy)`,
          order: targetIndex + 2
        };

        const updatedSections = [...sections];
        updatedSections.splice(targetIndex + 1, 0, duplicatedSec);
        const reordered = updatedSections.map((s, idx) => ({ ...s, order: idx + 1 }));

        // Clone all tasks from original section
        const tasksToClone = state.tasks.filter(t => t.sectionId === sectionId);
        const clonedTasks: Task[] = tasksToClone.map((t, idx) => ({
          ...t,
          id: `t_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          title: `${t.title} (Copy)`,
          sectionId: newSecId,
          subtasks: t.subtasks.map(s => ({ ...s, id: `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}` })),
          auditLogs: [{ id: Date.now().toString(), text: `Cloned from ${originalSecName}`, createdAt: new Date().toISOString() }]
        }));

        const updatedProj = { ...targetProject, sections: reordered };
        set({
          projects: state.projects.map(p => p.id === targetProject!.id ? updatedProj : p),
          tasks: [...state.tasks, ...clonedTasks]
        });

        syncProjectToFirebase(updatedProj);
        syncTasksBatchToFirebase(clonedTasks);

        return newSecId;
      },

      renameSection: (sectionId, name) => set((state) => {
        let modifiedProj: Project | undefined;
        const updatedProjects = state.projects.map(p => {
          if (!p.sections) return p;
          if (!p.sections.some(s => s.id === sectionId)) return p;
          const updated = {
            ...p,
            sections: p.sections.map(s => s.id === sectionId ? { ...s, name: name.trim() } : s)
          };
          modifiedProj = updated;
          return updated;
        });
        if (modifiedProj) syncProjectToFirebase(modifiedProj);
        return { projects: updatedProjects };
      }),

      deleteSection: (sectionId) => set((state) => {
        let modifiedProj: Project | undefined;
        const updatedProjects = state.projects.map(p => {
          if (!p.sections) return p;
          if (!p.sections.some(s => s.id === sectionId)) return p;
          const updated = {
            ...p,
            sections: p.sections.filter(s => s.id !== sectionId)
          };
          modifiedProj = updated;
          return updated;
        });
        if (modifiedProj) syncProjectToFirebase(modifiedProj);

        const updatedTasks = state.tasks.map(t => {
          if (t.sectionId === sectionId) {
            const updated = { ...t, sectionId: undefined };
            syncTaskToFirebase(updated);
            return updated;
          }
          return t;
        });
        return { projects: updatedProjects, tasks: updatedTasks };
      }),

      moveTaskToSection: (taskId, sectionId) => set((state) => {
        const updatedTasks = state.tasks.map(t => {
          if (t.id === taskId) {
            const updated = { ...t, sectionId };
            syncTaskToFirebase(updated);
            return updated;
          }
          return t;
        });
        return { tasks: updatedTasks };
      })
    }),
    {
      name: 'mypeople-storage-v5',
    }
  )
);

