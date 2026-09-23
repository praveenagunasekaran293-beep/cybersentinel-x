import React, { useState } from 'react';
import {
  MailCheck,
  ShieldAlert,
  Search,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  Link2,
  User,
  HelpCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import { api } from '../services/api';
import { PhishingAnalysisResult } from '../types';

const SAMPLE_EMAILS = [
  {
    name: 'Phishing: Urgent Direct Deposit Verification',
    content: `From: "Corporate Payroll Department" <payroll-notice@secure-verify-employee.org>
Subject: URGENT: Direct Deposit Information Suspended - Action Required within 24 Hours
Date: Tue, 22 Sep 2026 09:15:00 UTC

Dear Valued Employee,

Our automated financial compliance system detected an unauthorized access attempt on your corporate direct deposit account.
To prevent cancellation of your upcoming salary disbursement, you must immediately confirm your identity and verify your account credentials.

Click here to verify: https://login.secure-verify-employee.org/auth/update?token=8941fba9

Failure to complete verification within 24 hours will result in immediate termination of electronic payment preferences.

Sincerely,
Corporate Payroll & Benefits Administration`
  },
  {
    name: 'Phishing: Microsoft 365 Password Expiration',
    content: `From: "IT Support Helpdesk" <support@it-services-security-notice.net>
Subject: Security Alert: Your Microsoft 365 Password Expires Today
Date: Tue, 22 Sep 2026 08:30:12 UTC

Hello,

Your corporate single-sign-on password expires today. Unauthorized login attempts from external IP addresses were flagged.
Please log in to our secure portal to retain your existing credentials and update payment security questions:

Portal: http://198.51.100.44/m365/signin.php?dest=enterprise

Thank you,
IT Global Helpdesk Support Team`
  },
  {
    name: 'Benign: Engineering All-Hands Lunch Invitation',
    content: `From: "Sarah Jenkins" <s.jenkins@enterprise.local>
Subject: Team Lunch & Q3 Sprint Retrospective
Date: Mon, 21 Sep 2026 14:00:00 UTC

Hi Team,

Great job on concluding Sprint 14! Let's get together in Cafe B this Thursday at 12:30 PM for lunch.
Please review our internal retrospective slide deck on SharePoint:

https://sharepoint.enterprise.local/sites/engineering/retrospective-q3.pptx

Looking forward to catching up!

Best,
Sarah Jenkins
Director of Engineering`
  }
];

export const PhishingAnalyzerPage: React.FC = () => {
  const [emailText, setEmailText] = useState(SAMPLE_EMAILS[0].content);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PhishingAnalysisResult | null>(null);

  const handleAnalyze = async () => {
    if (!emailText.trim()) return;
    try {
      setLoading(true);
      const res = await api.analyzePhishing(emailText);
      setResult(res);
    } catch (e: any) {
      alert(`Error analyzing email: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-400 bg-red-950/60 border-red-800/80';
    if (score >= 45) return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
    return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Phishing Email & Social Engineering Analyzer
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Heuristic + Gemini AI
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Safe defensive evaluation of headers, URLs, psychological pretexts, and credential solicitation patterns
          </p>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 flex items-center gap-2.5">
        <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
        <span>
          <strong className="text-slate-100">Safe Static Analysis:</strong> Emails are analyzed locally and server-side via heuristic parsers and Gemini threat intelligence. No remote links are accessed or triggered.
        </span>
      </div>

      {/* Pre-loaded Sample Picker */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-slate-400 font-mono">Load Sample:</span>
        {SAMPLE_EMAILS.map((sample, idx) => (
          <button
            key={idx}
            onClick={() => {
              setEmailText(sample.content);
              setResult(null);
            }}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-cyan-300 transition font-medium"
          >
            {sample.name}
          </button>
        ))}
      </div>

      {/* Editor & Analyze Trigger */}
      <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-slate-200 flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-400" />
            Paste Raw Email Message Header & Body:
          </label>
          <span className="text-[11px] font-mono text-slate-500">{emailText.length} characters</span>
        </div>

        <textarea
          rows={10}
          value={emailText}
          onChange={(e) => setEmailText(e.target.value)}
          placeholder="Paste headers and body here..."
          className="w-full p-3.5 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-200 focus:outline-none focus:border-cyan-500 leading-relaxed resize-y"
        />

        <div className="flex justify-end">
          <button
            disabled={loading || !emailText.trim()}
            onClick={handleAnalyze}
            className="flex items-center gap-2 px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950 transition disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Running Deep Heuristics & AI Synthesis...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>Execute Phishing Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results View */}
      {result && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-200">
          {/* Top Classification Banner */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[11px] uppercase tracking-wider font-mono text-slate-400">
                Threat Classification Verdict
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-bold text-slate-100">{result.classification}</h2>
                <div className={`px-3 py-1 rounded-lg border font-mono font-bold text-sm ${getScoreColor(result.riskScore)}`}>
                  Risk Score: {result.riskScore} / 100
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">DOMAIN MISMATCH</span>
                <span className={result.domainMismatchDetected ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {result.domainMismatchDetected ? 'DETECTED' : 'CLEAN'}
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-slate-400 block text-[10px]">EXTRACTED URLS</span>
                <span className="text-cyan-300 font-bold">{result.extractedUrls.length}</span>
              </div>
            </div>
          </div>

          {/* Heuristic Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Extracted Artifacts & Indicators */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Extracted Message Components
              </h3>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 uppercase text-[10px] font-mono block">Sender Header:</span>
                  <span className="font-mono text-slate-200 text-xs break-all">{result.sender}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 uppercase text-[10px] font-mono block">Subject Line:</span>
                  <span className="text-slate-200 text-xs font-medium">{result.subject}</span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 uppercase text-[10px] font-mono block">Extracted Hyperlinks:</span>
                  {result.extractedUrls.length === 0 ? (
                    <span className="text-slate-500 font-mono">No URLs found</span>
                  ) : (
                    <div className="space-y-1 mt-1 font-mono text-[11px]">
                      {result.extractedUrls.map((u, i) => (
                        <div key={i} className="text-cyan-300 bg-slate-950 p-1.5 rounded border border-slate-800 break-all flex items-center gap-1.5">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span>{u}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Social Engineering & Psychological Vectors */}
            <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
              <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Social Engineering Triggers
              </h3>

              <div className="space-y-2 text-xs">
                {result.socialEngineeringIndicators.length === 0 ? (
                  <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-center">
                    No deceptive social engineering pretexts detected.
                  </div>
                ) : (
                  result.socialEngineeringIndicators.map((se, i) => (
                    <div key={i} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-start gap-2.5 text-slate-200">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <span>{se}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Reasons */}
              <div className="pt-2">
                <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-2">
                  Key Risk Factors:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {result.reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-red-400 font-bold">&bull;</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Gemini AI Synthesis & SOC Triage Guidance */}
          <div className="p-5 rounded-2xl bg-[#0f172a] border border-slate-800 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              AI Intelligence Assessment & SOC Playbook Guidance
            </h3>

            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-200 leading-relaxed space-y-3 whitespace-pre-wrap font-sans">
              {result.aiExplanation}
            </div>

            <div className="pt-2">
              <span className="text-slate-400 uppercase text-[10px] font-mono font-semibold block mb-2">
                Recommended Triage Actions:
              </span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {result.recommendedInvestigation.map((act, i) => (
                  <div key={i} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-2 text-slate-300">
                    <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <span>{act}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
