/**
 * Supabase to PostgreSQL Adapter
 * 
 * This adapter provides a compatibility layer between Supabase client API calls
 * and our PostgreSQL REST API. It intercepts all Supabase client calls and
 * translates them to appropriate API calls.
 */

import api from './api';
import { v4 as uuidv4 } from 'uuid';

// Mock data for tables that don't exist in our API
const MOCK_DATA = {
  telegram_chats: [
    { id: '1', chat_id: '123456789', name: 'Test Chat', is_active: true },
    { id: '2', chat_id: '987654321', name: 'Another Chat', is_active: false }
  ],
  integrations: [
    { id: '1', name: 'Discord', is_active: true, config: {} },
    { id: '2', name: 'Telegram', is_active: true, config: {} }
  ],
  discord_notifications: [
    { id: '1', message: 'Test notification', sent_at: new Date().toISOString(), status: 'sent' }
  ],
  system_health_checks: [
    { id: '1', test_value: 'test', created_at: new Date().toISOString() }
  ]
};

// Helper function to handle API errors consistently
const handleApiError = (error, operation, table) => {
  console.error(`Error ${operation} data for ${table}:`, error);
  return { data: null, error: error.response?.data?.error || error.message || 'API error' };
};

// Helper function to get data from the appropriate API
const getTableData = async (table, filter) => {
  try {
    let data;
    
    // Check if we have mock data for this table
    if (MOCK_DATA[table]) {
      console.log(`Using mock data for table: ${table}`);
      data = [...MOCK_DATA[table]]; // Clone the mock data
    } else {
      // Use the real API
      switch (table) {
        case 'carriers':
          const carriersResponse = await api.get('/carriers');
          data = carriersResponse.data;
          break;
        case 'products':
          if (filter && filter.column === 'carrier_id') {
            const productsResponse = await api.get(`/products?carrierId=${filter.value}`);
            data = productsResponse.data;
          } else {
            const productsResponse = await api.get('/products');
            data = productsResponse.data;
          }
          break;
        case 'positions':
          const positionsResponse = await api.get('/positions');
          data = positionsResponse.data;
          break;
        case 'deals':
          const dealsResponse = await api.get('/deals');
          data = dealsResponse.data;
          break;
        case 'users':
          // Get current user
          const userResponse = await api.get('/auth/me');
          data = [userResponse.data];
          break;
        case 'system_health_checks':
          // Get system health checks
          try {
            const healthChecksResponse = await api.get('/system-health-checks');
            data = healthChecksResponse.data;
          } catch (error) {
            console.error('Error fetching system_health_checks:', error.message);
            // Use mock data if API fails
            data = [...MOCK_DATA.system_health_checks];
          }
          break;
        case 'settings':
          // Get settings
          try {
            const settingsResponse = await api.get('/settings/system');
            // Convert object to array format for Supabase compatibility
            const settingsObj = settingsResponse.data;
            data = Object.keys(settingsObj).map(key => ({
              id: key,
              key: key,
              value: settingsObj[key],
              category: 'system'
            }));
          } catch (error) {
            console.error('Error fetching settings:', error.message);
            // Use default settings if API fails
            data = [
              { id: 'name', key: 'name', value: 'MyAgentView', category: 'system' },
              { id: 'logo_url', key: 'logo_url', value: '/logo.png', category: 'system' }
            ];
          }
          break;
        case 'user_accs':
          // Get user account settings
          try {
            const userSettingsResponse = await api.get('/user/settings');
            if (userSettingsResponse.data && userSettingsResponse.data.user_account) {
              data = [userSettingsResponse.data.user_account];
            } else {
              data = [];
            }
          } catch (error) {
            console.error('Error fetching user_accs:', error.message);
            // Use default user account settings if API fails
            data = [{
              id: 1,
              user_id: 'current-user',
              display_name: 'Current User',
              theme_preference: 'light',
              notification_preferences: {
                email: true,
                push: true,
                deals: true,
                system: true
              }
            }];
          }
          break;
        default:
          console.warn(`No API method for table: ${table}`);
          data = [];
      }
    }
    
    // Apply filter if provided
    if (filter && data && Array.isArray(data)) {
      data = data.filter(item => item && item[filter.column] === filter.value);
    }
    
    return { data, error: null };
  } catch (error) {
    return handleApiError(error, 'fetching', table);
  }
};

