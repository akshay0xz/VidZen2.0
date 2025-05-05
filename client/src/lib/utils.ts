import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // Ensure it's a string and remove non-numeric characters
  const cleaned = phoneNumber.toString().replace(/\D/g, '');
  
  // Format as XXX-XXX-XXXX for 10-digit numbers
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  
  return cleaned;
}

export function generateOTP(): string {
  // Generate a random 6-digit OTP
  return Math.floor(100000 + Math.random() * 900000).toString();
}
