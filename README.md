# Reagent Label Generator

Chrome extension for generating validation codes, Data Matrix barcodes, and UDI labels for hematology analyzer reagents. Currently supports Beckman Coulter DxH 500 series reagents.

## Features

- Generate SHA-1 based validation codes for reagent registration
- Create HIBC-compliant Data Matrix barcodes
- Generate UDI (Unique Device Identifier) in GS1 format with FDA-compliant symbols
- Support for Cleaner, Lyse, and Diluent reagent types
- Copy barcode/UDI data to clipboard
- Print-friendly layout (hides input parameters when printing)

## Supported Reagents

| Reagent Type | Product Code | GTIN |
|-------------|--------------|------|
| Cleaner | B3686813 | 15099590671877 |
| Lyse | B3684613 | 15099590671860 |
| Diluent | B3684513 | 15099590671853 |

## Algorithm

The validation code is computed as:

```
Validation Code = SHA-1("H628" + YYMMDD + LOT + CONTAINER)[-5:]
```

| Component | Description | Example |
|-----------|-------------|---------|
| `H628` | Beckman Coulter's HIBC Labeler ID (without leading `+`) | H628 |
| `YYMMDD` | Expiration date (2-digit year, month, day) | 260826 |
| `LOT` | Lot number as printed on label | 7703835 |
| `CONTAINER` | Container number as printed on label | 0158 |

For the full reverse-engineering story, see [claude_observations.txt](claude_observations.txt).

## Installation

### As Chrome Extension

1. Clone this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dxh-reagent` directory

### Development Setup

```bash
npm install
npm test
```

## Project Structure

```
dxh-reagent/
├── manifest.json          # Chrome extension manifest (v3)
├── popup-launcher.html    # Extension popup (opens app in new tab)
├── popup-launcher.js      # Launcher logic
├── popup.html             # Main application UI
├── popup.js               # UI logic and UDI generation
├── styles.css             # Styling (includes print styles)
├── src/
│   └── validation.js      # Core validation algorithm (testable)
├── lib/
│   └── bwip-js.min.js     # Barcode generation library
├── icons/                 # Extension icons
└── tests/
    ├── validation.test.js # Unit tests (31 tests)
    └── setup.js           # Jest test setup
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

## Usage

1. Click the extension icon in Chrome
2. Click "Open App" to launch the full interface in a new tab
3. Enter reagent parameters:
   - Select Reagent Type (Cleaner, Lyse, Diluent, or Custom)
   - Manufacture Date (defaults to today)
   - Expiration Date (defaults to 1 year from manufacture)
   - Lot Number (7 digits)
   - Container Number
4. Two barcodes are generated:
   - **Validation Barcode**: For DxH instrument registration
   - **UDI**: GS1 format with ISO 15223-1 compliant symbols for labeling
5. Use Copy buttons to copy barcode data
6. Print the page for label output (input parameters are hidden)

## Barcode Formats

### Validation Barcode (HIBC)

```
+H628 B3686813 YYMMDD LOT h CONTAINER(5-digit) VALIDATION
```

Note: Container is zero-padded to 5 digits in the barcode but used as-is in the validation hash.

### UDI (GS1)

```
01[GTIN]11[MfgYYMMDD]17[ExpYYMMDD]10[Lot]
```

The UDI section displays FDA-required symbols per ISO 15223-1:
- Manufacturing date symbol
- Use-by/expiration date symbol (hourglass)
- Batch/LOT symbol
