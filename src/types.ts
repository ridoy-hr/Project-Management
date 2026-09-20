export type Priority = 'Low' | 'Medium' | 'High';
export type Status = 'To Do' | 'In Progress' | 'Review' | 'Done';

export interface User {
  id: string;
  name: string;
  avatarUrl?: string;
  initials: string;
  role: 'admin' | 'member' | 'guest';
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  text: string;
  createdAt: string;
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  createdAt: string;
}

export interface AIMemoryNote {
  id: string;
  title: string;
  category: 'workflow' | 'insight' | 'decision' | 'recommendation';
  content: string;
  tags: string[];
  createdAt: string;
  isPinned?: boolean;
}

export interface TemplateTask {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  dayOffset?: number; // Days from project start date
  sectionName?: string;
  assigneeId?: string;
}

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  icon: string; // e.g., 'rocket', 'users', 'megaship'
  color: string;
  tasks: TemplateTask[];
}

export interface ProjectSection {
  id: string;
  projectId: string;
  name: string;
  order: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assigneeId?: string;
  dueDate?: string;
  sectionId?: string; // Supports grouping into main/sub sections
  isMilestone?: boolean; // Diamond milestone icon like in Asana
  isApproval?: boolean;
  projectIds: string[]; // Multi-homing support
  dependencyIds?: string[]; // Tasks that this task depends on
  collaboratorIds?: string[]; // People beside share icon
  attachments?: Attachment[];
  isPrivate?: boolean;
  bookmarked?: boolean;
  subtasks: Subtask[];
  comments: Comment[];
  auditLogs: AuditLog[];
  customFields: Record<string, string | number>;
}

export interface ConnectedSheetConfig {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheetTitle?: string;
  lastSyncedAt?: string;
  autoSyncEnabled?: boolean;
}

export interface Project {
  id: string;
  name: string;
  color: string;
  isPublic: boolean;
  ownerId?: string;
  description?: string;
  health?: 'On Track' | 'At Risk' | 'Off Track';
  statusUpdate?: string;
  sections?: ProjectSection[];
  isStarred?: boolean;
  isArchived?: boolean;
  memberIds?: string[];
  icon?: string;
  connectedSheet?: ConnectedSheetConfig;
}

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  projectIds: string[];
  ownerId: string;
  color: string;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  ownerId: string;
  timeframe: string;
  progress: number; // 0 to 100
  targetMetric: string;
  currentMetric: string;
  health: 'On Track' | 'At Risk' | 'Off Track';
  linkedProjectIds: string[];
}

export interface Team {
  id: string;
  name: string;
  description: string;
  memberIds: string[];
  iconColor: string;
}

