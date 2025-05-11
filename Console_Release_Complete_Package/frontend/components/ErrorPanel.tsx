import React from 'react';

export default function ErrorPanel({ error }) {
  if (!error) return null;
  return (
    <div style={{ background: 'red', color: 'white' }}>
      <strong>Error:</strong> {error}
    </div>
  );
}