const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const otpGenerator = require('otp-generator');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
console.log('Backend using Google Client ID:', process.env.GOOGLE_CLIENT_ID?.substring(0, 10) + '...');

// Transporter for Nodemailer
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.ADMIN_GMAIL_USER,
        pass: process.env.ADMIN_GMAIL_PASS,
    },
});

// Generate JWT
const generateToken = (id, role, name) => {
    return jwt.sign({ id, role, name }, process.env.JWT_SECRET, { expiresIn: '30d' });
};

// --- ADMIN AUTH (OTP) ---

exports.sendAdminOTP = async (req, res) => {
    const { email } = req.body;

    const allowedAdmins = process.env.ADMIN_EMAIL.split(',').map(e => e.trim());

    if (!allowedAdmins.includes(email)) {
        return res.status(403).json({ message: 'Access denied: Not an admin email' });
    }

    try {
        const otp = otpGenerator.generate(6, {
            upperCaseAlphabets: false,
            specialChars: false,
            lowerCaseAlphabets: false
        });

        // Save OTP to DB
        await OTP.findOneAndUpdate(
            { email },
            { otp, createdAt: Date.now() },
            { upsert: true, new: true }
        );

        // Send Mail
        await transporter.sendMail({
            from: process.env.ADMIN_GMAIL_USER,
            to: email,
            subject: 'Your CRM Admin Login OTP',
            text: `Your OTP is: ${otp}. It expires in 5 minutes.`,
        });

        res.json({ message: 'OTP sent successfully' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error sending OTP' });
    }
};

exports.verifyAdminOTP = async (req, res) => {
    const { email, otp } = req.body;

    try {
        const record = await OTP.findOne({ email, otp });

        if (!record) {
            return res.status(400).json({ message: 'Invalid or expired OTP' });
        }

        // Find or create admin in DB
        let user = await User.findOne({ email });
        if (!user) {
            user = await User.create({ name: 'System Admin', email, role: 'admin' });
        } else if (user.role !== 'admin') {
            // Promote existing user to admin
            user.role = 'admin';
            await user.save();
        }

        // Delete OTP after use
        await OTP.deleteOne({ _id: record._id });

        const token = generateToken(user._id, user.role, user.name);
        res.json({ user: { id: user._id, name: user.name, role: user.role }, token });
    } catch (error) {
        console.error('OTP Verify Error:', error.message, error);
        res.status(500).json({ message: 'Verification error: ' + error.message });
    }
};

// --- STAFF AUTH (Staff ID + Password) ---

exports.staffLogin = async (req, res) => {
    const { staffId, password } = req.body;

    try {
        const user = await User.findOne({ staffId, role: 'staff' });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ message: 'Invalid Staff ID or password' });
        }

        const token = generateToken(user._id, user.role, user.name);
        res.json({ user: { id: user._id, name: user.name, role: user.role }, token });
    } catch (error) {
        res.status(500).json({ message: 'Server error during staff login' });
    }
};

// --- CLIENT AUTH (Google OAuth) ---

exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body;

    try {
        const ticket = await client.verifyIdToken({
            idToken: tokenId,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const { name, email, sub: googleId } = ticket.getPayload();

        let user = await User.findOne({ googleId });

        if (!user) {
            user = await User.create({
                name,
                email,
                googleId,
                role: 'client',
            });
        }

        const token = generateToken(user._id, user.role, user.name);
        res.json({ user: { id: user._id, name: user.name, role: user.role }, token });
    } catch (error) {
        console.error('Google OAuth verification error:', error.message);
        res.status(401).json({ message: 'Google authentication failed: ' + error.message });
    }
};

// Admin creating staff (Helper for flow)
exports.createStaff = async (req, res) => {
    const { name, email, password, staffId } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = await User.create({
            name,
            email,
            password: hashedPassword,
            staffId,
            role: 'staff'
        });
        res.status(201).json({ message: 'Staff created', user: newStaff });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};