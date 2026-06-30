const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const socketIO = require('socket.io');
const dotenv = require('dotenv');
const logger = require('./services/logger');

// Load environment variables
dotenv.config();

// Import routes
const authRoutes = require('./routes/auth');
const healthRoutes = require('./routes/health');
const analysisRoutes = require('./routes/analysis');
const alertRoutes = require('./routes/alerts');
const interventionRoutes = require('./routes/interventions');
const userRoutes = require('./routes/users');

// Import middleware
const authMiddleware = require('./middleware/auth');
const errorHandler = require('./middleware/errorHandler');

// Import services
const { initializeMQTT } = require('./services/mqtt');
const { initializeFirebase } = require('./services/firebase');
const RealtimeProcessor = require('./services/realtimeProcessor');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Store io instance for use in routes
app.set('io', io);

// ==================== Middleware ====================

// Security middleware
app.use(helmet());
app.use(cors());

// Body parser middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// ==================== Routes ====================

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/health', authMiddleware, healthRoutes);
app.use('/api/analysis', authMiddleware, analysisRoutes);
app.use('/api/alerts', authMiddleware, alertRoutes);
app.use('/api/interventions', authMiddleware, interventionRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// ==================== WebSocket Events ====================

io.on('connection', (socket) => {
  logger.info(`New WebSocket connection: ${socket.id}`);

  socket.on('subscribe-device', (deviceId) => {
    socket.join(`device-${deviceId}`);
    logger.info(`Socket ${socket.id} subscribed to device ${deviceId}`);
  });

  socket.on('unsubscribe-device', (deviceId) => {
    socket.leave(`device-${deviceId}`);
    logger.info(`Socket ${socket.id} unsubscribed from device ${deviceId}`);
  });

  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
});

// ==================== Error Handling ====================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Global error handler
app.use(errorHandler);

// ==================== Initialize Services ====================

async function initializeServices() {
  try {
    // Initialize Firebase
    logger.info('Initializing Firebase...');
    await initializeFirebase();
    logger.info('Firebase initialized successfully');

    // Initialize MQTT
    logger.info('Initializing MQTT...');
    const mqttClient = await initializeMQTT();
    app.set('mqttClient', mqttClient);
    logger.info('MQTT initialized successfully');

    // Initialize Realtime Processor
    logger.info('Initializing Realtime Processor...');
    const realtimeProcessor = new RealtimeProcessor(io, mqttClient);
    await realtimeProcessor.start();
    app.set('realtimeProcessor', realtimeProcessor);
    logger.info('Realtime Processor initialized successfully');

    // Start server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to initialize services:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('Unhandled Rejection:', err);
  process.exit(1);
});

// Start application
initializeServices();

module.exports = { app, server, io };
