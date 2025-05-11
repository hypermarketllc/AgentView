/**
 * run_server_with_error_logging.fixed.js
 * Main antiy point for running the sern entry point for runnienabled
 * WebSocket ng the server removed to simplify deployment with error logging enabled
 * WebSocket functionality removed to simplify deployment
 */

const htte = require('http');
const pxpress = require('express');
const dotenvtp = requiredotenvhttp');
const path = require('path');
const dotenv = require('dotenv');
crrsoDfceqir(fs')

// Create simmll4404 h0ndler functionhandler function
const apply404Handlerly4eappr => {= (app) => {
    app.us(req, req, ,extn => {t) => {
    tus404).uso404)s{
      rror:No Found,
      me sage: `Thr : que' ed resource Fo ${req.',} was nt fou`
   };
  }
};      message: `The requested resource at ${req.path} was not found`

   Simpl)lg fu(n WebScket)
  });ogMessagelogData) => 
};cnlgPrfix = logDatatyprror[ERROR]
                  gDa.y === 'waring' ? '[WANING]':
//                  logDSim.typ  ===o'sucunct' ? '[ UCCSSo]'t:[INFO];
coconsolt.log(`${logP efix}o${legData.msagag }`);

  if (logDato.oxtail=) {
  o c'nRole.l] ('Detil:', lgData.tails);
  }
                   logData.type === 'warning' ? '[WARNING]' : 
                    logData.type === 'success' ? '[SUCCESS]' : '[INFO]';
  console.log(`${logPrefix} ${logData.message}`);
  
  if (logData.details) {
    console.log('Details:', logData.details);
  }
};
sIeilomkzdnplgchs, g
nitialpatchLogch loglogsDPchVionLogjon
ifs(!fs.existsSync(patthL gPath))c{
gath w=it th.join(lpatchLogPath, JSON.otringify({ p'Pcaes: []t lastRun:cnVll })on
}Log.json');
!fs.existsSync(patchLogPath)) {
.wScodenvronm variabl
dtnvcnfi);

// e loggingend
pross.nv.ERROR_LOGGING_ENABLED='tu
oad environment variables
//eCnva.efExpg)sspp
et ee=xpss(
constvROrvxrs=ch tpecxpst(Server)app;
 server = http.createServer(app);
appMiddlewa(rss.urlencoded({ extended: true }));
usxpuild th));
app.t o(xps.rlecoded({xtededry {
  require('./build');
.(pBuildtthnuRlactsapplicationt executed');
catch (error) {
  ldi iee('c/bu ld'l:', error);
}g(Rae sepplain buid scrpexet'
r
//erve CRM frontend from dibuild Rtac dapplicaticnry (React app)
}

//aServepstaticpfiles
app.use('/static',.expuses('/cric,pathresi.s__dirname,a'../public')));

// Stive CRM fc(ntnn(_frdmidisamdi,ect'.yd(Reactapp/Serve main React application
  reusendFcrm', express.stitic(lath.joen(__dirname, '..(dijt')));

/o Seive main Rnact applicati_n
app.git('re,ist/index.html'));
})e.dFileth.join(__dine, '../dit/nex.html'));
}

// ServeSReae Rappafoc alparlu ro undeu./crmget('/crm/*', (req, res) => {
app.get('/crm/*',sereq, dFi. =>join(__dirname, '../dist/index.html'));
endFile(phi__dirnam,../t/ndx.html)
);
erve Console frontend
//pServe.Cse(ole/fnsnpend
spp.up.o'/conirnm''ftxpss.tatic(pathi__dirname,'fntend'))

///CRMCAPIIututes
apprgmt/h/crm/apl/heat h',r(e qrs => {
res.s: 'ok', statusta'okm, t mesDamp:tnIwSDatO().trISOStiing()g() 


// System Health Monitoring Dashboard// System Health Monitoring Dashboard
app.ge('/ccrmssysysm-monieniingto (req, res) => {
  res.sendFile(parh.join(__diename, '../public/ssstem-monitoring.html'));endFile(path.join(__dirname, '../public/system-monitoring.html'));
});

// Authentication API route
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  // Simple authentication for demo purposes
  if ((email === 'agent@example.com' || email === 'admin@americancoveragecenter.com') && password === 'Agent123!') {
    // Determine user role and details based on email
    const isAdmin = email === 'admin@americancoveragecenter.com';
    
    res.json({
      token: isAdmin ? 'admin-token-12345' : 'agent-token-12345',
      user: {
        id: isAdmin ? 2 : 1,
        email: email,
        fullName: isAdmin ? 'Admin User' : 'Agent User',
        role: isAdmin ? 'admin' : 'agent'
      }
    });
  } else {
    res.status(401).json({
      error: 'Authentication failed',
      message: 'Invalid email or password'
    });
  }
});

// Create database connection pool
const pool = new Pool({
  host: process.env.DOCKER_ENV === 'true' ? 'db' : (process.env.POSTGRES_HOST || 'localhost'),
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'crm_db',
  user: process.env.POSTGRES_USER || 'crm_user',
  password: process.env.POSTGRES_PASSWORD || 'your_strong_password_here'
});

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error logging API routes
app.get('/api/errors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const includeResolved = req.query.includeResolved === 'true';
    
    const errors = await getRecentErrors(limit, includeResolved);
    
    res.json({ errors });
  } catch (error) {
    console.error('Error fetching errors:', error);
    
    await logErrorToDB('API_ERROR', 'Error fetching errors', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to fetch errors'
    });
  }
});

