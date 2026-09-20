import * as XLSX from 'xlsx';
import { Status, Priority } from '../types';

export interface ParsedCsvTask {
  title: string;
  description?: string;
  status: Status;
  priority: Priority;
  assigneeNameOrId?: string;
  dueDate?: string;
  sectionName?: string;
}

export function normalizeDate(val: unknown): string | undefined {
  if (!val) return undefined;
  if (typeof val === 'number') {
    // Excel serial date format
    const date = new Date(Math.round((val - 25569) * 86400 * 1000));
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  }
  const str = String(val).trim();
  if (!str) return undefined;
  
  // Try direct date parsing
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  // Try parsing common DD/MM/YYYY or DD-MM-YYYY formats
  const parts = str.split(/[/.-]/);
  if (parts.length === 3) {
    // Check if YYYY-MM-DD or MM/DD/YYYY
    const p0 = parseInt(parts[0], 10);
    const p1 = parseInt(parts[1], 10);
    const p2 = parseInt(parts[2], 10);

    if (p0 > 1000) {
      // YYYY-MM-DD
      const d = new Date(p0, p1 - 1, p2);
      if (!isNaN(d.getTime())) return d.toISOString().split('T')[0];
    } else if (p2 > 1000) {
      // MM/DD/YYYY or DD/MM/YYYY
      const d1 = new Date(p2, p0 - 1, p1);
      if (!isNaN(d1.getTime())) return d1.toISOString().split('T')[0];
    }
  }

  return undefined;
}

export function normalizeStatus(val: unknown): Status {
  const s = String(val || '').toLowerCase().trim();
  if (s.includes('done') || s.includes('complete') || s.includes('finish') || s.includes('resolved') || s.includes('closed')) {
    return 'Done';
  }
  if (s.includes('prog') || s.includes('working') || s.includes('doing') || s.includes('active') || s.includes('wip') || s.includes('started')) {
    return 'In Progress';
  }
  if (s.includes('review') || s.includes('test') || s.includes('qa') || s.includes('verify') || s.includes('approval') || s.includes('pending')) {
    return 'Review';
  }
  return 'To Do';
}

export function normalizePriority(val: unknown): Priority {
  const p = String(val || '').toLowerCase().trim();
  if (p.includes('high') || p.includes('urgent') || p.includes('crit') || p.includes('p1') || p.includes('blocker')) {
    return 'High';
  }
  if (p.includes('low') || p.includes('minor') || p.includes('trivial') || p.includes('p3') || p.includes('p4')) {
    return 'Low';
  }
  return 'Medium';
}

/**
 * Parses a File or ArrayBuffer spreadsheet (.csv, .xlsx, .xls) into normalized task objects.
 */
export async function parseTasksFromSpreadsheet(fileOrBuffer: File | ArrayBuffer): Promise<ParsedCsvTask[]> {
  const buffer = fileOrBuffer instanceof File ? await fileOrBuffer.arrayBuffer() : fileOrBuffer;
  const workbook = XLSX.read(buffer, { type: 'array' });
  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('The file contains no readable sheets.');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

  if (!rawRows || rawRows.length === 0) {
    throw new Error('No task rows found in this file.');
  }

  const tasksList: ParsedCsvTask[] = [];

  for (const row of rawRows) {
    let title = '';
    let description = '';
    let statusRaw = '';
    let priorityRaw = '';
    let dueDateRaw: unknown = '';
    let assigneeRaw = '';
    let sectionRaw = '';

    for (const [key, value] of Object.entries(row)) {
      const k = key.toLowerCase().replace(/[^a-z0-9]/g, '');

      if (['title', 'task', 'name', 'taskname', 'tasktitle', 'summary', 'item', 'activity', 'workitem', 'todo', 'story'].includes(k)) {
        title = String(value);
      } else if (['description', 'desc', 'details', 'notes', 'comment', 'body', 'summarytext'].includes(k)) {
        description = String(value);
      } else if (['status', 'state', 'stage', 'progress', 'phase_status'].includes(k)) {
        statusRaw = String(value);
      } else if (['priority', 'urgency', 'level', 'importance', 'severity'].includes(k)) {
        priorityRaw = String(value);
      } else if (['duedate', 'due', 'deadline', 'date', 'targetdate', 'enddate', 'target'].includes(k)) {
        dueDateRaw = value;
      } else if (['assignee', 'assignedto', 'owner', 'member', 'user', 'person', 'resource'].includes(k)) {
        assigneeRaw = String(value);
      } else if (['section', 'sectionname', 'category', 'group', 'bucket', 'phase', 'sprint', 'milestone', 'list', 'column'].includes(k)) {
        sectionRaw = String(value);
      }
    }

    // Fallback if title not matched by recognized keys
    if (!title.trim()) {
      const values = Object.values(row).map(v => String(v).trim()).filter(Boolean);
      if (values.length > 0) {
        title = values[0];
      }
    }

    const cleanTitle = title.trim();
    if (cleanTitle) {
      tasksList.push({
        title: cleanTitle.slice(0, 250), // Ensure within safe database length
        description: description.trim() || undefined,
        status: normalizeStatus(statusRaw),
        priority: normalizePriority(priorityRaw),
        dueDate: normalizeDate(dueDateRaw),
        assigneeNameOrId: assigneeRaw.trim() || undefined,
        sectionName: sectionRaw.trim() || undefined
      });
    }
  }

  if (tasksList.length === 0) {
    throw new Error('Could not identify any valid task titles in the file.');
  }

  return tasksList;
}
