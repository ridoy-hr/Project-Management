import React, { useState } from 'react';
import { useStore } from '../../store';
import { Portfolio, Project, Task } from '../../types';
import { ViewState } from '../../App';
import { 
  Briefcase, Plus, ChevronRight, CheckCircle2, AlertTriangle, 
  TrendingUp, Calendar, Users, ArrowUpRight, FolderPlus, X 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Avatar } from '../ui/Avatar';
import { cn } from '../../lib/utils';

interface PortfoliosViewProps {
  onNavigate: (state: ViewState) => void;
  onTaskClick: (task: Task) => void;
}

export function PortfoliosView({ onNavigate, onTaskClick }: PortfoliosViewProps) {
  const { portfolios, projects, tasks, users, currentUser, addPortfolio } = useStore();
  const [selectedPortfolioId, setSelectedPortfolioId] = useState<string>(portfolios[0]?.id || '');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);

  const activePortfolio = portfolios.find(p => p.id === selectedPortfolioId) || portfolios[0];
  const portfolioProjects = projects.filter(p => activePortfolio?.projectIds.includes(p.id));

  // Compute portfolio progress rollups
  const allPortfolioTasks = tasks.filter(t => 
    t.projectIds.some(pid => activePortfolio?.projectIds.includes(pid))
  );
  const completedPortfolioTasks = allPortfolioTasks.filter(t => t.status === 'Done');
  const overallProgress = allPortfolioTasks.length > 0 
    ? Math.round((completedPortfolioTasks.length / allPortfolioTasks.length) * 100) 
    : 0;

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addPortfolio({
      name: newName.trim(),
      description: newDescription.trim() || 'Strategic cross-project portfolio',
      projectIds: selectedProjectIds.length > 0 ? selectedProjectIds : [projects[0]?.id],
      ownerId: currentUser.id,
      color: 'bg-mp-blue-500'
    });
    setNewName('');
    setNewDescription('');
    setSelectedProjectIds([]);
    setIsAddModalOpen(false);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-page-bg overflow-y-auto">
      {/* Portfolios Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 bg-white border-b border-black-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-black tracking-tight">Portfolios</h1>
                <span className="text-[12px] bg-black-100 text-black-600 px-2 py-0.5 rounded-full font-medium">
                  {portfolios.length} portfolios
                </span>
              </div>
              <p className="text-[13px] text-black-500">Cross-project health rollups, progress tracking, and strategic overviews</p>
            </div>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} size="sm" className="h-8.5 px-3.5 gap-1.5 shadow-2xs">
            <Plus className="w-4 h-4" /> New Portfolio
          </Button>
        </div>

        {/* Portfolio Tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          {portfolios.map(p => (
            <button
              key={p.id}
              onClick={() => setSelectedPortfolioId(p.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap flex items-center gap-2",
                activePortfolio?.id === p.id 
                  ? "bg-black text-white shadow-xs" 
                  : "bg-black-50 text-black-600 hover:bg-black-100 hover:text-black"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", p.color)}></span>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Portfolio Surface */}
      <div className="px-8 py-6 space-y-6">
        {/* Rollup Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm">
            <div className="text-[12px] font-semibold text-black-400 uppercase tracking-wider mb-1">Overall Progress</div>
            <div className="text-[26px] font-bold text-black">{overallProgress}%</div>
            <div className="w-full bg-black-100 h-2 rounded-full mt-3 overflow-hidden">
              <div className="bg-mp-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${overallProgress}%` }}></div>
            </div>
            <div className="text-[11px] text-black-400 mt-2">{completedPortfolioTasks.length} of {allPortfolioTasks.length} total tasks done</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm">
            <div className="text-[12px] font-semibold text-black-400 uppercase tracking-wider mb-1">Connected Projects</div>
            <div className="text-[26px] font-bold text-black">{portfolioProjects.length}</div>
            <div className="text-[12px] text-black-500 mt-2 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-success-border" />
              {portfolioProjects.filter(p => p.health === 'On Track').length} On Track
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm">
            <div className="text-[12px] font-semibold text-black-400 uppercase tracking-wider mb-1">Portfolio Health</div>
            <div className="text-[20px] font-bold text-success-border flex items-center gap-2 mt-1">
              <span className="w-3 h-3 rounded-full bg-success-border animate-pulse"></span>
              On Track
            </div>
            <div className="text-[12px] text-black-400 mt-2">Zero critical delivery blockers</div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-black-200 shadow-sm">
            <div className="text-[12px] font-semibold text-black-400 uppercase tracking-wider mb-1">Strategic Lead</div>
            <div className="flex items-center gap-2 mt-2">
              <Avatar initials="MR" src="/images/dan.jpg" size="sm" />
              <div>
                <div className="text-[13px] font-bold text-black">Mahbub Ridoy</div>
                <div className="text-[11px] text-black-400">Portfolio Owner</div>
              </div>
            </div>
          </div>
        </div>

        {/* Projects in Portfolio Table */}
        <div className="bg-white rounded-2xl border border-black-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-black-100 flex items-center justify-between">
            <div>
              <h2 className="text-[16px] font-bold text-black">Projects in this Portfolio</h2>
              <p className="text-[13px] text-black-400">{activePortfolio?.description}</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black-50 border-b border-black-200 text-[12px] font-semibold uppercase tracking-wider text-black-500">
                  <th className="py-3 px-5">Project Name</th>
                  <th className="py-3 px-4">Status & Health</th>
                  <th className="py-3 px-4">Task Completion</th>
                  <th className="py-3 px-4">Latest Update</th>
                  <th className="py-3 px-5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black-100">
                {portfolioProjects.map(proj => {
                  const projTasks = tasks.filter(t => t.projectIds.includes(proj.id));
                  const doneTasks = projTasks.filter(t => t.status === 'Done');
                  const pct = projTasks.length > 0 ? Math.round((doneTasks.length / projTasks.length) * 100) : 0;
                  const owner = users.find(u => u.id === proj.ownerId) || users[0];

                  return (
                    <tr key={proj.id} className="hover:bg-black-50/70 transition-colors group">
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-md shrink-0", proj.color)}></div>
                          <div>
                            <div className="text-[14px] font-bold text-black group-hover:text-mp-blue-600 transition-colors cursor-pointer" onClick={() => onNavigate({ type: 'project', id: proj.id })}>
                              {proj.name}
                            </div>
                            <div className="text-[12px] text-black-400 line-clamp-1">{proj.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 whitespace-nowrap">
                        <Badge variant={proj.health === 'On Track' ? 'success' : proj.health === 'At Risk' ? 'alert' : 'error'}>
                          {proj.health || 'On Track'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 w-[200px]">
                        <div className="flex items-center justify-between text-[12px] font-medium mb-1">
                          <span>{pct}%</span>
                          <span className="text-black-400">{doneTasks.length}/{projTasks.length}</span>
                        </div>
                        <div className="w-full bg-black-100 h-1.5 rounded-full overflow-hidden">
                          <div className="bg-mp-blue-600 h-full rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </td>
                      <td className="py-4 px-4 max-w-[280px]">
                        <div className="text-[12px] text-black-600 line-clamp-2">
                          {proj.statusUpdate || 'No status update recorded yet.'}
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onNavigate({ type: 'project', id: proj.id })}
                          className="h-8 text-[12px] gap-1 text-mp-blue-600 hover:text-mp-blue-700"
                        >
                          Open <ArrowUpRight className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* New Portfolio Modal */}
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
              <div className="w-9 h-9 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
                <Briefcase className="w-5 h-5" />
              </div>
              <h2 className="text-[18px] font-bold text-black">Create New Portfolio</h2>
            </div>

            <form onSubmit={handleCreatePortfolio} className="space-y-4">
              <div>
                <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Portfolio Name</label>
                <input 
                  type="text" 
                  required
                  placeholder="e.g. Q4 Executive Product Deliverables"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full text-[14px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-mp-blue-500"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Description</label>
                <textarea 
                  placeholder="Summarize the strategic intent or stakeholders for this initiative..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-[13px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-mp-blue-500 min-h-[70px]"
                />
              </div>

              <div>
                <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Include Projects</label>
                <div className="grid grid-cols-2 gap-2 max-h-[140px] overflow-y-auto p-1 border border-black-200 rounded-xl">
                  {projects.map(p => (
                    <label key={p.id} className="flex items-center gap-2 p-2 hover:bg-black-50 rounded-lg cursor-pointer text-[12px]">
                      <input 
                        type="checkbox" 
                        checked={selectedProjectIds.includes(p.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProjectIds([...selectedProjectIds, p.id]);
                          } else {
                            setSelectedProjectIds(selectedProjectIds.filter(id => id !== p.id));
                          }
                        }}
                        className="rounded border-black-300 text-mp-blue-600 focus:ring-mp-blue-500"
                      />
                      <span className="truncate font-medium text-black">{p.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-black-100">
                <Button type="button" variant="ghost" onClick={() => setIsAddModalOpen(false)}>Cancel</Button>
                <Button type="submit">Create Portfolio</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
