const DashboardService = require('../services/dashboardService');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * DashboardController — handles role-based dashboard requests.
 */
exports.getAdminDashboard = async (req, res) => {
    try {
        const stats = await DashboardService.getAdminStats();
        return sendSuccess(res, stats, 'Admin dashboard stats fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

exports.getStaffDashboard = async (req, res) => {
    try {
        const stats = await DashboardService.getStaffStats(req.user.id);
        return sendSuccess(res, stats, 'Staff dashboard stats fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

exports.getClientDashboard = async (req, res) => {
    try {
        const stats = await DashboardService.getClientStats(req.user.id);
        return sendSuccess(res, stats, 'Client dashboard stats fetched');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};
