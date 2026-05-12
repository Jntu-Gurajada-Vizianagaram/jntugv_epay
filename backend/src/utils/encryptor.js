/*using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Security.Cryptography;
using System.Text;

namespace WebApplication2
{
    public class AES256
    {
        public RijndaelManaged GetRijndaelManaged(String secretKey)
        {
            var keyBytes = new byte[16];
            var secretKeyBytes = Encoding.UTF8.GetBytes(secretKey);
            Array.Copy(secretKeyBytes, keyBytes, Math.Min(keyBytes.Length, secretKeyBytes.Length));
            return new RijndaelManaged
            {
                Mode = CipherMode.CBC,
                Padding = PaddingMode.PKCS7,
                KeySize = 256,
                BlockSize = 128,
                Key = keyBytes,
                IV = keyBytes
            };
        }

        public byte[] Encrypt(byte[] plainBytes, RijndaelManaged rijndaelManaged)
        {
            return rijndaelManaged.CreateEncryptor().TransformFinalBlock(plainBytes, 0, plainBytes.Length);
        }

        public byte[] Decrypt(byte[] encryptedData, RijndaelManaged rijndaelManaged)
        {
            return rijndaelManaged.CreateDecryptor().TransformFinalBlock(encryptedData, 0, encryptedData.Length);
        }


        // Encrypts plaintext using AES 128bit key and a Chain Block Cipher and returns a base64 encoded string

        public String Encrypt(String plainText, String key)
        {
            var plainBytes = Encoding.UTF8.GetBytes(plainText);
            return Convert.ToBase64String(Encrypt(plainBytes, GetRijndaelManaged(key)));
        }


        public String Decrypt(String encryptedText, String key)
        {
            var encryptedBytes = Convert.FromBase64String(encryptedText);
            return Encoding.UTF8.GetString(Decrypt(encryptedBytes, GetRijndaelManaged(key)));
        }
    }
}*/


const crypto = require('crypto');

class AES256 {

    getCipherConfig(secretKey) {

        // 32 bytes = 256 bits
        const keyBytes = Buffer.alloc(32);

        const secretKeyBytes = Buffer.from(secretKey, 'utf8');

        secretKeyBytes.copy(
            keyBytes,
            0,
            0,
            Math.min(secretKeyBytes.length, keyBytes.length)
        );

        return {
            key: keyBytes,
            iv: keyBytes.slice(0, 16) // IV must be 16 bytes for AES-CBC
        };
    }

    encryptBytes(plainBytes, config) {

        const cipher = crypto.createCipheriv(
            'aes-256-cbc',
            config.key,
            config.iv
        );

        return Buffer.concat([
            cipher.update(plainBytes),
            cipher.final()
        ]);
    }

    decryptBytes(encryptedBytes, config) {

        const decipher = crypto.createDecipheriv(
            'aes-256-cbc',
            config.key,
            config.iv
        );

        return Buffer.concat([
            decipher.update(encryptedBytes),
            decipher.final()
        ]);
    }

    // Encrypt plaintext -> Base64
    encrypt(plainText, key) {

        const plainBytes = Buffer.from(plainText, 'utf8');

        const encrypted = this.encryptBytes(
            plainBytes,
            this.getCipherConfig(key)
        );

        return encrypted.toString('base64');
    }

    // Decrypt Base64 -> Plaintext
    decrypt(encryptedText, key) {

        const encryptedBytes = Buffer.from(
            encryptedText,
            'base64'
        );

        const decrypted = this.decryptBytes(
            encryptedBytes,
            this.getCipherConfig(key)
        );

        return decrypted.toString('utf8');
    }
}

module.exports = AES256;