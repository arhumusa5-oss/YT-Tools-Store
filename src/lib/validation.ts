/**
 * Validation utilities for strict user input validation
 */

export function validateEmail(email: string): { valid: boolean; error?: string } {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) {
    return { valid: false, error: 'Email address is required.' };
  }

  // Check common typos like .con, .cmo, .vom, .comm
  const typoMatches = [
    { typo: /@gmail\.con$/i, suggestion: 'name@gmail.com' },
    { typo: /@yahoo\.con$/i, suggestion: 'name@yahoo.com' },
    { typo: /@hotmail\.con$/i, suggestion: 'name@hotmail.com' },
    { typo: /@outlook\.con$/i, suggestion: 'name@outlook.com' },
    { typo: /\.con$/i, suggestion: '.com' },
    { typo: /\.cmo$/i, suggestion: '.com' },
    { typo: /\.vom$/i, suggestion: '.com' },
    { typo: /\.comm$/i, suggestion: '.com' },
    { typo: /\.coom$/i, suggestion: '.com' },
    { typo: /\.og$/i, suggestion: '.org' },
    { typo: /\.ne$/i, suggestion: '.net' },
  ];

  for (const t of typoMatches) {
    if (t.typo.test(trimmed)) {
      return {
        valid: false,
        error: `Invalid email address. Did you mean "${t.suggestion}"?`,
      };
    }
  }

  // Standard RFC 5322 regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Please enter a valid email address (e.g. name@gmail.com).' };
  }

  const parts = trimmed.split('@');
  if (parts.length !== 2) {
    return { valid: false, error: 'Invalid email format.' };
  }

  const domain = parts[1];
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  const invalidTLDs = ['con', 'cmo', 'vom', 'comm', 'gmai', 'yaho', 'hotm'];
  if (invalidTLDs.includes(tld)) {
    return { valid: false, error: `".${tld}" is an invalid domain extension. Did you mean ".com"?` };
  }

  if (tld.length < 2) {
    return { valid: false, error: 'Email domain extension must be at least 2 characters (e.g. .com, .pk).' };
  }

  return { valid: true };
}

export function validateWhatsAppNumber(phone: string): { valid: boolean; error?: string; cleanPhone?: string } {
  const trimmed = phone.trim();
  if (!trimmed) {
    return { valid: false, error: 'Mobile / WhatsApp number is required.' };
  }

  // Check if it contains letters / alphabets
  if (/[a-zA-Z]/.test(trimmed)) {
    return { valid: false, error: 'Mobile number can ONLY contain numbers (0-9). Alphabets are not allowed.' };
  }

  // Check for invalid special characters
  if (/[^0-9+\s\-()]/.test(trimmed)) {
    return { valid: false, error: 'Mobile number contains invalid characters. Only digits (0-9) and + are allowed.' };
  }

  // Clean to digits only
  const digitsOnly = trimmed.replace(/[^0-9]/g, '');

  if (digitsOnly.length < 10) {
    return { valid: false, error: 'Mobile number is too short. Please enter a full 11-digit mobile number (e.g. 03001234567).' };
  }

  if (digitsOnly.length > 15) {
    return { valid: false, error: 'Mobile number is too long. Please enter a valid phone number.' };
  }

  // If Pakistani local format starting with 03
  if (digitsOnly.startsWith('03') && digitsOnly.length !== 11) {
    return {
      valid: false,
      error: `Pakistani mobile number must be exactly 11 digits (e.g. 03001234567). You entered ${digitsOnly.length} digits.`,
    };
  }

  // If Pakistani international format starting with 923
  if (digitsOnly.startsWith('923') && digitsOnly.length !== 12) {
    return {
      valid: false,
      error: `International Pakistani mobile number must be 12 digits (e.g. 923001234567 or +923001234567). You entered ${digitsOnly.length} digits.`,
    };
  }

  return { valid: true, cleanPhone: digitsOnly };
}
