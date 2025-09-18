import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Session = sequelize.define('Session', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.UUID, allowNull: false },
  tokenId: { type: DataTypes.STRING, allowNull: false },
  userAgent: { type: DataTypes.STRING },
  ip: { type: DataTypes.STRING },
  revoked: { type: DataTypes.BOOLEAN, defaultValue: false }
});

export default Session;
