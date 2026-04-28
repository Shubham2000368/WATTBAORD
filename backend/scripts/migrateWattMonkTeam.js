const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Team = require('../models/Team');

// Load env vars from .env file in the backend directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const migrate = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in .env file');
    }

    console.log('Connecting to database...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    const teamName = 'WattMonk Team';
    const domain = '@wattmonk.com';

    // 1. Find or create the WattMonk Team
    let team = await Team.findOne({ name: teamName });
    const admin = await User.findOne({ role: 'admin' });

    if (!team) {
      console.log(`Team "${teamName}" not found. Creating it...`);
      team = await Team.create({
        name: teamName,
        lead: admin ? admin._id : null,
        members: admin ? [{ user: admin._id, role: 'admin' }] : [],
        color: 'bg-indigo-600',
      });
      console.log('Team created.');
    }

    // 2. Find all users with the domain who are not in a team
    const usersToMigrate = await User.find({
      email: { $regex: `${domain}$`, $options: 'i' },
      team: { $exists: false }
    });

    console.log(`Found ${usersToMigrate.length} users with ${domain} to migrate.`);

    if (usersToMigrate.length === 0) {
      console.log('No users need migration.');
      process.exit(0);
    }

    // 3. Update team members and users
    let addedCount = 0;
    for (const user of usersToMigrate) {
      // Check if already in team.members array just in case
      const isMember = team.members.some(m => m.user && m.user.toString() === user._id.toString());
      
      if (!isMember) {
        team.members.push({ user: user._id, role: 'member' });
      }
      
      user.team = team._id;
      await user.save();
      addedCount++;
    }

    await team.save();

    console.log(`Successfully migrated ${addedCount} users to "${teamName}".`);
    process.exit(0);
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }
};

migrate();
