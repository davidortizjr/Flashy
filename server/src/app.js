const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const multer = require('multer')
const authRoutes = require('./routes/auth.routes')
const decksRoutes = require('./routes/decks.routes')
const billingRoutes = require('./routes/billing.routes')
const paymongoWebhook = require('./routes/paymongo-webhook')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))

app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), paymongoWebhook)

app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)
app.use('/api/decks', decksRoutes)
app.use('/api/billing', billingRoutes)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || /Unsupported file type/.test(err.message)) {
        return res.status(400).json({ error: err.message })
    }
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
})

module.exports = app