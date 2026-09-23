import React, { useState, useEffect } from 'react';
import { Play, RotateCcw, X, Sparkles, CheckCircle2, AlertTriangle, Layers } from 'lucide-react';
import { api } from '../services/api';
import { ScenarioDefinition } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onScenarioApplied: (incidentId?: string) => void;
}

export const ScenarioModal: React.FC<Props> = ({ isOpen, onClose, onScenarioApplied }) => {
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getScenarios().then(setScenarios).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTrigger = async (scId: string) => {
    try {
      setLoading(true);
      setActiveScenarioId(scId);
      const res = await api.triggerScenario(scId);
      setNotification(`Scenario "${res.scenario.name}" injected successfully into SOC telemetry pipelines!`);
      setTimeout(() => {
        setNotification(null);
        onScenarioApplied(res.incident?.incidentId);
        onClose();
      }, 1200);
    } catch (e: any) {
      alert(`Error triggering scenario: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('Reset SOC telemetry and incidents back to baseline state?')) return;
    try {
      setLoading(true);
      const msg = await api.resetScenarios();
      setNotification(msg);
      setTimeout(() => {
        setNotification(null);
        onScenarioApplied();
        onClose();
      }, 1000);
    } catch (e: any) {
      alert(`Error resetting: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-700/80 rounded-2xl max-w-2xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-100">Synthetic Demo Scenario Engine</h3>
              <p className="text-xs text-slate-400">Inject safe defensive simulations into the live SOC environment</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {notification && (
          <div className="my-3 p-3 bg-emerald-950/60 border border-emerald-800/80 rounded-lg flex items-center gap-2 text-emerald-300 text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification}</span>
          </div>
        )}

        <div className="my-3 p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <p>
            <strong className="text-slate-100">Safe Defensive Simulation Notice:</strong> Scenarios generate synthetic telemetry, MITRE ATT&CK mappings, and risk scores. No real malicious actions or live target probes are executed.
          </p>
        </div>

        <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 my-4">
          {scenarios.map((sc) => (
            <div
              key={sc.id}
              className={`p-3.5 rounded-xl border transition-all flex items-center justify-between ${
                activeScenarioId === sc.id
                  ? 'bg-cyan-950/30 border-cyan-500/50'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div className="space-y-1 pr-4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-slate-100">{sc.name}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                    {sc.category}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{sc.description}</p>
              </div>

              <button
                disabled={loading}
                onClick={() => handleTrigger(sc.id)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium transition disabled:opacity-50"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Simulate</span>
              </button>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <button
            disabled={loading}
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition disabled:opacity-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Baseline Telemetry</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
