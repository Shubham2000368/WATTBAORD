const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a sprint name'],
    trim: true,
  },
  startDate: {
    type: Date,
    required: [true, 'Please add a start date'],
  },
  endDate: {
    type: Date,
    required: [true, 'Please add an end date'],
  },
  status: {
    type: String,
    enum: ['planned', 'active', 'completed'],
    default: 'planned',
  },
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Add indexes for faster sprint lookups
sprintSchema.index({ project: 1 });
sprintSchema.index({ status: 1 });

module.exports = mongoose.model('Sprint', sprintSchema);
