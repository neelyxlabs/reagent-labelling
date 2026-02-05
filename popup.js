/**
 * DxH Reagent Generator - Chrome Extension Popup
 */

// DOM Elements
const elements = {
  labelerId: document.getElementById('labelerId'),
  reagentType: document.getElementById('reagentType'),
  productCode: document.getElementById('productCode'),
  manufactureDate: document.getElementById('manufactureDate'),
  expirationDate: document.getElementById('expirationDate'),
  lot: document.getElementById('lot'),
  container: document.getElementById('container'),
  barcodeData: document.getElementById('barcodeData'),
  udiData: document.getElementById('udiData'),
  udiGtin: document.getElementById('udiGtin'),
  udiMfgDate: document.getElementById('udiMfgDate'),
  udiExpDate: document.getElementById('udiExpDate'),
  udiLot: document.getElementById('udiLot'),
  fdaMfgDate: document.getElementById('fdaMfgDate'),
  fdaExpDate: document.getElementById('fdaExpDate'),
  fdaLot: document.getElementById('fdaLot'),
  copyBtn: document.getElementById('copyBtn'),
  copyUdiBtn: document.getElementById('copyUdiBtn'),
  barcodeCanvas: document.getElementById('barcodeCanvas'),
  udiBarcodeCanvas: document.getElementById('udiBarcodeCanvas'),
  error: document.getElementById('error'),
  udiError: document.getElementById('udiError'),
  manualLot: document.getElementById('manualLot'),
  manualExpiration: document.getElementById('manualExpiration'),
  manualContainer: document.getElementById('manualContainer'),
  manualValidation: document.getElementById('manualValidation'),
  lotHint: document.getElementById('lotHint')
};

// State
let currentBarcodeData = '';

// Known product codes mapping
const PRODUCT_CODES = {
  'B3686813': 'Cleaner',
  'B3684613': 'Lyse',
  'B3684513': 'Diluent'
};

// GS1 GTIN mapping by product code
const PRODUCT_GTINS = {
  'B3686813': '15099590671877',  // Cleaner
  'B3684613': '15099590671860',  // Lyse
  'B3684513': '15099590671853'   // Diluent
};

// Lot number prefixes by product code
const LOT_PREFIXES = {
  'B3686813': 'CLN',  // Cleaner
  'B3684613': 'LYS',  // Lyse
  'B3684513': 'DIL'   // Diluent
};

// Lot number prefixes by product code
const LOT_PREFIXES = {
  'B3686813': 'CLN',  // Cleaner
  'B3684613': 'LYS',  // Lyse
  'B3684513': 'DIL'   // Diluent
};

/**
 * Generate UDI string in GS1 format
 * Format: (01)GTIN(11)ManufactureYYMMDD(17)ExpirationYYMMDD(10)Lot
 * Returns object with full UDI string and breakdown components
 */
function generateUDI(productCode, manufactureDate, expirationDate, lot) {
  if (!productCode || !manufactureDate || !expirationDate || !lot) return null;

  const gtin = PRODUCT_GTINS[productCode];
  if (!gtin) return null;  // Unknown product code, can't generate UDI

  const mfgYYMMDD = formatDateToYYMMDD(manufactureDate);
  const expYYMMDD = formatDateToYYMMDD(expirationDate);

  if (!mfgYYMMDD || !expYYMMDD) return null;

  return {
    full: `01${gtin}11${mfgYYMMDD}17${expYYMMDD}10${lot}`,
    gtin: gtin,
    mfgDate: mfgYYMMDD,
    expDate: expYYMMDD,
    lot: lot
  };
}

/**
 * Format date to YYMMDD (duplicated from validation.js for UDI generation)
 */
function formatDateToYYMMDD(dateStr) {
  if (!dateStr) return null;
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, year, month, day] = match;
  return year.slice(2) + month + day;
}

/**
 * Show error message
 */
function showError(message) {
  elements.error.textContent = message;
  elements.error.style.display = 'block';
}

/**
 * Hide error message
 */
function hideError() {
  elements.error.style.display = 'none';
}

/**
 * Update the UI with generated values
 */
