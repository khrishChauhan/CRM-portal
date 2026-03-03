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
const authRoutes = require('./routes/authRoutes');
const staffRoutes = require('./routes/staffRoutes');
const clientRoutes = require('./routes/clientRoutes');
const projectRoutes = require('./routes/projectRoutes');
const accessRequestRoutes = require('./routes/accessRequestRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

// ── Debug: Verify environment variables loaded (dev only) ──
if (process.env.NODE_ENV !== 'production') {
    console.log('──────────────────────────────────────');
    console.log('🔧 Environment Check:');
    console.log(`   PORT            = ${process.env.PORT || '5000 (default)'}`);
    console.log(`   MONGO_URI       = ${process.env.MONGO_URI ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   JWT_SECRET      = ${process.env.JWT_SECRET ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   ADMIN_EMAIL     = ${process.env.ADMIN_EMAIL || '❌ MISSING'}`);
    console.log(`   GOOGLE_CLIENT_ID = ${process.env.GOOGLE_CLIENT_ID ? '✅ Set' : '❌ MISSING'}`);
    console.log(`   CLIENT_URL      = ${process.env.CLIENT_URL || 'http://localhost:5173 (default)'}`);
    console.log('──────────────────────────────────────');
}

// ── Connect to MongoDB ──
connectDB();

// ── Create Express app ──
const app = express();

// ── Security & parsing middleware ──
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
}));
// ── CORS: allow both localhost (dev) and deployed frontend ──
const allowedOrigins = [
    process.env.CLIENT_URL,
    'http://localhost:5173',
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, server-to-server)
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Request Logging (debug) ──
app.use(morgan('dev'));

// ── Debug logger: log every request's auth header (dev only) ──
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`📨 ${req.method} ${req.originalUrl}`);
        if (req.headers.authorization) {
            console.log(`   🔑 Auth: Bearer ${req.headers.authorization.split(' ')[1]?.substring(0, 20)}...`);
        }
        next();
    });
}

// ── API Routes ──
app.use('/api/auth', authRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/access-requests', accessRequestRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Health check ──
app.get('/', (req, res) => {
    res.json({ success: true, message: 'CRM API Running', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
    res.json({ success: true, message: 'Server is healthy', timestamp: new Date().toISOString() });
});

// ── 404 handler ──
app.use((req, res) => {
    res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// ── Global error handler ──
app.use((err, req, res, next) => {
    console.error('❌ Unhandled Error:', err.stack || err.message);
    res.status(err.statusCode || 500).json({
        success: false,
        message: err.message || 'Internal Server Error',
    });
});

// ── Start server ──
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
});