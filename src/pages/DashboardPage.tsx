import React, { useState, useEffect } from 'react';
import {
  Activity,
  AlertTriangle,
  Flame,
  ShieldCheck,
  FolderOpen,
  Bug,
  RefreshCw,
  ExternalLink,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskScoreBadge } from '../components/RiskScoreBadge';

interface Props {
  onSelectIncident: (id: string) => void;
  onOpenScenarios: () => void;
  onNavigateToPage: (page: any) => void;
}

export const DashboardPage: React.FC<Props> = ({ onSelectIncident, onOpenScenarios, onNavigateToPage }) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = async () => {
    try {
      setRefreshing(true);
      const res = await api.getDashboardStats();
      setData(res);
    } catch (e: any) {
      console.error('Error fetching dashboard stats:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <RefreshCw className="w-8 h-8 animate-spin text-cyan-400" />
          <span className="text-sm font-mono">Loading CyberSentinel X SOC Dashboard...</span>
        </div>
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Security Events',
      value: data.kpis.totalEvents.toLocaleString(),
      change: '+18% today',
      icon: Activity,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-950/30 border-cyan-800/40'
    },
    {
      label: 'Critical Incidents',
      value: data.kpis.criticalIncidents,
      change: 'Immediate Action',
      icon: Flame,
      color: 'text-red-400',
      bgColor: 'bg-red-950/30 border-red-800/40'
    },
    {
      label: 'High Risk Incidents',
      value: data.kpis.highRiskIncidents,
      change: 'Score >= 75',
      icon: AlertTriangle,
      color: 'text-orange-400',
      bgColor: 'bg-orange-950/30 border-orange-800/40'
    },
    {
      label: 'Suspicious Events',
      value: data.kpis.suspiciousEvents,
      change: 'Correlated IoCs',
      icon: ShieldCheck,
      color: 'text-amber-400',
      bgColor: 'bg-amber-950/30 border-amber-800/40'
    },
    {
      label: 'Open Incidents',
      value: data.kpis.openIncidents,
      change: 'Active in Queue',
      icon: FolderOpen,
      color: 'text-blue-400',
      bgColor: 'bg-blue-950/30 border-blue-800/40'
    },
    {
      label: 'Vulnerabilities',
      value: data.kpis.vulnerabilities,
      change: 'Unresolved CVEs',
      icon: Bug,
      color: 'text-rose-400',
      bgColor: 'bg-rose-950/30 border-rose-800/40'
    }
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            SOC Operations Command Center
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Live Synthetic Telemetry
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time defense monitoring, automated incident correlation, and explainable risk intelligence
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchStats}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenScenarios}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-md shadow-cyan-950 transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Simulation Scenario</span>
          </button>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div
              key={idx}
              className={`p-4 rounded-xl border ${kpi.bgColor} flex flex-col justify-between shadow-sm transition hover:border-slate-600`}
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="text-[11px] font-medium leading-tight">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <div className="mt-2.5">
                <span className="text-2xl font-bold font-mono text-slate-100">{kpi.value}</span>
                <div className="text-[10px] text-slate-400 mt-0.5 font-mono">{kpi.change}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Security Events Over Time */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Security Events Ingestion & Blocks</h3>
              <p className="text-xs text-slate-400">Hourly timeline of ingested vs autonomously mitigated events</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-mono">
              <span className="flex items-center gap-1.5 text-cyan-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-cyan-400 inline-block" /> Total Events
              </span>
              <span className="flex items-center gap-1.5 text-red-400">
                <span className="w-2.5 h-2.5 rounded-sm bg-red-400 inline-block" /> Blocked Traps
              </span>
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts.eventsOverTime}>
                <defs>
                  <linearGradient id="colorEvents" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorBlocked" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="events" stroke="#06b6d4" strokeWidth={2} fillOpacity={1} fill="url(#colorEvents)" />
                <Area type="monotone" dataKey="blocked" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorBlocked)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Severity Distribution Donut */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100">Incident Severity Breakdown</h3>
            <p className="text-xs text-slate-400">Risk categorization across active incident catalog</p>
          </div>
          <div className="h-52 w-full my-auto">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.charts.severityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {data.charts.severityDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-800/80">
            {data.charts.severityDistribution.map((s, idx) => (
              <div key={idx} className="flex items-center justify-between px-2 py-1 rounded bg-slate-900/60 font-mono">
                <span className="flex items-center gap-1.5 text-slate-300">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                  {s.name}
                </span>
                <span className="font-bold text-slate-200">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Charts Row 2: Categories, Threat Activity, MITRE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Incident Categories */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <h3 className="font-semibold text-sm text-slate-100">Incident Classification Categories</h3>
          <p className="text-xs text-slate-400 mb-3">Attack vectors observed across telemetry</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.incidentCategories} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={10} width={100} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#38bdf8" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Threat Activity by Type */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <h3 className="font-semibold text-sm text-slate-100">Threat Indicators by Type</h3>
          <p className="text-xs text-slate-400 mb-3">Monitored synthetic threat feed repository</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.threatActivity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="type" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* MITRE Technique Distribution */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm">
          <h3 className="font-semibold text-sm text-slate-100">MITRE ATT&CK Technique Distribution</h3>
          <p className="text-xs text-slate-400 mb-3">Tactic mapping frequency across detections</p>
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.charts.mitreDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="technique" type="category" stroke="#64748b" fontSize={9} width={90} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                />
                <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-sm text-slate-100">Recent Prioritized Security Incidents</h3>
            <p className="text-xs text-slate-400">Ranked by explainable multi-factor risk score</p>
          </div>
          <button
            onClick={() => onNavigateToPage('incidents')}
            className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 font-medium transition"
          >
            <span>View All Incidents</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Incident ID</th>
                <th className="py-3 px-4">Title / Category</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Risk Score</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Affected Identity</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {data.recentIncidents.map((inc) => (
                <tr
                  key={inc.incidentId}
                  className="hover:bg-slate-900/50 transition cursor-pointer"
                  onClick={() => onSelectIncident(inc.incidentId)}
                >
                  <td className="py-3 px-4 font-mono font-bold text-cyan-400">
                    {inc.incidentId}
                  </td>
                  <td className="py-3 px-4 max-w-xs truncate font-medium text-slate-200">
                    {inc.title}
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={inc.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4">
                    <RiskScoreBadge score={inc.riskScore} showDetailsButton={false} />
                  </td>
                  <td className="py-3 px-4">
                    <StatusBadge status={inc.status} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-xs truncate max-w-xs font-mono">
                    {inc.affectedUser}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectIncident(inc.incidentId);
                      }}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium transition inline-flex items-center gap-1"
                    >
                      <span>Investigate</span>
                      <ExternalLink className="w-3 h-3 text-cyan-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
