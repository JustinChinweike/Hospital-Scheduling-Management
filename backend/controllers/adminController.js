
import { Op } from 'sequelize';
import User from '../models/User.js';
import Log from '../models/Log.js';
import MonitoredUser from '../models/MonitoredUser.js';
import sequelize from '../config/database.js';

// Get list of monitored users
export const getMonitoredUsers = async (req, res) => {
  try {
    const monitoredUsers = await MonitoredUser.findAll({
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        }
      ],
      order: [['detectedAt', 'DESC']]
    });

    res.json(monitoredUsers);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get recent logs with pagination
export const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows: logs } = await Log.findAndCountAll({
      include: [
        {
          model: User,
          attributes: ['username', 'email']
        }
      ],
      order: [['createdAt', 'DESC']],
      offset,
      limit: parseInt(limit)
    });

    res.json({
      totalCount: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: logs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get basic statistics
export const getStatistics = async (req, res) => {
  try {
    // Total schedules
    const totalSchedules = await sequelize.query(
      'SELECT COUNT(*) as count FROM "Schedules"',
      { type: sequelize.QueryTypes.SELECT }
    );

    // Busiest doctor
    const busiestDoctor = await sequelize.query(
      'SELECT "doctorName", COUNT(*) as count FROM "Schedules" GROUP BY "doctorName" ORDER BY count DESC LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );

    // Most popular department
    const popularDepartment = await sequelize.query(
      'SELECT "department", COUNT(*) as count FROM "Schedules" GROUP BY "department" ORDER BY count DESC LIMIT 1',
      { type: sequelize.QueryTypes.SELECT }
    );

    res.json({
      totalAppointments: totalSchedules[0]?.count || 0,
      busiestDoctor: busiestDoctor[0]?.doctorName || 'None',
      popularDepartment: popularDepartment[0]?.department || 'None'
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
