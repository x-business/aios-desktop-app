import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const KEY = process.env.ENCRYPTION_KEY || 'default_encryption_key_32_chars_long!';

// Encrypt data
export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(KEY, 'utf8');
  
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');
  
  // Return iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

// Decrypt data
export const decrypt = (encryptedText: string): string => {
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const key = Buffer.from(KEY, 'utf8');
  
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  
  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  
  return decrypted;
}; 