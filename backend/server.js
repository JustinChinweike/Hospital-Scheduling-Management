
import express from 'express';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import sequelize from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import overbookRoutes from './routes/overbookRoutes.js';

// Monitoring thread
import { startMonitoring } from './utils/monitoringThread.js';

dotenv.config();

// Environment validation: allow either discrete DB_* vars or a DATABASE_URL
const requiredAlways = ['JWT_SECRET'];
const hasDatabaseUrl = !!process.env.DATABASE_URL;
const requiredDb = hasDatabaseUrl ? [] : ['DB_HOST','DB_PORT','DB_NAME','DB_USER','DB_PASSWORD'];
const requiredEnv = [...requiredAlways, ...requiredDb];
const missing = requiredEnv.filter(k => !process.env[k]);
if (missing.length) {
  console.warn(`⚠️  Missing environment variables: ${missing.join(', ')}. If you provided DATABASE_URL this may be fine.`);
}

const app = express();
const server = http.createServer(app);

// Determine allowed origin (fallback to wildcard only if not provided)
const allowedOrigin = process.env.FRONTEND_URL || '*';

// Set up Socket.io with tightened CORS settings
export const io = new Server(server, {
  cors: {
    origin: allowedOrigin,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
// Serve uploaded files
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Simple health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// API Routes
app.use('/auth', authRoutes);
app.use('/schedules', scheduleRoutes);
app.use('/admin', adminRoutes);
app.use('/overbook', overbookRoutes);

// Socket.io event handlers
io.on('connection', (socket) => {
  console.log('New client connected');
  
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});


// Initialize database and start server
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connection established');
  await sequelize.sync({ alter: true });
  startMonitoring(io);
  server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
  } catch (err) {
    console.error('❌ Failed to start server (message):', err?.message || 'No message');
    console.error('❌ Full error object:', err);
    if (err?.stack) console.error('❌ Stack:', err.stack);
  console.error(`\nTroubleshooting Steps:\n 1. Ensure backend/.env exists (copy from .env.example)\n 2. Confirm PostgreSQL running and reachable (psql or docker logs)\n 3. Verify DB credentials & user permissions\n 4. If using Docker: run 'docker ps' to confirm db container healthy\n 5. If still failing, try: npx sequelize-cli db:migrate (if migrations added).`);
    // Do not exit immediately so nodemon shows full logs & allows editing
  }
};

start();
