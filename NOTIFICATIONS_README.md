# Notifications API — Usage Guide

This document explains how to call the Notifications API implemented in this project.

## Endpoint
- URL: `/api/notifications`
- Method: `POST`

## Authentication
- Provide an API key in the `x-api-key` header.
- Configure the server environment variable `API_KEY` with the expected key.

## Request Body (JSON)
The request JSON must follow the `Notification` interface:

```json
{
  "recipient": "<recipient-address-or-phone>",
  "message": "<text message body>",
  "type": "email|sms|whatsapp",
  "subject": "<optional email subject>",
  "html": "<optional HTML content for emails>"
}
```

- `recipient` (string): Email for `email`, phone number for `sms`/`whatsapp` (E.164 recommended).
- `message` (string): The message content (used as plain text fallback for emails).
- `type` (string): `email`, `sms`, or `whatsapp`.
- `subject` (string, optional): Email subject when `type` is `email`.
- `html` (string, optional): HTML content for emails. When provided, the email will be sent as HTML with `message` as plain text fallback.

See the type definition at [src/types/Notification.ts](src/types/Notification.ts).

## Required Environment Variables
- `API_KEY`
- `EMAIL_USER`, `EMAIL_PASS` — for email via nodemailer
- `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`, `TWILIO_WHATSAPP` — for Twilio SMS/WhatsApp

The sending logic is implemented in [src/lib/notificationService.ts](src/lib/notificationService.ts) and the API route lives in [src/app/api/notifications/route.ts](src/app/api/notifications/route.ts).

## Concurrent Request Handling

The API is optimized for handling multiple simultaneous requests:

### Connection Pooling
- **Email**: Uses connection pooling with up to 5 concurrent SMTP connections
- **Reuses connections**: Up to 100 messages per connection before reconnecting
- **Built-in rate limiting**: Maximum 5 emails per second to respect Gmail limits

### Rate Limiting
- **50 requests per minute** per IP address
- Returns `429 Too Many Requests` when limit exceeded
- Response includes `Retry-After` header indicating when to retry
- Automatic cleanup of old rate limit records

### Retry Logic
- **Automatic retries**: Up to 3 attempts for failed requests
- **Exponential backoff**: 1s → 2s → 4s delays between retries
- **Smart retry**: Skips retry for authentication/validation errors
- **Transient failure handling**: Retries network errors, timeouts, etc.

## Responses
- `200 OK` — `{ "success": true, "message": "Notification sent successfully", "notification": <echoed payload> }`
- `401 Unauthorized` — Invalid or missing `x-api-key`.
- `400 Bad Request` — Missing required fields or invalid `type`.
- `429 Too Many Requests` — Rate limit exceeded. Includes `retryAfter` in seconds and `Retry-After` header.
- `500 Internal Server Error` — Provider or configuration errors.

## Examples

curl (plain text email):

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"recipient":"user@example.com","message":"Hello from API","type":"email","subject":"Hello"}'
```

curl (HTML email):

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "recipient": "user@example.com",
    "message": "This is the plain text version",
    "type": "email",
    "subject": "HTML Email Example",
    "html": "<h1>Hello!</h1><p>This is an <strong>HTML</strong> email.</p>"
  }'
```

curl (HTML form email):

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "recipient": "user@example.com",
    "message": "Please fill out the feedback form",
    "type": "email",
    "subject": "Feedback Request",
    "html": "<div style=\"font-family: Arial, sans-serif;\"><h2>Feedback Form</h2><p>Please provide your feedback:</p><form action=\"https://yourapp.com/feedback\" method=\"POST\"><label>Name:</label><br><input type=\"text\" name=\"name\" style=\"margin: 10px 0; padding: 8px; width: 300px;\"><br><label>Email:</label><br><input type=\"email\" name=\"email\" style=\"margin: 10px 0; padding: 8px; width: 300px;\"><br><label>Feedback:</label><br><textarea name=\"feedback\" rows=\"4\" style=\"margin: 10px 0; padding: 8px; width: 300px;\"></textarea><br><button type=\"submit\" style=\"background: #007bff; color: white; padding: 10px 20px; border: none; cursor: pointer;\">Submit</button></form></div>"
  }'
```

curl (sms):

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"recipient":"+1234567890","message":"Test SMS","type":"sms"}'
```

fetch (plain text email):

```js
await fetch('/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.API_KEY || '<your-key>'
  },
  body: JSON.stringify({
    recipient: 'user@example.com',
    message: 'Hello from API',
    type: 'email',
    subject: 'Hello'
  })
});
```

fetch (HTML email with form):

```js
await fetch('/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.API_KEY || '<your-key>'
  },
  body: JSON.stringify({
    recipient: 'user@example.com',
    message: 'Please complete the registration form',
    type: 'email',
    subject: 'Complete Your Registration',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Welcome!</h2>
        <p>Please complete your registration:</p>
        <form action="https://yourapp.com/register" method="POST" style="background: #f5f5f5; padding: 20px; border-radius: 8px;">
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Full Name:</label>
            <input type="text" name="name" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <div style="margin-bottom: 15px;">
            <label style="display: block; margin-bottom: 5px; font-weight: bold;">Email:</label>
            <input type="email" name="email" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px;">
          </div>
          <button type="submit" style="background: #007bff; color: white; padding: 12px 30px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            Complete Registration
          </button>
        </form>
      </div>
    `
  })
});
```

## Notes
- Ensure the appropriate environment variables are configured before calling the API.
- The API performs minimal validation; consider adding stricter checks and rate-limiting for production.
- Inspect server logs for delivery details (the service logs provider responses).
