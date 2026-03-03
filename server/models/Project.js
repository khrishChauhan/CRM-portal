const mongoose = require('mongoose');

// ── Auto-generate project code counter ──
const counterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
});

// Prevent model recompilation in dev (nodemon)
const Counter = mongoose.models.Counter || mongoose.model('Counter', counterSchema);

const projectSchema = new mongoose.Schema(
    {
        // ── Identity ──
        projectCode: {
            type: String,
            unique: true,
            immutable: true,
        },
        projectName: {
            type: String,
            required: [true, 'Project name is required'],
            trim: true,
            maxlength: [200, 'Project name cannot exceed 200 characters'],
        },
        projectCategory: {
            type: String,
            trim: true,
            maxlength: [100, 'Category cannot exceed 100 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [2000, 'Description cannot exceed 2000 characters'],
        },
        siteAddress: {
            type: String,
            trim: true,
            maxlength: [500, 'Site address cannot exceed 500 characters'],
        },

        // ── Management ──
        projectManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        assignedStaff: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        }],

        // ── Dates ──
        startDate: {
            type: Date,
            default: null,
        },
        expectedCompletion: {
            type: Date,
            default: null,
        },
        actualCompletion: {
            type: Date,
            default: null,
        },

        // ── Status & Priority ──
        projectStatus: {
            type: String,
            enum: {
                values: ['Planned', 'In Progress', 'On Hold', 'Completed', 'Delayed', 'Cancelled'],
                message: '{VALUE} is not a valid project status',
            },
            default: 'Planned',
        },
        priority: {
            type: String,
            enum: {
                values: ['Low', 'Medium', 'High'],
                message: '{VALUE} is not a valid priority',
            },
            default: 'Medium',
        },
        riskLevel: {
            type: String,
            enum: {
                values: ['Low', 'Medium', 'High'],
                message: '{VALUE} is not a valid risk level',
            },
            default: 'Low',
        },
        delayReason: {
            type: String,
            trim: true,
            maxlength: [500, 'Delay reason cannot exceed 500 characters'],
        },

        // ── Soft Delete ──
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },

        // ── Metadata ──
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
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
projectSchema.index({ projectStatus: 1, isDeleted: 1 });
projectSchema.index({ projectManager: 1 });
projectSchema.index({ priority: 1 });
projectSchema.index({ assignedStaff: 1 });
projectSchema.index({ projectName: 'text', projectCategory: 'text', siteAddress: 'text' });
projectSchema.index({ createdAt: -1 });

// ── Pre-save: auto-generate projectCode + auto-status ──
// IMPORTANT: Use plain async function WITHOUT next() parameter.
// Mongoose 6+: async pre-save hooks must NOT use next().
// Using both async + next causes "next is not a function".
projectSchema.pre('save', async function () {
    // Auto-generate projectCode for new documents
    if (this.isNew && !this.projectCode) {
        const year = new Date().getFullYear();
        const counter = await Counter.findByIdAndUpdate(
            { _id: `projectCode_${year}` },
            { $inc: { seq: 1 } },
            { upsert: true, new: true }
        );
        this.projectCode = `P-${year}-${String(counter.seq).padStart(4, '0')}`;
    }

    // Auto-status: mark as Delayed if past expectedCompletion
    if (
        this.expectedCompletion &&
        !this.actualCompletion &&
        new Date(this.expectedCompletion) < new Date() &&
        this.projectStatus !== 'Completed' &&
        this.projectStatus !== 'Cancelled'
    ) {
        this.projectStatus = 'Delayed';
    }

    // Auto-status: mark as Completed if actualCompletion is set
    if (this.actualCompletion && this.projectStatus !== 'Cancelled') {
        this.projectStatus = 'Completed';
    }
});

const Project = mongoose.models.Project || mongoose.model('Project', projectSchema);

module.exports = { Project, Counter };
