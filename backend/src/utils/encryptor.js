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
    // Encrypts plaintext using AES 128bit key and CBC mode
    encrypt(input, key) {
        const iv = key.slice(0, 16);
        const cipher = crypto.createCipheriv("aes-128-cbc", key.slice(0, 16), iv);
        let encrypted = cipher.update(input, 'utf8', 'base64');
        encrypted += cipher.final('base64');
        return encrypted;
    }

    // Decrypts cipherText using AES 128bit key and CBC mode
    decrypt(cipherText, key) {
        const iv = key.slice(0, 16);
        const decipher = crypto.createDecipheriv("aes-128-cbc", key.slice(0, 16), iv);
        let decryptedData = decipher.update(cipherText, 'base64', 'utf8');
        decryptedData += decipher.final('utf8');
        return decryptedData;
    }
}

module.exports = AES256;