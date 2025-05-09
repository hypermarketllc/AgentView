/**
 * health-monitor-service.js
 * 
 * Service for monitoring the health of API endpoints and recording results.
 * This service provides functionality for running health checks on all endpoints
 * and retrieving health check history and summaries.
 */

import fetch from 'node-fetch';
import { v4 as uuidv4 } from 'uuid';
import { API_REGISTRY } from '../config/api-registry.js';

/**
 * Health Monitor Service class
 */
export class HealthMonitorService {
  /**
   * Constructor
   * 
   * @param {Object} dbPool - Database connection pool
   * @param {String} apiBaseUrl - Base URL for API endpoints
   */
  constructor(dbPool, apiBaseUrl) {
    this.dbPool = dbPool;
    this.apiBaseUrl = apiBaseUrl;
    this.authToken = null;
  }
  
  /**
   * Authenticate with the API to get a token for authenticated endpoints
   * 
   * @returns {Boolean} - Whether authentication was successful
   */
  async authenticate() {
    try {
      const response = await fetch(`${this.apiBaseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: process.env.ADMIN_EMAIL || 'admin@example.com',
          password: process.env.ADMIN_PASSWORD || 'Admin123!'
        })
      });
      
      if (!response.ok) {
        throw new Error(`Authentication failed: ${response.status}`);
      }
      
      const data = await response.json();
      this.authToken = data.token;
      return true;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }
  
  /**
   * Check a single endpoint
   * 
   * @param {String} category - Endpoint category
   * @param {String} endpointKey - Endpoint key
   * @param {Object} endpoint - Endpoint configuration
   * @returns {Object} - Check result
   */
  async checkEndpoint(category, endpointKey, endpoint) {
    const startTime = Date.now();
    const { path, method } = endpoint;
    const fullPath = `${this.apiBaseUrl}${path}`;
    
    try {
      const headers = {};
      if (endpoint.requiresAuth && this.authToken) {
        headers['Authorization'] = `Bearer ${this.authToken}`;
      }
      
      const response = await fetch(fullPath, { method, headers });
      const responseTime = Date.now() - startTime;
      
      let responseData = null;
      try {
        if (response.headers.get('content-type')?.includes('application/json')) {
          responseData = await response.json();
        }
      } catch (e) {
        // Ignore JSON parsing errors
      }
      
      // Record health check in database
      await this.dbPool.query(
        `INSERT INTO system_health_checks (
          id, endpoint, category, status, response_time, 
          status_code, error_message, response_data, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          uuidv4(),
          path,
          category,
          response.ok ? 'PASS' : 'FAIL',
          responseTime,
          response.status,
          response.ok ? null : `HTTP ${response.status} ${response.statusText}`,
          responseData ? JSON.stringify(responseData) : null
        ]
      );
      
      return {
        endpoint: path,
        category,
        status: response.ok ? 'PASS' : 'FAIL',
        responseTime,
        statusCode: response.status
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Record failed health check in database
      await this.dbPool.query(
        `INSERT INTO system_health_checks (
          id, endpoint, category, status, response_time, 
          status_code, error_message, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
        [
          uuidv4(),
          path,
          category,
          'FAIL',
          responseTime,
          null,
          error.message
        ]
      );
      
      return {
        endpoint: path,
        category,
        status: 'FAIL',
        responseTime,
        error: error.message
      };
    }
  }
  
  /**
   * Run health checks on all GET endpoints
   * 
   * @returns {Object} - Check results
   */
  async runAllChecks() {
    // Authenticate first if not already authenticated
    if (!this.authToken) {
      await this.authenticate();
    }
    
    const results = {
      summary: {
        total: 0,
        pass: 0,
        fail: 0,
        avgResponseTime: 0
      },
      categories: {},
      endpoints: []
    };
    
    let totalResponseTime = 0;
    
    // Check all GET endpoints
    for (const [categoryKey, category] of Object.entries(API_REGISTRY)) {
      if (!results.categories[categoryKey]) {
        results.categories[categoryKey] = {
          total: 0,
          pass: 0,
          fail: 0
        };
      }
      
      for (const [endpointKey, endpoint] of Object.entries(category)) {
        if (endpoint.method === 'GET') {
          const result = await this.checkEndpoint(categoryKey, endpointKey, endpoint);
          
          results.endpoints.push(result);
          results.summary.total++;
          results.categories[categoryKey].total++;
          
          if (result.status === 'PASS') {
            results.summary.pass++;
            results.categories[categoryKey].pass++;
          } else {
            results.summary.fail++;
            results.categories[categoryKey].fail++;
          }
          
          if (result.responseTime) {
            totalResponseTime += result.responseTime;
          }
        }
      }
    }
    
    // Calculate average response time
    if (results.summary.total > 0) {
      results.summary.avgResponseTime = Math.round(totalResponseTime / results.summary.total);
    }
    
    return results;
  }
  
  /**
   * Get health check history
   * 
   * @param {Object} options - Query options
   * @returns {Array} - Health check history
   */
  async getHealthHistory(options = {}) {
    const { 
      timeframe = '24h', 
      category = null,
      endpoint = null,
      limit = 100 
    } = options;
    
    let query = `
      SELECT 
        endpoint, category, status, response_time, 
        status_code, error_message, created_at
      FROM system_health_checks
      WHERE created_at > NOW() - INTERVAL '${timeframe}'
    `;
    
    const params = [];
    
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    if (endpoint) {
      params.push(endpoint);
      query += ` AND endpoint = $${params.length}`;
    }
    
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
    params.push(limit);
    
    const result = await this.dbPool.query(query, params);
    
    return result.rows;
  }
  
  /**
   * Get health check summary
   * 
   * @param {Object} options - Query options
   * @returns {Object} - Health check summary
   */
  async getHealthSummary(options = {}) {
    const { timeframe = '24h' } = options;
    
    // Get overall stats
    const overallStats = await this.dbPool.query(`
      SELECT 
        COUNT(*) as total_checks,
        SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) as passed_checks,
        SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) as failed_checks,
        AVG(response_time) as avg_response_time
      FROM system_health_checks
      WHERE created_at > NOW() - INTERVAL '${timeframe}'
    `);
    
    // Get stats by category
    const categoryStats = await this.dbPool.query(`
      SELECT 
        category,
        COUNT(*) as total_checks,
        SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) as passed_checks,
        SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) as failed_checks,
        AVG(response_time) as avg_response_time
      FROM system_health_checks
      WHERE created_at > NOW() - INTERVAL '${timeframe}'
      GROUP BY category
      ORDER BY category
    `);
    
    // Get stats by endpoint
    const endpointStats = await this.dbPool.query(`
      SELECT 
        endpoint,
        category,
        COUNT(*) as total_checks,
        SUM(CASE WHEN status = 'PASS' THEN 1 ELSE 0 END) as passed_checks,
        SUM(CASE WHEN status = 'FAIL' THEN 1 ELSE 0 END) as failed_checks,
        AVG(response_time) as avg_response_time,
        MAX(created_at) as last_check
      FROM system_health_checks
      WHERE created_at > NOW() - INTERVAL '${timeframe}'
      GROUP BY endpoint, category
      ORDER BY category, endpoint
    `);
    
    // Get most recent failures
    const recentFailures = await this.dbPool.query(`
      SELECT 
        id, endpoint, category, status_code, 
        error_message, created_at
      FROM system_health_checks
      WHERE status = 'FAIL'
      AND created_at > NOW() - INTERVAL '${timeframe}'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    return {
      overall: overallStats.rows[0],
      categories: categoryStats.rows,
      endpoints: endpointStats.rows,
      recentFailures: recentFailures.rows
    };
  }
  
  /**
   * Delete old health check records
   * 
   * @param {Number} days - Number of days to keep
   * @returns {Number} - Number of deleted records
   */
  async cleanupOldRecords(days = 7) {
    const result = await this.dbPool.query(`
      DELETE FROM system_health_checks
      WHERE created_at < NOW() - INTERVAL '${days} days'
      RETURNING id
    `);
    
    return result.rowCount;
  }
}
