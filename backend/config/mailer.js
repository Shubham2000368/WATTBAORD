const nodemailer = require('nodemailer');

// Development-ready SMTP config utilizing env variables with Mailtrap as default fallback
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  port: process.env.SMTP_PORT || 2525,
  auth: {
    user: process.env.SMTP_USER || 'mock_user',
    pass: process.env.SMTP_PASS || 'mock_pass',
  },
});

module.exports = transporter;
