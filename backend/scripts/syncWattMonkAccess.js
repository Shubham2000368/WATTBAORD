const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '../.env') });

const sync = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const wattmonkTeam = await Team.findOne({ name: 'WattMonk Team' });
    if (!wattmonkTeam) {
      console.log('WattMonk Team not found.');
      process.exit(1);
    }

    const projects = await Project.find({ team: wattmonkTeam._id });
    const users = await User.find({ email: /@wattmonk.com$/i });

    console.log(`Syncing ${users.length} users with ${projects.length} projects...`);

    for (const user of users) {
      // 1. Ensure User is in WattMonk Team
      user.team = wattmonkTeam._id;
      await user.save();

      // Ensure in Team members array
      const isTeamMember = wattmonkTeam.members.some(m => m.user && m.user.toString() === user._id.toString());
      if (!isTeamMember) {
        wattmonkTeam.members.push({ user: user._id, role: 'member' });
      }

      // 2. Ensure User has access to all Team Projects
      for (const project of projects) {
        const isProjectMember = project.members.some(m => m.user && m.user.toString() === user._id.toString());
        if (!isProjectMember) {
          project.members.push({ user: user._id, role: 'Member', hasAccess: true });
          await project.save();
          console.log(` - Granted ${user.email} access to ${project.name}`);
        } else {
          // Double check hasAccess is true
          const member = project.members.find(m => m.user && m.user.toString() === user._id.toString());
          if (member && !member.hasAccess) {
            member.hasAccess = true;
            await project.save();
            console.log(` - Fixed ${user.email} access to ${project.name}`);
          }
        }
      }
    }

    await wattmonkTeam.save();
    console.log('Sync complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

sync();
