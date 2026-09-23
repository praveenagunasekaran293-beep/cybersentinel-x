import React, { useState, useEffect } from 'react';
import { FileText, Search, Filter, RefreshCw, Shield, Clock, CheckCircle2, ChevronDown, ChevronRight, X } from 'lucide-react';
import { api } from '../services/api';
import { AuditLogEntry } from '../types';

export const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditLogs({
        search: search.trim() || undefined,
        actionType: actionTypeFilter !== 'ALL' ? actionTypeFilter : undefined
      });
      setLogs(res);
    } catch (e: any) {
      console.error('Error fetching audit logs:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [actionTypeFilter]);

  const getActionBadge = (type: string) => {
    switch (type) {
      case 'HUMAN_APPROVAL':
        return 'bg-emerald-950 text-emerald-300 border-emerald-800/80 font-bold';
      case 'HUMAN_REJECTION':
        return 'bg-rose-950 text-rose-300 border-rose-800/80 font-bold';
      case 'STATUS_CHANGE':
        return 'bg-blue-950 text-blue-300 border-blue-800/80';
      case 'SCENARIO_TRIGGER':
        return 'bg-purple-950 text-purple-300 border-purple-800/80';
      case 'AI_COPILOT_QUERY':
        return 'bg-cyan-950 text-cyan-300 border-cyan-800/80';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            SOC Forensic Audit Logs & Chain of Custody
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              {logs.length} Immutable Entries
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete traceability for analyst reviews, human approvals, status mutations, and copilot interactions
          </p>
        </div>

        <button
          onClick={fetchLogs}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Logs</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={(e) => { e.preventDefault(); fetchLogs(); }} className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by action, analyst notes, or keywords..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-slate-400 text-xs">Action Type:</span>
          <select
            value={actionTypeFilter}
            onChange={(e) => setActionTypeFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="ALL">All Action Types</option>
            <option value="HUMAN_APPROVAL">Human Approval</option>
            <option value="HUMAN_REJECTION">Human Rejection</option>
            <option value="STATUS_CHANGE">Status Change</option>
            <option value="SCENARIO_TRIGGER">Scenario Trigger</option>
            <option value="AI_COPILOT_QUERY">AI Copilot Query</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-900/80 text-slate-400 uppercase text-[10px] font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Log ID / Timestamp</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">User / Analyst Action</th>
                <th className="py-3 px-4">Target Incident</th>
                <th className="py-3 px-4">Decision / Verification Notes</th>
                <th className="py-3 px-4 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 font-mono">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading audit trail...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No audit records found matching your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="hover:bg-slate-900/50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-slate-200">{log.id}</div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono border ${getActionBadge(log.actionType)}`}>
                        {log.actionType}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-200 max-w-xs truncate">
                      {log.userAction}
                    </td>
                    <td className="py-3 px-4 font-mono text-cyan-400">
                      {log.incidentId || '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-sm truncate text-xs">
                      {log.analystDecision || 'Automatic System State Capture'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[11px] font-medium transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Log Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100 font-mono">
                  {selectedLog.id} Audit Payload
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl font-mono">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Action Type:</span>
                  <span className="text-cyan-300 font-bold">{selectedLog.actionType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase">Timestamp:</span>
                  <span className="text-slate-300 text-[11px]">{selectedLog.timestamp}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px] uppercase">Target Incident:</span>
                  <span className="text-slate-200">{selectedLog.incidentId || 'System Global'}</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-1">
                  User / Analyst Action:
                </span>
                <p className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
                  {selectedLog.userAction}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-1">
                  Analyst Decision & Notes:
                </span>
                <p className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
                  {selectedLog.analystDecision || 'No specific analyst notes provided.'}
                </p>
              </div>

              <div>
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-1">
                  Raw JSON Audit Metadata:
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-400/90 overflow-x-auto max-h-36">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close Audit Entry
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
