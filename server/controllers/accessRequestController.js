const AccessRequestService = require('../services/accessRequestService');
const { sendSuccess, sendError } = require('../utils/response');

// ════════════════════════════════════════
//  Client Endpoints
// ════════════════════════════════════════

// POST /api/access-requests — Request access to a project
exports.requestAccess = async (req, res) => {
    try {
        const { projectId, message } = req.body;
        const request = await AccessRequestService.requestAccess(req.user.id, projectId, message);
        return sendSuccess(res, request, 'Access request submitted', 201);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// GET /api/access-requests/my — My own requests
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await AccessRequestService.getMyRequests(req.user.id);
        return sendSuccess(res, requests, 'My access requests fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// GET /api/access-requests/projects — Browse projects (limited listing)
exports.browseProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, location } = req.query;
        const result = await AccessRequestService.getPublicProjectList({
            page: Number(page),
            limit: Number(limit),
            search,
            status,
            location
        });
        return sendSuccess(res, result, 'Public projects fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// ════════════════════════════════════════
//  Admin Endpoints
// ════════════════════════════════════════

// GET /api/access-requests — List all (admin) with stats & aggregation
exports.getAllRequests = async (req, res) => {
    try {
        const { page = 1, limit = 10, status, search } = req.query;
        const result = await AccessRequestService.getAllRequests({
            page: Number(page),
            limit: Number(limit),
            status,
            search
        });
        return sendSuccess(res, result, 'All access requests fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// PATCH /api/access-requests/:id/approve
exports.approveRequest = async (req, res) => {
    try {
        const request = await AccessRequestService.approveRequest(req.params.id, req.user.id);
        return sendSuccess(res, request, 'Access request approved successfully');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// PATCH /api/access-requests/:id/reject
exports.rejectRequest = async (req, res) => {
    try {
        const { reason } = req.body;
        const request = await AccessRequestService.rejectRequest(req.params.id, req.user.id, reason);
        return sendSuccess(res, request, 'Access request rejected');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};
