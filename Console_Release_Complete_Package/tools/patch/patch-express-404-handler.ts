import { Request, Response, NextFunction, Application } from 'express';
import { emitLog } from '../../server/websocket/logSocketServer';
import { logErrorToDB } from '../../utils/logErrorToDB';

/**
 * Adds a 404 handler to Express application
 * This patch ensures that any unmatched routes return a proper 404 response
 * instead of hanging or returning an unclear error
 */
export function apply404Handler(app: Application): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Skip for static files and assets
    if (req.path.startsWith('/static/') || 
        req.path.startsWith('/assets/') || 
        req.path.startsWith('/favicon.ico')) {
      return next();
    }
    
    // Log the 404 error
    const context = {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('user-agent')
    };
    
    logErrorToDB('ROUTE_NOT_FOUND', `404 Not Found: ${req.method} ${req.path}`, context)
      .catch(err => console.error('Failed to log 404 error to DB:', err));
    
    // Emit the 404 error via WebSocket for real-time monitoring
    emitLog({
      type: 'warning',
      message: `404 Not Found: ${req.method} ${req.path}`,
      details: context
    });
    
    // Send 404 response
    res.status(404).json({
      error: 'Not Found',
      message: `The requested resource '${req.path}' was not found on this server`,
      code: 'ROUTE_NOT_FOUND',
      suggestion: 'Check the URL and try again'
    });
  });
}
