import { Router, Request, Response } from 'express';
import { getDb, saveDb, SecurityEvent } from '../db.js';

export const eventsRouter = Router();

eventsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const { search, severity, sourceType, limit = 50 } = req.query;

    let query = `SELECT * FROM events WHERE 1=1`;
    const params: any[] = [];

    if (severity && severity !== 'ALL') {
      query += ` AND severity = ?`;
      params.push(severity);
    }

    if (sourceType && sourceType !== 'ALL') {
      query += ` AND sourceType = ?`;
      params.push(sourceType);
    }

    if (search && typeof search === 'string' && search.trim() !== '') {
      query += ` AND (description LIKE ? OR user LIKE ? OR ip LIKE ? OR hostname LIKE ? OR eventType LIKE ?)`;
      const searchParam = `%${search.trim()}%`;
      params.push(searchParam, searchParam, searchParam, searchParam, searchParam);
    }

    query += ` ORDER BY timestamp DESC LIMIT ?`;
    params.push(Number(limit) || 50);

    const stmt = db.prepare(query);
    stmt.bind(params);

    const events: SecurityEvent[] = [];
    while (stmt.step()) {
      const row = stmt.getAsObject();
      events.push({
        eventId: row.eventId as string,
        timestamp: row.timestamp as string,
        source: row.source as string,
        sourceType: row.sourceType as string,
        user: row.user as string,
        ip: row.ip as string,
        hostname: row.hostname as string,
        eventType: row.eventType as string,
        description: row.description as string,
        severity: row.severity as any,
        indicators: JSON.parse((row.indicators as string) || '[]'),
        metadata: JSON.parse((row.metadata as string) || '{}')
      });
    }
    stmt.free();

    res.json({ success: true, count: events.length, data: events });
  } catch (error: any) {
    console.error('Error fetching security events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

eventsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const {
      source = 'Custom-Synthetic-Sensor',
      sourceType = 'Custom',
      user = 'analyst@enterprise.local',
      ip = '192.0.2.1',
      hostname = 'SEC-SIM-HOST',
      eventType = 'SIMULATED_ALERT',
      description,
      severity = 'Medium',
      indicators = [],
      metadata = {}
    } = req.body;

    if (!description) {
      return res.status(400).json({ success: false, error: 'Description is required' });
    }

    const eventId = `EVT-${Date.now().toString().slice(-6)}`;
    const timestamp = new Date().toISOString();

    db.run(
      `INSERT INTO events (eventId, timestamp, source, sourceType, user, ip, hostname, eventType, description, severity, indicators, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        eventId,
        timestamp,
        source,
        sourceType,
        user,
        ip,
        hostname,
        eventType,
        description,
        severity,
        JSON.stringify(indicators),
        JSON.stringify(metadata)
      ]
    );

    saveDb(db);

    res.status(201).json({
      success: true,
      data: {
        eventId,
        timestamp,
        source,
        sourceType,
        user,
        ip,
        hostname,
        eventType,
        description,
        severity,
        indicators,
        metadata
      }
    });
  } catch (error: any) {
    console.error('Error creating security event:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

eventsRouter.post('/load-demo', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    const timestamp = new Date().toISOString();
    const batch = [
      {
        eventId: `EVT-${Date.now().toString().slice(-4)}-1`,
        timestamp,
        source: 'AzureAD-Audit',
        sourceType: 'Identity',
        user: 'finance-admin@enterprise.local',
        ip: '198.51.100.18',
        hostname: 'login.microsoftonline.com',
        eventType: 'SUSPICIOUS_ADMIN_CONSENT',
        description: 'Multi-tenant third-party application granted Mail.ReadWrite permissions by global admin',
        severity: 'Critical',
        indicators: ['198.51.100.18', 'AppId: 9814-fb12'],
        metadata: { clientApp: 'SyncAssistantPro', scopeCount: 4 }
      },
      {
        eventId: `EVT-${Date.now().toString().slice(-4)}-2`,
        timestamp,
        source: 'Cisco-Umbrella',
        sourceType: 'Network',
        user: 'b.carter@enterprise.local',
        ip: '10.0.5.21',
        hostname: 'WS-ENG-088',
        eventType: 'CRYPTO_MINING_POOL_BLOCKED',
        description: 'DNS query to stratum+tcp://xmr-eu.crypto-pool.org intercepted by DNS security resolver',
        severity: 'High',
        indicators: ['xmr-eu.crypto-pool.org', '10.0.5.21'],
        metadata: { port: 3333, category: 'Mining' }
      },
      {
        eventId: `EVT-${Date.now().toString().slice(-4)}-3`,
        timestamp,
        source: 'GitHub-Enterprise-Audit',
        sourceType: 'Cloud',
        user: 'contractor-dev',
        ip: '203.0.113.14',
        hostname: 'github.enterprise.com',
        eventType: 'SECRET_COMMITTED_TO_REPO',
        description: 'Hardcoded AWS production secret key detected by automated pre-receive secret scanning hook',
        severity: 'High',
        indicators: ['AKIAIOSFODNN7EXAMPLE', 'repo: core-billing-engine'],
        metadata: { commitSha: '3f890b2', branch: 'feature/payment-v2' }
      }
    ];

    for (const ev of batch) {
      db.run(
        `INSERT INTO events (eventId, timestamp, source, sourceType, user, ip, hostname, eventType, description, severity, indicators, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [ev.eventId, ev.timestamp, ev.source, ev.sourceType, ev.user, ev.ip, ev.hostname, ev.eventType, ev.description, ev.severity, JSON.stringify(ev.indicators), JSON.stringify(ev.metadata)]
      );
    }

    saveDb(db);
    res.json({ success: true, message: `Loaded ${batch.length} synthetic security events` });
  } catch (error: any) {
    console.error('Error loading demo events:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
