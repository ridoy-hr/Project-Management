import React, { useState } from 'react';
import { useStore } from '../../store';
import { Team, User, Task } from '../../types';
import { ViewState } from '../../App';
import { 
  Users, Plus, Mail, Shield, UserCheck, Search, ArrowUpRight, 
  Briefcase, CheckCircle2, X 
} from 'lucide-react';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';

interface TeamsViewProps {
  onNavigate: (state: ViewState) => void;
  onTaskClick: (task: Task) => void;
}

export function TeamsView({ onNavigate, onTaskClick }: TeamsViewProps) {
  const { teams, users, projects, tasks, currentUser, addTeamMember } = useStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id || '');
  const [searchMember, setSearchMember] = useState('');
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'guest'>('member');
  const [invitedSuccess, setInvitedSuccess] = useState(false);

  const activeTeam = teams.find(t => t.id === selectedTeamId) || teams[0];
  const teamMembers = users.filter(u => activeTeam?.memberIds.includes(u.id));

  // Find projects affiliated with this team
  const teamProjects = projects;

  const handleSendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInvitedSuccess(true);
    setTimeout(() => {
      setInvitedSuccess(false);
      setIsInviteModalOpen(false);
      setInviteEmail('');
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-page-bg overflow-y-auto">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 shrink-0 bg-white border-b border-black-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-[22px] font-bold text-black tracking-tight">Teams & People Directory</h1>
                <span className="text-[12px] bg-black-100 text-black-600 px-2 py-0.5 rounded-full font-medium">
                  {users.length} members
                </span>
              </div>
              <p className="text-[13px] text-black-500">Workspace member directory, roles, team groupings, and collaboration governance</p>
            </div>
          </div>
          <Button onClick={() => setIsInviteModalOpen(true)} size="sm" className="h-8.5 px-3.5 gap-1.5 shadow-2xs">
            <Plus className="w-4 h-4" /> Invite Member
          </Button>
        </div>

        {/* Team switcher tabs */}
        <div className="flex items-center gap-2 mt-6 overflow-x-auto pb-1">
          {teams.map(t => (
            <button
              key={t.id}
              onClick={() => setSelectedTeamId(t.id)}
              className={cn(
                "px-3.5 py-1.5 rounded-lg text-[13px] font-semibold transition-all whitespace-nowrap flex items-center gap-2",
                activeTeam?.id === t.id 
                  ? "bg-black text-white shadow-xs" 
                  : "bg-black-50 text-black-600 hover:bg-black-100 hover:text-black"
              )}
            >
              <span className={cn("w-2 h-2 rounded-full", t.iconColor)}></span>
              {t.name} ({t.memberIds.length})
            </button>
          ))}
        </div>
      </div>

      {/* Surface */}
      <div className="px-8 py-6 space-y-6">
        {/* Team Overview Card */}
        <div className="bg-white rounded-2xl border border-black-200 p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-[18px] font-bold text-black">{activeTeam?.name}</h2>
              <p className="text-[13px] text-black-500 mt-1">{activeTeam?.description}</p>
            </div>
            <Badge variant="default">{teamMembers.length} Members</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-3 bg-black-50 rounded-xl border border-black-100">
              <span className="text-[11px] font-semibold uppercase text-black-400">Team Privacy</span>
              <div className="text-[14px] font-bold text-black mt-1">Public to Workspace</div>
            </div>
            <div className="p-3 bg-black-50 rounded-xl border border-black-100">
              <span className="text-[11px] font-semibold uppercase text-black-400">Default Permission</span>
              <div className="text-[14px] font-bold text-black mt-1">Full Member Access</div>
            </div>
            <div className="p-3 bg-black-50 rounded-xl border border-black-100">
              <span className="text-[11px] font-semibold uppercase text-black-400">Active Workstreams</span>
              <div className="text-[14px] font-bold text-black mt-1">{teamProjects.length} Projects Connected</div>
            </div>
          </div>
        </div>

        {/* Member Directory Grid */}
        <div className="bg-white rounded-2xl border border-black-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-bold text-black">Members in {activeTeam?.name}</h3>
            <div className="relative w-[260px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-black-400" />
              <input 
                type="text" 
                placeholder="Filter members..." 
                value={searchMember}
                onChange={(e) => setSearchMember(e.target.value)}
                className="w-full text-[13px] pl-9 pr-3 py-1.5 bg-black-50 rounded-lg border border-black-200 outline-none focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {teamMembers
              .filter(m => m.name.toLowerCase().includes(searchMember.toLowerCase()))
              .map(member => {
                const assignedTasks = tasks.filter(t => t.assigneeId === member.id);
                const doneTasks = assignedTasks.filter(t => t.status === 'Done');

                return (
                  <div key={member.id} className="p-4 rounded-xl border border-black-200 hover:border-black-300 transition-all space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar initials={member.initials} src={member.avatarUrl} size="md" />
                        <div>
                          <div className="text-[14px] font-bold text-black">{member.name}</div>
                          <div className="text-[12px] text-black-400 capitalize">{member.role}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase",
                        member.role === 'admin' ? "bg-purple-100 text-purple-700" : "bg-black-100 text-black-600"
                      )}>
                        {member.role}
                      </span>
                    </div>

                    <div className="pt-2 border-t border-black-100 flex items-center justify-between text-[12px] text-black-500">
                      <span>Tasks: {doneTasks.length}/{assignedTasks.length} Done</span>
                      <span className="text-success-border font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Active
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Invite Member Modal */}
      {isInviteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-6 w-[480px] shadow-2xl border border-black-200 relative">
            <button 
              onClick={() => setIsInviteModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-black-400 hover:text-black rounded-lg hover:bg-black-50"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                <Mail className="w-5 h-5" />
              </div>
              <h2 className="text-[18px] font-bold text-black">Invite Teammates to Workspace</h2>
            </div>

            {invitedSuccess ? (
              <div className="p-6 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-success-bg text-success-text mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="text-[16px] font-bold text-black">Invitation Sent!</h3>
                <p className="text-[13px] text-black-500">An invitation email has been dispatched with login credentials.</p>
              </div>
            ) : (
              <form onSubmit={handleSendInvite} className="space-y-4">
                <div>
                  <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Email Address</label>
                  <input 
                    type="email" 
                    required
                    placeholder="name@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full text-[14px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none focus:bg-white focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="text-[12px] font-bold text-black-500 uppercase tracking-wider block mb-1.5">Workspace Role</label>
                  <select 
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as any)}
                    className="w-full text-[13px] bg-black-50 border border-black-200 rounded-xl px-3.5 py-2 outline-none"
                  >
                    <option value="member">Member - Can create and collaborate on all accessible projects</option>
                    <option value="admin">Admin - Can configure workspace settings, billing, and teams</option>
                    <option value="guest">Guest - Can only view and edit explicitly shared projects</option>
                  </select>
                </div>

                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-100 text-[12px] text-teal-800">
                  New users will automatically be added to the <strong>{activeTeam?.name}</strong> team.
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-black-100">
                  <Button type="button" variant="ghost" onClick={() => setIsInviteModalOpen(false)}>Cancel</Button>
                  <Button type="submit">Send Invitation</Button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
