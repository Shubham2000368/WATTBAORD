const express = require('express');
const {
  getSprints,
  getSprint,
  createSprint,
  updateSprint,
  deleteSprint
} = require('../controllers/sprintController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/')
  .get(getSprints)
  .post(createSprint);

router.route('/:id')
  .get(getSprint)
  .put(updateSprint)
  .delete(deleteSprint);

module.exports = router;
