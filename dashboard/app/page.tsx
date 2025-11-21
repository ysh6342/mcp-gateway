'use client';

import { useEffect, useState } from 'react';

interface Server {
  id: string;
  status: string;
  type: string;
}

export default function Dashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [logs, setLogs] = useState<string[]>([]);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:3001/api/logs');
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setLogs((prev) => [...prev, `[${data.timestamp}] ${data.message}`].slice(-100));
    };
    return () => eventSource.close();
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch('http://localhost:3001/api/servers');
      const data = await res.json();
      setServers(data);
    } catch (error) {
      console.error('Failed to fetch servers', error);
    }
  };

  const handleStart = async (id: string) => {
    await fetch(`http://localhost:3001/api/servers/${id}/start`, { method: 'POST' });
    fetchServers();
  };

  const handleStop = async (id: string) => {
    await fetch(`http://localhost:3001/api/servers/${id}/stop`, { method: 'POST' });
    fetchServers();
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>MCP Gateway Dashboard</h1>

      <section>
        <h2>Servers</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left' }}>
              <th>ID</th>
              <th>Type</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((server) => (
              <tr key={server.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td>{server.id}</td>
                <td>{server.type}</td>
                <td>{server.status}</td>
                <td>
                  <button onClick={() => handleStart(server.id)} style={{ marginRight: '10px' }}>Start</button>
                  <button onClick={() => handleStop(server.id)}>Stop</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '20px' }}>
        <h2>Live Logs</h2>
        <div style={{
          background: '#1e1e1e',
          color: '#d4d4d4',
          padding: '10px',
          height: '300px',
          overflowY: 'auto',
          fontFamily: 'monospace'
        }}>
          {logs.map((log, i) => (
            <div key={i}>{log}</div>
          ))}
        </div>
      </section>
    </div>
  );
}
