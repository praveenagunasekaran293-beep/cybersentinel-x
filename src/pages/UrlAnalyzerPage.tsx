import React, { useState } from 'react';
import {
  Link2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  Server,
  Lock,
  FileCode,
  Layers,
  ChevronRight
} from 'lucide-react';
import { api } from '../services/api';
import { UrlAnalysisResult } from '../types';

const SAMPLE_URLS = [
  {
    name: 'Suspicious IP with Auth Path',
    url: 'http://198.51.100.44/m365/login.php?dest=portal@auth'
  },
  {
    name: 'Nested Subdomains + Executable Extension',
    url: 'https://login.account-verification-service.secure-portal-update.com/reset/auth.exe'
  },
  {
    name: 'Benign Corporate Domain',
    url: 'https://portal.enterprise.local/dashboard/overview'
  }
];

export const UrlAnalyzerPage: React.FC = () => {
  const [url, setUrl] = useState(SAMPLE_URLS[0].url);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<UrlAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    try {
      setLoading(true);
      const res = await api.analyzeUrl(url);
      setResult(res);
    } catch (e: any) {
      alert(`Error analyzing URL: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'High Risk':
        return 'bg-red-950/80 text-red-400 border-red-800/80 font-bold';
      case 'Medium Risk':
        return 'bg-amber-950/80 text-amber-300 border-amber-800/80 font-semibold';
      case 'Low Risk':
      default:
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-800/80 font-semibold';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            URL Structure & Lexical Obfuscation Analyzer
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Offline Structural Triage
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Safe inspection of URL components, protocol encryption, IP hostnames, entropy, and syntactic traps
          </p>
        </div>
      </div>

      {/* Mandatory Safety Notice */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
        <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-slate-100">Zero-Network Policy:</strong> This module performs syntactic and lexical structure analysis only. No outbound HTTP/DNS requests, socket connections, or web page scrapes are initiated.
        </span>
      </div>

      {/* Pre-loaded Sample Picker */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-mono">Test Samples:</span>
        {SAMPLE_URLS.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => {
              setUrl(sample.url);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-300 transition font-medium"
          >
            {sample.name}
          </button>
        ))}
      </div>

      {/* URL Input Form */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
        <label className="text-xs font-semibold text-slate-200 block">
          Enter URL String for Structural Inspection:
        </label>
        <div className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Link2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. http://198.51.100.44/login?redirect=portal"
              className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-mono text-slate-200 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <button
            disabled={loading || !url.trim()}
            onClick={handleAnalyze}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950 transition disabled:opacity-50 shrink-0"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Evaluating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Analyze Structure</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Top Result Banner */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                Structural Risk Verdict
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-lg border font-mono text-sm uppercase ${getVerdictBadge(result.verdict)}`}>
                  {result.verdict}
                </span>
                <span className="font-mono text-slate-300 font-bold text-sm">
                  Calculated Risk Score: <span className="text-cyan-400">{result.riskScore}</span> / 100
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">HOSTNAME</span>
                <span className="text-cyan-300 font-bold">{result.parsedHostname}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">PROTOCOL</span>
                <span className={result.protocol === 'https:' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
                  {result.protocol.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          {/* 6 Structural Check Cards */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-slate-100">Evaluated Structural Checkpoints</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {result.checks.map((item, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-xl border flex flex-col justify-between space-y-2 ${
                    item.status === 'CRITICAL'
                      ? 'bg-red-950/20 border-red-800/60'
                      : item.status === 'WARNING'
                      ? 'bg-amber-950/20 border-amber-800/60'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="font-semibold text-slate-200">{item.check}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        item.status === 'CRITICAL'
                          ? 'bg-red-950 text-red-400 border border-red-800'
                          : item.status === 'WARNING'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                      }`}
                    >
                      {item.status} (+{item.scoreDelta} pts)
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-sans">{item.details}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Gemini AI Architectural Verdict */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Threat Intelligence Correlation & Defense Policy Recommendation
            </h3>
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-2 whitespace-pre-wrap">
              {result.aiEvaluation}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
