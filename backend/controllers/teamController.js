const Team = require('../models/Team');
const User = require('../models/User');

// @desc    Get all teams
// @route   GET /api/teams
// @access  Private
exports.getTeams = async (req, res, next) => {
  try {
    const teams = await Team.find()
      .populate('lead', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      count: teams.length,
      data: teams,
    });
  } catch (err) {
    console.error(`[TeamController] Error in GET /api/teams:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Get single team
// @route   GET /api/teams/:id
// @access  Private
exports.getTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate('lead', 'name email avatar')
      .populate('members.user', 'name email avatar');

    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    res.status(200).json({
      success: true,
      data: team,
    });
  } catch (err) {
    console.error(`[TeamController] Error in GET /api/teams/:id:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Create new team
// @route   POST /api/teams
// @access  Private (Admin Only)
exports.createTeam = async (req, res, next) => {
  try {
    const team = await Team.create(req.body);
    res.status(201).json({
      success: true,
      data: team,
    });
  } catch (err) {
    console.error(`[TeamController] Error in POST /api/teams:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Delete team
// @route   DELETE /api/teams/:id
// @access  Private (Admin Only)
exports.deleteTeam = async (req, res, next) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Default Team protection
    if (team.name === 'Default Team') {
      return res.status(400).json({ success: false, error: 'Cannot delete the Default Team' });
    }

    await team.deleteOne();

    res.status(200).json({
      success: true,
      data: {},
    });
  } catch (err) {
    console.error(`[TeamController] Error in DELETE /api/teams/:id:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Add multiple members to team
// @route   POST /api/teams/:id/members
// @access  Private (Admin Only)
exports.addMembers = async (req, res, next) => {
  try {
    const { userIds, role = 'member' } = req.body;
    
    if (!userIds || !Array.isArray(userIds)) {
      return res.status(400).json({ success: false, error: 'Please provide an array of userIds' });
    }

    let team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    // Remove duplicates from input and filter out users already in team
    const existingMemberIds = team.members.map(m => m.user.toString());
    const newUserIds = [...new Set(userIds)].filter(id => !existingMemberIds.includes(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({ success: false, error: 'All users are already members of this team' });
    }

    // Verify all users exist
    const users = await User.find({ _id: { $in: newUserIds } });
    if (users.length !== newUserIds.length) {
      return res.status(404).json({ success: false, error: 'One or more users not found' });
    }

    // Add members to team
    newUserIds.forEach(id => {
      team.members.push({ user: id, role });
    });

    await team.save();

    // Update users' team field
    await User.updateMany(
      { _id: { $in: newUserIds } },
      { $set: { team: team._id } }
    );

    // Return updated team with populated members
    const updatedTeam = await Team.findById(req.params.id)
      .populate('lead', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (err) {
    console.error(`[TeamController] Error in POST /api/teams/:id/members:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};

// @desc    Remove member from team
// @route   DELETE /api/teams/:id/members/:userId
// @access  Private (Admin Only)
exports.removeMember = async (req, res, next) => {
  try {
    const { userId } = req.params;
    let team = await Team.findById(req.params.id);
    let user = await User.findById(userId);

    if (!team || !user) {
      return res.status(404).json({ success: false, error: 'Team or User not found' });
    }

    team.members = team.members.filter(m => m.user.toString() !== userId);
    await team.save();
    
    if (user.team && user.team.toString() === team._id.toString()) {
      user.team = null;
      await user.save();
    }

    const updatedTeam = await Team.findById(req.params.id)
      .populate('lead', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({ 
      success: true, 
      data: updatedTeam 
    });
  } catch (err) {
    console.error(`[TeamController] Error in DELETE /api/teams/:id/members/:userId:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};
// @desc    Update member role
// @route   PUT /api/teams/:id/members/:userId
// @access  Private/Admin
exports.updateMemberRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['member', 'admin', 'developer', 'qa'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    const team = await Team.findById(req.params.id);
    if (!team) {
      return res.status(404).json({ success: false, error: 'Team not found' });
    }

    const memberIndex = team.members.findIndex(m => m.user.toString() === req.params.userId);
    if (memberIndex === -1) {
      return res.status(404).json({ success: false, error: 'Member not found in team' });
    }

    team.members[memberIndex].role = role;
    await team.save();

    const updatedTeam = await Team.findById(req.params.id)
      .populate('lead', 'name email avatar')
      .populate('members.user', 'name email avatar');

    res.status(200).json({
      success: true,
      data: updatedTeam,
    });
  } catch (err) {
    console.error(`[TeamController] Error in PUT /api/teams/:id/members/:userId:`, err);
    res.status(400).json({ success: false, error: err.message });
  }
};
