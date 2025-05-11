export const errorRegistry = {
  E_DB_CONN: 'Database connection failed',
  E_AUTH_FAIL: 'Authentication failed',
  E_ROUTE_NOT_FOUND: 'Requested route not found',
  E_PATCH_FAIL: 'Patch application failed'
};

export const getFixSuggestion = (code) => {
  return errorRegistry[code] || 'No suggestion available.';
};