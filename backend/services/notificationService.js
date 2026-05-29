const User = require('../models/User');
const Ticket = require('../models/Ticket');
const transporter = require('../config/mailer');

exports.processMentions = async (ticketId, commentText, senderName) => {
  try {
    // Regex parsing for rich format of mentions: @[UserName](userId)
    const mentionRegex = /@\[([^\]]+)\]\(([^\)]+)\)/g;
    const matches = [...commentText.matchAll(mentionRegex)];
    if (matches.length === 0) return [];

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return [];

    const mentionedUserIds = matches.map(m => m[2]);
    const usersToNotify = await User.find({ _id: { $in: mentionedUserIds } });

    for (const user of usersToNotify) {
      const issueLink = `http://localhost:3000/browse/${ticket.issueId}`;
      const mailOptions = {
        from: '"WattBoard Notifications" <noreply@wattboard.com>',
        to: user.email,
        subject: `[WattBoard] You were mentioned in ${ticket.issueId}`,
        html: `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; padding: 32px; background-color: #f8fafc; color: #1e293b;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
              <div style="padding: 24px; background-color: #4f46e5; color: #ffffff;">
                <h2 style="margin: 0; font-size: 20px; font-weight: 800; tracking: -0.025em;">WattBoard Mention Alert</h2>
              </div>
              <div style="padding: 32px;">
                <p style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">Hi ${user.name},</p>
                <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #475569;">
                  <strong>${senderName}</strong> mentioned you in a comment on issue <strong>${ticket.issueId}: ${ticket.title}</strong>:
                </p>
                <div style="background-color: #f1f5f9; border-left: 4px solid #4f46e5; padding: 16px; border-radius: 8px; font-style: italic; margin-bottom: 32px; color: #334155; font-size: 14px; line-height: 1.5;">
                  "${commentText.replace(mentionRegex, '@$1')}"
                </div>
                <div style="text-align: center;">
                  <a href="${issueLink}" style="display: inline-block; padding: 14px 32px; background-color: #4f46e5; color: #ffffff; text-decoration: none; border-radius: 10px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);">
                    View Issue in WattBoard
                  </a>
                </div>
              </div>
              <div style="padding: 16px 32px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <span style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; color: #94a3b8;">
                  This is an automated notification. Please do not reply.
                </span>
              </div>
            </div>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        console.log(`[NotificationService] Mail alert sent successfully to ${user.email}`);
      } catch (mailErr) {
        console.error(`[NotificationService] Failed to send email to ${user.email}:`, mailErr.message);
      }
    }

    return mentionedUserIds;
  } catch (err) {
    console.error('[NotificationService] Error processing mentions:', err);
    return [];
  }
};
