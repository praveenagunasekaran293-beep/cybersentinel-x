import React, { useState, useEffect } from 'react';
import { Shield, Sparkles, Clock, CheckCircle2, ChevronRight, User } from 'lucide-react';

interface Props {
  onOpenScenarios: () => void;
  pendingActionsCount: number;
  onNavigateToActions: () => void;
}

export const Navbar: React.FC<Props> = ({ onOpenScenarios, pendingActionsCount, onNavigateToActions }) => {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toUTCString().slice(17, 25) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-16 border-b border-slate-800 bg-[#0f172a]/95 backdrop-blur sticky top-0 z-40 px-6 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-900/30 border border-cyan-400/30">
          <Shield className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-base text-slate-100 font-mono">
              CYBERSENTINEL<span className="text-cyan-400">_X</span>
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold">
              v1.0 DEFENSIVE SOC
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden md:block">
            AI-Powered Autonomous Cyber Defense & SOC Intelligence Platform
          </p>
        </div>
      </div>

      {/* Center Scenario Quick Button */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenScenarios}
          className="flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-950/80 to-blue-950/80 hover:from-cyan-900/90 hover:to-blue-900/90 border border-cyan-700/60 rounded-lg text-xs font-semibold text-cyan-200 transition shadow-sm hover:shadow-cyan-900/20 group"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>Demo Scenario Engine</span>
          <span className="text-[10px] bg-cyan-900/60 text-cyan-300 px-1.5 py-0.5 rounded border border-cyan-700/40">
            6 Scenarios
          </span>
          <ChevronRight className="w-3 h-3 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
        </button>

        {pendingActionsCount > 0 && (
          <button
            onClick={onNavigateToActions}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-950/60 hover:bg-amber-900/70 border border-amber-700/70 rounded-lg text-xs font-semibold text-amber-300 transition animate-pulse"
          >
            <span className="h-2 w-2 rounded-full bg-amber-400" />
            <span>Human Approval: {pendingActionsCount} Pending</span>
          </button>
        )}
      </div>

      {/* Right Telemetry & Clock */}
      <div className="flex items-center gap-4 text-xs font-mono">
        <div className="hidden lg:flex items-center gap-2 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{time}</span>
        </div>

        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-emerald-950/40 border border-emerald-800/60 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span className="font-semibold text-[11px]">DEFENSIVE MODE ACTIVE</span>
        </div>

        <div className="flex items-center gap-2 text-slate-300 border-l border-slate-800 pl-3">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-cyan-300 font-semibold text-xs">
            <User className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-sans text-slate-300 hidden sm:inline">P. Gunasekaran</span>
        </div>
      </div>
    </header>
  );
};
