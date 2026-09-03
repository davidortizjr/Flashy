const crypto = require('crypto')

function verifyPaymongoSignature(rawBody, signatureHeader, webhookSecret, { live = false } = {}) {
    if (!signatureHeader || !webhookSecret) return false

    const parts = Object.fromEntries(
        signatureHeader.split(',').map((kv) => {
            const [key, ...rest] = kv.split('=')
            return [key.trim(), rest.join('=').trim()]
        }),
    )

    const timestamp = parts.t
    const signature = live ? parts.li : parts.te
    if (!timestamp || !signature) return false

    const expected = crypto.createHmac('sha256', webhookSecret).update(`${timestamp}.${rawBody}`).digest('hex')

    try {
        const sigBuf = Buffer.from(signature, 'hex')
        const expBuf = Buffer.from(expected, 'hex')
        if (sigBuf.length !== expBuf.length) return false
        return crypto.timingSafeEqual(sigBuf, expBuf)
    } catch {
        return false
    }
}

module.exports = { verifyPaymongoSignature }
