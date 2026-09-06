const { Router } = require('express')
const multer = require('multer')
const pool = require('../lib/db')
const { requireAuth } = require('../middleware/auth')
const { generateFlashcardsFromImage, generateFlashcardsFromText } = require('../lib/gemini')
const { attachQuota } = require('../middleware/quota')

const router = Router()
router.use(requireAuth)

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
    fileFilter: (req, file, cb) => {
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'text/plain']
        if (allowed.includes(file.mimetype)) return cb(null, true)
        cb(new Error('Unsupported file type. Upload a photo (jpg/png/webp) or a .txt file.'))
    },
})

const toPublicDeck = (row) => ({
    id: row.id,
    title: row.title,
    source: row.source,
    cardCount: Number(row.card_count ?? 0),
    createdAt: row.created_at,
})

const toPublicCard = (row) => ({ id: row.id, front: row.front, back: row.back })

router.post('/import', attachQuota, upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Attach a photo or a text file to import.' })
    }

    let generated
    try {
        if (req.file.mimetype === 'text/plain') {
            const text = req.file.buffer.toString('utf8').trim()
            if (!text) return res.status(400).json({ error: 'That file looks empty.' })
            generated = await generateFlashcardsFromText(text)
        } else {
            generated = await generateFlashcardsFromImage(req.file.buffer.toString('base64'), req.file.mimetype)
        }
    } catch (err) {
        console.error('Flashcard generation failed:', err)
        return res.status(502).json({ error: 'Could not generate flashcards from that. Try a clearer photo.' })
    }

    const generatedCards = Array.isArray(generated?.cards)
        ? generated.cards.filter((c) => c?.front && c?.back)
        : []
    if (generatedCards.length === 0) {
        return res.status(422).json({ error: 'No readable study material was found in that import.' })
    }

    // Trim to whatever's left on their plan (Infinity for unlimited plans).
    // attachQuota already rejected the request before we spent a Gemini call
    // if remaining was 0, so this only fires when a generation produced more
    // cards than the user has room left for.
    const cards =
        req.quota.remaining === Infinity ? generatedCards : generatedCards.slice(0, req.quota.remaining)

    const title = (req.body.title || generated.title || 'Untitled deck').toString().slice(0, 120)
    const source = req.file.mimetype === 'text/plain' ? 'text' : 'photo'

    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const { rows: deckRows } = await client.query(
            `INSERT INTO decks (user_id, title, source) VALUES ($1, $2, $3) RETURNING *`,
            [req.userId, title, source],
        )
        const deck = deckRows[0]

        const insertedCards = []
        for (let i = 0; i < cards.length; i++) {
            const { rows } = await client.query(
                `INSERT INTO cards (deck_id, position, front, back) VALUES ($1, $2, $3, $4) RETURNING *`,
                [deck.id, i, String(cards[i].front).slice(0, 500), String(cards[i].back).slice(0, 1000)],
            )
            insertedCards.push(rows[0])
        }

        if (insertedCards.length > 0) {
            await client.query('UPDATE users SET card_count_period = card_count_period + $1 WHERE id = $2', [
                insertedCards.length,
                req.userId,
            ])
        }

        await client.query('COMMIT')
        res.status(201).json({
            deck: toPublicDeck({ ...deck, card_count: insertedCards.length }),
            cards: insertedCards.map(toPublicCard),
            requestedCount: generatedCards.length,
            truncated: insertedCards.length < generatedCards.length,
        })
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
})

router.get('/', async (req, res) => {
    const { rows } = await pool.query(
        `SELECT d.*, COUNT(c.id) AS card_count
     FROM decks d
     LEFT JOIN cards c ON c.deck_id = d.id
     WHERE d.user_id = $1
     GROUP BY d.id
     ORDER BY d.created_at DESC`,
        [req.userId],
    )
    res.json({ decks: rows.map(toPublicDeck) })
})

router.get('/:id', async (req, res) => {
    const { rows: deckRows } = await pool.query('SELECT * FROM decks WHERE id = $1 AND user_id = $2', [
        req.params.id,
        req.userId,
    ])
    const deck = deckRows[0]
    if (!deck) return res.status(404).json({ error: 'Deck not found.' })

    const { rows: cardRows } = await pool.query(
        'SELECT * FROM cards WHERE deck_id = $1 ORDER BY position ASC',
        [deck.id],
    )
    res.json({ deck: toPublicDeck({ ...deck, card_count: cardRows.length }), cards: cardRows.map(toPublicCard) })
})

router.patch('/:id', async (req, res) => {
    const title = (req.body.title || '').toString().trim().slice(0, 120)
    if (!title) return res.status(400).json({ error: 'Title cannot be empty.' })

    const { rows } = await pool.query(
        `UPDATE decks SET title = $1 WHERE id = $2 AND user_id = $3 RETURNING *`,
        [title, req.params.id, req.userId],
    )
    if (!rows.length) return res.status(404).json({ error: 'Deck not found.' })

    const { rows: cardRows } = await pool.query('SELECT id FROM cards WHERE deck_id = $1', [req.params.id])
    res.json({ deck: toPublicDeck({ ...rows[0], card_count: cardRows.length }) })
})

router.delete('/:id', async (req, res) => {
    const { rowCount } = await pool.query('DELETE FROM decks WHERE id = $1 AND user_id = $2', [
        req.params.id,
        req.userId,
    ])
    if (rowCount === 0) return res.status(404).json({ error: 'Deck not found.' })
    res.status(204).end()
})

// Confirms `deckId` belongs to the current user before letting them touch its cards.
async function loadOwnedDeck(deckId, userId) {
    const { rows } = await pool.query('SELECT id FROM decks WHERE id = $1 AND user_id = $2', [deckId, userId])
    return rows[0] || null
}

router.patch('/:deckId/cards/:cardId', async (req, res) => {
    const deck = await loadOwnedDeck(req.params.deckId, req.userId)
    if (!deck) return res.status(404).json({ error: 'Deck not found.' })

    const front = req.body.front !== undefined ? String(req.body.front).trim().slice(0, 500) : undefined
    const back = req.body.back !== undefined ? String(req.body.back).trim().slice(0, 1000) : undefined
    if (front === '' || back === '') {
        return res.status(400).json({ error: 'Front and back cannot be empty.' })
    }
    if (front === undefined && back === undefined) {
        return res.status(400).json({ error: 'Nothing to update.' })
    }

    const { rows } = await pool.query(
        `UPDATE cards SET front = COALESCE($1, front), back = COALESCE($2, back)
          WHERE id = $3 AND deck_id = $4 RETURNING *`,
        [front, back, req.params.cardId, deck.id],
    )
    if (!rows.length) return res.status(404).json({ error: 'Card not found.' })
    res.json({ card: toPublicCard(rows[0]) })
})

router.delete('/:deckId/cards/:cardId', async (req, res) => {
    const deck = await loadOwnedDeck(req.params.deckId, req.userId)
    if (!deck) return res.status(404).json({ error: 'Deck not found.' })

    const { rowCount } = await pool.query('DELETE FROM cards WHERE id = $1 AND deck_id = $2', [
        req.params.cardId,
        deck.id,
    ])
    if (rowCount === 0) return res.status(404).json({ error: 'Card not found.' })
    res.status(204).end()
})

module.exports = router
