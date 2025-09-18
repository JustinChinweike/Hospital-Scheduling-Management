
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const MonitoredUser = sequelize.define('MonitoredUser', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  reason: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pattern: {
    type: DataTypes.ENUM('HIGH_ACTIVITY','AUTH_FAILURES','UNKNOWN'),
    allowNull: false,
    defaultValue: 'UNKNOWN'
  },
  activityCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  failureCount: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  detectedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
  },
});

// Each monitored user record belongs to a user
MonitoredUser.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(MonitoredUser, { foreignKey: 'userId' });

export default MonitoredUser;
