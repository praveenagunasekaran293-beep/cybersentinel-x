import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ShieldAlert,
  Clock,
  User,
  Server,
  Crosshair,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Send,
  ExternalLink,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentRecord } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RiskScoreBadge } from '../components/RiskScoreBadge';

interface Props {
  incidentId: string;
  onBack: () => void;
  onNavigateToCopilot: (incidentId: string) => void;
  onNavigateToHumanApproval: () => void;
}

export const IncidentDetailPage: React.FC<Props> = ({
  incidentId,
  onBack,
  onNavigateToCopilot,
  onNavigateToHumanApproval
}) => {
  const [incident, setIncident] = useState<IncidentRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const fetchIncident = async () => {
    try {
      setLoading(true);
      const res = await api.getIncident(incidentId);
      setIncident(res);
    } catch (e: any) {
      console.error('Error fetching incident:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncident();
  }, [incidentId]);

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      setStatusUpdating(true);
      await api.updateIncidentStatus(incidentId, newStatus);
      await fetchIncident();
    } catch (e: any) {
      alert(`Error updating status: ${e.message}`);
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading || !incident) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400 font-mono text-sm">Loading incident details...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Back button and Header */}
      <div>
        <button
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-300 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Incidents List</span>
        </button>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800/50">
                {incident.incidentId}
              </span>
              <SeverityBadge severity={incident.severity} />
              <StatusBadge status={incident.status} />
              <RiskScoreBadge score={incident.riskScore} breakdown={incident.riskBreakdown} />
            </div>
            <h1 className="text-xl font-bold text-slate-100 mt-2">{incident.title}</h1>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Status:</span>
              <select
                disabled={statusUpdating}
                value={incident.status}
                onChange={(e) => handleStatusUpdate(e.target.value)}
                className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
              >
                <option value="Open">Open</option>
                <option value="Investigating">Investigating</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
            </div>

            <button
              onClick={() => onNavigateToCopilot(incident.incidentId)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Ask AI Copilot</span>
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Left Column (Details + Timeline) | Right Column (Explainable Risk + AI Actions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Description, Assets, Chronological Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Summary Card */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Incident Triage Summary</h3>
            <p className="text-xs text-slate-300 leading-relaxed">{incident.description}</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800/80 text-xs">
              <div className="flex items-start gap-2.5">
                <User className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Affected Identity:</span>
                  <span className="font-medium text-slate-200">{incident.affectedUser}</span>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Server className="w-4 h-4 text-cyan-400 mt-0.5 shrink-0" />
                <div>
                  <span className="text-slate-400 text-[11px] block">Impacted Infrastructure Assets:</span>
                  <div className="flex flex-wrap gap-1 mt-0.5">
                    {incident.affectedAssets.map((asset, idx) => (
                      <span key={idx} className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-800">
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Chronological Incident Timeline */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Chronological Incident Investigation Timeline
                </h3>
                <p className="text-xs text-slate-400">Sequential reconstruction of correlated security events</p>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {incident.timeline.length} Events Logged
              </span>
            </div>

            <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {incident.timeline.map((item, idx) => (
                <div key={idx} className="relative group">
                  {/* Timeline bullet */}
                  <div className={`absolute -left-6 top-1 h-3.5 w-3.5 rounded-full border-2 border-[#0f172a] ${
                    item.severity === 'Critical' ? 'bg-red-400 ring-4 ring-red-950' :
                    item.severity === 'High' ? 'bg-orange-400 ring-4 ring-orange-950' :
                    item.severity === 'Medium' ? 'bg-amber-400' : 'bg-cyan-400'
                  }`} />

                  <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 transition space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-bold text-cyan-400">{item.time} UTC</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                          {item.source}
                        </span>
                        <SeverityBadge severity={item.severity} size="sm" />
                      </div>
                    </div>
                    <p className="text-xs text-slate-200 leading-normal">{item.event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Indicators of Compromise (IoCs) */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">Associated Synthetic Indicators (IoCs)</h3>
            <div className="flex flex-wrap gap-2">
              {incident.indicators.map((ioc, idx) => (
                <span
                  key={idx}
                  className="font-mono text-xs px-2.5 py-1.5 rounded-lg bg-slate-900 text-cyan-300 border border-slate-700/80 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                  {ioc}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Explainable Risk Scoring, MITRE, AI Recommendations */}
        <div className="space-y-6">
          {/* Explainable Risk Scoring Box */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Explainable Risk Scoring</h3>
                <p className="text-[11px] text-slate-400">Additive multi-factor heuristic model</p>
              </div>
              <span className="font-mono text-xl font-bold text-cyan-400">
                {incident.riskScore} <span className="text-xs text-slate-500 font-normal">/ 100</span>
              </span>
            </div>

            <div className="p-2.5 bg-cyan-950/20 border border-cyan-900/40 rounded-lg text-[11px] text-cyan-300 leading-relaxed">
              <strong>Notice:</strong> This is a transparent application defensive score and not a universal probability.
            </div>

            <div className="space-y-2.5">
              {incident.riskBreakdown.map((factor, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1">
                  <div className="flex items-center justify-between text-xs font-medium text-slate-200">
                    <span className="truncate pr-2">{factor.factor}</span>
                    <span className="font-mono text-cyan-400 font-bold shrink-0">+{factor.weight}</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{factor.rationale}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MITRE ATT&CK Mapping */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Crosshair className="w-4 h-4 text-amber-400" />
              MITRE ATT&CK Techniques
            </h3>
            <div className="space-y-2">
              {incident.mitreTechniques.map((tech, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono font-bold text-amber-400">{tech}</span>
                  <span className="text-[11px] text-slate-400">Mapped via telemetry signature</span>
                </div>
              ))}
            </div>
          </div>

          {/* AI Recommended Response Actions */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                Response Recommendations
              </h3>
            </div>
            <p className="text-[11px] text-slate-400">
              AI recommendations queued for human analyst approval
            </p>

            <div className="space-y-2">
              {incident.recommendations.map((rec, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>{rec}</span>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button
                onClick={onNavigateToHumanApproval}
                className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded-lg text-xs font-semibold transition border border-slate-700 flex items-center justify-center gap-1.5"
              >
                <span>Open Human Approval Workflow</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
