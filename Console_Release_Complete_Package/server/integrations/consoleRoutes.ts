import consoleRoutes from '../routes/consoleRoutes';
import consoleFixRoute from '../routes/consoleFixRoute';
import errorLogRoute from '../routes/errorLogRoute';
import consolePatchHandler from '../routes/consolePatchHandler';

export const integrateRoutes = (app) => {
  app.use('/api/console', consoleRoutes);
  app.use('/api/console', consoleFixRoute);
  app.use('/api/console', errorLogRoute);
  app.use('/api/console', consolePatchHandler);
};