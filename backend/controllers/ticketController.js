const Ticket = require('../models/Ticket');
const Project = require('../models/Project');

// Helper to log activities
const logActivity = async (ticket, userId, action, details = '') => {
  ticket.activityLogs.push({
    user: userId,
    action,
    details,
    createdAt: Date.now()
  });
};

// @desc    Get all tickets for a project
// @route   GET /api/projects/:projectId/tickets
// @access  Private
exports.getTickets = async (req, res, next) => {
  try {
    const { sprintId } = req.query;
    const query = { project: req.params.projectId };
    
    if (sprintId) {
      query.sprint = sprintId === 'backlog' ? null : sprintId;
    }

    const tickets = await Ticket.find(query)
      .populate('assignees', 'name email')
      .populate('reporter', 'name email')
      .populate('sprint', 'name')
      .populate('parent', 'issueId title');

    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets,
    });
  } catch (err) {
    console.error(`[TicketController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new ticket
// @route   POST /api/projects/:projectId/tickets
// @access  Private
exports.createTicket = async (req, res, next) => {
  try {
    req.body.project = req.params.projectId;
    req.body.reporter = req.user._id.toString();

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const userId = req.user._id.toString();
    const isMember = project.members.some(m => m.user && m.user.toString() === userId);
    if (project.owner && project.owner.toString() !== userId && !isMember && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Not authorized' });
    }

    // Team Validation: Assignee must belong to the same team. Admin can assign to anyone.
    if (req.body.assignees && req.user.role !== 'admin') {
      const User = require('../models/User');
      const assigneesToAssign = await User.find({ _id: { $in: req.body.assignees } });
      for (const assignee of assigneesToAssign) {
        if (!assignee.team || assignee.team.toString() !== req.user.team?.toString()) {
          return res.status(403).json({ success: false, error: 'Assignee must belong to the same team.' });
        }
      }
    }

    // Improved issueId generation: Find the highest number for this project and increment it
    const projectKey = project.key || 'TICKET';
    const tickets = await Ticket.find({ project: req.params.projectId })
      .select('issueId')
      .lean();
    
    let maxNumber = 100;
    tickets.forEach(t => {
      if (t.issueId) {
        const parts = t.issueId.split('-');
        const num = parseInt(parts[parts.length - 1]);
        if (!isNaN(num) && num > maxNumber) {
          maxNumber = num;
        }
      }
    });
    
    req.body.issueId = `${projectKey}-${maxNumber + 1}`;
    console.log(`[TicketController] Generated new issueId: ${req.body.issueId} for project: ${projectKey}`);

    // Handle subtask logic
    if (req.body.parent) {
      const parentTicket = await Ticket.findById(req.body.parent);
      if (!parentTicket) {
        return res.status(404).json({ success: false, error: 'Parent ticket not found' });
      }
      req.body.type = 'Subtask';
    }

    const ticket = await Ticket.create(req.body);
    
    // Log creation
    await logActivity(ticket, userId, 'Created the issue');
    await ticket.save();

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    console.error(`[TicketController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single ticket by issueId
// @route   GET /api/tickets/browse/:issueId
// @access  Private
exports.getTicketByIssueId = async (req, res, next) => {
  try {
    const ticket = await Ticket.findOne({ issueId: req.params.issueId.toUpperCase() })
      .populate('assignees', 'name email')
      .populate('reporter', 'name email')
      .populate({
        path: 'project',
        select: 'name key members',
        populate: {
          path: 'members.user',
          select: 'name email avatar team'
        }
      })
      .populate('sprint', 'name')
      .populate('comments.user', 'name')
      .populate('activityLogs.user', 'name')
      .populate('parent', 'issueId title');

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    res.status(200).json({
      success: true,
      data: ticket,
    });
  } catch (err) {
    console.error(`[TicketController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Update ticket
// @route   PUT /api/tickets/:id
// @access  Private
exports.updateTicket = async (req, res, next) => {
  try {
    let ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const userId = req.user._id.toString();
    
    // Time Tracking & Status History
    if (req.body.status && req.body.status !== ticket.status) {
      const oldStatus = ticket.status;
      const newStatus = req.body.status;
      
      // Calculate duration for the status we are leaving
      const now = Date.now();
      const startTime = ticket.timeTracking.currentStatusStartedAt || ticket.createdAt;
      const duration = now - new Date(startTime).getTime();

      ticket.timeTracking.statusHistory.push({
        status: oldStatus,
        startTime: startTime,
        endTime: now,
        duration: duration
      });

      ticket.timeTracking.totalDuration += duration;
      ticket.timeTracking.currentStatusStartedAt = now;
      
      const durationText = duration > 60000 
        ? `${Math.floor(duration / 60000)}m ${Math.floor((duration % 60000) / 1000)}s`
        : `${Math.floor(duration / 1000)}s`;

      await logActivity(ticket, userId, 'Changed status', `from ${oldStatus} to ${newStatus} (Spent ${durationText})`);
    }

    // Activity logging for other fields
    if (req.body.title && req.body.title !== ticket.title) {
      await logActivity(ticket, userId, 'Updated title', `to "${req.body.title}"`);
    }
    
    if (req.body.description !== undefined && req.body.description !== ticket.description) {
      await logActivity(ticket, userId, 'Updated description');
    }

    if (req.body.assignees) {
      await logActivity(ticket, userId, 'Updated assignees');
    }

    if (req.body.priority && req.body.priority !== ticket.priority) {
      await logActivity(ticket, userId, 'Set priority', `to ${req.body.priority}`);
    }

    if (req.body.sprint !== undefined && req.body.sprint?.toString() !== ticket.sprint?.toString()) {
      const Sprint = require('../models/Sprint');
      let detail = 'Moved to Backlog';
      if (req.body.sprint) {
        const newSprint = await Sprint.findById(req.body.sprint);
        detail = `Moved to ${newSprint ? newSprint.name : 'new sprint'}`;
      }
      await logActivity(ticket, userId, 'Changed sprint', detail);
    }

    // Team Validation: Assignee must belong to the same team. Admin can assign to anyone.
    if (req.body.assignees && req.user.role !== 'admin') {
      const User = require('../models/User');
      const assigneesToAssign = await User.find({ _id: { $in: req.body.assignees } });
      for (const assignee of assigneesToAssign) {
        if (!assignee.team || assignee.team.toString() !== req.user.team?.toString()) {
          return res.status(403).json({ success: false, error: 'Assignee must belong to the same team.' });
        }
      }
    }

    // Apply updates to the ticket object
    const allowedFields = ['title', 'description', 'status', 'priority', 'type', 'labels', 'assignees', 'sprint'];
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        ticket[field] = req.body[field];
      }
    });

    await ticket.save();

    // Smart Status Logic: If all subtasks of a parent are COMPLETED or QA ACCEPTED, move parent to READY FOR QA
    const triggerStatuses = ['COMPLETED', 'QA ACCEPTED'];
    if (triggerStatuses.includes(req.body.status) && ticket.parent) {
      const parentId = ticket.parent;
      const subtasks = await Ticket.find({ parent: parentId });
      const allDone = subtasks.every(st => triggerStatuses.includes(st.status));
      
      if (allDone) {
        const parentTicket = await Ticket.findById(parentId);
        const skipStatuses = ['READY FOR QA', 'IN QA', 'QA ACCEPTED', 'COMPLETED'];
        if (parentTicket && !skipStatuses.includes(parentTicket.status)) {
          const oldStatus = parentTicket.status;
          parentTicket.status = 'READY FOR QA';
          parentTicket.timeTracking.currentStatusStartedAt = Date.now();
          await logActivity(parentTicket, userId, 'Auto-transition status', `from ${oldStatus} to READY FOR QA (All subtasks completed)`);
          await parentTicket.save();
        }
      }
    }

    // Re-populate for response
    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('assignees', 'name email')
      .populate('reporter', 'name email')
      .populate('comments.user', 'name')
      .populate('activityLogs.user', 'name')
      .populate('parent', 'issueId title');

    res.status(200).json({
      success: true,
      data: updatedTicket,
    });
  } catch (err) {
    console.error(`[TicketController] Error in ${req.method} ${req.originalUrl}:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Add comment to ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
exports.addComment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const userId = req.user._id.toString();
    const comment = {
      user: userId,
      userName: req.user.name,
      text: req.body.text,
      createdAt: Date.now()
    };

    ticket.comments.push(comment);
    await logActivity(ticket, userId, 'Added a comment');
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket.comments[ticket.comments.length - 1]
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Upload attachment metadata
// @route   POST /api/tickets/:id/attachments
// @access  Private
exports.addAttachment = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    const userId = req.user._id.toString();
    const attachment = {
      ...req.body,
      user: userId,
      createdAt: Date.now()
    };

    ticket.attachments.push(attachment);
    await logActivity(ticket, userId, 'Attached a file', attachment.name);
    await ticket.save();

    res.status(200).json({
      success: true,
      data: ticket.attachments[ticket.attachments.length - 1]
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get subtasks for a ticket
// @route   GET /api/tickets/:id/subtasks
// @access  Private
exports.getSubtasks = async (req, res, next) => {
  try {
    const subtasks = await Ticket.find({ parent: req.params.id })
      .populate('assignees', 'name email')
      .populate('reporter', 'name email');

    res.status(200).json({
      success: true,
      count: subtasks.length,
      data: subtasks
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private
exports.deleteTicket = async (req, res, next) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    await ticket.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Search tickets
// @route   GET /api/tickets/search
// @access  Private
exports.searchTickets = async (req, res, next) => {
  try {
    const { q } = req.query;
    if (!q) {
      return res.status(200).json({ success: true, data: [] });
    }

    const tickets = await Ticket.find({
      $or: [
        { issueId: { $regex: q, $options: 'i' } },
        { title: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    })
    .limit(10)
    .populate('project', 'name key');

    res.status(200).json({
      success: true,
      data: tickets
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
