import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Notification } from '@/types/Notification';

// Email service with connection pooling
let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  // Check if email credentials are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured');
  }

  // Reuse existing transporter or create a new one with pooling
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      pool: true, // Enable connection pooling
      maxConnections: 5, // Max concurrent connections
      maxMessages: 100, // Max messages per connection
      rateDelta: 1000, // Time window for rate limiting (1 second)
      rateLimit: 5, // Max messages per rateDelta
    });

    // Handle transporter errors
    emailTransporter.on('error', (err) => {
      console.error('Email transporter error:', err);
    });
  }

  return emailTransporter;
}

export async function sendEmail(notification: Notification) {
  const transporter = getEmailTransporter();

  // Configure sender with display name if available
  const senderName = process.env.EMAIL_SENDER_NAME || 'Notification Service';
  const fromAddress = `"${senderName}" <${process.env.EMAIL_USER}>`;

  const mailOptions: any = {
    from: fromAddress,
    to: notification.recipient,
    subject: notification.subject || 'Notification',
    text: notification.message, // Plain text fallback
  };

  // Add HTML content if provided
  if (notification.html) {
    mailOptions.html = notification.html;
  }

  const info = await transporter.sendMail(mailOptions);

  console.log('Email sent:', info.messageId);
  return info;
}

// Twilio setup
let twilioClient: any = null;
if (process.env.TWILIO_SID && process.env.TWILIO_AUTH_TOKEN) {
  twilioClient = twilio(
    process.env.TWILIO_SID,
    process.env.TWILIO_AUTH_TOKEN
  );
} else {
  console.warn('Twilio credentials not configured');
}

// SMS service
// src/lib/notificationService.ts
// ... other imports and code ...

// SMS service
export async function sendSMS(notification: Notification) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }
  if (!process.env.TWILIO_PHONE) {
    throw new Error('Twilio phone number not configured');
  }

  // Ensure recipient is in E.164 format (e.g., +1234567890)
  const to = notification.recipient.startsWith('+')
    ? notification.recipient
    : `+${notification.recipient}`;

  console.log('Sending SMS to:', to);
  console.log('SMS content:', notification.message);

  const result = await twilioClient.messages.create({
    body: notification.message,
    from: process.env.TWILIO_PHONE,
    to: to, // Use the formatted recipient
  });

  console.log('SMS sent:', result.sid);
  return result;
}

// ... rest of the code ...
// WhatsApp service
export async function sendWhatsApp(notification: Notification) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }
  if (!process.env.TWILIO_WHATSAPP) {
    throw new Error('Twilio WhatsApp number not configured');
  }

  const result = await twilioClient.messages.create({
    body: notification.message,
    from: `whatsapp:${process.env.TWILIO_WHATSAPP}`,
    to: `whatsapp:${notification.recipient}`,
  });

  console.log('WhatsApp message sent:', result.sid);
  return result;
}