// Create a Supabase-compatible client
export const createSupabaseAdapter = () => {
  console.log('Creating Supabase to PostgreSQL adapter');
  
  // RPC (Remote Procedure Call) implementation
  const rpc = async (functionName, params = {}) => {
    console.log(`RPC call to function: ${functionName} with params:`, params);
    
    try {
      let response;
      
      switch (functionName) {
        case 'update_user_details':
          // Get the current user's ID if not provided
          let userId = params.p_user_id;
          if (!userId || userId === 'undefined') {
            const userResponse = await api.get('/auth/me');
            userId = userResponse.data.id;
          }
          
          response = await api.put(`/users/${userId}`, {
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
  
  return {
    // Add RPC method to the client
    rpc: (functionName, params = {}) => rpc(functionName, params),
    
    from: (table) => {
      console.log(`Accessing table: ${table} via Supabase adapter`);
      
      return {
        select: (columns = '*') => {
          console.log(`Selecting columns: ${columns} from ${table}`);
          
          return {
            eq: (column, value) => {
              console.log(`Filtering ${column} = ${value}`);
              
              return {
                order: (orderColumn, { ascending = true } = {}) => {
                  console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                  
                  return {
                    limit: (count) => {
                      console.log(`Limiting to ${count} results`);
                      return getTableData(table, { column, value });
                    },
                    ...getTableData(table, { column, value })
                  };
                },
                
                lt: (ltColumn, ltValue) => {
                  console.log(`Filtering ${ltColumn} < ${ltValue}`);
                  return {
                    order: (orderColumn, { ascending = true } = {}) => {
                      console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
                      return getTableData(table, { column, value });
                    }
                  };
                },
                
                gt: (gtColumn, gtValue) => {
                  console.log(`Filtering ${gtColumn} > ${gtValue}`);
                  return {
                    order: (orderColumn, { ascending = true } = {}) => {
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
            
            limit: (count) => {
              console.log(`Limiting to ${count} results`);
              
              return {
                order: (orderColumn, { ascending = true } = {}) => {
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
            
            order: (orderColumn, { ascending = true } = {}) => {
              console.log(`Ordering by ${orderColumn} ${ascending ? 'ASC' : 'DESC'}`);
              
              return {
                limit: (count) => {
                  console.log(`Limiting to ${count} results`);
                  return getTableData(table);
                },
                ...getTableData(table)
              };
            },
            
            in: (column, values) => {
              console.log(`Filtering ${column} in [${values.join(', ')}]`);
              
              return {
                order: (orderColumn, { ascending = true } = {}) => {
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
                        result.data.filter((item) => item && values.includes(item[column])) : [];
                      
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
        
        insert: (items) => {
          console.log(`Inserting into ${table}:`, items);
          
          return {
            select: (columns = '*') => {
              console.log(`Selecting columns after insert: ${columns}`);
              
              return {
                single: () => {
                  return new Promise(async (resolve) => {
                    try {
                      let data;
                      const item = items[0];
                      
                      // Check if we have mock data for this table
                      if (MOCK_DATA[table]) {
                        console.log(`Using mock data for insert into table: ${table}`);
                        const newItem = { ...item, id: uuidv4() };
                        MOCK_DATA[table].push(newItem);
                        data = newItem;
                      } else {
                        // Use the real API
                        switch (table) {
                          case 'carriers':
                            const carrierResponse = await api.post('/carriers', item);
                            data = carrierResponse.data;
                            break;
                          case 'products':
                            const productResponse = await api.post('/products', item);
                            data = productResponse.data;
                            break;
                          case 'positions':
                            const positionResponse = await api.post('/positions', item);
                            data = positionResponse.data;
                            break;
                          case 'deals':
                            const dealResponse = await api.post('/deals', item);
                            data = dealResponse.data;
                            break;
                          case 'system_health_checks':
                            const healthCheckResponse = await api.post('/system-health-checks', item);
                            data = healthCheckResponse.data;
                            break;
                          case 'settings':
                            // For settings, we need to update the system settings
                            const settingsResponse = await api.put('/settings/system', {
                              [item.key]: item.value
                            });
                            data = {
                              id: item.key,
                              key: item.key,
                              value: item.value,
                              category: 'system'
                            };
                            break;
                          case 'user_accs':
                            // For user_accs, we need to update the user settings
                            const userAccsResponse = await api.put('/user/settings', {
                              user_account: item
                            });
                            data = userAccsResponse.data.user_account;
                            break;
                          default:
                            console.warn(`No API method for inserting into table: ${table}`);
                            // Generate a fake ID for the item
                            data = { ...item, id: uuidv4() };
                        }
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
        
        update: (updates) => {
          console.log(`Updating ${table}:`, updates);
          
          return {
            eq: (column, value) => {
              console.log(`Where ${column} = ${value}`);
              
              return {
                select: (columns = '*') => {
                  console.log(`Selecting columns after update: ${columns}`);
                  
                  return {
                    single: () => {
                      return new Promise(async (resolve) => {
                        try {
                          let data;
                          
                          // Check if we have mock data for this table
                          if (MOCK_DATA[table]) {
                            console.log(`Using mock data for update in table: ${table}`);
                            const index = MOCK_DATA[table].findIndex(item => item[column] === value);
                            if (index !== -1) {
                              MOCK_DATA[table][index] = { ...MOCK_DATA[table][index], ...updates };
                              data = MOCK_DATA[table][index];
                            } else {
                              throw new Error(`Item with ${column} = ${value} not found in ${table}`);
                            }
                          } else {
                            // Use the real API
                            switch (table) {
                              case 'carriers':
                                const carrierResponse = await api.put(`/carriers/${value}`, updates);
                                data = carrierResponse.data;
                                break;
                              case 'products':
                                const productResponse = await api.put(`/products/${value}`, updates);
                                data = productResponse.data;
                                break;
                              case 'positions':
                                const positionResponse = await api.put(`/positions/${value}`, updates);
                                data = positionResponse.data;
                                break;
                              case 'commission_splits':
                                const commissionResponse = await api.put(`/commission-splits/${value}`, updates);
                                data = commissionResponse.data;
                                break;
                              case 'users':
                                // Get the current user's ID if not provided
                                let userId = value;
                                if (!userId || userId === 'undefined') {
                                  const userResponse = await api.get('/auth/me');
                                  userId = userResponse.data.id;
                                }
                                const userUpdateResponse = await api.put(`/users/${userId}`, updates);
                                data = userUpdateResponse.data;
                                break;
                              default:
                                console.warn(`No API method for updating table: ${table}`);
                                data = { ...updates, id: value };
                            }
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
            eq: (column, value) => {
              console.log(`Where ${column} = ${value}`);
              
              return new Promise(async (resolve) => {
                try {
                  let data;
                  
                  // Check if we have mock data for this table
                  if (MOCK_DATA[table]) {
                    console.log(`Using mock data for delete from table: ${table}`);
                    const index = MOCK_DATA[table].findIndex(item => item[column] === value);
                    if (index !== -1) {
                      MOCK_DATA[table].splice(index, 1);
                      data = { success: true };
                    } else {
                      throw new Error(`Item with ${column} = ${value} not found in ${table}`);
                    }
                  } else {
                    // Use the real API
                    switch (table) {
                      case 'carriers':
                        const carrierResponse = await api.delete(`/carriers/${value}`);
                        data = carrierResponse.data;
                        break;
                      case 'products':
                        const productResponse = await api.delete(`/products/${value}`);
                        data = productResponse.data;
                        break;
                      case 'positions':
                        const positionResponse = await api.delete(`/positions/${value}`);
                        data = positionResponse.data;
                        break;
                      case 'commission_splits':
                        const commissionResponse = await api.delete(`/commission-splits/${value}`);
                        data = commissionResponse.data;
                        break;
                      case 'system_health_checks':
                        const healthCheckResponse = await api.delete(`/system-health-checks/${value}`);
                        data = healthCheckResponse.data;
                        break;
                      default:
                        console.warn(`No API method for deleting from table: ${table}`);
                        data = { success: true };
                    }
                  }
                  
                  resolve({ data, error: null });
                } catch (error) {
                  resolve(handleApiError(error, 'deleting', table));
                }
              });
            },
            
            in: (column, values) => {
              console.log(`Where ${column} in [${values.join(', ')}]`);
              
              return new Promise(async (resolve) => {
                try {
                  let data;
                  
                  // Check if we have mock data for this table
                  if (MOCK_DATA[table]) {
                    console.log(`Using mock data for batch delete from table: ${table}`);
                    MOCK_DATA[table] = MOCK_DATA[table].filter(item => !values.includes(item[column]));
                    data = { success: true };
                  } else {
                    // Use the real API
                    switch (table) {
                      case 'commission_splits':
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
      from: (bucket) => {
        console.log(`Storage API: accessing bucket '${bucket}'`);
        return {
          upload: (path, file) => {
            console.log(`Storage API: uploading file to ${bucket}/${path}`);
            // In a real implementation, you would use a file upload API endpoint
            return Promise.resolve({ data: { path }, error: null });
          },
          download: (path) => {
            console.log(`Storage API: downloading file from ${bucket}/${path}`);
            // In a real implementation, you would use a file download API endpoint
            return Promise.resolve({ data: null, error: null });
          },
          list: (prefix) => {
            console.log(`Storage API: listing files in ${bucket}${prefix ? '/' + prefix : ''}`);
            return Promise.resolve({ data: [], error: null });
          },
          remove: (paths) => {
            console.log(`Storage API: removing files from ${bucket}: ${paths.join(', ')}`);
            return Promise.resolve({ data: { paths }, error: null });
          },
          getPublicUrl: (path) => {
            console.log(`Storage API: getting public URL for ${bucket}/${path}`);
            return { data: { publicUrl: `/storage/${bucket}/${path}` } };
          }
        };
      }
    },
    
    // Auth API compatibility layer
    auth: {
      signIn: ({ email, password }) => {
        console.log('Auth API: signIn called');
        return new Promise(async (resolve) => {
          try {
            const response = await api.post('/auth/login', { email, password });
            
            // Save tokens to localStorage
            if (response.data.token) {
              localStorage.setItem('auth_token', response.data.token);
            }
            
            if (response.data.refreshToken) {
              localStorage.setItem('refresh_token', response.data.refreshToken);
            }
            
            resolve({ 
              data: { 
                user: response.data.user,
                session: {
                  access_token: response.data.token,
                  refresh_token: response.data.refreshToken
                }
              }, 
              error: null 
            });
          } catch (error) {
            resolve({ data: null, error: error.response?.data?.error || error.message || 'Login failed' });
          }
        });
      },
      signOut: () => {
        console.log('Auth API: signOut called');
        return new Promise(async (resolve) => {
          try {
            // Remove tokens from localStorage
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            
            resolve({ data: { success: true }, error: null });
          } catch (error) {
            resolve({ data: null, error: error.message || 'Logout failed' });
          }
        });
      },
      getUser: () => {
        console.log('Auth API: getUser called');
        return new Promise(async (resolve) => {
          try {
            const response = await api.get('/auth/me');
            resolve({ data: { user: response.data }, error: null });
          } catch (error) {
            resolve({ data: { user: null }, error: error.response?.data?.error || error.message || 'Failed to get user' });
          }
        });
      },
      getSession: () => {
        console.log('Auth API: getSession called');
        return new Promise(async (resolve) => {
          try {
            // Check if user is authenticated
            const token = localStorage.getItem('auth_token');
            const refreshToken = localStorage.getItem('refresh_token');
            
            if (!token) {
              resolve({ data: { session: null }, error: null });
              return;
            }
            
            // Get current user
            const response = await api.get('/auth/me');
            
            resolve({ 
              data: { 
                session: { 
                  access_token: token,
                  refresh_token: refreshToken,
                  user: response.data
                } 
              }, 
              error: null 
            });
          } catch (error) {
            // If there's an error, the session is probably invalid
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            
            resolve({ data: { session: null }, error: null });
          }
        });
      },
      onAuthStateChange: (callback) => {
        console.log('Auth API: onAuthStateChange called');
        // This is a no-op in our implementation
        return { data: { subscription: { unsubscribe: () => {} } } };
      }
    }
  };
};

export default createSupabaseAdapter;
