const jwt = require('jsonwebtoken')

function requireAuth(req, res, next) {
    const token = req.cookies?.token
    if (!token) return res.status(401).json({ error: 'Not authenticated' })

    try {
        req.userId = jwt.verify(token, process.env.JWT_SECRET).sub
        next()
    } catch {
        res.status(401).json({ error: 'Invalid or expired session' })
    }
}

module.exports = { requireAuth }