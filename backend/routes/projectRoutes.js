const express = require('express');
const {
  getProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  addMember,
  removeMember,
  toggleAccess,
  bulkToggleAccess,
  clearProjectTickets,
  addFolder,
  deleteFolder,
} = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

// Re-route into other resource routers
const sprintRouter = require('./sprintRoutes');
const ticketRouter = require('./ticketRoutes');

router.use('/:projectId/sprints', sprintRouter);
router.use('/:projectId/tickets', ticketRouter);

router.route('/')
  .get(getProjects)
  .post(createProject);

router.route('/:id')
  .get(getProject)
  .put(updateProject)
  .delete(authorize('admin'), deleteProject);

// Member management routes
router.route('/:id/members')
  .post(authorize('admin'), addMember);

router.route('/:id/members/:userId')
  .delete(authorize('admin'), removeMember);

router.route('/bulk-toggle-access')
  .patch(bulkToggleAccess);

router.route('/:id/toggle-access')
  .patch(toggleAccess);

router.route('/:id/clear-tickets')
  .delete(authorize('admin'), clearProjectTickets);

router.route('/:id/folders')
  .post(addFolder);

router.route('/:id/folders/:folderId')
  .delete(deleteFolder);

module.exports = router;
