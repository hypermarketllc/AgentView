import { routeRegistry } from '../../server/routes/routeRegistry';

export const validateRouteRegistry = () => {
  routeRegistry.forEach(route => {
    if (!route.path || !route.method) {
      throw new Error(`Route misconfigured: ${JSON.stringify(route)}`);
    }
  });
  console.log('✅ Route registry valid');
};