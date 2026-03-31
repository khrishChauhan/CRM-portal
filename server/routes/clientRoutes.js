const express = require('express');
const router = express.Router();
const {
    getAllClients,
    getClientStats,
    getClientById,
    changeClientStatus,
} = require('../controllers/clientController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All client management routes require admin authentication
router.use(protect, authorize('admin'));

router.get('/', getAllClients);
router.get('/stats', getClientStats);
router.get('/:id', getClientById);
router.patch('/:id/status', changeClientStatus);

module.exports = router;
