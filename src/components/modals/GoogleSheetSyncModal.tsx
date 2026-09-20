import React, { useState, useEffect, useCallback } from 'react';
import { 
  X, 
  FileSpreadsheet, 
  ExternalLink, 
  RefreshCw, 
  Check, 
  CheckSquare, 
  Square, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  Layers, 
  Unlink,
  LogIn,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Project, Task, Status, Priority } from '../../types';
import { useStore } from '../../store';
import { 
  googleSignIn, 
  getAccessToken, 
  getGoogleUser, 
  isGoogleAuthenticated, 
  googleLogout 
} from '../../lib/googleAuth';
import { 
  extractSpreadsheetId, 
  getSpreadsheetMeta, 
  readSpreadsheetRows, 
  createSpreadsheetForProject, 
  exportProjectTasksToSheet, 
  updateSheetRowTaskId,
  appendTaskRowToSheet,
  SheetRowItem, 
  SheetMeta 
} from '../../lib/googleSheetsService';

interface GoogleSheetSyncModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onToast?: (message: string, type: 'success' | 'info' | 'error') => void;
}

export function GoogleSheetSyncModal({
  project,
  isOpen,
  onClose,
  onToast
}: GoogleSheetSyncModalProps) {
  const { 
    tasks, 
    users, 
    currentUser, 
    connectSheetToProject, 
    disconnectSheetFromProject, 
    createTasksFromGoogleSheetRows,
    addTask
  } = useStore();

  const projectTasks = tasks.filter(t => t.projectIds.includes(project.id));
  const sections = project.sections || [];

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(isGoogleAuthenticated());
  const [userEmail, setUserEmail] = useState<string | null>(getGoogleUser()?.email || null);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Setup / Connection State
  const [connectionMode, setConnectionMode] = useState<'existing' | 'new'>('existing');
  const [spreadsheetInput, setSpreadsheetInput] = useState<string>(project.connectedSheet?.spreadsheetUrl || project.connectedSheet?.spreadsheetId || '');
  const [sheetMeta, setSheetMeta] = useState<SheetMeta | null>(null);
  const [selectedSheetTitle, setSelectedSheetTitle] = useState<string>(project.connectedSheet?.sheetTitle || 'Sheet1');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Rows & Live Sync State
  const [sheetRows, setSheetRows] = useState<SheetRowItem[]>([]);
  const [isLoadingRows, setIsLoadingRows] = useState<boolean>(false);
  const [selectedRowIndices, setSelectedRowIndices] = useState<Set<number>>(new Set());
  const [isCreatingTasks, setIsCreatingTasks] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Quick Inline Add Row
  const [inlineTaskTitle, setInlineTaskTitle] = useState<string>('');
  const [inlineSectionId, setInlineSectionId] = useState<string>(sections[0]?.id || '');
  const [inlinePriority, setInlinePriority] = useState<Priority>('Medium');
  const [isAddingInline, setIsAddingInline] = useState<boolean>(false);

  const notify = useCallback((msg: string, type: 'success' | 'info' | 'error' = 'info') => {
    if (onToast) onToast(msg, type);
  }, [onToast]);

  // Check auth on open
  useEffect(() => {
    if (isOpen) {
      const authState = isGoogleAuthenticated();
      setIsAuthenticated(authState);
      const user = getGoogleUser();
      if (user?.email) setUserEmail(user.email);
    }
  }, [isOpen]);

  // If already connected, fetch metadata and rows automatically
  const loadRows = useCallback(async (spreadsheetId: string, sheetTitle: string) => {
    try {
      setIsLoadingRows(true);
      setConnectError(null);
      const token = await getAccessToken();
      if (!token) {
        setIsAuthenticated(false);
        setIsLoadingRows(false);
        return;
      }

      const { rows } = await readSpreadsheetRows(spreadsheetId, sheetTitle, token, projectTasks);
      setSheetRows(rows);
      setSelectedRowIndices(new Set());
    } catch (err: any) {
      console.error('Error fetching sheet rows:', err);
      setConnectError(err.message || 'Failed to load spreadsheet rows');
    } finally {
      setIsLoadingRows(false);
    }
  }, [projectTasks]);

  useEffect(() => {
    if (isOpen && project.connectedSheet?.spreadsheetId && isAuthenticated) {
      getAccessToken().then(token => {
        if (token && project.connectedSheet) {
          getSpreadsheetMeta(project.connectedSheet.spreadsheetId, token)
            .then(meta => {
              setSheetMeta(meta);
              const activeTitle = project.connectedSheet?.sheetTitle || meta.sheets[0]?.title || 'Sheet1';
              setSelectedSheetTitle(activeTitle);
              loadRows(project.connectedSheet!.spreadsheetId, activeTitle);
            })
            .catch(err => {
              console.warn('Failed to load sheet meta:', err);
            });
        }
      });
    }
  }, [isOpen, project.connectedSheet, isAuthenticated, loadRows]);

  if (!isOpen) return null;

  // Handle Google Sign In
  const handleGoogleSignIn = async () => {
    try {
      setIsSigningIn(true);
      setConnectError(null);
      const { user } = await googleSignIn();
      setIsAuthenticated(true);
      setUserEmail(user.email);
      notify(`Signed in as ${user.email}`, 'success');

      // If project has connected sheet, load now
      if (project.connectedSheet) {
        loadRows(project.connectedSheet.spreadsheetId, project.connectedSheet.sheetTitle || 'Sheet1');
      }
    } catch (err: any) {
      console.error('Google Sign in error:', err);
      setConnectError(err.message || 'Authentication failed. Please allow Google popups.');
      notify('Authentication failed', 'error');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Connect Existing Sheet
  const handleConnectExisting = async () => {
    if (!spreadsheetInput.trim()) {
      setConnectError('Please enter a Google Spreadsheet URL or ID');
      return;
    }

    try {
      setIsConnecting(true);
      setConnectError(null);
      const token = await getAccessToken();
      if (!token) {
        await handleGoogleSignIn();
        return;
      }

      const cleanId = extractSpreadsheetId(spreadsheetInput);
      const meta = await getSpreadsheetMeta(cleanId, token);
      setSheetMeta(meta);
      const defaultSheet = meta.sheets[0]?.title || 'Sheet1';
      setSelectedSheetTitle(defaultSheet);

      // Save connection to project in store & Firebase
      connectSheetToProject(project.id, {
        spreadsheetId: meta.id,
        spreadsheetUrl: meta.url,
        sheetTitle: defaultSheet,
        lastSyncedAt: new Date().toISOString(),
        autoSyncEnabled: true
      });

      notify(`Connected to Google Spreadsheet: "${meta.title}"`, 'success');
      loadRows(meta.id, defaultSheet);
    } catch (err: any) {
      console.error('Connect error:', err);
      setConnectError(err.message || 'Could not connect to spreadsheet. Check permissions.');
      notify('Failed to connect to sheet', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Create Brand New Synced Spreadsheet
  const handleCreateNewSheet = async () => {
    try {
      setIsConnecting(true);
      setConnectError(null);
      let token = await getAccessToken();
      if (!token) {
        const authRes = await googleSignIn();
        token = authRes.accessToken;
        setIsAuthenticated(true);
        setUserEmail(authRes.user.email);
      }

      const res = await createSpreadsheetForProject(
        project,
        tasks,
        sections,
        users,
        token
      );

      const meta = await getSpreadsheetMeta(res.spreadsheetId, token);
      setSheetMeta(meta);
      setSelectedSheetTitle(res.sheetTitle);

      connectSheetToProject(project.id, {
        spreadsheetId: res.spreadsheetId,
        spreadsheetUrl: res.spreadsheetUrl,
        sheetTitle: res.sheetTitle,
        lastSyncedAt: new Date().toISOString(),
        autoSyncEnabled: true
      });

      notify(`Created and synced new Google Sheet "${meta.title}"!`, 'success');
      loadRows(res.spreadsheetId, res.sheetTitle);
    } catch (err: any) {
      console.error('Create sheet error:', err);
      setConnectError(err.message || 'Failed to create spreadsheet on Google Drive');
      notify('Failed to create new spreadsheet', 'error');
    } finally {
      setIsConnecting(false);
    }
  };

  // Disconnect Sheet
  const handleDisconnect = () => {
    if (window.confirm(`Disconnect Google Sheet from "${project.name}"? Tasks in the app will remain intact.`)) {
      disconnectSheetFromProject(project.id);
      setSheetMeta(null);
      setSheetRows([]);
      setSelectedRowIndices(new Set());
      notify('Disconnected Google Sheet from project', 'info');
    }
  };

  // Toggle Single Row Selection
  const toggleRowSelect = (rowIndex: number) => {
    setSelectedRowIndices(prev => {
      const next = new Set(prev);
      if (next.has(rowIndex)) {
        next.delete(rowIndex);
      } else {
        next.add(rowIndex);
      }
      return next;
    });
  };

  // Toggle Select All
  const toggleSelectAll = () => {
    if (selectedRowIndices.size === sheetRows.length) {
      setSelectedRowIndices(new Set());
    } else {
      setSelectedRowIndices(new Set(sheetRows.map(r => r.rowIndex)));
    }
  };

  // Asana Menu Action: Create Tasks from Selected Rows
  const handleCreateTasksFromSelection = async () => {
    if (selectedRowIndices.size === 0) return;

    try {
      setIsCreatingTasks(true);
      const token = await getAccessToken();

      const selectedItems = sheetRows.filter(r => selectedRowIndices.has(r.rowIndex));
      const targetRows = selectedItems.map(item => ({
        title: item.title,
        sectionName: item.sectionName,
        status: item.status,
        priority: item.priority,
        dueDate: item.dueDate,
        assignee: item.assignee,
        taskId: item.taskId,
        rowIndex: item.rowIndex
      }));

      // 1. Create/Update tasks in store and Firebase
      const createdTasks = createTasksFromGoogleSheetRows(project.id, targetRows);

      // 2. Update the spreadsheet row with the newly generated task IDs so both sides match!
      if (token && project.connectedSheet) {
        for (let i = 0; i < selectedItems.length; i++) {
          const item = selectedItems[i];
          const correspondingTask = createdTasks[i];
          if (correspondingTask) {
            await updateSheetRowTaskId(
              project.connectedSheet.spreadsheetId,
              selectedSheetTitle,
              item.rowIndex,
              correspondingTask.id,
              correspondingTask.status,
              token
            ).catch(e => console.warn('Could not update row task ID:', e));
          }
        }
      }

      notify(`Created ${createdTasks.length} task${createdTasks.length > 1 ? 's' : ''} in ${project.name} and synced with Google Sheet!`, 'success');

      // Refresh rows in preview
      if (project.connectedSheet) {
        await loadRows(project.connectedSheet.spreadsheetId, selectedSheetTitle);
      }
    } catch (err: any) {
      console.error('Task creation error:', err);
      notify('Failed to create tasks from selection', 'error');
    } finally {
      setIsCreatingTasks(false);
    }
  };

  // Single Row: Create Task
  const handleCreateSingleRowTask = async (rowItem: SheetRowItem) => {
    try {
      const token = await getAccessToken();
      const created = createTasksFromGoogleSheetRows(project.id, [{
        title: rowItem.title,
        sectionName: rowItem.sectionName,
        status: rowItem.status,
        priority: rowItem.priority,
        dueDate: rowItem.dueDate,
        assignee: rowItem.assignee,
        taskId: rowItem.taskId,
        rowIndex: rowItem.rowIndex
      }]);

      if (token && project.connectedSheet && created[0]) {
        await updateSheetRowTaskId(
          project.connectedSheet.spreadsheetId,
          selectedSheetTitle,
          rowItem.rowIndex,
          created[0].id,
          created[0].status,
          token
        );
      }

      notify(`Task "${rowItem.title}" created and linked to spreadsheet row!`, 'success');
      if (project.connectedSheet) {
        loadRows(project.connectedSheet.spreadsheetId, selectedSheetTitle);
      }
    } catch (err: any) {
      console.error('Error:', err);
      notify('Failed to create task', 'error');
    }
  };

  // Quick Add Row directly to spreadsheet and project
  const handleAddInlineRow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inlineTaskTitle.trim()) return;

    try {
      setIsAddingInline(true);
      const token = await getAccessToken();

      const targetSec = sections.find(s => s.id === inlineSectionId);
      const secName = targetSec?.name || sections[0]?.name || 'To Do';

      // 1. Add to project
      addTask({
        title: inlineTaskTitle.trim(),
        sectionId: inlineSectionId || sections[0]?.id,
        status: 'To Do',
        priority: inlinePriority,
        projectIds: [project.id],
        assigneeId: currentUser.id
      });

      setInlineTaskTitle('');
      notify(`Added "${inlineTaskTitle.trim()}" to project and synced with sheet!`, 'success');

      // 2. Reload rows after brief delay
      if (project.connectedSheet) {
        setTimeout(() => {
          loadRows(project.connectedSheet!.spreadsheetId, selectedSheetTitle);
        }, 1000);
      }
    } catch (err: any) {
      console.error('Add inline error:', err);
      notify('Failed to add task row', 'error');
    } finally {
      setIsAddingInline(false);
    }
  };

  // Full Push of all project tasks to Google Sheet
  const handleExportAllTasksToSheet = async () => {
    if (!project.connectedSheet) return;

    try {
      setIsExporting(true);
      const token = await getAccessToken();
      if (!token) {
        await handleGoogleSignIn();
        return;
      }

      const count = await exportProjectTasksToSheet(
        project.connectedSheet.spreadsheetId,
        selectedSheetTitle,
        projectTasks,
        sections,
        users,
        token
      );

      notify(`Synced ${count} tasks to Google Sheet tab "${selectedSheetTitle}"!`, 'success');
      loadRows(project.connectedSheet.spreadsheetId, selectedSheetTitle);
    } catch (err: any) {
      console.error('Export error:', err);
      notify('Failed to export tasks to sheet', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const isConnected = Boolean(project.connectedSheet?.spreadsheetId);
  const unlinkedCount = sheetRows.filter(r => !r.isExistingInProject).length;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-black-200 w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-black-100 flex items-center justify-between bg-black-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-black tracking-tight">Google Sheets 2-Way Sync</h2>
                <span className="text-[11px] font-semibold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                  Asana Mode
                </span>
              </div>
              <p className="text-xs text-black-500">
                Project: <span className="font-semibold text-black-700">{project.name}</span>
                {project.connectedSheet?.lastSyncedAt && (
                  <span className="ml-2 text-black-400">
                    • Last synced {new Date(project.connectedSheet.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Google Account badge / Sign in */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2 bg-white border border-black-200 px-3 py-1.5 rounded-full text-xs text-black-700 shadow-2xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-medium truncate max-w-[180px]">{userEmail || 'Google Connected'}</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSigningIn}
                className="flex items-center gap-2 bg-white hover:bg-black-50 text-black border border-black-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                <LogIn className="w-3.5 h-3.5 text-mp-blue-600" />
                {isSigningIn ? 'Connecting...' : 'Sign in with Google'}
              </button>
            )}

            <button 
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-black-100 text-black-400 hover:text-black transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Error message */}
        {connectError && (
          <div className="px-6 py-2.5 bg-red-50 border-b border-red-200 text-xs text-red-700 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{connectError}</span>
            </div>
            <button 
              onClick={() => setConnectError(null)}
              className="text-red-600 hover:underline font-medium text-[11px]"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Main Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* If NOT connected: Setup Panel */}
          {!isConnected ? (
            <div className="max-w-2xl mx-auto py-6">
              <div className="text-center mb-8">
                <div className="w-14 h-14 bg-emerald-100/70 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto mb-3 text-emerald-600 shadow-sm">
                  <FileSpreadsheet className="w-7 h-7" />
                </div>
                <h3 className="text-xl font-bold text-black tracking-tight">Connect {project.name} to Google Sheets</h3>
                <p className="text-sm text-black-500 mt-1 max-w-md mx-auto">
                  Seamlessly select rows in your spreadsheet to create Asana tasks here, or have newly created tasks instantly populate in your spreadsheet.
                </p>
              </div>

              {/* Tabs */}
              <div className="flex bg-black-100 p-1 rounded-xl mb-6 max-w-md mx-auto">
                <button
                  type="button"
                  onClick={() => setConnectionMode('existing')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    connectionMode === 'existing' 
                      ? 'bg-white text-black shadow-xs' 
                      : 'text-black-600 hover:text-black'
                  }`}
                >
                  Link Existing Sheet
                </button>
                <button
                  type="button"
                  onClick={() => setConnectionMode('new')}
                  className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                    connectionMode === 'new' 
                      ? 'bg-white text-black shadow-xs' 
                      : 'text-black-600 hover:text-black'
                  }`}
                >
                  Create New Spreadsheet
                </button>
              </div>

              {connectionMode === 'existing' ? (
                <div className="bg-black-50/60 border border-black-200 rounded-xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-black-700 mb-1.5">
                      Google Spreadsheet URL or Sheet ID
                    </label>
                    <input 
                      type="text"
                      placeholder="https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit"
                      value={spreadsheetInput}
                      onChange={(e) => setSpreadsheetInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-black-300 rounded-lg text-xs text-black focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all font-mono"
                    />
                    <p className="text-[11px] text-black-500 mt-1.5">
                      Tip: Ensure your Google Sheet is shared with your account or anyone with the link.
                    </p>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={handleConnectExisting}
                      disabled={isConnecting}
                      className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                    >
                      {isConnecting ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Connecting...
                        </>
                      ) : (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Link Spreadsheet
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-black-50/60 border border-black-200 rounded-xl p-6 text-center space-y-4">
                  <div className="max-w-md mx-auto space-y-2">
                    <p className="text-xs text-black-600">
                      We will automatically generate a new Google Spreadsheet on your Google Drive titled:
                    </p>
                    <div className="bg-white border border-black-200 px-3 py-2 rounded-lg text-xs font-mono font-medium text-black-800">
                      {project.name} - Asana Sync
                    </div>
                    <p className="text-[11px] text-black-500">
                      Preconfigured with standard columns: Task Name, Section, Status, Priority, Due Date, Assignee, Task ID.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleCreateNewSheet}
                    disabled={isConnecting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Creating on Google Drive...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Create & Connect Synced Sheet
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* If CONNECTED: Full Live Spreadsheet Manager */
            <div className="space-y-4">
              
              {/* Connected Sheet Toolbar */}
              <div className="bg-black-50/80 border border-black-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    GS
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-black">
                        {sheetMeta?.title || 'Connected Google Spreadsheet'}
                      </span>
                      <a 
                        href={project.connectedSheet?.spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium inline-flex items-center gap-1 hover:underline"
                      >
                        Open in Sheets <ArrowUpRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-black-500 mt-0.5">
                      <span>Tab:</span>
                      {sheetMeta?.sheets && sheetMeta.sheets.length > 1 ? (
                        <select
                          value={selectedSheetTitle}
                          onChange={(e) => {
                            setSelectedSheetTitle(e.target.value);
                            loadRows(project.connectedSheet!.spreadsheetId, e.target.value);
                          }}
                          className="bg-white border border-black-200 rounded px-2 py-0.5 text-xs text-black font-medium"
                        >
                          {sheetMeta.sheets.map(s => (
                            <option key={s.sheetId} value={s.title}>{s.title}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-semibold text-black-700">{selectedSheetTitle}</span>
                      )}
                      <span>•</span>
                      <span>{sheetRows.length} rows loaded</span>
                      {unlinkedCount > 0 && (
                        <span className="text-amber-600 font-medium">({unlinkedCount} not in project yet)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => project.connectedSheet && loadRows(project.connectedSheet.spreadsheetId, selectedSheetTitle)}
                    disabled={isLoadingRows}
                    title="Reload rows from Google Sheet"
                    className="p-2 bg-white hover:bg-black-100 text-black border border-black-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRows ? 'animate-spin text-emerald-600' : 'text-black-500'}`} />
                    Refresh Sheet
                  </button>

                  <button
                    type="button"
                    onClick={handleExportAllTasksToSheet}
                    disabled={isExporting}
                    title="Push all project tasks into the Google Sheet"
                    className="px-3 py-2 bg-white hover:bg-black-100 text-black border border-black-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                    {isExporting ? 'Syncing...' : 'Sync All to Sheet'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDisconnect}
                    title="Disconnect Google Sheet"
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                  >
                    <Unlink className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* ASANA ROW SELECTION ACTION BANNER (The specific feature requested) */}
              <div className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-4 ${
                selectedRowIndices.size > 0 
                  ? 'bg-emerald-50/90 border-emerald-300 shadow-sm' 
                  : 'bg-black-50 border-black-200'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="flex items-center gap-1.5 text-xs font-semibold text-black-700 hover:text-black cursor-pointer"
                    >
                      {selectedRowIndices.size === sheetRows.length && sheetRows.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Square className="w-4 h-4 text-black-400" />
                      )}
                      <span>Select All ({sheetRows.length})</span>
                    </button>
                  </div>

                  <div className="h-4 w-px bg-black-200" />

                  <span className="text-xs font-semibold text-black-800">
                    {selectedRowIndices.size} row{selectedRowIndices.size === 1 ? '' : 's'} selected
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCreateTasksFromSelection}
                    disabled={selectedRowIndices.size === 0 || isCreatingTasks}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-xs cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isCreatingTasks ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Creating in Project & Updating Sheet...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Asana: Create Tasks from Selected ({selectedRowIndices.size})
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Table of Spreadsheet Rows */}
              <div className="border border-black-200 rounded-xl overflow-hidden bg-white shadow-2xs">
                {isLoadingRows ? (
                  <div className="py-16 text-center text-black-500 space-y-2">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-600" />
                    <p className="text-xs font-medium">Fetching rows from Google Sheet...</p>
                  </div>
                ) : sheetRows.length === 0 ? (
                  <div className="py-14 text-center text-black-500 space-y-3">
                    <FileSpreadsheet className="w-10 h-10 text-black-300 mx-auto" />
                    <div>
                      <p className="text-sm font-semibold text-black-700">No task rows found in this sheet tab</p>
                      <p className="text-xs text-black-400 mt-0.5">
                        Add rows to your Google Sheet or use the quick input below to add one now.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="overflow-x-auto max-h-[400px]">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-black-50/80 sticky top-0 z-10 border-b border-black-200 text-black-600 text-[11px] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-2.5 px-3 w-10 text-center">
                            <button 
                              type="button" 
                              onClick={toggleSelectAll} 
                              className="cursor-pointer"
                              title="Select / Deselect all"
                            >
                              {selectedRowIndices.size === sheetRows.length && sheetRows.length > 0 ? (
                                <CheckSquare className="w-4 h-4 text-emerald-600" />
                              ) : (
                                <Square className="w-4 h-4 text-black-400" />
                              )}
                            </button>
                          </th>
                          <th className="py-2.5 px-2 w-12 text-black-400 font-mono">Row</th>
                          <th className="py-2.5 px-3 font-semibold text-black-800">Task Name</th>
                          <th className="py-2.5 px-3">Section</th>
                          <th className="py-2.5 px-3">Status</th>
                          <th className="py-2.5 px-3">Priority</th>
                          <th className="py-2.5 px-3">Due Date</th>
                          <th className="py-2.5 px-3">Assignee</th>
                          <th className="py-2.5 px-3 text-right">Project Sync</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black-100">
                        {sheetRows.map((row) => {
                          const isSelected = selectedRowIndices.has(row.rowIndex);
                          return (
                            <tr 
                              key={row.rowIndex}
                              className={`group hover:bg-emerald-50/30 transition-colors ${
                                isSelected ? 'bg-emerald-50/50' : ''
                              }`}
                            >
                              <td className="py-2 px-3 text-center">
                                <button
                                  type="button"
                                  onClick={() => toggleRowSelect(row.rowIndex)}
                                  className="cursor-pointer"
                                >
                                  {isSelected ? (
                                    <CheckSquare className="w-4 h-4 text-emerald-600" />
                                  ) : (
                                    <Square className="w-4 h-4 text-black-300 group-hover:text-black-500" />
                                  )}
                                </button>
                              </td>
                              <td className="py-2 px-2 font-mono text-[11px] text-black-400">
                                #{row.rowIndex}
                              </td>
                              <td className="py-2 px-3 font-medium text-black-900">
                                <span className="line-clamp-1">{row.title}</span>
                              </td>
                              <td className="py-2 px-3">
                                {row.sectionName ? (
                                  <span className="inline-flex items-center gap-1 bg-black-100 text-black-700 px-2 py-0.5 rounded-md text-[11px] font-medium">
                                    <Layers className="w-3 h-3 text-black-400" />
                                    {row.sectionName}
                                  </span>
                                ) : (
                                  <span className="text-black-300 text-[11px] italic">Default</span>
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                  row.status === 'Done' ? 'bg-emerald-100 text-emerald-800' :
                                  row.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                                  row.status === 'Review' ? 'bg-purple-100 text-purple-800' :
                                  'bg-black-100 text-black-700'
                                }`}>
                                  {row.status}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`text-[11px] font-medium ${
                                  row.priority === 'High' ? 'text-red-600 font-semibold' :
                                  row.priority === 'Medium' ? 'text-amber-600' :
                                  'text-black-500'
                                }`}>
                                  {row.priority}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-black-500 text-[11px]">
                                {row.dueDate || '—'}
                              </td>
                              <td className="py-2 px-3 text-black-600 text-[11px]">
                                {row.assignee || '—'}
                              </td>
                              <td className="py-2 px-3 text-right">
                                {row.isExistingInProject ? (
                                  <span className="inline-flex items-center gap-1 text-emerald-600 font-medium text-[11px]">
                                    <Check className="w-3.5 h-3.5" />
                                    Synced
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleCreateSingleRowTask(row)}
                                    className="px-2 py-1 bg-black-100 hover:bg-emerald-600 hover:text-white text-black-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                  >
                                    + Create Task
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Quick Add Row footer */}
                <form 
                  onSubmit={handleAddInlineRow}
                  className="bg-black-50/70 border-t border-black-200 p-3 flex items-center gap-3"
                >
                  <span className="text-xs font-semibold text-black-700 shrink-0 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-emerald-600" />
                    Quick Add to Sheet & Project:
                  </span>

                  <input
                    type="text"
                    placeholder="New task title..."
                    value={inlineTaskTitle}
                    onChange={(e) => setInlineTaskTitle(e.target.value)}
                    className="flex-1 bg-white border border-black-300 rounded-lg px-3 py-1.5 text-xs text-black focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                  />

                  <select
                    value={inlineSectionId}
                    onChange={(e) => setInlineSectionId(e.target.value)}
                    className="bg-white border border-black-300 rounded-lg px-2.5 py-1.5 text-xs text-black"
                  >
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>

                  <select
                    value={inlinePriority}
                    onChange={(e) => setInlinePriority(e.target.value as Priority)}
                    className="bg-white border border-black-300 rounded-lg px-2.5 py-1.5 text-xs text-black"
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>

                  <button
                    type="submit"
                    disabled={!inlineTaskTitle.trim() || isAddingInline}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {isAddingInline ? 'Adding...' : 'Add'}
                  </button>
                </form>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-black-100 flex items-center justify-between bg-black-50/50">
          <div className="flex items-center gap-2 text-xs text-black-500">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Official Google Sheets API via Google Workspace integration</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-black-100 text-black border border-black-300 rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
