import React from 'react';

interface Props {
  status: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<Props> = ({ status, size = 'md' }) => {
  const getStyles = () => {
    switch (status.toUpperCase()) {
      case 'OPEN':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'INVESTIGATING':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'CLOSED':
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
      case 'PENDING_REVIEW':
        return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 animate-pulse';
      case 'APPROVED':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40';
      case 'REJECTED':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/40';
      case 'UNPATCHED':
        return 'bg-red-500/15 text-red-300 border-red-500/30';
      case 'PATCH AVAILABLE':
        return 'bg-blue-500/15 text-blue-300 border-blue-500/30';
      case 'IN PROGRESS':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center rounded-md border font-medium ${sizeClass} ${getStyles()}`}>
      {status}
    </span>
  );
};
