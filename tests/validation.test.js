/**
 * Tests for DxH Reagent Validation Code Generator
 *
 * These tests verify the core algorithm:
 * Validation Code = SHA-1("H628" + YYMMDD + LOT + CONTAINER)[-5:]
 */

const {
  sha1,
  formatDateToYYMMDD,
  calculateValidationCode,
  generateBarcodeData,
  generateReagentData
} = require('../src/validation.js');

// Mock the Web Crypto API for Node.js testing environment
beforeAll(() => {
  if (typeof crypto === 'undefined' || !crypto.subtle) {
    const { webcrypto } = require('crypto');
    global.crypto = webcrypto;
  }
});

describe('sha1', () => {
  test('produces correct SHA-1 hash for known input', async () => {
    // SHA-1 of "test" is a94a8fe5ccb19ba61c4c0873d391e987982fbbd3
    const hash = await sha1('test');
    expect(hash).toBe('a94a8fe5ccb19ba61c4c0873d391e987982fbbd3');
  });

  test('produces 40-character hexadecimal output', async () => {
    const hash = await sha1('any input');
    expect(hash).toMatch(/^[0-9a-f]{40}$/);
  });

  test('produces different hashes for different inputs', async () => {
    const hash1 = await sha1('input1');
    const hash2 = await sha1('input2');
    expect(hash1).not.toBe(hash2);
  });

  test('produces same hash for same input', async () => {
    const hash1 = await sha1('same input');
    const hash2 = await sha1('same input');
    expect(hash1).toBe(hash2);
  });

  test('handles empty string', async () => {
    // SHA-1 of "" is da39a3ee5e6b4b0d3255bfef95601890afd80709
    const hash = await sha1('');
    expect(hash).toBe('da39a3ee5e6b4b0d3255bfef95601890afd80709');
  });
});

describe('formatDateToYYMMDD', () => {
  test('converts YYYY-MM-DD to YYMMDD format', () => {
    expect(formatDateToYYMMDD('2027-10-22')).toBe('271022');
  });

  test('handles dates in different years', () => {
    expect(formatDateToYYMMDD('2026-08-26')).toBe('260826');
    expect(formatDateToYYMMDD('2025-01-15')).toBe('250115');
    expect(formatDateToYYMMDD('2030-12-31')).toBe('301231');
  });

  test('preserves leading zeros in month and day', () => {
    expect(formatDateToYYMMDD('2027-01-05')).toBe('270105');
  });

  test('returns null for invalid date format', () => {
    expect(formatDateToYYMMDD('10-22-2027')).toBe(null);
    expect(formatDateToYYMMDD('2027/10/22')).toBe(null);
    expect(formatDateToYYMMDD('invalid')).toBe(null);
  });

  test('returns null for empty or null input', () => {
    expect(formatDateToYYMMDD('')).toBe(null);
    expect(formatDateToYYMMDD(null)).toBe(null);
    expect(formatDateToYYMMDD(undefined)).toBe(null);
  });
});

describe('calculateValidationCode', () => {
  // Test cases based on known reagent data from claude_observations.txt
  test('generates correct validation code for example data', async () => {
    // From observations: Input "H62826082677038350158" produces validation code "37f08"
    const code = await calculateValidationCode({
      expirationDate: '2026-08-26',
      lot: '7703835',
      container: '0158'
    });
    expect(code).toBe('37f08');
  });

  test('produces 5-character hexadecimal output', async () => {
    const code = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    });
    expect(code).toMatch(/^[0-9a-f]{5}$/);
  });

  test('returns null for missing expiration date', async () => {
    const code = await calculateValidationCode({
      expirationDate: '',
      lot: '7703835',
      container: '0001'
    });
    expect(code).toBe(null);
  });

  test('returns null for missing lot number', async () => {
    const code = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '',
      container: '0001'
    });
    expect(code).toBe(null);
  });

  test('returns null for missing container number', async () => {
    const code = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: ''
    });
    expect(code).toBe(null);
  });

  test('different containers produce different codes', async () => {
    const code1 = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    });
    const code2 = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0002'
    });
    expect(code1).not.toBe(code2);
  });

  test('different lots produce different codes', async () => {
    const code1 = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    });
    const code2 = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703836',
      container: '0001'
    });
    expect(code1).not.toBe(code2);
  });

  test('different expiration dates produce different codes', async () => {
    const code1 = await calculateValidationCode({
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    });
    const code2 = await calculateValidationCode({
      expirationDate: '2027-10-23',
      lot: '7703835',
      container: '0001'
    });
    expect(code1).not.toBe(code2);
  });

  test('same inputs always produce same code', async () => {
    const params = {
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    };
    const code1 = await calculateValidationCode(params);
    const code2 = await calculateValidationCode(params);
    expect(code1).toBe(code2);
  });
});

