const AccessRequestService = require('../services/accessRequestService');
const { sendSuccess, sendError } = require('../utils/response');

// ════════════════════════════════════════
//  Client Endpoints
// ════════════════════════════════════════

// POST /api/access-requests — Client requests access to a project
exports.requestAccess = async (req, res) => {
    try {
        const result = await AccessRequestService.requestAccess(req.user.id, req.body.projectId);
        return sendSuccess(res, result, 'Access request submitted', 201);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// GET /api/access-requests/my — Client's own requests
exports.getMyRequests = async (req, res) => {
    try {
        const requests = await AccessRequestService.getMyRequests(req.user.id);
        return sendSuccess(res, requests, 'Your requests fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// GET /api/access-requests/projects — Public project listing for clients
exports.getPublicProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, status, location } = req.query;
        const result = await AccessRequestService.getPublicProjectList({
            page: Number(page), limit: Number(limit), search, status, location,
        });
        return sendSuccess(res, result, 'Projects fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// ════════════════════════════════════════
//  Admin Endpoints
// ════════════════════════════════════════

// GET /api/access-requests — Admin: all requests (paginated, filterable)
exports.getAllRequests = async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const result = await AccessRequestService.getAllRequests({
            page: Number(page), limit: Number(limit), status,
        });
        return sendSuccess(res, result, 'Access requests fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// GET /api/access-requests/stats — Admin: request stats
exports.getRequestStats = async (req, res) => {
    try {
        const stats = await AccessRequestService.getStats();
        return sendSuccess(res, stats, 'Request stats fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// PATCH /api/access-requests/:id/approve — Admin: approve request
exports.approveRequest = async (req, res) => {
    try {
        const result = await AccessRequestService.approveRequest(req.params.id, req.user.id);
        return sendSuccess(res, result, 'Access request approved');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// PATCH /api/access-requests/:id/reject — Admin: reject request
exports.rejectRequest = async (req, res) => {
    try {
        const result = await AccessRequestService.rejectRequest(req.params.id, req.user.id, req.body.reason);
        return sendSuccess(res, result, 'Access request rejected');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};
