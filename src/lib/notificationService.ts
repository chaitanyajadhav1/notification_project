import nodemailer from 'nodemailer';
import twilio from 'twilio';
import { Notification } from '@/types/Notification';

// ✅ Email service - Updated for Render compatibility
export async function sendEmail(notification: Notification) {
  // Check if email credentials are available
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email credentials not configured');
  }

  // ⚠️ CRITICAL FIX: Don't use 'service: gmail' on Render
  // Instead, configure manually with port 2525 or use SMTP2GO/SendGrid
  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587, // Try 587 with starttls
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, // Must be Gmail App Password
    },
    tls: {
      rejectUnauthorized: false, // Allow self-signed certificates
    },
    // Increased timeouts for Render
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });

  // Verify connection before sending
  try {
    await transporter.verify();
    console.log('✅ SMTP connection verified');
  } catch (verifyError: any) {
    console.error('❌ SMTP verification failed:', verifyError.message);
    // Try to send anyway, as verify() can be flaky
  }

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: notification.recipient,
    subject: notification.subject || 'Notification',
    text: notification.message,
  });
  
  console.log('✅ Email sent:', info.messageId);
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
  console.warn('⚠️ Twilio credentials not configured');
}

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
    to: to,
  });
  
  console.log('✅ SMS sent:', result.sid);
  return result;
}

// WhatsApp service
export async function sendWhatsApp(notification: Notification) {
  if (!twilioClient) {
    throw new Error('Twilio not configured');
  }
  if (!process.env.TWILIO_WHATSAPP) {
    throw new Error('Twilio WhatsApp number not configured');
  }

  // Ensure proper WhatsApp format
  const to = notification.recipient.startsWith('whatsapp:')
    ? notification.recipient
    : `whatsapp:${notification.recipient}`;

  const from = process.env.TWILIO_WHATSAPP.startsWith('whatsapp:')
    ? process.env.TWILIO_WHATSAPP
    : `whatsapp:${process.env.TWILIO_WHATSAPP}`;

  const result = await twilioClient.messages.create({
    body: notification.message,
    from: from,
    to: to,
  });
  
  console.log('✅ WhatsApp message sent:', result.sid);
  return result;
}