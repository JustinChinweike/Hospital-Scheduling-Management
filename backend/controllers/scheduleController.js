
import { Op } from 'sequelize';
import Schedule from '../models/Schedule.js';
import Log from '../models/Log.js';
import { io } from '../server.js';
import { getConfigInternal, inviteTopCandidateInternal } from './overbookController.js';

const buildWhereClause = (req) => {
  const { doctorName, patientName, department, startDate, endDate } = req.query;
  const whereClause = {};
  if (process.env.RESTRICT_SCHEDULES_TO_OWNER === 'true' && req.user.role !== 'ADMIN') {
    whereClause.userId = req.user.id;
  }
  if (doctorName) whereClause.doctorName = { [Op.iLike]: `%${doctorName}%` };
  if (patientName) whereClause.patientName = { [Op.iLike]: `%${patientName}%` };
  if (department && department !== 'all') whereClause.department = department;
  if (startDate || endDate) {
    const range = {};
    if (startDate) {
      const d = new Date(startDate);
      if (!isNaN(d.getTime())) range[Op.gte] = d;
    }
    if (endDate) {
      const d = new Date(endDate);
      if (!isNaN(d.getTime())) {
        const next = new Date(d.getTime());
        next.setDate(next.getDate() + 1);
        range[Op.lt] = next; // inclusive end of selected day
      }
    }
    if (Object.keys(range).length) whereClause.dateTime = range;
  }
  return whereClause;
};

