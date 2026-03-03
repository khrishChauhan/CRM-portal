const express = require('express');
const router = express.Router();
const {
    requestAccess,
    getMyRequests,
    getPublicProjects,
    getAllRequests,
    getRequestStats,
    approveRequest,
    rejectRequest,
} = require('../controllers/accessRequestController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ── Client endpoints ──
router.post('/', authorize('client'), requestAccess);
router.get('/my', authorize('client'), getMyRequests);
router.get('/projects', authorize('client'), getPublicProjects);

// ── Admin endpoints ──
router.get('/stats', authorize('admin'), getRequestStats);
router.get('/', authorize('admin'), getAllRequests);
router.patch('/:id/approve', authorize('admin'), approveRequest);
router.patch('/:id/reject', authorize('admin'), rejectRequest);

module.exports = router;
