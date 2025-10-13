/**
 * Validates an email address format
 * @param email - The email string to validate
 * @returns true if email is valid, false otherwise
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates a Cameroon phone number format
 * Format: +237 6XX XX XX XX (9 digits starting with 6)
 * @param phone - The phone string to validate (can include spaces)
 * @returns true if phone is valid, false otherwise
 */
export function validateCameroonPhone(phone: string): boolean {
  const cleanPhone = phone.replace(/\s/g, '');
  return cleanPhone.length === 9 && cleanPhone.startsWith('6');
}
