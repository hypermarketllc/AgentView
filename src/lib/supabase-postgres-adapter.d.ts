/**
 * Type declarations for the Supabase PostgreSQL adapter
 */

declare module './supabase-postgres-adapter' {
  /**
   * Creates a Supabase-compatible client that redirects to PostgreSQL API
   */
  export function createSupabaseAdapter(): any;
  
  /**
   * Default export - same as createSupabaseAdapter
   */
  const createSupabaseAdapter: typeof import('./supabase-postgres-adapter').createSupabaseAdapter;
  export default createSupabaseAdapter;
}
