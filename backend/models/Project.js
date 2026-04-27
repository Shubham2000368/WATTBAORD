const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a project name'],
    trim: true,
    maxlength: [100, 'Name cannot be more than 100 characters'],
  },
  key: {
    type: String,
    required: [true, 'Please add a project key'],
    unique: true,
    uppercase: true,
    trim: true,
    minlength: [2, 'Key must be at least 2 characters'],
    maxlength: [10, 'Key cannot be more than 10 characters'],
  },
  description: {
    type: String,
    maxlength: [500, 'Description cannot be more than 500 characters'],
  },
  owner: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  members: [
    {
      user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
      },
      role: {
        type: String,
        enum: ['Admin', 'Developer', 'QA', 'Member'],
        default: 'Member',
      },
      hasAccess: {
        type: Boolean,
        default: true,
      }
    },
  ],
  team: {
    type: mongoose.Schema.ObjectId,
    ref: 'Team',
  },
  folders: [
    {
      name: { type: String, required: true },
      icon: { type: String, default: 'Folder' },
      createdAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Project', projectSchema);
