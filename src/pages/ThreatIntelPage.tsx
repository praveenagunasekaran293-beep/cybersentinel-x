import React, { useState, useEffect } from 'react';
import { Radar, Search, Filter, Plus, AlertTriangle, ShieldCheck, RefreshCw, X, Globe, Hash, Link2, Server } from 'lucide-react';
import { api } from '../services/api';
import { ThreatIndicator } from '../types';

export const ThreatIntelPage: React.FC = () => {
  const [indicators, setIndicators] = useState<ThreatIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [disclaimer, setDisclaimer] = useState('');
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newIndicator, setNewIndicator] = useState('');
  const [newType, setNewType] = useState<'IP' | 'Domain' | 'URL' | 'File Hash'>('IP');
  const [newStatus, setNewStatus] = useState<'Malicious' | 'Suspicious' | 'Benign'>('Suspicious');
  const [newConfidence, setNewConfidence] = useState(85);
  const [newTags, setNewTags] = useState('C2, CobaltStrike, Synthetic');

  const fetchIntel = async () => {
    try {
      setLoading(true);
      const res = await api.getThreatIntel({
        search: search.trim() || undefined,
        type: typeFilter !== 'ALL' ? typeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setIndicators(res.data);
      setDisclaimer(res.disclaimer);
    } catch (e: any) {
      console.error('Error fetching threat intel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntel();
  }, [typeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchIntel();
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndicator) return;

    try {
      await api.createThreatIndicator({
        indicator: newIndicator,
        type: newType,
        status: newStatus,
        confidence: Number(newConfidence),
        source: 'Analyst Ingestion (Defensive Synthetic)',
        tags: newTags.split(',').map(s => s.trim()).filter(Boolean)
      });
      setShowAddModal(false);
      setNewIndicator('');
      fetchIntel();
    } catch (err: any) {
      alert(`Error creating indicator: ${err.message}`);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'IP': return Server;
      case 'Domain': return Globe;
      case 'URL': return Link2;
      case 'File Hash': return Hash;
      default: return Radar;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Threat Intelligence Feed & Indicators (IoC)
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {indicators.length} Synthetic Indicators
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Monitored adversarial infrastructure attributes, threat actor TTP alignments, and confidence scores
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={fetchIntel}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Register Synthetic IoC</span>
          </button>
        </div>
      </div>

      {/* Mandatory Disclaimer Box */}
      <div className="p-4 bg-amber-950/20 border border-amber-800/40 rounded-2xl flex items-start gap-3 text-xs text-amber-200/90 leading-relaxed">
        <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-semibold block mb-0.5">
            Synthetic Intelligence Disclosure:
          </strong>
          {disclaimer || 'All indicators (IPs, domains, hashes, URLs) are simulated synthetic artifacts for safe educational defense triage. None of these indicators represent real, live malicious infrastructure or targets.'}
        </div>
      </div>

      {/* Filters and Search */}
      <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search IoC by indicator value, source, or tag..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-xs">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Types</option>
              <option value="IP">IP Address</option>
              <option value="Domain">Domain</option>
              <option value="URL">URL</option>
              <option value="File Hash">File Hash</option>
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
              <option value="Malicious">Malicious</option>
              <option value="Suspicious">Suspicious</option>
              <option value="Benign">Benign</option>
            </select>
          </div>
        </div>
      </div>

      {/* Threat Indicators Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Indicator (IoC)</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">First / Last Seen</th>
                <th className="py-3 px-4">Intel Feed Source</th>
                <th className="py-3 px-4">Tags</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading threat intelligence feed...
                  </td>
                </tr>
              ) : indicators.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    No threat indicators match the filter criteria.
                  </td>
                </tr>
              ) : (
                indicators.map((ti) => {
                  const Icon = getTypeIcon(ti.type);
                  return (
                    <tr key={ti.id} className="hover:bg-slate-900/50 transition">
                      <td className="py-3 px-4 font-mono font-bold text-cyan-300">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs">{ti.indicator}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-slate-300">
                        {ti.type}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold font-mono ${
                          ti.status === 'Malicious' ? 'bg-red-950 text-red-400 border border-red-800/50' :
                          ti.status === 'Suspicious' ? 'bg-amber-950 text-amber-300 border border-amber-800/50' :
                          'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                        }`}>
                          {ti.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-200">{ti.confidence}%</span>
                          <div className="w-12 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className="h-full bg-cyan-400"
                              style={{ width: `${ti.confidence}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        <div>{ti.firstSeen.split('T')[0] || ti.firstSeen}</div>
                        <div className="text-[10px] text-slate-500">Last: {ti.lastSeen.split('T')[0] || ti.lastSeen}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-300 text-xs">
                        {ti.source}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1">
                          {ti.tags.map((tag, idx) => (
                            <span key={idx} className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal to Register Synthetic IoC */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreate} className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Radar className="w-5 h-5 text-cyan-400" />
                Register Synthetic Threat Indicator
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Indicator Value (IoC):</label>
                <input
                  type="text"
                  required
                  value={newIndicator}
                  onChange={(e) => setNewIndicator(e.target.value)}
                  placeholder="e.g. 198.51.100.99 or bad-domain-test.org"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Type:</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="IP">IP Address</option>
                    <option value="Domain">Domain</option>
                    <option value="URL">URL</option>
                    <option value="File Hash">File Hash</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status:</label>
                  <select
                    value={newStatus}
                    onChange={(e: any) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Malicious">Malicious</option>
                    <option value="Suspicious">Suspicious</option>
                    <option value="Benign">Benign</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Confidence Score (%):</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newConfidence}
                    onChange={(e) => setNewConfidence(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tags (comma separated):</label>
                  <input
                    type="text"
                    value={newTags}
                    onChange={(e) => setNewTags(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Ingest Indicator
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
