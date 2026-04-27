const Sprint = require('../models/Sprint');
const Project = require('../models/Project');

// @desc    Get all sprints for a project
// @route   GET /api/projects/:projectId/sprints
// @access  Private
exports.getSprints = async (req, res, next) => {
  try {
    const sprints = await Sprint.find({ project: req.params.projectId });

    res.status(200).json({
      success: true,
      count: sprints.length,
      data: sprints,
    });
  } catch (err) {
    console.error(`[SprintController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single sprint
// @route   GET /api/sprints/:id
// @access  Private
exports.getSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }

    // Checking project permissions (Owner, Member, or Team Member)
    const project = await Project.findById(sprint.project);
    const userId = req.user._id.toString();
    const isMember = project.members.some(m => m.toString() === userId);
    const isTeamMember = project.team && req.user.team && project.team.toString() === req.user.team.toString();

    if (project.owner.toString() !== userId && !isMember && !isTeamMember) {
      return res.status(403).json({ success: false, error: 'Not authorized to view this sprint' });
    }

    res.status(200).json({
      success: true,
      data: sprint,
    });
  } catch (err) {
    console.error(`[SprintController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new sprint
// @route   POST /api/projects/:projectId/sprints
// @access  Private
exports.createSprint = async (req, res, next) => {
  try {
    req.body.project = req.params.projectId;

    // Check if project exists and user is part of it
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    // Check permissions (Owner, Member, or Team Member)
    const userId = req.user._id.toString();
    const isMember = project.members.some(m => m.toString() === userId);
    const isTeamMember = project.team && req.user.team && project.team.toString() === req.user.team.toString();

    if (project.owner.toString() !== userId && !isMember && !isTeamMember) {
      return res.status(403).json({ success: false, error: 'Not authorized to create a sprint for this project' });
    }

    const sprint = await Sprint.create(req.body);

    res.status(201).json({
      success: true,
      data: sprint,
    });
  } catch (err) {
    console.error(`[SprintController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update sprint (start/end/rename)
// @route   PUT /api/sprints/:id
// @access  Private
exports.updateSprint = async (req, res, next) => {
  try {
    let sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }

    // Checking project permissions
    const project = await Project.findById(sprint.project);
    const userId = req.user._id.toString();
    const isMember = project.members.some(m => m.toString() === userId);
    const isTeamMember = project.team && req.user.team && project.team.toString() === req.user.team.toString();

    if (project.owner.toString() !== userId && !isMember && !isTeamMember) {
      return res.status(403).json({ success: false, error: 'Not authorized to update this sprint' });
    }

    const oldStatus = sprint.status;
    const newStatus = req.body.status;

    // Logic: Only one active sprint at a time per project
    if (newStatus === 'active') {
      const activeSprint = await Sprint.findOne({ project: sprint.project, status: 'active' });
      if (activeSprint && activeSprint._id.toString() !== req.params.id) {
        return res.status(400).json({ success: false, error: 'Another sprint is already active' });
      }
    }

    // Logic: If sprint is being completed, rollover incomplete tasks and create next sprint
    if (newStatus === 'completed' && oldStatus !== 'completed') {
      const Ticket = require('../models/Ticket');
      
      // 1. Calculate next sprint details
      const nextSprintStartDate = new Date(sprint.endDate);
      nextSprintStartDate.setDate(nextSprintStartDate.getDate() + 1);
      
      const nextSprintEndDate = new Date(nextSprintStartDate);
      nextSprintEndDate.setDate(nextSprintEndDate.getDate() + 13); // 14 days total
      
      // Get current sprint number from name if possible
      const sprintMatch = sprint.name.match(/(\d+)/);
      const nextSprintNum = sprintMatch ? parseInt(sprintMatch[1]) + 1 : '';
      const nextSprintName = nextSprintNum ? `Sprint ${nextSprintNum}` : `${sprint.name} (Next)`;

      // 2. Create the next sprint
      const nextSprint = await Sprint.create({
        name: nextSprintName,
        startDate: nextSprintStartDate,
        endDate: nextSprintEndDate,
        project: sprint.project,
        status: 'planned'
      });

      // 3. Move all non-completed tickets to the new sprint and log activity
      await Ticket.updateMany(
        { 
          sprint: req.params.id, 
          status: { $ne: 'COMPLETED' } 
        },
        { 
          $set: { sprint: nextSprint._id },
          $push: {
            activityLogs: {
              user: req.user._id,
              action: 'Sprint Rollover',
              details: `Automatically moved from ${sprint.name} to ${nextSprintName}`
            }
          }
        }
      );
      
      console.log(`[SprintAutomation] Completed ${sprint.name}, created ${nextSprintName}, and rolled over tasks.`);
    }

    sprint = await Sprint.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: sprint,
    });
  } catch (err) {
    console.error(`[SprintController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete sprint
// @route   DELETE /api/sprints/:id
// @access  Private
exports.deleteSprint = async (req, res, next) => {
  try {
    const sprint = await Sprint.findById(req.params.id);

    if (!sprint) {
      return res.status(404).json({ success: false, error: 'Sprint not found' });
    }

    // Checking project permissions
    const project = await Project.findById(sprint.project);
    const userId = req.user._id.toString();
    const isTeamMember = project.team && req.user.team && project.team.toString() === req.user.team.toString();

    if (project.owner.toString() !== userId && !isTeamMember) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this sprint' });
    }

    // Permanently delete all tickets associated with this sprint and their subtasks
    const Ticket = require('../models/Ticket');
    const ticketsInSprint = await Ticket.find({ sprint: req.params.id }).select('_id');
    const ticketIds = ticketsInSprint.map(t => t._id);
    
    // Delete the tickets themselves
    const deleteResult = await Ticket.deleteMany({ sprint: req.params.id });
    
    // Also delete any subtasks where the parent was in this sprint (just in case they weren't explicitly in the sprint)
    const subtaskDeleteResult = await Ticket.deleteMany({ parent: { $in: ticketIds } });
    
    console.log(`[SprintController] Deleted sprint ${req.params.id}. Tickets deleted: ${deleteResult.deletedCount}, Subtasks deleted: ${subtaskDeleteResult.deletedCount}`);

    await sprint.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(`[SprintController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};
