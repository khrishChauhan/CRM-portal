const AccessRequest = require('../models/AccessRequest');
const { Project } = require('../models/Project');
const User = require('../models/User');

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
     * Business rules:
     *   - Project must exist and not be soft-deleted
     *   - Client must be active (not suspended)
     *   - Cannot request access if already requested (duplicate prevention via unique index)
     *   - Cannot request if already approved
     */
    static async requestAccess(clientId, projectId) {
        // Verify project exists
        const project = await Project.findOne({ _id: projectId, isDeleted: false });
        if (!project) {
            const error = new Error('Project not found');
            error.statusCode = 404;
            throw error;
        }

        // Verify client is active
        const client = await User.findOne({ _id: clientId, role: 'client' });
        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }
        if (client.clientStatus === 'suspended') {
            const error = new Error('Your account is suspended. Contact admin.');
            error.statusCode = 403;
            throw error;
        }

        // Check if already approved
        if (client.approvedProjects?.includes(projectId)) {
            const error = new Error('You already have access to this project');
            error.statusCode = 400;
            throw error;
        }

        // Check for existing request (pending or rejected — allow re-request on rejection)
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
            // If rejected, allow re-request by updating status back to pending
            existing.status = 'pending';
            existing.reviewedBy = null;
            existing.reviewedAt = null;
            existing.rejectionReason = null;
            await existing.save();
            return existing;
        }

        // Create new request
        const request = await AccessRequest.create({ clientId, projectId });
        return request;
    }

    /**
     * Client: Get my access requests with project info
     */
    static async getMyRequests(clientId) {
        return AccessRequest.find({ clientId })
            .populate('projectId', 'projectCode projectName projectStatus priority siteAddress projectCategory')
            .sort('-createdAt')
            .lean();
    }

    /**
     * Admin: Get all access requests (filterable by status)
     */
    static async getAllRequests({ page = 1, limit = 20, status }) {
        const filters = {};
        if (status) filters.status = status;

        const skip = (page - 1) * limit;

        const [requests, total] = await Promise.all([
            AccessRequest.find(filters)
                .populate('clientId', 'name email company')
                .populate('projectId', 'projectCode projectName projectStatus')
                .populate('reviewedBy', 'name')
                .sort('-createdAt')
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            AccessRequest.countDocuments(filters),
        ]);

        return {
            requests,
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
     * Admin: Get request stats
     */
    static async getStats() {
        const [pending, approved, rejected] = await Promise.all([
            AccessRequest.countDocuments({ status: 'pending' }),
            AccessRequest.countDocuments({ status: 'approved' }),
            AccessRequest.countDocuments({ status: 'rejected' }),
        ]);
        return { pending, approved, rejected, total: pending + approved + rejected };
    }

    /**
     * Admin: Approve a request
     * Business logic:
     *   - Add projectId to client's approvedProjects array
     *   - Update request status
     *   - Record who approved it
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

        // Add project to client's approved list (idempotent with $addToSet)
        await User.findByIdAndUpdate(
            request.clientId,
            { $addToSet: { approvedProjects: request.projectId } }
        );

        // Update request
        request.status = 'approved';
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        await request.save();

        return AccessRequest.findById(requestId)
            .populate('clientId', 'name email')
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

        request.status = 'rejected';
        request.reviewedBy = adminId;
        request.reviewedAt = new Date();
        request.rejectionReason = reason || null;
        await request.save();

        return AccessRequest.findById(requestId)
            .populate('clientId', 'name email')
            .populate('projectId', 'projectCode projectName');
    }

    /**
     * Client: Get all projects (public listing — limited fields)
     * Shows all non-deleted projects so clients can request access
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
