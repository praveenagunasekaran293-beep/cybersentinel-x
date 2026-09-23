import React from 'react';
import { Severity } from '../types';

interface Props {
  severity: Severity | string;
  size?: 'sm' | 'md';
}

export const SeverityBadge: React.FC<Props> = ({ severity, size = 'md' }) => {
  const sev = severity.charAt(0).toUpperCase() + severity.slice(1).toLowerCase();

  const getStyles = () => {
    switch (sev) {
      case 'Critical':
        return 'bg-red-950/80 text-red-400 border-red-800/60 font-semibold';
      case 'High':
        return 'bg-orange-950/80 text-orange-400 border-orange-800/60 font-medium';
      case 'Medium':
        return 'bg-amber-950/70 text-amber-300 border-amber-800/50 font-medium';
      case 'Low':
        return 'bg-blue-950/70 text-blue-300 border-blue-800/50';
      case 'Info':
      default:
        return 'bg-slate-800/80 text-slate-300 border-slate-700/60';
    }
  };

  const sizeClass = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  return (
    <span className={`inline-flex items-center gap-1.5 rounded border ${sizeClass} ${getStyles()}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${
        sev === 'Critical' ? 'bg-red-400 animate-pulse' :
        sev === 'High' ? 'bg-orange-400' :
        sev === 'Medium' ? 'bg-amber-400' :
        sev === 'Low' ? 'bg-blue-400' : 'bg-slate-400'
      }`} />
      {sev}
    </span>
  );
};
