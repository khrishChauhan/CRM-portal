const ClientService = require('../services/clientService');
const { sendSuccess, sendError } = require('../utils/response');

// GET /api/clients — List clients (paginated)
exports.getAllClients = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort, search, status } = req.query;
        const result = await ClientService.getAll({
            page: Number(page), limit: Number(limit),
            sort: sort || '-createdAt', search, status,
        });
        return sendSuccess(res, result, 'Client list fetched');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// GET /api/clients/stats
exports.getClientStats = async (req, res) => {
    try {
        const stats = await ClientService.getStats();
        return sendSuccess(res, stats, 'Client stats fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// GET /api/clients/:id — with approved projects
exports.getClientById = async (req, res) => {
    try {
        const client = await ClientService.getById(req.params.id);
        return sendSuccess(res, client, 'Client fetched');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// PATCH /api/clients/:id/status — Change status
exports.changeClientStatus = async (req, res) => {
    try {
        const result = await ClientService.changeStatus(req.params.id, req.body.status, req.user.id);
        return sendSuccess(res, result, `Client status changed to ${result.clientStatus}`);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// DELETE /api/clients/:id — Soft delete
exports.deleteClient = async (req, res) => {
    try {
        const result = await ClientService.softDelete(req.params.id);
        return sendSuccess(res, result, 'Client deactivated successfully');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};
