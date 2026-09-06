const { verifyPaymongoSignature } = require('../lib/paymongoWebhook')
const { applyPaidPlan, markPaymentFailed } = require('../lib/billingActions')
const pool = require('../lib/db')

// Looks up which of our users a PayMongo reference belongs to. `reference`
// may be a Link's reference_number (from a payment.paid / payment.failed
// event's external_reference_number) or a Link id (from a link.payment.paid
// event's resource id) — payments rows can be matched on either.
async function findPaymentByReference(reference) {
    if (!reference) return null
    const { rows } = await pool.query(
        `SELECT user_id, plan FROM payments WHERE reference_number = $1 OR paymongo_link_id = $1`,
        [reference],
    )
    return rows[0] || null
}

async function paymongoWebhookHandler(req, res) {
    const signature = req.headers['paymongo-signature']
    const secret = process.env.PAYMONGO_WEBHOOK_SECRET
    const rawBody = req.body // Buffer — only true if this route used express.raw()
    const live = process.env.NODE_ENV === 'production'

    if (!Buffer.isBuffer(rawBody)) {
        console.error(
            'paymongoWebhookHandler got a parsed body, not a raw Buffer. ' +
            'Make sure this route is registered with express.raw() BEFORE express.json() in app.js.',
        )
        return res.status(500).json({ error: 'Server misconfiguration' })
    }

    if (!verifyPaymongoSignature(rawBody.toString('utf8'), signature, secret, { live })) {
        console.warn('Rejected PayMongo webhook: signature mismatch')
        return res.status(400).json({ error: 'Invalid signature' })
    }

    let event
    try {
        event = JSON.parse(rawBody.toString('utf8'))
    } catch {
        return res.status(400).json({ error: 'Invalid JSON payload' })
    }

    const type = event?.data?.attributes?.type
    const resource = event?.data?.attributes?.data
    const resourceAttrs = resource?.attributes

    try {
        if (type === 'payment.paid') {
            // For Link-originated payments, PayMongo sets external_reference_number
            // to the Link's reference_number.
            const reference = resourceAttrs?.external_reference_number
            const payment = await findPaymentByReference(reference)
            if (payment) await applyPaidPlan(payment.user_id, payment.plan, reference)
        } else if (type === 'link.payment.paid') {
            const reference = resourceAttrs?.reference_number || resource?.id
            const payment = await findPaymentByReference(reference)
            if (payment) await applyPaidPlan(payment.user_id, payment.plan, reference)
        } else if (type === 'payment.failed') {
            const reference = resourceAttrs?.external_reference_number
            if (reference) await markPaymentFailed(reference)
        } else if (type === 'link.payment.failed' || type === 'payment_link.expired') {
            const reference = resourceAttrs?.reference_number || resource?.id
            if (reference) await markPaymentFailed(reference)
        }

        res.status(200).json({ received: true })
    } catch (err) {
        console.error('webhook processing failed', err)
        res.status(500).json({ error: 'Webhook processing failed' })
    }
}

module.exports = paymongoWebhookHandler
