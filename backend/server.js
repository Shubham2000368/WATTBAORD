const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.set('trust proxy', 1);
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


// Root Route
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>WattBoard API | Status</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                background-color: #020617;
                color: #f8fafc;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100vh;
                margin: 0;
            }
            .container {
                text-align: center;
                padding: 2rem;
                border: 1px solid #1e293b;
                border-radius: 1rem;
                background: #0f172a;
                box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);
            }
            h1 { color: #6366f1; margin-bottom: 0.5rem; }
            p { color: #94a3b8; }
            .status-pulse {
                display: inline-block;
                width: 10px;
                height: 10px;
                background-color: #10b981;
                border-radius: 50%;
                margin-right: 8px;
                box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                animation: pulse 2s infinite;
            }
            @keyframes pulse {
                0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(16, 185, 129, 0); }
                100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
            }
            .link { color: #818cf8; text-decoration: none; font-weight: 500; }
            .link:hover { text-decoration: underline; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🚀 WattBoard API</h1>
            <p><span class="status-pulse"></span> Service is running smoothly</p>
            <p style="margin-top: 1.5rem; font-size: 0.875rem;">
                Visit <a href="/api/health" class="link">/api/health</a> for detailed status
            </p>
        </div>
    </body>
    </html>
  `);
});

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
  res.json({ 
    status: 'ok', 
    service: 'WattFlow Backend',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
