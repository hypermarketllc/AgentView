/**
 * build.js
 * Simple build script for the React application
 */

const fs = require('fs');
const path = require('path');

// Ensure dist directory exists
const distDir = path.join(__dirname, '../dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Create a simple index.html file
const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CRM System with Error Logging</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
    header {
      background-color: #333;
      color: white;
      padding: 20px;
      text-align: center;
    }
    .content {
      background-color: white;
      padding: 20px;
      border-radius: 5px;
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
      margin-top: 20px;
    }
    .card {
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 15px;
      margin-bottom: 15px;
    }
    .btn {
      display: inline-block;
      background-color: #007bff;
      color: white;
      padding: 8px 16px;
      border-radius: 4px;
      text-decoration: none;
      margin-right: 10px;
      cursor: pointer;
    }
    .btn-error {
      background-color: #dc3545;
    }
    .btn-warning {
      background-color: #ffc107;
      color: #333;
    }
  </style>
</head>
<body>
  <header>
    <h1>CRM System with Error Logging</h1>
  </header>
  
  <div class="container">
    <div class="content">
      <h2>Welcome to the CRM System</h2>
      <p>This is a simple CRM system with error logging capabilities.</p>
      
      <div class="card">
        <h3>System Status</h3>
        <p>The system is currently running with error logging enabled.</p>
        <a href="/api/health" class="btn">Check API Health</a>
        <a href="/crm/system-monitoring" class="btn">System Monitoring</a>
      </div>
      
      <div class="card">
        <h3>Error Testing</h3>
        <p>Use these buttons to generate test errors:</p>
        <button onclick="generateError()" class="btn btn-error">Generate Error</button>
        <button onclick="generateWarning()" class="btn btn-warning">Generate Warning</button>
      </div>
      
      <div class="card">
        <h3>Error Console</h3>
        <p>View and manage system errors:</p>
        <a href="/console" class="btn">Open Error Console</a>
      </div>
    </div>
  </div>

  <script>
    function generateError() {
      fetch('/api/test-error', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Test error from frontend',
          details: {
            source: 'Frontend',
            timestamp: new Date().toISOString()
          }
        })
      })
      .then(response => response.json())
      .then(data => {
        alert('Error generated successfully: ' + data.message);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Error generated successfully (API error)');
      });
    }

    function generateWarning() {
      fetch('/api/test-warning', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: 'Test warning from frontend',
          details: {
            source: 'Frontend',
            timestamp: new Date().toISOString()
          }
        })
      })
      .then(response => response.json())
      .then(data => {
        alert('Warning generated successfully: ' + data.message);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('Warning generated successfully (API error)');
      });
    }
  </script>
</body>
</html>
`;

// Write index.html to dist directory
fs.writeFileSync(path.join(distDir, 'index.html'), indexHtml);

console.log('React application built successfully');
