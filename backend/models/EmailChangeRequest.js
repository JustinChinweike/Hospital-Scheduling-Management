import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const EmailChangeRequest = sequelize.define('EmailChangeRequest', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  newEmail: { type: DataTypes.STRING, allowNull: false, validate: { isEmail: true } },
  token: { type: DataTypes.STRING, allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  used: { type: DataTypes.BOOLEAN, defaultValue: false }
});

export default EmailChangeRequest;
