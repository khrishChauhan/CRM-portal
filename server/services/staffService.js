const User = require('../models/User');
const bcrypt = require('bcryptjs');
const ActivityLogService = require('./activityLogService');

/**
 * StaffService — encapsulates all staff-related business logic.
 * Controllers call these methods; services own the rules.
 */
class StaffService {

    /**
     * Build query filters from request query params
     */
    static buildFilters(query) {
        // Base filter: only non-deleted staff
        const filters = { role: 'staff', isDeleted: false };

        if (query.showDeleted === 'true') {
            delete filters.isDeleted;
        }

        if (query.status === 'active') filters.isActive = true;
        if (query.status === 'inactive') filters.isActive = false;
        if (query.department) filters.department = query.department;

        // Text search across name, email, designation
        if (query.search) {
            const searchRegex = new RegExp(query.search, 'i');
            filters.$or = [
                { name: searchRegex },
                { email: searchRegex },
                { designation: searchRegex },
                { department: searchRegex },
            ];
        }

        return filters;
    }

    /**
     * Fetch paginated staff list with filters, search, and populated manager
     */
    static async getAll({ page = 1, limit = 10, sort = '-createdAt', ...query }) {
        const filters = this.buildFilters(query);
        const skip = (page - 1) * limit;

        const [staff, total] = await Promise.all([
            User.find(filters)
                .select('-password -googleId -__v')
                .populate('reportingManager', 'name email designation department')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit)),
            User.countDocuments(filters),
        ]);

        return {
            staff,
            pagination: {
                total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(total / limit),
                hasNext: page * limit < total,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Get single staff by ID with populated manager
     */
    static async getById(id) {
        const staff = await User.findOne({ _id: id, role: 'staff', isDeleted: false })
            .select('-password -googleId -__v')
            .populate('reportingManager', 'name email designation department');

        if (!staff) {
            const error = new Error('Staff member not found');
            error.statusCode = 404;
            throw error;
        }

        return staff;
    }

    /**
     * Create a new staff member (Admin only)
     * Modified to accept adminId
     */
    static async create(data, adminId) {
        // Check email uniqueness
        const existing = await User.findOne({ email: data.email.trim().toLowerCase() });
        if (existing) {
            const error = new Error('A user with this email already exists');
            error.statusCode = 409;
            throw error;
        }

        // Validate reporting manager if provided
        if (data.reportingManager) {
            await this.validateReportingManager(data.reportingManager, null);
        }

        // Hash password
        if (!data.password || data.password.length < 6) {
            const error = new Error('Password must be at least 6 characters');
            error.statusCode = 400;
            throw error;
        }
        const hashedPassword = await bcrypt.hash(data.password, 12);

        const staff = await User.create({
            name: data.name.trim(),
            email: data.email.trim().toLowerCase(),
            password: hashedPassword,
            phone: data.phone?.trim(),
            alternatePhone: data.alternatePhone?.trim(),
            designation: data.designation?.trim(),
            department: data.department,
            joiningDate: data.joiningDate || new Date(),
            employmentType: data.employmentType || 'full-time',
            salaryBand: data.salaryBand?.trim(),
            reportingManager: data.reportingManager || null,
            role: 'staff',
            isActive: true,
            isDeleted: false,
        });

        // 📝 Log Activity
        const admin = await User.findById(adminId);
        if (admin) {
            await ActivityLogService.logEvent({
                actorId: adminId,
                actorRole: 'admin',
                actionType: 'STAFF_ADDED',
                entityType: 'user',
                entityId: staff._id,
                message: `Admin ${admin.name} added new staff member ${staff.name}`,
                metadata: { email: staff.email, department: staff.department }
            });
        }

        return User.findById(staff._id)
            .select('-password -googleId -__v')
            .populate('reportingManager', 'name email designation department');
    }

    /**
     * Update an existing staff member
     */
    static async update(id, data) {
        const staff = await User.findOne({ _id: id, role: 'staff', isDeleted: false });
        if (!staff) {
            const error = new Error('Staff member not found');
            error.statusCode = 404;
            throw error;
        }

        // Prevent changing role
        delete data.role;

        // Check email uniqueness if email is being changed
        if (data.email && data.email.trim().toLowerCase() !== staff.email) {
            const existing = await User.findOne({ email: data.email.trim().toLowerCase() });
            if (existing) {
                const error = new Error('A user with this email already exists');
                error.statusCode = 409;
                throw error;
            }
            staff.email = data.email.trim().toLowerCase();
        }

        // Validate reporting manager
        if (data.reportingManager !== undefined) {
            if (data.reportingManager) {
                await this.validateReportingManager(data.reportingManager, id);
            } else {
                staff.reportingManager = null;
            }
        }

        // Hash new password if provided
        if (data.password) {
            if (data.password.length < 6) {
                const error = new Error('Password must be at least 6 characters');
                error.statusCode = 400;
                throw error;
            }
            staff.password = await bcrypt.hash(data.password, 12);
        }

        // Update allowed fields
        const allowedFields = [
            'name', 'phone', 'alternatePhone', 'designation',
            'department', 'joiningDate', 'employmentType', 'salaryBand',
        ];
        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                staff[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
            }
        }

        if (data.reportingManager) {
            staff.reportingManager = data.reportingManager;
        }

        await staff.save();

        return User.findById(staff._id)
            .select('-password -googleId -__v')
            .populate('reportingManager', 'name email designation department');
    }

    /**
     * Toggle staff active/inactive status
     * Modified to accept adminId
     */
    static async toggleStatus(id, adminId) {
        const staff = await User.findOne({ _id: id, role: 'staff', isDeleted: false });
        if (!staff) {
            const error = new Error('Staff member not found');
            error.statusCode = 404;
            throw error;
        }

        staff.isActive = !staff.isActive;
        await staff.save();

        // 📝 Log Activity
        const admin = await User.findById(adminId);
        if (admin) {
            await ActivityLogService.logEvent({
                actorId: adminId,
                actorRole: 'admin',
                actionType: 'STAFF_STATUS_CHANGED',
                entityType: 'user',
                entityId: staff._id,
                message: `Admin ${admin.name} ${staff.isActive ? 'activated' : 'deactivated'} staff member ${staff.name}`,
                metadata: { isActive: staff.isActive }
            });
        }

        return {
            id: staff._id,
            isActive: staff.isActive,
            name: staff.name,
        };
    }

    /**
     * Soft delete — separates deactivation from permanent removal
     */
    static async softDelete(id) {
        const staff = await User.findOne({ _id: id, role: 'staff', isDeleted: false });
        if (!staff) {
            const error = new Error('Staff member not found');
            error.statusCode = 404;
            throw error;
        }

        // Check for subordinates
        const subordinates = await User.countDocuments({ reportingManager: id, role: 'staff', isDeleted: false });
        if (subordinates > 0) {
            const error = new Error(
                `Cannot deactivate: ${staff.name} is a reporting manager for ${subordinates} staff member(s). Reassign them first.`
            );
            error.statusCode = 400;
            throw error;
        }

        staff.isDeleted = true;
        staff.isActive = false;
        await staff.save();

        return { id: staff._id, name: staff.name, isDeleted: true };
    }

    /**
     * Get all active staff (for reporting manager dropdown)
     */
    static async getActiveStaffList() {
        return User.find({ role: 'staff', isActive: true, isDeleted: false })
            .select('name email designation department')
            .sort('name');
    }

    /**
     * Get staff statistics
     */
    static async getStats() {
        const [total, active, inactive, byDepartment] = await Promise.all([
            User.countDocuments({ role: 'staff', isDeleted: false }),
            User.countDocuments({ role: 'staff', isActive: true, isDeleted: false }),
            User.countDocuments({ role: 'staff', isActive: false, isDeleted: false }),
            User.aggregate([
                { $match: { role: 'staff', isActive: true, isDeleted: false } },
                { $group: { _id: '$department', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
        ]);

        return { total, active, inactive, byDepartment };
    }

    /**
     * Validate that a reporting manager reference is valid
     */
    static async validateReportingManager(managerId, staffId) {
        const manager = await User.findOne({ _id: managerId, isDeleted: false });

        if (!manager) {
            const error = new Error('Reporting manager not found or deleted');
            error.statusCode = 400;
            throw error;
        }

        if (manager.role !== 'staff' && manager.role !== 'admin') {
            const error = new Error('Reporting manager must be a staff member or admin');
            error.statusCode = 400;
            throw error;
        }

        if (!manager.isActive) {
            const error = new Error('Cannot assign an inactive user as reporting manager');
            error.statusCode = 400;
            throw error;
        }

        if (staffId && managerId.toString() === staffId.toString()) {
            const error = new Error('Staff member cannot be their own reporting manager');
            error.statusCode = 400;
            throw error;
        }
    }
}

module.exports = StaffService;
