/**
 * index.js
 * 
 * This file exports all API handlers.
 */

import {
  getAllSystemHealthChecks,
  getSystemHealthCheckById,
  createSystemHealthCheck,
  deleteSystemHealthCheck
} from './system-health-checks-handler.js';

import {
  getAllUserAccs,
  getUserAccById,
  createUserAcc,
  updateUserAcc,
  deleteUserAcc
} from './user-accs-handler.js';

import {
  getAllSettings,
  getSettingsByCategory,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting
} from './settings-handler.js';

// System health checks handlers
export const systemHealthChecksHandlers = {
  getAllSystemHealthChecks,
  getSystemHealthCheckById,
  createSystemHealthCheck,
  deleteSystemHealthCheck
};

// User accounts handlers
export const userAccsHandlers = {
  getAllUserAccs,
  getUserAccById,
  createUserAcc,
  updateUserAcc,
  deleteUserAcc
};

// Settings handlers
export const settingsHandlers = {
  getAllSettings,
  getSettingsByCategory,
  getSettingByKey,
  createSetting,
  updateSetting,
  deleteSetting
};

// Export all handlers
export default {
  systemHealthChecksHandlers,
  userAccsHandlers,
  settingsHandlers
};
