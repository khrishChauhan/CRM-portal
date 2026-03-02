const express = require('express');
const router = express.Router();
const {
    sendAdminOTP,
    verifyAdminOTP,
    staffLogin,
    googleLogin,
    createStaff
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Admin Auth
router.post('/admin/send-otp', sendAdminOTP);
router.post('/admin/verify-otp', verifyAdminOTP);

// Staff Auth
router.post('/staff/login', staffLogin);

// Client Auth
router.post('/client/google-login', googleLogin);

// System Management (Admin Only)
router.post('/admin/create-staff', protect, authorize('admin'), createStaff);

module.exports = router;