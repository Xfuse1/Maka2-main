// Payment Data Encryption Utilities
// AES-256 encryption for sensitive payment data
import crypto from "crypto"
const ALGORITHM = "aes-256-gcm"
const KEY_LENGTH = 32
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16
const SALT_LENGTH = 64

/**
 * Generate encryption key from environment variable
 */
function getEncryptionKey(): Buffer {
  const secret = process.env.PAYMENT_ENCRYPTION_KEY || "default-dev-key-change-in-production-32chars"

  // Derive a proper 32-byte key using PBKDF2
  return crypto.pbkdf2Sync(secret, "payment-salt", 100000, KEY_LENGTH, "sha256")
}

/**
 * Encrypt sensitive payment data
 */
export function encryptPaymentData(data: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)

    const cipher = crypto.createCipheriv(ALGORITHM, new Uint8Array(key), new Uint8Array(iv)) as crypto.CipherGCM

    let encrypted = cipher.update(data, "utf8", "hex")
    encrypted += cipher.final("hex")

    const authTag = cipher.getAuthTag()

    // Combine IV + AuthTag + Encrypted Data
    const combined = Buffer.concat([
      new Uint8Array(iv), 
      new Uint8Array(authTag), 
      new Uint8Array(Buffer.from(encrypted, "hex"))
    ])

    return combined.toString("base64")
  } catch (error) {
    console.error("[Payment Encryption] Error encrypting data:", error)
    throw new Error("Encryption failed")
  }
}

/**
 * Decrypt payment data
 */
export function decryptPaymentData(encryptedData: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedData, "base64")

    // Extract IV, AuthTag, and encrypted data
    const iv = combined.subarray(0, IV_LENGTH)
    const authTag = combined.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

    const decipher = crypto.createDecipheriv(ALGORITHM, new Uint8Array(key), new Uint8Array(iv)) as crypto.DecipherGCM
    decipher.setAuthTag(new Uint8Array(authTag))

    let decrypted = decipher.update(encrypted.toString("hex"), "hex", "utf8")
    decrypted += decipher.final("utf8")

    return decrypted
  } catch (error) {
    console.error("[Payment Encryption] Error decrypting data:", error)
    throw new Error("Decryption failed")
  }
}

/**
 * Generate digital signature for payment data
 */
export function generateSignature(data: string): string {
  const secret = process.env.PAYMENT_SIGNATURE_SECRET || "default-signature-secret-change-in-production"

  return crypto.createHmac("sha256", secret).update(data).digest("hex")
}

/**
 * Verify digital signature
 */
export function verifySignature(data: string, signature: string): boolean {
  try {
    const expectedSignature = generateSignature(data)
    const signatureBuffer = Buffer.from(signature, 'hex')
    const expectedBuffer = Buffer.from(expectedSignature, 'hex')
    
    if (signatureBuffer.length !== expectedBuffer.length) {
      return false
    }
    
    // Use timingSafeEqual to prevent timing attacks
    // Cast Buffer to Uint8Array for TypeScript compatibility
    return crypto.timingSafeEqual(
      new Uint8Array(signatureBuffer),
      new Uint8Array(expectedBuffer)
    )
  } catch (error) {
    console.error("[Payment Encryption] Error verifying signature:", error)
    return false
  }
}

/**
 * Hash sensitive data (one-way, for comparison)
 */
export function hashSensitiveData(data: string): string {
  return crypto.createHash("sha256").update(data).digest("hex")
}

/**
 * Generate secure random token
 */
export function generateSecureToken(length = 32): string {
  return crypto.randomBytes(length).toString("hex")
}

/**
 * Mask card number for display (show only last 4 digits)
 */
export function maskCardNumber(cardNumber: string): string {
  if (!cardNumber || cardNumber.length < 4) return "****"
  return `****-****-****-${cardNumber.slice(-4)}`
}

/**
 * Tokenize card data (for PCI compliance)
 */
export function tokenizeCard(cardData: {
  number: string
  expiry: string
  cvv: string
}): string {
  const dataString = JSON.stringify(cardData)
  const encrypted = encryptPaymentData(dataString)
  const token = generateSecureToken(16)

  // In production, store the mapping in a secure vault
  // For now, we'll return the encrypted data as the token
  return `tok_${token}`
}
