import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { db } from './db/db.js';
import authRoutes from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import catalogRoutes from './routes/catalogRoutes.js';
import customMealRoutes from './routes/customMealRoutes.js';
import mealPlanRoutes from './routes/mealPlanRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import sellerRoutes from './routes/sellerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import trackingRoutes from './routes/trackingRoutes.js';
import userRoutes from './routes/userRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);

const PORT = parseInt(process.env.PORT || '5000', 10);
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Determine configured allowed origins
const configuredOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim()).filter(Boolean)
  : [];

if (CLIENT_URL && !configuredOrigins.includes(CLIENT_URL)) {
  configuredOrigins.push(CLIENT_URL);
}

function isOriginAllowed(origin) {
  // Allow non-browser requests (server-to-server, health probes, curl)
  if (!origin) return true;
  // Always permit local dev origins
  if (/^http:\/\/localhost(:[0-9]+)?$/.test(origin)) return true;
  if (/^http:\/\/127\.0\.0\.1(:[0-9]+)?$/.test(origin)) return true;

  // In non-production, be permissive
  if (process.env.NODE_ENV !== 'production') return true;

  // Match configured explicit origins
  if (configuredOrigins.includes(origin)) return true;

  // Match Vercel preview domains dynamically (e.g. https://fitbite-abc-xyz.vercel.app)
  if (/^https:\/\/[a-zA-Z0-9_-]+\.vercel\.app$/.test(origin)) return true;

  return false;
}

const corsOptions = {
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Rejected request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not permitted by FitBite CORS policy`));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
};

// Socket.IO for real-time tracking milestones and kitchen alerts
const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('CORS origin rejected for socket'));
      }
    },
    methods: ['GET', 'POST'],
    credentials: true
  }
});

app.set('io', io);

io.on('connection', (socket) => {
  // Join room for order tracking or seller notifications
  socket.on('join_order', (orderId) => {
    socket.join(`order_${orderId}`);
  });

  socket.on('join_seller', (sellerId) => {
    socket.join(`seller_${sellerId}`);
  });
});

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static uploads directories (public meal images vs private verification documents)
const uploadsDir = path.resolve(__dirname, '../uploads');
const publicUploadsDir = path.resolve(__dirname, '../uploads/public');
if (!fs.existsSync(publicUploadsDir)) fs.mkdirSync(publicUploadsDir, { recursive: true });

app.use('/uploads/public', express.static(publicUploadsDir, { maxAge: '7d' }));
app.use('/uploads', express.static(uploadsDir));
app.use('/images', express.static(publicUploadsDir, { maxAge: '7d' }));

// System Health Endpoints (Root and /api/health for PaaS probes like Render, Railway, AWS ECS)
const healthHandler = (req, res) => {
  res.json({
    status: 'UP',
    service: 'fitbite-backend',
    database_mode: db.getMode(),
    uptime_seconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// Mount Application Routes
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/catalog', catalogRoutes);
app.use('/api/custom-meals', customMealRoutes);
app.use('/api/meal-plans', mealPlanRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/subscriptions', subscriptionRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/seller', sellerRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/tracking', trackingRoutes);
app.use('/api/user', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);

// 404 Handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[FitBite Server Error]', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

function validateEnvironment() {
  console.log(`[Config] Node Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Config] Database Host: ${process.env.DB_HOST || (process.env.DATABASE_URL ? 'via DATABASE_URL' : 'localhost')}`);
  console.log(`[Config] Java Meal Planner URL: ${process.env.JAVA_MEAL_PLANNER_URL || 'http://localhost:8082'}`);
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('dev-jwt-secret')) {
      console.warn('[SECURITY WARNING] Using default or insecure JWT_SECRET in production! Please configure a unique JWT_SECRET.');
    }
  }
}

// Start Server after Database Initialization
async function startServer() {
  try {
    validateEnvironment();
    await db.init();
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`====================================================`);
      console.log(`  FitBite Backend Running on 0.0.0.0:${PORT}`);
      console.log(`  Database Mode: ${db.getMode().toUpperCase()}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`  Allowed Origins: ${configuredOrigins.length ? configuredOrigins.join(', ') : 'Dynamic Vercel & Localhost'}`);
      console.log(`====================================================`);
    });
  } catch (err) {
    console.error('Fatal: Failed to start FitBite server:', err);
    process.exit(1);
  }
}

startServer();

export { app, server };
