import { Router, Request, Response } from 'express';
import { getDb, AuditLogEntry } from '../db.js';

export const auditLogsRouter = Router();

auditLogsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { actionType, incidentId, search } = req.query;

    let query = `SELECT * FROM audit_logs WHERE 1=1`;
    const params: any[] = [];

    if (actionType && actionType !== 'ALL') {
      query += ` AND actionType = ?`;
      params.push(actionType);
    }

    if (incidentId) {
      query += ` AND incidentId = ?`;
      params.push(incidentId);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (userAction LIKE ? OR analystDecision LIKE ? OR aiRecommendation LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY timestamp DESC LIMIT 100`;

    const stmt = db.prepare(query);
    stmt.bind(params);

    const logs: AuditLogEntry[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      logs.push({
        id: row.id as string,
        timestamp: row.timestamp as string,
        userAction: row.userAction as string,
        actionType: row.actionType as any,
        incidentId: (row.incidentId as string) || null,
        aiRecommendation: (row.aiRecommendation as string) || null,
        analystDecision: (row.analystDecision as string) || null,
        details: JSON.parse((row.details as string) || '{}')
      });
    }
    stmt.free();

    res.json({
      success: true,
      count: logs.length,
      data: logs
    });
  } catch (error: any) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
