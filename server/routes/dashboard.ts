import { Router, Request, Response } from 'express';
import { getDb } from '../db.js';

export const dashboardRouter = Router();

dashboardRouter.get('/stats', async (req: Request, res: Response) => {
  try {
    const db = await getDb();

    // KPI Counters
    const totalEventsStmt = db.prepare(`SELECT COUNT(*) as count FROM events`);
    totalEventsStmt.step();
    const totalEvents = (totalEventsStmt.getAsObject().count as number) || 0;
    totalEventsStmt.free();

    const criticalIncidentsStmt = db.prepare(`SELECT COUNT(*) as count FROM incidents WHERE severity = 'Critical'`);
    criticalIncidentsStmt.step();
    const criticalIncidents = (criticalIncidentsStmt.getAsObject().count as number) || 0;
    criticalIncidentsStmt.free();

    const highRiskIncidentsStmt = db.prepare(`SELECT COUNT(*) as count FROM incidents WHERE riskScore >= 75`);
    highRiskIncidentsStmt.step();
    const highRiskIncidents = (highRiskIncidentsStmt.getAsObject().count as number) || 0;
    highRiskIncidentsStmt.free();

    const suspiciousEventsStmt = db.prepare(`SELECT COUNT(*) as count FROM events WHERE severity IN ('High', 'Critical')`);
    suspiciousEventsStmt.step();
    const suspiciousEvents = (suspiciousEventsStmt.getAsObject().count as number) || 0;
    suspiciousEventsStmt.free();

    const openIncidentsStmt = db.prepare(`SELECT COUNT(*) as count FROM incidents WHERE status IN ('Open', 'Investigating')`);
    openIncidentsStmt.step();
    const openIncidents = (openIncidentsStmt.getAsObject().count as number) || 0;
    openIncidentsStmt.free();

    const vulnerabilitiesStmt = db.prepare(`SELECT COUNT(*) as count FROM vulnerabilities WHERE remediationStatus != 'Resolved'`);
    vulnerabilitiesStmt.step();
    const vulnerabilities = (vulnerabilitiesStmt.getAsObject().count as number) || 0;
    vulnerabilitiesStmt.free();

    // Events over time (synthetic hourly distribution)
    const eventsOverTime = [
      { time: '04:00', events: 14, blocked: 3 },
      { time: '05:00', events: 22, blocked: 6 },
      { time: '06:00', events: 35, blocked: 8 },
      { time: '07:00', events: 58, blocked: 14 },
      { time: '08:00', events: 112, blocked: 34 },
      { time: '09:00', events: 148, blocked: 42 },
      { time: '10:00', events: 96, blocked: 26 },
      { time: '11:00', events: 84, blocked: 19 },
      { time: '12:00', events: 72, blocked: 15 }
    ];

    // Severity distribution
    const sevStmt = db.prepare(`SELECT severity, COUNT(*) as count FROM incidents GROUP BY severity`);
    const severityMap: Record<string, number> = { Critical: 0, High: 0, Medium: 0, Low: 0 };
    while (sevStmt.step()) {
      const row = sevStmt.getAsObject();
      if (row.severity && typeof row.severity === 'string') {
        severityMap[row.severity] = (row.count as number) || 0;
      }
    }
    sevStmt.free();

    const severityDistribution = [
      { name: 'Critical', value: severityMap.Critical, color: '#ef4444' },
      { name: 'High', value: severityMap.High, color: '#f97316' },
      { name: 'Medium', value: severityMap.Medium, color: '#eab308' },
      { name: 'Low', value: severityMap.Low, color: '#06b6d4' }
    ];

    // Incident categories
    const incidentCategories = [
      { category: 'Account Takeover / Phishing', count: 4 },
      { category: 'Perimeter Vulnerability', count: 3 },
      { category: 'Cloud IAM / Storage Drift', count: 2 },
      { category: 'Network C2 & Tunneling', count: 2 },
      { category: 'Host Process Hollowing', count: 1 }
    ];

    // Threat activity by type
    const tiStmt = db.prepare(`SELECT type, COUNT(*) as count FROM threat_intel GROUP BY type`);
    const threatActivity: Array<{ type: string; count: number }> = [];
    while (tiStmt.step()) {
      const row = tiStmt.getAsObject();
      threatActivity.push({ type: row.type as string, count: row.count as number });
    }
    tiStmt.free();

    // MITRE technique distribution
    const mitreDistribution = [
      { technique: 'T1566 Phishing', count: 8 },
      { technique: 'T1078 Valid Accounts', count: 7 },
      { technique: 'T1059 Command Interp.', count: 5 },
      { technique: 'T1190 Exploit Perimeter', count: 4 },
      { technique: 'T1530 Cloud Storage', count: 3 },
      { technique: 'T1071 Web C2', count: 3 }
    ];

    // Recent Incidents Table
    const recentIncidentsStmt = db.prepare(`SELECT incidentId, title, severity, riskScore, status, affectedUser FROM incidents ORDER BY riskScore DESC LIMIT 6`);
    const recentIncidents: any[] = [];
    while (recentIncidentsStmt.step()) {
      const row = recentIncidentsStmt.getAsObject();
      recentIncidents.push({
        incidentId: row.incidentId,
        title: row.title,
        severity: row.severity,
        riskScore: row.riskScore,
        status: row.status,
        affectedUser: row.affectedUser,
        timestamp: '2026-09-22 08:30 UTC'
      });
    }
    recentIncidentsStmt.free();

    res.json({
      success: true,
      data: {
        kpis: {
          totalEvents,
          criticalIncidents,
          highRiskIncidents,
          suspiciousEvents,
          openIncidents,
          vulnerabilities
        },
        charts: {
          eventsOverTime,
          severityDistribution,
          incidentCategories,
          threatActivity,
          mitreDistribution
        },
        recentIncidents
      }
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
