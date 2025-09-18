import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OverbookConfig = sequelize.define('OverbookConfig', {
  id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  riskThreshold: { type: DataTypes.ENUM('low','medium','high'), allowNull: false, defaultValue: 'low' },
  maxPerHour: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  holdMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 20 },
});

export default OverbookConfig;
