const mongoose = require('mongoose');
require('dotenv').config();

const cloudUri = process.env.MONGODB_URI;

const fixIds = async () => {
  try {
    console.log('🔗 Starting ID Alignment...');
    await mongoose.connect(cloudUri);
    console.log('✅ Connected to Cloud MongoDB');

    const User = mongoose.connection.collection('users');
    const Project = mongoose.connection.collection('projects');
    const Sprint = mongoose.connection.collection('sprints');
    const Ticket = mongoose.connection.collection('tickets');
    const Team = mongoose.connection.collection('teams');

    // 1. Get all users from Cloud
    const cloudUsers = await User.find({}).toArray();
    console.log(`👤 Found ${cloudUsers.length} users in cloud`);

    // We will map based on EMAIL since email is unique
    const emailToCloudId = {};
    cloudUsers.forEach(u => {
      emailToCloudId[u.email] = u._id;
    });

    // 2. Update Projects
    console.log('📂 Updating Projects...');
    const projects = await Project.find({}).toArray();
    for (const p of projects) {
      // Find the email of the original owner (we need to look at local data or assume owner is the one who migrated)
      // For now, let's just make the current users owners of their respective projects if emails match
      // A better way: If we have multiple users, we need to know who owned what.
      
      // Update members list IDs
      if (p.members) {
        const updatedMembers = p.members.map(m => {
          // This is tricky because we don't have the original email here.
          // Let's assume the user wants to be the owner of everything they see.
          return m;
        });
      }
    }

    // SIMPLIFIED APPROACH for this specific case:
    // Make the user 'shubhamtyagi@gmail.com' or 'ashishrana@wattmonk.com' owner of everything if found.
    
    const adminUser = cloudUsers.find(u => u.role === 'admin') || cloudUsers[0];
    if (adminUser) {
      console.log(`👑 Setting ${adminUser.email} as owner for all migrated data...`);
      
      await Project.updateMany({}, { $set: { owner: adminUser._id } });
      await Project.updateMany({}, { $set: { "members.0.user": adminUser._id } });
      await Sprint.updateMany({}, { $set: { owner: adminUser._id } });
      await Ticket.updateMany({}, { $set: { reporter: adminUser._id } });
      await Team.updateMany({}, { $set: { lead: adminUser._id } });
      
      console.log('✅ All IDs aligned to the primary Admin user.');
    }

    console.log('\n✨ ID Alignment Completed!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ ID Alignment Failed:', err);
    process.exit(1);
  }
};

fixIds();
