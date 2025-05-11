/**
 * api-service.js
 * 
 * This file provides services for making API requests.
 */

import API_ENDPOINTS from '../config/api-endpoints.js';

class ApiService {
  /**
   * Make a GET request to the API
   * @param {string} url - The URL to make the request to
   * @param {Object} params - The query parameters
   * @returns {Promise<Object>} - The response data
   */
  static async get(url, params = {}) {
    try {
      const queryString = Object.keys(params).length > 0
        ? '?' + new URLSearchParams(params).toString()
        : '';
      
      const response = await fetch(url + queryString);
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error making GET request:', error);
      throw error;
    }
  }
  
  /**
   * Make a POST request to the API
   * @param {string} url - The URL to make the request to
   * @param {Object} data - The data to send
   * @returns {Promise<Object>} - The response data
   */
  static async post(url, data = {}) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error making POST request:', error);
      throw error;
    }
  }
  
  /**
   * Make a PUT request to the API
   * @param {string} url - The URL to make the request to
   * @param {Object} data - The data to send
   * @returns {Promise<Object>} - The response data
   */
  static async put(url, data = {}) {
    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error making PUT request:', error);
      throw error;
    }
  }
  
  /**
   * Make a DELETE request to the API
   * @param {string} url - The URL to make the request to
   * @returns {Promise<Object>} - The response data
   */
  static async delete(url) {
    try {
      const response = await fetch(url, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error making DELETE request:', error);
      throw error;
    }
  }
  
  // System health checks API methods
  static async getAllSystemHealthChecks() {
    return this.get(API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.GET_ALL);
  }
  
  static async getSystemHealthCheckById(id) {
    const url = API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.GET_BY_ID.replace(':id', id);
    return this.get(url);
  }
  
  static async createSystemHealthCheck(data) {
    return this.post(API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.CREATE, data);
  }
  
  static async deleteSystemHealthCheck(id) {
    const url = API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.DELETE.replace(':id', id);
    return this.delete(url);
  }
  
  // User accounts API methods
  static async getAllUserAccs() {
    return this.get(API_ENDPOINTS.USER_ACCS.GET_ALL);
  }
  
  static async getUserAccById(id) {
    const url = API_ENDPOINTS.USER_ACCS.GET_BY_ID.replace(':id', id);
    return this.get(url);
  }
  
  static async createUserAcc(data) {
    return this.post(API_ENDPOINTS.USER_ACCS.CREATE, data);
  }
  
  static async updateUserAcc(id, data) {
    const url = API_ENDPOINTS.USER_ACCS.UPDATE.replace(':id', id);
    return this.put(url, data);
  }
  
  static async deleteUserAcc(id) {
    const url = API_ENDPOINTS.USER_ACCS.DELETE.replace(':id', id);
    return this.delete(url);
  }
  
  // Settings API methods
  static async getAllSettings() {
    return this.get(API_ENDPOINTS.SETTINGS.GET_ALL);
  }
  
  static async getSettingsByCategory(category) {
    const url = API_ENDPOINTS.SETTINGS.GET_BY_CATEGORY.replace(':category', category);
    return this.get(url);
  }
  
  static async getSettingByKey(category, key) {
    const url = API_ENDPOINTS.SETTINGS.GET_BY_KEY
      .replace(':category', category)
      .replace(':key', key);
    return this.get(url);
  }
  
  static async createSetting(data) {
    return this.post(API_ENDPOINTS.SETTINGS.CREATE, data);
  }
  
  static async updateSetting(id, data) {
    const url = API_ENDPOINTS.SETTINGS.UPDATE.replace(':id', id);
    return this.put(url, data);
  }
  
  static async deleteSetting(id) {
    const url = API_ENDPOINTS.SETTINGS.DELETE.replace(':id', id);
    return this.delete(url);
  }
}

export default ApiService;
