import React, { useState, useRef, useEffect } from 'react';
import { 
  Search, Plus, HelpCircle, Bell, User, Check, LogOut, 
  ExternalLink, Sparkles, BookOpen, ShieldCheck 
} from 'lucide-react';
import { Avatar } from './ui/Avatar';
import { useStore } from '../store';
import { ViewState } from '../App';
import { cn } from '../lib/utils';

interface TopbarProps {
  onAddTask?: () => void;
  onNavigate?: (state: ViewState) => void;
}

export function Topbar({ onAddTask, onNavigate }: TopbarProps) {
  const { 
    searchQuery, setSearchQuery, currentUser, users, setCurrentUser,
    tasks, archivedNotificationIds, readNotificationIds
  } = useStore();

  const unreadCount = tasks.filter(
    t => !(archivedNotificationIds || []).includes(t.id) && !(readNotificationIds || []).includes(t.id)
  ).length;

  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isNotifPreviewOpen, setIsNotifPreviewOpen] = useState(false);

  const menuRef = useRef<HTMLDivElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close menus on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsUserMenuOpen(false);
      }
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setIsHelpOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifPreviewOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-[64px] bg-white border-b border-black-100 flex items-center justify-between px-6 shrink-0 relative z-30">
      {/* Global Search Bar */}
      <div className="flex-1 max-w-[600px]">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-black-400 group-hover:text-black transition-colors" />
          <input 
            type="text" 
            placeholder="Search tasks, projects, or people..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-[40px] pl-11 pr-4 bg-white border border-black-200 hover:border-black-300 rounded-full text-[14px] focus:outline-none focus:border-mp-blue-500 focus:ring-2 focus:ring-mp-blue-500/20 transition-all shadow-sm"
          />
        </div>
      </div>

      {/* Top right quick actions */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <div 
          onClick={() => {
            if (onNavigate) onNavigate({ type: 'inbox' });
          }}
          className="relative cursor-pointer text-slate-500 hover:text-black transition-colors"
          title="Open Inbox"
        >
          <Bell className="w-[22px] h-[22px]" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-white">
              {unreadCount}
            </span>
          )}
        </div>

        {/* Help */}
        <div className="cursor-pointer text-slate-500 hover:text-black transition-colors">
          <HelpCircle className="w-[22px] h-[22px]" />
        </div>

        {/* User Switcher / Profile Popover */}
        <div className="ml-2 pl-2 border-l border-black-200 relative" ref={menuRef}>
          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-black-50 transition-colors"
          >
            <Avatar 
              initials={currentUser.initials} 
              size="sm" 
              src={currentUser.avatarUrl} 
              className="w-8 h-8 rounded-full border border-black-200" 
            />
          </div>

          {isUserMenuOpen && (
            <div className="absolute right-0 mt-2 w-[270px] bg-white rounded-2xl shadow-xl border border-black-200 p-3 space-y-3 animate-in fade-in zoom-in-95 duration-100 z-50">
              <div className="flex items-center gap-3 p-2 bg-black-50 rounded-xl">
                <Avatar initials={currentUser.initials} src={currentUser.avatarUrl} size="md" />
                <div className="truncate">
                  <div className="text-[14px] font-bold text-black truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-black-400 truncate capitalize">{currentUser.role} • HR.com</div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-[11px] font-bold text-black-400 uppercase tracking-wider px-2 py-1">
                  Switch Active Teammate
                </div>
                {users.map(u => (
                  <button
                    key={u.id}
                    onClick={() => {
                      setCurrentUser(u.id);
                      setIsUserMenuOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] transition-colors",
                      currentUser.id === u.id 
                        ? "bg-mp-blue-50 text-mp-blue-700 font-semibold" 
                        : "hover:bg-black-50 text-black-600"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <Avatar initials={u.initials} src={u.avatarUrl} size="xs" />
                      <span>{u.name}</span>
                    </div>
                    {currentUser.id === u.id && <Check className="w-4 h-4 text-mp-blue-600" />}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-black-100">
                <button 
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    if (onNavigate) onNavigate({ type: 'teams' });
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-[12px] font-medium text-black-600 hover:text-black hover:bg-black-50 rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-4 h-4 text-teal-600" />
                  <span>Workspace Directory & Roles</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
