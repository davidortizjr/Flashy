const pool = require('../lib/db')
const { verifyPaymongoSignature } = require('../lib/paymongoWebhook')
const { applyPaidPlan } = require('../lib/billingActions')

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

    try {
        if (type === 'payment.paid') {
            const paymentIntentId = event.data.attributes.data.attributes.payment_intent_id

            const { rows } = await pool.query(
                `SELECT user_id, plan, status FROM payments WHERE paymongo_payment_intent_id = $1`,
                [paymentIntentId],
            )

            if (rows.length && rows[0].status !== 'paid') {
                await applyPaidPlan(rows[0].user_id, rows[0].plan, paymentIntentId)
            }
        }

        res.status(200).json({ received: true })
    } catch (err) {
        console.error('webhook processing failed', err)
        res.status(500).json({ error: 'Webhook processing failed' })
    }
}

module.exports = paymongoWebhookHandler
