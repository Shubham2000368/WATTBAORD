const cron = require('node-cron');
const Sprint = require('../models/Sprint');
const Ticket = require('../models/Ticket');

// Schedule to run every day at 00:01 AM
cron.schedule('1 0 * * *', async () => {
  console.log('[SprintCron] Running daily sprint check at 00:01 AM...');
  
  try {
    const today = new Date();
    // Find active sprints whose end date has passed (yesterday or earlier)
    const expiredSprints = await Sprint.find({
      status: 'active',
      endDate: { $lt: today }
    });

    if (expiredSprints.length === 0) {
      console.log('[SprintCron] No expired sprints found today.');
      return;
    }

    for (let sprint of expiredSprints) {
      console.log(`[SprintCron] Rolling over sprint: ${sprint.name} (${sprint._id})`);
      
      // Update sprint status to completed
      sprint.status = 'completed';
      await sprint.save();

      // Calculate next sprint details
      const nextSprintStartDate = new Date(sprint.endDate);
      nextSprintStartDate.setDate(nextSprintStartDate.getDate() + 1);
      
      const nextSprintEndDate = new Date(nextSprintStartDate);
      nextSprintEndDate.setDate(nextSprintEndDate.getDate() + 13); // 14 days total
      
      // Get current sprint number from name if possible
      const sprintMatch = sprint.name.match(/(\d+)/);
      const nextSprintNum = sprintMatch ? parseInt(sprintMatch[1]) + 1 : '';
      const nextSprintName = nextSprintNum ? `Sprint ${nextSprintNum}` : `${sprint.name} (Next)`;

      // Create the next sprint
      const nextSprint = await Sprint.create({
        name: nextSprintName,
        startDate: nextSprintStartDate,
        endDate: nextSprintEndDate,
        project: sprint.project,
        status: 'active' // Set new sprint to active directly
      });

      // Move all non-completed tickets to the new sprint and log activity
      // System user or no user for cron
      await Ticket.updateMany(
        { 
          sprint: sprint._id, 
          status: { $ne: 'COMPLETED' } 
        },
        { 
          $set: { sprint: nextSprint._id },
          $push: {
            activityLogs: {
              action: 'Auto Rollover',
              details: `Automatically moved from ${sprint.name} to ${nextSprintName} by System`
            }
          }
        }
      );
      
      console.log(`[SprintCron] Successfully completed ${sprint.name}, created ${nextSprintName}, and rolled over tasks.`);
    }

  } catch (error) {
    console.error('[SprintCron] Error running daily sprint check:', error);
  }
});
