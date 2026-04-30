const mongoose = require('mongoose');
const Team = require('../models/Team');
require('dotenv').config();

const cleanDuplicateMembers = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB for cleanup');

    const teams = await Team.find();
    console.log(`Found ${teams.length} teams to check.`);

    for (const team of teams) {
      const uniqueMembers = [];
      const seenUserIds = new Set();
      let hasDuplicates = false;

      for (const member of team.members) {
        if (!member.user) continue;
        
        const userId = member.user.toString();
        if (!seenUserIds.has(userId)) {
          seenUserIds.add(userId);
          uniqueMembers.push(member);
        } else {
          hasDuplicates = true;
        }
      }

      if (hasDuplicates) {
        console.log(`Cleaning duplicates for team: ${team.name} (${team._id})`);
        team.members = uniqueMembers;
        await team.save();
        console.log(`✅ Cleaned. New member count: ${uniqueMembers.length}`);
      }
    }

    console.log('🎉 Cleanup complete!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Cleanup failed:', err);
    process.exit(1);
  }
};

cleanDuplicateMembers();
