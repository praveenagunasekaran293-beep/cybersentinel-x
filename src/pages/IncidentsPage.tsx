import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ExternalLink, ShieldAlert, Sparkles, User, Server } from 'lucide-react';
import { api } from '../services/api';
import { IncidentRecord } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskScoreBadge } from '../components/RiskScoreBadge';

interface Props {
  onSelectIncident: (id: string) => void;
  onOpenScenarios: () => void;
}

export const IncidentsPage: React.FC<Props> = ({ onSelectIncident, onOpenScenarios }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const res = await api.getIncidents({
        search: search.trim() || undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setIncidents(res);
    } catch (e: any) {
      console.error('Error fetching incidents:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, [severityFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIncidents();
  };

  const handleStatusChange = async (incidentId: string, newStatus: string) => {
    try {
      setStatusUpdating(incidentId);
      await api.updateIncidentStatus(incidentId, newStatus);
      await fetchIncidents();
    } catch (e: any) {
      alert(`Error updating status: ${e.message}`);
    } finally {
      setStatusUpdating(null);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Incident Management & Triage
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {incidents.length} Active Incidents
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Correlated multi-source defensive security incidents with explainable risk scoring
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchIncidents}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={onOpenScenarios}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Generate Scenario Incident</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search incidents by title, user, ID, or keywords..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-xs">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Open">Open</option>
              <option value="Investigating">Investigating</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Incidents Card Grid / List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0f172a] border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            Loading incidents...
          </div>
        ) : incidents.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0f172a] border border-slate-800">
            No security incidents match the selected filter.
          </div>
        ) : (
          incidents.map((inc) => (
            <div
              key={inc.incidentId}
              onClick={() => onSelectIncident(inc.incidentId)}
              className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 hover:border-slate-700 transition shadow-sm hover:shadow-md cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group"
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {inc.incidentId}
                  </span>
                  <SeverityBadge severity={inc.severity} size="sm" />
                  <StatusBadge status={inc.status} size="sm" />
                  <RiskScoreBadge score={inc.riskScore} breakdown={inc.riskBreakdown} />
                </div>

                <div>
                  <h3 className="text-base font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors">
                    {inc.title}
                  </h3>
                  <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                    {inc.description}
                  </p>
                </div>

                {/* Metadata tags */}
                <div className="flex items-center gap-4 text-xs text-slate-400 pt-1 flex-wrap font-mono">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-500" />
                    <span>User: <strong className="text-slate-300">{inc.affectedUser}</strong></span>
                  </div>

                  {inc.affectedAssets && inc.affectedAssets.length > 0 && (
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-slate-500" />
                      <span>Asset: <strong className="text-slate-300">{inc.affectedAssets[0]}</strong></span>
                    </div>
                  )}

                  {inc.mitreTechniques && inc.mitreTechniques.length > 0 && (
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">MITRE:</span>
                      {inc.mitreTechniques.slice(0, 3).map((t, idx) => (
                        <span key={idx} className="px-1.5 py-0.2 rounded bg-slate-800 text-amber-300 text-[10px] border border-slate-700">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action Dropdown & Open Button */}
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center md:flex-col items-end gap-2.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-800"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Status:</span>
                  <select
                    disabled={statusUpdating === inc.incidentId}
                    value={inc.status}
                    onChange={(e) => handleStatusChange(inc.incidentId, e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Open">Open</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Resolved">Resolved</option>
                    <option value="Closed">Closed</option>
                  </select>
                </div>

                <button
                  onClick={() => onSelectIncident(inc.incidentId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                >
                  <span>Open Investigation</span>
                  <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
