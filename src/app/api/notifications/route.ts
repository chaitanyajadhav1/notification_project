import { NextRequest, NextResponse } from 'next/server';
import { sendEmail, sendSMS, sendWhatsApp } from '@/lib/notificationService';
import { Notification } from '@/types/Notification';

// Set your API key in environment variables for security
const API_KEY = process.env.API_KEY as string;

export async function POST(request: NextRequest) {
  try {
    // ✅ Check API key from headers
    const apiKey = request.headers.get('x-api-key');
    console.log("this is api key"+apiKey);
    console.log("this is env api key"+API_KEY);
    if (!apiKey || apiKey !== API_KEY) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized: Invalid API key' },
        { status: 401 }
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

    // Send notification based on type
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
        return NextResponse.json(
          { success: false, error: 'Invalid notification type' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Notification sent successfully',
      notification,
    });
  } catch (error: any) {
    console.error('Notification error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
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
