const mongoose = require('mongoose');
const Project = require('./models/Project');
require('dotenv').config({ path: './.env' });

async function fix() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const projects = await Project.find({});
  for (let p of projects) {
    if (p.members && p.members.length > 0) {
      let changed = false;
      p.members = p.members.map(m => {
        if (typeof m === 'string' || m instanceof mongoose.Types.ObjectId) {
          changed = true;
          return { user: m, role: 'Member', hasAccess: true };
        }
        return m;
      });
      if (changed) {
        await p.save();
        console.log(`Fixed project ${p.name}`);
      }
    }
  }
  console.log('Done');
  process.exit(0);
}
fix();