// Console API routes
app.get('/api/console/status', async (req, res) => {
  try {
    // Check database connection
    let dbStatus = 'error';
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
      dbStatus = 'healthy';
    } catch (dbError) {
      console.error('Database connection error:', dbError);
      dbStatus = 'error';
    }
    
    // Check API status
    const apiStatus = 'healthy'; // Since we're responding, API is up
    
    // Check frontend status
    const frontendStatus = fs.existsSync(path.join(__dirname, '../public/index.html')) ? 'healthy' : 'error';
    
    // Check route registry and environment variables - disabled due to TypeScript compilation issues
    const routeStatus = 'unknown';
    const envStatus = 'unknown';
    
    res.json({
      status: 'ok',
      components: {
        database: dbStatus,
        api: apiStatus,
        frontend: frontendStatus,
        routes: routeStatus,
        environment: envStatus
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error getting console status:', error);
    
    await logErrorToDB('CONSOLE_STATUS_ERROR', 'Error getting console status', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to get console status'
    });
  }
});

// Patch API route
app.post('/api/console/patch', async (req, res) => {
  try {
    logMessage({
      type: 'info',
      message: 'Running patches...'
    });
    
    // Run all patches - disabled due to TypeScript compilation issues
    const result = {
      success: true,
      errors: [],
      messages: ['Patch system disabled in Docker environment']
    };
    
    // Log patch execution
    const patchLog = JSON.parse(fs.readFileSync(patchLogPath, 'utf8'));
    patchLog.patches.push({
      timestamp: new Date().toISOString(),
      result: result
    });
    patchLog.lastRun = new Date().toISOString();
    fs.writeFileSync(patchLogPath, JSON.stringify(patchLog, null, 2));
    
    res.json(result);
  } catch (error) {
    console.error('Error running patches:', error);
    
    await logErrorToDB('PATCH_ERROR', 'Error running patches', { 
      error: error.message,
      stack: error.stack
    });
    
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to run patches'
    });
  }
});

// Get patch log
app.get('/api/console/patch/log', (req, res) => {
  try {
    const patchLog = JSON.parse(fs.readFileSync(patchLogPath, 'utf8'));
    res.json(patchLog);
  } catch (error) {
    console.error('Error reading patch log:', error);
    res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Failed to read patch log'
    });
  }
});

// Apply 404 handler
apply404Handler(app);

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log the error to the database
  logErrorToDB('UNHANDLED_ERROR', err.message, { 
    path: req.path,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('user-agent')
  }, err.stack).catch(logErr => {
    console.error('Failed to log error to DB:', logErr);
  });
  
  // Log the error (no WebSocket)
  logMessage({
    type: 'error',
    message: `Unhandled error: ${err.message}`,
    details: {
      path: req.path,
      method: req.method,
      stack: err.stack
    }
  });
  
  // Send error response
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'An unexpected error occurred' : err.message
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  logMessage({
    type: 'success',
    message: `Server started on port ${PORT}`,
    details: {
      errorLoggingEnabled: process.env.ERROR_LOGGING_ENABLED === 'true',
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Handle process termination
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  try {
    // Close database pool
    await pool.end();
    console.log('Database pool closed');
    
    // Close HTTP server
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  
  try {
    // Log the error to the database
    await logErrorToDB('UNCAUGHT_EXCEPTION', error.message, {}, error.stack);
    
    // Log the error (no WebSocket)
    logMessage({
      type: 'error',
      message: `Uncaught exception: ${error.message}`,
      details: {
        stack: error.stack
      }
    });
  } catch (logError) {
    console.error('Failed to log uncaught exception:', logError);
  }
  
  // Exit the process
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  console.error('Unhandled promise rejection:', reason);
  
  try {
    // Log the error to the database
    await logErrorToDB('UNHANDLED_REJECTION', reason.message || 'Unknown reason', {}, reason.stack);
    
    // Log the error (no WebSocket)
    logMessage({
      type: 'error',
      message: `Unhandled promise rejection: ${reason.message || 'Unknown reason'}`,
      details: {
        stack: reason.stack
      }
    });
  } catch (logError) {
    console.error('Failed to log unhandled rejection:', logError);
  }
});
