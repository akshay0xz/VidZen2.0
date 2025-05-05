import { generateOTP } from "@/lib/utils";
import { sendSms } from "./sendgrid-service";

// In-memory OTP storage for simplicity
// In a production environment, this should be stored in a database with expiration
interface OTPRecord {
  otp: string;
  expiresAt: number;
}

class OTPService {
  private otpStore: Map<string, OTPRecord> = new Map();
  private latestOtp: string | null = null;
  private latestMobile: string | null = null;
  
  // Helper method to generate a unique OTP for a mobile number
  private generateUniqueOTP(mobile: string): string {
    const otp = generateOTP();
    
    // Store the OTP with expiration (5 minutes)
    this.otpStore.set(mobile, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000
    });
    
    // Store the latest OTP for development access
    this.latestOtp = otp;
    this.latestMobile = mobile;
    
    return otp;
  }
  
  // Method to send OTP to a mobile number
  async sendOTP(mobile: string): Promise<void> {
    const otp = this.generateUniqueOTP(mobile);
    
    // In a real application, we would send the OTP via SMS
    // Here we're simulating it by logging to console
    console.log(`[OTP Service] Sent OTP ${otp} to mobile ${mobile}`);
    
    // Also try to send via SMS service if available, but don't fail if it doesn't work
    try {
      const message = `Your verification code is: ${otp}. It will expire in 5 minutes.`;
      await sendSms(mobile, message);
    } catch (error) {
      console.error('[OTP Service] Failed to send OTP via SMS:', error);
      // Don't throw - we want the flow to continue even if SMS fails
    }
  }
  
  // Method to verify the OTP for a mobile number
  async verifyOTP(mobile: string, otpToVerify: string): Promise<boolean> {
    const record = this.otpStore.get(mobile);
    
    // If no OTP record exists or it has expired
    if (!record || record.expiresAt < Date.now()) {
      return false;
    }
    
    // Check if OTP matches
    const isValid = record.otp === otpToVerify;
    
    // If valid, remove the OTP record (one-time use)
    if (isValid) {
      this.otpStore.delete(mobile);
    }
    
    return isValid;
  }
  
  // Get the latest OTP for development/testing
  getLatestOtpForDevelopment(): string | null {
    return this.latestOtp;
  }
}

export const otpService = new OTPService();
