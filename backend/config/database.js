
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import url from 'url';

dotenv.config();

// Support either a single DATABASE_URL or discrete DB_* vars
let sequelize;
if (process.env.DATABASE_URL) {
  // Example: postgres://user:pass@host:5432/dbname
  const parsed = url.parse(process.env.DATABASE_URL);
  const [user, password] = (parsed.auth || '').split(':');
  const dbName = (parsed.pathname || '').replace(/^\//, '');
  sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: process.env.DB_SSL === 'true' ? { require: true, rejectUnauthorized: false } : undefined,
    },
    logging: false,
  });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      dialect: 'postgres',
      logging: false,
    }
  );
}

export default sequelize;
