const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    submitQuery,
    getQueries,
    respondToQuery
} = require('../controllers/projectQueryController');

// All routes require authentication
router.use(protect);

// Routes for /api/projects/:projectId/...
router.post('/projects/:projectId/query', authorize('client'), submitQuery);
router.get('/projects/:projectId/queries', authorize('admin', 'staff', 'client'), getQueries);

// Top level route for /api/queries/:queryId/respond
router.post('/queries/:queryId/respond', authorize('admin', 'staff'), respondToQuery);

module.exports = router;
