export type Severity = 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
export type IncidentStatus = 'Open' | 'Investigating' | 'Resolved' | 'Closed';

export interface SecurityEvent {
  eventId: string;
  timestamp: string;
  source: string;
  sourceType: string;
  user: string;
  ip: string;
  hostname: string;
  eventType: string;
  description: string;
  severity: Severity;
  indicators: string[];
  metadata: Record<string, any>;
}

export interface IncidentRecord {
  incidentId: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  status: IncidentStatus;
  affectedUser: string;
  affectedAssets: string[];
  relatedEvents: string[];
  indicators: string[];
  timeline: Array<{
    time: string;
    event: string;
    severity: string;
    source: string;
  }>;
  mitreTechniques: string[];
  recommendations: string[];
  riskBreakdown: Array<{
    factor: string;
    weight: number;
    rationale: string;
  }>;
}

export interface ThreatIndicator {
  id: string;
  indicator: string;
  type: 'IP' | 'Domain' | 'URL' | 'File Hash';
  status: 'Malicious' | 'Suspicious' | 'Benign' | 'Unknown';
  confidence: number;
  firstSeen: string;
  lastSeen: string;
  source: string;
  tags: string[];
}

export interface VulnerabilityRecord {
  cveId: string;
  asset: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  cvss: number;
  exposure: 'Public Edge' | 'Internal Server' | 'Workstation' | 'Cloud Resource';
  assetImportance: 'Tier 1 (Mission Critical)' | 'Tier 2 (High)' | 'Tier 3 (Standard)';
  priority: 'P0 - Emergency' | 'P1 - High' | 'P2 - Medium' | 'P3 - Low';
  remediationStatus: 'Unpatched' | 'In Progress' | 'Patch Available' | 'Resolved' | 'Mitigated';
  description: string;
  patchGuidance: string;
}

export interface MitreTechnique {
  techniqueId: string;
  techniqueName: string;
  tactic: string;
  reason: string;
  evidence: string;
  detectionGuidance: string;
  mitigationGuidance: string;
}

export interface ResponseAction {
  id: string;
  incidentId: string;
  title: string;
  description: string;
  actionType: 'HOST_ISOLATION' | 'FIREWALL_BLOCK' | 'CREDENTIAL_REVOCATION' | 'PATCH_APPLICATION' | 'S3_BUCKET_LOCKDOWN' | 'SESSION_TERMINATION';
  status: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED' | 'EXECUTED';
  recommendedBy: string;
  rationale: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  reviewNotes: string | null;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userAction: string;
  actionType: 'HUMAN_APPROVAL' | 'HUMAN_REJECTION' | 'STATUS_CHANGE' | 'SCENARIO_TRIGGER' | 'AI_COPILOT_QUERY' | 'INCIDENT_MODIFICATION' | 'SYSTEM_BASELINE_RESET';
  incidentId: string | null;
  aiRecommendation: string | null;
  analystDecision: string | null;
  details: Record<string, any>;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  targetIncidentId: string;
}

export interface PhishingAnalysisResult {
  classification: 'Phishing / High Confidence' | 'Suspicious / Medium Risk' | 'Legitimate / Low Risk';
  riskScore: number;
  sender: string;
  subject: string;
  extractedUrls: string[];
  detectedUrgency: string[];
  detectedCredentials: string[];
  domainMismatchDetected: boolean;
  socialEngineeringIndicators: string[];
  reasons: string[];
  recommendedInvestigation: string[];
  aiExplanation: string;
}

export interface UrlCheckResult {
  check: string;
  status: 'SAFE' | 'WARNING' | 'CRITICAL';
  details: string;
  scoreDelta: number;
}

export interface UrlAnalysisResult {
  url: string;
  parsedHostname: string;
  protocol: string;
  path: string;
  verdict: 'High Risk' | 'Medium Risk' | 'Low Risk';
  riskScore: number;
  checks: UrlCheckResult[];
  aiEvaluation: string;
}

export interface DashboardStats {
  kpis: {
    totalEvents: number;
    criticalIncidents: number;
    highRiskIncidents: number;
    suspiciousEvents: number;
    openIncidents: number;
    vulnerabilities: number;
  };
  charts: {
    eventsOverTime: Array<{ time: string; events: number; blocked: number }>;
    severityDistribution: Array<{ name: string; value: number; color: string }>;
    incidentCategories: Array<{ category: string; count: number }>;
    threatActivity: Array<{ type: string; count: number }>;
    mitreDistribution: Array<{ technique: string; count: number }>;
  };
  recentIncidents: Array<{
    incidentId: string;
    title: string;
    severity: string;
    riskScore: number;
    status: string;
    affectedUser: string;
    timestamp: string;
  }>;
}
