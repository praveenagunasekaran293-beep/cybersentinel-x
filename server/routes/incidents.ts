import { Router, Request, Response } from 'express';
import { getDb, saveDb, IncidentRecord } from '../db.js';

export const incidentsRouter = Router();

incidentsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { status, severity, search } = req.query;

    let query = `SELECT * FROM incidents WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (severity && severity !== 'ALL') {
      query += ` AND severity = ?`;
      params.push(severity);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (title LIKE ? OR description LIKE ? OR affectedUser LIKE ? OR incidentId LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY riskScore DESC`;

    const stmt = db.prepare(query);
    stmt.bind(params);

    const incidents: IncidentRecord[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      incidents.push({
        incidentId: row.incidentId as string,
        title: row.title as string,
        description: row.description as string,
        severity: row.severity as any,
        riskScore: Number(row.riskScore),
        status: row.status as any,
        affectedUser: row.affectedUser as string,
        affectedAssets: JSON.parse((row.affectedAssets as string) || '[]'),
        relatedEvents: JSON.parse((row.relatedEvents as string) || '[]'),
        indicators: JSON.parse((row.indicators as string) || '[]'),
        timeline: JSON.parse((row.timeline as string) || '[]'),
        mitreTechniques: JSON.parse((row.mitreTechniques as string) || '[]'),
        recommendations: JSON.parse((row.recommendations as string) || '[]'),
        riskBreakdown: JSON.parse((row.riskBreakdown as string) || '[]')
      });
    }
    stmt.free();

    res.json({ success: true, count: incidents.length, data: incidents });
  } catch (error: any) {
    console.error('Error fetching incidents:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

incidentsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const stmt = db.prepare(`SELECT * FROM incidents WHERE incidentId = ?`);
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const row = stmt.getAsObject();
    stmt.free();

    const incident: IncidentRecord = {
      incidentId: row.incidentId as string,
      title: row.title as string,
      description: row.description as string,
      severity: row.severity as any,
      riskScore: Number(row.riskScore),
      status: row.status as any,
      affectedUser: row.affectedUser as string,
      affectedAssets: JSON.parse((row.affectedAssets as string) || '[]'),
      relatedEvents: JSON.parse((row.relatedEvents as string) || '[]'),
      indicators: JSON.parse((row.indicators as string) || '[]'),
      timeline: JSON.parse((row.timeline as string) || '[]'),
      mitreTechniques: JSON.parse((row.mitreTechniques as string) || '[]'),
      recommendations: JSON.parse((row.recommendations as string) || '[]'),
      riskBreakdown: JSON.parse((row.riskBreakdown as string) || '[]')
    };

    res.json({ success: true, data: incident });
  } catch (error: any) {
    console.error('Error fetching incident detail:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

incidentsRouter.get('/:id/timeline', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;

    const stmt = db.prepare(`SELECT timeline, title, incidentId FROM incidents WHERE incidentId = ?`);
    stmt.bind([id]);

    if (!stmt.step()) {
      stmt.free();
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const row = stmt.getAsObject();
    stmt.free();

    res.json({
      success: true,
      incidentId: row.incidentId,
      title: row.title,
      timeline: JSON.parse((row.timeline as string) || '[]')
    });
  } catch (error: any) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

incidentsRouter.patch('/:id/status', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { status, analystNotes = 'Status updated by SOC Analyst' } = req.body;

    const validStatuses = ['Open', 'Investigating', 'Resolved', 'Closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid incident status' });
    }

    const checkStmt = db.prepare(`SELECT status, title FROM incidents WHERE incidentId = ?`);
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }
    const oldStatus = checkStmt.getAsObject().status as string;
    const incidentTitle = checkStmt.getAsObject().title as string;
    checkStmt.free();

    db.run(`UPDATE incidents SET status = ? WHERE incidentId = ?`, [status, id]);

    // Record into Audit Log
    const timestamp = new Date().toISOString();
    const logId = `LOG-${Date.now().toString().slice(-4)}`;
    db.run(
      `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        timestamp,
        `Status Changed to ${status}`,
        'STATUS_CHANGE',
        id,
        null,
        `${analystNotes} (Previous: ${oldStatus} -> New: ${status})`,
        JSON.stringify({ incidentTitle, previousStatus: oldStatus, newStatus: status })
      ]
    );

    saveDb(db);

    res.json({
      success: true,
      message: `Incident ${id} updated to ${status}`,
      incidentId: id,
      newStatus: status
    });
  } catch (error: any) {
    console.error('Error updating incident status:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
