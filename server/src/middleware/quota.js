const pool = require('../lib/db')
const { PLANS } = require('../config/plans')

const MS_PER_DAY = 24 * 60 * 60 * 1000
const RESET_WINDOW_MS = 30 * MS_PER_DAY

async function getEffectiveUserPlan(userId) {
    const { rows } = await pool.query(
        `SELECT plan, plan_expires_at, card_count_period, period_start FROM users WHERE id = $1`,
        [userId],
    )
    if (!rows.length) throw new Error('User not found')

    let { plan, plan_expires_at, card_count_period, period_start } = rows[0]
    const now = new Date()
    let changed = false

    if (plan_expires_at && new Date(plan_expires_at) <= now) {
        plan = 'free'
        plan_expires_at = null
        changed = true
    }

    if (now - new Date(period_start) >= RESET_WINDOW_MS) {
        card_count_period = 0
        period_start = now
        changed = true
    }

    if (changed) {
        await pool.query(
            `UPDATE users SET plan = $1, plan_expires_at = $2, card_count_period = $3, period_start = $4 WHERE id = $5`,
            [plan, plan_expires_at, card_count_period, period_start, userId],
        )
    }

    return { plan, plan_expires_at, card_count_period, period_start }
}

async function attachQuota(req, res, next) {
    try {
        const state = await getEffectiveUserPlan(req.userId)
        const config = PLANS[state.plan] || PLANS.free

        if (config.unlimited) {
            req.quota = { plan: state.plan, cap: null, remaining: Infinity }
            return next()
        }

        const remaining = Math.max(0, config.cardCap - state.card_count_period)
        req.quota = { plan: state.plan, cap: config.cardCap, remaining }

        if (remaining <= 0) {
            return res.status(402).json({
                error: `You've used all ${config.cardCap} cards on the ${config.label} plan this period. Upgrade to keep making decks.`,
                code: 'quota_exceeded',
                plan: state.plan,
                cap: config.cardCap,
            })
        }

        next()
    } catch (err) {
        console.error('quota check failed', err)
        res.status(500).json({ error: 'Failed to check plan quota' })
    }
}

module.exports = { attachQuota, getEffectiveUserPlan }
