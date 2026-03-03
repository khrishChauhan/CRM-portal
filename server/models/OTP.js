const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const otpSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        lowercase: true,
        trim: true,
        index: true,
    },
    hashedOtp: {
        type: String,
        required: true,
    },
    expiresAt: {
        type: Date,
        required: true,
        index: { expires: 0 }, // MongoDB TTL: auto-delete when expiresAt is reached
    },
    attemptCount: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// ── Instance Methods ──

/**
 * Compare a plain-text OTP against the stored hash
 * @param {string} plainOtp - The 6-digit OTP to verify
 * @returns {Promise<boolean>}
 */
otpSchema.methods.compareOtp = async function (plainOtp) {
    return bcrypt.compare(plainOtp, this.hashedOtp);
};

/**
 * Increment the attempt counter and save
 * @returns {Promise<void>}
 */
otpSchema.methods.incrementAttempts = async function () {
    this.attemptCount += 1;
    await this.save();
};

// ── Static Constants ──
otpSchema.statics.MAX_ATTEMPTS = 5;
otpSchema.statics.COOLDOWN_SECONDS = 60;
otpSchema.statics.EXPIRY_MINUTES = 5;

module.exports = mongoose.model('OTP', otpSchema);
