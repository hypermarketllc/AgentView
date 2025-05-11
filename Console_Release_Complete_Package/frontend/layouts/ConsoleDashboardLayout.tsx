import React, { useState, useEffect } from 'react';

// Define tab types
type TabType = 'start' | 'logs' | 'errors' | 'patch';

// Define component props
interface ConsoleDashboardLayoutProps {
  children?: React.ReactNode;
}

// Define system status type
interface SystemStatus {
  status: string;
  components: {
    database: string;
    api: string;
    frontend: string;
    routes: string;
    environment: string;
  };
  timestamp: string;
}

/**
 * ConsoleDashboardLayout - Main layout for the console dashboard
 * Provides tab navigation and system status information
 */
const ConsoleDashboardLayout: React.FC<ConsoleDashboardLayoutProps> = ({ children }) => {
  // State for active tab
  const [activeTab, setActiveTab] = useState<TabType>('start');
  
  // State for system status
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  // State for loading status
  const [loading, setLoading] = useState<boolean>(true);
  
  // State for error message
  const [error, setError] = useState<string | null>(null);

  // Fetch system status on component mount
  useEffect(() => {
    const fetchSystemStatus = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/console/status');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch system status: ${response.statusText}`);
        }
        
        const data = await response.json();
        setSystemStatus(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching system status:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };
    
    // Fetch initial status
    fetchSystemStatus();
    
    // Set up interval to refresh status
    const intervalId = setInterval(fetchSystemStatus, 30000); // Refresh every 30 seconds
    
    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, []);

  // Handle tab change
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Render status indicator
  const renderStatusIndicator = (status: string) => {
    const color = status === 'healthy' ? 'green' : 'red';
    return (
      <span 
        style={{ 
          display: 'inline-block', 
          width: '12px', 
          height: '12px', 
          borderRadius: '50%', 
          backgroundColor: color,
          marginRight: '8px'
        }} 
      />
    );
  };

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '20px' }}>
        <h1 style={{ color: '#333', borderBottom: '2px solid #eee', paddingBottom: '10px' }}>
          Console Dashboard
        </h1>
      </header>
      
      <nav style={{ marginBottom: '20px' }}>
        <ul style={{ display: 'flex', listStyle: 'none', padding: 0, margin: 0, borderBottom: '1px solid #eee' }}>
          <li style={{ marginRight: '10px' }}>
            <button 
              onClick={() => handleTabChange('start')}
              style={{ 
                padding: '10px 15px', 
                border: 'none', 
                background: activeTab === 'start' ? '#f0f0f0' : 'transparent',
                borderBottom: activeTab === 'start' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'start' ? 'bold' : 'normal'
              }}
            >
              Start
            </button>
          </li>
          <li style={{ marginRight: '10px' }}>
            <button 
              onClick={() => handleTabChange('logs')}
              style={{ 
                padding: '10px 15px', 
                border: 'none', 
                background: activeTab === 'logs' ? '#f0f0f0' : 'transparent',
                borderBottom: activeTab === 'logs' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'logs' ? 'bold' : 'normal'
              }}
            >
              Logs
            </button>
          </li>
          <li style={{ marginRight: '10px' }}>
            <button 
              onClick={() => handleTabChange('errors')}
              style={{ 
                padding: '10px 15px', 
                border: 'none', 
                background: activeTab === 'errors' ? '#f0f0f0' : 'transparent',
                borderBottom: activeTab === 'errors' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'errors' ? 'bold' : 'normal'
              }}
            >
              Errors
            </button>
          </li>
          <li>
            <button 
              onClick={() => handleTabChange('patch')}
              style={{ 
                padding: '10px 15px', 
                border: 'none', 
                background: activeTab === 'patch' ? '#f0f0f0' : 'transparent',
                borderBottom: activeTab === 'patch' ? '2px solid #007bff' : 'none',
                cursor: 'pointer',
                fontWeight: activeTab === 'patch' ? 'bold' : 'normal'
              }}
            >
              Patch
            </button>
          </li>
        </ul>
      </nav>
      
      <div style={{ display: 'flex' }}>
        <main style={{ flex: 1, padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          {/* Tab content will be rendered here */}
          {children}
        </main>
        
        <aside style={{ width: '300px', marginLeft: '20px', padding: '20px', backgroundColor: '#f9f9f9', borderRadius: '5px' }}>
          <h2 style={{ fontSize: '18px', marginBottom: '15px' }}>System Status</h2>
          
          {loading && <p>Loading system status...</p>}
          
          {error && (
            <div style={{ padding: '10px', backgroundColor: '#ffebee', color: '#c62828', borderRadius: '4px', marginBottom: '15px' }}>
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {systemStatus && (
            <div>
              <div style={{ marginBottom: '10px' }}>
                <p style={{ margin: '5px 0' }}>
                  <strong>Overall Status:</strong> {systemStatus.status}
                </p>
                <p style={{ margin: '5px 0', fontSize: '12px', color: '#666' }}>
                  Last updated: {new Date(systemStatus.timestamp).toLocaleString()}
                </p>
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '10px' }}>Components</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                  <li style={{ marginBottom: '8px' }}>
                    {renderStatusIndicator(systemStatus.components.database)}
                    <strong>Database:</strong> {systemStatus.components.database}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    {renderStatusIndicator(systemStatus.components.api)}
                    <strong>API:</strong> {systemStatus.components.api}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    {renderStatusIndicator(systemStatus.components.frontend)}
                    <strong>Frontend:</strong> {systemStatus.components.frontend}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    {renderStatusIndicator(systemStatus.components.routes)}
                    <strong>Routes:</strong> {systemStatus.components.routes}
                  </li>
                  <li style={{ marginBottom: '8px' }}>
                    {renderStatusIndicator(systemStatus.components.environment)}
                    <strong>Environment:</strong> {systemStatus.components.environment}
                  </li>
                </ul>
              </div>
              
              <button 
                onClick={() => window.location.reload()}
                style={{ 
                  padding: '8px 12px', 
                  backgroundColor: '#007bff', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Refresh Status
              </button>
            </div>
          )}
        </aside>
      </div>
      
      <footer style={{ marginTop: '20px', padding: '10px', borderTop: '1px solid #eee', textAlign: 'center', color: '#666', fontSize: '12px' }}>
        <p>Console System v1.0.0 | &copy; 2025 MyAgentView CRM</p>
      </footer>
    </div>
  );
};

export default ConsoleDashboardLayout;
