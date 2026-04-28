const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a team name'],
    trim: true,
  },
  color: {
    type: String,
    default: 'bg-indigo-500',
  },
  lead: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['member', 'admin', 'developer', 'qa'],
        default: 'member',
      },
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for faster team lookups
teamSchema.index({ 'members.user': 1 });

module.exports = mongoose.model('Team', teamSchema);
