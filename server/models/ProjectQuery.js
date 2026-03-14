const mongoose = require('mongoose');

const projectQuerySchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
        },
        clientId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Client ID is required'],
        },
        title: {
            type: String,
            required: [true, 'Query title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        message: {
            type: String,
            required: [true, 'Query message is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
        status: {
            type: String,
            enum: ['open', 'answered', 'closed'],
            default: 'open',
        },
        response: {
            type: String,
            trim: true,
            maxlength: [2000, 'Response cannot exceed 2000 characters'],
        },
        respondedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        respondedAt: {
            type: Date,
            default: null,
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

// Performance indexes
projectQuerySchema.index({ projectId: 1, status: 1 });
projectQuerySchema.index({ clientId: 1 });
projectQuerySchema.index({ createdAt: -1 });

const ProjectQuery = mongoose.models.ProjectQuery || mongoose.model('ProjectQuery', projectQuerySchema);

module.exports = ProjectQuery;
