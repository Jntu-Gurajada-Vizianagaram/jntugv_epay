const crypto = require('crypto');

const IV_LENGTH = 16; // AES block size

function encrypt(payload, keyBase64) {
    const key = Buffer.from(keyBase64, 'base64');

    if (key.length !== 32) {
        throw new Error("Invalid Key Length for AES-256. Expected 32 bytes.");
    }

    // SBI ePay uses AES-256-ECB with PKCS5 padding
    const cipher = crypto.createCipheriv('aes-256-ecb', key, null);

    let encrypted = cipher.update(payload, 'utf8', 'base64');
    encrypted += cipher.final('base64');

    return encrypted;
}

function decrypt(encryptedData, keyBase64) {
    const key = Buffer.from(keyBase64, 'base64');

    const decipher = crypto.createDecipheriv('aes-256-ecb', key, null);

    let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

module.exports = { encrypt, decrypt };