const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
    submitQuery,
    getQueries,
    respondToQuery,
    getAllQueries
} = require('../controllers/projectQueryController');

// All routes require authentication
router.use(protect);

// Centralized queries inbox
router.get('/queries/all', authorize('admin', 'staff'), getAllQueries);

// Routes for /api/projects/:projectId/...
router.post('/projects/:projectId/query', upload.single('image'), authorize('client'), submitQuery);
router.get('/projects/:projectId/queries', authorize('admin', 'staff', 'client'), getQueries);

// Top level route for /api/queries/:queryId/respond
router.post('/queries/:queryId/respond', authorize('admin', 'staff'), respondToQuery);

module.exports = router;
