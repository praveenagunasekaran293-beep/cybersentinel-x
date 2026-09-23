import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { dashboardRouter } from './server/routes/dashboard.js';
import { eventsRouter } from './server/routes/events.js';
import { incidentsRouter } from './server/routes/incidents.js';
import { threatIntelRouter } from './server/routes/threatIntel.js';
import { vulnerabilitiesRouter } from './server/routes/vulnerabilities.js';
import { mitreRouter } from './server/routes/mitre.js';
import { actionsRouter } from './server/routes/actions.js';
import { auditLogsRouter } from './server/routes/auditLogs.js';
import { scenariosRouter } from './server/routes/scenarios.js';
import { analyzerRouter } from './server/routes/analyzer.js';
import { copilotRouter } from './server/routes/copilot.js';
import { getDb } from './server/db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json({ limit: '5mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Initialize SQLite database
  await getDb();

  // API Routes
  app.use('/api/dashboard', dashboardRouter);
  app.use('/api/events', eventsRouter);
  app.use('/api/incidents', incidentsRouter);
  app.use('/api/threat-intel', threatIntelRouter);
  app.use('/api/vulnerabilities', vulnerabilitiesRouter);
  app.use('/api/mitre', mitreRouter);
  app.use('/api/response-actions', actionsRouter);
  app.use('/api/audit-logs', auditLogsRouter);
  app.use('/api/scenarios', scenariosRouter);
  app.use('/api/analyze', analyzerRouter);
  app.use('/api/copilot', copilotRouter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'healthy',
      platform: 'CyberSentinel X',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });

  // Vite integration
  if (!isProduction) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`[CyberSentinel X] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal error starting CyberSentinel X server:', err);
  process.exit(1);
});
