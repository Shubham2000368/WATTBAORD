const mongoose = require('mongoose');
const Ticket = require('./backend/models/Ticket');
require('dotenv').config({ path: './backend/.env' });

async function clearOrphanedTickets() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/wattflow');
    console.log('Connected to MongoDB');

    // Delete all tickets that have no sprint (Backlog) OR have a sprint that doesn't exist
    // But since the user wants to "clear data", let's clear all tickets that are currently in the system
    // if they are not part of an ACTIVE sprint.
    const result = await Ticket.deleteMany({ sprint: null });
    console.log(`Deleted ${result.deletedCount} tickets from the backlog.`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

clearOrphanedTickets();
