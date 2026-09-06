const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

const MODEL = 'gemini-3.6-flash'

const SYSTEM_PROMPT = `You are Flashy, a tool that turns a student's notes into flashcards.
You will be given one or more photos of pages (notebook, textbook, slide), a PDF document, or raw
pasted text. Read the content and produce a set of high quality flashcards covering the key terms,
definitions, formulas, dates, or concepts a student would need to study.

Rules:
- Return ONLY valid JSON, no prose, no markdown code fences.
- Shape: { "title": string, "cards": [{ "front": string, "back": string }, ...] }
- "title" is a short (2-6 word) title for the deck based on the subject matter.
- Each "front" is a short question, term, or prompt. Each "back" is the concise answer or definition.
- Produce between 5 and 25 cards depending on how much material is present. For a multi-page PDF or
  multiple photos, draw cards from across all of the pages, not just the first.
- If the material is blurry, empty, or has no readable study content, return { "title": "", "cards": [] }.
- Never invent facts that aren't supported by the source material.`

function parseResponse(response) {
    const text = response.text

    if (!text) {
        throw new Error('Model returned no text.')
    }

    try {
        return JSON.parse(text)
    } catch (error) {
        console.error('Invalid JSON from Gemini:', text)
        throw new Error('Model returned invalid JSON.')
    }
}

// Gemini accepts images and PDFs the same way via inlineData — the model
// reads a PDF's pages directly, no separate extraction step needed. `files`
// is an array of { data: base64String, mimeType: string }; passing several
// image parts in one call lets Gemini treat them as one combined document
// (e.g. several photos of consecutive notebook pages).
async function generateFlashcardsFromFiles(files) {
    const parts = files.map((f) => ({ inlineData: { data: f.data, mimeType: f.mimeType } }))
    const instruction =
        files.length > 1
            ? `Turn the notes across these ${files.length} photos into one combined set of flashcards, following the JSON format described in your instructions.`
            : 'Turn the notes in this file into flashcards, following the JSON format described in your instructions.'

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: [...parts, { text: instruction }],
        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
        },
    })

    return parseResponse(response)
}

async function generateFlashcardsFromText(text) {
    const response = await ai.models.generateContent({
        model: MODEL,

        contents: `Turn the following notes into flashcards, following the JSON format described in your instructions.

---
${text}
---`,

        config: {
            systemInstruction: SYSTEM_PROMPT,
            responseMimeType: 'application/json',
        },
    })

    return parseResponse(response)
}

module.exports = {
    generateFlashcardsFromFiles,
    generateFlashcardsFromText,
}
