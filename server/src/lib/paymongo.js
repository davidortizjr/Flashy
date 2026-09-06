const BASE_URL = 'https://api.paymongo.com/v1'

function authHeader() {
    const key = process.env.PAYMONGO_SECRET_KEY
    if (!key) throw new Error('PAYMONGO_SECRET_KEY is not set in the environment')
    return `Basic ${Buffer.from(`${key}:`).toString('base64')}`
}

async function paymongoRequest(path, method, body, idempotencyKey) {
    const headers = {
        'Content-Type': 'application/json',
        Authorization: authHeader(),
    }
    if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey

    const res = await fetch(`${BASE_URL}${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
    })

    const json = await res.json()
    if (!res.ok) {
        const message = json?.errors?.[0]?.detail || `PayMongo request to ${path} failed`
        const err = new Error(message)
        err.paymongo = json
        err.status = res.status
        throw err
    }
    return json
}

/**
 * Create a PayMongo Payment Link. The customer is redirected to
 * data.attributes.checkout_url — a PayMongo-hosted page that accepts GCash,
 * Maya, cards, QR Ph, online banking, etc. all from one link. PayMongo also
 * assigns a short data.attributes.reference_number we use to reconcile
 * webhook events, since the underlying Payment's
 * external_reference_number is set to this same value.
 */
async function createPaymentLink({ amountCentavos, description, remarks, idempotencyKey }) {
    return paymongoRequest(
        '/links',
        'POST',
        {
            data: {
                attributes: {
                    amount: amountCentavos,
                    description,
                    remarks,
                },
            },
        },
        idempotencyKey,
    )
}

/** Fallback poll used by GET /api/billing/status/:linkId if the webhook is late. */
async function retrieveLink(linkId) {
    return paymongoRequest(`/links/${linkId}`, 'GET')
}

module.exports = {
    createPaymentLink,
    retrieveLink,
}
