
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import url from 'url';

dotenv.config();

let sequelize;
const hasUrl = !!process.env.DATABASE_URL;
const hasDiscrete = !!(process.env.DB_HOST && process.env.DB_NAME && process.env.DB_USER && process.env.DB_PASSWORD);

if (!hasUrl && !hasDiscrete) {
  throw new Error('Database configuration missing: provide DATABASE_URL or DB_HOST/DB_NAME/DB_USER/DB_PASSWORD');
}

if (hasUrl) {
  const parsed = url.parse(process.env.DATABASE_URL); // kept for possible future parsing needs
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
