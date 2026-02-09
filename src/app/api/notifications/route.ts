import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendSMS, sendWhatsApp } from '@/lib/notificationService';
import { Notification } from '@/types/Notification';
import { checkRateLimit } from '@/lib/rateLimiter';
import { retryWithBackoff } from '@/lib/retryHelper';

// Set your API key in environment variables for security
const API_KEY = process.env.API_KEY as string;

// Rate limit configuration: 50 requests per minute per IP
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 50,
};

export async function POST(request: NextRequest) {
  try {
    // ✅ Check API key from headers
    const apiKey = request.headers.get('x-api-key');

    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid API key' },
        { status: 401 }
      );
    }

    // ✅ Rate limiting by IP address
    const ip = request.headers.get('x-forwarded-for') ||
      request.headers.get('x-real-ip') ||
      'unknown';

    const rateLimitResult = checkRateLimit(ip, RATE_LIMIT_CONFIG);

    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        {
          success: false,
          error: 'Too many requests. Please try again later.',
          retryAfter: rateLimitResult.retryAfter
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(rateLimitResult.retryAfter || 60),
            'X-RateLimit-Limit': String(RATE_LIMIT_CONFIG.maxRequests),
            'X-RateLimit-Reset': String(Date.now() + (rateLimitResult.retryAfter || 60) * 1000),
          }
        }
      );
    }

    const notification: Notification = await request.json();
    console.log('Received notification:', notification);

    // Validate required fields
    if (!notification.recipient || !notification.message || !notification.type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: recipient, message, or type' },
        { status: 400 }
      );
    }

    // ✅ Send notification with retry logic
    await retryWithBackoff(async () => {
      switch (notification.type) {
        case 'email':
          await sendEmail(notification);
          break;
        case 'sms':
          await sendSMS(notification);
          break;
        case 'whatsapp':
          await sendWhatsApp(notification);
          break;
        default:
          throw new Error('Invalid notification type');
      }
    }, {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
    });

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error: any) {
    console.error('Notification error:', error);

    // Return appropriate error status
    const status = error.message?.includes('Invalid notification type') ? 400 : 500;

    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status }
    );
  }
}

// Other methods remain unchanged
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { success: false, error: 'Method not allowed' },
    { status: 405 }
  );
}
