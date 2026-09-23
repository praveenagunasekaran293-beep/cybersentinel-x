import React, { useState, useEffect } from 'react';
import {
  Crosshair,
  Search,
  Filter,
  RefreshCw,
  Shield,
  Layers,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { api } from '../services/api';
import { MitreTechnique } from '../types';

export const MitreAttackPage: React.FC = () => {
  const [techniques, setTechniques] = useState<MitreTechnique[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tacticFilter, setTacticFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTechniques = async () => {
    try {
      setLoading(true);
      const res = await api.getMitreTechniques({
        search: search.trim() || undefined,
        tactic: tacticFilter !== 'ALL' ? tacticFilter : undefined
      });
      setTechniques(res);
      if (res.length > 0 && !expandedId) {
        setExpandedId(res[0].techniqueId);
      }
    } catch (e: any) {
      console.error('Error fetching MITRE techniques:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTechniques();
  }, [tacticFilter]);

  const tactics = [
    'ALL',
    'Initial Access',
    'Execution',
    'Persistence',
    'Privilege Escalation',
    'Credential Access',
    'Discovery',
    'Lateral Movement',
    'Collection',
    'Command and Control',
    'Exfiltration'
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            MITRE ATT&CK&reg; Matrix Mapping & Defensive Guidance
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Enterprise Matrix
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Correlation of telemetry anomalies against adversary tactics, techniques, and procedures (TTPs)
          </p>
        </div>

        <button
          onClick={fetchTechniques}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Matrix</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={(e) => { e.preventDefault(); fetchTechniques(); }} className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search technique ID (e.g. T1566), name, or evidence..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-xs">Tactic:</span>
          <select
            value={tacticFilter}
            onChange={(e) => setTacticFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            {tactics.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Techniques Accordion List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0f172a] border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            Loading MITRE ATT&CK techniques...
          </div>
        ) : techniques.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0f172a] border border-slate-800">
            No techniques match your search query.
          </div>
        ) : (
          techniques.map((tech) => {
            const isExpanded = expandedId === tech.techniqueId;
            return (
              <div
                key={tech.techniqueId}
                className="rounded-2xl bg-[#0f172a] border border-slate-800 overflow-hidden transition shadow-sm"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : tech.techniqueId)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-900/40 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-950/60 px-2.5 py-1 rounded border border-amber-800/50">
                      {tech.techniqueId}
                    </span>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100">{tech.techniqueName}</h3>
                      <div className="text-[11px] font-mono text-cyan-400">{tech.tactic}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400 hidden sm:inline font-mono">
                      {isExpanded ? 'Collapse Guidance' : 'Expand Guidance'}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-800/80 space-y-4 text-xs animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Reason & Evidence */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block">
                          Mapping Reason & Observed Indicators:
                        </span>
                        <p className="text-slate-200 leading-relaxed font-sans">{tech.reason}</p>
                        <div className="pt-2 border-t border-slate-800 font-mono text-cyan-300 text-[11px]">
                          <strong>Telemetry Evidence:</strong> {tech.evidence}
                        </div>
                      </div>

                      {/* Detection Guidance */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                        <span className="text-cyan-400 uppercase text-[10px] font-mono font-semibold block flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          SOC Detection Engineering Guidance:
                        </span>
                        <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                          {tech.detectionGuidance}
                        </p>
                      </div>
                    </div>

                    {/* Mitigation Guidance */}
                    <div className="p-3.5 rounded-xl bg-cyan-950/20 border border-cyan-800/40 space-y-1.5">
                      <span className="text-emerald-400 uppercase text-[10px] font-mono font-semibold block flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" />
                        Defensive Hardening & Mitigation:
                      </span>
                      <p className="text-slate-200 leading-relaxed font-mono text-[11px]">
                        {tech.mitigationGuidance}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
