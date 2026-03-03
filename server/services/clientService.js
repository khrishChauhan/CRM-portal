const User = require('../models/User');
const AccessRequest = require('../models/AccessRequest');

/**
 * ClientService — encapsulates all client management business logic.
 *
 * Client project access is now managed via:
 *   - AccessRequest model (request/approve/reject flow)
 *   - User.approvedProjects[] array (populated on approval)
 */
class ClientService {

    static buildFilters(query) {
        const filters = { role: 'client' };

        if (query.status) filters.clientStatus = query.status;
        if (!query.showDeleted) filters.isActive = true;

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
                .select('name email clientStatus lastLogin company isActive approvedProjects createdAt')
                .sort(sort)
                .skip(skip)
                .limit(Number(limit))
                .lean(),
            User.countDocuments(filters),
        ]);

        // Enrich with project count from approvedProjects array
        const enriched = clients.map(c => ({
            ...c,
            projectCount: c.approvedProjects?.length || 0,
        }));

        return {
            clients: enriched,
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
     * Get single client by ID with approved projects populated
     */
    static async getById(id) {
        const client = await User.findOne({ _id: id, role: 'client' })
            .select('-password -__v')
            .populate('approvedProjects', 'projectCode projectName projectStatus priority startDate expectedCompletion')
            .lean();

        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        // Also fetch pending access requests for this client
        const pendingRequests = await AccessRequest.countDocuments({ clientId: id, status: 'pending' });

        return { ...client, pendingRequests };
    }

    /**
     * Change client status (active / inactive / suspended)
     */
    static async changeStatus(id, status) {
        const validStatuses = ['active', 'inactive', 'suspended'];
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

        client.clientStatus = status;
        if (status === 'inactive' || status === 'suspended') {
            client.isActive = false;
        } else {
            client.isActive = true;
        }
        await client.save();

        return { id: client._id, name: client.name, clientStatus: client.clientStatus };
    }

    /**
     * Soft delete client
     */
    static async softDelete(id) {
        const client = await User.findOne({ _id: id, role: 'client' });
        if (!client) {
            const error = new Error('Client not found');
            error.statusCode = 404;
            throw error;
        }

        client.isActive = false;
        client.clientStatus = 'suspended';
        client.approvedProjects = [];
        await client.save();

        // Also reject all pending requests
        await AccessRequest.updateMany(
            { clientId: id, status: 'pending' },
            { status: 'rejected', rejectionReason: 'Client account suspended' }
        );

        return { id: client._id, name: client.name };
    }

    /**
     * Get client stats
     */
    static async getStats() {
        const [total, active, inactive, suspended] = await Promise.all([
            User.countDocuments({ role: 'client' }),
            User.countDocuments({ role: 'client', clientStatus: 'active' }),
            User.countDocuments({ role: 'client', clientStatus: 'inactive' }),
            User.countDocuments({ role: 'client', clientStatus: 'suspended' }),
        ]);

        return { total, active, inactive, suspended };
    }
}

module.exports = ClientService;
