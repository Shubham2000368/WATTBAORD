const Sprint = require('../models/Sprint');
const Ticket = require('../models/Ticket');

/**
 * Checks for expired sprints and rolls over incomplete tickets to a new sprint.
 * Logic:
 * 1. Find active sprints that have passed their endDate.
 * 2. Mark them as 'completed'.
 * 3. Create a new 'active' sprint for the same project.
 * 4. Move all non-'COMPLETED' tickets from the old sprint to the new one.
 */
async function checkAndRollOverSprint() {
  try {
    const now = new Date();

    // 1. Find expired active sprints
    const expiredSprints = await Sprint.find({
      status: 'active',
      endDate: { $lte: now }
    });

    if (expiredSprints.length === 0) {
      return;
    }

    console.log(`[SprintRollover] Found ${expiredSprints.length} expired sprints.`);

    for (const sprint of expiredSprints) {
      // 2. Mark current sprint completed
      sprint.status = 'completed';
      await sprint.save();

      // 3. Prevent duplicate next sprint (check if one already starts at the old end date)
      const existingNextSprint = await Sprint.findOne({
        project: sprint.project,
        startDate: sprint.endDate
      });

      if (existingNextSprint) {
        console.log(`[SprintRollover] Next sprint already exists for project ${sprint.project}.`);
        
        // Even if next sprint exists, we should still move incomplete tickets if they are stuck in the old one
        await Ticket.updateMany(
          {
            sprint: sprint._id,
            status: { $ne: 'COMPLETED' }
          },
          {
            $set: { sprint: existingNextSprint._id }
          }
        );
        continue;
      }

      // 4. Calculate duration
      const duration = new Date(sprint.endDate) - new Date(sprint.startDate);
      const newStartDate = new Date(sprint.endDate);
      const newEndDate = new Date(newStartDate.getTime() + duration);

      // 5. Increment sprint name (e.g., "Sprint 1" -> "Sprint 2")
      let nextSprintName = 'Sprint 1';
      const match = sprint.name.match(/\d+/);

      if (match) {
        const num = parseInt(match[0], 10) + 1;
        nextSprintName = sprint.name.replace(/\d+/, num);
      } else {
        nextSprintName = `${sprint.name} Next`;
      }

      // 6. Create next sprint
      const newSprint = await Sprint.create({
        name: nextSprintName,
        startDate: newStartDate,
        endDate: newEndDate,
        status: 'active',
        project: sprint.project
      });

      // 7. Move ONLY non-completed tickets
      const result = await Ticket.updateMany(
        {
          sprint: sprint._id,
          status: { $ne: 'COMPLETED' }
        },
        {
          $set: { sprint: newSprint._id }
        }
      );

      console.log(`[SprintRollover] Rolled over: ${sprint.name} → ${nextSprintName} (${result.modifiedCount} tickets moved)`);
    }
  } catch (error) {
    console.error('[SprintRollover] Error:', error);
  }
}

module.exports = { checkAndRollOverSprint };
