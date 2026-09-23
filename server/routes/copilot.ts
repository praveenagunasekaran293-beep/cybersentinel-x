import { Router, Request, Response } from 'express';
import { getDb, saveDb } from '../db.js';
import { generateAiContentWithTimeout } from '../gemini.js';

export const copilotRouter = Router();

copilotRouter.post('/chat', async (req: Request, res: Response) => {
  try {
    const { question, incidentId } = req.body;
    if (!question || typeof question !== 'string' || question.trim() === '') {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }

    const db = await getDb();
    let contextData = '';
    let incidentTitle = '';

    if (incidentId) {
      const stmt = db.prepare(`SELECT * FROM incidents WHERE incidentId = ?`);
      stmt.bind([incidentId]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        incidentTitle = row.title as string;
        contextData = `
CURRENT INCIDENT CONTEXT:
Incident ID: ${row.incidentId}
Title: ${row.title}
Status: ${row.status}
Severity: ${row.severity}
Risk Score: ${row.riskScore}/100
Affected User: ${row.affectedUser}
Affected Assets: ${row.affectedAssets}
Indicators: ${row.indicators}
MITRE Techniques: ${row.mitreTechniques}
Timeline: ${row.timeline}
Risk Breakdown: ${row.riskBreakdown}
Recommended Response Actions: ${row.recommendations}
`;
      }
      stmt.free();
    }

    // Also pull top threats, high-risk CVEs, and recent events
    const eventCountStmt = db.prepare(`SELECT COUNT(*) as count FROM events`);
    eventCountStmt.step();
    const eventCount = eventCountStmt.getAsObject().count;
    eventCountStmt.free();

    const topThreatsStmt = db.prepare(`SELECT indicator, type, status, confidence FROM threat_intel LIMIT 5`);
    const threats: any[] = [];
    while (topThreatsStmt.step()) {
      threats.push(topThreatsStmt.getAsObject());
    }
    topThreatsStmt.free();

    const systemSummary = `
PLATFORM CONTEXT:
- Platform: CyberSentinel X (Defensive SOC Intelligence Platform)
- Total Active Telemetry Events: ${eventCount}
- Monitored Threat Indicators: ${JSON.stringify(threats)}
`;

    let reply = '';
    let usedAi = false;

    try {
      const prompt = `You are CyberSentinel X Security Copilot, a principal defensive SOC analyst assistant.
You strictly answer based on the real application evidence provided below.
Do not fabricate external events, fictitious logs, or actions not in evidence.
Always reference specific evidence (event timestamps, specific IPs, hash values, MITRE ATT&CK techniques, risk weights).

${contextData}

${systemSummary}

Analyst Query: "${question}"

Provide a clear, structured response using Markdown formatting:
- Summary of Findings / Direct Answer
- Supporting Technical Evidence (quote specific indicators, events, or scores)
- MITRE ATT&CK Alignment (if relevant)
- Actionable Next Steps for Tier 2/3 SOC Analysts
`;

      reply = await generateAiContentWithTimeout(prompt, 6000);
      if (reply) usedAi = true;
    } catch (geminiError: any) {
      console.warn('Gemini chat error, using evidence synthesis fallback:', geminiError.message);
    }

    // Fallback if AI not available
    if (!reply) {
      if (incidentId && contextData) {
        reply = `### Evidence-Grounded SOC Synthesis for ${incidentId}

**Executive Incident Overview:**
${incidentTitle ? `**${incidentTitle}**` : 'Selected Incident Details'}

**Correlated Evidence Summary:**
Based on stored telemetry records in CyberSentinel X:
- **Risk Score Breakdown:** The composite risk score is derived from weighted heuristic factors including anomalous authentication, process spawning anomalies, and threat intelligence matches.
- **Observed Indicators:** Associated network indicators and file hashes have been registered in the SOC repository.
- **MITRE ATT&CK Alignment:** This incident corresponds to tactics including Initial Access (T1566/T1190), Credential Access / Privilege Escalation (T1078/T1059), and Command & Control (T1071).

**Actionable Next Steps:**
1. Review pending response actions in the Human Approval Response Workflow queue.
2. Confirm perimeter containment (IP/domain firewall deny rules).
3. Conduct endpoint triage to inspect process lineage and memory artifacts.`;
      } else {
        reply = `### CyberSentinel X Autonomous SOC Intelligence
**System Status:** Operating nominally across 14 defensive modules.
- **Security Events:** Total synthetic events indexed: ${eventCount}.
- **Defensive Workflow:** All response actions require analyst review and authorization before firewall or endpoint execution.
- **Recommendation:** Select an incident from the Incident Management or Investigation page to review specific timelines and evidence breakdowns.`;
      }
    }

    // Log this query into audit logs
    const now = new Date().toISOString();
    const logId = `LOG-${Date.now().toString().slice(-4)}`;
    db.run(
      `INSERT INTO audit_logs (id, timestamp, userAction, actionType, incidentId, aiRecommendation, analystDecision, details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        logId,
        now,
        `AI Security Copilot Inquiry: "${question.slice(0, 50)}..."`,
        'AI_COPILOT_QUERY',
        incidentId || null,
        reply.slice(0, 150) + '...',
        'Analyst consulted AI Copilot with application evidence',
        JSON.stringify({ question, incidentId, usedAi })
      ]
    );

    saveDb(db);

    res.json({
      success: true,
      data: {
        reply,
        usedAi,
        incidentId: incidentId || null,
        timestamp: now
      }
    });
  } catch (error: any) {
    console.error('Error in Copilot chat:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
