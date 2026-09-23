import { Router, Request, Response } from 'express';
import { getDb, saveDb, ThreatIndicator } from '../db.js';

export const threatIntelRouter = Router();

threatIntelRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { type, status, search } = req.query;

    let query = `SELECT * FROM threat_intel WHERE 1=1`;
    const params: any[] = [];

    if (type && type !== 'ALL') {
      query += ` AND type = ?`;
      params.push(type);
    }

    if (status && status !== 'ALL') {
      query += ` AND status = ?`;
      params.push(status);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (indicator LIKE ? OR source LIKE ? OR tags LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY confidence DESC`;

    const stmt = db.prepare(query);
    stmt.bind(params);

    const indicators: ThreatIndicator[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      indicators.push({
        id: row.id as string,
        indicator: row.indicator as string,
        type: row.type as any,
        status: row.status as any,
        confidence: Number(row.confidence),
        firstSeen: row.firstSeen as string,
        lastSeen: row.lastSeen as string,
        source: row.source as string,
        tags: JSON.parse((row.tags as string) || '[]')
      });
    }
    stmt.free();

    res.json({
      success: true,
      disclaimer: 'SYNTHETIC & DEMONSTRATION INTELLIGENCE ONLY: All IoCs and indicators are simulated for safe educational and defensive triage evaluation.',
      count: indicators.length,
      data: indicators
    });
  } catch (error: any) {
    console.error('Error fetching threat intel:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

threatIntelRouter.post('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { indicator, type, status = 'Suspicious', confidence = 80, source = 'Analyst Manual Ingestion (Synthetic)', tags = [] } = req.body;

    if (!indicator || !type) {
      return res.status(400).json({ success: false, error: 'Indicator and type are required' });
    }

    const id = `TI-${Date.now().toString().slice(-4)}`;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO threat_intel (id, indicator, type, status, confidence, firstSeen, lastSeen, source, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, indicator, type, status, Number(confidence), now, now, source, JSON.stringify(tags)]
    );

    saveDb(db);

    res.status(201).json({
      success: true,
      message: 'Synthetic indicator added to threat intel repository',
      data: { id, indicator, type, status, confidence, firstSeen: now, lastSeen: now, source, tags }
    });
  } catch (error: any) {
    console.error('Error creating indicator:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
