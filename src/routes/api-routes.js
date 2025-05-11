/**
 * API Routes
 * Defines all API routes for the application
 */

import express from 'express';
import * as handlers from '../handlers/index.js';

const router = express.Router();

// System Health Check Routes
router.get('/system/health', handlers.getSystemHealthChecks);
router.get('/system/health/:id', handlers.getSystemHealthCheckById);
router.post('/system/health', handlers.createSystemHealthCheck);
router.delete('/system/health/:id', handlers.deleteSystemHealthCheck);

// User Accounts Routes
router.get('/user/accounts', handlers.getUserAccounts);
router.get('/user/accounts/:userId', handlers.getUserAccountByUserId);
router.put('/user/accounts/:userId', handlers.updateUserAccount);

// Settings Routes
router.get('/settings', handlers.getAllSettings);
router.get('/settings/category/:category', handlers.getSettingsByCategory);
router.get('/settings/:category/:key', handlers.getSettingByKeyAndCategory);
router.post('/settings', handlers.upsertSetting);
router.delete('/settings/:category/:key', handlers.deleteSetting);

export default router;
