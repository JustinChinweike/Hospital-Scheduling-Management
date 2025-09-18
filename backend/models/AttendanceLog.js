import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const AttendanceLog = sequelize.define('AttendanceLog', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  scheduleId: { type: DataTypes.UUID, allowNull: false },
  patientName: { type: DataTypes.STRING, allowNull: false },
  doctorName: { type: DataTypes.STRING, allowNull: false },
  department: { type: DataTypes.STRING, allowNull: false },
  dateTime: { type: DataTypes.DATE, allowNull: false },
  outcome: { type: DataTypes.ENUM('attended','no-show','cancelled-late','cancelled'), allowNull: false },
});

export default AttendanceLog;
