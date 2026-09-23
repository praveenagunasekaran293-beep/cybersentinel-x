import {
  DashboardStats,
  SecurityEvent,
  IncidentRecord,
  ThreatIndicator,
  VulnerabilityRecord,
  MitreTechnique,
  ResponseAction,
  AuditLogEntry,
  ScenarioDefinition,
  PhishingAnalysisResult,
  UrlAnalysisResult
} from '../types';

export const api = {
  // Dashboard
  async getDashboardStats(): Promise<DashboardStats> {
    const res = await fetch('/api/dashboard/stats');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch dashboard stats');
    return json.data;
  },

  // Security Events
  async getEvents(params?: { search?: string; severity?: string; sourceType?: string; limit?: number }): Promise<SecurityEvent[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.sourceType) query.append('sourceType', params.sourceType);
    if (params?.limit) query.append('limit', String(params.limit));

    const res = await fetch(`/api/events?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch events');
    return json.data;
  },

  async createEvent(data: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create event');
    return json.data;
  },

  async loadDemoEvents(): Promise<string> {
    const res = await fetch('/api/events/load-demo', { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to load demo events');
    return json.message;
  },

  // Incidents
  async getIncidents(params?: { search?: string; severity?: string; status?: string }): Promise<IncidentRecord[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.status) query.append('status', params.status);

    const res = await fetch(`/api/incidents?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch incidents');
    return json.data;
  },

  async getIncident(id: string): Promise<IncidentRecord> {
    const res = await fetch(`/api/incidents/${id}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch incident');
    return json.data;
  },

  async updateIncidentStatus(id: string, status: string, notes?: string): Promise<void> {
    const res = await fetch(`/api/incidents/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, analystNotes: notes })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update status');
  },

  // Threat Intel
  async getThreatIntel(params?: { search?: string; type?: string; status?: string }): Promise<{ disclaimer: string; data: ThreatIndicator[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.type) query.append('type', params.type);
    if (params?.status) query.append('status', params.status);

    const res = await fetch(`/api/threat-intel?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch threat intel');
    return { disclaimer: json.disclaimer, data: json.data };
  },

  async createThreatIndicator(data: Partial<ThreatIndicator>): Promise<ThreatIndicator> {
    const res = await fetch('/api/threat-intel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to create indicator');
    return json.data;
  },

  // Vulnerabilities
  async getVulnerabilities(params?: { search?: string; severity?: string; remediationStatus?: string }): Promise<{ prioritizationExplanation: string; data: VulnerabilityRecord[] }> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.severity) query.append('severity', params.severity);
    if (params?.remediationStatus) query.append('remediationStatus', params.remediationStatus);

    const res = await fetch(`/api/vulnerabilities?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch vulnerabilities');
    return { prioritizationExplanation: json.prioritizationExplanation, data: json.data };
  },

  async updateVulnerabilityStatus(cveId: string, status: string): Promise<void> {
    const res = await fetch(`/api/vulnerabilities/${cveId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to update status');
  },

  // MITRE
  async getMitreTechniques(params?: { search?: string; tactic?: string }): Promise<MitreTechnique[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.tactic) query.append('tactic', params.tactic);

    const res = await fetch(`/api/mitre?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch MITRE techniques');
    return json.data;
  },

  // Response Actions (Human-in-the-Loop)
  async getResponseActions(params?: { status?: string; incidentId?: string }): Promise<{ governanceNotice: string; data: ResponseAction[] }> {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.incidentId) query.append('incidentId', params.incidentId);

    const res = await fetch(`/api/response-actions?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch response actions');
    return { governanceNotice: json.governanceNotice, data: json.data };
  },

  async reviewResponseAction(id: string, decision: 'APPROVED' | 'REJECTED', notes?: string, analystName?: string): Promise<void> {
    const res = await fetch(`/api/response-actions/${id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, notes, analystName })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to review action');
  },

  // Audit Logs
  async getAuditLogs(params?: { search?: string; actionType?: string; incidentId?: string }): Promise<AuditLogEntry[]> {
    const query = new URLSearchParams();
    if (params?.search) query.append('search', params.search);
    if (params?.actionType) query.append('actionType', params.actionType);
    if (params?.incidentId) query.append('incidentId', params.incidentId);

    const res = await fetch(`/api/audit-logs?${query.toString()}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch audit logs');
    return json.data;
  },

  // Scenarios
  async getScenarios(): Promise<ScenarioDefinition[]> {
    const res = await fetch('/api/scenarios');
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to fetch scenarios');
    return json.scenarios;
  },

  async triggerScenario(scenarioId: string): Promise<{ scenario: ScenarioDefinition; incident: IncidentRecord }> {
    const res = await fetch('/api/scenarios/trigger', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenarioId })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to trigger scenario');
    return { scenario: json.scenario, incident: json.incident };
  },

  async resetScenarios(): Promise<string> {
    const res = await fetch('/api/scenarios/reset', { method: 'POST' });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to reset scenario baseline');
    return json.message;
  },

  // Phishing Analyzer
  async analyzePhishing(emailText: string): Promise<PhishingAnalysisResult> {
    const res = await fetch('/api/analyze/phishing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailText })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to analyze phishing email');
    return json.analysis;
  },

  // URL Analyzer
  async analyzeUrl(url: string): Promise<UrlAnalysisResult> {
    const res = await fetch('/api/analyze/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to analyze URL');
    return json.analysis;
  },

  // Copilot Chat
  async askCopilot(question: string, incidentId?: string): Promise<{ reply: string; usedAi: boolean; timestamp: string }> {
    const res = await fetch('/api/copilot/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, incidentId })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.error || 'Failed to get response from AI Copilot');
    return json.data;
  }
};
