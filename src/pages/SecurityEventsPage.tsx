import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, Plus, Database, ChevronRight, X, Terminal, Shield } from 'lucide-react';
import { api } from '../services/api';
import { SecurityEvent } from '../types';
import { SeverityBadge } from '../components/SeverityBadge';

export const SecurityEventsPage: React.FC = () => {
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [sourceTypeFilter, setSourceTypeFilter] = useState('ALL');
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);
  const [loadingDemo, setLoadingDemo] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // New Event Form State
  const [newDescription, setNewDescription] = useState('');
  const [newSeverity, setNewSeverity] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [newSource, setNewSource] = useState('CrowdStrike-EDR');
  const [newSourceType, setNewSourceType] = useState('Endpoint');
  const [newUser, setNewUser] = useState('t.miller@enterprise.local');
  const [newIp, setNewIp] = useState('10.0.4.88');
  const [newHostname, setNewHostname] = useState('WS-OPS-11');
  const [newEventType, setNewEventType] = useState('SUSPICIOUS_MEMORY_OVERWRITE');
  const [newIndicators, setNewIndicators] = useState('powershell.exe, 198.51.100.22');

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getEvents({
        search: search.trim() || undefined,
        severity: severityFilter !== 'ALL' ? severityFilter : undefined,
        sourceType: sourceTypeFilter !== 'ALL' ? sourceTypeFilter : undefined
      });
      setEvents(res);
    } catch (e: any) {
      console.error('Error fetching events:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [severityFilter, sourceTypeFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchEvents();
  };

  const handleLoadDemo = async () => {
    try {
      setLoadingDemo(true);
      await api.loadDemoEvents();
      await fetchEvents();
    } catch (e: any) {
      alert(`Error loading demo events: ${e.message}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDescription) return;

    try {
      await api.createEvent({
        source: newSource,
        sourceType: newSourceType,
        user: newUser,
        ip: newIp,
        hostname: newHostname,
        eventType: newEventType,
        description: newDescription,
        severity: newSeverity,
        indicators: newIndicators.split(',').map(s => s.trim()).filter(Boolean),
        metadata: { simulated: true, analystTag: 'Manual SOC Injection' }
      });
      setShowCreateModal(false);
      setNewDescription('');
      fetchEvents();
    } catch (err: any) {
      alert(`Error creating event: ${err.message}`);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Security Event Management
            <span className="text-xs font-mono font-normal px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {events.length} Events Indexed
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Synthetic security event stream covering network, identity, cloud, and endpoint sensors
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleLoadDemo}
            disabled={loadingDemo}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition disabled:opacity-50"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Load Demo Event Batch</span>
          </button>

          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Inject Synthetic Event</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-3 bg-[#0f172a] border border-slate-800 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex-1 min-w-[240px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search events by IP, hostname, user, or description..."
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </form>

        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400 text-xs">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-400 text-xs">Source Type:</span>
            <select
              value={sourceTypeFilter}
              onChange={(e) => setSourceTypeFilter(e.target.value)}
              className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-cyan-500"
            >
              <option value="ALL">All Sources</option>
              <option value="Network">Network</option>
              <option value="Identity">Identity</option>
              <option value="Endpoint">Endpoint</option>
              <option value="Cloud">Cloud</option>
              <option value="Email">Email</option>
              <option value="Vulnerability">Vulnerability</option>
            </select>
          </div>

          <button
            onClick={fetchEvents}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 transition"
            title="Reload events"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Events Table */}
      <div className="rounded-2xl bg-[#0f172a] border border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/80 text-slate-400 font-mono uppercase text-[10px] tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Event ID / Time</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Source & Type</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Subject (User / Host)</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-cyan-400 mb-2" />
                    Loading security events...
                  </td>
                </tr>
              ) : events.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    No security events found matching the filter criteria.
                  </td>
                </tr>
              ) : (
                events.map((ev) => (
                  <tr
                    key={ev.eventId}
                    onClick={() => setSelectedEvent(ev)}
                    className="hover:bg-slate-900/50 transition cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono">
                      <div className="font-bold text-cyan-400">{ev.eventId}</div>
                      <div className="text-[10px] text-slate-500">{new Date(ev.timestamp).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-4">
                      <SeverityBadge severity={ev.severity} size="sm" />
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-200">{ev.source}</div>
                      <div className="text-[10px] font-mono text-slate-400">{ev.sourceType}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-[11px] text-amber-300">
                      {ev.eventType}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-[140px] truncate">
                      <div>{ev.user}</div>
                      <div className="text-[10px] font-mono text-slate-500">{ev.hostname}</div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300 text-xs">
                      {ev.ip}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate">
                      {ev.description}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedEvent(ev);
                        }}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-[10px] font-mono transition"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Details Drawer/Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-xl w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Terminal className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-base text-slate-100 font-mono">
                  {selectedEvent.eventId} Raw Telemetry Record
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Severity:</span>
                  <SeverityBadge severity={selectedEvent.severity} size="sm" />
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Event Type:</span>
                  <span className="font-mono text-cyan-300 font-semibold">{selectedEvent.eventType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Source Sensor:</span>
                  <span className="text-slate-200">{selectedEvent.source} ({selectedEvent.sourceType})</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Timestamp:</span>
                  <span className="font-mono text-slate-300">{selectedEvent.timestamp}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Subject Identity:</span>
                  <span className="text-slate-200">{selectedEvent.user}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-mono">Origin / Target IP:</span>
                  <span className="font-mono text-slate-200">{selectedEvent.ip} ({selectedEvent.hostname})</span>
                </div>
              </div>

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] font-mono tracking-wider block mb-1">
                  Description:
                </span>
                <p className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 leading-relaxed">
                  {selectedEvent.description}
                </p>
              </div>

              {selectedEvent.indicators && selectedEvent.indicators.length > 0 && (
                <div>
                  <span className="text-slate-400 font-semibold uppercase text-[10px] font-mono tracking-wider block mb-1">
                    Correlated Indicators (IoCs):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedEvent.indicators.map((ioc, idx) => (
                      <span key={idx} className="font-mono text-xs px-2 py-1 rounded bg-slate-800 text-cyan-300 border border-slate-700">
                        {ioc}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <span className="text-slate-400 font-semibold uppercase text-[10px] font-mono tracking-wider block mb-1">
                  Metadata Payload (JSON):
                </span>
                <pre className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-[11px] text-cyan-400/90 overflow-x-auto max-h-36">
                  {JSON.stringify(selectedEvent.metadata, null, 2)}
                </pre>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedEvent(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Close Record
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Synthetic Event Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <form onSubmit={handleCreateEvent} className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                Inject Synthetic Security Event
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 my-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Event Description:</label>
                <textarea
                  rows={2}
                  required
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="e.g. Unsanitized process memory allocation detected from unsigned script runner."
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Severity:</label>
                  <select
                    value={newSeverity}
                    onChange={(e: any) => setNewSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Source Sensor:</label>
                  <input
                    type="text"
                    value={newSource}
                    onChange={(e) => setNewSource(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Event Type Code:</label>
                  <input
                    type="text"
                    value={newEventType}
                    onChange={(e) => setNewEventType(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Subject User:</label>
                  <input
                    type="text"
                    value={newUser}
                    onChange={(e) => setNewUser(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Target / Source IP:</label>
                  <input
                    type="text"
                    value={newIp}
                    onChange={(e) => setNewIp(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Hostname:</label>
                  <input
                    type="text"
                    value={newHostname}
                    onChange={(e) => setNewHostname(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Indicators (comma separated):</label>
                <input
                  type="text"
                  value={newIndicators}
                  onChange={(e) => setNewIndicators(e.target.value)}
                  placeholder="e.g. powershell.exe, 198.51.100.22"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold shadow-sm transition"
              >
                Inject Telemetry
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
