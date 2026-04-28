const Project = require('../models/Project');
const Sprint = require('../models/Sprint');
const User = require('../models/User');

// @desc    Get all projects for current user
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res, next) => {
  try {
    let query = {};
    
    // Admin sees ALL projects
    // Non-admin sees ONLY projects where they are owner OR explicitly added as a member
    if (req.user.role !== 'admin') {
      query = {
        $or: [
          { owner: req.user._id },
          { members: { $elemMatch: { user: req.user._id, hasAccess: true } } }
        ]
      };
    }

    const projects = await Project.find(query)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .populate('team', 'name color')
      .lean();

    res.status(200).json({
      success: true,
      count: projects.length,
      data: projects,
    });
  } catch (err) {
    console.error(`[ProjectController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email')
      .lean();

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Checking if user is a member, owner, or part of the project's team
    const userId = req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user._id.toString() === userId && m.hasAccess);
    const isTeamMember = project.team && req.user.team && project.team.toString() === req.user.team.toString();
    
    if (project.owner._id.toString() !== userId && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized to view this project' });
    }

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error(`[ProjectController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private
exports.createProject = async (req, res, next) => {
  try {
    // Check team permission
    if (req.user.team) {
      const Team = require('../models/Team');
      const team = await Team.findById(req.user.team);
      if (team && !team.allowProjectCreation && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          error: 'Only admins can create projects in this team' 
        });
      }
    }

    // Add user to req.body
    req.body.owner = req.user._id.toString();
    if (!req.body.team && req.user.team) req.body.team = req.user.team;
    
    // Add owner as the first member
    if (!req.body.members) req.body.members = [];
    if (!req.body.members.some(m => m.user.toString() === req.user._id.toString())) {
      req.body.members.push({ user: req.user._id.toString(), role: 'Admin', hasAccess: true });
    }

    const project = await Project.create(req.body);

    // We no longer create 3 automatic sprints here to avoid confusion.

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error(`[ProjectController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
exports.updateProject = async (req, res, next) => {
  try {
    let project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Make sure user is project owner
    if (project.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: 'User not authorized to update this project' });
    }

    project = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: project,
    });
  } catch (err) {
    console.error(`[ProjectController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private
exports.deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Make sure user is project owner OR global admin
    if (project.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'User not authorized to delete this project' });
    }

    await project.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(`[ProjectController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Add member to project
// @route   POST /api/projects/:id/members
// @access  Private
exports.addMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const userToAdd = await User.findOne({ email: req.body.email });
    if (!userToAdd) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if already a member
    if (project.members.some(m => m.user.toString() === userToAdd._id.toString())) {
      return res.status(400).json({ success: false, error: 'User is already a member' });
    }

    project.members.push({ user: userToAdd._id, role: 'Member', hasAccess: true });
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Remove member from project
// @route   DELETE /api/projects/:id/members/:userId
// @access  Private
exports.removeMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    project.members = project.members.filter(m => m.user.toString() !== req.params.userId);
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Toggle project access for a member
// @route   PATCH /api/projects/:id/toggle-access
// @access  Private (Admin only)
exports.toggleAccess = async (req, res, next) => {
  try {
    const { userId, hasAccess } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Authorization: Global admin, Project owner, or Team admin
    let isAuthorized = req.user.role === 'admin' || project.owner.toString() === req.user._id.toString();

    if (!isAuthorized && project.team) {
      const Team = require('../models/Team');
      const team = await Team.findById(project.team);
      if (team) {
        const teamMember = team.members.find(m => m.user.toString() === req.user._id.toString());
        if (team.lead.toString() === req.user._id.toString() || (teamMember && teamMember.role === 'admin')) {
          isAuthorized = true;
        }
      }
    }

    if (!isAuthorized) {
      return res.status(403).json({ success: false, error: 'Not authorized to modify access' });
    }

    // Find member - handle both populated and unpopulated cases
    let member = project.members.find(m => {
      const mUserId = m.user && (m.user._id ? m.user._id.toString() : m.user.toString());
      return mUserId === userId;
    });

    if (!member) {
      if (hasAccess) {
        project.members.push({ user: userId, role: 'Member', hasAccess: true });
      }
    } else {
      member.hasAccess = hasAccess;
    }
    
    project.markModified('members');
    await project.save();

    const updatedProject = await Project.findById(req.params.id)
      .populate('owner', 'name email')
      .populate('members.user', 'name email');

    res.status(200).json({
      success: true,
      data: updatedProject
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Bulk toggle project access for a member
// @route   PATCH /api/projects/bulk-toggle-access
// @access  Private
exports.bulkToggleAccess = async (req, res, next) => {
  try {
    const { userId, accessUpdates } = req.body;
    
    // accessUpdates is an object: { [projectId]: boolean }
    const Team = require('../models/Team');
    
    console.log(`[BulkToggle] Starting updates for user: ${userId}`);
    console.log(`[BulkToggle] Updates:`, accessUpdates);

    for (const [projectId, hasAccess] of Object.entries(accessUpdates)) {
      const project = await Project.findById(projectId);
      if (!project) {
        console.log(`[BulkToggle] Project not found: ${projectId}`);
        continue;
      }

      // Authorization
      let isAuthorized = req.user.role === 'admin' || project.owner.toString() === req.user._id.toString();

      if (!isAuthorized && project.team) {
        const team = await Team.findById(project.team);
        if (team) {
          const teamMember = team.members.find(m => m.user && m.user.toString() === req.user._id.toString());
          if (team.lead && team.lead.toString() === req.user._id.toString() || (teamMember && teamMember.role === 'admin')) {
            isAuthorized = true;
          }
        }
      }

      if (!isAuthorized) {
        console.log(`[BulkToggle] Not authorized for project: ${projectId}`);
        continue;
      }

      // Find member - handle both populated and unpopulated cases
      let member = project.members.find(m => {
        const mUserId = m.user && (m.user._id ? m.user._id.toString() : m.user.toString());
        return mUserId === userId;
      });

      if (!member) {
        if (hasAccess) {
          console.log(`[BulkToggle] Adding new access for user ${userId} to project ${projectId}`);
          project.members.push({ user: userId, role: 'Member', hasAccess: true });
        }
      } else {
        console.log(`[BulkToggle] Updating access for user ${userId} in project ${projectId} to ${hasAccess}`);
        member.hasAccess = hasAccess;
      }
      
      // Explicitly mark members as modified just in case
      project.markModified('members');
      await project.save();
    }

    console.log(`[BulkToggle] Completed updates for user: ${userId}`);

    res.status(200).json({ success: true });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
// @desc    Clear all tickets and sprints for a project
// @route   DELETE /api/projects/:id/clear-tickets
// @access  Private/Admin
exports.clearProjectTickets = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const Ticket = require('../models/Ticket');
    const Sprint = require('../models/Sprint');

    // Delete all tickets
    await Ticket.deleteMany({ project: req.params.id });
    
    // Delete all sprints
    await Sprint.deleteMany({ project: req.params.id });

    res.status(200).json({
      success: true,
      message: 'All project data cleared successfully'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
// @desc    Add folder to project
// @route   POST /api/projects/:id/folders
// @access  Private
exports.addFolder = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    project.folders.push({
      name: req.body.name,
      icon: req.body.icon || 'Folder'
    });

    await project.save();

    res.status(200).json({
      success: true,
      data: project.folders[project.folders.length - 1]
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete folder from project
// @route   DELETE /api/projects/:id/folders/:folderId
// @access  Private
exports.deleteFolder = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    project.folders = project.folders.filter(f => f._id.toString() !== req.params.folderId);
    await project.save();

    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
