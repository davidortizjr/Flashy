const pool = require('./db')
const { PLANS } = require('../config/plans')

async function applyPaidPlan(userId, plan, paymentIntentId) {
    const config = PLANS[plan]
    if (!config) throw new Error(`Unknown plan "${plan}"`)

    const expiresAt = config.durationDays
        ? new Date(Date.now() + config.durationDays * 24 * 60 * 60 * 1000)
        : null

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        // Only flip the payment row if it isn't already paid — this makes the
        // whole operation safe if the webhook fires twice, or if both the
        // webhook and the status-poll try to apply the same payment.
        const updated = await client.query(
            `UPDATE payments
                SET status = 'paid', paid_at = now()
              WHERE paymongo_payment_intent_id = $1
                AND status != 'paid'
              RETURNING id`,
            [paymentIntentId],
        )

        if (updated.rowCount > 0) {
            await client.query(
                `UPDATE users
                    SET plan = $1, plan_expires_at = $2, card_count_period = 0, period_start = now()
                  WHERE id = $3`,
                [plan, expiresAt, userId],
            )
        }

        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
}

module.exports = { applyPaidPlan }
