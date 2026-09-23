import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  UserCheck,
  Clock,
  ArrowRight,
  Filter,
  CheckCircle2
} from 'lucide-react';
import { api } from '../services/api';
import { ResponseAction } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { ReviewActionModal } from '../components/ReviewActionModal';

interface Props {
  onRefreshStats: () => void;
}

export const HumanApprovalPage: React.FC<Props> = ({ onRefreshStats }) => {
  const [actions, setActions] = useState<ResponseAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAction, setSelectedAction] = useState<ResponseAction | null>(null);
  const [notice, setNotice] = useState<string>('');

  const fetchActions = async () => {
    try {
      setLoading(true);
      const res = await api.getResponseActions({
        status: statusFilter !== 'ALL' ? statusFilter : undefined
      });
      setActions(res.data);
      setNotice(res.governanceNotice);
    } catch (e: any) {
      console.error('Error fetching actions:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [statusFilter]);

  const handleReviewed = () => {
    fetchActions();
    onRefreshStats();
  };

  const pendingCount = actions.filter(a => a.status === 'PENDING_REVIEW').length;

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Human Approval Response Workflow
            {pendingCount > 0 ? (
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-300 border border-amber-800/80 animate-pulse">
                {pendingCount} Pending Authorization
              </span>
            ) : (
              <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80">
                All Actions Reviewed
              </span>
            )}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory human-in-the-loop authorization pipeline for defensive mitigations and firewall rule modifications
          </p>
        </div>

        <button
          onClick={fetchActions}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition self-start md:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Defensive Policy Notice */}
      <div className="p-4 bg-cyan-950/20 border border-cyan-800/40 rounded-2xl flex items-start gap-3 text-xs text-cyan-200/90 leading-relaxed">
        <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0 mt-0.5" />
        <div>
          <strong className="text-cyan-300 font-semibold block mb-0.5">
            Defensive Governance Protocol (Zero-Trust SOAR Policy):
          </strong>
          {notice || 'AI engines generate context-rich containment proposals, but automated destructive actions (network isolation, token revocation, firewall blocks) strictly require explicit human validation.'}
        </div>
      </div>

      {/* Visual Workflow Steps */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Step 1</div>
          <div className="font-semibold text-cyan-400">AI Recommendation</div>
          <p className="text-[11px] text-slate-400 font-sans">Contextual threat analysis generates containment proposal</p>
        </div>

        <div className="p-3 bg-amber-950/30 border border-amber-800/60 rounded-xl space-y-1">
          <div className="text-[10px] text-amber-400 uppercase">Step 2</div>
          <div className="font-semibold text-amber-300">Analyst Review</div>
          <p className="text-[11px] text-slate-400 font-sans">Tier 2/3 analyst validates evidence and scope</p>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Step 3</div>
          <div className="font-semibold text-slate-200">Authorize or Reject</div>
          <p className="text-[11px] text-slate-400 font-sans">Formal electronic signature with rationale notes</p>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl space-y-1">
          <div className="text-[10px] text-slate-400 uppercase">Step 4</div>
          <div className="font-semibold text-emerald-400">Forensic Audit Log</div>
          <p className="text-[11px] text-slate-400 font-sans">Immutable record for compliance and accountability</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        <span className="text-slate-400 font-mono">Filter Status:</span>
        {['ALL', 'PENDING_REVIEW', 'APPROVED', 'REJECTED'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1 rounded-lg transition font-mono ${
              statusFilter === st
                ? 'bg-cyan-600 text-white font-semibold'
                : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
            }`}
          >
            {st}
          </button>
        ))}
      </div>

      {/* Actions List */}
      <div className="space-y-3.5">
        {loading ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0f172a] border border-slate-800">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
            Loading response action queue...
          </div>
        ) : actions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 rounded-2xl bg-[#0f172a] border border-slate-800">
            No response actions match the selected filter.
          </div>
        ) : (
          actions.map((act) => (
            <div
              key={act.id}
              className={`p-5 rounded-2xl bg-[#0f172a] border transition-all shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                act.status === 'PENDING_REVIEW'
                  ? 'border-amber-700/60 shadow-amber-950/20'
                  : 'border-slate-800'
              }`}
            >
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 px-2.5 py-0.5 rounded border border-cyan-800/40">
                    {act.id}
                  </span>
                  <span className="font-mono text-xs text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    {act.actionType}
                  </span>
                  <StatusBadge status={act.status} size="sm" />
                  <span className="text-xs font-mono text-cyan-300">
                    Target: {act.incidentId}
                  </span>
                </div>

                <h3 className="text-base font-semibold text-slate-100">{act.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{act.description}</p>

                <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800/80 text-xs text-slate-400 leading-normal">
                  <strong className="text-cyan-300 font-medium">AI Rationale:</strong> {act.rationale}
                </div>

                {act.reviewedBy && (
                  <div className="pt-2 text-xs font-mono text-slate-400 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1.5 text-slate-300">
                      <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
                      Reviewed by: <strong>{act.reviewedBy}</strong>
                    </span>
                    <span>&bull;</span>
                    <span>{new Date(act.reviewedAt || '').toLocaleString()}</span>
                    {act.reviewNotes && (
                      <span className="text-slate-300 italic font-sans">&ldquo;{act.reviewNotes}&rdquo;</span>
                    )}
                  </div>
                )}
              </div>

              {/* Review Button */}
              <div className="shrink-0 flex items-center gap-2">
                {act.status === 'PENDING_REVIEW' ? (
                  <button
                    onClick={() => setSelectedAction(act)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-lg shadow-amber-950/50 transition hover:scale-[1.02]"
                  >
                    <UserCheck className="w-4 h-4" />
                    <span>Review & Authorize</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setSelectedAction(act)}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition"
                  >
                    View Record
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Review Modal */}
      {selectedAction && (
        <ReviewActionModal
          action={selectedAction}
          onClose={() => setSelectedAction(null)}
          onReviewed={handleReviewed}
        />
      )}
    </div>
  );
};
