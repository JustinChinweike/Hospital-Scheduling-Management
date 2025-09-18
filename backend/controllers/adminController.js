
import { Op } from 'sequelize';
import User from '../models/User.js';
import Log from '../models/Log.js';
import MonitoredUser from '../models/MonitoredUser.js';
import sequelize from '../config/database.js';

const toCSV = (rows, headers) => {
  const lines = [headers.join(',')];
  for (const r of rows) {
    const vals = headers.map(h => {
      const v = r[h];
      return `"${String(v ?? '').replace(/"/g,'""')}"`;
    });
    lines.push(vals.join(','));
  }
  return lines.join('\n');
};

// Manually flag a user (admin utility / demo aid)
export const flagUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(400).json({ message: 'Cannot flag admin users' });

    const existing = await MonitoredUser.findOne({ where: { userId } });
    if (existing) return res.status(200).json(existing);

    const record = await MonitoredUser.create({
      userId,
      reason: 'Manually flagged by administrator',
      detectedAt: new Date().toISOString()
    });
    return res.status(201).json(record);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Simulate activity by inserting log entries for a user
export const simulateActivity = async (req, res) => {
  try {
    const { userId } = req.params;
    const { count = 5 } = req.query;
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.role === 'ADMIN') return res.status(400).json({ message: 'Cannot simulate for admin users' });

    const logsToCreate = Math.min(parseInt(count, 10) || 5, 50); // safety cap
    const bulk = [];
    for (let i = 0; i < logsToCreate; i++) {
      bulk.push({
        userId: user.id,
        action: 'READ',
        entityType: 'SIMULATION',
        entityId: `sim-${Date.now()}-${i}`
      });
    }
    await Log.bulkCreate(bulk);
    return res.json({ message: `Created ${bulk.length} simulated logs` });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
};

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

// Export logs as CSV (admin)
export const exportLogsCSV = async (req, res) => {
  try {
    const { userEmail, action, startDate, endDate } = req.query;
    const where = {};
    if (action) where.action = action;
    if (startDate || endDate) {
      const range = {};
      if (startDate) { const d = new Date(startDate); if (!isNaN(d.getTime())) range[Op.gte] = d; }
      if (endDate) { const d = new Date(endDate); if (!isNaN(d.getTime())) { const next = new Date(d.getTime()); next.setDate(next.getDate()+1); range[Op.lt] = next; } }
      if (Object.keys(range).length) where.createdAt = range;
    }
    const include = [{ model: User, attributes: ['email'], where: userEmail ? { email: userEmail } : undefined, required: !!userEmail }];
    const maxExport = parseInt(process.env.MAX_EXPORT_ROWS || '5000', 10);
    const results = await Log.findAll({ where, include, order: [['createdAt','DESC']], limit: maxExport + 1 });
    const limited = results.length > maxExport;
    const logs = limited ? results.slice(0, maxExport) : results;
    const dataRows = logs.map(l => ({
      createdAt: l.createdAt.toISOString(),
      userEmail: l.User?.email || '',
      action: l.action,
      entityType: l.entityType,
      entityId: l.entityId
    }));
    const csv = toCSV(dataRows, ['createdAt','userEmail','action','entityType','entityId']);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="logs.csv"');
    if (limited) res.setHeader('X-Export-Limited', 'true');
    return res.status(200).send(csv);
  } catch (error) {
    return res.status(500).json({ message: 'Export failed', error: error.message });
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
