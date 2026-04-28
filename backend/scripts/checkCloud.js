const mongoose = require('mongoose');
require('dotenv').config();

const cloudUri = process.env.MONGODB_URI;

const checkCloudData = async () => {
  try {
    await mongoose.connect(cloudUri);
    console.log('✅ Connected to Cloud');

    const User = mongoose.connection.collection('users');
    const Project = mongoose.connection.collection('projects');

    const users = await User.find({}).toArray();
    console.log('\n👤 Cloud Users:');
    users.forEach(u => console.log(`- ${u.name} (${u.email}) [ID: ${u._id}]`));

    const projects = await Project.find({}).toArray();
    console.log('\n📂 Cloud Projects:');
    projects.forEach(p => console.log(`- ${p.name} [Owner ID: ${p.owner}]`));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

checkCloudData();
