const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
  const smtpPort = parseInt(process.env.SMTP_PORT || '587');
  const emailUser = process.env.EMAIL_USER || process.env.SMTP_USER;
  const emailPass = process.env.EMAIL_PASS || process.env.SMTP_PASS;

  console.log('--- Email Debug Logs ---');
  console.log('Sending email to:', options.email);
  console.log('SMTP Host:', smtpHost);
  console.log('SMTP Port:', smtpPort);
  console.log('Email User:', emailUser);
  console.log('------------------------');

  const transporter = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: emailUser,
      pass: emailPass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });

  const fromName = process.env.FROM_NAME || 'WattBoard';
  const fromEmail = process.env.FROM_EMAIL || emailUser;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    // Timeout protection: 10 seconds
    const info = await Promise.race([
      transporter.sendMail(mailOptions),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email sending timed out after 10 seconds')), 10000)
      )
    ]);

    console.log('✅ Email sent successfully:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email sending failed:', error.message);
    throw error;
  }
};

module.exports = sendEmail;
