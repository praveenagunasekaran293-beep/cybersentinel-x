import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Send,
  User,
  ShieldCheck,
  RefreshCw,
  Clock,
  Layers,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { IncidentRecord } from '../types';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  usedAi?: boolean;
}

interface Props {
  initialIncidentId?: string | null;
}

const SUGGESTED_QUESTIONS = [
  'What happened in this incident?',
  'Why is this incident classified as high risk?',
  'What evidence supports this classification?',
  'What should the analyst investigate next?',
  'Which MITRE technique is relevant to the attack chain?'
];

export const CopilotPage: React.FC<Props> = ({ initialIncidentId }) => {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedIncidentId, setSelectedIncidentId] = useState<string>(initialIncidentId || '');
  const [inputQuestion, setInputQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-0',
      sender: 'assistant',
      text: `### CyberSentinel X Autonomous Security Copilot Initialized

I am your defensive SOC Intelligence Copilot powered by server-side Gemini threat intelligence.
I synthesize telemetry, incident records, MITRE ATT&CK alignments, and IoCs exclusively from stored application evidence.

Select an active incident above or ask any SOC operational inquiry below.`,
      timestamp: new Date().toLocaleTimeString(),
      usedAi: false
    }
  ]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getIncidents().then((list) => {
      setIncidents(list);
      if (initialIncidentId) {
        setSelectedIncidentId(initialIncidentId);
      } else if (list.length > 0) {
        setSelectedIncidentId(list[0].incidentId);
      }
    });
  }, [initialIncidentId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (questionToSend?: string) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || loading) return;

    const userMsg: Message = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: q,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuestion('');
    setLoading(true);

    try {
      const res = await api.askCopilot(q, selectedIncidentId || undefined);
      const assistantMsg: Message = {
        id: `asst-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date(res.timestamp).toLocaleTimeString(),
        usedAi: res.usedAi
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (e: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: 'assistant',
          text: `⚠️ **Inquiry Error:** ${e.message}`,
          timestamp: new Date().toLocaleTimeString(),
          usedAi: false
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            AI Security Copilot & Evidence Reasoning
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/60">
              Gemini 3.8 Flash
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Grounded investigation assistant analyzing correlated application telemetry and forensic evidence
          </p>
        </div>

        {/* Incident Context Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono">Incident Focus:</span>
          <select
            value={selectedIncidentId}
            onChange={(e) => setSelectedIncidentId(e.target.value)}
            className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-cyan-300 font-mono font-semibold focus:outline-none focus:border-cyan-500"
          >
            <option value="">Platform Global Context</option>
            {incidents.map((inc) => (
              <option key={inc.incidentId} value={inc.incidentId}>
                {inc.incidentId} &bull; {inc.title.slice(0, 36)}...
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Suggested Questions Pill Row */}
      <div className="py-2.5 flex items-center gap-2 overflow-x-auto text-xs font-mono border-b border-slate-800/80">
        <span className="text-slate-500 shrink-0 text-[11px]">Suggested Inquiries:</span>
        {SUGGESTED_QUESTIONS.map((sq, idx) => (
          <button
            key={idx}
            onClick={() => handleSend(sq)}
            className="shrink-0 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-cyan-300 transition text-[11px]"
          >
            {sq}
          </button>
        ))}
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-3 max-w-4xl ${
              m.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
            }`}
          >
            {/* Avatar */}
            <div
              className={`h-8 w-8 rounded-lg shrink-0 flex items-center justify-center border text-xs font-bold ${
                m.sender === 'user'
                  ? 'bg-slate-800 border-slate-700 text-slate-200'
                  : 'bg-gradient-to-tr from-cyan-600 to-blue-500 border-cyan-400/30 text-white shadow-md shadow-cyan-900/40'
              }`}
            >
              {m.sender === 'user' ? <User className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            </div>

            {/* Bubble */}
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed ${
                m.sender === 'user'
                  ? 'bg-cyan-950/40 border-cyan-800/60 text-slate-200 font-medium'
                  : 'bg-[#0f172a] border-slate-800 text-slate-200 shadow-sm'
              }`}
            >
              <div className="flex items-center justify-between gap-4 pb-1 mb-2 border-b border-slate-800/60 text-[10px] font-mono text-slate-500">
                <span>{m.sender === 'user' ? 'SOC Lead Analyst' : 'CyberSentinel Copilot'}</span>
                <div className="flex items-center gap-2">
                  {m.usedAi && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                      GROUNDED AI
                    </span>
                  )}
                  <span>{m.timestamp}</span>
                </div>
              </div>

              <div className="whitespace-pre-wrap font-sans space-y-2">
                {m.text}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 max-w-xl">
            <div className="h-8 w-8 rounded-lg shrink-0 flex items-center justify-center bg-cyan-600/40 border border-cyan-500/30 text-cyan-300">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
            <div className="p-4 rounded-2xl bg-[#0f172a] border border-slate-800 text-xs text-slate-400 flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              Synthesizing correlated database records & generating reasoning...
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-3 bg-[#0f172a] border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            placeholder="Ask Copilot regarding evidence, attack progression, or MITRE ATT&CK tactics..."
            className="flex-1 px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />

          <button
            type="submit"
            disabled={loading || !inputQuestion.trim()}
            className="px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-cyan-950 transition disabled:opacity-50 flex items-center gap-1.5"
          >
            <span>Ask</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
        <div className="flex items-center justify-between pt-1.5 text-[10px] text-slate-500 px-1 font-mono">
          <span>Grounding: Uses stored application events, IoCs & risk weights</span>
          <span>Zero external model hallucination policy</span>
        </div>
      </div>
    </div>
  );
};
