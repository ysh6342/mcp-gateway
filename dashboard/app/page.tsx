'use client';

import { useEffect, useState } from 'react';
import './globals.css';

interface Server {
  id: string;
  name: string;
  status: 'running' | 'stopped';
}

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    running: 0,
    stopped: 0,
  });

  useEffect(() => {
    fetchServers();
    connectToLogs();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('http://localhost:3001/servers');
      const data = await res.json();
      setServers(data);

      const running = data.filter((s: Server) => s.status === 'running').length;
      setStats({
        total: data.length,
        running,
        stopped: data.length - running,
      });
    } catch (err) {
      console.error('Failed to fetch servers:', err);
    }
  };

  const connectToLogs = () => {
    const eventSource = new EventSource('http://localhost:3001/logs');
    eventSource.onmessage = (event) => {
      setLogs((prev) => [...prev.slice(-49), event.data]);
    };
    return () => eventSource.close();
  };

  const handleServerAction = async (id: string, action: 'start' | 'stop') => {
    try {
      await fetch(`http://localhost:3001/servers/${id}/${action}`, {
        method: 'POST',
      });
      fetchServers();
    } catch (err) {
      console.error(`Failed to ${action} server:`, err);
    }
  };

  return (
    <div className="container">
      {/* Header */}
      <header className="header">
        <h1>MCP Gateway</h1>
        <p>High-availability Model Context Protocol server management</p>
      </header>

      {/* Stats Grid */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Total Servers</div>
          <div className="stat-value">{stats.total}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Running</div>
          <div className="stat-value" style={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.running}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Stopped</div>
          <div className="stat-value" style={{
            background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            {stats.stopped}
          </div>
        </div>
      </div>

      {/* Server List */}
      <section className="server-section">
        <div className="section-header">
          <h2 className="section-title">Servers</h2>
        </div>

        {servers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🚀</div>
            <h3>No servers configured</h3>
            <p>Add servers to gateway-config.json to get started</p>
          </div>
        ) : (
          <div className="server-grid">
            {servers.map((server) => (
              <div key={server.id} className="server-card">
                <div className="server-header">
                  <div className="server-info">
                    <h3>{server.name}</h3>
                    <div className="server-id">{server.id}</div>
                  </div>
                  <span className={`status-badge status-${server.status}`}>
                    {server.status}
                  </span>
                </div>

                <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                  {server.status === 'stopped' ? (
                    <button
                      className="btn btn-success"
                      onClick={() => handleServerAction(server.id, 'start')}
                    >
                      ▶ Start
                    </button>
                  ) : (
                    <button
                      className="btn btn-danger"
                      onClick={() => handleServerAction(server.id, 'stop')}
                    >
                      ⏹ Stop
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Logs */}
      <section className="logs-section">
        <h2>📝 Live Logs</h2>
        {logs.length === 0 ? (
          <div className="empty-state">
            <p>No logs yet...</p>
          </div>
        ) : (
          <div>
            {logs.map((log, i) => (
              <div key={i} className="log-entry log-info">
                {log}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
