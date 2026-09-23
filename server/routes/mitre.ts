import { Router, Request, Response } from 'express';
import { getDb, MitreTechnique } from '../db.js';

export const mitreRouter = Router();

mitreRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { tactic, search } = req.query;

    let query = `SELECT * FROM mitre_techniques WHERE 1=1`;
    const params: any[] = [];

    if (tactic && tactic !== 'ALL') {
      query += ` AND tactic LIKE ?`;
      params.push(`%${tactic}%`);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (techniqueId LIKE ? OR techniqueName LIKE ? OR reason LIKE ? OR evidence LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term, term);
    }

    query += ` ORDER BY techniqueId ASC`;

    const stmt = db.prepare(query);
    stmt.bind(params);

    const techniques: MitreTechnique[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      techniques.push({
        techniqueId: row.techniqueId as string,
        techniqueName: row.techniqueName as string,
        tactic: row.tactic as string,
        reason: row.reason as string,
        evidence: row.evidence as string,
        detectionGuidance: row.detectionGuidance as string,
        mitigationGuidance: row.mitigationGuidance as string
      });
    }
    stmt.free();

    res.json({
      success: true,
      count: techniques.length,
      data: techniques
    });
  } catch (error: any) {
    console.error('Error fetching MITRE techniques:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
