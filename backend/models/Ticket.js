const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  userName: String,
  text: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const attachmentSchema = new mongoose.Schema({
  name: String,
  size: Number,
  type: String,
  url: String,
  key: String,
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const activityLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  },
  action: {
    type: String,
    required: true
  },
  details: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Please add a ticket title'],
    trim: true,
  },
  issueId: {
    type: String,
    unique: true,
    required: [true, 'Please add an issue identifier'],
    uppercase: true,
  },
  description: {
    type: String,
  },
  status: {
    type: String,
    enum: [
      'TODO',
      'IN PROGRESS',
      'READY FOR QA',
      'IN QA',
      'REOPENED',
      'BLOCKED',
      'QA ACCEPTED',
      'COMPLETED',
      'TO BE GROOMED',
      'GROOMED',
      'READY FOR SPRINT',
      'IN SPRINT'
    ],
    default: 'TODO',
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Blocker'],
    default: 'Medium',
  },
  labels: [String],
  type: {
    type: String,
    enum: ['Task', 'Bug', 'Story', 'Subtask'],
    default: 'Task',
  },
  // Parent reference for subtasks
  parent: {
    type: mongoose.Schema.ObjectId,
    ref: 'Ticket',
    default: null
  },
  // Supporting multiple assignees as requested
  assignees: [{
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  }],
  // Backward compatibility
  assignee: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
  },
  reporter: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true,
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true,
  },
  sprint: {
    type: mongoose.Schema.ObjectId,
    ref: 'Sprint',
  },
  folder: {
    type: mongoose.Schema.Types.ObjectId,
  },

  comments: [commentSchema],
  attachments: [attachmentSchema],
  activityLogs: [activityLogSchema],

  timeTracking: {
    totalDuration: {
      type: Number,
      default: 0 // In milliseconds
    },
    currentStatusStartedAt: {
      type: Date,
      default: Date.now
    },
    statusHistory: [{
      status: String,
      startTime: Date,
      endTime: Date,
      duration: Number
    }]
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update updatedAt on every save
ticketSchema.pre('save', async function () {
  this.updatedAt = Date.now();

  // Migration logic: If single assignee exists but assignees array is empty, populate it
  if (this.assignee && (!this.assignees || this.assignees.length === 0)) {
    this.assignees = [this.assignee];
  }
});

// Add indexes for faster ticket lookups
ticketSchema.index({ project: 1 });
ticketSchema.index({ sprint: 1 });
ticketSchema.index({ assignee: 1 });
ticketSchema.index({ status: 1 });

module.exports = mongoose.model('Ticket', ticketSchema);
