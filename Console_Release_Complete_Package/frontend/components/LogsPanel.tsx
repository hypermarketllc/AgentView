import React, { useEffect, useState } from 'react';

export default function LogsPanel() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:5005/ws/logs');
    socket.onmessage = (event) => {
      const log = JSON.parse(event.data);
      setLogs(prev => [...prev, log]);
    };
    return () => socket.close();
  }, []);

  return (
    <div>
      <h2>Logs</h2>
      <pre>{logs.map((l, i) => <div key={i}>{JSON.stringify(l)}</div>)}</pre>
    </div>
  );
}