async function updateValidation() {
  hideError();

  const params = {
    labelerId: elements.labelerId.value.trim(),
    productCode: elements.productCode.value.trim(),
    manufactureDate: elements.manufactureDate.value,
    expirationDate: elements.expirationDate.value,
    lot: elements.lot.value.trim(),
    container: elements.container.value.trim()
  };

  // Validate lot number (must be 7 characters)
  const lotValid = params.lot.length === 7;
  if (params.lot && !lotValid) {
    elements.lotHint.textContent = `Must be 7 characters (currently ${params.lot.length})`;
    elements.lotHint.classList.add('error-hint');
  } else {
    elements.lotHint.textContent = 'Must be 7 characters';
    elements.lotHint.classList.remove('error-hint');
  }

  // Generate UDI (requires product code, manufacture date, expiration date, and lot)
  const udi = generateUDI(params.productCode, params.manufactureDate, params.expirationDate, params.lot);
  if (udi && lotValid) {
    elements.udiData.textContent = udi.full;
    elements.udiGtin.textContent = udi.gtin;
    elements.udiMfgDate.textContent = udi.mfgDate;
    elements.udiExpDate.textContent = udi.expDate;
    elements.udiLot.textContent = udi.lot;
    elements.fdaMfgDate.textContent = params.manufactureDate || '—';
    elements.fdaExpDate.textContent = params.expirationDate || '—';
    elements.fdaLot.textContent = params.lot || '—';
    elements.copyUdiBtn.disabled = false;
    renderUdiBarcode(udi.full);
  } else {
    elements.udiData.textContent = '—';
    elements.udiGtin.textContent = '—';
    elements.udiMfgDate.textContent = '—';
    elements.udiExpDate.textContent = '—';
    elements.udiLot.textContent = '—';
    elements.fdaMfgDate.textContent = '—';
    elements.fdaExpDate.textContent = '—';
    elements.fdaLot.textContent = '—';
    elements.copyUdiBtn.disabled = true;
  }

  // Validate inputs for barcode generation
  if (!params.expirationDate || !params.lot || !params.container || !lotValid) {
    elements.barcodeData.textContent = '—';
    elements.copyBtn.disabled = true;
    updateManualEntry(params, '');
    return;
  }

  try {
    const { validationCode, barcodeData } = await generateReagentData(params);

    if (validationCode && barcodeData) {
      elements.barcodeData.textContent = barcodeData;
      elements.copyBtn.disabled = false;
      currentBarcodeData = barcodeData;

      updateManualEntry(params, validationCode);
      renderBarcode(barcodeData);
    } else {
      elements.barcodeData.textContent = '—';
      elements.copyBtn.disabled = true;
    }
  } catch (err) {
    showError('Error calculating validation code: ' + err.message);
  }
}

/**
 * Update manual entry section
 */
function updateManualEntry(params, validationCode) {
  elements.manualLot.textContent = params.lot || '—';
  elements.manualExpiration.textContent = params.expirationDate || '—';
  elements.manualContainer.textContent = params.container || '—';
  elements.manualValidation.textContent = validationCode || '—';
}

/**
 * Render Data Matrix barcode to canvas
 */
function renderBarcode(data) {
  if (!data || typeof bwipjs === 'undefined') {
    return;
  }

  try {
    bwipjs.toCanvas(elements.barcodeCanvas, {
      bcid: 'datamatrix',
      text: data,
      scale: 3,
      padding: 2,
      backgroundcolor: 'ffffff'
    });
    hideError();
  } catch (err) {
    showError('Error generating barcode: ' + err.message);
  }
}

/**
 * Render UDI Data Matrix barcode to canvas
 */
function renderUdiBarcode(data) {
  if (!data || typeof bwipjs === 'undefined') {
    return;
  }

  try {
    bwipjs.toCanvas(elements.udiBarcodeCanvas, {
      bcid: 'datamatrix',
      text: data,
      scale: 3,
      padding: 2,
      backgroundcolor: 'ffffff'
    });
    elements.udiError.style.display = 'none';
  } catch (err) {
    elements.udiError.textContent = 'Error generating UDI barcode: ' + err.message;
    elements.udiError.style.display = 'block';
  }
}

