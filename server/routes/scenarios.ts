import { Router, Request, Response } from 'express';
import { getDb, saveDb, DEMO_SCENARIOS, triggerScenario, seedBaselineData } from '../db.js';

export const scenariosRouter = Router();

scenariosRouter.get('/', async (req: Request, res: Response) => {
  res.json({
    success: true,
    scenarios: DEMO_SCENARIOS
  });
});

const handleTrigger = async (req: Request, res: Response) => {
  try {
    const { scenarioId } = req.body;
    if (!scenarioId) {
      return res.status(400).json({ success: false, error: 'scenarioId is required' });
    }

    const matched = DEMO_SCENARIOS.find(s => s.id === scenarioId);
    if (!matched) {
      return res.status(404).json({ success: false, error: `Unknown scenario ${scenarioId}` });
    }

    const db = await getDb();
    const updatedIncident = triggerScenario(db, scenarioId);

    res.json({
      success: true,
      message: `Scenario "${matched.name}" successfully injected into SOC engine`,
      scenario: matched,
      incident: updatedIncident
    });
  } catch (error: any) {
    console.error('Error triggering scenario:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

scenariosRouter.post('/trigger', handleTrigger);
scenariosRouter.post('/run', handleTrigger);

scenariosRouter.post('/reset', async (req: Request, res: Response) => {
  try {
    const db = await getDb();
    seedBaselineData(db);
    saveDb(db);

    res.json({
      success: true,
      message: 'CyberSentinel X baseline synthetic defense state restored'
    });
  } catch (error: any) {
    console.error('Error resetting scenario baseline:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
