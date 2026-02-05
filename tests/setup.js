// Jest setup file for browser API polyfills
const { TextEncoder, TextDecoder } = require('util');
const { webcrypto } = require('crypto');

// Polyfill TextEncoder/TextDecoder
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill crypto with webcrypto
Object.defineProperty(global, 'crypto', {
  value: webcrypto,
  writable: true,
  configurable: true
});
