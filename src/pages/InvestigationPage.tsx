import React, { useState, useEffect } from 'react';
import {
  GitCommit,
  Clock,
  ShieldAlert,
  Server,
  User,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentRecord } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskScoreBadge } from '../components/RiskScoreBadge';

interface Props {
  initialIncidentId?: string | null;
  onNavigateToCopilot: (incidentId: string) => void;
  onNavigateToApproval: () => void;
}

export const InvestigationPage: React.FC<Props> = ({
  initialIncidentId,
  onNavigateToCopilot,
  onNavigateToApproval
}) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>('');
  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getIncidents().then((list) => {
      setIncidents(list);
      if (initialIncidentId && list.some(i => i.incidentId === initialIncidentId)) {
        setSelectedIncidentId(initialIncidentId);
      } else if (list.length > 0) {
        setSelectedIncidentId(list[0].incidentId);
      }
      setLoading(false);
    });
  }, [initialIncidentId]);

  useEffect(() => {
    if (selectedIncidentId) {
      api.getIncident(selectedIncidentId).then(setIncident).catch(console.error);
    }
  }, [selectedIncidentId]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Investigation Timeline & Graph Correlation
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Forensic Reconstruction
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Chronological multi-telemetry attack sequence reconstruction with identity and asset correlation
          </p>
        </div>

        {/* Incident Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Investigate:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-semibold focus:outline-none focus:border-cyan-500"
          >
            {incidents.map((inc) => (
              <option key={inc.incidentId} value={inc.incidentId}>
                {inc.incidentId} &bull; {inc.title.slice(0, 36)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading || !incident ? (
        <div className="p-12 text-center text-slate-400">Loading investigation timeline...</div>
      ) : (
        <div className="space-y-6">
          {/* Active Incident Header Card */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/50">
                  {incident.incidentId}
                </span>
                <SeverityBadge severity={incident.severity} />
                <StatusBadge status={incident.status} />
                <RiskScoreBadge score={incident.riskScore} breakdown={incident.riskBreakdown} />
              </div>
              <h2 className="text-base font-bold text-slate-100">{incident.title}</h2>
              <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">{incident.description}</p>
            </div>

            <div className="flex items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigateToCopilot(incident.incidentId)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>AI Copilot Analysis</span>
              </button>

              <button
                onClick={onNavigateToApproval}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                <span>Response Queue</span>
              </button>
            </div>
          </div>

          {/* Sequential Attack Path Diagram */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <GitCommit className="w-4 h-4 text-cyan-400" />
                  Sequential Forensic Timeline Reconstruction
                </h3>
                <p className="text-xs text-slate-400">Step-by-step telemetry event progression</p>
              </div>
              <span className="font-mono text-xs text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                {incident.timeline.length} Progression Steps
              </span>
            </div>

            {/* Stepper / Timeline View */}
            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-gradient-to-b before:from-cyan-500 before:via-amber-500 before:to-red-500">
              {incident.timeline.map((step, idx) => (
                <div key={idx} className="relative group">
                  <div className={`absolute -left-6 top-3 h-4 w-4 rounded-full border-2 border-[#0f172a] flex items-center justify-center text-[9px] font-mono font-bold text-white ${
                    step.severity === 'Critical' ? 'bg-red-500' :
                    step.severity === 'High' ? 'bg-orange-500' :
                    step.severity === 'Medium' ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}>
                    {idx + 1}
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-sm space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">{step.time} UTC</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                          {step.source}
                        </span>
                      </div>
                      <SeverityBadge severity={step.severity} size="sm" />
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {step.event}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Asset & IoC Correlation Graph Card */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyan-400" />
              Correlated Entities & Threat Linkage
            </h3>
            <p className="text-xs text-slate-400">
              Identity, asset hostnames, IP vectors, and MITRE techniques linked to this case
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Identity & Host */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block">Target Identity:</span>
                <div className="flex items-center gap-2 text-slate-200 font-medium">
                  <User className="w-4 h-4 text-cyan-400" />
                  <span>{incident.affectedUser}</span>
                </div>
                <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                  Impacted Assets:
                  <div className="flex flex-wrap gap-1 mt-1 font-mono text-slate-300">
                    {incident.affectedAssets.map((a, i) => (
                      <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px]">
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* IoCs */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block">Observed IoCs:</span>
                <div className="space-y-1 font-mono text-[11px]">
                  {incident.indicators.map((ioc, i) => (
                    <div key={i} className="text-cyan-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 truncate">
                      {ioc}
                    </div>
                  ))}
                </div>
              </div>

              {/* MITRE Mapping */}
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block">Mapped MITRE Techniques:</span>
                <div className="space-y-1.5 font-mono text-[11px]">
                  {incident.mitreTechniques.map((m, i) => (
                    <div key={i} className="text-amber-300 bg-slate-800/80 px-2 py-1 rounded border border-slate-700 flex items-center justify-between">
                      <span>{m}</span>
                      <span className="text-[9px] text-slate-400 uppercase">Tactic</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