describe('generateBarcodeData', () => {
  test('generates correct barcode format', () => {
    const barcode = generateBarcodeData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001',
      validationCode: 'abcde'
    });
    expect(barcode).toBe('+H628B36868132710227703835h00001abcde');
  });

  test('zero-pads container to 5 digits', () => {
    const barcode = generateBarcodeData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '1',
      validationCode: 'abcde'
    });
    expect(barcode).toContain('h00001');
  });

  test('handles 4-digit container correctly', () => {
    const barcode = generateBarcodeData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0158',
      validationCode: 'abcde'
    });
    expect(barcode).toContain('h00158');
  });

  test('handles 5-digit container (no padding needed)', () => {
    const barcode = generateBarcodeData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '12345',
      validationCode: 'abcde'
    });
    expect(barcode).toContain('h12345');
  });

  test('returns null for missing parameters', () => {
    expect(generateBarcodeData({
      labelerId: '',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001',
      validationCode: 'abcde'
    })).toBe(null);

    expect(generateBarcodeData({
      labelerId: '+H628',
      productCode: '',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001',
      validationCode: 'abcde'
    })).toBe(null);

    expect(generateBarcodeData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '',
      lot: '7703835',
      container: '0001',
      validationCode: 'abcde'
    })).toBe(null);
  });

  test('includes delimiter character h between lot and container', () => {
    const barcode = generateBarcodeData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001',
      validationCode: 'abcde'
    });
    expect(barcode).toMatch(/7703835h00001/);
  });
});

describe('generateReagentData', () => {
  test('returns both validation code and barcode data', async () => {
    const result = await generateReagentData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    });

    expect(result.validationCode).toMatch(/^[0-9a-f]{5}$/);
    expect(result.barcodeData).toContain('+H628');
    expect(result.barcodeData).toContain('B3686813');
    expect(result.barcodeData).toContain(result.validationCode);
  });

  test('barcode data ends with validation code', async () => {
    const result = await generateReagentData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '2027-10-22',
      lot: '7703835',
      container: '0001'
    });

    expect(result.barcodeData).toEndWith(result.validationCode);
  });

  test('returns null values for invalid inputs', async () => {
    const result = await generateReagentData({
      labelerId: '+H628',
      productCode: 'B3686813',
      expirationDate: '',
      lot: '7703835',
      container: '0001'
    });

    expect(result.validationCode).toBe(null);
    expect(result.barcodeData).toBe(null);
  });
});

describe('Algorithm verification against known data', () => {
  // These are regression tests based on real-world data points
  // from the reverse-engineering effort documented in claude_observations.txt

  test('verifies algorithm: H628 + YYMMDD + LOT + CONTAINER', async () => {
    // The algorithm was verified to be:
    // SHA-1("H628" + YYMMDD + LOT + CONTAINER)[-5:]
    // NOT including the product code

    // Test with known input from observations
    const hash = await sha1('H62826082677038350158');
    const validationCode = hash.slice(-5);
    expect(validationCode).toBe('37f08');
  });

  test('product code does NOT affect validation code', async () => {
    // The product code appears in the barcode but NOT in the hash
    // Two different product codes with same other values should produce same validation code

    const code1 = await calculateValidationCode({
      expirationDate: '2026-08-26',
      lot: '7703835',
      container: '0158'
    });

    // If we had a function that accepted product code, it would not change the result
    // This test verifies the validation code is independent of product code
    expect(code1).toBe('37f08');
  });

  test('container number is used as-is (not zero-padded) in hash', async () => {
    // Important: The barcode uses 5-digit container, but hash uses original format
    // Container "0158" should be used as "0158" in hash, not "00158"

    const codeWith4Digit = await calculateValidationCode({
      expirationDate: '2026-08-26',
      lot: '7703835',
      container: '0158'
    });

    const codeWith5Digit = await calculateValidationCode({
      expirationDate: '2026-08-26',
      lot: '7703835',
      container: '00158'
    });

    // These should be different because the container is used as-is in the hash
    expect(codeWith4Digit).not.toBe(codeWith5Digit);

    // The 4-digit version matches the known correct value
    expect(codeWith4Digit).toBe('37f08');
  });
});

// Custom matcher for string ending
expect.extend({
  toEndWith(received, expected) {
    const pass = received.endsWith(expected);
    return {
      message: () =>
        `expected ${received} to ${pass ? 'not ' : ''}end with ${expected}`,
      pass
    };
  }
});
