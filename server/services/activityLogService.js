const ActivityLog = require('../models/ActivityLog');

class ActivityLogService {
    /**
     * Log an administrative activity
     */
    static async log({ user, action, entityType, entityId, description, metadata = {} }) {
        try {
            return await ActivityLog.create({
                user,
                action,
                entityType,
                entityId,
                description,
                metadata,
            });
        } catch (error) {
            console.error('❌ Failed to create activity log:', error.message);
            // We don't throw here to avoid breaking the main operation if logging fails
            return null;
        }
    }

    /**
     * Get logs for an entity
     */
    static async getLogsForEntity(entityType, entityId) {
        return ActivityLog.find({ entityType, entityId })
            .populate('user', 'name role')
            .sort('-createdAt')
            .lean();
    }
}

module.exports = ActivityLogService;
