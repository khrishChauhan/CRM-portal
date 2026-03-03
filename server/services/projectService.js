const { Project } = require('../models/Project');
const User = require('../models/User');
const ActivityLogService = require('./activityLogService');

/**
 * ProjectService — encapsulates all project management business logic.
 *
 * Architecture:
 *   - Project creation does NOT include client assignment
 *   - Client access is managed via AccessRequest model
 *   - Staff access is managed via assignedStaff array
 */
class ProjectService {

    static buildFilters(query) {
        const filters = { isDeleted: false };

        if (query.status) filters.projectStatus = query.status;
        if (query.priority) filters.priority = query.priority;
        if (query.projectManager) filters.projectManager = query.projectManager;
        if (query.showDeleted === 'true') delete filters.isDeleted;

        if (query.search) {
            const re = new RegExp(query.search, 'i');
            filters.$or = [
                { projectName: re },
                { projectCode: re },
                { projectCategory: re },
                { siteAddress: re },
            ];
        }

        return filters;
    }

    /**
     * List projects with pagination, search, and filters
     */
    static async getAll({ page = 1, limit = 10, sort = '-createdAt', ...query }) {
        const filters = this.buildFilters(query);
        const skip = (page - 1) * limit;

        const [projects, total] = await Promise.all([
            Project.find(filters)
                .populate('projectManager', 'name email designation')
                .populate('createdBy', 'name')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Project.countDocuments(filters),
        ]);

        return {
            projects,
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
     * Get single project with all populated references
     */
    static async getById(id) {
        const project = await Project.findOne({ _id: id, isDeleted: false })
            .populate('projectManager', 'name email designation department')
            .populate('assignedStaff', 'name email designation department')
            .populate('createdBy', 'name email');

        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }

        return project;
    }

    /**
     * Create a new project (Admin only)
     *
     * NO client assignment at creation.
     * Clients request access separately via AccessRequest.
     */
    static async create(data, createdById) {
        // Validate project manager
        if (data.projectManager) {
            await this.validateStaffRef(data.projectManager, 'Project manager');
        }

        // Validate assigned staff
        if (data.assignedStaff?.length) {
            for (const staffId of data.assignedStaff) {
                await this.validateStaffRef(staffId, 'Assigned staff');
            }
        }

        const project = await Project.create({
            projectName: data.projectName.trim(),
            projectCategory: data.projectCategory?.trim(),
            description: data.description?.trim(),
            siteAddress: data.siteAddress?.trim(),
            projectManager: data.projectManager || null,
            assignedStaff: data.assignedStaff || [],
            startDate: data.startDate || null,
            expectedCompletion: data.expectedCompletion || null,
            projectStatus: data.projectStatus || 'Planned',
            priority: data.priority || 'Medium',
            riskLevel: data.riskLevel || 'Low',
            createdBy: createdById,
        });

        // 📝 Log Activity
        const creator = await User.findById(createdById);
        await ActivityLogService.logEvent({
            actorId: createdById,
            actorRole: creator.role,
            actionType: 'PROJECT_CREATED',
            entityType: 'project',
            entityId: project._id,
            message: `${creator.role.charAt(0).toUpperCase() + creator.role.slice(1)} ${creator.name} created project ${project.projectName}`,
            metadata: { projectCode: project.projectCode }
        });

        return Project.findById(project._id)
            .populate('projectManager', 'name email designation')
            .populate('assignedStaff', 'name email designation')
            .populate('createdBy', 'name');
    }

    /**
     * Update a project (Admin only)
     * Modified to accept updaterId for logging
     */
    static async update(id, data, updaterId) {
        const project = await Project.findOne({ _id: id, isDeleted: false });
        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }

        // Immutable fields
        delete data.projectCode;
        delete data.createdBy;

        // Validate references if being changed
        if (data.projectManager) {
            await this.validateStaffRef(data.projectManager, 'Project manager');
        }
        if (data.assignedStaff?.length) {
            for (const staffId of data.assignedStaff) {
                await this.validateStaffRef(staffId, 'Assigned staff');
            }
        }

        // Update allowed fields
        const allowed = [
            'projectName', 'projectCategory', 'description', 'siteAddress',
            'projectManager', 'assignedStaff',
            'startDate', 'expectedCompletion', 'actualCompletion',
            'projectStatus', 'priority', 'riskLevel', 'delayReason',
        ];

        const changes = [];
        for (const field of allowed) {
            if (data[field] !== undefined) {
                if (project[field]?.toString() !== data[field]?.toString()) {
                    changes.push(field);
                }
                project[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
            }
        }

        await project.save(); // Triggers pre-save auto-status logic

        // 📝 Log Activity
        const updater = await User.findById(updaterId);
        if (updater && changes.length > 0) {
            await ActivityLogService.logEvent({
                actorId: updaterId,
                actorRole: updater.role,
                actionType: 'PROJECT_UPDATED',
                entityType: 'project',
                entityId: project._id,
                message: `${updater.role.charAt(0).toUpperCase() + updater.role.slice(1)} ${updater.name} updated project ${project.projectName}`,
                metadata: { projectCode: project.projectCode, changes }
            });
        }

        return Project.findById(project._id)
            .populate('projectManager', 'name email designation')
            .populate('assignedStaff', 'name email designation')
            .populate('createdBy', 'name');
    }

    /**
     * Staff can update limited fields only
     */
    static async staffUpdate(id, staffId, data) {
        const project = await Project.findOne({
            _id: id,
            isDeleted: false,
            $or: [{ projectManager: staffId }, { assignedStaff: staffId }],
        });

        if (!project) {
            const error = new Error('Project not found or you are not assigned');
            error.statusCode = 404;
            throw error;
        }

        const staffAllowed = ['projectStatus', 'delayReason', 'actualCompletion', 'riskLevel'];
        for (const field of staffAllowed) {
            if (data[field] !== undefined) {
                project[field] = typeof data[field] === 'string' ? data[field].trim() : data[field];
            }
        }

        await project.save();

        // 📝 Log Activity
        const staff = await User.findById(staffId);
        await ActivityLogService.logEvent({
            actorId: staffId,
            actorRole: staff.role,
            actionType: 'PROJECT_UPDATED',
            entityType: 'project',
            entityId: project._id,
            message: `Staff ${staff.name} updated progress for ${project.projectName}`,
            metadata: { status: project.projectStatus }
        });

        return Project.findById(project._id)
            .populate('projectManager', 'name email designation')
            .populate('assignedStaff', 'name email');
    }

    /**
     * Soft delete
     */
    static async softDelete(id) {
        const project = await Project.findOne({ _id: id, isDeleted: false });
        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }

        project.isDeleted = true;
        project.deletedAt = new Date();
        await project.save();

        return { id: project._id, projectCode: project.projectCode, projectName: project.projectName };
    }

