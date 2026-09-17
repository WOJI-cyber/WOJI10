// Korean Public Sector PII (Personally Identifiable Information) Detector & Masker

// Resident Registration Number pattern: 6 digits - 7 digits (with standard check or general pattern)
const RRN_REGEX = /\b(\d{6})[-–—\s]?([1-8]\d{6})\b/g;

// Korean Phone Number pattern: 010-XXXX-XXXX, 02-XXX-XXXX, 031-XXXX-XXXX etc.
const PHONE_REGEX = /\b(01[016789]|02|0[3-6][1-5]|070)[-–—\s]?(\d{3,4})[-–—\s]?(\d{4})\b/g;

// Email pattern
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

export interface PiiDetectionResult {
  hasPii: boolean;
  residentNumbers: string[];
  phoneNumbers: string[];
  emails: string[];
  totalCount: number;
}

export function detectPii(text: string): PiiDetectionResult {
  if (!text) {
    return {
      hasPii: false,
      residentNumbers: [],
      phoneNumbers: [],
      emails: [],
      totalCount: 0,
    };
  }

  const rrnMatches = text.match(RRN_REGEX) || [];
  const phoneMatches = text.match(PHONE_REGEX) || [];
  const emailMatches = text.match(EMAIL_REGEX) || [];

  const uniqueRrns = Array.from(new Set(rrnMatches));
  const uniquePhones = Array.from(new Set(phoneMatches));
  const uniqueEmails = Array.from(new Set(emailMatches));

  const totalCount = uniqueRrns.length + uniquePhones.length + uniqueEmails.length;

  return {
    hasPii: totalCount > 0,
    residentNumbers: uniqueRrns,
    phoneNumbers: uniquePhones,
    emails: uniqueEmails,
    totalCount,
  };
}

export function maskPii(text: string): string {
  if (!text) return "";

  let masked = text;

  // Mask Resident numbers: 900101-1234567 -> 900101-*******
  masked = masked.replace(RRN_REGEX, (_match, p1) => {
    return `${p1}-******* [주민번호 마스킹]`;
  });

  // Mask Phone numbers: 010-1234-5678 -> 010-****-5678
  masked = masked.replace(PHONE_REGEX, (_match, p1, _p2, p3) => {
    return `${p1}-****-${p3}`;
  });

  return masked;
}
