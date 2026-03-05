const express = require('express');
const router = express.Router({ mergeParams: true });
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/upload');
const {
    createProjectUpdate,
    getProjectUpdates,
} = require('../controllers/projectUpdateController');

// All routes require authentication
router.use(protect);

// GET  /api/projects/:projectId/updates — Fetch feed
router.get('/', getProjectUpdates);

// POST /api/projects/:projectId/updates — Create update (with optional image)
router.post('/', upload.single('image'), createProjectUpdate);

module.exports = router;
