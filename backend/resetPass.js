require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

const resetPassword = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const users = await User.find({});
    console.log(`Found ${users.length} users. Resetting passwords...`);
    
    for (let user of users) {
      user.password = '12345678';
      await user.save();
    }
    
    console.log(`Successfully reset passwords for all ${users.length} users to: 12345678`);
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

resetPassword();
