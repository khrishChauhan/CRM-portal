const rateLimit = require('express-rate-limit');

/**
 * Simple global rate limiter for OTP route
 * 10 requests per 60 seconds — resets automatically
 * No IP tracking, no email tracking, no database
 */
const otpLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: 'Too many OTP requests. Please wait a minute and try again.',
    },
});

module.exports = otpLimiter;
