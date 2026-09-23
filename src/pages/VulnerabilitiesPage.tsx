import React, { useState, useEffect } from 'react';
import {
  Bug,
  Search,
  Filter,
  RefreshCw,
  ShieldCheck,
  AlertTriangle,
  Server,
  Layers,
  ArrowUpRight,
  HelpCircle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { VulnerabilityRecord } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';
import { StatusBadge } from '../components/StatusBadge';

export const VulnerabilitiesPage: React.FC = () => {
  const [vulns, setVulns] = useState<VulnerabilityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [explanation, setExplanation] = useState('');
  const [selectedVuln, setSelectedVuln] = useState<VulnerabilityRecord | null>(null);
  const [statusUpdating, setStatusUpdating] = useState<string | null>(null);

  const fetchVulns = async () => {
    try {
      setLoading(true);
      const res = await api.getVulnerabilities({
        search: search.trim() || undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        remediationStatus: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setVulns(res.data);
      setExplanation(res.prioritizationExplanation);
    } catch (e: any) {
      console.error('Error fetching vulnerabilities:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVulns();
  }, [severityFilter, statusFilter]);

  const handleStatusChange = async (cveId: string, newStatus: string) => {
    try {
      setStatusUpdating(cveId);
      await api.updateVulnerabilityStatus(cveId, newStatus);
      await fetchVulns();
      if (selectedVuln && selectedVuln.cveId === cveId) {
        setSelectedVuln({ ...selectedVuln, remediationStatus: newStatus as any });
      }
    } catch (e: any) {
      alert(`Error updating remediation status: ${e.message}`);
    } finally {
      setStatusUpdating(null);
    }
  };

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'P0 - Emergency':
        return 'bg-red-950 text-red-300 border-red-800/80 font-bold animate-pulse';
      case 'P1 - High':
        return 'bg-orange-950 text-orange-300 border-orange-800/80 font-semibold';
      case 'P2 - Medium':
        return 'bg-amber-950 text-amber-300 border-amber-800/80';
      default:
        return 'bg-blue-950 text-blue-300 border-blue-800/80';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Vulnerability Prioritization & Exposure Intelligence
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {vulns.length} Monitored CVEs
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Contextual risk scoring weighting CVSS metrics against network exposure and asset tier criticality
          </p>
        </div>

        <button
          onClick={fetchVulns}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Prioritization Formula Explanation Banner */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl space-y-2 text-xs">
        <div className="flex items-center gap-2 text-cyan-400 font-semibold">
          <HelpCircle className="w-4 h-4" />
          <span>How CyberSentinel X Prioritizes Vulnerabilities:</span>
        </div>
        <p className="text-slate-300 leading-relaxed">
          {explanation}
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1 text-[11px] font-mono">
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-cyan-400 font-bold">1. CVSS Base (40%):</span> Intrinsic technical exploitability
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-amber-400 font-bold">2. Exposure (30%):</span> Public Edge vs Air-gapped Host
          </div>
          <div className="p-2 rounded bg-slate-950 border border-slate-800 text-slate-300">
            <span className="text-red-400 font-bold">3. Criticality (30%):</span> Tier 1 Core vs Standard Endpoint
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={(e) => { e.preventDefault(); fetchVulns(); }} className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by CVE ID, asset name, or keywords..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
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
            <span className="text-slate-400 text-xs">Remediation Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Statuses</option>
              <option value="Unpatched">Unpatched</option>
              <option value="In Progress">In Progress</option>
              <option value="Patch Available">Patch Available</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Vulnerabilities Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">CVE Identifier</th>
                <th className="py-3 px-4">Asset / Hostname</th>
                <th className="py-3 px-4">CVSS Base</th>
                <th className="py-3 px-4">Exposure Vector</th>
                <th className="py-3 px-4">Asset Criticality</th>
                <th className="py-3 px-4">Composite Priority</th>
                <th className="py-3 px-4">Remediation Status</th>
                <th className="py-3 px-4 text-right">Guidance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading vulnerability database...
                  </td>
                </tr>
              ) : vulns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No vulnerabilities found matching current filters.
                  </td>
                </tr>
              ) : (
                vulns.map((v) => (
                  <tr
                    key={v.cveId}
                    onClick={() => setSelectedVuln(v)}
                    className="hover:bg-slate-900/50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                      {v.cveId}
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200">
                      {v.asset}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      <span className={`px-2 py-0.5 rounded font-bold ${
                        v.cvss >= 9 ? 'text-red-400 bg-red-950/80' :
                        v.cvss >= 7 ? 'text-orange-400 bg-orange-950/80' : 'text-amber-400 bg-amber-950/80'
                      }`}>
                        {v.cvss}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                      <span className={`px-2 py-0.5 rounded text-[10px] border ${
                        v.exposure === 'Public Edge'
                          ? 'bg-rose-950/60 text-rose-300 border-rose-800/60 font-semibold'
                          : 'bg-slate-800 text-slate-300 border-slate-700'
                      }`}>
                        {v.exposure}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400 text-xs font-mono">
                      {v.assetImportance}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(v.priority)}`}>
                        {v.priority}
                      </span>
                    </td>
                    <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        disabled={statusUpdating === v.cveId}
                        value={v.remediationStatus}
                        onChange={(e) => handleStatusChange(v.cveId, e.target.value)}
                        className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-medium"
                      >
                        <option value="Unpatched">Unpatched</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Patch Available">Patch Available</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Mitigated">Mitigated</option>
                      </select>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedVuln(v);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Vulnerability Detail Modal */}
      {selectedVuln && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Bug className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100 font-mono">
                  {selectedVuln.cveId} Vulnerability Intelligence
                </h3>
              </div>
              <button
                onClick={() => setSelectedVuln(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">CVSS Score:</span>
                  <span className="font-mono font-bold text-red-400 text-sm">{selectedVuln.cvss} / 10.0</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Calculated Priority:</span>
                  <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono border ${getPriorityBadge(selectedVuln.priority)}`}>
                    {selectedVuln.priority}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Target Host:</span>
                  <span className="text-slate-200 font-medium">{selectedVuln.asset}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Exposure Vector:</span>
                  <span className="text-slate-200">{selectedVuln.exposure}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-1">
                  Vulnerability Description:
                </span>
                <p className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 leading-relaxed">
                  {selectedVuln.description}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-1">
                  SOC Remediation & Patching Guidance:
                </span>
                <div className="p-3 bg-cyan-950/20 border border-cyan-900/40 rounded-lg text-cyan-200/90 leading-relaxed font-mono">
                  {selectedVuln.patchGuidance}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedVuln(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
