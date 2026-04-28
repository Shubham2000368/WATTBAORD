const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const User = require('../models/User');
const Team = require('../models/Team');
const Project = require('../models/Project');

dotenv.config({ path: path.join(__dirname, '../.env') });

const analyze = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const defaultTeam = await Team.findOne({ name: 'Default Team' });
    const wattmonkTeam = await Team.findOne({ name: 'WattMonk Team' });
    
    console.log('--- Teams ---');
    console.log('Default Team:', defaultTeam ? `${defaultTeam._id} (${defaultTeam.members.length} members)` : 'Not found');
    console.log('WattMonk Team:', wattmonkTeam ? `${wattmonkTeam._id} (${wattmonkTeam.members.length} members)` : 'Not found');

    const defaultProjects = await Project.find({ team: defaultTeam?._id });
    const wattmonkProjects = await Project.find({ team: wattmonkTeam?._id });

    console.log('\n--- Projects ---');
    console.log(`Projects in Default Team: ${defaultProjects.length}`);
    defaultProjects.forEach(p => console.log(` - ${p.name} (${p.key})`));
    
    console.log(`Projects in WattMonk Team: ${wattmonkProjects.length}`);
    wattmonkProjects.forEach(p => console.log(` - ${p.name} (${p.key})`));

    const users = await User.find({ email: /@wattmonk.com$/i });
    console.log(`\n--- WattMonk Users (${users.length}) ---`);
    users.forEach(u => {
        const t = u.team ? (u.team.toString() === defaultTeam?._id.toString() ? 'Default' : (u.team.toString() === wattmonkTeam?._id.toString() ? 'WattMonk' : 'Other')) : 'None';
        console.log(` - ${u.name} (${u.email}) -> Team: ${t}`);
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

analyze();
