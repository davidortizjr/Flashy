const PLANS = {
    free: {
        label: 'Free',
        priceCentavos: 0,
        cardCap: 50,
        unlimited: false,
        durationDays: null,
    },
    basic: {
        label: 'Basic',
        priceCentavos: 10000, // ₱100
        cardCap: 100,
        unlimited: false,
        durationDays: 30,
    },
    pro_monthly: {
        label: 'Pro Monthly',
        priceCentavos: 25000, // ₱250
        cardCap: null,
        unlimited: true,
        durationDays: 30,
    },
    pro_yearly: {
        label: 'Pro Yearly',
        priceCentavos: 70000, // ₱700
        cardCap: null,
        unlimited: true,
        durationDays: 365,
    },
}

// Plans a user can actually buy (free isn't "purchased")
const PAYABLE_PLANS = ['basic', 'pro_monthly', 'pro_yearly']

module.exports = { PLANS, PAYABLE_PLANS }
