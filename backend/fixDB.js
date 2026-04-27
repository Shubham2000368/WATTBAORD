const mongoose = require('mongoose');
require('dotenv').config({ path: './.env' });
const Project = require('./models/Project');

async function fix() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to DB');
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
    console.log('All projects checked.');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}

fix();
