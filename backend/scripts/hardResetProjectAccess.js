const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '../.env') });

const hardReset = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find all projects owned by Admin (shubhamtyagi)
    const admin = await User.findOne({ email: 'shubhamtyagi@wattmonk.com' });
    if (!admin) {
      console.log('Admin not found');
      process.exit(1);
    }

    const projects = await Project.find({ owner: admin._id });
    console.log(`Found ${projects.length} company projects.`);

    for (const project of projects) {
      console.log(`Resetting access for: ${project.name}`);
      // Clear all members
      project.members = [];
      // Add only owner
      project.members.push({ user: admin._id, role: 'Admin', hasAccess: true });
      await project.save();
    }

    console.log('Access reset complete.');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

hardReset();
