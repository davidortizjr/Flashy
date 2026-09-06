const { Router } = require('express')
const crypto = require('crypto')
const pool = require('../lib/db')
const { requireAuth } = require('../middleware/auth')
const { getEffectiveUserPlan } = require('../middleware/quota')
const { PLANS, PAYABLE_PLANS } = require('../config/plans')
const { createPaymentLink, retrieveLink } = require('../lib/paymongo')
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
// Creates a PayMongo Payment Link and hands back its hosted checkout_url.
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
        const idempotencyKey = crypto.randomUUID()

        const link = await createPaymentLink({
            amountCentavos: config.priceCentavos,
            description: `Flashy — ${config.label} plan`,
            remarks: `user:${req.userId}`,
            idempotencyKey: `link-${req.userId}-${idempotencyKey}`,
        })

        const linkId = link.data.id
        const referenceNumber = link.data.attributes.reference_number
        const checkoutUrl = link.data.attributes.checkout_url

        await pool.query(
            `INSERT INTO payments (user_id, plan, amount_centavos, currency, paymongo_link_id, reference_number, status)
             VALUES ($1, $2, $3, 'PHP', $4, $5, 'pending')`,
            [req.userId, plan, config.priceCentavos, linkId, referenceNumber],
        )

        res.json({
            linkId,
            checkoutUrl,
            amount: config.priceCentavos / 100,
            plan,
            planLabel: config.label,
        })
    } catch (err) {
        console.error('checkout failed', err.paymongo || err)
        res.status(500).json({ error: 'Could not start payment. Please try again.' })
    }
})

// GET /api/billing/status/:linkId — polled by the frontend while the
// checkout tab is open, in case the webhook hasn't arrived yet.
router.get('/status/:linkId', async (req, res) => {
    const { linkId } = req.params
    const { rows } = await pool.query(
        `SELECT * FROM payments WHERE paymongo_link_id = $1 AND user_id = $2`,
        [linkId, req.userId],
    )
    if (!rows.length) return res.status(404).json({ error: 'Payment not found' })
    const payment = rows[0]

    if (payment.status === 'paid') return res.json({ status: 'paid' })
    if (payment.status === 'failed') return res.json({ status: 'failed' })

    try {
        const link = await retrieveLink(linkId)
        const linkStatus = link.data.attributes.status // 'unpaid' | 'paid'

        if (linkStatus === 'paid') {
            await applyPaidPlan(req.userId, payment.plan, linkId)
            return res.json({ status: 'paid' })
        }

        res.json({ status: 'pending' })
    } catch (err) {
        console.error('status check failed', err)
        res.status(500).json({ error: 'Could not check payment status' })
    }
})

module.exports = router
