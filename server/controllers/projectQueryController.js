const ProjectQuery = require('../models/ProjectQuery');
const { Project } = require('../models/Project');
const User = require('../models/User');
const { sendSuccess, sendError } = require('../utils/response');

/**
 * POST /api/projects/:projectId/query
 * Client submits a query
 */
exports.submitQuery = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { title, message, latitude, longitude } = req.body;
        const imageUrl = req.file ? req.file.path : null;
        const userId = req.user.id;

        if (!title || !message) {
            return sendError(res, 'Title and message are required', 400);
        }

        // Photo is now MANDATORY for queries
        if (!req.file) {
            return sendError(res, 'A live photo is mandatory to submit a query.', 400);
        }

        // Coordinates are mandatory with the photo
        if (!latitude || !longitude) {
            return sendError(res, 'Location is required for the query photo.', 400);
        }

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project || project.isDeleted) {
            return sendError(res, 'Project not found', 404);
        }

        // Verify client is approved for this project
        const user = await User.findById(userId);
        if (!user.approvedProjects.includes(projectId)) {
            return sendError(res, 'You are not approved for this project', 403);
        }

        const query = await ProjectQuery.create({
            projectId,
            clientId: userId,
            title,
            message,
            status: 'open',
            imageUrl: imageUrl || null,
            latitude: latitude || null,
            longitude: longitude || null
        });

        return sendSuccess(res, query, 'Your query has been sent to the project team.', 201);
    } catch (error) {
        console.error('❌ submitQuery error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * GET /api/projects/:projectId/queries
 * Admin and project head view queries
 */
exports.getQueries = async (req, res) => {
    try {
        const { projectId } = req.params;
        const user = req.user;

        // Verify project exists
        const project = await Project.findById(projectId);
        if (!project || project.isDeleted) {
            return sendError(res, 'Project not found', 404);
        }

        // Permission check
        if (user.role === 'client') {
            // Clients can only view their own queries for this project
            const queries = await ProjectQuery.find({ projectId, clientId: user.id })
                .populate('clientId', 'name')
                .populate('respondedBy', 'name')
                .sort({ createdAt: -1 });
            return sendSuccess(res, queries, 'Queries fetched');
        }

        if (user.role === 'staff') {
            // Project Head / Manager check
            const isManager = project.projectManager?.toString() === user.id;
            const isAssigned = project.assignedStaff?.some(s => s.toString() === user.id);
            if (!isManager && !isAssigned) {
                return sendError(res, 'You are not assigned to this project', 403);
            }
        }

        // Admin and Authorized Staff can view all queries for this project
        const queries = await ProjectQuery.find({ projectId })
            .populate('clientId', 'name')
            .populate('respondedBy', 'name')
            .sort({ createdAt: -1 });

        return sendSuccess(res, queries, 'Queries fetched');
    } catch (error) {
        console.error('❌ getQueries error:', error);
        return sendError(res, error.message, 500);
    }
};

/**
 * POST /api/queries/:queryId/respond
 * Admin or project head responds to query
 */
exports.respondToQuery = async (req, res) => {
    try {
        const { queryId } = req.params;
        const { response } = req.body;
        const user = req.user;

        if (!response) {
            return sendError(res, 'Response is required', 400);
        }

        const query = await ProjectQuery.findById(queryId);
        if (!query) {
            return sendError(res, 'Query not found', 404);
        }

        const project = await Project.findById(query.projectId);
        
        // Permission check
        if (user.role === 'staff') {
            const isManager = project.projectManager?.toString() === user.id;
            const isAssigned = project.assignedStaff?.some(s => s.toString() === user.id);
            if (!isManager && !isAssigned) {
                return sendError(res, 'You are not authorized to respond to this query', 403);
            }
        } else if (user.role !== 'admin') {
            return sendError(res, 'Only admin or project team can respond', 403);
        }

        query.response = response;
        query.respondedBy = user.id;
        query.respondedAt = Date.now();
        query.status = 'answered';
        await query.save();

        const updatedQuery = await ProjectQuery.findById(queryId)
            .populate('clientId', 'name')
            .populate('respondedBy', 'name');

        return sendSuccess(res, updatedQuery, 'Response submitted successfully');
    } catch (error) {
        console.error('❌ respondToQuery error:', error);
        return sendError(res, error.message, 500);
    }
};
