const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema(
    {
        actorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        actorRole: {
            type: String,
            required: true,
            enum: ['admin', 'staff', 'client'],
        },
        actionType: {
            type: String,
            required: true,
            enum: [
                'PROJECT_CREATED', 'PROJECT_UPDATED', 'PROJECT_DELETED',
                'STAFF_ADDED', 'STAFF_STATUS_CHANGED',
                'CLIENT_ADDED', 'CLIENT_STATUS_CHANGED',
                'ACCESS_REQUEST_CREATED', 'ACCESS_REQUEST_APPROVED', 'ACCESS_REQUEST_REJECTED'
            ],
        },
        entityType: {
            type: String,
            required: true,
            enum: ['project', 'user', 'accessRequest'],
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

// Performance Indexes
activityLogSchema.index({ createdAt: -1 });
activityLogSchema.index({ actorId: 1, createdAt: -1 });
activityLogSchema.index({ entityType: 1, entityId: 1 });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
