import React, { useState } from 'react';
import {
  Settings,
  Database,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Cpu,
  Layers,
  Lock,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';

interface Props {
  onOpenScenarios: () => void;
  onResetComplete: () => void;
}

export const SettingsPage: React.FC<Props> = ({ onOpenScenarios, onResetComplete }) => {
  const [resetting, setResetting] = useState(false);
  const [resetNotice, setResetNotice] = useState<string | null>(null);

  const handleReset = async () => {
    if (!confirm('Are you sure you want to reset all telemetry, incidents, and threat intel to clean baseline state?')) {
      return;
    }

    try {
      setResetting(true);
      const msg = await api.resetScenarios();
      setResetNotice(msg);
      onResetComplete();
      setTimeout(() => setResetNotice(null), 4000);
    } catch (e: any) {
      alert(`Error resetting database: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="pb-2 border-b border-slate-800">
        <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
          Platform Architecture & Governance Settings
          <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
            Enterprise Tier
          </span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          CyberSentinel X operational parameters, database controls, and portfolio documentation
        </p>
      </div>

      {resetNotice && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-800/80 rounded-2xl flex items-center gap-3 text-emerald-300 text-xs animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{resetNotice}</span>
        </div>
      )}

      {/* Grid of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Synthetic Simulation Engine Controls */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Scenario Simulation Engine</h3>
              <p className="text-xs text-slate-400">Inject or reset synthetic security scenarios</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Run realistic defensive SOC simulations across Phishing-led Account Takeover, Lateral Movement, Critical Perimeter Vulnerabilities, and Cloud IAM drift.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              onClick={onOpenScenarios}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Open Scenario Selector</span>
            </button>

            <button
              disabled={resetting}
              onClick={handleReset}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition flex items-center gap-1.5 disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin' : ''}`} />
              <span>Reset to Clean Baseline</span>
            </button>
          </div>
        </div>

        {/* Database & Persistence Engine */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Relational Database Engine</h3>
              <p className="text-xs text-slate-400">SQLite (sql.js) in-memory & file-backed store</p>
            </div>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Storage Backend:</span>
              <span className="text-slate-200">SQLite WebAssembly (sql.js)</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Persistent Disk Backup:</span>
              <span className="text-emerald-400">cyber_sentinel.sqlite</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded bg-slate-900 border border-slate-800">
              <span className="text-slate-400">Schema Isolation:</span>
              <span className="text-cyan-300">Defensive Zero-Trust</span>
            </div>
          </div>
        </div>

        {/* Server-Side Gemini AI Integration */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">AI Intelligence Core</h3>
              <p className="text-xs text-slate-400">@google/genai TypeScript SDK</p>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            All AI capabilities are securely routed through Node.js Express server-side handlers (`/server/gemini.ts` and `/api/copilot`). The client bundle contains zero API keys or credentials.
          </p>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-xs font-mono space-y-1">
            <div className="text-slate-400">Model Alias: <strong className="text-cyan-300">gemini-3.8-flash</strong></div>
            <div className="text-slate-400">Grounding Policy: <strong className="text-emerald-400">Application Evidence Strictly Bound</strong></div>
          </div>
        </div>

        {/* Portfolio & Academic Context */}
        <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">Portfolio Project Specifications</h3>
              <p className="text-xs text-slate-400">Final-Year Undergraduate Cybersecurity Project</p>
            </div>
          </div>

          <div className="text-xs text-slate-300 space-y-2 leading-relaxed font-sans">
            <div>
              <strong>Project:</strong> CyberSentinel X &bull; AI-Powered Autonomous Cyber Defense & SOC Platform
            </div>
            <div>
              <strong>Lead Student / Researcher:</strong> P. Gunasekaran
            </div>
            <div>
              <strong>Safety Boundary:</strong> Safe defensive simulations exclusively. No real-world exploitation, malware execution, or attack automation.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
