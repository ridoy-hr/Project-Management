import { Task, Project, ProjectSection, User, Status, Priority } from '../types';
import { normalizeStatus, normalizePriority, normalizeDate } from './csvParser';

export interface SheetMeta {
  id: string;
  title: string;
  url: string;
  sheets: {
    sheetId: number;
    title: string;
    index: number;
  }[];
}

export interface SheetRowItem {
  rowIndex: number; // 1-indexed row number in the spreadsheet (e.g. 2 for first data row)
  raw: string[];
  title: string;
  sectionName?: string;
  status: Status;
  priority: Priority;
  dueDate?: string;
  assignee?: string;
  taskId?: string;
  isExistingInProject: boolean;
}

export const SPREADSHEET_HEADERS = [
  'Task Name',
  'Section',
  'Status',
  'Priority',
  'Due Date',
  'Assignee',
  'Task ID',
  'Last Synced'
];

/**
 * Extracts Google Spreadsheet ID from full URL or returns raw ID.
 */
export function extractSpreadsheetId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (match && match[1]) {
    return match[1];
  }
  // Check if it's already an ID
  if (/^[a-zA-Z0-9-_]{20,}$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed;
}

/**
 * Fetches spreadsheet metadata (title, list of tabs/sheets).
 */
export async function getSpreadsheetMeta(spreadsheetId: string, accessToken: string): Promise<SheetMeta> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}?fields=spreadsheetId,properties.title,sheets.properties`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    const message = err.error?.message || `Google Sheets API error (${response.status})`;
    throw new Error(message);
  }

  const data = await response.json();
  const sheets = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
    index: s.properties?.index || 0
  }));

  return {
    id: data.spreadsheetId,
    title: data.properties?.title || 'Untitled Spreadsheet',
    url: `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`,
    sheets
  };
}

/**
 * Creates a brand new Google Spreadsheet for the project and populates it with headers and current tasks.
 */
export async function createSpreadsheetForProject(
  project: Project,
  tasks: Task[],
  sections: ProjectSection[],
  users: User[],
  accessToken: string
): Promise<{ spreadsheetId: string; spreadsheetUrl: string; sheetTitle: string }> {
  // 1. Create spreadsheet
  const title = `${project.name} - Asana Sync`;
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      properties: {
        title
      }
    })
  });

  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to create Google Spreadsheet');
  }

  const createdData = await createRes.json();
  const spreadsheetId = createdData.spreadsheetId;
  const sheetTitle = createdData.sheets?.[0]?.properties?.title || 'Sheet1';

  // 2. Format task rows
  const rows: (string | number)[][] = [SPREADSHEET_HEADERS];

  const secMap = new Map<string, string>();
  sections.forEach(s => secMap.set(s.id, s.name));
  const userMap = new Map<string, string>();
  users.forEach(u => userMap.set(u.id, u.name));

  const projectTasks = tasks.filter(t => t.projectIds.includes(project.id));
  projectTasks.forEach(t => {
    rows.push([
      t.title,
      t.sectionId ? (secMap.get(t.sectionId) || '') : '',
      t.status,
      t.priority,
      t.dueDate || '',
      t.assigneeId ? (userMap.get(t.assigneeId) || '') : '',
      t.id,
      new Date().toISOString()
    ]);
  });

  // 3. Write data to sheet
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetTitle)}!A1:H${rows.length}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  return {
    spreadsheetId,
    spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
    sheetTitle
  };
}

/**
 * Reads all rows from a spreadsheet tab and parses them into structured items.
 */
export async function readSpreadsheetRows(
  spreadsheetId: string,
  sheetTitle: string,
  accessToken: string,
  existingTasks: Task[]
): Promise<{ rows: SheetRowItem[]; headerColMap: Record<string, number> }> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const range = `${encodeURIComponent(sheetTitle)}!A1:Z500`;
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read sheet values (${response.status})`);
  }

  const data = await response.json();
  const rawValues: string[][] = data.values || [];
  if (rawValues.length === 0) {
    return { rows: [], headerColMap: {} };
  }

  // Detect header columns
  const headerRow = rawValues[0];
  const colMap: Record<string, number> = {
    title: -1,
    section: -1,
    status: -1,
    priority: -1,
    dueDate: -1,
    assignee: -1,
    taskId: -1,
    lastSynced: -1
  };

  headerRow.forEach((col, idx) => {
    const k = String(col).toLowerCase().replace(/[^a-z0-9]/g, '');
    if (['title', 'task', 'name', 'taskname', 'tasktitle', 'summary', 'item', 'workitem', 'todo'].includes(k)) {
      if (colMap.title === -1) colMap.title = idx;
    } else if (['section', 'sectionname', 'group', 'category', 'bucket', 'phase', 'sprint', 'list'].includes(k)) {
      if (colMap.section === -1) colMap.section = idx;
    } else if (['status', 'state', 'stage', 'progress'].includes(k)) {
      if (colMap.status === -1) colMap.status = idx;
    } else if (['priority', 'urgency', 'level', 'importance'].includes(k)) {
      if (colMap.priority === -1) colMap.priority = idx;
    } else if (['duedate', 'due', 'deadline', 'date', 'targetdate', 'target'].includes(k)) {
      if (colMap.dueDate === -1) colMap.dueDate = idx;
    } else if (['assignee', 'owner', 'assignedto', 'user', 'member', 'person'].includes(k)) {
      if (colMap.assignee === -1) colMap.assignee = idx;
    } else if (['taskid', 'id', 'asanaid', 'tid'].includes(k)) {
      if (colMap.taskId === -1) colMap.taskId = idx;
    } else if (['lastsynced', 'synced', 'syncedat', 'updated'].includes(k)) {
      if (colMap.lastSynced === -1) colMap.lastSynced = idx;
    }
  });

  // Fallback: if no title found, use column 0
  if (colMap.title === -1) {
    colMap.title = 0;
  }

  const existingTaskIdSet = new Set(existingTasks.map(t => t.id));
  const existingTaskTitleMap = new Map(existingTasks.map(t => [t.title.toLowerCase().trim(), t.id]));

  const parsedItems: SheetRowItem[] = [];

  for (let i = 1; i < rawValues.length; i++) {
    const row = rawValues[i];
    if (!row || row.length === 0) continue;

    const titleRaw = colMap.title >= 0 ? (row[colMap.title] || '') : (row[0] || '');
    const cleanTitle = String(titleRaw).trim();
    if (!cleanTitle) continue;

    const sectionName = colMap.section >= 0 && row[colMap.section] ? String(row[colMap.section]).trim() : undefined;
    const statusVal = colMap.status >= 0 ? row[colMap.status] : '';
    const priorityVal = colMap.priority >= 0 ? row[colMap.priority] : '';
    const dueDateVal = colMap.dueDate >= 0 ? row[colMap.dueDate] : '';
    const assigneeVal = colMap.assignee >= 0 && row[colMap.assignee] ? String(row[colMap.assignee]).trim() : undefined;
    const taskIdVal = colMap.taskId >= 0 && row[colMap.taskId] ? String(row[colMap.taskId]).trim() : undefined;

    const isLinked = Boolean(
      (taskIdVal && existingTaskIdSet.has(taskIdVal)) ||
      existingTaskTitleMap.has(cleanTitle.toLowerCase())
    );

    parsedItems.push({
      rowIndex: i + 1, // 1-based index (header is 1, row 1 is 2)
      raw: row,
      title: cleanTitle,
      sectionName,
      status: normalizeStatus(statusVal),
      priority: normalizePriority(priorityVal),
      dueDate: normalizeDate(dueDateVal),
      assignee: assigneeVal,
      taskId: taskIdVal || (existingTaskTitleMap.get(cleanTitle.toLowerCase())),
      isExistingInProject: isLinked
    });
  }

  return { rows: parsedItems, headerColMap: colMap };
}

