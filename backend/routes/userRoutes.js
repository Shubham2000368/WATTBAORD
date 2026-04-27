const express = require('express');
const { getAllUsers, adminUpdateUser } = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.use(protect);

router.get('/', getAllUsers);
router.put('/:id', authorize('admin'), adminUpdateUser);

module.exports = router;
