// src/services/email.service.js
// Nodemailer-based email service

const nodemailer = require('nodemailer');
const logger     = require('../config/logger');

let transporter;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host:   process.env.SMTP_HOST,
      port:   parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function sendMail({ to, subject, html }) {
  try {
    const info = await getTransporter().sendMail({
      from: process.env.EMAIL_FROM,
      to, subject, html,
    });
    logger.info(`Email sent to ${to}: ${info.messageId}`);
    return info;
  } catch (err) {
    logger.error(`Failed to send email to ${to}:`, err.message);
    // Don't throw — email failure should not break the flow
  }
}

exports.sendWelcomeEmail = async (to) => sendMail({
  to,
  subject: 'Welcome to GMC Scholarship Portal',
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#3B6939">Welcome to the GMC Scholarship Portal</h2>
      <p>Thank you for registering. You can now apply for scholarships from Guwahati Municipal Corporation and the Government of Assam.</p>
      <p>Visit <a href="${process.env.FRONTEND_URL}">the portal</a> to get started.</p>
      <hr/>
      <small>Guwahati Municipal Corporation · Government of Assam</small>
    </div>
  `,
});

exports.sendApplicationConfirmation = async (to, application) => sendMail({
  to,
  subject: `Application Submitted — ${application.applicationNo}`,
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#3B6939">Application Submitted Successfully</h2>
      <p><strong>Application No:</strong> ${application.applicationNo}</p>
      <p><strong>Scholarship:</strong> ${application.scholarship?.name}</p>
      <p>Your application is now under review. You will be notified of any updates.</p>
      <a href="${process.env.FRONTEND_URL}/track/${application.applicationNo}"
         style="background:#3B6939;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:12px">
        Track Application
      </a>
      <hr/>
      <small>Helpline: 1800-180-5000 | GMC Education Cell</small>
    </div>
  `,
});

exports.sendPasswordReset = async (to, token) => sendMail({
  to,
  subject: 'GMC Scholarship Portal — Password Reset',
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2>Reset Your Password</h2>
      <p>Click the button below to reset your password. This link expires in 1 hour.</p>
      <a href="${process.env.FRONTEND_URL}/reset-password?token=${token}"
         style="background:#3B6939;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;display:inline-block">
        Reset Password
      </a>
      <p style="color:#888;font-size:12px;margin-top:16px">If you did not request this, ignore this email.</p>
    </div>
  `,
});

exports.sendDisbursementAlert = async (to, { amount, scholarshipName, transactionRef }) => sendMail({
  to,
  subject: '💰 Scholarship Amount Credited!',
  html: `
    <div style="font-family:sans-serif;max-width:520px;margin:auto">
      <h2 style="color:#3B6939">Scholarship Disbursement Successful</h2>
      <p>₹${amount.toLocaleString('en-IN')} from <strong>${scholarshipName}</strong> has been credited to your bank account.</p>
      <p><strong>Transaction Ref:</strong> ${transactionRef}</p>
    </div>
  `,
});
