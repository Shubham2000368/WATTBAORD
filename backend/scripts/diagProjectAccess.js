const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '../.env') });

const check = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const project = await Project.findOne({ name: 'Ensite2026' }).populate('members.user').populate('owner');
    if (!project) {
      console.log('Project not found');
      process.exit(0);
    }

    console.log('Project Name:', project.name);
    console.log('Owner:', project.owner ? project.owner.email : 'Unknown');
    console.log('Members List:');
    project.members.forEach(m => {
      console.log(` - ${m.user ? m.user.email : 'null'} (Access: ${m.hasAccess})`);
    });

    const allUsers = await User.find({ role: 'admin' });
    console.log('\nAdmin Users:');
    allUsers.forEach(u => console.log(` - ${u.email}`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

check();
