import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Waitlist = sequelize.define('Waitlist', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  department: { type: DataTypes.STRING, allowNull: false },
  doctorName: { type: DataTypes.STRING, allowNull: true },
  patientName: { type: DataTypes.STRING, allowNull: false },
  patientEmail: { type: DataTypes.STRING, allowNull: true },
  priority: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.ENUM('waiting','invited','confirmed','expired','cancelled'), allowNull: false, defaultValue: 'waiting' },
  holdExpiresAt: { type: DataTypes.DATE, allowNull: true },
  inviteToken: { type: DataTypes.STRING, allowNull: true },
  invitedSlotDateTime: { type: DataTypes.DATE, allowNull: true },
});

export default Waitlist;
