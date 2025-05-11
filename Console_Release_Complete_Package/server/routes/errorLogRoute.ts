import express from 'express';
import { getErrorLogs } from '../controllers/errorLogController';

const router = express.Router();

router.get('/errors', getErrorLogs);

export default router;