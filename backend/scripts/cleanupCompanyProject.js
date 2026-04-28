const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Find the company project
    const project = await Project.findOne({ name: 'Ensite2026' });
    if (!project) {
      console.log('Project "Ensite2026" not found.');
      process.exit(0);
    }

    console.log(`Cleaning up project: ${project.name}`);
    console.log(`Original members count: ${project.members.length}`);

    // Filter members to keep only the owner
    // (In our case, the owner should be the admin)
    const ownerId = project.owner.toString();
    project.members = project.members.filter(m => m.user && m.user.toString() === ownerId);

    await project.save();
    console.log(`Cleaned up. New members count: ${project.members.length}`);
    
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

cleanup();
