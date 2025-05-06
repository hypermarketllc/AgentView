import { createClient } from '@supabase/supabase-js';
import api, { carriersAPI, productsAPI, positionsAPI, dealsAPI } from './api';
import { v4 as uuidv4 } from 'uuid';

// Declare window.env for TypeScript
declare global {
  interface Window {
    env?: {
      VITE_SUPABASE_URL?: string;
      VITE_SUPABASE_ANON_KEY?: string;
      USE_POSTGRES?: string;
      VITE_USE_POSTGRES?: string;
      [key: string]: string | undefined;
    };
  }
}

// Try to get environment variables from window.env first (for production)
// Fall back to import.meta.env (for development)
const getEnv = (key: string): string | undefined => {
  if (typeof window !== 'undefined' && window.env && window.env[key]) {
    return window.env[key];
  }
  // @ts-ignore - import.meta.env is provided by Vite
  return import.meta.env[key];
};

// Check if we're using PostgreSQL
const usePostgres = getEnv('USE_POSTGRES') === 'true' || getEnv('VITE_USE_POSTGRES') === 'true';

// Create a PostgreSQL compatibility layer that redirects to API methods
const createPostgresCompatClient = () => {
  console.log('Creating PostgreSQL compatibility layer for Supabase');
  
  // Helper function to handle API errors consistently
  const handleApiError = (error: any, operation: string, table: string) => {
    console.error(`Error ${operation} data for ${table}:`, error);
    return { data: null, error: error.response?.data?.error || error.message || 'API error' };
  };

  // RPC (Remote Procedure Call) implementation
  const rpc = async (functionName: string, params: any = {}) => {
    console.log(`RPC call to function: ${functionName} with params:`, params);
    
    try {
      let response;
      
      switch (functionName) {
        case 'update_user_details':
          response = await api.put(`/users/${params.p_user_id}`, {
            fullName: params.p_full_name,
            email: params.p_email,
            phone: params.p_phone,
            positionId: params.p_position_id,
            uplineId: params.p_upline_id,
            nationalProducerNumber: params.p_national_producer_number,
            annualGoal: params.p_annual_goal,
            isActive: params.p_is_active
          });
          return { data: response.data, error: null };
          
        case 'delete_user_cascade':
          response = await api.delete(`/users/${params.target_user_id}`);
          return { data: response.data, error: null };
          
        default:
          console.warn(`No API method for RPC function: ${functionName}`);
          return { data: null, error: `Function ${functionName} not implemented` };
      }
    } catch (error) {
      return handleApiError(error, `calling RPC function ${functionName}`, 'rpc');
    }
  };
  
  // Helper function to get data from the appropriate API
  const getTableData = async (table: string, filter?: { column: string, value: any }) => {
    try {
      let data;
      
      switch (table) {
        case 'carriers':
          data = await carriersAPI.getAll();
          break;
        case 'products':
          if (filter && filter.column === 'carrier_id') {
            data = await productsAPI.getByCarrier(filter.value);
          } else {
            data = await productsAPI.getAll();
          }
          break;
        case 'positions':
          data = await positionsAPI.getAll();
          break;
        case 'deals':
          data = await dealsAPI.getAll();
          break;
        case 'users':
          // Get current user
          const response = await api.get('/auth/me');
          data = [response.data];
          break;
        case 'telegram_chats':
          // Mock data for telegram_chats
          data = [
            { id: '1', chat_id: '123456789', name: 'Test Chat', is_active: true },
            { id: '2', chat_id: '987654321', name: 'Another Chat', is_active: false }
          ];
          break;
        case 'integrations':
          // Mock data for integrations
          data = [
            { id: '1', name: 'Discord', is_active: true, config: {} },
            { id: '2', name: 'Telegram', is_active: true, config: {} }
          ];
          break;
        case 'discord_notifications':
          // Mock data for discord_notifications
          data = [
            { id: '1', message: 'Test notification', sent_at: new Date().toISOString(), status: 'sent' }
          ];
          break;
        case 'settings':
          // Mock data for settings
          data = [
            { id: '1', key: 'system_name', value: 'CRM System', category: 'system' },
            { id: '2', key: 'notification_enabled', value: 'true', category: 'notifications' }
          ];
          break;
        default:
          console.warn(`No API method for table: ${table}`);
          data = [];
      }
      
      // If filter is provided and it's not a carrier_id filter for products
      if (filter && !(table === 'products' && filter.column === 'carrier_id')) {
        if (data && Array.isArray(data)) {
          data = data.filter((item: any) => item && item[filter.column] === filter.value);
        } else {
          console.warn(`Data is not an array or is null for table: ${table}`);
          data = [];
        }
      }
      
      return { data, error: null };
    } catch (error) {
      return handleApiError(error, 'fetching', table);
    }
  };
  
  return {
    // Add RPC method to the client
    rpc: (functionName: string, params: any = {}) => rpc(functionName, params),
    
    from: (table: string) => {
      console.log(`Accessing table: ${table} via PostgreSQL compatibility layer`);
      
      return {
        select: (columns: string = '*') => {
          console.log(`Selecting columns: ${columns} from ${table}`);
          
          return {
            eq: (column: string, value: any) => {
              console.log(`Filtering ${column} = ${value}`);
              
              return {
                order: (orderColumn: string, { ascending = true } = {}) => {
                  console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                  
                  return {
                    limit: (count: number) => {
                      console.log(`Limiting to ${count} results`);
                      return getTableData(table, { column, value });
                    },
                    ...getTableData(table, { column, value })
                  };
                },
                
                lt: (ltColumn: string, ltValue: any) => {
                  console.log(`Filtering ${ltColumn} < ${ltValue}`);
                  return {
                    order: (orderColumn: string, { ascending = true } = {}) => {
                      console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                      return getTableData(table, { column, value });
                    }
                  };
                },
                
                gt: (gtColumn: string, gtValue: any) => {
                  console.log(`Filtering ${gtColumn} > ${gtValue}`);
                  return {
                    order: (orderColumn: string, { ascending = true } = {}) => {
                      console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                      return getTableData(table, { column, value });
                    }
                  };
                },
                
                single: () => {
                  return new Promise(async (resolve) => {
                    try {
                      const result = await getTableData(table, { column, value });
                      
                      if (result.error) {
                        resolve(result);
                        return;
                      }
                      
                      // Return the first item as a single result
                      resolve({ 
                        data: result.data && result.data.length > 0 ? result.data[0] : null, 
                        error: null 
                      });
                    } catch (error) {
                      resolve(handleApiError(error, 'fetching single', table));
                    }
                  });
                },
                
                maybeSingle: () => {
                  return new Promise(async (resolve) => {
                    try {
                      const result = await getTableData(table, { column, value });
                      
                      if (result.error) {
                        resolve(result);
                        return;
                      }
                      
                      // Return the first item as a single result or null if not found
                      resolve({ 
                        data: result.data && result.data.length > 0 ? result.data[0] : null, 
                        error: null 
                      });
                    } catch (error) {
                      resolve(handleApiError(error, 'fetching maybeSingle', table));
                    }
                  });
                }
              };
            },
            
            limit: (count: number) => {
              console.log(`Limiting to ${count} results`);
              
              return {
                order: (orderColumn: string, { ascending = true } = {}) => {
                  console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                  return getTableData(table);
                },
                single: () => {
                  return new Promise(async (resolve) => {
                    try {
                      const result = await getTableData(table);
                      
                      if (result.error) {
                        resolve(result);
                        return;
                      }
                      
                      // Return the first item as a single result
                      resolve({ 
                        data: result.data && result.data.length > 0 ? result.data[0] : null, 
                        error: null 
                      });
                    } catch (error) {
                      resolve(handleApiError(error, 'fetching single', table));
                    }
                  });
                }
              };
            },
            
            order: (orderColumn: string, { ascending = true } = {}) => {
              console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
              
              return {
                limit: (count: number) => {
                  console.log(`Limiting to ${count} results`);
                  return getTableData(table);
                },
                ...getTableData(table)
              };
            },
            
            in: (column: string, values: any[]) => {
              console.log(`Filtering ${column} in [${values.join(', ')}]`);
              
              return {
                order: (orderColumn: string, { ascending = true } = {}) => {
                  console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                  
                  return new Promise(async (resolve) => {
                    try {
                      const result = await getTableData(table);
                      
                      if (result.error) {
                        resolve(result);
                        return;
                      }
                      
                      // Filter data by values
                      const filteredData = result.data && Array.isArray(result.data) ? 
                        result.data.filter((item: any) => item && values.includes(item[column])) : [];
                      
                      resolve({ data: filteredData, error: null });
                    } catch (error) {
                      resolve(handleApiError(error, 'filtering', table));
                    }
                  });
                }
              };
            }
          };
        },
        
        insert: (items: any[]) => {
          console.log(`Inserting into ${table}:`, items);
          
          return {
            select: (columns: string = '*') => {
              console.log(`Selecting columns after insert: ${columns}`);
              
              return {
                single: () => {
                  return new Promise(async (resolve) => {
                    try {
                      let data;
                      const item = items[0];
                      
                      switch (table) {
                        case 'carriers':
                          // Use API to create carrier
                          const carrierResponse = await api.post('/carriers', item);
                          data = carrierResponse.data;
                          break;
                        case 'products':
                          // Use API to create product
                          const productResponse = await api.post('/products', item);
                          data = productResponse.data;
                          break;
                        case 'positions':
                          // Use API to create position
                          const positionResponse = await api.post('/positions', item);
                          data = positionResponse.data;
                          break;
                        case 'deals':
                          data = await dealsAPI.create(item);
                          break;
                        case 'telegram_chats':
                          // Mock insert for telegram_chats
                          data = { ...item, id: uuidv4() };
                          break;
                        case 'integrations':
                          // Mock insert for integrations
                          data = { ...item, id: uuidv4() };
                          break;
                        case 'discord_notifications':
                          // Mock insert for discord_notifications
                          data = { ...item, id: uuidv4(), sent_at: new Date().toISOString() };
                          break;
                        case 'settings':
                          // Mock insert for settings
                          data = { ...item, id: uuidv4() };
                          break;
                        default:
                          console.warn(`No API method for inserting into table: ${table}`);
                          // Generate a fake ID for the item
                          data = { ...item, id: uuidv4() };
                      }
                      
                      resolve({ data, error: null });
                    } catch (error) {
                      resolve(handleApiError(error, 'inserting', table));
                    }
                  });
                }
              };
            }
          };
        },
        
        update: (updates: any) => {
          console.log(`Updating ${table}:`, updates);
          
          return {
            eq: (column: string, value: any) => {
              console.log(`Where ${column} = ${value}`);
              
              return {
                select: (columns: string = '*') => {
                  console.log(`Selecting columns after update: ${columns}`);
                  
                  return {
                    single: () => {
                      return new Promise(async (resolve) => {
                        try {
                          let data;
                          
                          switch (table) {
                            case 'carriers':
                              // Use API to update carrier
                              const carrierResponse = await api.put(`/carriers/${value}`, updates);
                              data = carrierResponse.data;
                              break;
                            case 'products':
                              // Use API to update product
                              const productResponse = await api.put(`/products/${value}`, updates);
                              data = productResponse.data;
                              break;
                            case 'positions':
                              // Use API to update position
                              const positionResponse = await api.put(`/positions/${value}`, updates);
                              data = positionResponse.data;
                              break;
                            case 'commission_splits':
                              // Use API to update commission split
                              const commissionResponse = await api.put(`/commission-splits/${value}`, updates);
                              data = commissionResponse.data;
                              break;
                            case 'users':
                              // Use API to update user
                              if (value === 'undefined' || !value) {
                                // Try to get the current user's ID
                                try {
                                  const userResponse = await api.get('/auth/me');
                                  const userId = userResponse.data.id;
                                  const userUpdateResponse = await api.put(`/users/${userId}`, updates);
                                  data = userUpdateResponse.data;
                                } catch (userError) {
                                  console.error('Error getting current user ID:', userError);
                                  throw new Error('User ID is undefined');
                                }
                              } else {
                                const userResponse = await api.put(`/users/${value}`, updates);
                                data = userResponse.data;
                              }
                              break;
                            case 'telegram_chats':
                              // Mock update for telegram_chats
                              data = { ...updates, id: value };
                              break;
                            case 'integrations':
                              // Mock update for integrations
                              data = { ...updates, id: value };
                              break;
                            case 'discord_notifications':
                              // Mock update for discord_notifications
                              data = { ...updates, id: value };
                              break;
                            case 'settings':
                              // Mock update for settings
                              data = { ...updates, id: value };
                              break;
                            default:
                              console.warn(`No API method for updating table: ${table}`);
                              data = { ...updates, id: value };
                          }
                          
                          resolve({ data, error: null });
                        } catch (error) {
                          resolve(handleApiError(error, 'updating', table));
                        }
                      });
                    }
                  };
                }
              };
            }
          };
        },
        
        delete: () => {
          console.log(`Deleting from ${table}`);
          
          return {
            eq: (column: string, value: any) => {
              console.log(`Where ${column} = ${value}`);
              
              return new Promise(async (resolve) => {
                try {
                  let data;
                  
                  switch (table) {
                    case 'carriers':
                      // Use API to delete carrier
                      const carrierResponse = await api.delete(`/carriers/${value}`);
                      data = carrierResponse.data;
                      break;
                    case 'products':
                      // Use API to delete product
                      const productResponse = await api.delete(`/products/${value}`);
                      data = productResponse.data;
                      break;
                    case 'positions':
                      // Use API to delete position
                      const positionResponse = await api.delete(`/positions/${value}`);
                      data = positionResponse.data;
                      break;
                    case 'commission_splits':
                      // Use API to delete commission split
                      const commissionResponse = await api.delete(`/commission-splits/${value}`);
                      data = commissionResponse.data;
                      break;
                    case 'telegram_chats':
                      // Mock delete for telegram_chats
                      data = { success: true };
                      break;
                    case 'integrations':
                      // Mock delete for integrations
                      data = { success: true };
                      break;
                    case 'discord_notifications':
                      // Mock delete for discord_notifications
                      data = { success: true };
                      break;
                    case 'settings':
                      // Mock delete for settings
                      data = { success: true };
                      break;
                    default:
                      console.warn(`No API method for deleting from table: ${table}`);
                      data = { success: true };
                  }
                  
                  resolve({ data, error: null });
                } catch (error) {
                  resolve(handleApiError(error, 'deleting', table));
                }
              });
            },
            
            in: (column: string, values: any[]) => {
              console.log(`Where ${column} in [${values.join(', ')}]`);
              
              return new Promise(async (resolve) => {
                try {
                  let data;
                  
                  switch (table) {
                    case 'commission_splits':
                      // Use API to delete commission splits
                      // This is a simplification - in a real app, you'd need to handle batch deletes
                      for (const value of values) {
                        await api.delete(`/commission-splits/${value}`);
                      }
                      data = { success: true };
                      break;
                    default:
                      console.warn(`No API method for batch deleting from table: ${table}`);
                      data = { success: true };
                  }
                  
                  resolve({ data, error: null });
                } catch (error) {
                  resolve(handleApiError(error, 'batch deleting', table));
                }
              });
            }
          };
        }
      };
    },
    
    // Storage API compatibility layer
    storage: {
      listBuckets: () => {
        console.log('Storage API: listBuckets called');
        return Promise.resolve({ data: [], error: null });
      },
      from: (bucket: string) => {
        console.log(`Storage API: accessing bucket '${bucket}'`);
        return {
          upload: (path: string, file: File) => {
            console.log(`Storage API: uploading file to ${bucket}/${path}`);
            // In a real implementation, you would use a file upload API endpoint
            return Promise.resolve({ data: { path }, error: null });
          },
          download: (path: string) => {
            console.log(`Storage API: downloading file from ${bucket}/${path}`);
            // In a real implementation, you would use a file download API endpoint
            return Promise.resolve({ data: null, error: null });
          },
          list: (prefix?: string) => {
            console.log(`Storage API: listing files in ${bucket}${prefix ? '/' + prefix : ''}`);
            return Promise.resolve({ data: [], error: null });
          },
          remove: (paths: string[]) => {
            console.log(`Storage API: removing files from ${bucket}: ${paths.join(', ')}`);
            return Promise.resolve({ data: { paths }, error: null });
          },
          getPublicUrl: (path: string) => {
            console.log(`Storage API: getting public URL for ${bucket}/${path}`);
            return { data: { publicUrl: `/storage/${bucket}/${path}` } };
          }
        };
      }
    },
    
    // Auth API compatibility layer
    auth: {
      signIn: ({ email, password }: { email: string; password: string }) => {
        console.log('Auth API: signIn called');
        return authAPI.login(email, password);
      },
      signOut: () => {
        console.log('Auth API: signOut called');
        return authAPI.logout();
      },
      getUser: () => {
        console.log('Auth API: getUser called');
        return authAPI.getCurrentUser();
      },
      getSession: () => {
        console.log('Auth API: getSession called');
        // Check if user is authenticated
        if (authAPI.isAuthenticated()) {
          return Promise.resolve({ 
            data: { 
              session: { 
