const Team = require('../models/Team');
const User = require('../models/User');

/**
 * Automatically assigns a user to a team based on their email domain.
 * If the team doesn't exist, it creates it.
 * @param {Object} user - The user document
 */
const assignUserToTeam = async (user) => {
  const userId = user._id.toString();
  console.log(`[TeamAssignment] Starting assignment for user: ${user.email} (${userId})`);
  
  try {
    const email = user.email.toLowerCase();
    const isWattMonkDomain = email.endsWith('@wattmonk.com');
    
    // 1. Identify Target Team
    let team;
    if (isWattMonkDomain) {
      console.log(`[TeamAssignment] User is corporate. Looking for WattMonk Team...`);
      team = await Team.findOne({ name: 'WattMonk Team' });
    } else {
      console.log(`[TeamAssignment] User is guest. Looking for Default Team...`);
      // Try by ID first (more reliable) then by name
      team = await Team.findById('69e205c1005644c55b950e1a') || await Team.findOne({ name: 'Default Team' });
    }

    // 2. Create Team if missing
    if (!team) {
      console.log(`[TeamAssignment] Target team not found. Creating new one...`);
      const teamName = isWattMonkDomain ? 'WattMonk Team' : 'Default Team';
      const admin = await User.findOne({ role: 'admin' });
      
      team = await Team.create({
        name: teamName,
        lead: admin ? admin._id : user._id,
        members: [{ user: user._id, role: 'member' }],
        color: isWattMonkDomain ? 'bg-indigo-600' : 'bg-indigo-500',
      });
      console.log(`[TeamAssignment] Created new team: ${team._id}`);
    } else {
      console.log(`[TeamAssignment] Found team: ${team.name} (${team._id})`);
      
      // 3. Add User to Team Members (Idempotent)
      const isAlreadyMember = team.members.some(m => m.user && m.user.toString() === userId);
      
      if (!isAlreadyMember) {
        await Team.findByIdAndUpdate(team._id, {
          $push: { members: { user: user._id, role: 'member' } }
        });
        console.log(`[TeamAssignment] User added to members array.`);
      } else {
        console.log(`[TeamAssignment] User is already a member of this team.`);
      }
    }

    // 4. Link User to Team
    await User.findByIdAndUpdate(userId, { team: team._id });
    user.team = team._id; // Update in-memory object
    
    console.log(`[TeamAssignment] Assignment complete. User ${userId} -> Team ${team._id}`);
    return team._id;
  } catch (err) {
    console.error('[TeamAssignment] CRITICAL ERROR:', err);
    return null;
  }
};

module.exports = assignUserToTeam;
