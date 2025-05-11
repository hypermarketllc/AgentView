/**
 * api-registry.js
 * 
 * This file registers API routes.
 */

import express from 'express';
import API_ENDPOINTS from './api-endpoints.js';
import handlers from '../handlers/index.js';

const { systemHealthChecksHandlers, userAccsHandlers, settingsHandlers } = handlers;

/**
 * Register API routes
 * @param {express.Application} app - The Express application
 */
export function registerApiRoutes(app) {
  // System health checks routes
  app.get(API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.GET_ALL, systemHealthChecksHandlers.getAllSystemHealthChecks);
  app.get(API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.GET_BY_ID, systemHealthChecksHandlers.getSystemHealthCheckById);
  app.post(API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.CREATE, systemHealthChecksHandlers.createSystemHealthCheck);
  app.delete(API_ENDPOINTS.SYSTEM_HEALTH_CHECKS.DELETE, systemHealthChecksHandlers.deleteSystemHealthCheck);
  
  // User accounts routes
  app.get(API_ENDPOINTS.USER_ACCS.GET_ALL, userAccsHandlers.getAllUserAccs);
  app.get(API_ENDPOINTS.USER_ACCS.GET_BY_ID, userAccsHandlers.getUserAccById);
  app.post(API_ENDPOINTS.USER_ACCS.CREATE, userAccsHandlers.createUserAcc);
  app.put(API_ENDPOINTS.USER_ACCS.UPDATE, userAccsHandlers.updateUserAcc);
  app.delete(API_ENDPOINTS.USER_ACCS.DELETE, userAccsHandlers.deleteUserAcc);
  
  // Settings routes
  app.get(API_ENDPOINTS.SETTINGS.GET_ALL, settingsHandlers.getAllSettings);
  app.get(API_ENDPOINTS.SETTINGS.GET_BY_CATEGORY, settingsHandlers.getSettingsByCategory);
  app.get(API_ENDPOINTS.SETTINGS.GET_BY_KEY, settingsHandlers.getSettingByKey);
  app.post(API_ENDPOINTS.SETTINGS.CREATE, settingsHandlers.createSetting);
  app.put(API_ENDPOINTS.SETTINGS.UPDATE, settingsHandlers.updateSetting);
  app.delete(API_ENDPOINTS.SETTINGS.DELETE, settingsHandlers.deleteSetting);
}
