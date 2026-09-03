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

/** Step 1: open a Payment Intent for the given amount, allowing QR Ph. */
async function createQrPhPaymentIntent({ amountCentavos, description, idempotencyKey }) {
    return paymongoRequest(
        '/payment_intents',
        'POST',
        {
            data: {
                attributes: {
                    amount: amountCentavos,
                    currency: 'PHP',
                    payment_method_allowed: ['qrph'],
                    description,
                    capture_type: 'automatic',
                },
            },
        },
        idempotencyKey,
    )
}

/**
 * Step 2: create a QR Ph payment method. Only name/email are required (no
 * card data), so this is safe to do entirely server-side.
 */
async function createQrPhPaymentMethod({ name, email, idempotencyKey }) {
    return paymongoRequest(
        '/payment_methods',
        'POST',
        {
            data: {
                attributes: {
                    type: 'qrph',
                    billing: { name, email },
                },
            },
        },
        idempotencyKey,
    )
}

/**
 * Step 3: attach the payment method to the intent. The response contains
 * next_action.code.image_url — a base64 QR image the frontend renders.
 * PayMongo expires the code ~10 minutes after this call.
 */
async function attachPaymentMethod({ paymentIntentId, paymentMethodId, idempotencyKey }) {
    return paymongoRequest(
        `/payment_intents/${paymentIntentId}/attach`,
        'POST',
        {
            data: {
                attributes: { payment_method: paymentMethodId },
            },
        },
        idempotencyKey,
    )
}

/** Fallback poll used by GET /api/billing/status/:id if the webhook is late. */
async function retrievePaymentIntent(paymentIntentId) {
    return paymongoRequest(`/payment_intents/${paymentIntentId}`, 'GET')
}

module.exports = {
    createQrPhPaymentIntent,
    createQrPhPaymentMethod,
    attachPaymentMethod,
    retrievePaymentIntent,
}
