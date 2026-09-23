import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

let dbInstance: Database | null = null;
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'cybersentinel.sqlite');

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
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Info';
  indicators: string[];
  metadata: Record<string, any>;
}

export interface IncidentRecord {
  incidentId: string;
  title: string;
  description: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  riskScore: number;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
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

export async function getDb(): Promise<Database> {
  if (dbInstance) return dbInstance;

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      dbInstance = new SQL.Database(fileBuffer);
      return dbInstance;
    } catch (e) {
      console.warn('Could not read existing database, initializing fresh one:', e);
    }
  }

  dbInstance = new SQL.Database();
  initializeSchema(dbInstance);
  seedBaselineData(dbInstance);
  saveDb(dbInstance);
  return dbInstance;
}

export function saveDb(db: Database) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const data = db.export();
    fs.writeFileSync(DB_PATH, Buffer.from(data));
  } catch (err) {
    console.error('Failed to save database to disk:', err);
  }
}

function initializeSchema(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS events (
      eventId TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      source TEXT NOT NULL,
      sourceType TEXT NOT NULL,
      user TEXT NOT NULL,
      ip TEXT NOT NULL,
      hostname TEXT NOT NULL,
      eventType TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      indicators TEXT NOT NULL,
      metadata TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS incidents (
      incidentId TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      severity TEXT NOT NULL,
      riskScore INTEGER NOT NULL,
      status TEXT NOT NULL,
      affectedUser TEXT NOT NULL,
      affectedAssets TEXT NOT NULL,
      relatedEvents TEXT NOT NULL,
      indicators TEXT NOT NULL,
      timeline TEXT NOT NULL,
      mitreTechniques TEXT NOT NULL,
      recommendations TEXT NOT NULL,
      riskBreakdown TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS threat_intel (
      id TEXT PRIMARY KEY,
      indicator TEXT NOT NULL,
      type TEXT NOT NULL,
      status TEXT NOT NULL,
      confidence INTEGER NOT NULL,
      firstSeen TEXT NOT NULL,
      lastSeen TEXT NOT NULL,
      source TEXT NOT NULL,
      tags TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vulnerabilities (
      cveId TEXT PRIMARY KEY,
      asset TEXT NOT NULL,
      severity TEXT NOT NULL,
      cvss REAL NOT NULL,
      exposure TEXT NOT NULL,
      assetImportance TEXT NOT NULL,
      priority TEXT NOT NULL,
      remediationStatus TEXT NOT NULL,
      description TEXT NOT NULL,
      patchGuidance TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS mitre_techniques (
      techniqueId TEXT PRIMARY KEY,
      techniqueName TEXT NOT NULL,
      tactic TEXT NOT NULL,
      reason TEXT NOT NULL,
      evidence TEXT NOT NULL,
      detectionGuidance TEXT NOT NULL,
      mitigationGuidance TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS response_actions (
      id TEXT PRIMARY KEY,
      incidentId TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      actionType TEXT NOT NULL,
      status TEXT NOT NULL,
      recommendedBy TEXT NOT NULL,
      rationale TEXT NOT NULL,
      reviewedBy TEXT,
      reviewedAt TEXT,
      reviewNotes TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      userAction TEXT NOT NULL,
      actionType TEXT NOT NULL,
      incidentId TEXT,
      aiRecommendation TEXT,
      analystDecision TEXT,
      details TEXT NOT NULL
    );
  `);
}

export function seedBaselineData(db: Database) {
  // Clear tables
  db.run(`DELETE FROM events;`);
  db.run(`DELETE FROM incidents;`);
  db.run(`DELETE FROM threat_intel;`);
  db.run(`DELETE FROM vulnerabilities;`);
  db.run(`DELETE FROM mitre_techniques;`);
  db.run(`DELETE FROM response_actions;`);
  db.run(`DELETE FROM audit_logs;`);

  // Baseline Events
  const events = [
    {
      eventId: 'EVT-1001',
      timestamp: '2026-09-22T08:14:22Z',
      source: 'Firewall-Perimeter',
      sourceType: 'Network',
      user: 'SYSTEM',
      ip: '198.51.100.44',
      hostname: 'edge-fw-01',
      eventType: 'OUTBOUND_BEACON_BLOCKED',
      description: 'Blocked outbound HTTPS connection to unverified high-entropy domain update-security-cdn.xyz',
      severity: 'High',
      indicators: JSON.stringify(['198.51.100.44', 'update-security-cdn.xyz']),
      metadata: JSON.stringify({ bytesOut: 1042, port: 443, proto: 'TCP', action: 'DROP' })
    },
    {
      eventId: 'EVT-1002',
      timestamp: '2026-09-22T08:20:10Z',
      source: 'Okta-Identity-Cloud',
      sourceType: 'Identity',
      user: 's.chen@enterprise.local',
      ip: '203.0.113.88',
      hostname: 'sso.enterprise.local',
      eventType: 'SUSPICIOUS_MFA_FATIGUE',
      description: 'Multiple MFA push denials followed by unexpected push acceptance from known TOR exit relay',
      severity: 'Critical',
      indicators: JSON.stringify(['203.0.113.88', 's.chen@enterprise.local']),
      metadata: JSON.stringify({ mfaMethod: 'Push', denials: 4, authContext: 'Anonymizing Proxy' })
    },
    {
      eventId: 'EVT-1003',
      timestamp: '2026-09-22T08:25:00Z',
      source: 'CrowdStrike-EDR',
      sourceType: 'Endpoint',
      user: 's.chen',
      ip: '10.0.4.15',
      hostname: 'WS-FIN-092',
      eventType: 'SUSPICIOUS_PROCESS_SPAWN',
      description: 'powershell.exe invoked as child process of WINWORD.EXE with obfuscated -enc flags',
      severity: 'Critical',
      indicators: JSON.stringify(['powershell.exe', 'WINWORD.EXE', 'a8f3b20c91e47d25164bc9a1f28b7e33527a0de917fa4219b1682f6e91124ca3']),
      metadata: JSON.stringify({ pid: 8192, parentPid: 3410, command: 'powershell.exe -w hidden -nop -enc SQBFAFgA...' })
    },
    {
      eventId: 'EVT-1004',
      timestamp: '2026-09-22T08:31:14Z',
      source: 'Proofpoint-SEG',
      sourceType: 'Email',
      user: 'd.ross@enterprise.local',
      ip: '185.220.101.5',
      hostname: 'mailgw-02',
      eventType: 'PHISHING_EMAIL_DELIVERED',
      description: 'Inbound message with subject "Urgent: Direct Deposit Re-verification" containing link to payroll-hr-verify.org',
      severity: 'High',
      indicators: JSON.stringify(['payroll-hr-verify.org', '185.220.101.5', 'd.ross@enterprise.local']),
      metadata: JSON.stringify({ spf: 'PASS', dkim: 'FAIL', dmarc: 'FAIL', replyTo: 'hr-support@payroll-hr-verify.org' })
    },
    {
      eventId: 'EVT-1005',
      timestamp: '2026-09-22T08:45:00Z',
      source: 'AWS-CloudTrail',
      sourceType: 'Cloud',
      user: 'svc-deployer',
      ip: '52.95.12.19',
      hostname: 'us-east-1-api',
      eventType: 'IAM_POLICY_MUTATION',
      description: 'PutBucketPolicy API invoked removing BlockPublicAcls constraint on finance-ledger-backup-2026',
      severity: 'High',
      indicators: JSON.stringify(['arn:aws:s3:::finance-ledger-backup-2026', '52.95.12.19']),
      metadata: JSON.stringify({ eventSource: 's3.amazonaws.com', region: 'us-east-1', userAgent: 'aws-cli/2.14.0' })
    },
    {
      eventId: 'EVT-1006',
      timestamp: '2026-09-22T09:02:11Z',
      source: 'Suricata-NIDS',
      sourceType: 'Network',
      user: 'SYSTEM',
      ip: '10.0.4.15',
      hostname: 'edge-tap-01',
      eventType: 'DNS_TUNNELING_HEURISTIC',
      description: 'High volume of high-entropy DNS TXT queries observed pointing to *.sync-check.net',
      severity: 'Medium',
      indicators: JSON.stringify(['sync-check.net', '10.0.4.15']),
      metadata: JSON.stringify({ queryCount: 312, avgEntropy: 4.88, queryType: 'TXT' })
    },
    {
      eventId: 'EVT-1007',
      timestamp: '2026-09-22T09:15:30Z',
      source: 'ActiveDirectory-EventLog',
      sourceType: 'Identity',
      user: 'j.smith@enterprise.local',
      ip: '10.0.2.45',
      hostname: 'DC-CORP-01',
      eventType: 'KERBEROASTING_PROBE',
      description: 'Rapid series of Kerberos TGS-REQ requests for RC4-HMAC encrypted tickets on high-privilege SPNs',
      severity: 'High',
      indicators: JSON.stringify(['MSSQLSvc/db01.corp', '10.0.2.45', 'j.smith@enterprise.local']),
      metadata: JSON.stringify({ eventCode: 4769, ticketOptions: '0x40810000', ticketEncryptionType: '0x17' })
    },
    {
      eventId: 'EVT-1008',
      timestamp: '2026-09-22T09:30:00Z',
      source: 'Tenable-Scanner',
      sourceType: 'Vulnerability',
      user: 'root',
      ip: '10.0.8.20',
      hostname: 'VPN-GW-EXT',
      eventType: 'CRITICAL_CVE_DETECTED',
      description: 'Unauthenticated command injection detected in exterior gateway GlobalProtect telemetry portal (CVE-2024-3400)',
      severity: 'Critical',
      indicators: JSON.stringify(['CVE-2024-3400', '10.0.8.20']),
      metadata: JSON.stringify({ cvssScore: 10.0, port: 443, service: 'HTTPS-VPN' })
    },
    {
      eventId: 'EVT-1009',
      timestamp: '2026-09-22T09:42:00Z',
      source: 'Linux-Auditd',
      sourceType: 'Endpoint',
      user: 'deploy-user',
      ip: '10.0.6.12',
      hostname: 'SRV-APP-PROD-02',
      eventType: 'SUDO_PRIVILEGE_ATTEMPT',
      description: 'Failed sudo command attempt: /usr/bin/python3 -c "import pty; pty.spawn(\'/bin/bash\')"',
      severity: 'Medium',
      indicators: JSON.stringify(['/usr/bin/python3', 'SRV-APP-PROD-02']),
      metadata: JSON.stringify({ uid: 1001, tty: 'pts/0', returnCode: 1 })
    },
    {
      eventId: 'EVT-1010',
      timestamp: '2026-09-22T10:05:18Z',
      source: 'Cloudflare-WAF',
      sourceType: 'Cloud',
      user: 'ANONYMOUS',
      ip: '198.51.100.122',
      hostname: 'api.enterprise.com',
      eventType: 'SQLI_PROBE_BLOCKED',
      description: 'WAF blocked automated SQL injection pattern UNION SELECT in Authorization header',
      severity: 'Medium',
      indicators: JSON.stringify(['198.51.100.122', 'api.enterprise.com']),
      metadata: JSON.stringify({ ruleId: '942100', uri: '/v1/auth/token', method: 'POST' })
    }
  ];

  for (const ev of events) {
    db.run(
      `INSERT INTO events (eventId, timestamp, source, sourceType, user, ip, hostname, eventType, description, severity, indicators, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ev.eventId, ev.timestamp, ev.source, ev.sourceType, ev.user, ev.ip, ev.hostname, ev.eventType, ev.description, ev.severity, ev.indicators, ev.metadata]
    );
  }

  // Baseline Incidents
  const incidents = [
    {
      incidentId: 'INC-2026-001',
      title: 'Phishing-Led Credential Compromise & Suspicious Host Execution',
      description: 'Phishing email targeting finance employee resulted in MFA push fatigue compromise and subsequent child process execution of powershell.exe under Word. Workstation host isolated.',
      severity: 'Critical',
      riskScore: 94,
      status: 'Investigating',
      affectedUser: 's.chen@enterprise.local (Senior Financial Analyst)',
      affectedAssets: JSON.stringify(['WS-FIN-092 (Workstation)', 'sso.enterprise.local (IdP)']),
      relatedEvents: JSON.stringify(['EVT-1001', 'EVT-1002', 'EVT-1003', 'EVT-1006']),
      indicators: JSON.stringify(['203.0.113.88', '198.51.100.44', 'payroll-hr-verify.org', 'a8f3b20c91e47d25164bc9a1f28b7e33527a0de917fa4219b1682f6e91124ca3']),
      timeline: JSON.stringify([
        { time: '08:14:22', event: 'Inbound spear-phishing email delivered with link to payroll-hr-verify.org', severity: 'Medium', source: 'Email Gateway' },
        { time: '08:18:05', event: 'User clicked suspicious link from workstation WS-FIN-092', severity: 'High', source: 'Web Proxy' },
        { time: '08:20:10', event: 'Multiple MFA push fatigue notifications observed, followed by single acceptance from unfamiliar IP 203.0.113.88', severity: 'Critical', source: 'Okta SSO' },
        { time: '08:25:00', event: 'Powershell invoked by MS Word attempting to download remote payload; blocked by EDR', severity: 'Critical', source: 'CrowdStrike EDR' },
        { time: '08:28:40', event: 'Host isolated automatically; session revoked', severity: 'High', source: 'SOC Automation' }
      ]),
      mitreTechniques: JSON.stringify(['T1566.002', 'T1078.004', 'T1059.001', 'T1114.002']),
      recommendations: JSON.stringify([
        'Keep host WS-FIN-092 isolated from corporate network segment pending memory dump',
        'Revoke active Okta sessions and force password reset with hardware security key requirement for s.chen',
        'Block IP 203.0.113.88 and domain payroll-hr-verify.org across perimeter firewalls',
        'Initiate forensic triage and inspect %TEMP% for dropped script artifacts'
      ]),
      riskBreakdown: JSON.stringify([
        { factor: 'Known Malicious Domain & Phishing Heuristics', weight: 25, rationale: 'Domain mismatch and urgency triggers in email header' },
        { factor: 'Anomalous Geolocation & MFA Fatigue', weight: 30, rationale: 'Login accepted from TOR exit node after 4 rapid denials' },
        { factor: 'Suspicious Process Lineage (Word -> PowerShell)', weight: 25, rationale: 'Child process spawn matching MITRE T1059.001' },
        { factor: 'Financial Analyst High-Value Target', weight: 14, rationale: 'User has access to tier-1 payroll databases' }
      ])
    },
    {
      incidentId: 'INC-2026-002',
      title: 'Edge Gateway External RCE Exposure (CVE-2024-3400)',
      description: 'External security scanner discovered unauthenticated remote command execution vulnerability on boundary VPN gateway with high asset criticality.',
      severity: 'Critical',
      riskScore: 88,
      status: 'Open',
      affectedUser: 'N/A (Perimeter Infrastructure)',
      affectedAssets: JSON.stringify(['VPN-GW-EXT (Edge Gateway 10.0.8.20)']),
      relatedEvents: JSON.stringify(['EVT-1008']),
      indicators: JSON.stringify(['CVE-2024-3400', '10.0.8.20']),
      timeline: JSON.stringify([
        { time: '09:30:00', event: 'Vulnerability scan detected unpatched GlobalProtect gateway endpoint', severity: 'Critical', source: 'Tenable Scanner' },
        { time: '09:32:15', event: 'Automated SOC ingestion flagged CVSS 10.0 zero-day vulnerability', severity: 'High', source: 'Vulnerability Intel' }
      ]),
      mitreTechniques: JSON.stringify(['T1190', 'T1068']),
      recommendations: JSON.stringify([
        'Apply emergency vendor hotfix hotfix-v9.4.2 immediately',
        'Restrict management interface access to internal jump-host CIDR',
        'Audit edge gateway syslog for suspicious session cookies or curl invocations'
      ]),
      riskBreakdown: JSON.stringify([
        { factor: 'CVSS 10.0 Remote Code Execution', weight: 40, rationale: 'Unauthenticated buffer overflow vulnerability on edge device' },
        { factor: 'Public Internet Exposure', weight: 30, rationale: 'Gateway accepts direct inbound traffic from 0.0.0.0/0' },
        { factor: 'Critical Tier-1 Asset', weight: 18, rationale: 'Primary entry point for remote workforce VPN' }
      ])
    },
    {
      incidentId: 'INC-2026-003',
      title: 'Suspicious Cloud Storage Policy Mutation & Exfiltration Risk',
      description: 'Continuous cloud posture assessment detected the removal of public block controls on sensitive finance S3 bucket, executed via service account from external IP.',
      severity: 'High',
      riskScore: 78,
      status: 'Investigating',
      affectedUser: 'svc-deployer (CI/CD Service Account)',
      affectedAssets: JSON.stringify(['arn:aws:s3:::finance-ledger-backup-2026', 'AWS Account 940853939543']),
      relatedEvents: JSON.stringify(['EVT-1005']),
      indicators: JSON.stringify(['arn:aws:s3:::finance-ledger-backup-2026', '52.95.12.19']),
      timeline: JSON.stringify([
        { time: '08:45:00', event: 'CloudTrail recorded PutBucketPolicy event removing public block restrictions', severity: 'High', source: 'AWS CloudTrail' },
        { time: '08:46:12', event: 'Cloud posture management triggered severity High misconfiguration alert', severity: 'High', source: 'SOC Cloud Monitor' }
      ]),
      mitreTechniques: JSON.stringify(['T1530', 'T1078.004', 'T1484']),
      recommendations: JSON.stringify([
        'Re-enable S3 Public Access Block immediately on finance-ledger-backup-2026',
        'Rotate long-lived IAM access keys for svc-deployer',
        'Attach SCP denying s3:PutBucketPolicy to non-root organizational admins'
      ]),
      riskBreakdown: JSON.stringify([
        { factor: 'Public Read Access Policy Applied', weight: 35, rationale: 'PutBucketPolicy removed BlockPublicAcls restriction' },
        { factor: 'Non-Business Hours CI/CD API Call', weight: 25, rationale: 'Service account accessed from external non-whitelisted IP' },
        { factor: 'Sensitive Financial Storage Bucket', weight: 18, rationale: 'Contains encrypted quarterly financial archives' }
      ])
    },
    {
      incidentId: 'INC-2026-004',
      title: 'Active Directory Kerberoasting Reconnaissance Probe',
      description: 'Domain controller detected high-velocity TGS-REQ ticket requests with weak RC4 ciphers aimed at extracting offline crackable service account hashes.',
      severity: 'Medium',
      riskScore: 62,
      status: 'Open',
      affectedUser: 'j.smith@enterprise.local',
      affectedAssets: JSON.stringify(['DC-CORP-01 (Domain Controller)', 'MSSQLSvc/db01.corp']),
      relatedEvents: JSON.stringify(['EVT-1007']),
      indicators: JSON.stringify(['MSSQLSvc/db01.corp', '10.0.2.45', 'j.smith@enterprise.local']),
      timeline: JSON.stringify([
        { time: '09:15:30', event: 'Event 4769 burst requesting service tickets for 8 service accounts', severity: 'High', source: 'Domain Controller' }
      ]),
      mitreTechniques: JSON.stringify(['T1110.003', 'T1558.003']),
      recommendations: JSON.stringify([
        'Inspect workstation 10.0.2.45 for automated reconnaissance tools (e.g., Rubeus)',
        'Update Service Principal Accounts to use minimum 25-character randomized passwords with AES-256'
      ]),
      riskBreakdown: JSON.stringify([
        { factor: 'Kerberos TGS RC4 Weak Encryption Request', weight: 30, rationale: 'Standard indicator of Kerberoasting exploitation attempt' },
        { factor: 'Multiple High-Privileged Service Accounts Queried', weight: 22, rationale: 'Burst across SQL and SharePoint SPNs' },
        { factor: 'Standard Internal Domain Account Context', weight: 10, rationale: 'Originating from developer VLAN workstation' }
      ])
    }
  ];

  for (const inc of incidents) {
    db.run(
      `INSERT INTO incidents (incidentId, title, description, severity, riskScore, status, affectedUser, affectedAssets, relatedEvents, indicators, timeline, mitreTechniques, recommendations, riskBreakdown)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [inc.incidentId, inc.title, inc.description, inc.severity, inc.riskScore, inc.status, inc.affectedUser, inc.affectedAssets, inc.relatedEvents, inc.indicators, inc.timeline, inc.mitreTechniques, inc.recommendations, inc.riskBreakdown]
    );
  }

  // Baseline Threat Intelligence Indicators
  const threatIntel = [
    {
      id: 'TI-001',
      indicator: '203.0.113.88',
      type: 'IP',
      status: 'Suspicious',
      confidence: 92,
      firstSeen: '2026-09-18T14:22:00Z',
      lastSeen: '2026-09-22T08:20:10Z',
      source: 'Synthetic TOR Exit Node Intel Feed',
      tags: JSON.stringify(['TOR-Exit', 'Anonymization', 'MFA-Abuse'])
    },
    {
      id: 'TI-002',
      indicator: '198.51.100.44',
      type: 'IP',
      status: 'Malicious',
      confidence: 88,
      firstSeen: '2026-09-15T09:11:00Z',
      lastSeen: '2026-09-22T08:14:22Z',
      source: 'Synthetic Perimeter C2 Tracker',
      tags: JSON.stringify(['C2-Beacon', 'Fast-Flux', 'High-Risk-Subnet'])
    },
    {
      id: 'TI-003',
      indicator: 'payroll-hr-verify.org',
      type: 'Domain',
      status: 'Malicious',
      confidence: 96,
      firstSeen: '2026-09-21T03:00:00Z',
      lastSeen: '2026-09-22T08:31:14Z',
      source: 'Synthetic Domain Typosquatting Feed',
      tags: JSON.stringify(['Phishing', 'Credential-Harvester', 'Spoofed-HR'])
    },
    {
      id: 'TI-004',
      indicator: 'update-security-cdn.xyz',
      type: 'Domain',
      status: 'Suspicious',
      confidence: 84,
      firstSeen: '2026-09-20T11:45:00Z',
      lastSeen: '2026-09-22T08:14:22Z',
      source: 'Synthetic Newly Registered Domain (NRD) Feed',
      tags: JSON.stringify(['NRD', 'Suspicious-TLD', 'DGA-Candidate'])
    },
    {
      id: 'TI-005',
      indicator: 'http://payroll-hr-verify.org/portal/login?session_token=temp99',
      type: 'URL',
      status: 'Malicious',
      confidence: 98,
      firstSeen: '2026-09-22T08:10:00Z',
      lastSeen: '2026-09-22T08:31:14Z',
      source: 'Synthetic Web Proxy Crawler',
      tags: JSON.stringify(['Phishing-Landing-Page', 'Credential-Stealer', 'HTTP-Insecure'])
    },
    {
      id: 'TI-006',
      indicator: 'https://storage.googleapis.com/safe-cdn/docs/policy-2026.pdf',
      type: 'URL',
      status: 'Benign',
      confidence: 95,
      firstSeen: '2026-01-10T00:00:00Z',
      lastSeen: '2026-09-22T07:00:00Z',
      source: 'Synthetic Whitelist & CDN Monitor',
      tags: JSON.stringify(['Verified-CDN', 'Internal-Docs', 'Safe'])
    },
    {
      id: 'TI-007',
      indicator: 'a8f3b20c91e47d25164bc9a1f28b7e33527a0de917fa4219b1682f6e91124ca3',
      type: 'File Hash',
      status: 'Malicious',
      confidence: 94,
      firstSeen: '2026-09-21T18:30:00Z',
      lastSeen: '2026-09-22T08:25:00Z',
      source: 'Synthetic Endpoint Sandbox Engine',
      tags: JSON.stringify(['PowerShell-Dropper', 'Obfuscated', 'Trojan-Downloader'])
    },
    {
      id: 'TI-008',
      indicator: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      type: 'File Hash',
      status: 'Benign',
      confidence: 100,
      firstSeen: '2020-01-01T00:00:00Z',
      lastSeen: '2026-09-22T10:00:00Z',
      source: 'NIST National Software Reference Library (NSRL)',
      tags: JSON.stringify(['Empty-File-Hash', 'Standard', 'Benign'])
    }
  ];

  for (const ti of threatIntel) {
    db.run(
      `INSERT INTO threat_intel (id, indicator, type, status, confidence, firstSeen, lastSeen, source, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [ti.id, ti.indicator, ti.type, ti.status, ti.confidence, ti.firstSeen, ti.lastSeen, ti.source, ti.tags]
    );
  }

  // Baseline Vulnerability Intelligence
  const vulnerabilities = [
    {
      cveId: 'CVE-2024-3400',
      asset: 'VPN-GW-EXT (10.0.8.20)',
      severity: 'Critical',
      cvss: 10.0,
      exposure: 'Public Edge',
      assetImportance: 'Tier 1 (Mission Critical)',
      priority: 'P0 - Emergency',
      remediationStatus: 'Unpatched',
      description: 'Command injection vulnerability in the GlobalProtect feature of PAN-OS software allows an unauthenticated attacker to execute arbitrary code with root privileges.',
      patchGuidance: 'Apply vendor hotfix hotfix-v9.4.2 immediately. Disable device telemetry until patch verification is complete.'
    },
    {
      cveId: 'CVE-2024-21413',
      asset: 'mailgw-02 (185.220.101.5)',
      severity: 'Critical',
      cvss: 9.8,
      exposure: 'Public Edge',
      assetImportance: 'Tier 1 (Mission Critical)',
      priority: 'P0 - Emergency',
      remediationStatus: 'Patch Available',
      description: 'Microsoft Outlook Remote Code Execution Vulnerability (Moniker Link Bug) bypassing Office Protected View when rendering malicious URLs.',
      patchGuidance: 'Deploy cumulative security update KB5002538 to all exchange perimeter connectors.'
    },
    {
      cveId: 'CVE-2023-38606',
      asset: 'WS-FIN-092 (10.0.4.15)',
      severity: 'High',
      cvss: 7.8,
      exposure: 'Workstation',
      assetImportance: 'Tier 2 (High)',
      priority: 'P1 - High',
      remediationStatus: 'In Progress',
      description: 'Local privilege escalation vulnerability allowing a local attacker to manipulate sensitive kernel memory states via malicious hardware registers.',
      patchGuidance: 'Update client OS build to version 23H2 with September security quality rollout.'
    },
    {
      cveId: 'CVE-2024-6387',
      asset: 'DC-CORP-01 (10.0.2.45)',
      severity: 'Critical',
      cvss: 8.1,
      exposure: 'Internal Server',
      assetImportance: 'Tier 1 (Mission Critical)',
      priority: 'P0 - Emergency',
      remediationStatus: 'Mitigated',
      description: 'regreSSHion: Remote Unauthenticated Code Execution vulnerability in OpenSSH server due to a race condition in signal handler.',
      patchGuidance: 'Set LoginGraceTime to 0 in sshd_config as immediate mitigation; upgrade openssh package to v9.8p1.'
    },
    {
      cveId: 'CVE-2023-4863',
      asset: 'WS-ENG-110 (10.0.5.88)',
      severity: 'Medium',
      cvss: 6.5,
      exposure: 'Workstation',
      assetImportance: 'Tier 3 (Standard)',
      priority: 'P3 - Low',
      remediationStatus: 'Resolved',
      description: 'Heap buffer overflow in libwebp in Google Chrome before 116.0.5845.187 allowed remote attacker to execute arbitrary code via crafted HTML page.',
      patchGuidance: 'Chrome auto-update confirmed active and version verified at >= 120.0.'
    }
  ];

  for (const v of vulnerabilities) {
    db.run(
      `INSERT INTO vulnerabilities (cveId, asset, severity, cvss, exposure, assetImportance, priority, remediationStatus, description, patchGuidance)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [v.cveId, v.asset, v.severity, v.cvss, v.exposure, v.assetImportance, v.priority, v.remediationStatus, v.description, v.patchGuidance]
    );
  }

  // Baseline MITRE ATT&CK Techniques
  const mitreTechniques = [
    {
      techniqueId: 'T1566.002',
      techniqueName: 'Phishing: Spearphishing Link',
      tactic: 'Initial Access',
      reason: 'Adversary sent customized emails containing malicious hyperlinks masquerading as legitimate corporate payroll verifications.',
      evidence: 'Observed email from hr-support@payroll-hr-verify.org pointing to credential harvester URL.',
      detectionGuidance: 'Inspect mail transfer logs for newly registered domains, SPF/DKIM alignment failures, and URL rewrite telemetry.',
      mitigationGuidance: 'User training, enforced DMARC reject policies, and sandbox URL time-of-click analysis.'
    },
    {
      techniqueId: 'T1078.004',
      techniqueName: 'Valid Accounts: Cloud Accounts',
      tactic: 'Defense Evasion, Persistence, Initial Access',
      reason: 'Stolen or fatigued cloud single sign-on credentials used to authenticate from unfamiliar external IP addresses.',
      evidence: 'Okta event EVT-1002 displaying 4 push rejections followed by sudden approval from TOR exit node.',
      detectionGuidance: 'Flag impossible travel velocity, anomalous user-agent strings, and unexpected MFA fatigue bursts.',
      mitigationGuidance: 'Enforce FIDO2 / WebAuthn phishing-resistant hardware security keys and conditional access IP fences.'
    },
    {
      techniqueId: 'T1059.001',
      techniqueName: 'Command and Scripting Interpreter: PowerShell',
      tactic: 'Execution',
      reason: 'Adversaries used PowerShell commands and scripts to execute payloads and conduct system discovery.',
      evidence: 'WINWORD.EXE spawned powershell.exe with -w hidden -enc arguments on WS-FIN-092.',
      detectionGuidance: 'Enable ScriptBlock logging (Event ID 4104), PowerShell transcription, and parent-child process constraint rules.',
      mitigationGuidance: 'Enforce PowerShell Constrained Language Mode and AppLocker / WDAC application control.'
    },
    {
      techniqueId: 'T1110.003',
      techniqueName: 'Brute Force: Password Spraying',
      tactic: 'Credential Access',
      reason: 'Attacker probes a single common password across many accounts to bypass traditional lockout thresholds.',
      evidence: 'Event EVT-1007 reflecting Kerberos TGS-REQ enumeration against high-privilege SPNs.',
      detectionGuidance: 'Monitor Event ID 4769 and 4625 for wide horizontal authentication patterns originating from a single host.',
      mitigationGuidance: 'Disable weak legacy ciphers (RC4) for Kerberos and mandate complex passphrases on service accounts.'
    },
    {
      techniqueId: 'T1190',
      techniqueName: 'Exploit Public-Facing Application',
      tactic: 'Initial Access',
      reason: 'Exploitation of unpatched internet-facing edge firewall and VPN software.',
      evidence: 'CVE-2024-3400 detected on external gateway interface VPN-GW-EXT.',
      detectionGuidance: 'Continuously scan external IP perimeter and monitor gateway access logs for abnormal command parameters.',
      mitigationGuidance: 'Implement regular vulnerability management cadence, rapid patching pipelines, and isolate management planes.'
    },
    {
      techniqueId: 'T1530',
      techniqueName: 'Data from Cloud Storage Object',
      tactic: 'Collection, Exfiltration',
      reason: 'Adversaries access data objects stored in cloud storage providers through misconfigured bucket access policies.',
      evidence: 'CloudTrail event EVT-1005 altering S3 PutBucketPolicy on finance backup bucket.',
      detectionGuidance: 'Set real-time alerts on CloudTrail events modifying bucket ACLs or public block controls.',
      mitigationGuidance: 'Enforce AWS Organization Service Control Policies (SCPs) preventing public bucket policies enterprise-wide.'
    },
    {
      techniqueId: 'T1071.001',
      techniqueName: 'Application Layer Protocol: Web Protocols',
      tactic: 'Command and Control',
      reason: 'C2 communications disguised as standard HTTP/HTTPS traffic to blend with benign enterprise traffic.',
      evidence: 'Repetitive outbound HTTPS beaconing to update-security-cdn.xyz logged on edge firewall.',
      detectionGuidance: 'Analyze outbound proxy logs for periodic beacon jitter, unclassified domains, and self-signed certificates.',
      mitigationGuidance: 'Enforce SSL/TLS decryption on egress proxies and block newly observed domains (< 30 days old).'
    }
  ];

  for (const m of mitreTechniques) {
    db.run(
      `INSERT INTO mitre_techniques (techniqueId, techniqueName, tactic, reason, evidence, detectionGuidance, mitigationGuidance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [m.techniqueId, m.techniqueName, m.tactic, m.reason, m.evidence, m.detectionGuidance, m.mitigationGuidance]
    );
  }

  // Baseline Response Actions (Human-in-the-Loop Workflow)
  const actions = [
    {
      id: 'ACT-101',
      incidentId: 'INC-2026-001',
      title: 'Host Network Isolation for WS-FIN-092',
      description: 'Sever all network connectivity to workstation WS-FIN-092 except for secure SOC EDR management channel.',
      actionType: 'HOST_ISOLATION',
      status: 'PENDING_REVIEW',
      recommendedBy: 'AI Security Copilot (Autonomous Defense Engine)',
      rationale: 'Active PowerShell child process detected under MS Word with known suspicious hash a8f3b20c...',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null
    },
    {
      id: 'ACT-102',
      incidentId: 'INC-2026-001',
      title: 'Perimeter Firewall Block for IP 203.0.113.88',
      description: 'Add IP 203.0.113.88 to edge firewall deny list across all perimeter zones.',
      actionType: 'FIREWALL_BLOCK',
      status: 'APPROVED',
      recommendedBy: 'AI Security Copilot (Autonomous Defense Engine)',
      rationale: 'Source IP of MFA fatigue attack matched confirmed TOR exit node feed.',
      reviewedBy: 'Analyst: P. Gunasekaran (Senior SOC Lead)',
      reviewedAt: '2026-09-22T08:35:00Z',
      reviewNotes: 'Approved. IP corroborated with threat intel feed; rule synced to Palo Alto edge group.'
    },
    {
      id: 'ACT-103',
      incidentId: 'INC-2026-003',
      title: 'Restore S3 Public Access Block on finance-ledger-backup-2026',
      description: 'Re-apply AWS account-level and bucket-level BlockPublicAcls restriction.',
      actionType: 'S3_BUCKET_LOCKDOWN',
      status: 'PENDING_REVIEW',
      recommendedBy: 'AI Security Copilot (Autonomous Defense Engine)',
      rationale: 'Sensitive finance repository exposed via non-whitelisted IP invocation of PutBucketPolicy.',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null
    },
    {
      id: 'ACT-104',
      incidentId: 'INC-2026-002',
      title: 'Emergency Hotfix Rollout for VPN-GW-EXT (CVE-2024-3400)',
      description: 'Schedule firmware patch v9.4.2 deployment during next 30-minute maintenance window.',
      actionType: 'PATCH_APPLICATION',
      status: 'PENDING_REVIEW',
      recommendedBy: 'Vulnerability Intelligence Module',
      rationale: 'CVSS 10.0 unauthenticated RCE on internet-facing perimeter appliance.',
      reviewedBy: null,
      reviewedAt: null,
      reviewNotes: null
    }
  ];

  for (const act of actions) {
    db.run(
      `INSERT INTO response_actions (id, incidentId, title, description, actionType, status, recommendedBy, rationale, reviewedBy, reviewedAt, reviewNotes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [act.id, act.incidentId, act.title, act.description, act.actionType, act.status, act.recommendedBy, act.rationale, act.reviewedBy, act.reviewedAt, act.reviewNotes]
    );
  }

  // Baseline Audit Logs
  const auditLogs = [
    {
      id: 'LOG-001',
      timestamp: '2026-09-22T08:00:00Z',
      userAction: 'System Initialization',
      actionType: 'SYSTEM_BASELINE_RESET',
      incidentId: null,
      aiRecommendation: null,
      analystDecision: 'System online with synthetic defense telemetry',
      details: JSON.stringify({ version: 'CyberSentinel X v1.0', modulesLoaded: 14 })
    },
    {
      id: 'LOG-002',
      timestamp: '2026-09-22T08:26:10Z',
      userAction: 'Automated AI Defense Suggestion',
      actionType: 'AI_COPILOT_QUERY',
      incidentId: 'INC-2026-001',
      aiRecommendation: 'Recommend immediate host isolation of WS-FIN-092 and perimeter IP block on 203.0.113.88',
      analystDecision: 'Queued for human analyst approval workflow',
      details: JSON.stringify({ policyEnforcement: 'Strict Human-in-the-Loop', riskScore: 94 })
    },
    {
      id: 'LOG-003',
      timestamp: '2026-09-22T08:35:00Z',
      userAction: 'Analyst Approved Perimeter Block',
      actionType: 'HUMAN_APPROVAL',
      incidentId: 'INC-2026-001',
      aiRecommendation: 'Add IP 203.0.113.88 to edge firewall deny list',
      analystDecision: 'APPROVED: IP verified as malicious TOR exit node',
      details: JSON.stringify({ actionId: 'ACT-102', reviewedBy: 'P. Gunasekaran (Senior SOC Lead)' })
    },
    {
      id: 'LOG-004',
      timestamp: '2026-09-22T08:47:00Z',
      userAction: 'Incident Status Transition',
      actionType: 'STATUS_CHANGE',
      incidentId: 'INC-2026-001',
      aiRecommendation: 'Status transition from Open to Investigating',
      analystDecision: 'Assigned to Incident Response Team Tier 2',
      details: JSON.stringify({ oldStatus: 'Open', newStatus: 'Investigating' })
    }
  ];

  for (const log of auditLogs) {
    db.run(
      `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [log.id, log.timestamp, log.userAction, log.actionType, log.incidentId, log.aiRecommendation, log.analystDecision, log.details]
    );
  }
}

// 6 Synthetic Demo Scenarios Engine
export interface ScenarioDefinition {
  id: string;
  name: string;
  category: string;
  description: string;
  targetIncidentId: string;
}

export const DEMO_SCENARIOS: ScenarioDefinition[] = [
  {
    id: 'phishing_account_compromise',
    name: '1. Phishing-led Account Compromise',
    category: 'Email & Identity',
    description: 'Simulates spear-phishing email targeting financial analyst, link click, MFA push fatigue bypass, and suspicious PowerShell download attempt.',
    targetIncidentId: 'INC-2026-001'
  },
  {
    id: 'suspicious_auth_activity',
    name: '2. Suspicious Authentication Activity',
    category: 'Identity & Access',
    description: 'Simulates distributed brute-force password spray, impossible travel detection between London and Tokyo in 15 minutes, and account lockout alerts.',
    targetIncidentId: 'INC-SCENARIO-AUTH'
  },
  {
    id: 'suspicious_network_activity',
    name: '3. Suspicious Network Activity (Beaconing & Tunneling)',
    category: 'Network & C2',
    description: 'Simulates high-frequency DNS tunneling TXT query exfiltration and regular 60-second jittered HTTP beaconing to an unclassified external domain.',
    targetIncidentId: 'INC-SCENARIO-NET'
  },
  {
    id: 'critical_vulnerability',
    name: '4. Critical Vulnerability (Edge Gateway Zero-Day)',
    category: 'Vulnerability Management',
    description: 'Simulates active CVSS 10.0 unauthenticated remote code execution vulnerability detection on edge VPN appliance with perimeter asset prioritization.',
    targetIncidentId: 'INC-2026-002'
  },
  {
    id: 'suspicious_file_investigation',
    name: '5. Suspicious File Investigation',
    category: 'Endpoint Forensics',
    description: 'Simulates execution of a multi-stage obfuscated payload from Windows Temp directory, process hollowing attempt, and defensive EDR containment.',
    targetIncidentId: 'INC-SCENARIO-FILE'
  },
  {
    id: 'cloud_misconfiguration',
    name: '6. Cloud Misconfiguration (Exposed Storage & IAM Drift)',
    category: 'Cloud Security',
    description: 'Simulates unexpected IAM permission escalation, removal of S3 BlockPublicAcls restriction on customer archive bucket, and compliance alert generation.',
    targetIncidentId: 'INC-2026-003'
  }
];

export function triggerScenario(db: Database, scenarioId: string): IncidentRecord | null {
  const timestamp = new Date().toISOString();

  switch (scenarioId) {
    case 'phishing_account_compromise': {
      // Refresh or add Phishing scenario records
      const incId = 'INC-2026-001';
      db.run(`UPDATE incidents SET status = 'Investigating', riskScore = 96 WHERE incidentId = ?`, [incId]);
      
      const evtId = `EVT-${Date.now().toString().slice(-4)}`;
      db.run(
        `INSERT INTO events (eventId, timestamp, source, sourceType, user, ip, hostname, eventType, description, severity, indicators, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evtId,
          timestamp,
          'Proofpoint-SEG',
          'Email',
          's.chen@enterprise.local',
          '185.220.101.5',
          'mailgw-01',
          'PHISHING_LINK_CLICKED',
          'User interacted with phishing URL in email matching campaign HR-PAYROLL-SCAM',
          'Critical',
          JSON.stringify(['payroll-hr-verify.org', '185.220.101.5']),
          JSON.stringify({ campaignId: 'HR-PAYROLL-SCAM', userDepartment: 'Finance' })
        ]
      );

      // Audit Log
      db.run(
        `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `LOG-${Date.now().toString().slice(-4)}`,
          timestamp,
          'Scenario Activated: Phishing-led Account Compromise',
          'SCENARIO_TRIGGER',
          incId,
          'Recommend host isolation and immediate session revocation for s.chen',
          'Scenario telemetry injected successfully into SOC pipelines',
          JSON.stringify({ scenarioId, targetIncidentId: incId })
        ]
      );
      break;
    }

    case 'suspicious_auth_activity': {
      const incId = 'INC-SCENARIO-AUTH';
      db.run(
        `INSERT OR REPLACE INTO incidents (incidentId, title, description, severity, riskScore, status, affectedUser, affectedAssets, relatedEvents, indicators, timeline, mitreTechniques, recommendations, riskBreakdown)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incId,
          'Distributed Password Spray & Impossible Travel Authentication Alert',
          'Simulated anomaly where user accounts were probed across 15 distinct global subnets, followed by successful authentication from Tokyo 15 minutes after London login.',
          'High',
          89,
          'Open',
          'm.tanaka@enterprise.local (Operations Manager)',
          JSON.stringify(['Okta-SSO-EU', 'Okta-SSO-AP', 'VPN-CONCENTRATOR-01']),
          JSON.stringify(['EVT-AUTH-01', 'EVT-AUTH-02', 'EVT-AUTH-03']),
          JSON.stringify(['192.0.2.77', '198.51.100.99', 'm.tanaka@enterprise.local']),
          JSON.stringify([
            { time: '10:00:12', event: 'Valid login from London corporate branch IP (192.0.2.77)', severity: 'Low', source: 'Okta SSO' },
            { time: '10:14:45', event: 'Failed login password spray attempt from 8 proxy IPs', severity: 'Medium', source: 'Auth Gateway' },
            { time: '10:15:30', event: 'Impossible travel alert: Successful authentication from Tokyo (198.51.100.99) within 15 minutes', severity: 'Critical', source: 'Okta Identity Engine' },
            { time: '10:16:00', event: 'Account locked out by adaptive access policy', severity: 'High', source: 'Identity Guard' }
          ]),
          JSON.stringify(['T1110.003', 'T1078.004']),
          JSON.stringify([
            'Terminate active concurrent sessions across all cloud identity providers',
            'Enforce geo-fencing policies prohibiting logins outside designated operational zones',
            'Require in-person or out-of-band verification before unlocking m.tanaka'
          ]),
          JSON.stringify([
            { factor: 'Impossible Travel Velocity (>4000 mph)', weight: 35, rationale: 'London to Tokyo authentication transition in 15 minutes' },
            { factor: 'Prior Password Spray Precursor', weight: 25, rationale: '8 distributed failed authentications within 10 minutes' },
            { factor: 'Critical Operations Role', weight: 20, rationale: 'Operations Manager with privileged manufacturing controls' },
            { factor: 'Unregistered Android User-Agent', weight: 9, rationale: 'Device fingerprint mismatch with corporate MDM profile' }
          ])
        ]
      );

      // Add response action
      db.run(
        `INSERT OR REPLACE INTO response_actions (id, incidentId, title, description, actionType, status, recommendedBy, rationale, reviewedBy, reviewedAt, reviewNotes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'ACT-AUTH-01',
          incId,
          'Global Session Termination & Geo-Fenced Lock for m.tanaka',
          'Immediately revoke all OAuth refresh tokens and active SAML assertions across enterprise SaaS apps.',
          'CREDENTIAL_REVOCATION',
          'PENDING_REVIEW',
          'AI Security Copilot (Autonomous Defense Engine)',
          'High probability impossible travel indicating active credential theft.',
          null,
          null,
          null
        ]
      );

      // Audit Log
      db.run(
        `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `LOG-${Date.now().toString().slice(-4)}`,
          timestamp,
          'Scenario Activated: Suspicious Authentication Activity',
          'SCENARIO_TRIGGER',
          incId,
          'Global session revocation recommended for m.tanaka',
          'Synthetic telemetry loaded into SOC console',
          JSON.stringify({ scenarioId, targetIncidentId: incId })
        ]
      );
      break;
    }

    case 'suspicious_network_activity': {
      const incId = 'INC-SCENARIO-NET';
      db.run(
        `INSERT OR REPLACE INTO incidents (incidentId, title, description, severity, riskScore, status, affectedUser, affectedAssets, relatedEvents, indicators, timeline, mitreTechniques, recommendations, riskBreakdown)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incId,
          'DNS Tunneling & Low-Frequency HTTPS C2 Beaconing Detected',
          'Simulated defensive detection of high-entropy DNS TXT queries tunneling data to external authoritative nameserver, paired with regular 60s periodic HTTPS heartbeat connections.',
          'High',
          85,
          'Investigating',
          'SYSTEM / Network Daemon',
          JSON.stringify(['SRV-DB-DEV-01 (10.0.9.14)', 'dns-resolver-internal']),
          JSON.stringify(['EVT-NET-01', 'EVT-NET-02']),
          JSON.stringify(['c2-telemetry-sync.net', '198.51.100.67', '10.0.9.14']),
          JSON.stringify([
            { time: '11:00:00', event: 'Baseline traffic deviation: 450 DNS TXT lookups in 3 minutes to *.c2-telemetry-sync.net', severity: 'High', source: 'Suricata NIDS' },
            { time: '11:04:12', event: 'Shannon entropy score 5.12 calculated on encoded DNS subdomains', severity: 'Critical', source: 'Zeek DNS Analyzer' },
            { time: '11:07:00', event: 'TCP connection established to 198.51.100.67:443 with 60-second beacon rhythm', severity: 'High', source: 'Palo Alto Firewall' }
          ]),
          JSON.stringify(['T1071.001', 'T1048.003', 'T1572']),
          JSON.stringify([
            'Sinkhole authoritative nameservers for c2-telemetry-sync.net at internal recursive resolvers',
            'Isolate SRV-DB-DEV-01 from developer subnet to prevent lateral movement',
            'Capture full PCAP on edge tap interface for protocol payload decode'
          ]),
          JSON.stringify([
            { factor: 'High-Entropy DNS Tunneling Signature', weight: 35, rationale: 'Average Shannon entropy > 5.0 with TXT query bursts' },
            { factor: 'Rhythmic Beaconing (Jitter < 5%)', weight: 28, rationale: 'HTTPS requests fired precisely every 60 seconds (+- 2s)' },
            { factor: 'Uncategorized Dynamic DNS Domain', weight: 15, rationale: 'Domain registered 48 hours ago with dynamic DNS provider' },
            { factor: 'Database Host Internal Origin', weight: 7, rationale: 'Host contains pre-production schema copies' }
          ])
        ]
      );

      // Add Response Action
      db.run(
        `INSERT OR REPLACE INTO response_actions (id, incidentId, title, description, actionType, status, recommendedBy, rationale, reviewedBy, reviewedAt, reviewNotes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'ACT-NET-01',
          incId,
          'DNS Sinkhole and Host Segregation for SRV-DB-DEV-01',
          'Redirect all queries for c2-telemetry-sync.net to local loopback sinkhole and restrict host egress.',
          'FIREWALL_BLOCK',
          'PENDING_REVIEW',
          'AI Security Copilot (Autonomous Defense Engine)',
          'Confirmed DNS tunneling behavior with active outbound beaconing.',
          null,
          null,
          null
        ]
      );

      db.run(
        `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `LOG-${Date.now().toString().slice(-4)}`,
          timestamp,
          'Scenario Activated: Suspicious Network Activity',
          'SCENARIO_TRIGGER',
          incId,
          'Sinkhole domain c2-telemetry-sync.net and isolate host 10.0.9.14',
          'Synthetic telemetry generated',
          JSON.stringify({ scenarioId, targetIncidentId: incId })
        ]
      );
      break;
    }

    case 'critical_vulnerability': {
      const incId = 'INC-2026-002';
      db.run(`UPDATE incidents SET riskScore = 92, status = 'Open' WHERE incidentId = ?`, [incId]);
      db.run(
        `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `LOG-${Date.now().toString().slice(-4)}`,
          timestamp,
          'Scenario Activated: Critical Vulnerability (Edge Gateway Zero-Day)',
          'SCENARIO_TRIGGER',
          incId,
          'Immediate patch application recommended for VPN-GW-EXT (CVE-2024-3400)',
          'Escalated priority to P0 Emergency in Vulnerability Management module',
          JSON.stringify({ scenarioId, targetIncidentId: incId })
        ]
      );
      break;
    }

    case 'suspicious_file_investigation': {
      const incId = 'INC-SCENARIO-FILE';
      db.run(
        `INSERT OR REPLACE INTO incidents (incidentId, title, description, severity, riskScore, status, affectedUser, affectedAssets, relatedEvents, indicators, timeline, mitreTechniques, recommendations, riskBreakdown)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          incId,
          'Suspicious File Execution & Process Hollowing Alert in %TEMP%',
          'Simulated detection of an unsigned executable written to Windows %LOCALAPPDATA%\\Temp, attempting to hollow svchost.exe memory space before defensive EDR quarantine.',
          'Critical',
          95,
          'Investigating',
          'k.patel@enterprise.local (Software Engineer)',
          JSON.stringify(['WS-ENG-044 (Developer Laptop)', 'svchost.exe']),
          JSON.stringify(['EVT-FILE-01', 'EVT-FILE-02']),
          JSON.stringify(['payload_stage2.exe', '7c5a982136e0f2b3891047fa334d9a21845fe92a104f29188e7345610bcde892', 'WS-ENG-044']),
          JSON.stringify([
            { time: '14:20:00', event: 'Unsigned binary dropped to C:\\Users\\k.patel\\AppData\\Local\\Temp\\payload_stage2.exe', severity: 'High', source: 'Sysmon Event 11' },
            { time: '14:20:04', event: 'Process created with suspended state targeting legitimate svchost.exe image', severity: 'Critical', source: 'CrowdStrike Falcon' },
            { time: '14:20:06', event: 'VirtualAllocEx and WriteProcessMemory API calls intercepted; process killed by behavioral protection', severity: 'Critical', source: 'EDR Prevention' },
            { time: '14:21:00', event: 'SHA-256 hash verified against synthetic malware intelligence database', severity: 'Medium', source: 'Threat Intel Lookup' }
          ]),
          JSON.stringify(['T1055.012', 'T1036.005', 'T1027']),
          JSON.stringify([
            'Maintain host quarantine on WS-ENG-044',
            'Acquire triage memory dump and inspect Sysmon Event 1 for origin parent process (browser vs compiler)',
            'Scan corporate code repositories to confirm no malicious dependencies in developer node_modules'
          ]),
          JSON.stringify([
            { factor: 'Process Injection / Hollowing Signature', weight: 40, rationale: 'CreateProcess suspended followed by memory overwrite attempt' },
            { factor: 'Unsigned Executable from %TEMP% Directory', weight: 25, rationale: 'Standard malware evasion technique avoiding Program Files' },
            { factor: 'Developer Workstation Privileges', weight: 20, rationale: 'Developer workstation with local administrator access rights' },
            { factor: 'High Entropy Obfuscated PE Header', weight: 10, rationale: 'Binary packed with UPX-like custom stub' }
          ])
        ]
      );

      // Add Response Action
      db.run(
        `INSERT OR REPLACE INTO response_actions (id, incidentId, title, description, actionType, status, recommendedBy, rationale, reviewedBy, reviewedAt, reviewNotes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          'ACT-FILE-01',
          incId,
          'Full Host Quarantine & Artifact Acquisition for WS-ENG-044',
          'Isolate workstation WS-ENG-044 and trigger automated forensic memory dump extraction.',
          'HOST_ISOLATION',
          'PENDING_REVIEW',
          'AI Security Copilot (Autonomous Defense Engine)',
          'Confirmed process hollowing attempt against svchost.exe.',
          null,
          null,
          null
        ]
      );

      db.run(
        `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `LOG-${Date.now().toString().slice(-4)}`,
          timestamp,
          'Scenario Activated: Suspicious File Investigation',
          'SCENARIO_TRIGGER',
          incId,
          'Quarantine WS-ENG-044 and extract memory dump',
          'Synthetic telemetry generated and assigned to Incident Response queue',
          JSON.stringify({ scenarioId, targetIncidentId: incId })
        ]
      );
      break;
    }

    case 'cloud_misconfiguration': {
      const incId = 'INC-2026-003';
      db.run(`UPDATE incidents SET status = 'Investigating', riskScore = 86 WHERE incidentId = ?`, [incId]);
      db.run(
        `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          `LOG-${Date.now().toString().slice(-4)}`,
          timestamp,
          'Scenario Activated: Cloud Misconfiguration (Exposed Storage & IAM Drift)',
          'SCENARIO_TRIGGER',
          incId,
          'Enforce immediate S3 bucket public lock and rotate service credentials',
          'Escalated to Cloud Security Engineering on-call',
          JSON.stringify({ scenarioId, targetIncidentId: incId })
        ]
      );
      break;
    }
  }

  saveDb(db);

  // Return the updated incident
  const targetId = DEMO_SCENARIOS.find(s => s.id === scenarioId)?.targetIncidentId || 'INC-2026-001';
  const stmt = db.prepare(`SELECT * FROM incidents WHERE incidentId = ?`);
  stmt.bind([targetId]);
  if (stmt.step()) {
    const row = stmt.getAsObject();
    stmt.free();
    return {
      incidentId: row.incidentId as string,
      title: row.title as string,
      description: row.description as string,
      severity: row.severity as any,
      riskScore: Number(row.riskScore),
      status: row.status as any,
      affectedUser: row.affectedUser as string,
      affectedAssets: JSON.parse(row.affectedAssets as string || '[]'),
      relatedEvents: JSON.parse(row.relatedEvents as string || '[]'),
      indicators: JSON.parse(row.indicators as string || '[]'),
      timeline: JSON.parse(row.timeline as string || '[]'),
      mitreTechniques: JSON.parse(row.mitreTechniques as string || '[]'),
      recommendations: JSON.parse(row.recommendations as string || '[]'),
      riskBreakdown: JSON.parse(row.riskBreakdown as string || '[]')
    };
  }
  stmt.free();
  return null;
}
