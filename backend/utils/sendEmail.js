const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: smtpPort,
    secure: smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    tls: {
      rejectUnauthorized: false // Often needed for cloud deployments
    }
  });

  const fromName = process.env.FROM_NAME || 'WattBoard';
  const fromEmail = process.env.FROM_EMAIL || process.env.SMTP_USER;

  const message = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    const info = await transporter.sendMail(message);
    console.log('Message sent: %s', info.messageId);
    return info;
  } catch (error) {
    console.error('Nodemailer Error Detail:', error);
    throw error;
  }
};

module.exports = sendEmail;
