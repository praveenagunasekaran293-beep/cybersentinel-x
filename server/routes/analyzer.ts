import { Router, Request, Response } from 'express';
import { generateAiContentWithTimeout } from '../gemini.js';

export const analyzerRouter = Router();

// ==================== PHISHING ANALYZER ====================
analyzerRouter.post('/phishing', async (req: Request, res: Response) => {
  try {
    const { emailText } = req.body;
    if (!emailText || typeof emailText !== 'string' || emailText.trim() === '') {
      return res.status(400).json({ success: false, error: 'Email text is required for analysis' });
    }

    const text = emailText.trim();

    // 1. Local Security Heuristic Extraction & Checks
    // Extract From/Sender
    const fromMatch = text.match(/(?:From|Sender):\s*([^\r\n]+)/i);
    const rawSender = fromMatch ? fromMatch[1].trim() : 'Unspecified Sender Header';
    
    // Extract Subject
    const subjectMatch = text.match(/Subject:\s*([^\r\n]+)/i);
    const rawSubject = subjectMatch ? subjectMatch[1].trim() : 'Unspecified Subject';

    // Extract URLs
    const urlRegex = /(https?:\/\/[^\s<>"'\)]+|www\.[^\s<>"'\)]+)/gi;
    const extractedUrls = Array.from(new Set(text.match(urlRegex) || []));

    // Urgency Language Keywords
    const urgencyKeywords = [
      'urgent', 'immediate action', 'within 24 hours', 'account suspended', 'suspended',
      'terminate', 'unauthorized access', 'security alert', 'action required', 'immediately',
      'final notice', 'expires today', 'locked out'
    ];
    const detectedUrgency: string[] = [];
    for (const kw of urgencyKeywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
        detectedUrgency.push(kw);
      }
    }

    // Credential Request Keywords
    const credentialKeywords = [
      'password', 'verify your account', 'confirm your identity', 'log in', 'login', 'sign in',
      'update payment', 'social security', 'ssn', 'pin code', 'bank credentials', 'click here to verify',
      're-authenticate'
    ];
    const detectedCredentials: string[] = [];
    for (const kw of credentialKeywords) {
      if (new RegExp(`\\b${kw}\\b`, 'i').test(text)) {
        detectedCredentials.push(kw);
      }
    }

    // Domain mismatch checks
    let domainMismatchDetected = false;
    let senderDomain = '';
    const emailAddrMatch = rawSender.match(/<([^>]+)>|([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
    if (emailAddrMatch) {
      const email = emailAddrMatch[1] || emailAddrMatch[2];
      senderDomain = email.split('@')[1]?.toLowerCase() || '';
    }

    for (const u of extractedUrls) {
      try {
        const fullUrl = u.startsWith('http') ? u : `http://${u}`;
        const parsed = new URL(fullUrl);
        if (senderDomain && !parsed.hostname.toLowerCase().includes(senderDomain) && !senderDomain.includes(parsed.hostname.toLowerCase())) {
          domainMismatchDetected = true;
        }
      } catch (e) {
        // invalid URL format
      }
    }

    // Social Engineering Indicators
    const socialEngIndicators: string[] = [];
    if (/payroll|direct deposit|salary|bonus|invoice|wire transfer/i.test(text)) {
      socialEngIndicators.push('Financial lure targeting compensation / payroll');
    }
    if (/it support|helpdesk|system administrator|microsoft|google admin/i.test(text)) {
      socialEngIndicators.push('Authority impersonation (IT Support / Corporate Admin)');
    }
    if (detectedUrgency.length > 0) {
      socialEngIndicators.push(`Artificial time-pressure / urgency coercing quick click (${detectedUrgency.join(', ')})`);
    }
    if (detectedCredentials.length > 0) {
      socialEngIndicators.push(`Solicitation of sensitive authentication factors (${detectedCredentials.join(', ')})`);
    }

    // Calculate Heuristic Risk Score
    let heuristicScore = 15; // baseline
    const reasons: string[] = [];

    if (detectedUrgency.length > 0) {
      heuristicScore += Math.min(30, detectedUrgency.length * 10);
      reasons.push(`Contains high-pressure urgency triggers (${detectedUrgency.slice(0, 3).join(', ')})`);
    }

    if (detectedCredentials.length > 0) {
      heuristicScore += Math.min(30, detectedCredentials.length * 10);
      reasons.push(`Explicitly prompts recipient to enter or confirm authentication credentials`);
    }

    if (domainMismatchDetected) {
      heuristicScore += 25;
      reasons.push(`Domain mismatch detected between sender identity (${senderDomain || 'N/A'}) and embedded hyperlinks`);
    }

    if (extractedUrls.some(u => !u.startsWith('https://') || /verify|login|auth|update/i.test(u))) {
      heuristicScore += 15;
      reasons.push('Hyperlink contains insecure protocol or suspicious authentication landing page keywords');
    }

    heuristicScore = Math.min(100, Math.max(5, heuristicScore));

    let classification: 'Phishing / High Confidence' | 'Suspicious / Medium Risk' | 'Legitimate / Low Risk' = 'Legitimate / Low Risk';
    if (heuristicScore >= 75) {
      classification = 'Phishing / High Confidence';
    } else if (heuristicScore >= 45) {
      classification = 'Suspicious / Medium Risk';
    }

    const recommendedInvestigation = [
      'Search mail gateway logs for all internal recipients of this sender address and subject',
      'Inspect web proxy logs for any endpoint click-throughs to embedded URLs',
      'Submit embedded URLs and message headers to internal sandbox repository',
      'If recipient clicked or submitted credentials, trigger immediate identity token revocation and password reset'
    ];

    // Check if Gemini can enrich
    let aiExplanation = '';
    try {
      const prompt = `You are a Senior SOC Intelligence Analyst examining a defensive phishing email sample.
Email Content:
---
${text.slice(0, 2000)}
---

Extracted Heuristics:
- Sender: ${rawSender}
- Subject: ${rawSubject}
- Extracted URLs: ${extractedUrls.join(', ') || 'None'}
- Urgency cues: ${detectedUrgency.join(', ') || 'None'}
- Credential indicators: ${detectedCredentials.join(', ') || 'None'}
- Domain mismatch: ${domainMismatchDetected ? 'Yes' : 'No'}

Provide a 2-3 paragraph professional SOC assessment covering:
1. Adversary intent & psychological pretext (social engineering vectors)
2. Technical IoCs observed
3. Recommended containment actions for Tier 1 / Tier 2 analysts.
Ground your response exclusively on the provided text.`;

      aiExplanation = await generateAiContentWithTimeout(prompt, 5000);
    } catch (err: any) {
      console.warn('Gemini phishing analysis fallback:', err.message);
    }

    res.json({
      success: true,
      analysis: {
        classification,
        riskScore: heuristicScore,
        sender: rawSender,
        subject: rawSubject,
        extractedUrls,
        detectedUrgency,
        detectedCredentials,
        domainMismatchDetected,
        socialEngineeringIndicators: socialEngIndicators,
        reasons,
        recommendedInvestigation,
        aiExplanation: aiExplanation || 'Heuristic engine processed sample based on enterprise email defense models.'
      }
    });
  } catch (error: any) {
    console.error('Error analyzing phishing email:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ==================== URL ANALYZER ====================
analyzerRouter.post('/url', async (req: Request, res: Response) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== 'string' || url.trim() === '') {
      return res.status(400).json({ success: false, error: 'URL is required' });
    }

    const inputUrl = url.trim();

    // Parse URL safely
    let parsedUrl: URL | null = null;
    try {
      parsedUrl = new URL(inputUrl.startsWith('http://') || inputUrl.startsWith('https://') ? inputUrl : `http://${inputUrl}`);
    } catch (e) {
      // If parsing fails completely
      return res.status(400).json({ success: false, error: 'Malformed URL format' });
    }

    const checks: Array<{
      check: string;
      status: 'SAFE' | 'WARNING' | 'CRITICAL';
      details: string;
      scoreDelta: number;
    }> = [];

    let riskScore = 10; // Baseline

    // Check 1: HTTPS vs HTTP
    const isHttps = parsedUrl.protocol === 'https:';
    if (!isHttps) {
      checks.push({
        check: 'Protocol Security',
        status: 'WARNING',
        details: 'Uses unencrypted HTTP protocol; vulnerable to credential interception or tampering.',
        scoreDelta: 20
      });
      riskScore += 20;
    } else {
      checks.push({
        check: 'Protocol Security',
        status: 'SAFE',
        details: 'Uses encrypted HTTPS transport.',
        scoreDelta: 0
      });
    }

    // Check 2: IP-based URL
    const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
    const isIpBased = ipv4Regex.test(parsedUrl.hostname);
    if (isIpBased) {
      checks.push({
        check: 'IP-Based Hostname',
        status: 'CRITICAL',
        details: `Direct IP address destination (${parsedUrl.hostname}) detected, commonly used to bypass domain reputation blocklists.`,
        scoreDelta: 35
      });
      riskScore += 35;
    } else {
      checks.push({
        check: 'IP-Based Hostname',
        status: 'SAFE',
        details: 'URL resolves via standard Fully Qualified Domain Name (FQDN).',
        scoreDelta: 0
      });
    }

    // Check 3: Length Analysis
    const urlLength = inputUrl.length;
    if (urlLength > 120) {
      checks.push({
        check: 'URL Length Anomaly',
        status: 'WARNING',
        details: `Abnormally long URL (${urlLength} characters); often used to conceal malicious payload or token injections.`,
        scoreDelta: 15
      });
      riskScore += 15;
    } else if (urlLength > 75) {
      checks.push({
        check: 'URL Length Anomaly',
        status: 'WARNING',
        details: `Elevated URL length (${urlLength} characters).`,
        scoreDelta: 5
      });
      riskScore += 5;
    } else {
      checks.push({
        check: 'URL Length Anomaly',
        status: 'SAFE',
        details: `Standard URL length (${urlLength} characters).`,
        scoreDelta: 0
      });
    }

    // Check 4: Suspicious Characters & Hex/Percent Encoded anomalies
    const hasAtSign = inputUrl.includes('@');
    const hasExcessivePercents = (inputUrl.match(/%/g) || []).length > 3;
    const hasDoubleSlashInPath = parsedUrl.pathname.includes('//');
    if (hasAtSign || hasExcessivePercents || hasDoubleSlashInPath) {
      const anomalies = [];
      if (hasAtSign) anomalies.push('@ symbol (credential redirection trick)');
      if (hasExcessivePercents) anomalies.push('excessive percent-encoding obfuscation');
      if (hasDoubleSlashInPath) anomalies.push('consecutive slashes in URI path');

      checks.push({
        check: 'Syntactic & Character Obfuscation',
        status: 'CRITICAL',
        details: `Detected structural obfuscation patterns: ${anomalies.join(', ')}.`,
        scoreDelta: 25
      });
      riskScore += 25;
    } else {
      checks.push({
        check: 'Syntactic & Character Obfuscation',
        status: 'SAFE',
        details: 'No URL encoding obfuscation or authority confusion characters detected.',
        scoreDelta: 0
      });
    }

    // Check 5: Unusual Subdomains & Keywords
    const subdomainParts = parsedUrl.hostname.split('.');
    const suspiciousSubdomainKeywords = ['login', 'verify', 'secure', 'account', 'banking', 'update', 'portal', 'auth', 'signin', 'support'];
    const matchedKeywords = suspiciousSubdomainKeywords.filter(kw => parsedUrl!.hostname.toLowerCase().includes(kw));

    if (subdomainParts.length >= 4) {
      checks.push({
        check: 'Subdomain Depth & Structure',
        status: 'WARNING',
        details: `Multi-level nested subdomains (${subdomainParts.length} levels) indicative of dynamic DNS or cloud tenant spoofing.`,
        scoreDelta: 15
      });
      riskScore += 15;
    } else if (matchedKeywords.length > 0 && !['google.com', 'microsoft.com', 'apple.com'].some(d => parsedUrl!.hostname.endsWith(d))) {
      checks.push({
        check: 'Subdomain Depth & Structure',
        status: 'WARNING',
        details: `Targeted security/auth keywords present in hostname: ${matchedKeywords.join(', ')}.`,
        scoreDelta: 15
      });
      riskScore += 15;
    } else {
      checks.push({
        check: 'Subdomain Depth & Structure',
        status: 'SAFE',
        details: 'Standard domain hierarchy with benign naming structure.',
        scoreDelta: 0
      });
    }

    // Check 6: Suspicious Path Patterns
    const suspiciousExtensions = ['.exe', '.scr', '.ps1', '.bat', '.vbs', '.zip', '.iso', '.dmg', '.apk'];
    const pathLower = parsedUrl.pathname.toLowerCase();
    const hasExecutableExt = suspiciousExtensions.some(ext => pathLower.endsWith(ext));
    const hasRedirectParams = /[?&](url|next|redirect|dest|return|target)=/i.test(parsedUrl.search);

    if (hasExecutableExt) {
      checks.push({
        check: 'Suspicious Path & Extension Patterns',
        status: 'CRITICAL',
        details: 'Direct link to executable / archive file format in URL path.',
        scoreDelta: 30
      });
      riskScore += 30;
    } else if (hasRedirectParams) {
      checks.push({
        check: 'Suspicious Path & Extension Patterns',
        status: 'WARNING',
        details: 'Open redirect parameter detected in query string.',
        scoreDelta: 15
      });
      riskScore += 15;
    } else {
      checks.push({
        check: 'Suspicious Path & Extension Patterns',
        status: 'SAFE',
        details: 'Path adheres to benign web resource conventions.',
        scoreDelta: 0
      });
    }

    riskScore = Math.min(100, Math.max(5, riskScore));

    let riskVerdict: 'High Risk' | 'Medium Risk' | 'Low Risk' = 'Low Risk';
    if (riskScore >= 70) {
      riskVerdict = 'High Risk';
    } else if (riskScore >= 40) {
      riskVerdict = 'Medium Risk';
    }

    // Check if Gemini can enrich
    let aiEvaluation = '';
    try {
      const prompt = `You are a Senior Threat Intelligence Analyst analyzing a URL structure offline for defensive triage.
URL to evaluate: "${inputUrl}"
Protocol: ${parsedUrl.protocol}
Hostname: ${parsedUrl.hostname}
Path: ${parsedUrl.pathname}
Query: ${parsedUrl.search}
Heuristic Findings:
${checks.map(c => `- ${c.check}: ${c.status} (${c.details})`).join('\n')}
Calculated Heuristic Score: ${riskScore}/100

Provide a concise, 2-paragraph technical verdict:
1. Structural assessment of risk (e.g. brand impersonation, proxy bypass, phishing kit conventions).
2. Safe defensive recommendation for network engineers and SOC proxy rule creators.
Ground yourself strictly on the provided URL structure. Do not claim to visit or execute it.`;

      aiEvaluation = await generateAiContentWithTimeout(prompt, 5000);
    } catch (err: any) {
      console.warn('Gemini URL analysis fallback:', err.message);
    }

    res.json({
      success: true,
      analysis: {
        url: inputUrl,
        parsedHostname: parsedUrl.hostname,
        protocol: parsedUrl.protocol,
        path: parsedUrl.pathname,
        verdict: riskVerdict,
        riskScore,
        checks,
        aiEvaluation: aiEvaluation || 'Structural heuristic scan completed. No active external network requests were made.'
      }
    });
  } catch (error: any) {
    console.error('Error analyzing URL:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});
