import { Router, Request, Response } from 'express';
import { getDb, saveDb, ResponseAction } from '../db.js';

export const actionsRouter = Router();

actionsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { status, incidentId } = req.query;

    let query = `SELECT * FROM response_actions WHERE 1=1`;
    const params: any[] = [];

    if (status && status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (incidentId) {
      query += ` AND incidentId = ?`;
      params.push(incidentId);
    }

    query += ` ORDER BY CASE status WHEN 'PENDING_REVIEW' THEN 1 WHEN 'APPROVED' THEN 2 ELSE 3 END, id DESC`;

    const stmt = db.prepare(query);
    stmt.bind(params);

    const actions: ResponseAction[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      actions.push({
        id: row.id as string,
        incidentId: row.incidentId as string,
        title: row.title as string,
        description: row.description as string,
        actionType: row.actionType as any,
        status: row.status as any,
        recommendedBy: row.recommendedBy as string,
        rationale: row.rationale as string,
        reviewedBy: (row.reviewedBy as string) || null,
        reviewedAt: (row.reviewedAt as string) || null,
        reviewNotes: (row.reviewNotes as string) || null
      });
    }
    stmt.free();

    res.json({
      success: true,
      governanceNotice: 'HUMAN APPROVAL REQUIRED: Under strict SOC defensive protocols, AI recommends response actions, but execution requires human analyst verification and authorization.',
      count: actions.length,
      data: actions
    });
  } catch (error: any) {
    console.error('Error fetching response actions:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

actionsRouter.post('/:id/review', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { id } = req.params;
    const { decision, analystName = 'P. Gunasekaran (Senior SOC Analyst)', notes = '' } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(decision)) {
      return res.status(400).json({ success: false, error: 'Decision must be APPROVED or REJECTED' });
    }

    const checkStmt = db.prepare(`SELECT * FROM response_actions WHERE id = ?`);
    checkStmt.bind([id]);
    if (!checkStmt.step()) {
      checkStmt.free();
      return res.status(404).json({ success: false, error: 'Action not found' });
    }
    const action = checkStmt.getAsObject();
    checkStmt.free();

    const now = new Date().toISOString();
    const newStatus = decision;

    db.run(
      `UPDATE response_actions SET status = ?, reviewedBy = ?, reviewedAt = ?, reviewNotes = ? WHERE id = ?`,
      [newStatus, analystName, now, notes, id]
    );

    // Write to Audit Log
    const logId = `LOG-${Date.now().toString().slice(-4)}`;
    db.run(
      `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        now,
        `Analyst Review: ${action.title}`,
        decision === 'APPROVED' ? 'HUMAN_APPROVAL' : 'HUMAN_REJECTION',
        action.incidentId as string,
        action.recommendedBy as string,
        `${decision}: ${notes || 'Analyst verified containment step'}`,
        JSON.stringify({
          actionId: id,
          actionType: action.actionType,
          decision,
          analyst: analystName,
          notes
        })
      ]
    );

    saveDb(db);

    res.json({
      success: true,
      message: `Action ${id} successfully ${decision.toLowerCase()} by analyst`,
      data: {
        id,
        status: newStatus,
        reviewedBy: analystName,
        reviewedAt: now,
        reviewNotes: notes
      }
    });
  } catch (error: any) {
    console.error('Error reviewing action:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
