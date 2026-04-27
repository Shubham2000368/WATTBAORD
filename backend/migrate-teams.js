const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');
const Project = require('./models/Project');

require('dotenv').config();

const migrateTeams = async () => {
  try {
    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wattflow';
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Migrate existing teams members structure
    console.log('🔄 Migrating existing teams to new member structure...');
    const teams = await Team.find();
    for (const team of teams) {
      let changed = false;
      const newMembers = [];
      
      for (const member of team.members) {
        // If it's an ObjectId (old structure), convert to object
        if (mongoose.Types.ObjectId.isValid(member) || typeof member === 'string') {
          newMembers.push({
            user: member,
            role: 'member'
          });
          changed = true;
        } else {
          // Already new structure, keep as is
          newMembers.push(member);
        }
      }
      
      if (changed) {
        team.members = newMembers;
        await team.save();
        console.log(`   - Updated team: ${team.name}`);
      }
    }

    // 2. Ensure Default Team exists
    let defaultTeam = await Team.findOne({ name: 'Default Team' });
    
    if (!defaultTeam) {
      console.log('➕ Creating Default Team');
      const admin = await User.findOne({ role: 'admin' });
      defaultTeam = await Team.create({
        name: 'Default Team',
        color: 'bg-indigo-500',
        lead: admin ? admin._id : null,
        members: []
      });
    }

    // 3. Update all users to default team if they don't have one
    console.log('🔄 Updating users without a team...');
    const users = await User.find({ team: { $exists: false } });
    for (const user of users) {
      user.team = defaultTeam._id;
      await user.save({ validateBeforeSave: false });
      
      const isAlreadyMember = defaultTeam.members.some(m => m.user && m.user.toString() === user._id.toString());
      if (!isAlreadyMember) {
        defaultTeam.members.push({ user: user._id, role: 'member' });
      }
    }

    // 4. Now projects
    console.log('🔄 Updating projects without a team...');
    const projects = await Project.find({ team: { $exists: false } });
    for (const project of projects) {
        project.team = defaultTeam._id;
        await project.save({ validateBeforeSave: false });
    }

    await defaultTeam.save();

    console.log('✨ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
};

migrateTeams();
