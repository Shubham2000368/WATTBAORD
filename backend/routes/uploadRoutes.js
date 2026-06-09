const express = require('express');
const router = express.Router();
const multer = require('multer');
const { protect } = require('../middleware/auth');
const { uploadAttachment } = require('../controllers/uploadController');

// Multer memory storage (we upload buffer to R2 directly)
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB overall max, controller does fine-grained checks
  }
});

router.post('/attachments/:ticketId', protect, upload.single('file'), uploadAttachment);

module.exports = router;
