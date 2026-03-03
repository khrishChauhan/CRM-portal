const AccessRequest = require('../models/AccessRequest');
const { Project } = require('../models/Project');
const User = require('../models/User');
const ActivityLogService = require('./activityLogService');
const mongoose = require('mongoose');

/**
 * AccessRequestService — handles the project access request flow.
 *
 * Flow:
 *   1. Client sees all non-deleted projects (public listing)
 *   2. Client clicks "Request Access" → creates AccessRequest (pending)
 *   3. Admin reviews → approves or rejects
 *   4. On approval → projectId added to client's approvedProjects[]
 *   5. Client can now see full project details
 */
class AccessRequestService {

    /**
     * Client: Request access to a project
     */
    static async requestAccess(clientId, projectId, message = '') {
        // Verify project exists
        const project = await Project.findOne({ _id: projectId, isDeleted: false });
        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify client is active
        const client = await User.findOne({ _id: clientId, role: 'client', isDeleted: false });
        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }
        if (client.clientStatus === 'suspended' || !client.isActive) {
            const error = new Error('Your account is suspended or inactive. Contact admin.');
            error.statusCode = 403;
            throw error;
        }

        // Check if already approved
        if (client.approvedProjects?.some(id => id.toString() === projectId.toString())) {
            const error = new Error('You already have access to this project');
            error.statusCode = 400;
            throw error;
        }

        // Check for existing request
        const existing = await AccessRequest.findOne({ clientId, projectId });
        if (existing) {
            if (existing.status === 'pending') {
                const error = new Error('You already have a pending request for this project');
                error.statusCode = 400;
                throw error;
            }
            if (existing.status === 'approved') {
                const error = new Error('This project is already approved');
                error.statusCode = 400;
                throw error;
            }
            // If rejected, allow re-request
            existing.status = 'pending';
            existing.message = message || existing.message;
            existing.reviewedBy = null;
            existing.reviewedAt = null;
            existing.rejectionReason = null;
            await existing.save();
            return existing;
        }

