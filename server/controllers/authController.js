const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { OAuth2Client } = require('google-auth-library');
const { sendSuccess, sendError } = require('../utils/response');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Parse comma-separated admin emails into an array
const ADMIN_EMAILS = (process.env.ADMIN_EMAIL || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

console.log(`📧 Admin emails loaded: [${ADMIN_EMAILS.join(', ')}]`);

// Transporter for Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_GMAIL_USER,
        pass: process.env.ADMIN_GMAIL_PASS,
    },
});

// Generate JWT with consistent payload
const generateToken = (id, role, name) => {
    console.log(`🔐 Generating JWT for: ${name} (${role}) [ID: ${id}]`);
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

    console.log(`📨 Admin OTP request for: ${email}`);
    console.log(`📋 Checking against admin list: [${ADMIN_EMAILS.join(', ')}]`);

    if (!email) {
        return sendError(res, 'Email is required', 400);
    }

    if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
        console.log(`🚫 Rejected: ${email} is NOT in admin email list`);
        return sendError(res, 'Access denied: Not an admin email', 403);
    }

    try {
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false,
        });

        console.log(`🔢 OTP generated for ${email}: ${otp}`);

        await OTP.findOneAndUpdate(
            { email: email.trim().toLowerCase() },
            { otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        await transporter.sendMail({
            from: process.env.ADMIN_GMAIL_USER,
            to: email,
            subject: 'Your CRM Admin Login OTP',
            text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
        });

        console.log(`✅ OTP sent to ${email}`);
        return sendSuccess(res, null, 'OTP sent successfully');
    } catch (error) {
        console.error('❌ Send OTP Error:', error.message);
        return sendError(res, 'Error sending OTP: ' + error.message, 500);
    }
};

exports.verifyAdminOTP = async (req, res) => {
    const { email, otp } = req.body;

    console.log(`🔑 Admin OTP verification: ${email} → ${otp}`);

    if (!email || !otp) {
        return sendError(res, 'Email and OTP are required', 400);
    }

    try {
        const record = await OTP.findOne({ email: email.trim().toLowerCase(), otp });

        if (!record) {
            console.log(`🚫 OTP invalid or expired for ${email}`);
            return sendError(res, 'Invalid or expired OTP', 400);
        }

        // Find or create admin user in DB
        let user = await User.findOne({ email: email.trim().toLowerCase(), role: 'admin' });
        if (!user) {
            console.log(`👤 Creating admin user for: ${email}`);
            user = await User.create({ name: 'System Admin', email: email.trim().toLowerCase(), role: 'admin' });
        }

        // Delete OTP after use
        await OTP.deleteOne({ _id: record._id });

        const token = generateToken(user._id, user.role, user.name);
        console.log(`✅ Admin logged in: ${user.name} (${user.email})`);

        return sendSuccess(res, { user: buildUserResponse(user), token }, 'Admin login successful');
    } catch (error) {
        console.error('❌ OTP Verify Error:', error.message, error);
        return sendError(res, 'Verification error: ' + error.message, 500);
    }
};

// ════════════════════════════════════════════
//  STAFF AUTH (Email + Password)
// ════════════════════════════════════════════

exports.staffLogin = async (req, res) => {
    const { email, password } = req.body;

    console.log(`👔 Staff login attempt: ${email}`);

    if (!email || !password) {
        return sendError(res, 'Email and password are required', 400);
    }

    try {
        // Must use select('+password') since User model has select: false
        const user = await User.findOne({ email: email.trim().toLowerCase(), role: 'staff' })
            .select('+password');

        if (!user) {
            console.log(`🚫 Staff not found: ${email}`);
            return sendError(res, 'Invalid email or password', 401);
        }

        // Check if account is active
        if (!user.isActive) {
            console.log(`🚫 Staff account deactivated: ${email}`);
            return sendError(res, 'Account is deactivated. Contact your administrator.', 403);
        }

        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`🔐 Password match for ${email}: ${isMatch}`);

        if (!isMatch) {
            return sendError(res, 'Invalid email or password', 401);
        }

        const token = generateToken(user._id, user.role, user.name);
        console.log(`✅ Staff logged in: ${user.name} (${email})`);

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

    console.log('🌐 Google OAuth login attempt');

    if (!tokenId) {
        return sendError(res, 'Google token is required', 400);
    }

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId } = ticket.getPayload();
        console.log(`🌐 Google token verified: ${name} (${email})`);

        let user = await User.findOne({ googleId });

        if (!user) {
            // Check if user exists with same email but different auth method
            user = await User.findOne({ email });
            if (user) {
                // Link Google ID to existing user
                user.googleId = googleId;
                await user.save();
                console.log(`🔗 Linked Google ID to existing user: ${email}`);
            } else {
                // Create new client user
                user = await User.create({
                    name,
                    email,
                    googleId,
                    role: 'client',
                });
                console.log(`👤 New client created: ${name} (${email})`);
            }
        }

        const token = generateToken(user._id, user.role, user.name);
        console.log(`✅ Client logged in via Google: ${user.name}`);

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