
import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';
import User from './User.js';

const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  action: {
    type: DataTypes.ENUM('CREATE', 'READ', 'UPDATE', 'DELETE'),
    allowNull: false,
  },
  entityType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  entityId: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

// Each log belongs to a user
Log.belongsTo(User, { foreignKey: 'userId' });
User.hasMany(Log, { foreignKey: 'userId' });

export default Log;