/**
 * Copy barcode data to clipboard
 */
async function copyBarcodeData() {
  if (!currentBarcodeData) return;

  try {
    await navigator.clipboard.writeText(currentBarcodeData);

    // Visual feedback
    const originalText = elements.copyBtn.textContent;
    elements.copyBtn.textContent = 'Copied!';
    setTimeout(() => {
      elements.copyBtn.textContent = originalText;
    }, 1500);
  } catch (err) {
    showError('Failed to copy to clipboard');
  }
}

/**
 * Copy UDI data to clipboard
 */
async function copyUdiData() {
  const udi = elements.udiData.textContent;
  if (!udi || udi === '—') return;

  try {
    await navigator.clipboard.writeText(udi);

    // Visual feedback
    const originalText = elements.copyUdiBtn.textContent;
    elements.copyUdiBtn.textContent = 'Copied!';
    setTimeout(() => {
      elements.copyUdiBtn.textContent = originalText;
    }, 1500);
  } catch (err) {
    showError('Failed to copy to clipboard');
  }
}

/**
 * Handle reagent type dropdown change - update product code field and lot
 */
function handleReagentTypeChange() {
  const selected = elements.reagentType.value;
  if (selected !== 'custom') {
    elements.productCode.value = selected;
  }
  updateDefaults();
}

/**
 * Handle product code input change - sync reagent type dropdown and lot
 */
function handleProductCodeChange() {
  const code = elements.productCode.value.trim();
  if (PRODUCT_CODES[code]) {
    elements.reagentType.value = code;
  } else {
    elements.reagentType.value = 'custom';
  }
  updateDefaults();
}

/**
 * Handle manufacture date change - update lot
 */
function handleMfgDateChange() {
  updateDefaults();
}

// Event listeners
function setupEventListeners() {
  // Input change handlers
  const inputs = ['labelerId', 'expirationDate', 'lot', 'container'];
  inputs.forEach(id => {
    elements[id].addEventListener('input', updateValidation);
  });

  // Manufacture date updates lot number
  elements.manufactureDate.addEventListener('input', handleMfgDateChange);

  // Product code has bidirectional sync with reagent type
  elements.productCode.addEventListener('input', handleProductCodeChange);

  // Reagent type dropdown updates product code field
  elements.reagentType.addEventListener('change', handleReagentTypeChange);

  // Button handlers
  elements.copyBtn.addEventListener('click', copyBarcodeData);
  elements.copyUdiBtn.addEventListener('click', copyUdiData);
}

/**
 * Generate default lot number based on reagent type and manufacture date
 * Format: PREFIX + MMYY (e.g., CLN0225 for Cleaner, Feb 2025)
 */
function generateDefaultLot() {
  const productCode = elements.productCode.value.trim();
  const mfgDate = elements.manufactureDate.value;

  const prefix = LOT_PREFIXES[productCode] || 'CUS';

  let mmyy = '0000';
  if (mfgDate) {
    const match = mfgDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month] = match;
      mmyy = month + year.slice(2);
    }
  }

  return prefix + mmyy;
}

/**
 * Generate default container number based on manufacture date
 * Format: 00DD (e.g., 0004 for the 4th of the month)
 */
function generateDefaultContainer() {
  const mfgDate = elements.manufactureDate.value;

  let dd = '01';
  if (mfgDate) {
    const match = mfgDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      dd = match[3];
    }
  }

  return '00' + dd;
}

/**
 * Update lot and container with default values
 */
function updateDefaults() {
  elements.lot.value = generateDefaultLot();
  elements.container.value = generateDefaultContainer();
  updateValidation();
}

/**
 * Format date as YYYY-MM-DD using local timezone
 */
function formatLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Set default dates: manufacture = today, expiration = 1 year from today
 */
function setDefaultDates() {
  const today = new Date();
  const oneYearLater = new Date(today);
  oneYearLater.setFullYear(today.getFullYear() + 1);

  elements.manufactureDate.value = formatLocalDate(today);
  elements.expirationDate.value = formatLocalDate(oneYearLater);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setDefaultDates();
  updateDefaults();
  setupEventListeners();
  updateValidation();
});
