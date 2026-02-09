# Notification Service API

A production-ready notification microservice built with Next.js that supports **Email**, **SMS**, and **WhatsApp** notifications with HTML email support, connection pooling, rate limiting, and automatic retry logic.

## ✨ Features

- 📧 **Email Notifications** - HTML and plain text support via Nodemailer (Gmail)
- 📱 **SMS Notifications** - Send SMS via Twilio
- 💬 **WhatsApp Notifications** - Send WhatsApp messages via Twilio
- 🔄 **Connection Pooling** - Efficient SMTP connection reuse (2-3x faster for concurrent requests)
- 🛡️ **Rate Limiting** - 50 requests per minute per IP to prevent abuse
- 🔁 **Automatic Retry** - Exponential backoff retry logic for transient failures
- 🔐 **API Key Authentication** - Secure access control
- 🎨 **HTML Email Forms** - Send beautiful HTML forms and formatted emails

## 🚀 Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Create a `.env.local` file in the root directory:

```env
# API Security
API_KEY=your-secret-api-key-here

# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-specific-password

# Twilio Configuration (Optional - for SMS/WhatsApp)
TWILIO_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE=+1234567890
TWILIO_WHATSAPP=+1234567890
```

**Note**: For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833) instead of your regular password.

### 3. Run the Server

```bash
npm run dev
```

The API will be available at `http://localhost:3000/api/notifications`

## 📖 API Usage

### Endpoint
- **URL**: `/api/notifications`
- **Method**: `POST`
- **Authentication**: API Key via `x-api-key` header

### Request Format

```json
{
  "recipient": "user@example.com",
  "message": "Your message here",
  "type": "email",
  "subject": "Email Subject",
  "html": "<h1>Optional HTML content</h1>"
}
```

### Parameters

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `recipient` | string | Yes | Email address or phone number (E.164 format for SMS/WhatsApp) |
| `message` | string | Yes | Message content (plain text fallback for emails) |
| `type` | string | Yes | `email`, `sms`, or `whatsapp` |
| `subject` | string | No | Email subject (only for email type) |
| `html` | string | No | HTML content for emails |

### Response Codes

| Code | Description |
|------|-------------|
| `200` | Notification sent successfully |
| `401` | Invalid or missing API key |
| `400` | Missing required fields or invalid type |
| `429` | Rate limit exceeded (includes `Retry-After` header) |
| `500` | Server error or provider failure |

## 💡 Usage Examples

### Plain Text Email

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "recipient": "user@example.com",
    "message": "Hello from the notification service!",
    "type": "email",
    "subject": "Welcome"
  }'
```

### HTML Email

```javascript
await fetch('http://localhost:3000/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.API_KEY
  },
  body: JSON.stringify({
    recipient: 'user@example.com',
    message: 'Please complete your registration',
    type: 'email',
    subject: 'Complete Your Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px;">
        <h2>Welcome!</h2>
        <p>Click below to complete your registration:</p>
        <a href="https://yourapp.com/register" 
           style="background: #007bff; color: white; padding: 12px 30px; 
                  text-decoration: none; border-radius: 4px;">
          Complete Registration
        </a>
      </div>
    `
  })
});
```

### SMS

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "recipient": "+1234567890",
    "message": "Your verification code is 123456",
    "type": "sms"
  }'
```

### WhatsApp

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: your-api-key" \
  -d '{
    "recipient": "+1234567890",
    "message": "Hello from WhatsApp!",
    "type": "whatsapp"
  }'
```

## 🎨 HTML Email Templates

Pre-built professional email templates are available in the `examples/` directory:

- **Registration Form** - User onboarding with form fields
- **Feedback Form** - Customer feedback collection with ratings

See [examples/README.md](examples/README.md) for detailed usage instructions.

## ⚡ Performance Features

### Connection Pooling
- Up to **5 concurrent SMTP connections**
- **100 messages per connection** before reconnecting
- **2-3x faster** for concurrent email requests
- Built-in rate limiting: 5 emails/second (Gmail compliance)

### Rate Limiting
- **50 requests per minute** per IP address
- Automatic cleanup of old records
- Returns `429` status with `Retry-After` header when exceeded

### Automatic Retry
- **3 retry attempts** with exponential backoff (1s → 2s → 4s)
- Smart retry: skips permanent failures (auth, validation errors)
- Only retries transient failures (network errors, timeouts)

## 📚 Documentation

- [NOTIFICATIONS_README.md](NOTIFICATIONS_README.md) - Detailed API documentation
- [examples/README.md](examples/README.md) - HTML email template guide

## 🔧 Configuration

### Adjust Rate Limits

Edit `src/app/api/notifications/route.ts`:

```typescript
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000,  // Time window
  maxRequests: 50,      // Max requests per window
};
```

### Adjust Connection Pool

Edit `src/lib/notificationService.ts`:

```typescript
pool: true,
maxConnections: 5,    // Concurrent connections
maxMessages: 100,     // Messages per connection
rateLimit: 5,         // Emails per second
```

### Adjust Retry Behavior

Edit `src/app/api/notifications/route.ts`:

```typescript
await retryWithBackoff(async () => { ... }, {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 5000,
  backoffMultiplier: 2,
});
```

## 🏗️ Project Structure

```
notification-app/
├── src/
│   ├── app/
│   │   └── api/
│   │       └── notifications/
│   │           └── route.ts          # Main API endpoint
│   ├── lib/
│   │   ├── notificationService.ts    # Email/SMS/WhatsApp logic
│   │   ├── rateLimiter.ts            # Rate limiting
│   │   └── retryHelper.ts            # Retry logic
│   └── types/
│       └── Notification.ts           # TypeScript types
├── examples/
│   ├── registration-form-email.html  # Example template
│   ├── feedback-form-email.html      # Example template
│   └── README.md                     # Template documentation
└── NOTIFICATIONS_README.md           # Detailed API docs
```

## 🚨 Important Notes

- **Gmail Limits**: ~500 emails/day (regular), ~2000/day (Google Workspace)
- **Rate Limiting**: Currently in-memory (resets on server restart)
- **Production**: For high volume, consider Redis-based rate limiting
- **Security**: Keep your API key and credentials secure
- **Twilio**: Requires verified phone numbers in trial mode

## 📦 Dependencies

- **Next.js** - Web framework
- **Nodemailer** - Email sending
- **Twilio** - SMS and WhatsApp
- **TypeScript** - Type safety

## 🤝 Integration Example

```javascript
// From your main application
async function sendWelcomeEmail(userEmail, userName) {
  const response = await fetch('http://localhost:3000/api/notifications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.NOTIFICATION_API_KEY
    },
    body: JSON.stringify({
      recipient: userEmail,
      message: `Welcome ${userName}!`,
      type: 'email',
      subject: 'Welcome to Our Platform',
      html: `<h1>Welcome ${userName}!</h1><p>Thanks for joining us.</p>`
    })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Failed to send notification:', error);
  }
}
```

## 📄 License

This project is licensed under the MIT License.

## 🙋 Support

For detailed API documentation, see [NOTIFICATIONS_README.md](NOTIFICATIONS_README.md)

---

Built with ❤️ using Next.js and TypeScript
