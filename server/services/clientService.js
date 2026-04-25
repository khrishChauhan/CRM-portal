const User = require('../models/User');
const ActivityLogService = require('./activityLogService');

/**
 * ClientService — encapsulates all client management business logic.
 * Simplified version: only 'active' and 'suspended' states.
 */
class ClientService {

    static buildFilters(query) {
        // Base filter: all clients
        const filters = { role: 'client' };

        // Apply status filter if provided
        if (query.status && query.status !== 'all') {
            filters.clientStatus = query.status.toLowerCase();
        }

        // Apply search filter if provided
        if (query.search) {
            const re = new RegExp(query.search, 'i');
            filters.$or = [
                { name: re },
                { email: re },
                { company: re },
            ];
        }

        return filters;
    }

    /**
     * List clients with pagination, search, and filtering
     */
    static async getAll({ page = 1, limit = 10, sort = '-createdAt', ...query }) {
        const filters = this.buildFilters(query);
        const skip = (page - 1) * limit;

        const [clients, total] = await Promise.all([
            User.find(filters)
                .select('name email clientStatus lastLogin company isActive createdAt')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filters),
        ]);

        return {
            clients,
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
     * Get single client by ID
     */
    static async getById(id) {
        const client = await User.findOne({ _id: id, role: 'client' })
            .select('-password -__v')
            .lean();

        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        return client;
    }

    /**
     * Change client status (active / suspended)
     */
    static async changeStatus(id, status, adminId) {
        const validStatuses = ['active', 'suspended'];
        if (!validStatuses.includes(status)) {
            const error = new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            error.statusCode = 400;
            throw error;
        }

        const client = await User.findOne({ _id: id, role: 'client' });
        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        const oldStatus = client.clientStatus;
        client.clientStatus = status;
        client.isActive = (status === 'active');

        await client.save();

        // 📝 Log Activity
        const admin = await User.findById(adminId);
        if (admin && oldStatus !== status) {
            await ActivityLogService.logEvent({
                actorId: adminId,
                actorRole: 'admin',
                actionType: 'CLIENT_STATUS_CHANGED',
                entityType: 'user',
                entityId: client._id,
                message: `Admin ${admin.name} changed status of ${client.name} to ${status.toUpperCase()}`,
                metadata: { oldStatus, newStatus: status }
            });
        }

        return { id: client._id, name: client.name, clientStatus: client.clientStatus, isActive: client.isActive };
    }

    /**
     * Get client stats (Total, Active, Suspended)
     */
    static async getStats() {
        const [total, active, suspended] = await Promise.all([
            User.countDocuments({ role: 'client' }),
            User.countDocuments({ role: 'client', clientStatus: 'active' }),
            User.countDocuments({ role: 'client', clientStatus: 'suspended' }),
        ]);

        return { total, active, suspended };
    }
}

module.exports = ClientService;
