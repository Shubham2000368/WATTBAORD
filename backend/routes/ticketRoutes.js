const express = require('express');
const {
  getTickets,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketByIssueId,
  addComment,
  addAttachment,
  getSubtasks,
  searchTickets
} = require('../controllers/ticketController');
const { protect } = require('../middleware/auth');

const router = express.Router({ mergeParams: true });

router.use(protect);

router.route('/browse/:issueId')
  .get(getTicketByIssueId);

router.route('/search')
  .get(searchTickets);

router.route('/')
  .get(getTickets)
  .post(createTicket);

router.route('/:id')
  .put(updateTicket)
  .delete(deleteTicket);

router.route('/:id/comments')
  .post(addComment);

router.route('/:id/attachments')
  .post(addAttachment);

router.route('/:id/subtasks')
  .get(getSubtasks);

module.exports = router;
