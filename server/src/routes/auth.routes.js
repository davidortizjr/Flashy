const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const pool = require('../lib/db')
const { requireAuth } = require('../middleware/auth')

const router = Router()

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

const toPublicUser = (row) => ({ name: row.name, email: row.email })

function issueToken(res, userId) {
    const token = jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: '7d' })
    res.cookie('token', token, COOKIE_OPTIONS)
}

router.post('/signup', async (req, res) => {
    const { name, email, password } = req.body

    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email and password are required.' })
    }
    if (password.length < 8) {
        return res.status(400).json({ error: 'Password needs to be at least 8 characters.' })
    }

    const normalizedEmail = email.toLowerCase()
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [normalizedEmail])
    if (existing.rowCount > 0) {
        return res.status(409).json({ error: 'An account with that email already exists.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const { rows } = await pool.query(
        `INSERT INTO users (name, email, password_hash)
     VALUES ($1, $2, $3)
     RETURNING id, name, email`,
        [name, normalizedEmail, passwordHash],
    )
    const user = rows[0]

    issueToken(res, user.id)
    res.status(201).json({ user: toPublicUser(user) })
})

router.post('/login', async (req, res) => {
    const { email, password } = req.body
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' })
    }

    const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email.toLowerCase()])
    const user = rows[0]
    const valid = user && (await bcrypt.compare(password, user.password_hash))
    if (!valid) {
        return res.status(401).json({ error: 'That email and password don\u2019t match an account.' })
    }

    issueToken(res, user.id)
    res.json({ user: toPublicUser(user) })
})

router.post('/logout', (req, res) => {
    res.clearCookie('token', COOKIE_OPTIONS)
    res.status(204).end()
})

router.get('/me', requireAuth, async (req, res) => {
    const { rows } = await pool.query('SELECT name, email FROM users WHERE id = $1', [req.userId])
    if (!rows[0]) return res.status(401).json({ error: 'Not authenticated' })
    res.json({ user: toPublicUser(rows[0]) })
})

module.exports = router