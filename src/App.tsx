import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, PageId } from './components/Sidebar';
import { ScenarioModal } from './components/ScenarioModal';
import { DashboardPage } from './pages/DashboardPage';
import { SecurityEventsPage } from './pages/SecurityEventsPage';
import { IncidentsPage } from './pages/IncidentsPage';
import { IncidentDetailPage } from './pages/IncidentDetailPage';
import { InvestigationPage } from './pages/InvestigationPage';
import { HumanApprovalPage } from './pages/HumanApprovalPage';
import { ThreatIntelPage } from './pages/ThreatIntelPage';
import { PhishingAnalyzerPage } from './pages/PhishingAnalyzerPage';
import { UrlAnalyzerPage } from './pages/UrlAnalyzerPage';
import { VulnerabilitiesPage } from './pages/VulnerabilitiesPage';
import { MitreAttackPage } from './pages/MitreAttackPage';
import { CopilotPage } from './pages/CopilotPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { api } from './services/api';

export function App() {
  const [activePage, setActivePage] = useState<PageId | 'incident-detail'>('dashboard');
  const [selectedIncidentId, setSelectedIncidentId] = useState<string | null>(null);
  const [isScenarioModalOpen, setIsScenarioModalOpen] = useState(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const fetchPendingApprovals = async () => {
    try {
      const res = await api.getResponseActions({ status: 'PENDING_REVIEW' });
      setPendingApprovalsCount(res.data.length);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchPendingApprovals();
    const interval = setInterval(fetchPendingApprovals, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleSelectIncident = (id: string) => {
    setSelectedIncidentId(id);
    setActivePage('incident-detail');
  };

  const handleNavigateToCopilot = (incidentId: string) => {
    setSelectedIncidentId(incidentId);
    setActivePage('copilot');
  };

  const handleScenarioApplied = (incidentId?: string) => {
    fetchPendingApprovals();
    if (incidentId) {
      setSelectedIncidentId(incidentId);
      setActivePage('incident-detail');
    } else {
      setActivePage('dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Enterprise Top Navbar */}
      <Navbar
        onOpenScenarios={() => setIsScenarioModalOpen(true)}
        pendingActionsCount={pendingApprovalsCount}
        onNavigateToActions={() => setActivePage('approval-workflow')}
      />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* SOC Sidebar */}
        <Sidebar
          activePage={activePage === 'incident-detail' ? 'incidents' : activePage}
          onSelectPage={(p) => setActivePage(p)}
          pendingApprovalsCount={pendingApprovalsCount}
        />

        {/* Dynamic Content View Area */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0b0f17]">
          <div className="max-w-7xl mx-auto">
            {activePage === 'dashboard' && (
              <DashboardPage
                onSelectIncident={handleSelectIncident}
                onOpenScenarios={() => setIsScenarioModalOpen(true)}
                onNavigateToPage={(p) => setActivePage(p)}
              />
            )}

            {activePage === 'events' && <SecurityEventsPage />}

            {activePage === 'incidents' && (
              <IncidentsPage
                onSelectIncident={handleSelectIncident}
                onOpenScenarios={() => setIsScenarioModalOpen(true)}
              />
            )}

            {activePage === 'incident-detail' && selectedIncidentId && (
              <IncidentDetailPage
                incidentId={selectedIncidentId}
                onBack={() => setActivePage('incidents')}
                onNavigateToCopilot={handleNavigateToCopilot}
                onNavigateToHumanApproval={() => setActivePage('approval-workflow')}
              />
            )}

            {activePage === 'investigation' && (
              <InvestigationPage
                initialIncidentId={selectedIncidentId}
                onNavigateToCopilot={handleNavigateToCopilot}
                onNavigateToApproval={() => setActivePage('approval-workflow')}
              />
            )}

            {activePage === 'approval-workflow' && (
              <HumanApprovalPage onRefreshStats={fetchPendingApprovals} />
            )}

            {activePage === 'threat-intel' && <ThreatIntelPage />}

            {activePage === 'phishing' && <PhishingAnalyzerPage />}

            {activePage === 'url-analyzer' && <UrlAnalyzerPage />}

            {activePage === 'vulnerabilities' && <VulnerabilitiesPage />}

            {activePage === 'mitre' && <MitreAttackPage />}

            {activePage === 'copilot' && (
              <CopilotPage initialIncidentId={selectedIncidentId} />
            )}

            {activePage === 'audit-logs' && <AuditLogsPage />}

            {activePage === 'settings' && (
              <SettingsPage
                onOpenScenarios={() => setIsScenarioModalOpen(true)}
                onResetComplete={() => {
                  fetchPendingApprovals();
                  setActivePage('dashboard');
                }}
              />
            )}
          </div>
        </main>
      </div>

      {/* Synthetic Scenario Injection Modal */}
      <ScenarioModal
        isOpen={isScenarioModalOpen}
        onClose={() => setIsScenarioModalOpen(false)}
        onScenarioApplied={handleScenarioApplied}
      />
    </div>
  );
}

export default App;
