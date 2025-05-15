
import express from 'express';
import { getMonitoredUsers, getLogs, getStatistics } from '../controllers/adminController.js';
import { authenticate, isAdmin } from '../middleware/auth.js';

const router = express.Router();

// All admin routes require authentication and admin role
router.use(authenticate, isAdmin);

router.get('/monitored-users', getMonitoredUsers);
router.get('/logs', getLogs);
router.get('/statistics', getStatistics);

export default router;
