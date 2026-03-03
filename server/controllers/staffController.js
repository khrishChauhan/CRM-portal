const StaffService = require('../services/staffService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * StaffController — thin layer that handles HTTP concerns.
 * All business logic lives in StaffService.
 */

// GET /api/staff — List all staff (paginated, searchable, filterable)
exports.getAllStaff = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort, search, status, department } = req.query;
        console.log(`📋 Staff list request: page=${page}, limit=${limit}, search="${search || ''}", status="${status || 'all'}", dept="${department || 'all'}"`);

        const result = await StaffService.getAll({
            page: Number(page),
            limit: Number(limit),
            sort: sort || '-createdAt',
            search,
            status,
            department,
        });

        return sendSuccess(res, result, 'Staff list fetched');
    } catch (error) {
        console.error('❌ Get staff list error:', error.message);
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// GET /api/staff/stats — Staff statistics
exports.getStaffStats = async (req, res) => {
    try {
        const stats = await StaffService.getStats();
        return sendSuccess(res, stats, 'Staff stats fetched');
    } catch (error) {
        console.error('❌ Get staff stats error:', error.message);
        return sendError(res, error.message, 500);
    }
};

// GET /api/staff/managers — Active staff for manager dropdown
exports.getManagerList = async (req, res) => {
    try {
        const managers = await StaffService.getActiveStaffList();
        return sendSuccess(res, managers, 'Manager list fetched');
    } catch (error) {
        console.error('❌ Get manager list error:', error.message);
        return sendError(res, error.message, 500);
    }
};

// GET /api/staff/:id — Single staff member
exports.getStaffById = async (req, res) => {
    try {
        const staff = await StaffService.getById(req.params.id);
        return sendSuccess(res, staff, 'Staff member fetched');
    } catch (error) {
        console.error('❌ Get staff by ID error:', error.message);
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// POST /api/staff — Create new staff
exports.createStaff = async (req, res) => {
    try {
        console.log(`👤 Admin creating staff: ${req.body.name} (${req.body.email})`);
        const staff = await StaffService.create(req.body, req.user.id);
        console.log(`✅ Staff created: ${staff.name}`);
        return sendSuccess(res, staff, 'Staff member created successfully', 201);
    } catch (error) {
        console.error('❌ Create staff error:', error.message);
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// PUT /api/staff/:id — Update staff
exports.updateStaff = async (req, res) => {
    try {
        console.log(`✏️ Updating staff: ${req.params.id}`);
        const staff = await StaffService.update(req.params.id, req.body);
        console.log(`✅ Staff updated: ${staff.name}`);
        return sendSuccess(res, staff, 'Staff member updated successfully');
    } catch (error) {
        console.error('❌ Update staff error:', error.message);
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// PATCH /api/staff/:id/toggle-status — Activate/deactivate
exports.toggleStaffStatus = async (req, res) => {
    try {
        const result = await StaffService.toggleStatus(req.params.id, req.user.id);
        const status = result.isActive ? 'activated' : 'deactivated';
        console.log(`🔄 Staff ${status}: ${result.name}`);
        return sendSuccess(res, result, `Staff member ${status} successfully`);
    } catch (error) {
        console.error('❌ Toggle status error:', error.message);
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// DELETE /api/staff/:id — Soft delete (deactivate)
exports.deleteStaff = async (req, res) => {
    try {
        const result = await StaffService.softDelete(req.params.id);
        console.log(`🗑️ Staff soft-deleted: ${result.name}`);
        return sendSuccess(res, result, 'Staff member deactivated successfully');
    } catch (error) {
        console.error('❌ Delete staff error:', error.message);
        return sendError(res, error.message, error.statusCode || 400);
    }
};
