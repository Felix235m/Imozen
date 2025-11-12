import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats phone number with country code in the format "(+countrycode) phonenumber"
 * @param countryCode - Country code with or without + prefix (e.g., "+351" or "351")
 * @param phoneNumber - Phone number without country code
 * @returns Formatted phone number string (e.g., "(+351) 8072624362")
 */
export function formatPhoneNumber(countryCode: string, phoneNumber: string): string {
  // Clean up the country code - ensure it starts with +
  let cleanCountryCode = countryCode.trim();
  if (!cleanCountryCode.startsWith('+')) {
    cleanCountryCode = `+${cleanCountryCode}`;
  }
  
  // Clean up the phone number - remove any special characters except digits
  const cleanPhoneNumber = phoneNumber.trim();
  
  // Return in the required format "(+countrycode) phonenumber"
  return `(${cleanCountryCode}) ${cleanPhoneNumber}`;
}
