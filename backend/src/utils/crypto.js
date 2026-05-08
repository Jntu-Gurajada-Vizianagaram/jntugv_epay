/**
 * Simple AES-256-CBC encrypt/decrypt utility.
 * For demo purposes — in production use bank-provided method exactly.
 * If SBI provides keys, set SBI_ENCRYPTION_KEY_BASE64 and SBI_IV_BASE64 in .env.
 */
const crypto = require('crypto');

const base64Key = process.env.SBI_ENCRYPTION_KEY_BASE64 || '';
const base64IV = process.env.SBI_IV_BASE64 || '';

const KEY = base64Key ? Buffer.from(base64Key, 'base64') : null;
const IV = base64IV ? Buffer.from(base64IV, 'base64') : null;

function encryptPayload(obj) {
  if (!KEY || !IV) throw new Error('Missing AES key/iv in env');
  const json = typeof obj === 'string' ? obj : JSON.stringify(obj);
  const cipher = crypto.createCipheriv('aes-256-cbc', KEY, IV);
  let encrypted = cipher.update(json, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

function decryptPayload(base64Str) {
  if (!KEY || !IV) throw new Error('Missing AES key/iv in env');
  const decipher = crypto.createDecipheriv('aes-256-cbc', KEY, IV);
  let out = decipher.update(base64Str, 'base64', 'utf8');
  out += decipher.final('utf8');
  return out;
}

module.exports = { encryptPayload, decryptPayload };


// const crypto = require('crypto');

// function encrypt(payload, keyBase64) {
//   const key = Buffer.from(keyBase64, 'base64');

//   if (key.length !== 32) {
//     throw new Error("Invalid Key Length for AES-256. Expected 32 bytes.");
//   }

//   const iv = Buffer.alloc(16, 0); // ✅ ZERO IV (CRITICAL)

//   const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);

//   let encrypted = cipher.update(payload, 'utf8', 'base64');
//   encrypted += cipher.final('base64');

//   return encrypted;
// }

// function decrypt(encryptedBase64, keyBase64) {
//   const key = Buffer.from(keyBase64, 'base64');
//   const iv = Buffer.alloc(16, 0); // ✅ SAME IV

//   const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

//   let decrypted = decipher.update(encryptedBase64, 'base64', 'utf8');
//   decrypted += decipher.final('utf8');

//   return decrypted;
// }

// module.exports = { encrypt, decrypt };