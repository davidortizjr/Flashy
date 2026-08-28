const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const authRoutes = require('./routes/auth.routes')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json())
app.use(cookieParser())

app.use('/api/auth', authRoutes)

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error(err)
    res.status(500).json({ error: 'Something went wrong.' })
})

module.exports = app