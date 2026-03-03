const express = require('express');
const router = express.Router();
const {
    getAllStaff,
    getStaffStats,
    getManagerList,
    getStaffById,
    createStaff,
    updateStaff,
    toggleStaffStatus,
    deleteStaff,
} = require('../controllers/staffController');
const { protect, authorize } = require('../middleware/authMiddleware');

// All staff management routes require admin authentication
router.use(protect, authorize('admin'));

// ── Collection routes ──
router.get('/', getAllStaff);
router.post('/', createStaff);

// ── Utility routes (must come before :id param routes) ──
router.get('/stats', getStaffStats);
router.get('/managers', getManagerList);

// ── Individual resource routes ──
router.get('/:id', getStaffById);
router.put('/:id', updateStaff);
router.patch('/:id/toggle-status', toggleStaffStatus);
router.delete('/:id', deleteStaff);

module.exports = router;
