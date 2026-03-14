const express = require('express');
const router = express.Router();
const {
    getAllProjects,
    getDashboardStats,
    getDropdowns,
    getProjectById,
    createProject,
    updateProject,
    deleteProject,
    getMyProjects,
    getMyApprovedProjects,
    staffUpdateProject,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All routes require authentication
router.use(protect);

// ── Staff-specific routes (before :id to avoid param conflict) ──
router.get('/my', authorize('staff'), getMyProjects);
router.get('/my-approved', authorize('client'), getMyApprovedProjects);
router.patch('/:id/staff-update', authorize('staff'), staffUpdateProject);

// ── Admin-only routes ──
router.get('/dashboard', authorize('admin'), getDashboardStats);
router.get('/dropdowns', authorize('admin'), getDropdowns);
router.get('/', authorize('admin'), getAllProjects);
router.post('/', authorize('admin'), createProject);
router.get('/:id', authorize('admin', 'staff', 'client'), getProjectById);
router.put('/:id', authorize('admin'), updateProject);
router.delete('/:id', authorize('admin'), deleteProject);

module.exports = router;
