const jwt = require('jsonwebtoken');
const { sendError } = require('../utils/response');

/**
 * Protect routes — verify JWT token and attach user to request
 */
const protect = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('🚫 Auth failed: No token provided');
        return sendError(res, 'Not authorized — no token provided', 401);
    }

    try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        console.log(`✅ Auth verified: ${decoded.name} (${decoded.role}) [ID: ${decoded.id}]`);
        next();
    } catch (error) {
        console.log(`🚫 Auth failed: Token invalid — ${error.message}`);
        return sendError(res, 'Not authorized — token invalid or expired', 401);
    }
};

/**
 * Role-based authorization — accepts one or more roles
 * Usage: authorize('admin') or authorize('admin', 'staff')
 */
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            console.log('🚫 Authorize failed: No user attached to request');
            return sendError(res, 'Not authorized', 401);
        }

        if (!roles.includes(req.user.role)) {
            console.log(`🚫 Access denied: ${req.user.role} tried to access route restricted to [${roles.join(', ')}]`);
            return sendError(res, `Access denied — role '${req.user.role}' is not authorized`, 403);
        }

        console.log(`✅ Role authorized: ${req.user.role} → [${roles.join(', ')}]`);
        next();
    };
};

// ── Named role guards for convenience ──
const adminOnly = [protect, authorize('admin')];
const staffOnly = [protect, authorize('staff')];
const clientOnly = [protect, authorize('client')];
const adminOrStaff = [protect, authorize('admin', 'staff')];

module.exports = { protect, authorize, adminOnly, staffOnly, clientOnly, adminOrStaff };
