import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const OverbookSuggestion = sequelize.define('OverbookSuggestion', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  department: { type: DataTypes.STRING, allowNull: false },
  doctorName: { type: DataTypes.STRING, allowNull: false },
  dateTime: { type: DataTypes.DATE, allowNull: false },
  risk: { type: DataTypes.ENUM('low','medium','high'), allowNull: false, defaultValue: 'low' },
  confidence: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0.6 },
  status: { type: DataTypes.ENUM('suggested','accepted','declined','expired'), allowNull: false, defaultValue: 'suggested' },
  acceptedByUserId: { type: DataTypes.UUID, allowNull: true },
});

export default OverbookSuggestion;
