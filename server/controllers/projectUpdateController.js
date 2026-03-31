const ProjectUpdate = require('../models/ProjectUpdate');
const { Project } = require('../models/Project');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/projects/:projectId/updates
 * Create a new project update (admin, project manager, assigned staff)
 */
const createProjectUpdate = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { message, latitude, longitude } = req.body;
        const user = req.user;

        // ── Validate input ──
        if (!message || !message.trim()) {
            return sendError(res, 'Update message is required', 400);
        }

        // ── Verify project exists ──
        const project = await Project.findById(projectId);
        if (!project || project.isDeleted) {
            return sendError(res, 'Project not found', 404);
        }

        // ── Permission check ──
        // Admin can always post
        // Staff can post only if they are the project manager or assigned staff
        if (user.role === 'staff') {
            const isManager = project.projectManager?.toString() === user.id;
            const isAssigned = project.assignedStaff?.some(s => s.toString() === user.id);
            if (!isManager && !isAssigned) {
                return sendError(res, 'You are not assigned to this project', 403);
            }
        } else if (user.role === 'client') {
            return sendError(res, 'Clients cannot post updates', 403);
        }

        // ── Build update document ──
        const updateData = {
            projectId,
            message: message.trim(),
            createdBy: user.id,
            role: user.role,
        };

        // ── Proof Validation (Image REQUIRED) ──
        if (!req.file) {
            console.warn(`[SECURITY] Failed Update Proof: User ${user.id} (Role: ${user.role}) attempted to bypass image proof at ${new Date().toISOString()}`);
            return sendError(res, 'Image is required to post update', 400);
        }

        if (req.file) {
            updateData.imageUrl = req.file.path || req.file.secure_url;
        }

        // ── Attach location if provided ──
        if (latitude && longitude) {
            updateData.location = {
                latitude: parseFloat(latitude),
                longitude: parseFloat(longitude),
            };
        }

        const update = await ProjectUpdate.create(updateData);

        // Populate author info before returning
        const populated = await ProjectUpdate.findById(update._id)
            .populate('createdBy', 'name role');

        return sendSuccess(res, populated, 'Update posted successfully', 201);
    } catch (error) {
        console.error('❌ createProjectUpdate error:', error);
        return sendError(res, error.message || 'Failed to create update', 500);
    }
};

/**
 * GET /api/projects/:projectId/updates
 * Fetch all updates for a project (admin, staff, client with approved access)
 */
const getProjectUpdates = async (req, res) => {
    try {
        const { projectId } = req.params;
        const user = req.user;

        // ── Verify project exists ──
        const project = await Project.findById(projectId);
        if (!project || project.isDeleted) {
            return sendError(res, 'Project not found', 404);
        }

        // ── Permission check ──
        if (user.role === 'staff') {
            const isManager = project.projectManager?.toString() === user.id;
            const isAssigned = project.assignedStaff?.some(s => s.toString() === user.id);
            if (!isManager && !isAssigned) {
                return sendError(res, 'You are not assigned to this project', 403);
            }
        } else if (user.role === 'client') {
            return sendError(res, 'Internal updates are not visible to clients', 403);
        }

        const updates = await ProjectUpdate.find({ projectId })
            .populate('createdBy', 'name role')
            .sort({ createdAt: -1 });

        return sendSuccess(res, {
            updates,
            total: updates.length,
            project: {
                _id: project._id,
                projectName: project.projectName,
                projectCode: project.projectCode,
            },
        });
    } catch (error) {
        console.error('❌ getProjectUpdates error:', error);
        return sendError(res, error.message || 'Failed to fetch updates', 500);
    }
};

module.exports = { createProjectUpdate, getProjectUpdates };
