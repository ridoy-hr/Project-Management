import React, { useState, useRef, useEffect } from 'react';
import { Plus, ChevronDown, CheckCircle2, Award, Diamond, ListMinus } from 'lucide-react';
import { Button } from './ui/Button';
import { cn } from '../lib/utils';
import { useStore } from '../store';

interface AddTaskDropdownProps {
  onAddStandardTask: () => void;
  onAddApproval: () => void;
  onAddMilestone: () => void;
  onAddSection: () => void;
}

export function AddTaskDropdown({ 
  onAddStandardTask, 
  onAddApproval, 
  onAddMilestone, 
  onAddSection 
}: AddTaskDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="flex items-center">
        <Button 
          onClick={onAddStandardTask} 
          size="sm" 
          className="h-8.5 px-3.5 gap-1.5 shadow-2xs rounded-r-none border-r border-mp-blue-600 hover:z-10"
        >
          <Plus className="w-4 h-4" /> Add task
        </Button>
        <Button 
          onClick={() => setIsOpen(!isOpen)} 
          size="sm" 
          className="h-8.5 px-2 rounded-l-none shadow-2xs"
        >
          <ChevronDown className="w-4 h-4" />
        </Button>
      </div>

      {isOpen && (
        <div className="absolute top-full right-0 mt-1 w-56 bg-white border border-black-100 rounded-lg shadow-xl py-1 z-[100]">
          <button
            onClick={() => {
              onAddStandardTask();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[13px] text-black-600 hover:bg-black-50 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-black-400 group-hover:text-black-600" />
              Task
            </div>
            <span className="text-[11px] text-black-400 bg-black-50 px-1.5 py-0.5 rounded border border-black-100">Default</span>
          </button>
          
          <button
            onClick={() => {
              onAddApproval();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[13px] text-black-600 hover:bg-black-50 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-black-400 group-hover:text-black-600" />
              Approval
            </div>
          </button>
          
          <button
            onClick={() => {
              onAddMilestone();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[13px] text-black-600 hover:bg-black-50 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2">
              <Diamond className="w-4 h-4 text-black-400 group-hover:text-black-600" />
              Milestone
            </div>
          </button>
          
          <div className="h-px bg-black-100 my-1"></div>

          <button
            onClick={() => {
              onAddSection();
              setIsOpen(false);
            }}
            className="w-full text-left px-3 py-2 text-[13px] text-black-600 hover:bg-black-50 flex items-center justify-between group transition-colors"
          >
            <div className="flex items-center gap-2">
              <ListMinus className="w-4 h-4 text-black-400 group-hover:text-black-600" />
              Section
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
