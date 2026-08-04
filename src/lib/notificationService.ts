import nodemailer from 'nodemailer';
import { Notification } from '@/types/Notification';

// ─────────────────────────────────────────────────
// Email Service (unchanged — uses nodemailer)
// ─────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────
// MSG91 Configuration
// ─────────────────────────────────────────────────

function getMsg91AuthKey(): string {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    throw new Error('MSG91 auth key not configured. Set MSG91_AUTH_KEY in .env');
  }
  return authKey;
}

// ─────────────────────────────────────────────────
// SMS Service (MSG91 Flow API)
// ─────────────────────────────────────────────────

// export async function sendSMS(notification: Notification) {
//   const authKey = getMsg91AuthKey();
//   const templateId = process.env.MSG91_SMS_TEMPLATE_ID;
//   const senderId = process.env.MSG91_SENDER_ID;

//   if (!templateId) {
//     throw new Error('MSG91 SMS template ID not configured. Set MSG91_SMS_TEMPLATE_ID in .env');
//   }
//   if (!senderId) {
//     throw new Error('MSG91 Sender ID not configured. Set MSG91_SENDER_ID in .env');
//   }

//   // Ensure recipient has country code (strip leading '+' if present)
//   const mobile = notification.recipient.startsWith('+')
//     ? notification.recipient.substring(1)
//     : notification.recipient;

//   console.log('Sending SMS via MSG91 to:', mobile);
//   console.log('SMS content:', notification.message);

//   const payload = {
//     template_id: templateId,
//     sender: senderId,
//     short_url: '0',
//     mobiles: mobile,
//     // MSG91 uses template variables — pass the message as a variable
//     message: notification.message,
//   };

//   const response = await fetch('https://control.msg91.com/api/v5/flow', {
//     method: 'POST',
//     headers: {
//       'Content-Type': 'application/json',
//       authkey: authKey,
//     },
//     body: JSON.stringify(payload),
//   });

//   const result = await response.json();

//   if (!response.ok) {
//     console.error('MSG91 SMS error:', result);
//     throw new Error(result.message || `MSG91 SMS failed with status ${response.status}`);
//   }

//   console.log('SMS sent via MSG91:', result);
//   return result;
// }

export async function sendSMS(notification: Notification) {
  const authKey = process.env.MSG91_AUTH_KEY;
  const templateId = process.env.MSG91_SMS_TEMPLATE_ID;
  const senderId = process.env.MSG91_SENDER_ID;

  if (!authKey) throw new Error("MSG91_AUTH_KEY missing");
  if (!templateId) throw new Error("MSG91_SMS_TEMPLATE_ID missing");
  if (!senderId) throw new Error("MSG91_SENDER_ID missing");

  const mobile = notification.recipient.startsWith("+")
    ? notification.recipient.slice(1)
    : notification.recipient;

  console.log("Sending SMS to:", mobile);

  const payload = {
    template_id: templateId,
    sender: senderId,
    short_url: "0",
    mobiles: mobile,

    // Variable name must match your template placeholder
    num: notification.message.match(/\d+/)?.[0] || "000000",
  };

  console.log(
    "Payload:",
    JSON.stringify(payload, null, 2)
  );

  const response = await fetch(
    "https://control.msg91.com/api/v5/flow/",
    {
      method: "POST",
      headers: {
        authkey: authKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  console.log(
    "MSG91 Response:",
    JSON.stringify(result, null, 2)
  );

  if (!response.ok) {
    throw new Error(
      result.message || "SMS sending failed"
    );
  }

  return result;
}

// ─────────────────────────────────────────────────
// WhatsApp Service (MSG91 WhatsApp API)
// ─────────────────────────────────────────────────

export async function sendWhatsApp(notification: Notification) {
  const authKey = getMsg91AuthKey();
  const templateName = process.env.MSG91_WHATSAPP_TEMPLATE_NAME;
  const integratedNumber = process.env.MSG91_WHATSAPP_INTEGRATED_NUMBER;

  if (!templateName) {
    throw new Error(
      'MSG91 WhatsApp template name not configured. Set MSG91_WHATSAPP_TEMPLATE_NAME in .env'
    );
  }
  if (!integratedNumber) {
    throw new Error(
      'MSG91 WhatsApp integrated number not configured. Set MSG91_WHATSAPP_INTEGRATED_NUMBER in .env'
    );
  }

  // Ensure recipient has country code (strip leading '+' if present)
  const mobile = notification.recipient.startsWith('+')
    ? notification.recipient.substring(1)
    : notification.recipient;

  console.log('Sending WhatsApp message via MSG91 to:', mobile);

  const payload = {
    integrated_number: integratedNumber,
    content_type: 'template',
    payload: {
      messaging_product: 'whatsapp',
      type: 'template',
      template: {
        name: templateName,
        language: {
          code: 'en',
          policy: 'deterministic',
        },
        namespace: process.env.MSG91_WHATSAPP_NAMESPACE || '',
        to_and_components: [
          {
            to: [mobile],
            components: {
              body_1: {
                type: 'text',
                value: notification.message,
              },
            },
          },
        ],
      },
    },
  };

  const response = await fetch(
    'https://control.msg91.com/api/v5/whatsapp/whatsapp-outbound-message/',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    }
  );

  const result = await response.json();

  if (!response.ok) {
    console.error('MSG91 WhatsApp error:', result);
    throw new Error(result.message || `MSG91 WhatsApp failed with status ${response.status}`);
  }

  console.log('WhatsApp message sent via MSG91:', result);
  return result;
}