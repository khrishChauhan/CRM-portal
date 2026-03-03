const express = require('express');
const router = express.Router();
const {
    sendAdminOTP,
    verifyAdminOTP,
    staffLogin,
    googleLogin,
    getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const otpLimiter = require('../middleware/otpLimiter');

// ── Admin Auth ──
router.post('/admin/send-otp', otpLimiter, sendAdminOTP);
router.post('/admin/verify-otp', verifyAdminOTP);

// ── Staff Auth (email + password) ──
router.post('/staff/login', staffLogin);

// ── Client Auth ──
router.post('/client/google-login', googleLogin);

// ── Protected: Get current logged-in user ──
router.get('/me', protect, getMe);

module.exports = router;