    /**
     * Get projects assigned to a specific staff member
     */
    static async getStaffProjects(staffId, { page = 1, limit = 10 }) {
        const filters = {
            isDeleted: false,
            $or: [{ projectManager: staffId }, { assignedStaff: staffId }],
        };
        const skip = (page - 1) * limit;

        const [projects, total] = await Promise.all([
            Project.find(filters)
                .populate('projectManager', 'name email')
                .sort('-updatedAt')
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            Project.countDocuments(filters),
        ]);

        return {
            projects,
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
     * Get projects approved for a specific client
     */
    static async getClientProjects(clientId) {
        const client = await User.findOne({ _id: clientId, role: 'client', isDeleted: false })
            .select('approvedProjects');

        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        const approvedIds = client.approvedProjects || [];

        return Project.find({
            _id: { $in: approvedIds },
            isDeleted: false
        })
            .populate('projectManager', 'name email designation')
            .sort('-updatedAt')
            .lean();
    }

    // ════════════════════════════════════════
    //  Dashboard Aggregations
    // ════════════════════════════════════════

    static async getDashboardStats() {
        const [
            projectsByStatus,
            projectsByPriority,
            monthlyCreation,
            totalProjects,
            deletedProjects,
            activeClients,
            activeStaff,
        ] = await Promise.all([
            Project.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$projectStatus', count: { $sum: 1 } } },
                { $sort: { count: -1 } },
            ]),
            Project.aggregate([
                { $match: { isDeleted: false } },
                { $group: { _id: '$priority', count: { $sum: 1 } } },
            ]),
            Project.aggregate([
                {
                    $match: {
                        createdAt: { $gte: new Date(new Date().setMonth(new Date().getMonth() - 12)) },
                    },
                },
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' },
                        },
                        count: { $sum: 1 },
                    },
                },
                { $sort: { '_id.year': 1, '_id.month': 1 } },
            ]),
            Project.countDocuments({ isDeleted: false }),
            Project.countDocuments({ isDeleted: true }),
            User.countDocuments({ role: 'client', clientStatus: 'active' }),
            User.countDocuments({ role: 'staff', isActive: true }),
        ]);

        const statusMap = {};
        projectsByStatus.forEach(s => { statusMap[s._id] = s.count; });

        return {
            overview: {
                total: totalProjects,
                active: (statusMap['In Progress'] || 0) + (statusMap['Planned'] || 0),
                completed: statusMap['Completed'] || 0,
                delayed: statusMap['Delayed'] || 0,
                onHold: statusMap['On Hold'] || 0,
                cancelled: statusMap['Cancelled'] || 0,
                deleted: deletedProjects,
            },
            projectsByStatus,
            projectsByPriority,
            monthlyCreation,
            activeClients,
            activeStaff,
        };
    }

    // ════════════════════════════════════════
    //  Reference Validators
    // ════════════════════════════════════════

    static async validateStaffRef(userId, label = 'Staff') {
        const user = await User.findById(userId);
        if (!user) {
            const error = new Error(`${label} not found`);
            error.statusCode = 400;
            throw error;
        }
        if (user.role !== 'staff' && user.role !== 'admin') {
            const error = new Error(`${label} must be a staff member or admin`);
            error.statusCode = 400;
            throw error;
        }
        if (!user.isActive) {
            const error = new Error(`Cannot assign inactive ${label.toLowerCase()}`);
            error.statusCode = 400;
            throw error;
        }
    }

    /**
     * Get active staff for form dropdowns (no clients needed anymore)
     */
    static async getDropdownData() {
        const staff = await User.find({ role: 'staff', isActive: true })
            .select('name email designation department')
            .sort('name')
            .lean();

        return { staff };
    }
}

module.exports = ProjectService;
