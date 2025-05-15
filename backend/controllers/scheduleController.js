
import { Op } from 'sequelize';
import Schedule from '../models/Schedule.js';
import Log from '../models/Log.js';
import { io } from '../server.js';

// Create a new schedule
export const createSchedule = async (req, res) => {
  try {
    const { doctorName, patientName, dateTime, department } = req.body;

    // Create new schedule
    const schedule = await Schedule.create({
      doctorName,
      patientName,
      dateTime,
      department,
      userId: req.user.id,
    });

    // Log this action
    await Log.create({
      userId: req.user.id,
      action: 'CREATE',
      entityType: 'Schedule',
      entityId: schedule.id,
    });

    // Emit via websocket
    io.emit('new_schedule', schedule);

    res.status(201).json(schedule);
  } catch (error) {
    console.error('Error creating schedule:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all schedules with pagination, filtering, and sorting
export const getAllSchedules = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 20,
      doctorName,
      patientName,
      department,
      sortBy = 'dateTime',
      order = 'ASC'
    } = req.query;

    // Build filter conditions
    const whereClause = {};
    
    // Add user-specific filter (users only see their own schedules unless they're admin)
    if (req.user.role !== 'ADMIN') {
      whereClause.userId = req.user.id;
    }
    
    // Add search filters if provided
    if (doctorName) {
      whereClause.doctorName = { [Op.iLike]: `%${doctorName}%` };
    }
    
    if (patientName) {
      whereClause.patientName = { [Op.iLike]: `%${patientName}%` };
    }
    
    if (department && department !== 'all') {
      whereClause.department = department;
    }

    // Calculate offset for pagination
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Query with filters, sorting, and pagination
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: whereClause,
      order: [[sortBy, order]],
      offset,
      limit: parseInt(limit),
    });

    // Log this action (only log once per page request)
    await Log.create({
      userId: req.user.id,
      action: 'READ',
      entityType: 'Schedule',
      entityId: 'MULTIPLE',
    });

    res.json({
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get a specific schedule by ID
export const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user has access to this schedule
    if (req.user.role !== 'ADMIN' && schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this schedule' });
    }

    // Log this action
    await Log.create({
      userId: req.user.id,
      action: 'READ',
      entityType: 'Schedule',
      entityId: schedule.id,
    });

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update a schedule
export const updateSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user has access to update this schedule
    if (req.user.role !== 'ADMIN' && schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this schedule' });
    }

    // Update schedule
    await schedule.update(req.body);

    // Log this action
    await Log.create({
      userId: req.user.id,
      action: 'UPDATE',
      entityType: 'Schedule',
      entityId: schedule.id,
    });

    // Emit via websocket
    io.emit('updated_schedule', schedule);

    res.json(schedule);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete a schedule
export const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findByPk(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: 'Schedule not found' });
    }

    // Check if user has access to delete this schedule
    if (req.user.role !== 'ADMIN' && schedule.userId !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this schedule' });
    }

    // Get schedule ID before deletion
    const scheduleId = schedule.id;

    // Delete schedule
    await schedule.destroy();

    // Log this action
    await Log.create({
      userId: req.user.id,
      action: 'DELETE',
      entityType: 'Schedule',
      entityId: scheduleId,
    });

    // Emit via websocket
    io.emit('deleted_schedule', scheduleId);

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
