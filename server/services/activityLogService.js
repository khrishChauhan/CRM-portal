const ActivityLog = require('../models/ActivityLog');
const User = require('../models/User');

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
            // Check if actor is an internal admin
            const actor = await User.findById(actorId).select('email');
            const internalEmails = (process.env.INTERNAL_ADMIN_EMAILS || '').split(',').map(e => e.trim().toLowerCase());

            const isInternal = actor && internalEmails.includes(actor.email.toLowerCase());

            return await ActivityLog.create({
                actorId,
                actorRole,
                actionType,
                entityType,
                entityId,
                message,
                metadata,
                isInternal
            });
        } catch (error) {
            console.error('❌ ActivityLogService error:', error.message);
            // Non-blocking log failure
            return null;
        }
    }

    /**
     * Get recent activities for admin dashboard
     * Filters out activities by internal admins
     */
    static async getRecentActivities(limit = 15) {
        return ActivityLog.find({ isInternal: { $ne: true } })
            .select('message actorRole createdAt')
            .sort({ createdAt: -1 })
            .limit(limit)
            .lean();
    }
}

module.exports = ActivityLogService;
