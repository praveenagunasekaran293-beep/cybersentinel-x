import React, { useState } from 'react';
import { ShieldCheck, Check, X, AlertTriangle, UserCheck } from 'lucide-react';
import { ResponseAction } from '../types';
import { api } from '../services/api';

interface Props {
  action: ResponseAction | null;
  onClose: () => void;
  onReviewed: () => void;
}

export const ReviewActionModal: React.FC<Props> = ({ action, onClose, onReviewed }) => {
  const [analystName, setAnalystName] = useState('P. Gunasekaran (Senior SOC Lead)');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!action) return null;

  const handleSubmit = async (decision: 'APPROVED' | 'REJECTED') => {
    try {
      setSubmitting(true);
      await api.reviewResponseAction(action.id, decision, notes, analystName);
      onReviewed();
      onClose();
    } catch (e: any) {
      alert(`Error reviewing response action: ${e.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100">Human Approval Response Review</h3>
              <p className="text-xs text-slate-400">Analyst authorization required prior to action execution</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Workflow Diagram */}
        <div className="my-4 py-2.5 px-3 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between text-[11px] text-slate-400 font-mono">
          <span className="text-cyan-400 font-semibold">1. AI Recommendation</span>
          <span>&rarr;</span>
          <span className="text-amber-400 font-bold bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60">
            2. Analyst Review (Current)
          </span>
          <span>&rarr;</span>
          <span>3. Approve/Reject</span>
          <span>&rarr;</span>
          <span>4. Audit Log</span>
        </div>

        <div className="space-y-4 my-4">
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-slate-400">{action.id} &bull; {action.actionType}</span>
              <span className="text-xs font-mono text-cyan-300">Target: {action.incidentId}</span>
            </div>
            <h4 className="text-sm font-semibold text-slate-100">{action.title}</h4>
            <p className="text-xs text-slate-300 leading-relaxed">{action.description}</p>
            
            <div className="pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <strong className="text-slate-300 font-medium">AI Rationale:</strong> {action.rationale}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Authorizing SOC Analyst:
            </label>
            <div className="flex items-center gap-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200">
              <UserCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <input
                type="text"
                value={analystName}
                onChange={(e) => setAnalystName(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-slate-200"
                placeholder="Analyst Name / Title"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Analyst Review Verification Notes:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Verified threat intelligence corroboration and confirmed host is non-production before authorizing isolation."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-cyan-500 placeholder-slate-500 resize-none"
            />
          </div>

          <div className="p-2.5 bg-amber-950/20 border border-amber-900/30 rounded-lg flex items-center gap-2 text-[11px] text-amber-300/80">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
            <span>Under defensive zero-trust policy, this decision is irreversibly recorded in the SOC Audit Log.</span>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('REJECTED')}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-950/60 hover:bg-rose-900/80 border border-rose-800/80 text-rose-300 rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reject Recommendation</span>
          </button>

          <button
            type="button"
            disabled={submitting}
            onClick={() => handleSubmit('APPROVED')}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Approve & Authorize</span>
          </button>
        </div>
      </div>
    </div>
  );
};
