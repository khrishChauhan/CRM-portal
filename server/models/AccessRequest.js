const mongoose = require('mongoose');

const accessRequestSchema = new mongoose.Schema(
    {
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Client ID is required'],
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
        },
        message: {
            type: String,
            trim: true,
            maxlength: [1000, 'Message cannot exceed 1000 characters'],
        },
        status: {
            type: String,
            enum: {
                values: ['pending', 'approved', 'rejected'],
                message: '{VALUE} is not a valid request status',
            },
            default: 'pending',
        },
        reviewedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        reviewedAt: {
            type: Date,
            default: null,
        },
        rejectionReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
    }
);

// Prevent duplicate requests: one client can only have one active request per project
accessRequestSchema.index({ clientId: 1, projectId: 1 }, { unique: true });
accessRequestSchema.index({ status: 1 });
accessRequestSchema.index({ clientId: 1, status: 1 });
accessRequestSchema.index({ projectId: 1 });

module.exports = mongoose.model('AccessRequest', accessRequestSchema);
