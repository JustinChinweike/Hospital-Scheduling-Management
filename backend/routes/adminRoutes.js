
import express from 'express';
import { getMonitoredUsers, getLogs, getStatistics, flagUser, simulateActivity, exportLogsCSV } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

router.get('/monitored-users', getMonitoredUsers);
router.get('/logs', getLogs);
router.get('/logs/export/csv', exportLogsCSV);
router.get('/statistics', getStatistics);
router.post('/flag-user/:userId', flagUser);
router.post('/simulate-activity/:userId', simulateActivity);

export default router;
