// src/types/Notification.ts
export interface Notification {
  recipient: string;
  message: string;
  type: 'email' | 'sms' | 'whatsapp';
  subject?: string;
  html?: string; // Optional HTML content for emails
}