const { Router } = require('express')
const crypto = require('crypto')
const pool = require('../lib/db')
const { requireAuth } = require('../middleware/auth')
const { getEffectiveUserPlan } = require('../middleware/quota')
const { PLANS, PAYABLE_PLANS } = require('../config/plans')
const {
    createQrPhPaymentIntent,
    createQrPhPaymentMethod,
    attachPaymentMethod,
    retrievePaymentIntent,
} = require('../lib/paymongo')
const { applyPaidPlan } = require('../lib/billingActions')

const router = Router()
router.use(requireAuth)

// GET /api/billing/plan — current plan + usage, for the dashboard
router.get('/plan', async (req, res) => {
    const state = await getEffectiveUserPlan(req.userId)
    const config = PLANS[state.plan] || PLANS.free
    res.json({
        plan: state.plan,
        label: config.label,
        unlimited: config.unlimited,
        cap: config.cardCap,
        used: state.card_count_period,
        remaining: config.unlimited ? null : Math.max(0, config.cardCap - state.card_count_period),
        expiresAt: state.plan_expires_at,
    })
})

// POST /api/billing/checkout  { plan: 'basic' | 'pro_monthly' | 'pro_yearly' }
router.post('/checkout', async (req, res) => {
    const { plan } = req.body
    if (!PAYABLE_PLANS.includes(plan)) {
        return res.status(400).json({ error: 'Invalid plan' })
    }
    const config = PLANS[plan]

    const { rows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.userId])
    const user = rows[0]
    if (!user) return res.status(401).json({ error: 'Not authenticated' })

    try {
        const idemBase = crypto.randomUUID()

        const intent = await createQrPhPaymentIntent({
            amountCentavos: config.priceCentavos,
            description: `Flashy — ${config.label} plan`,
            idempotencyKey: `pi-${req.userId}-${idemBase}`,
        })
        const paymentIntentId = intent.data.id

        const method = await createQrPhPaymentMethod({
            name: user.name,
            email: user.email,
            idempotencyKey: `pm-${req.userId}-${idemBase}`,
        })

        const attached = await attachPaymentMethod({
            paymentIntentId,
            paymentMethodId: method.data.id,
            idempotencyKey: `attach-${req.userId}-${idemBase}`,
        })

        const qrImage = attached.data.attributes?.next_action?.code?.image_url
        if (!qrImage) throw new Error('PayMongo did not return a QR Ph code image')

        await pool.query(
            `INSERT INTO payments (user_id, plan, amount_centavos, currency, paymongo_payment_intent_id, status)
             VALUES ($1, $2, $3, 'PHP', $4, 'pending')`,
            [req.userId, plan, config.priceCentavos, paymentIntentId],
        )

        res.json({
            paymentIntentId,
            qrImage, // base64 data URL — render directly in an <img src>
            amount: config.priceCentavos / 100,
            plan,
            planLabel: config.label,
            expiresInSeconds: 600, // PayMongo expires QR Ph codes after ~10 min
        })
    } catch (err) {
        console.error('checkout failed', err.paymongo || err)
        res.status(500).json({ error: 'Could not start payment. Please try again.' })
    }
})

// GET /api/billing/status/:paymentIntentId — polled by the frontend while
router.get('/status/:paymentIntentId', async (req, res) => {
    const { paymentIntentId } = req.params
    const { rows } = await pool.query(
        `SELECT * FROM payments WHERE paymongo_payment_intent_id = $1 AND user_id = $2`,
        [paymentIntentId, req.userId],
    )
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' })
    const payment = rows[0]

    if (payment.status === 'paid') {
        return res.json({ status: 'paid' })
    }

    try {
        const intent = await retrievePaymentIntent(paymentIntentId)
        const pmStatus = intent.data.attributes.status

        if (pmStatus === 'succeeded') {
            await applyPaidPlan(req.userId, payment.plan, paymentIntentId)
            return res.json({ status: 'paid' })
        }

        res.json({ status: 'pending' })
    } catch (err) {
        console.error('status check failed', err)
        res.status(500).json({ error: 'Could not check payment status' })
    }
})

module.exports = router