        // Create new request
        const request = await AccessRequest.create({ clientId, projectId, message });
        return request;
    }

    /**
     * Client: Get my access requests
     */
    static async getMyRequests(clientId) {
        return AccessRequest.find({ clientId })
            .populate('projectId', 'projectCode projectName projectStatus priority siteAddress projectCategory')
            .sort('-createdAt')
            .lean();
    }

    /**
     * Admin: Get all access requests with aggregation-based stats and search
     * Uses MongoDB Aggregation Facilites ($facet) for production efficiency
     */
    static async getAllRequests({ page = 1, limit = 10, status, search }) {
        const skip = (page - 1) * limit;

        // Base match for requests
        const matchStage = {};
        if (status) {
            matchStage.status = status;
        }

        // Pipeline for gathering stats AND paginated results in one trip
        const pipeline = [
            { $match: matchStage },
            // Join Client User
            {
                $lookup: {
                    from: 'users',
                    localField: 'clientId',
                    foreignField: '_id',
                    as: 'client'
                }
            },
            { $unwind: '$client' },
            // Join Project
            {
                $lookup: {
                    from: 'projects',
                    localField: 'projectId',
                    foreignField: '_id',
                    as: 'project'
                }
            },
            { $unwind: '$project' },
            // Search filters
            ...(search ? [{
                $match: {
                    $or: [
                        { 'client.name': new RegExp(search, 'i') },
                        { 'client.email': new RegExp(search, 'i') },
                        { 'project.projectName': new RegExp(search, 'i') },
                        { 'project.projectCode': new RegExp(search, 'i') }
                    ]
                }
            }] : []),
            // Main aggregation facet
            {
                $facet: {
                    // Branch 1: Stats (Total, Pending, Approved, Rejected)
                    stats: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: 1 },
                                pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                                approved: { $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] } },
                                rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } }
                            }
                        }
                    ],
                    // Branch 2: Paginated Data
                    data: [
                        { $sort: { createdAt: -1 } },
                        { $skip: skip },
                        { $limit: Number(limit) },
                        {
                            $project: {
                                _id: 1,
                                status: 1,
                                message: 1,
                                createdAt: 1,
                                updatedAt: 1,
                                rejectionReason: 1,
                                reviewedAt: 1,
                                'client.name': 1,
                                'client.email': 1,
                                'client.company': 1,
                                'project.projectName': 1,
                                'project.projectCode': 1,
                                'project.projectStatus': 1
                            }
                        }
                    ]
                }
            }
        ];

        const result = await AccessRequest.aggregate(pipeline);
        const stats = result[0].stats[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        const data = result[0].data;

        return {
            stats,
            requests: data,
            pagination: {
                total: stats.total,
                page: Number(page),
                limit: Number(limit),
                totalPages: Math.ceil(stats.total / limit),
                hasNext: page * limit < stats.total,
                hasPrev: page > 1,
            },
        };
    }

    /**
     * Admin: Approve a request
     */
    static async approveRequest(requestId, adminId) {
        const request = await AccessRequest.findById(requestId);
        if (!request) {
            const error = new Error('Access request not found');
            error.statusCode = 404;
            throw error;
        }
        if (request.status !== 'pending') {
            const error = new Error(`Request already ${request.status}`);
            error.statusCode = 400;
            throw error;
        }

        const project = await Project.findById(request.projectId);
        const client = await User.findById(request.clientId);

        // Add project to client's approved list
        await User.findByIdAndUpdate(
            request.clientId,
            { $addToSet: { approvedProjects: request.projectId } }
        );

        // Update request
        request.status = 'approved';
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        // 📝 Log Activity
        await ActivityLogService.log({
            user: adminId,
            action: 'APPROVE_ACCESS',
            entityType: 'AccessRequest',
            entityId: requestId,
            description: `Approved access for ${client.name} to project ${project.projectName} (${project.projectCode})`,
            metadata: { clientId: request.clientId, projectId: request.projectId }
        });

        return AccessRequest.findById(requestId)
            .populate('clientId', 'name email company')
            .populate('projectId', 'projectCode projectName');
    }

    /**
     * Admin: Reject a request
     */
    static async rejectRequest(requestId, adminId, reason) {
        const request = await AccessRequest.findById(requestId);
        if (!request) {
            const error = new Error('Access request not found');
            error.statusCode = 404;
            throw error;
        }
        if (request.status !== 'pending') {
            const error = new Error(`Request already ${request.status}`);
            error.statusCode = 400;
            throw error;
        }

        const project = await Project.findById(request.projectId);
        const client = await User.findById(request.clientId);

        request.status = 'rejected';
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        request.rejectionReason = reason || 'No reason provided';
        await request.save();

        // 📝 Log Activity
        await ActivityLogService.log({
            user: adminId,
            action: 'REJECT_ACCESS',
            entityType: 'AccessRequest',
            entityId: requestId,
            description: `Rejected access for ${client.name} to project ${project.projectName} (${project.projectCode})`,
            metadata: { clientId: request.clientId, projectId: request.projectId, reason }
        });

        return AccessRequest.findById(requestId)
            .populate('clientId', 'name email company')
            .populate('projectId', 'projectCode projectName');
    }

    /**
     * Client: Get all projects (public listing)
     */
    static async getPublicProjectList({ page = 1, limit = 10, search, status, location }) {
        const filters = { isDeleted: false };

        if (status) filters.projectStatus = status;
        if (search) {
            const re = new RegExp(search, 'i');
            filters.$or = [
                { projectName: re },
                { projectCode: re },
                { projectCategory: re },
            ];
        }
        if (location) {
            filters.siteAddress = new RegExp(location, 'i');
        }

        const skip = (page - 1) * limit;

        const [projects, total] = await Promise.all([
            Project.find(filters)
                .select('projectCode projectName projectCategory projectStatus priority siteAddress startDate expectedCompletion')
                .sort('-createdAt')
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
}

module.exports = AccessRequestService;
