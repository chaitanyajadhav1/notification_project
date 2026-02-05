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
  "subject": "<optional email subject>"
}
```

- `recipient` (string): Email for `email`, phone number for `sms`/`whatsapp` (E.164 recommended).
- `message` (string): The message content.
- `type` (string): `email`, `sms`, or `whatsapp`.
- `subject` (string, optional): Email subject when `type` is `email`.

See the type definition at [src/types/Notification.ts](src/types/Notification.ts).

## Required Environment Variables
- `API_KEY`
- `EMAIL_USER`, `EMAIL_PASS` — for email via nodemailer
- `TWILIO_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE`, `TWILIO_WHATSAPP` — for Twilio SMS/WhatsApp

The sending logic is implemented in [src/lib/notificationService.ts](src/lib/notificationService.ts) and the API route lives in [src/app/api/notifications/route.ts](src/app/api/notifications/route.ts).

## Responses
- `200 OK` — `{ "success": true, "message": "Notification sent successfully", "notification": <echoed payload> }`
- `401 Unauthorized` — Invalid or missing `x-api-key`.
- `400 Bad Request` — Missing required fields or invalid `type`.
- `500 Internal Server Error` — Provider or configuration errors.

## Examples

curl (email):

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"recipient":"user@example.com","message":"Hello from API","type":"email","subject":"Hello"}'
```

curl (sms):

```bash
curl -X POST "http://localhost:3000/api/notifications" \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{"recipient":"+1234567890","message":"Test SMS","type":"sms"}'
```

fetch (browser/node):

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

## Notes
- Ensure the appropriate environment variables are configured before calling the API.
- The API performs minimal validation; consider adding stricter checks and rate-limiting for production.
- Inspect server logs for delivery details (the service logs provider responses).
