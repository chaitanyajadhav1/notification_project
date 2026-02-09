# HTML Email Templates

This directory contains example HTML email templates that can be used with the notification service.

## Available Templates

### 1. Registration Form Email (`registration-form-email.html`)
A professional registration form with fields for:
- Full Name
- Email Address
- Phone Number
- Organization
- Source (how they heard about you)
- Newsletter subscription checkbox

**Use Case**: User onboarding, account registration, sign-up confirmations

### 2. Feedback Form Email (`feedback-form-email.html`)
A clean feedback collection form with:
- Name
- Email
- Star rating (1-5)
- Feedback text area

**Use Case**: Customer feedback, surveys, service reviews

## How to Use These Templates

### Method 1: Read the HTML file and send it

```javascript
const fs = require('fs');
const htmlContent = fs.readFileSync('./examples/registration-form-email.html', 'utf8');

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
    html: htmlContent
  })
});
```

### Method 2: Inline the HTML in your request

```javascript
await fetch('http://localhost:3000/api/notifications', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-api-key': process.env.API_KEY
  },
  body: JSON.stringify({
    recipient: 'user@example.com',
    message: 'Feedback request',
    type: 'email',
    subject: 'We Value Your Feedback',
    html: '<h1>Your HTML here</h1>'
  })
});
```

### Method 3: Use template strings with dynamic data

```javascript
const userName = 'John Doe';
const registrationLink = 'https://yourapp.com/register?token=abc123';

const htmlContent = `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <h2>Welcome ${userName}!</h2>
    <p>Click the button below to complete your registration:</p>
    <a href="${registrationLink}" style="background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; display: inline-block;">
      Complete Registration
    </a>
  </div>
`;

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
    subject: 'Welcome to Our Platform',
    html: htmlContent
  })
});
```

## Best Practices for HTML Emails

1. **Use inline CSS**: Email clients have limited CSS support, so use inline styles
2. **Use tables for layout**: Table-based layouts work better across email clients
3. **Keep it simple**: Avoid complex CSS, JavaScript, or external resources
4. **Provide plain text fallback**: Always include the `message` field for email clients that don't support HTML
5. **Test across clients**: Different email clients render HTML differently
6. **Mobile responsive**: Use responsive design techniques for mobile devices
7. **Update form actions**: Replace placeholder URLs (like `https://yourapp.com/api/register`) with your actual endpoints

## Customization Tips

- Modify colors to match your brand
- Update the form action URLs to point to your backend
- Add your company logo
- Customize field labels and placeholders
- Add or remove form fields as needed
