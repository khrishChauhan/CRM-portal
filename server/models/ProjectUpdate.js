const mongoose = require('mongoose');

const projectUpdateSchema = new mongoose.Schema(
    {
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
            required: [true, 'Project ID is required'],
        },
        message: {
            type: String,
            required: [true, 'Update message is required'],
            trim: true,
            maxlength: [2000, 'Message cannot exceed 2000 characters'],
        },
        imageUrl: {
            type: String,
            default: null,
        },
        location: {
            latitude: { type: Number, default: null },
            longitude: { type: Number, default: null },
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        role: {
            type: String,
            enum: ['admin', 'staff', 'client'],
            required: true,
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

// ── Performance indexes ──
projectUpdateSchema.index({ projectId: 1, createdAt: -1 });
projectUpdateSchema.index({ createdBy: 1 });

const ProjectUpdate = mongoose.models.ProjectUpdate || mongoose.model('ProjectUpdate', projectUpdateSchema);

module.exports = ProjectUpdate;
