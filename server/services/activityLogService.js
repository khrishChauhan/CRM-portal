const ActivityLog = require('../models/ActivityLog');

/**
 * ActivityLogService — Production-grade event logging
 * 
 * Provides centralized logging that can be called from any service. 
 * Operations are wrapped to ensure logging failures don't crash main business logic.
 */
class ActivityLogService {
    /**
     * Log a real-time event
     * @param {Object} data 
     * @param {string} data.actorId - User ID who performed the action
     * @param {string} data.actorRole - Role of the user (admin/staff/client)
     * @param {string} data.actionType - Enum key for action
     * @param {string} data.entityType - project/user/accessRequest
     * @param {string} data.entityId - ID of related entity
     * @param {string} data.message - Human-readable log entry
     * @param {Object} [data.metadata] - Optional additional data
     */
    static async logEvent({ actorId, actorRole, actionType, entityType, entityId, message, metadata = {} }) {
        try {
            return await ActivityLog.create({
                actorId,
                actorRole,
                actionType,
                entityType,
                entityId,
                message,
                metadata
            });
        } catch (error) {
            console.error('❌ ActivityLogService error:', error.message);
            // Non-blocking log failure
            return null;
        }
    }

    /**
     * Get recent activities for admin dashboard
     */
    static async getRecentActivities(limit = 15) {
        return ActivityLog.find()
            .select('message actorRole createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
}

module.exports = ActivityLogService;
