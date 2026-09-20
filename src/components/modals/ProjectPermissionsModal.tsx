import React, { useState } from 'react';
import { Project } from '../../types';
import { useStore } from '../../store';
import { useToast } from '../ui/Toast';
import { Users, UserPlus, Shield, Check, X, Trash2 } from 'lucide-react';
import { Avatar } from '../ui/Avatar';
import { Button } from '../ui/Button';

interface ProjectPermissionsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function ProjectPermissionsModal({ project, isOpen, onClose }: ProjectPermissionsModalProps) {
  const { users, currentUser, updateProject } = useStore();
  const { showToast } = useToast();

  const [members, setMembers] = useState<string[]>(
    project.memberIds && project.memberIds.length > 0 
      ? project.memberIds 
      : [project.ownerId || currentUser.id]
  );
  const [selectedUserToAdd, setSelectedUserToAdd] = useState('');

  if (!isOpen) return null;

  const availableUsers = users.filter(u => !members.includes(u.id));

  const handleAddMember = () => {
    if (!selectedUserToAdd) return;
    setMembers(prev => [...prev, selectedUserToAdd]);
    setSelectedUserToAdd('');
  };

  const handleRemoveMember = (userId: string) => {
    if (members.length <= 1) {
      showToast('Project must have at least one member', 'error');
      return;
    }
    setMembers(prev => prev.filter(id => id !== userId));
  };

  const handleSave = () => {
    updateProject(project.id, { memberIds: members });
    showToast(`Permissions updated for ${project.name}`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-black-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-black tracking-tight">
                Project Permissions
              </h3>
              <p className="text-[12px] text-black-400 mt-0.5">
                Manage members and access levels for this project
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-black-400 hover:text-black hover:bg-black-50 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Add member row */}
          <div className="flex items-center gap-2">
            <select
              value={selectedUserToAdd}
              onChange={(e) => setSelectedUserToAdd(e.target.value)}
              className="flex-1 px-3 py-2 border border-black-200 rounded-xl text-[13px] text-black focus:outline-hidden focus:border-mp-blue-500"
            >
              <option value="">Select workspace member to add...</option>
              {availableUsers.map(u => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            <Button
              type="button"
              onClick={handleAddMember}
              disabled={!selectedUserToAdd}
              className="text-[13px] h-9 px-3.5 gap-1.5 shrink-0"
            >
              <UserPlus className="w-4 h-4" /> Add
            </Button>
          </div>

          {/* Members list */}
          <div>
            <h4 className="text-[12px] font-bold text-black-400 uppercase tracking-wider mb-2">
              Current Members ({members.length})
            </h4>
            <div className="border border-black-100 rounded-xl divide-y divide-black-100 overflow-hidden">
              {members.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                const isOwner = userId === (project.ownerId || currentUser.id);

                return (
                  <div key={userId} className="p-3 px-4 flex items-center justify-between hover:bg-black-50/40">
                    <div className="flex items-center gap-3">
                      <Avatar initials={user.initials} src={user.avatarUrl} size="sm" />
                      <div>
                        <p className="text-[13px] font-semibold text-black flex items-center gap-1.5">
                          {user.name}
                          {isOwner && (
                            <span className="text-[10px] bg-mp-blue-50 text-mp-blue-700 border border-mp-blue-200 px-1.5 py-0.2 rounded font-bold">
                              Owner
                            </span>
                          )}
                        </p>
                        <p className="text-[11px] text-black-400 capitalize">{user.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-black-500 font-medium px-2 py-1 bg-black-50 rounded-lg">
                        {isOwner ? 'Full Access' : 'Can Edit'}
                      </span>
                      {!isOwner && (
                        <button
                          type="button"
                          onClick={() => handleRemoveMember(userId)}
                          className="p-1.5 text-black-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                          title="Remove from project"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-black-50/60 border-t border-black-100 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="text-[13px] h-9 px-4"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="text-[13px] h-9 px-5 gap-1.5 shadow-2xs"
          >
            <Check className="w-4 h-4" /> Save Permissions
          </Button>
        </div>
      </div>
    </div>
  );
}
