const express = require('express');
const { getTeams, getTeam, createTeam, deleteTeam, addMembers, removeMember, updateMemberRole } = require('../controllers/teamController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getTeams)
  .post(authorize('admin'), createTeam);

router.route('/:id')
  .get(getTeam)
  .put(authorize('admin'), updateTeam)
  .delete(authorize('admin'), deleteTeam);

router.route('/:id/members')
  .post(authorize('admin'), addMembers);

router.route('/:id/members/:userId')
  .put(authorize('admin'), updateMemberRole)
  .delete(authorize('admin'), removeMember);

module.exports = router;
