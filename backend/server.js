// Trigger nodemon restart
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/wattflow')
  .then(() => console.log('✅ Connected to MongoDB'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

// Initialize Cron Jobs
require('./cron/sprintRollover');


// Routes
const auth = require('./routes/authRoutes');
const projects = require('./routes/projectRoutes');
const sprints = require('./routes/sprintRoutes');
const tickets = require('./routes/ticketRoutes');
const teams = require('./routes/teamRoutes');
const users = require('./routes/userRoutes');

app.use('/api/auth', auth);
app.use('/api/projects', projects);
app.use('/api/sprints', sprints);
app.use('/api/tickets', tickets);
app.use('/api/teams', teams);
app.use('/api/users', users);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'WattFlow Backend' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
