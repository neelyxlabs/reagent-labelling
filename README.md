# Reagent Label Generator

Chrome extension for generating validation codes, Data Matrix barcodes, and UDI labels for hematology analyzer reagents. Currently supports Beckman Coulter DxH 500 series reagents.

## Features

- Generate validation codes for reagent registration
- Create HIBC-compliant Data Matrix barcodes
- Generate UDI (Unique Device Identifier) in GS1 format
- Display FDA-compliant ISO 15223-1 symbols (manufacturing date, expiration, lot)
- Support for Cleaner, Lyse, and Diluent reagent types
- Copy barcode/UDI data to clipboard
- Print-friendly layout (hides input parameters when printing)

## Supported Reagents

| Reagent Type | Product Code | GTIN |
|-------------|--------------|------|
| Cleaner | B3686813 | 15099590671877 |
| Lyse | B3684613 | 15099590671860 |
| Diluent | B3684513 | 15099590671853 |

## Installation

### Chrome Extension

1. Download this repository (Code → Download ZIP) or clone it:
   ```bash
   git clone https://github.com/neelyxlabs/reagent-labelling.git
   ```

2. Unzip if downloaded as ZIP

3. Open Chrome and go to `chrome://extensions/`

4. Enable **Developer mode** (toggle in the top right corner)

5. Click **Load unpacked**

6. Select the `reagent-labelling` folder

7. The extension icon will appear in your Chrome toolbar

### Development Setup

```bash
npm install
npm test
```

## Usage

1. Click the extension icon in Chrome toolbar
2. Click **Open App** to launch the full interface in a new tab
3. Enter reagent parameters:
   - **Reagent Type**: Select Cleaner, Lyse, Diluent, or Custom
   - **Product Code**: Auto-filled based on reagent type (or enter custom)
   - **Manufacture Date**: Defaults to today
   - **Expiration Date**: Defaults to 1 year from manufacture date
   - **Lot Number**: 7-digit lot number from reagent label
   - **Container Number**: Container/bottle number from label
4. Two barcodes are generated automatically:
   - **Validation Barcode**: Data Matrix for instrument registration
   - **UDI**: GS1 format barcode with ISO 15223-1 symbols
5. Click **Copy** to copy barcode data to clipboard
6. Use browser print (Ctrl/Cmd+P) for label output

## How Labels Are Generated

### Validation Barcode

The validation code is computed using SHA-1:

```
Validation Code = SHA-1("H628" + YYMMDD + LOT + CONTAINER)[-5:]
```

The full barcode follows HIBC format:
```
+H628[ProductCode][YYMMDD][Lot]h[Container-5digit][ValidationCode]
```

### UDI Barcode

The UDI follows GS1 format:
```
01[GTIN]11[MfgYYMMDD]17[ExpYYMMDD]10[Lot]
```

## Project Structure

```
reagent-labelling/
├── manifest.json          # Chrome extension manifest (v3)
├── popup-launcher.html    # Extension popup (opens app)
├── popup-launcher.js      # Launcher logic
├── popup.html             # Main application UI
├── popup.js               # UI logic and barcode generation
├── styles.css             # Styling
├── src/
│   └── validation.js      # Core validation algorithm
├── lib/
│   └── bwip-js.min.js     # Barcode rendering library
├── icons/                 # Extension icons
└── tests/
    └── validation.test.js # Unit tests
```

## Testing

```bash
npm test
```