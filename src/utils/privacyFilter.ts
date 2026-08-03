import { ClipboardItemMetadata } from "../types/clipboard";

export interface SensitivityCheckResult {
  isSensitive: boolean;
  sensitiveType: "password" | "otp" | "credit_card" | "api_key" | null;
  maskedContent?: string;
}

export function checkSensitivity(content: string, maskEnabled: boolean = true): SensitivityCheckResult {
  const trimmed = content.trim();

  // 1. Credit Card Check
  const ccRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})\b/;
  const cleanDigits = trimmed.replace(/[\s-]/g, "");
  if (ccRegex.test(cleanDigits) || (cleanDigits.length >= 13 && cleanDigits.length <= 19 && isLuhnValid(cleanDigits))) {
    const last4 = cleanDigits.slice(-4);
    return {
      isSensitive: true,
      sensitiveType: "credit_card",
      maskedContent: maskEnabled ? `•••• •••• •••• ${last4}` : content,
    };
  }

  // 2. OTP Code Check (6-digit numeric string isolated)
  if (/^\b\d{6}\b$/.test(trimmed) || /your (verification|otp|code) is:?\s*\b\d{6}\b/i.test(trimmed)) {
    return {
      isSensitive: true,
      sensitiveType: "otp",
      maskedContent: maskEnabled ? "•••••• (6-Digit Security Code Masked)" : content,
    };
  }

  // 3. API Key / Secret Token Check
  const apiKeyPatterns = [
    /sk_live_[0-9a-zA-Z]{24,}/,
    /sk_test_[0-9a-zA-Z]{24,}/,
    /AIzaSy[0-9a-zA-Z_-]{33}/,
    /ghp_[0-9a-zA-Z]{36}/,
    /xox[a-zA-Z]-[0-9a-zA-Z]{10,}/,
    /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/, // JWT token
  ];

  for (const pattern of apiKeyPatterns) {
    if (pattern.test(trimmed)) {
      return {
        isSensitive: true,
        sensitiveType: "api_key",
        maskedContent: maskEnabled ? "•••••••• (API Key / Token Masked)" : content,
      };
    }
  }

  // 4. High-entropy / Password keyword check
  const lower = trimmed.toLowerCase();
  if (
    lower.includes("password:") ||
    lower.includes("passphrase:") ||
    lower.includes("secret_key:") ||
    (trimmed.length >= 8 && trimmed.length <= 32 && !trimmed.includes(" ") && calculateEntropy(trimmed) > 4.2 && /[A-Z]/.test(trimmed) && /[a-z]/.test(trimmed) && /[0-9]/.test(trimmed) && /[^A-Za-z0-9]/.test(trimmed))
  ) {
    return {
      isSensitive: true,
      sensitiveType: "password",
      maskedContent: maskEnabled ? "•••••••••••• (Password Masked)" : content,
    };
  }

  return {
    isSensitive: false,
    sensitiveType: null,
  };
}

function isLuhnValid(val: string): boolean {
  let sum = 0;
  let shouldDouble = false;
  for (let i = val.length - 1; i >= 0; i--) {
    let digit = parseInt(val.charAt(i), 10);
    if (isNaN(digit)) return false;
    if (shouldDouble) {
      if ((digit *= 2) > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return sum % 10 === 0;
}

function calculateEntropy(str: string): number {
  const len = str.length;
  if (len === 0) return 0;
  const freqs: Record<string, number> = {};
  for (let i = 0; i < len; i++) {
    const char = str[i];
    freqs[char] = (freqs[char] || 0) + 1;
  }
  let entropy = 0;
  for (const char in freqs) {
    const p = freqs[char] / len;
    entropy -= p * Math.log2(p);
  }
  return entropy;
}
