import React, { useState } from 'react';
import { Project } from '../../types';
import { useStore } from '../../store';
import { useToast } from '../ui/Toast';
import { FolderPlus, Check, X, Briefcase, Plus } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

interface AddToPortfolioModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export function AddToPortfolioModal({ project, isOpen, onClose }: AddToPortfolioModalProps) {
  const { portfolios, addProjectToPortfolio, removeProjectFromPortfolio, addPortfolio, currentUser } = useStore();
  const { showToast } = useToast();

  const [newPortfolioName, setNewPortfolioName] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  if (!isOpen) return null;

  const handleTogglePortfolio = (portfolioId: string, isIncluded: boolean) => {
    if (isIncluded) {
      removeProjectFromPortfolio(project.id, portfolioId);
      showToast('Removed from portfolio', 'info');
    } else {
      addProjectToPortfolio(project.id, portfolioId);
      showToast('Added to portfolio', 'success');
    }
  };

  const handleCreatePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolioName.trim()) return;

    addPortfolio({
      name: newPortfolioName.trim(),
      description: `Initiative containing ${project.name}`,
      projectIds: [project.id],
      ownerId: currentUser.id,
      color: 'bg-mp-blue-500'
    });

    showToast(`Created portfolio "${newPortfolioName.trim()}"`, 'success');
    setNewPortfolioName('');
    setIsCreatingNew(false);
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-2xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl shadow-2xl border border-black-100 max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 border-b border-black-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-mp-blue-50 text-mp-blue-600 flex items-center justify-center">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-black tracking-tight">
                Add to Portfolio
              </h3>
              <p className="text-[12px] text-black-400 mt-0.5">
                Group this project under high-level executive portfolios
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
          <div>
            <h4 className="text-[12px] font-bold text-black-500 uppercase tracking-wider mb-2.5">
              Available Portfolios
            </h4>
            
            {portfolios.length === 0 ? (
              <p className="text-[13px] text-black-400 italic py-2">No portfolios created yet.</p>
            ) : (
              <div className="border border-black-100 rounded-xl divide-y divide-black-100 overflow-hidden">
                {portfolios.map((port) => {
                  const isIncluded = port.projectIds.includes(project.id);
                  return (
                    <button
                      key={port.id}
                      type="button"
                      onClick={() => handleTogglePortfolio(port.id, isIncluded)}
                      className="w-full p-3 px-4 flex items-center justify-between hover:bg-black-50/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={cn("w-3 h-3 rounded-full shrink-0", port.color)} />
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-black truncate">{port.name}</p>
                          <p className="text-[11px] text-black-400 truncate">{port.projectIds.length} projects</p>
                        </div>
                      </div>

                      <div className={cn(
                        "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                        isIncluded 
                          ? "bg-mp-blue-600 border-mp-blue-600 text-white" 
                          : "border-black-300 bg-white"
                      )}>
                        {isIncluded && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Create new portfolio inline */}
          {isCreatingNew ? (
            <form onSubmit={handleCreatePortfolio} className="p-3 bg-black-50 rounded-xl border border-black-100 space-y-2.5">
              <input
                type="text"
                required
                autoFocus
                placeholder="New portfolio name..."
                value={newPortfolioName}
                onChange={(e) => setNewPortfolioName(e.target.value)}
                className="w-full px-3 py-1.5 text-[13px] bg-white border border-black-200 rounded-lg text-black focus:outline-hidden focus:border-mp-blue-500"
              />
              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="text-[12px] px-2.5 py-1 text-black-500 hover:text-black font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-[12px] px-3 py-1 bg-mp-blue-600 hover:bg-mp-blue-700 text-white font-semibold rounded-md shadow-2xs"
                >
                  Create & Add
                </button>
              </div>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => setIsCreatingNew(true)}
              className="w-full py-2 border border-dashed border-black-200 hover:border-black-400 rounded-xl text-[12px] font-semibold text-black-600 hover:text-black hover:bg-black-50 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Create New Portfolio
            </button>
          )}
        </div>

        <div className="px-6 py-4 bg-black-50/60 border-t border-black-100 flex items-center justify-end">
          <Button
            type="button"
            onClick={onClose}
            className="text-[13px] h-9 px-5"
          >
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
