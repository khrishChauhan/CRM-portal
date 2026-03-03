const User = require('../models/User');
const OTP = require('../models/OTP');
const ActivityLogService = require('../services/activityLogService');
const emailService = require('../services/emailService');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const { sendSuccess, sendError } = require('../utils/response');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Parse comma-separated admin emails into an array (defensive parsing)
const getAdminEmails = () => {
    const raw = process.env.ADMIN_EMAIL || '';
    return raw
        .split(/[,;|]/)          // Support comma, semicolon, or pipe as separator
        .map(e => e.trim().toLowerCase().replace(/\s+/g, '')) // Remove ALL whitespace
        .filter(e => e.length > 0 && e.includes('@'));        // Must look like an email
};

// Log parsed admin emails at startup for debugging
const adminEmails = getAdminEmails();
console.log(`[Auth] Raw ADMIN_EMAIL env: "${process.env.ADMIN_EMAIL}"`);
console.log(`[Auth] Parsed admin emails (${adminEmails.length}):`, adminEmails);

// Generate a secure 6-digit numeric OTP
const generateOTP = () => {
    return crypto.randomInt(100000, 999999).toString();
};

// Generate JWT with consistent payload
const generateToken = (id, role, name) => {
    return jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// Build user response object (consistent shape)
const buildUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
});

// ════════════════════════════════════════════
//  ADMIN AUTH (OTP-based)
// ════════════════════════════════════════════

exports.sendAdminOTP = async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return sendError(res, 'Email is required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!getAdminEmails().includes(normalizedEmail)) {
        return sendError(res, 'Access denied: Not an admin email', 403);
    }

    try {
        // ── Delete any existing OTP for this email ──
        await OTP.deleteMany({ email: normalizedEmail });

        // ── Generate and hash OTP ──
        const plainOtp = generateOTP();
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(plainOtp, salt);

        // ── Store hashed OTP with expiry ──
        await OTP.create({
            email: normalizedEmail,
            hashedOtp,
            expiresAt: new Date(Date.now() + OTP.EXPIRY_MINUTES * 60 * 1000),
        });

        // ── Send via Resend ──
        await emailService.sendAdminOTP(normalizedEmail, plainOtp);

        return sendSuccess(res, null, 'OTP sent successfully');
    } catch (error) {
        console.error('[Auth] Send OTP failed:', error.message);
        return sendError(res, 'Email service unavailable. Please try again later.', 500);
    }
};

exports.verifyAdminOTP = async (req, res) => {
    const { email, otp } = req.body;

    if (!email || !otp) {
        return sendError(res, 'Email and OTP are required', 400);
    }

    const normalizedEmail = email.trim().toLowerCase();

    try {
        const record = await OTP.findOne({ email: normalizedEmail });

        if (!record) {
            return sendError(res, 'Invalid or expired OTP', 400);
        }

        // ── Check attempt limit ──
        if (record.attemptCount >= OTP.MAX_ATTEMPTS) {
            await OTP.deleteOne({ _id: record._id });
            return sendError(res, 'Too many failed attempts. Please request a new OTP.', 429);
        }

        // ── Verify OTP using bcrypt comparison ──
        const isValid = await record.compareOtp(otp);
        if (!isValid) {
            await record.incrementAttempts();
            const remaining = OTP.MAX_ATTEMPTS - record.attemptCount;
            return sendError(res, `Invalid OTP. ${remaining} attempt(s) remaining.`, 400);
        }

        // ── OTP is valid — find or create admin user ──
        let user = await User.findOne({ email: normalizedEmail, role: 'admin' });
        if (!user) {
            user = await User.create({ name: 'System Admin', email: normalizedEmail, role: 'admin' });
        }

        // Delete OTP after successful verification
        await OTP.deleteOne({ _id: record._id });

        const token = generateToken(user._id, user.role, user.name);

        return sendSuccess(res, { user: buildUserResponse(user), token }, 'Admin login successful');
    } catch (error) {
        console.error('[Auth] OTP verification failed:', error.message);
        return sendError(res, 'Verification failed. Please try again.', 500);
    }
};

// ════════════════════════════════════════════
//  STAFF AUTH (Email + Password)
// ════════════════════════════════════════════

exports.staffLogin = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return sendError(res, 'Email and password are required', 400);
    }

    try {
        // Must use select('+password') since User model has select: false
        const user = await User.findOne({ email: email.trim().toLowerCase(), role: 'staff' })
            .select('+password');

        if (!user) {
            return sendError(res, 'Invalid email or password', 401);
        }

        // Check if account is active
        if (!user.isActive) {
            return sendError(res, 'Account is deactivated. Contact your administrator.', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return sendError(res, 'Invalid email or password', 401);
        }

        const token = generateToken(user._id, user.role, user.name);

        return sendSuccess(res, { user: buildUserResponse(user), token }, 'Staff login successful');
    } catch (error) {
        console.error('❌ Staff login error:', error.message);
        return sendError(res, 'Server error during staff login', 500);
    }
};

// ════════════════════════════════════════════
//  CLIENT AUTH (Google OAuth)
// ════════════════════════════════════════════

exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body;



    if (!tokenId) {
        return sendError(res, 'Google token is required', 400);
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId } = ticket.getPayload();


        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if user exists with same email but different auth method
            user = await User.findOne({ email });
            if (user) {
                // Link Google ID to existing user
                user.googleId = googleId;
                await user.save();

            } else {
                // Create new client user
                user = await User.create({
                    name,
                    email,
                    googleId,
                    role: 'client',
                });


                // 📝 Log Activity
                await ActivityLogService.logEvent({
                    actorId: user._id,
                    actorRole: 'client',
                    actionType: 'CLIENT_ADDED',
                    entityType: 'user',
                    entityId: user._id,
                    message: `New client ${name} registered via Google OAuth`,
                    metadata: { email }
                });
            }
        }

        if (!user.isActive) {
            return sendError(res, 'Your account is currently suspended or inactive. Please contact support.', 403);
        }

        const token = generateToken(user._id, user.role, user.name);

        return sendSuccess(res, { user: buildUserResponse(user), token }, 'Google login successful');
    } catch (error) {
        console.error('❌ Google OAuth error:', error.message);
        return sendError(res, 'Google authentication failed: ' + error.message, 401);
    }
};

// Staff creation is now handled by staffController.js

// ════════════════════════════════════════════
//  GET CURRENT USER (Token validation)
// ════════════════════════════════════════════

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return sendError(res, 'User not found', 404);
        }
        return sendSuccess(res, { user: buildUserResponse(user) }, 'User fetched');
    } catch (error) {
        return sendError(res, 'Error fetching user', 500);
    }
};