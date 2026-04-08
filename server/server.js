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
const accessRequestRoutes = require('./routes/accessRequestRoutes');
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

// 2️⃣  CORS — dynamic origin validation (NO wildcards, NO app.options)
//     The cors middleware automatically responds to OPTIONS preflight
//     requests when used with app.use(). No manual app.options() needed.
const allowedOrigins = [
    'http://localhost:3000',
    'https://khushi-technology-application.onrender.com',
];

const corsOptions = {
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, Postman, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Not allowed by CORS'));
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
    app.use(morgan('combined')); // Apache-style logs for production monitoring
} else {
    app.use(morgan('dev'));       // Colored concise output for development
}

// ═══════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════

app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/projects/:projectId/updates', projectUpdateRoutes);
app.use('/api', projectQueryRoutes);

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