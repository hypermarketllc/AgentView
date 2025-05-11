import React, { useEffect, useState } from 'react';

export default function ErrorLogPanel() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    fetch('/api/console/errors')
      .then(res => res.json())
      .then(setLogs)
      .catch(err => setLogs([{ error: 'Failed to load logs' }]));
  }, []);

  return (
    <div>
      <h2>Error Logs</h2>
      <ul>
        {logs.map((log, i) => (
          <li key={i}>{log.message || log.error}</li>
        ))}
      </ul>
    </div>
  );
}