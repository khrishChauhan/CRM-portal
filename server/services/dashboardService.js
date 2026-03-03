const User = require('../models/User');
const { Project } = require('../models/Project');
const AccessRequest = require('../models/AccessRequest');
const ActivityLogService = require('./activityLogService');
const mongoose = require('mongoose');

/**
 * DashboardService — optimized database-driven analytics.
 * Uses high-performance MongoDB aggregation pipelines.
 */
class DashboardService {

    /**
     * Admin: Global statistics and recent activities
     */
    static async getAdminStats() {
        // Fetch stats and recent activities concurrently for performance
        const [statsResult, recentActivities] = await Promise.all([
            User.aggregate([
                { $match: { isDeleted: false } },
                {
                    $group: {
                        _id: null,
                        totalUsers: { $sum: 1 },
                        totalStaff: { $sum: { $cond: [{ $eq: ['$role', 'staff'] }, 1, 0] } },
                        totalClients: { $sum: { $cond: [{ $eq: ['$role', 'client'] }, 1, 0] } },
                    }
                }
            ]),
            ActivityLogService.getRecentActivities(15)
        ]);

        const stats = statsResult[0] || { totalUsers: 0, totalStaff: 0, totalClients: 0 };

        return {
            ...stats,
            recentActivities
        };
    }

    /**
     * Staff: Assigned project metrics
     */
    static async getStaffStats(staffId) {
        const stats = await Project.aggregate([
            {
                $match: {
                    $or: [
                        { projectManager: new mongoose.Types.ObjectId(staffId) },
                        { assignedStaff: new mongoose.Types.ObjectId(staffId) }
                    ],
                    isDeleted: false
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    inProgress: { $sum: { $cond: [{ $eq: ['$projectStatus', 'In Progress'] }, 1, 0] } },
                    completed: { $sum: { $cond: [{ $eq: ['$projectStatus', 'Completed'] }, 1, 0] } },
                    delayed: { $sum: { $cond: [{ $eq: ['$projectStatus', 'Delayed'] }, 1, 0] } }
                }
            }
        ]);

        return stats[0] || { total: 0, inProgress: 0, completed: 0, delayed: 0 };
    }

    /**
     * Client: Access request and project access metrics
     */
    static async getClientStats(clientId) {
        const [user, requestStats] = await Promise.all([
            User.findById(clientId).select('approvedProjects'),
            AccessRequest.aggregate([
                { $match: { clientId: new mongoose.Types.ObjectId(clientId) } },
                {
                    $group: {
                        _id: null,
                        pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
                        rejected: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
                        totalRequests: { $sum: 1 }
                    }
                }
            ])
        ]);

        if (!user) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        const rStats = requestStats[0] || { pending: 0, rejected: 0, totalRequests: 0 };

        return {
            totalApprovedProjects: user.approvedProjects?.length || 0,
            totalPendingRequests: rStats.pending,
            totalRejectedRequests: rStats.rejected,
            totalRequests: rStats.totalRequests
        };
    }
}

module.exports = DashboardService;
