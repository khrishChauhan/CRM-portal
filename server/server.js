const path = require('path');
const dotenv = require('dotenv');

// ── Load .env only in development (Render injects env vars in production) ──
if (process.env.NODE_ENV !== 'production') {
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const connectDB = require('./config/db');

// ── Route imports ──
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');

const dashboardRoutes = require('./routes/dashboardRoutes');
const projectUpdateRoutes = require('./routes/projectUpdateRoutes');
const projectQueryRoutes = require('./routes/projectQueryRoutes');

// ── Debug: Verify environment variables loaded (dev only) ──
if (process.env.NODE_ENV !== 'production') {
    console.log('──────────────────────────────────────');
    console.log('🔧 Environment Check:');
    console.log(`   NODE_ENV        = ${process.env.NODE_ENV || 'undefined (defaults to dev)'}`);
    console.log(`   PORT            = ${process.env.PORT || '5000 (default)'}`);
    console.log(`   MONGO_URI       = ${process.env.MONGO_URI ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   JWT_SECRET      = ${process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   CLIENT_URL      = ${process.env.CLIENT_URL || '❌ MISSING'}`);
    console.log(`   GOOGLE_CLIENT_ID = ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   CLOUDINARY      = ${process.env.CLOUDINARY_CLOUD_NAME ? '✅ Configured' : '❌ MISSING'}`);
    console.log('──────────────────────────────────────');
}

// ── Connect to MongoDB ──
connectDB();

// ── Create Express app ──
const app = express();

// ═══════════════════════════════════════════════════════════════
// MIDDLEWARE — Order matters: helmet → cors → parsers → logging
// ═══════════════════════════════════════════════════════════════

// 1️⃣  Security headers
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// 2️⃣  CORS — with debug logging + temporary safe fallback
const allowedOrigins = [
    'http://localhost:3000',
    'https://khushi-technology-application.onrender.com',
];

const corsOptions = {
    origin: (origin, callback) => {
        console.log('🌐 Incoming Origin:', origin);

        if (!origin) {
            console.log('✅ No origin (server-to-server/curl)');
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            console.log('✅ Allowed origin:', origin);
            return callback(null, true);
        }

        // ⚠️ TEMPORARY: allow unknown origins so we can debug
        // TODO: replace with strict rejection once CORS is confirmed working
        console.log('⚠️ Unknown origin, temporarily allowing:', origin);
        return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));

// 3️⃣  Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 4️⃣  Request logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
} else {
    app.use(morgan('dev'));
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects/:projectId/updates', projectUpdateRoutes);
app.use('/api', projectQueryRoutes);

// ── CORS test route ──
app.get('/api/test-cors', (req, res) => {
    res.json({
        success: true,
        message: 'CORS is working!',
        origin: req.headers.origin || 'none',
        timestamp: new Date().toISOString(),
    });
});

// ── Health check ──
app.get('/', (req, res) => {
    res.json({ success: true, message: 'CRM API Running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// ═══════════════════════════════════════════════════════════════
// ERROR HANDLING
// ═══════════════════════════════════════════════════════════════

// 404 — No route matched
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.originalUrl} not found`,
    });
});

// Global error handler — never leak stack traces in production
app.use((err, req, res, next) => {
    const statusCode = err.statusCode || 500;

    // Log full error server-side for debugging
    console.error(`❌ [${statusCode}] ${req.method} ${req.originalUrl}:`, err.message);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }

    res.status(statusCode).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal Server Error'
            : err.message || 'Internal Server Error',
    });
});

// ═══════════════════════════════════════════════════════════════
// START SERVER
// ═══════════════════════════════════════════════════════════════

const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Allowed origins: ${allowedOrigins.join(', ')}`);
});