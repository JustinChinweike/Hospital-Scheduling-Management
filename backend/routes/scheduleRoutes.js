
import express from 'express';
import { 
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  exportSchedulesCSV,
  exportSchedulesICS
} from '../controllers/scheduleController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

router.post('/', createSchedule);
router.get('/', getAllSchedules);
router.get('/export/csv', exportSchedulesCSV);
router.get('/export/ics', exportSchedulesICS);
router.get('/:id', getScheduleById);
router.patch('/:id', updateSchedule);
router.delete('/:id', deleteSchedule);

export default router;
