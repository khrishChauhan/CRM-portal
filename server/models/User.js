const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
    {
        // ── Common Fields (all roles) ──
        name: {
            type: String,
            required: [true, 'Name is required'],
            trim: true,
            maxlength: [100, 'Name cannot exceed 100 characters'],
        },
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            trim: true,
            lowercase: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            select: false,
        },
        role: {
            type: String,
            enum: {
                values: ['admin', 'staff', 'client'],
                message: '{VALUE} is not a valid role',
            },
            default: 'client',
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },

        // ── Staff-specific fields ──
        phone: {
            type: String,
            trim: true,
            maxlength: [15, 'Phone cannot exceed 15 characters'],
        },
        alternatePhone: {
            type: String,
            trim: true,
            maxlength: [15, 'Alternate phone cannot exceed 15 characters'],
        },
        designation: {
            type: String,
            trim: true,
            maxlength: [100, 'Designation cannot exceed 100 characters'],
        },
        department: {
            type: String,
            trim: true,
            enum: {
                values: [
                    'Engineering', 'Sales', 'Marketing', 'HR',
                    'Finance', 'Operations', 'Support', 'Management', 'Other',
                ],
                message: '{VALUE} is not a valid department',
            },
        },
        joiningDate: { type: Date },
        employmentType: {
            type: String,
            enum: {
                values: ['full-time', 'part-time', 'contract', 'intern'],
                message: '{VALUE} is not a valid employment type',
            },
            default: 'full-time',
        },
        salaryBand: {
            type: String,
            trim: true,
            maxlength: [50, 'Salary band cannot exceed 50 characters'],
        },
        reportingManager: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },

        // ── Client-specific fields ──
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        clientStatus: {
            type: String,
            enum: {
                values: ['active', 'suspended'],
                message: '{VALUE} is not a valid client status',
            },
            default: 'active',
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        company: {
            type: String,
            trim: true,
            maxlength: [200, 'Company name cannot exceed 200 characters'],
        },
        approvedProjects: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Project',
        }],

        // ── Deprecated ──
        staffId: {
            type: String,
            unique: true,
            sparse: true,
        },
    },
    {
        timestamps: true,
        toJSON: {
            transform(doc, ret) {
                delete ret.password;
                delete ret.__v;
                return ret;
            },
        },
    }
);

// ── Performance indexes ──
userSchema.index({ role: 1, isActive: 1 });
userSchema.index({ role: 1, clientStatus: 1 });
userSchema.index({ department: 1 });
userSchema.index({ name: 'text', email: 'text', designation: 'text', company: 'text' });

module.exports = mongoose.model('User', userSchema);