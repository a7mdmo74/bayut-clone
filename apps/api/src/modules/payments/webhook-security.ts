import crypto from 'crypto'
import { logger } from '../../lib/logger'

/**
 * Security utilities for webhook signature verification
 *
 * IMPORTANT: Each payment provider has different signature verification methods.
 * Stripe uses stripe.webhooks.constructEvent (see providers/stripe.ts).
 * This module keeps shared helpers (HMAC, IP allowlist, audit logging).
 */

/**
 * Generic HMAC-SHA256 signature verification
 * Most providers use HMAC-SHA256 with a shared secret
 */
export function verifyHMACSignature(
  payload: string | object,
  signature: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): boolean {
  try {
    const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)
    const expectedSignature = crypto.createHmac(algorithm, secret).update(payloadString).digest('hex')

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(signature))
  } catch (error) {
    logger.error({ error }, 'HMAC signature verification failed')
    return false
  }
}

/**
 * Additional security check: Verify webhook source IP
 * Providers recommend verifying the webhook comes from their servers
 */
export function verifyWebhookIP(ip: string, allowedIPs: string[]): boolean {
  if (!allowedIPs || allowedIPs.length === 0) {
    // If no IPs configured, skip verification (not recommended for production)
    logger.warn({}, 'No webhook IP whitelist configured, skipping IP verification')
    return true
  }

  const isAllowed = allowedIPs.some(allowedIP => {
    // Support CIDR notation (e.g., "192.168.1.0/24")
    if (allowedIP.includes('/')) {
      const parts = allowedIP.split('/')
      if (parts.length < 2) return false
      const network = parts[0]
      if (!network) return false
      const prefixLength = parts[1]
      if (!prefixLength) return false
      const prefix = parseInt(prefixLength, 10)
      if (isNaN(prefix)) return false
      // Simple CIDR check (for production, use proper IP library like ipaddr.js)
      const networkParts = network.split('.')
      const octetsToCheck = Math.ceil(prefix / 8)
      if (networkParts.length < octetsToCheck) return false
      const networkPrefix = networkParts.slice(0, octetsToCheck).join('.')
      return networkPrefix && networkPrefix.length > 0 && ip.startsWith(networkPrefix)
    }
    return ip === allowedIP
  })

  if (!isAllowed) {
    logger.warn({ ip, allowedIPs }, 'Webhook from unauthorized IP')
  }

  return isAllowed
}

/**
 * Log webhook security events for audit trail
 */
export function logWebhookSecurityEvent(
  provider: string,
  event: 'signature_verified' | 'signature_failed' | 'ip_verified' | 'ip_failed',
  details: Record<string, any>
) {
  logger.info(
    {
      provider,
      event,
      ...details,
      timestamp: new Date().toISOString(),
    },
    'Webhook security event'
  )
}
