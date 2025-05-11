/**
 * logSocketServer.js
 * WebSocket server for real-time error logging
 */

const WebSocket = require('ws');

let wss = null;

/**
 * Initialize the WebSocket server
 * @param {object} server - HTTP server instance
 * @returns {boolean} - Whether initialization was successful
 */
function init(server) {
  try {
    wss = new WebSocket.Server({ server });
    
    wss.on('connection', (ws) => {
      console.log('Log client connected');
      
      // Send welcome message
      ws.send(JSON.stringify({
        type: 'info',
        message: 'Connected to log server',
        timestamp: new Date().toISOString()
      }));
      
      ws.on('close', () => {
        console.log('Log client disconnected');
      });
      
      // Handle messages from clients
      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          
          // Handle commands
          if (data.command === 'ping') {
            ws.send(JSON.stringify({
              type: 'pong',
              timestamp: new Date().toISOString()
            }));
          }
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
    });
    
    console.log('WebSocket server for logs initialized');
    return true;
  } catch (error) {
    console.error('Failed to initialize WebSocket server:', error);
    return false;
  }
}

/**
 * Log a message to all connected clients
 * @param {object} logData - Log data to send
 * @returns {boolean} - Whether the log was sent successfully
 */
function log(logData) {
  if (!wss) {
    console.log('WebSocket server not initialized');
    return false;
  }
  
  try {
    const logMessage = JSON.stringify({
      ...logData,
      timestamp: new Date().toISOString()
    });
    
    let clientCount = 0;
    
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(logMessage);
        clientCount++;
      }
    });
    
    // Also log to console
    const logPrefix = logData.type === 'error' ? '[ERROR]' : 
                      logData.type === 'warning' ? '[WARNING]' : 
                      logData.type === 'success' ? '[SUCCESS]' : '[INFO]';
    console.log(`${logPrefix} ${logData.message} (Sent to ${clientCount} clients)`);
    
    return true;
  } catch (error) {
    console.error('Failed to emit log:', error);
    return false;
  }
}

/**
 * Get the number of connected clients
 * @returns {number} - Number of connected clients
 */
function getClientCount() {
  if (!wss) return 0;
  
  let count = 0;
  wss.clients.forEach(() => count++);
  return count;
}

/**
 * Close the WebSocket server
 */
function close() {
  if (wss) {
    wss.close();
    wss = null;
    console.log('WebSocket server closed');
  }
}

module.exports = {
  init,
  log,
  getClientCount,
  close
};
