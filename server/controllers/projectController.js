const ProjectService = require('../services/projectService');
const { sendSuccess, sendError } = require('../utils/response');

// ════════════════════════════════════════
//  Admin Project Endpoints
// ════════════════════════════════════════

// GET /api/projects — List projects (paginated)
exports.getAllProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10, sort, search, status, priority, projectManager, showDeleted } = req.query;
        const result = await ProjectService.getAll({
            page: Number(page), limit: Number(limit),
            sort: sort || '-createdAt', search, status, priority, projectManager, showDeleted,
        });
        return sendSuccess(res, result, 'Projects fetched');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// GET /api/projects/dashboard — Aggregated dashboard stats
exports.getDashboardStats = async (req, res) => {
    try {
        const stats = await ProjectService.getDashboardStats();
        return sendSuccess(res, stats, 'Dashboard stats fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// GET /api/projects/dropdowns — Staff list for form dropdowns
exports.getDropdowns = async (req, res) => {
    try {
        const data = await ProjectService.getDropdownData();
        return sendSuccess(res, data, 'Dropdown data fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// GET /api/projects/:id — Single project
exports.getProjectById = async (req, res) => {
    try {
        const project = await ProjectService.getById(req.params.id);
        return sendSuccess(res, project, 'Project fetched');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

// POST /api/projects — Create project
exports.createProject = async (req, res) => {
    try {
        const project = await ProjectService.create(req.body, req.user.id);
        return sendSuccess(res, project, 'Project created successfully', 201);
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// PUT /api/projects/:id — Update project (admin)
exports.updateProject = async (req, res) => {
    try {
        const project = await ProjectService.update(req.params.id, req.body);
        return sendSuccess(res, project, 'Project updated successfully');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// DELETE /api/projects/:id — Soft delete
exports.deleteProject = async (req, res) => {
    try {
        const result = await ProjectService.softDelete(req.params.id);
        return sendSuccess(res, result, 'Project deleted successfully');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// ════════════════════════════════════════
//  Staff Project Endpoints
// ════════════════════════════════════════

// GET /api/projects/my — Staff's assigned projects
exports.getMyProjects = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const result = await ProjectService.getStaffProjects(req.user.id, {
            page: Number(page), limit: Number(limit),
        });
        return sendSuccess(res, result, 'Your projects fetched');
    } catch (error) {
        return sendError(res, error.message, 500);
    }
};

// PATCH /api/projects/:id/staff-update — Staff limited update
exports.staffUpdateProject = async (req, res) => {
    try {
        const project = await ProjectService.staffUpdate(req.params.id, req.user.id, req.body);
        return sendSuccess(res, project, 'Project updated');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 400);
    }
};

// GET /api/projects/my-approved — Client's approved projects
exports.getMyApprovedProjects = async (req, res) => {
    try {
        const result = await ProjectService.getClientProjects(req.user.id);
        return sendSuccess(res, result, 'Approved projects fetched');
    } catch (error) {
        return sendError(res, error.message, error.statusCode || 500);
    }
};

