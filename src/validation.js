/**
 * DxH Reagent Validation Code Generator
 *
 * Algorithm: SHA-1("H628" + YYMMDD + LOT + CONTAINER)[-5:]
 *
 * This module contains the core validation logic isolated for testing.
 */

/**
 * Calculate SHA-1 hash of a message using Web Crypto API
 * @param {string} message - Input string to hash
 * @returns {Promise<string>} - Hexadecimal SHA-1 hash
 */
async function sha1(message) {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

/**
 * Convert date from YYYY-MM-DD to YYMMDD format
 * @param {string} dateStr - Date in YYYY-MM-DD format
 * @returns {string|null} - Date in YYMMDD format, or null if invalid
 */
function formatDateToYYMMDD(dateStr) {
  if (!dateStr) return null;

  // Validate YYYY-MM-DD format with regex
  const dateRegex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match = dateStr.match(dateRegex);
  if (!match) return null;

  const [, year, month, day] = match;
  return year.slice(2) + month + day;
}

/**
 * Calculate the validation code for a DxH reagent
 * @param {Object} params - Reagent parameters
 * @param {string} params.expirationDate - Expiration date in YYYY-MM-DD format
 * @param {string} params.lot - Lot number
 * @param {string} params.container - Container number
 * @returns {Promise<string|null>} - 5-character validation code, or null if invalid inputs
 */
async function calculateValidationCode({ expirationDate, lot, container }) {
  if (!expirationDate || !lot || !container) {
    return null;
  }

  const yymmdd = formatDateToYYMMDD(expirationDate);
  if (!yymmdd) return null;

  // Build hash input: H628 + YYMMDD + LOT + CONTAINER
  // Note: Uses "H628" (without the +) per the algorithm specification
  const hashInput = `H628${yymmdd}${lot}${container}`;

  // Calculate SHA-1 and take last 5 characters
  const hash = await sha1(hashInput);
  return hash.slice(-5);
}

/**
 * Generate the full HIBC barcode data string
 * @param {Object} params - Reagent parameters
 * @param {string} params.labelerId - HIBC Labeler ID (e.g., "+H628")
 * @param {string} params.productCode - Product code (e.g., "B3686813")
 * @param {string} params.expirationDate - Expiration date in YYYY-MM-DD format
 * @param {string} params.lot - Lot number
 * @param {string} params.container - Container number
 * @param {string} params.validationCode - Calculated validation code
 * @returns {string|null} - Full barcode data string, or null if invalid inputs
 */
function generateBarcodeData({ labelerId, productCode, expirationDate, lot, container, validationCode }) {
  if (!labelerId || !productCode || !expirationDate || !lot || !container || !validationCode) {
    return null;
  }

  const yymmdd = formatDateToYYMMDD(expirationDate);
  if (!yymmdd) return null;

  // Container is zero-padded to 5 digits in the barcode
  const containerPadded = container.padStart(5, '0');

  // Format: LABELER_ID + PRODUCT_CODE + YYMMDD + LOT + h + CONTAINER(5-digit) + VALIDATION
  return `${labelerId}${productCode}${yymmdd}${lot}h${containerPadded}${validationCode}`;
}

/**
 * Generate complete reagent data including validation code and barcode
 * @param {Object} params - Reagent parameters
 * @param {string} params.labelerId - HIBC Labeler ID (e.g., "+H628")
 * @param {string} params.productCode - Product code (e.g., "B3686813")
 * @param {string} params.expirationDate - Expiration date in YYYY-MM-DD format
 * @param {string} params.lot - Lot number
 * @param {string} params.container - Container number
 * @returns {Promise<Object>} - Object with validationCode and barcodeData
 */
async function generateReagentData({ labelerId, productCode, expirationDate, lot, container }) {
  const validationCode = await calculateValidationCode({ expirationDate, lot, container });

  if (!validationCode) {
    return { validationCode: null, barcodeData: null };
  }

  const barcodeData = generateBarcodeData({
    labelerId,
    productCode,
    expirationDate,
    lot,
    container,
    validationCode
  });

  return { validationCode, barcodeData };
}

// Export for both Node.js (testing) and browser environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sha1,
    formatDateToYYMMDD,
    calculateValidationCode,
    generateBarcodeData,
    generateReagentData
  };
}
