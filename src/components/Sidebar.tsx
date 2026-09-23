import React from 'react';
import {
  LayoutDashboard,
  Activity,
  AlertOctagon,
  Radar,
  MailCheck,
  Link2,
  Bug,
  Crosshair,
  Sparkles,
  GitCommit,
  ShieldCheck,
  FileText,
  Settings
} from 'lucide-react';

export type PageId =
  | 'dashboard'
  | 'events'
  | 'incidents'
  | 'threat-intel'
  | 'phishing'
  | 'url-analyzer'
  | 'vulnerabilities'
  | 'mitre'
  | 'copilot'
  | 'investigation'
  | 'approval-workflow'
  | 'audit-logs'
  | 'settings';

interface Props {
  activePage: PageId;
  onSelectPage: (page: PageId) => void;
  pendingApprovalsCount: number;
}

interface MenuItem {
  id: PageId;
  label: string;
  icon: any;
  badge?: string;
  badgeColor?: string;
  highlight?: boolean;
}

interface MenuSection {
  group: string;
  items: MenuItem[];
}

export const Sidebar: React.FC<Props> = ({ activePage, onSelectPage, pendingApprovalsCount }) => {
  const menuItems: MenuSection[] = [
    {
      group: 'SOC OPERATIONS',
      items: [
        { id: 'dashboard', label: 'SOC Dashboard', icon: LayoutDashboard },
        { id: 'events', label: 'Security Events', icon: Activity },
        { id: 'incidents', label: 'Incidents', icon: AlertOctagon },
        { id: 'investigation', label: 'Investigation Timeline', icon: GitCommit },
        {
          id: 'approval-workflow',
          label: 'Human Approval',
          icon: ShieldCheck,
          badge: pendingApprovalsCount > 0 ? String(pendingApprovalsCount) : undefined,
          badgeColor: 'bg-amber-500 text-slate-950 font-bold'
        }
      ]
    },
    {
      group: 'INTELLIGENCE & ANALYSIS',
      items: [
        { id: 'threat-intel', label: 'Threat Intelligence', icon: Radar },
        { id: 'phishing', label: 'Phishing Analyzer', icon: MailCheck },
        { id: 'url-analyzer', label: 'URL Analyzer', icon: Link2 },
        { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Bug },
        { id: 'mitre', label: 'MITRE ATT&CK', icon: Crosshair }
      ]
    },
    {
      group: 'AUTONOMOUS ASSIST & AUDIT',
      items: [
        {
          id: 'copilot',
          label: 'AI Security Copilot',
          icon: Sparkles,
          highlight: true
        },
        { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
        { id: 'settings', label: 'Settings', icon: Settings }
      ]
    }
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-[#0b0f17] flex flex-col shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {menuItems.map((section, idx) => (
          <div key={idx} className="space-y-1">
            <h4 className="px-3 text-[10px] font-mono font-bold tracking-wider text-slate-500 uppercase">
              {section.group}
            </h4>
            <div className="space-y-0.5 pt-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectPage(item.id as PageId)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isActive
                        ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 font-semibold shadow-sm shadow-cyan-950/50'
                        : item.highlight
                        ? 'text-cyan-400 hover:bg-cyan-950/30 hover:text-cyan-200'
                        : 'text-slate-400 hover:bg-slate-900/80 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : item.highlight ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span className={`px-1.5 py-0.2 text-[10px] rounded-full font-mono ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}

                    {item.highlight && !item.badge && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyan-900/50 text-cyan-300 border border-cyan-700/50">
                        GEMINI
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer disclaimer */}
      <div className="p-3 border-t border-slate-800/80 m-2 rounded-xl bg-slate-900/60 text-[10px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between text-slate-400 font-mono">
          <span>PORTFOLIO SOC</span>
          <span className="text-cyan-400">DEFENSIVE</span>
        </div>
        <p className="leading-tight">
          Safe simulation environment with synthetic cybersecurity data and explainable AI risk scoring.
        </p>
      </div>
    </aside>
  );
};
