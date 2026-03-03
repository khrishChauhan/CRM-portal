const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
    sendAdminOTP,
    verifyAdminOTP,
    staffLogin,
    googleLogin,
    getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// ── OTP Rate Limiter: 5 requests per 15 minutes per IP ──
const otpRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many OTP requests. Please try again after 15 minutes.',
    },
});

// ── Admin Auth ──
router.post('/admin/send-otp', otpRateLimiter, sendAdminOTP);
router.post('/admin/verify-otp', verifyAdminOTP);

// ── Staff Auth (email + password) ──
router.post('/staff/login', staffLogin);

// ── Client Auth ──
router.post('/client/google-login', googleLogin);

// ── Protected: Get current logged-in user ──
router.get('/me', protect, getMe);

module.exports = router;