// Create a new schedule
export const createSchedule = async (req, res) => {
  try {
    let { doctorName, patientName, dateTime, department } = req.body;

    if (!doctorName || !patientName || !dateTime || !department) {
      return res.status(400).json({ message: 'doctorName, patientName, dateTime, department are required' });
    }

    // Normalize strings
    doctorName = doctorName.trim();
    patientName = patientName.trim();
    department = department.trim();

    const parsedDate = new Date(dateTime);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Invalid dateTime format' });
    }

    // Conflict detection: assume 1-hour appointments per doctor
    const start = parsedDate;
    const end = new Date(parsedDate.getTime() + 60 * 60 * 1000);
    const startMinusHour = new Date(parsedDate.getTime() - 60 * 60 * 1000);
    const conflict = await Schedule.findOne({
      where: {
        doctorName: doctorName,
        dateTime: { [Op.gt]: startMinusHour, [Op.lt]: end },
      }
    });
    if (conflict) {
      return res.status(409).json({ message: 'Schedule conflict: Doctor has another appointment within this hour' });
    }

    const schedule = await Schedule.create({
      doctorName,
      patientName,
      dateTime: parsedDate,
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
      sortBy = 'dateTime',
      order = 'ASC'
    } = req.query;

    const allowedSort = ['dateTime','doctorName','patientName','department','createdAt'];
    const safeSort = allowedSort.includes(sortBy) ? sortBy : 'dateTime';
    const safeOrder = ['ASC','DESC'].includes(order.toUpperCase()) ? order.toUpperCase() : 'ASC';

    // Build filter conditions
    const whereClause = buildWhereClause(req);

    // Calculate offset for pagination
  const pageNum = Math.max(1, parseInt(page));
  const parsedLimit = parseInt(limit);
  const lim = Math.min(100, Math.max(1, isNaN(parsedLimit) ? 25 : parsedLimit));
  const offset = (pageNum - 1) * lim;

    // Query with filters, sorting, and pagination
    const { count, rows: schedules } = await Schedule.findAndCountAll({
      where: whereClause,
      order: [[safeSort, safeOrder]],
      offset,
      limit: lim,
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
      totalPages: Math.ceil(count / lim),
      currentPage: pageNum,
      data: schedules,
    });
  } catch (error) {
    console.error('Error fetching schedules:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

export const exportSchedulesCSV = async (req, res) => {
  try {
    const whereClause = buildWhereClause(req);
    const maxExport = parseInt(process.env.MAX_EXPORT_ROWS || '5000', 10);
    const rows = await Schedule.findAll({ where: whereClause, order: [['dateTime','ASC']], limit: maxExport + 1 });
    const limited = rows.length > maxExport;
    const data = limited ? rows.slice(0, maxExport) : rows;
    const header = ['doctorName','patientName','department','dateTime'];
    const lines = [header.join(',')];
    for (const r of data) {
      const vals = [r.doctorName, r.patientName, r.department, new Date(r.dateTime).toISOString()]
        .map(v => `"${String(v).replace(/"/g,'""')}"`);
      lines.push(vals.join(','));
    }
    const csv = lines.join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="schedules.csv"');
    if (limited) res.setHeader('X-Export-Limited', 'true');
    return res.status(200).send(csv);
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error: error.message });
  }
};

export const exportSchedulesICS = async (req, res) => {
  try {
    const whereClause = buildWhereClause(req);
    const maxExport = parseInt(process.env.MAX_EXPORT_ROWS || '5000', 10);
    const rows = await Schedule.findAll({ where: whereClause, order: [['dateTime','ASC']], limit: maxExport + 1 });
    const limited = rows.length > maxExport;
    const data = limited ? rows.slice(0, maxExport) : rows;

    const dtStamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const pad = (n) => String(n).padStart(2,'0');
    const addHour = (d) => new Date(d.getTime() + 60*60*1000);
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Hospital Scheduler//Export 1.0//EN'
    ];
    for (const r of data) {
      const start = new Date(r.dateTime);
      const end = addHour(start);
      const uid = `${r.id}@hospital-scheduler.local`;
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${uid}`);
      lines.push(`DTSTAMP:${dtStamp(new Date())}`);
      lines.push(`DTSTART:${dtStamp(start)}`);
      lines.push(`DTEND:${dtStamp(end)}`);
      lines.push(`SUMMARY:${(r.department || 'Appointment')} - ${r.doctorName} with ${r.patientName}`);
      lines.push('END:VEVENT');
    }
    lines.push('END:VCALENDAR');
    const ics = lines.join('\r\n');
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="schedules.ics"');
    if (limited) res.setHeader('X-Export-Limited', 'true');
    return res.status(200).send(ics);
  } catch (error) {
    res.status(500).json({ message: 'Export failed', error: error.message });
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

    // Conflict detection if dateTime or doctorName changed
    let newDateTime = schedule.dateTime;
    let newDoctorName = schedule.doctorName;
    if (req.body.dateTime) {
      const nd = new Date(req.body.dateTime);
      if (isNaN(nd.getTime())) {
        return res.status(400).json({ message: 'Invalid dateTime format' });
      }
      newDateTime = nd;
    }
    if (req.body.doctorName) {
      newDoctorName = String(req.body.doctorName).trim();
    }
    const start = newDateTime;
    const end = new Date(newDateTime.getTime() + 60 * 60 * 1000);
    const startMinusHour = new Date(newDateTime.getTime() - 60 * 60 * 1000);
    const conflict = await Schedule.findOne({
      where: {
        doctorName: newDoctorName,
        dateTime: { [Op.gt]: startMinusHour, [Op.lt]: end },
        id: { [Op.ne]: schedule.id }
      }
    });
    if (conflict) {
      return res.status(409).json({ message: 'Schedule conflict: Doctor has another appointment within this hour' });
    }

    // Update schedule
    const payload = { ...req.body };
    if (payload.dateTime) {
      const newDate = new Date(payload.dateTime);
      if (isNaN(newDate.getTime())) {
        return res.status(400).json({ message: 'Invalid dateTime format' });
      }
      payload.dateTime = newDate;
    }
    await schedule.update(payload);

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

  // Capture details for potential backfill
  const slotDate = new Date(schedule.dateTime);
  const slotDept = schedule.department;
  const slotDoctor = schedule.doctorName;

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

    // Auto-backfill from waitlist if enabled
    try {
      const cfg = await getConfigInternal();
      if (cfg?.enabled) {
        await inviteTopCandidateInternal({ department: slotDept, doctorName: slotDoctor, dateTime: slotDate });
      }
    } catch (e) {
      // silent fail; backfill is best-effort
    }

    res.json({ message: 'Schedule deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