/**
 * Appends a new task row to the connected Google Spreadsheet.
 */
export async function appendTaskRowToSheet(
  spreadsheetId: string,
  sheetTitle: string,
  task: Task,
  sectionName: string | undefined,
  assigneeName: string | undefined,
  accessToken: string
): Promise<void> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const row = [
    task.title,
    sectionName || '',
    task.status,
    task.priority,
    task.dueDate || '',
    assigneeName || '',
    task.id,
    new Date().toISOString()
  ];

  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${encodeURIComponent(sheetTitle)}!A:H:append?valueInputOption=USER_ENTERED`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [row]
    })
  });
}

/**
 * Updates a specific row in the spreadsheet (e.g. after creating the task in project to record its Task ID).
 */
export async function updateSheetRowTaskId(
  spreadsheetId: string,
  sheetTitle: string,
  rowIndex: number,
  taskId: string,
  status: string,
  accessToken: string
): Promise<void> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  // Column G is Task ID (col 7), Column H is Last Synced (col 8)
  const range = `${encodeURIComponent(sheetTitle)}!G${rowIndex}:H${rowIndex}`;
  await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: [[taskId, new Date().toISOString()]]
    })
  });
}

/**
 * Syncs full project tasks to the connected spreadsheet, ensuring headers exist and all tasks are written.
 */
export async function exportProjectTasksToSheet(
  spreadsheetId: string,
  sheetTitle: string,
  tasks: Task[],
  sections: ProjectSection[],
  users: User[],
  accessToken: string
): Promise<number> {
  const cleanId = extractSpreadsheetId(spreadsheetId);
  const secMap = new Map<string, string>();
  sections.forEach(s => secMap.set(s.id, s.name));
  const userMap = new Map<string, string>();
  users.forEach(u => userMap.set(u.id, u.name));

  const rows: (string | number)[][] = [SPREADSHEET_HEADERS];
  tasks.forEach(t => {
    rows.push([
      t.title,
      t.sectionId ? (secMap.get(t.sectionId) || '') : '',
      t.status,
      t.priority,
      t.dueDate || '',
      t.assigneeId ? (userMap.get(t.assigneeId) || '') : '',
      t.id,
      new Date().toISOString()
    ]);
  });

  const range = `${encodeURIComponent(sheetTitle)}!A1:H${rows.length}`;
  const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${cleanId}/values/${range}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      values: rows
    })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Failed to update spreadsheet tasks');
  }

  return tasks.length;
}
