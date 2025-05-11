/**
 * StartConsolePanel - The main panel shown when the console dashboard loads
 * Provides system information and quick actions
 */
const StartConsolePanel = () => {
  // State for server information
  const [serverInfo, setServerInfo] = React.useState({
    version: '1.0.0',
    environment: 'production',
    nodeVersion: 'Node.js',
    startTime: new Date().toISOString()
  });
  
  // State for loading status
  const [loading, setLoading] = React.useState(false);
  
  // State for success message
  const [successMessage, setSuccessMessage] = React.useState(null);
  
  // State for error message
  const [errorMessage, setErrorMessage] = React.useState(null);

  // Handle running patches
  const handleRunPatches = async () => {
    try {
      setLoading(true);
      setSuccessMessage(null);
      setErrorMessage(null);
      
      const response = await fetch('/api/console/patch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to run patches: ${response.statusText}`);
      }
      
      const data = await response.json();
      setSuccessMessage(`Patches applied successfully: ${data.message || 'All patches completed'}`);
    } catch (err) {
      console.error('Error running patches:', err);
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  // Handle starting the frontend
  const handleStartFrontend = () => {
    window.open('/crm', '_blank');
  };

  return (
    <div>
      <h2 style={{ marginBottom: '20px' }}>System Control Panel</h2>
      
      {/* Server Information */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Server Information</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Version:</td>
              <td style={{ padding: '8px 0' }}>{serverInfo.version}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Environment:</td>
              <td style={{ padding: '8px 0' }}>{serverInfo.environment}</td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Node Version:</td>
              <td style={{ padding: '8px 0' }}>{serverInfo.nodeVersion}</td>
            </tr>
            <tr>
              <td style={{ padding: '8px 0', fontWeight: 'bold' }}>Start Time:</td>
              <td style={{ padding: '8px 0' }}>{new Date(serverInfo.startTime).toLocaleString()}</td>
            </tr>
          </tbody>
        </table>
      </section>
      
      {/* Quick Actions */}
      <section style={{ marginBottom: '30px', padding: '15px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Quick Actions</h3>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
          <button 
            onClick={handleRunPatches}
            disabled={loading}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Running Patches...' : 'Run Patches'}
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#6c757d', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Refresh Dashboard
          </button>
          
          <button 
            onClick={handleStartFrontend}
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#28a745', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Launch Frontend
          </button>
          
          <a 
            href="/api/health" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ 
              padding: '10px 15px', 
              backgroundColor: '#17a2b8', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              textDecoration: 'none',
              display: 'inline-block'
            }}
          >
            Check API Health
          </a>
        </div>
        
        {/* Success Message */}
        {successMessage && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#d4edda', 
            color: '#155724', 
            borderRadius: '4px' 
          }}>
            {successMessage}
          </div>
        )}
        
        {/* Error Message */}
        {errorMessage && (
          <div style={{ 
            marginTop: '15px', 
            padding: '10px', 
            backgroundColor: '#f8d7da', 
            color: '#721c24', 
            borderRadius: '4px' 
          }}>
            Error: {errorMessage}
          </div>
        )}
      </section>
      
      {/* Documentation */}
      <section style={{ padding: '15px', backgroundColor: 'white', borderRadius: '5px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        <h3 style={{ marginBottom: '15px', fontSize: '18px' }}>Documentation</h3>
        <p style={{ marginBottom: '15px' }}>
          The Console Dashboard provides tools for monitoring and managing your application.
          Use the tabs above to navigate between different sections:
        </p>
        <ul style={{ paddingLeft: '20px', marginBottom: '15px' }}>
          <li style={{ marginBottom: '5px' }}><strong>Start:</strong> System information and quick actions</li>
          <li style={{ marginBottom: '5px' }}><strong>Logs:</strong> Real-time server logs</li>
          <li style={{ marginBottom: '5px' }}><strong>Errors:</strong> System error logs from the database</li>
          <li style={{ marginBottom: '5px' }}><strong>Patch:</strong> Apply system patches and fixes</li>
        </ul>
        <p>
          For more information, refer to the <a href="ERROR_LOGGING_CONSOLE_GUIDE.md" style={{ color: '#007bff', textDecoration: 'none' }}>Console System Documentation</a>.
        </p>
      </section>
    </div>
  );
};
