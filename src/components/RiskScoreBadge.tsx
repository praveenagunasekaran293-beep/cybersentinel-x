import React, { useState } from 'react';
import { ShieldAlert, Info, X } from 'lucide-react';

interface Factor {
  factor: string;
  weight: number;
  rationale: string;
}

interface Props {
  score: number;
  breakdown?: Factor[];
  showDetailsButton?: boolean;
}

export const RiskScoreBadge: React.FC<Props> = ({ score, breakdown, showDetailsButton = true }) => {
  const [isOpen, setIsOpen] = useState(false);

  const getScoreColor = (val: number) => {
    if (val >= 85) return 'text-red-400 bg-red-950/40 border-red-800/80';
    if (val >= 70) return 'text-orange-400 bg-orange-950/40 border-orange-800/80';
    if (val >= 40) return 'text-amber-400 bg-amber-950/40 border-amber-800/80';
    return 'text-cyan-400 bg-cyan-950/40 border-cyan-800/80';
  };

  const getRiskLabel = (val: number) => {
    if (val >= 85) return 'CRITICAL';
    if (val >= 70) return 'HIGH RISK';
    if (val >= 40) return 'MODERATE';
    return 'LOW RISK';
  };

  return (
    <>
      <div className="inline-flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded border font-mono text-xs font-bold ${getScoreColor(score)}`}>
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>{score}</span>
          <span className="text-[10px] opacity-70">/100</span>
          <span className="ml-1 text-[10px] font-sans font-semibold tracking-wider uppercase opacity-90">
            {getRiskLabel(score)}
          </span>
        </div>

        {showDetailsButton && breakdown && breakdown.length > 0 && (
          <button
            onClick={() => setIsOpen(true)}
            title="View Explainable Risk Scoring Breakdown"
            className="text-slate-400 hover:text-cyan-300 transition-colors p-1 rounded hover:bg-slate-800"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Explainable Risk Scoring Modal */}
      {isOpen && breakdown && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-cyan-400" />
                <h3 className="font-semibold text-slate-100">Explainable Risk Scoring Breakdown</h3>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-cyan-950/30 border border-cyan-900/50 rounded-lg text-xs text-cyan-300/90 leading-relaxed">
              <strong className="font-semibold text-cyan-200">Governance Notice:</strong> This score represents an internal SOC composite risk assessment derived from observed application heuristics. It is not an absolute probability of real-world compromise.
            </div>

            <div className="space-y-3 my-4">
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Composite Risk Factors:
              </div>

              {breakdown.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-900/80 border border-slate-800 rounded-lg">
                  <div className="flex items-center justify-between font-medium text-sm text-slate-200">
                    <span>{item.factor}</span>
                    <span className="font-mono text-cyan-400 font-bold text-xs bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/40">
                      +{item.weight} pts
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 leading-normal">
                    {item.rationale}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-sm">
              <span className="font-semibold text-slate-300">Total Calculated Risk Score:</span>
              <span className="font-mono font-bold text-lg text-cyan-300">{score} / 100</span>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close Breakdown
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
