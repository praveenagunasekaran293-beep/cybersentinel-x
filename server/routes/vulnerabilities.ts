import { Router, Request, Response } from 'express';
import { getDb, saveDb, VulnerabilityRecord } from '../db.js';

export const vulnerabilitiesRouter = Router();

vulnerabilitiesRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { severity, remediationStatus, search } = req.query;

    let query = `SELECT * FROM vulnerabilities WHERE 1=1`;
    const params: any[] = [];

    if (severity && severity !== 'ALL') {
      query += ` AND severity = ?`;
      params.push(severity);
    }

    if (remediationStatus && remediationStatus !== 'ALL') {
      query += ` AND remediationStatus = ?`;
      params.push(remediationStatus);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (cveId LIKE ? OR asset LIKE ? OR description LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY cvss DESC`;

    const stmt = db.prepare(query);
    stmt.bind(params);

    const vulns: VulnerabilityRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      vulns.push({
        cveId: row.cveId as string,
        asset: row.asset as string,
        severity: row.severity as any,
        cvss: Number(row.cvss),
        exposure: row.exposure as any,
        assetImportance: row.assetImportance as any,
        priority: row.priority as any,
        remediationStatus: row.remediationStatus as any,
        description: row.description as string,
        patchGuidance: row.patchGuidance as string
      });
    }
    stmt.free();

    res.json({
      success: true,
      prioritizationExplanation: 'CyberSentinel X assigns remediation priority based on a composite multi-factor formula: [CVSS Base Severity (40%)] + [Exposure Vector: Public Edge vs Internal (30%)] + [Asset Criticality Tier (30%)]. A CVSS 9.0+ vulnerability on a Tier 1 Public Edge appliance escalates immediately to P0 - Emergency.',
      count: vulns.length,
      data: vulns
    });
  } catch (error: any) {
    console.error('Error fetching vulnerabilities:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

vulnerabilitiesRouter.patch('/:cveId/status', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { cveId } = req.params;
    const { status, analyst = 'Analyst: P. Gunasekaran' } = req.body;

    const validStatuses = ['Unpatched', 'In Progress', 'Patch Available', 'Resolved', 'Mitigated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid remediation status' });
    }

    db.run(`UPDATE vulnerabilities SET remediationStatus = ? WHERE cveId = ?`, [status, cveId]);

    // Audit log
    const timestamp = new Date().toISOString();
    db.run(
      `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        `LOG-${Date.now().toString().slice(-4)}`,
        timestamp,
        `Vulnerability Remediation Update: ${cveId}`,
        'STATUS_CHANGE',
        null,
        null,
        `Status updated to ${status} by ${analyst}`,
        JSON.stringify({ cveId, newStatus: status })
      ]
    );

    saveDb(db);

    res.json({ success: true, message: `Vulnerability ${cveId} marked as ${status}` });
  } catch (error: any) {
    console.error('Error updating vulnerability status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
