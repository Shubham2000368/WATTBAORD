const Ticket = require('../models/Ticket');
const Project = require('../models/Project');
const User = require('../models/User');

exports.validateAssignment = async (req, res, next) => {
  try {
    const { assignees } = req.body;
    // If no assignees are specified in update/create, skip validation
    if (!assignees) return next();

    const currentUser = req.user;
    const ticketId = req.params.id;
    let project;

    if (ticketId) {
      const ticket = await Ticket.findById(ticketId);
      if (!ticket) {
        return res.status(404).json({ success: false, error: 'Ticket not found' });
      }
      project = await Project.findById(ticket.project);
    } else {
      project = await Project.findById(req.params.projectId || req.body.project);
    }

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found for assignment validation' });
    }

    // Map legacy 'user' role to 'member' for validation
    const userRole = currentUser.role === 'user' ? 'member' : currentUser.role;

    // Rule 1: Admin can assign anyone
    if (userRole === 'admin') {
      return next();
    }

    // Check target users existence and teams
    const targetUsers = await User.find({ _id: { $in: assignees } });
    if (targetUsers.length !== assignees.length) {
      return res.status(400).json({ success: false, error: 'One or more assignees do not exist' });
    }

    // Rule 2: Manager can assign within their team (members of the project)
    if (userRole === 'manager') {
      const projectMemberIds = project.members.map(m => m.user.toString());
      const isWithinTeam = targetUsers.every(u => projectMemberIds.includes(u._id.toString()));
      if (!isWithinTeam) {
        return res.status(403).json({
          success: false,
          error: 'Managers can only assign team members belonging to this project.'
        });
      }
      return next();
    }

    // Rule 3: Member can only assign to self
    if (userRole === 'member') {
      const isOnlySelf = targetUsers.every(u => u._id.toString() === currentUser._id.toString());
      if (!isOnlySelf) {
        return res.status(403).json({
          success: false,
          error: 'Members are restricted to assigning tickets to themselves.'
        });
      }
      return next();
    }

    return res.status(403).json({ success: false, error: 'Unauthorized role assignment capability.' });
  } catch (err) {
    console.error('Assignment validation error:', err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
