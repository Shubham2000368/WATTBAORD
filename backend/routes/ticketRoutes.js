const express = require('express');
const {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketByIssueId,
  addComment,
  addAttachment,
  deleteAttachment,
  getSubtasks,
  searchTickets
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');
const { validateAssignment } = require('../middleware/validation');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/browse/:issueId')
  .get(getTicketByIssueId);

router.route('/search')
  .get(searchTickets);

router.route('/')
  .get(getTickets)
  .post(validateAssignment, createTicket);

router.route('/:id')
  .put(validateAssignment, updateTicket)
  .delete(deleteTicket);

router.route('/:id/comments')
  .post(addComment);

router.route('/:id/attachments')
  .post(addAttachment);

router.route('/:id/attachments/:attachmentId')
  .delete(deleteAttachment);

router.route('/:id/subtasks')
  .get(getSubtasks);

module.exports = router;
