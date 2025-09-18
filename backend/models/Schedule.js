
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Schedule = sequelize.define('Schedule', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  doctorName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  patientName: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dateTime: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  overbooked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});

// Each schedule belongs to a user who created it
Schedule.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Schedule, { foreignKey: 'userId' });

export default Schedule;
