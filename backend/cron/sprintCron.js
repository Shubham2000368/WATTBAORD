const cron = require('node-cron');
const { checkAndRollOverSprint } = require('../services/sprintService');

/**
 * Scheduled Sprint Rollover Job
 * Run at 00:00 (midnight) every day.
 * Timezone: Asia/Kolkata (IST) to ensure consistency with local business hours.
 */
cron.schedule('0 0 * * *', async () => {
  console.log('[Cron] Running daily sprint rollover job at midnight IST...');
  await checkAndRollOverSprint();
}, {
  scheduled: true,
  timezone: 'Asia/Kolkata'
});

console.log('[Cron] Daily sprint rollover job scheduled for 00:00 IST.');
