const express = require('express');
const router = express.Router();
const {
    getAdminDashboard,
    getStaffDashboard,
    getClientDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/staff', authorize('staff'), getStaffDashboard);
router.get('/client', authorize('client'), getClientDashboard);

module.exports = router;
