import CryptoJS from 'crypto-js';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key';

// Encrypt API key
export const encryptApiKey = (apiKey: string): string => {
  return CryptoJS.AES.encrypt(apiKey, ENCRYPTION_KEY).toString();
};

// Decrypt API key
export const decryptApiKey = (encryptedApiKey: string): string => {
  const bytes = CryptoJS.AES.decrypt(encryptedApiKey, ENCRYPTION_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}; 