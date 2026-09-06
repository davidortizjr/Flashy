const pool = require('./db')
const { PLANS } = require('../config/plans')

/**
 * Marks a payment as paid and grants the plan. `reference` can be either the
 * PayMongo Link's reference_number (what webhooks give us) or its link id
 * (what our own status-polling endpoint has on hand) — the row is matched on
 * whichever one is present. Safe to call twice for the same payment (from
 * both the webhook and the status poll): only the first call flips anything.
 */
async function applyPaidPlan(userId, plan, reference) {
    const config = PLANS[plan]
    if (!config) throw new Error(`Unknown plan "${plan}"`)

    const expiresAt = config.durationDays
        ? new Date(Date.now() + config.durationDays * 24 * 60 * 60 * 1000)
        : null

    const client = await pool.connect()
    try {
        await client.query('BEGIN')

        const updated = await client.query(
            `UPDATE payments
                SET status = 'paid', paid_at = now()
              WHERE (reference_number = $1 OR paymongo_link_id = $1)
                AND status != 'paid'
              RETURNING id`,
            [reference],
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

/** Flips a still-pending payment to 'failed' so the checkout modal can stop polling. */
async function markPaymentFailed(reference) {
    await pool.query(
        `UPDATE payments
            SET status = 'failed'
          WHERE (reference_number = $1 OR paymongo_link_id = $1)
            AND status = 'pending'`,
        [reference],
    )
}

module.exports = { applyPaidPlan, markPaymentFailed }
