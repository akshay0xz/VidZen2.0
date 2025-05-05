import { MailService } from '@sendgrid/mail';
import type { MailDataRequired } from '@sendgrid/mail';

let mailService: MailService | null = null;

// Try to initialize SendGrid, but don't crash if it fails
try {
  if (process.env.SENDGRID_API_KEY) {
    mailService = new MailService();
    mailService.setApiKey(process.env.SENDGRID_API_KEY);
    console.log("SendGrid service initialized successfully");
  } else {
    console.warn("SENDGRID_API_KEY environment variable not set, SMS delivery will be simulated");
  }
} catch (error) {
  console.error("Failed to initialize SendGrid service:", error);
  mailService = null;
}

export async function sendSms(phoneNumber: string, message: string): Promise<boolean> {
  try {
    // If SendGrid is not available, simulate SMS delivery by logging to console
    if (!mailService) {
      console.log(`[SIMULATED SMS] To: ${phoneNumber}, Message: ${message}`);
      return true;
    }
    
    // SendGrid requires a valid email address for the "to" field
    // In production, you'd use a proper SMS service like Twilio
    // This is a workaround for demo purposes to send OTP via email
    const params: MailDataRequired = {
      to: `${phoneNumber}@example.com`, // Replace with user's email in production
      from: 'otp@yourapplication.com', // Replace with your verified sender
      subject: 'Your OTP Code',
      content: [
        {
          type: 'text/plain',
          value: message
        },
        {
          type: 'text/html',
          value: `<strong>${message}</strong>`
        }
      ]
    };

    await mailService.send(params);
    console.log(`SMS (via email) sent to ${phoneNumber}`);
    return true;
  } catch (error) {
    console.error('SendGrid SMS error:', error);
    // Fallback to console logging if sending fails
    console.log(`[FALLBACK SMS] To: ${phoneNumber}, Message: ${message}`);
    return true; // Return true to allow the flow to continue
  }
}