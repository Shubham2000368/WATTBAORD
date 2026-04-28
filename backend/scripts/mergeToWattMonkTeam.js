const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const defaultTeam = await Team.findOne({ name: 'Default Team' });
    const wattmonkTeam = await Team.findOne({ name: 'WattMonk Team' });
    
    if (!defaultTeam || !wattmonkTeam) {
      console.error('Teams not found');
      process.exit(1);
    }

    console.log('--- Migrating Users ---');
    const users = await User.find({ email: /@wattmonk.com$/i });
    
    for (const user of users) {
      console.log(`Processing user: ${user.email}`);
      
      // Update User.team reference
      user.team = wattmonkTeam._id;
      await user.save();
      
      // Remove from Default Team members
      defaultTeam.members = defaultTeam.members.filter(m => m.user && m.user.toString() !== user._id.toString());
      
      // Add to WattMonk Team members if not present
      const isMember = wattmonkTeam.members.some(m => m.user && m.user.toString() === user._id.toString());
      if (!isMember) {
        wattmonkTeam.members.push({ user: user._id, role: 'member' }); // Default to member, role can be adjusted later
      }
    }
    
    await defaultTeam.save();
    await wattmonkTeam.save();
    console.log('Users migrated and team members updated.');

    console.log('\n--- Migrating Projects ---');
    const projects = await Project.find({ team: defaultTeam._id });
    
    for (const project of projects) {
      console.log(`Migrating project: ${project.name}`);
      
      // Update Project.team reference
      project.team = wattmonkTeam._id;
      
      // Ensure all WattMonk Team members have access to this project
      const teamMemberIds = wattmonkTeam.members.map(m => m.user.toString());
      
      for (const userId of teamMemberIds) {
        const hasProjectMember = project.members.find(m => m.user && m.user.toString() === userId);
        if (!hasProjectMember) {
          project.members.push({ user: userId, role: 'Member', hasAccess: true });
        } else {
          hasProjectMember.hasAccess = true; // Ensure they have access
        }
      }
      
      await project.save();
    }
    
    console.log('Projects migrated and permissions updated.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

migrate();
