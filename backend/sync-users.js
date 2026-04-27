const mongoose = require('mongoose');
const Team = require('./models/Team');
const User = require('./models/User');

mongoose.connect('mongodb://localhost:27017/wattflow').then(async () => {
  const team = await Team.findOne({ name: 'Default Team' });
  if (team) {
    const emails = ['kmshilpi@wattmonk.com', 'ashishrana@wattmonk.com', 'member@test.com'];
    const users = await User.find({ email: { $in: emails } });
    
    for (const user of users) {
      if (!team.members.find(m => m.user.toString() === user._id.toString())) {
        team.members.push({ user: user._id, role: 'member' });
        console.log(`Added ${user.email} to team members array`);
      }
      user.team = team._id;
      await user.save();
      console.log(`Updated team field for ${user.email}`);
    }
    
    await team.save();
    console.log('Final team saved with', team.members.length, 'members');
  } else {
    console.log('Default Team not found');
  }
  process.exit();
}).catch(err => {
  console.error(err);
  process.exit(1);
});
