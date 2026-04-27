const mongoose = require('mongoose');
const Project = require('./backend/models/Project');
require('dotenv').config({ path: './backend/.env' });

async function fix() {
  await mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  const projects = await Project.find({});
  for (let p of projects) {
    if (p.members && p.members.length > 0 && typeof p.members[0] === 'string' || p.members[0] instanceof mongoose.Types.ObjectId) {
      p.members = p.members.map(m => ({ user: m, role: 'Member', hasAccess: true }));
      await p.save();
    }
  }
  console.log('Fixed projects');
  process.exit(0);
}
fix();
