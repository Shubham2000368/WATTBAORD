const crypto = require('crypto');
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { s3Client, BUCKET_NAME, PUBLIC_URL } = require('../config/r2');
const Ticket = require('../models/Ticket');

// Helper to log activities
const logActivity = async (ticket, userId, action, details = '') => {
  ticket.activityLogs.push({
    user: userId,
    action,
    details,
    createdAt: Date.now()
  });
};

// @desc    Upload an attachment and add to ticket
// @route   POST /api/upload/attachments/:ticketId
// @access  Private
exports.uploadAttachment = async (req, res) => {
  try {
    const ticketId = req.params.ticketId;
    const ticket = await Ticket.findById(ticketId);

    if (!ticket) {
      return res.status(404).json({ success: false, error: 'Ticket not found' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const file = req.file;
    const userId = req.user._id.toString();

    // Size validation based on type
    const maxSize = {
      image: 20 * 1024 * 1024, // 20MB
      document: 50 * 1024 * 1024, // 50MB
      video: 500 * 1024 * 1024, // 500MB
    };

    let fileTypeCategory = 'document';
    if (file.mimetype.startsWith('image/')) fileTypeCategory = 'image';
    if (file.mimetype.startsWith('video/')) fileTypeCategory = 'video';

    if (file.size > maxSize[fileTypeCategory]) {
      return res.status(400).json({ 
        success: false, 
        error: `File size exceeds the maximum limit for ${fileTypeCategory}s (${maxSize[fileTypeCategory] / (1024 * 1024)}MB)` 
      });
    }

    // Generate unique key
    const uniqueHash = crypto.randomBytes(8).toString('hex');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `tickets/${ticket.issueId}/${Date.now()}-${uniqueHash}-${safeName}`;

    let url = '';

    if (s3Client) {
      // Upload to R2
      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      await s3Client.send(command);

      if (PUBLIC_URL) {
        url = `${PUBLIC_URL}/${key}`;
      } else {
        // Generate a 7-day signed URL as fallback if public URL isn't configured
        const getCommand = new GetObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
        });
        url = await getSignedUrl(s3Client, getCommand, { expiresIn: 7 * 24 * 60 * 60 });
      }
    } else {
      console.warn('⚠️ R2 not configured. Storing file as base64 instead.');
      url = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }

    const newAttachment = {
      name: file.originalname,
      size: file.size,
      type: file.mimetype,
      url,
      key,
      user: userId,
      createdAt: Date.now()
    };

    ticket.attachments.push(newAttachment);
    await logActivity(ticket, userId, 'Attached a file', newAttachment.name);
    await ticket.save();

    // Invalidate Cache
    const redisClient = require('../config/redis');
    if (redisClient && redisClient.isReady) {
      await redisClient.del(`board:${ticket.project}`);
      const keys = await redisClient.keys(`tickets:${ticket.project}:*`);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    }

    res.status(200).json({
      success: true,
      data: ticket.attachments[ticket.attachments.length - 1]
    });
  } catch (error) {
    console.error('[UploadController] Error uploading attachment:', error);
    res.status(500).json({ success: false, error: 'Failed to upload attachment' });
  }
};
