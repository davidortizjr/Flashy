const { GoogleGenAI } = require('@google/genai')

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
})

const MODEL = 'gemini-3.6-flash'

const SYSTEM_PROMPT = `You are Flashy, a tool that turns a student's notes into flashcards.
You will be given either a photo of a page (notebook, textbook, slide) or raw pasted text.
Read the content and produce a set of high quality flashcards covering the key terms, definitions,
formulas, dates, or concepts a student would need to study.

Rules:
- Return ONLY valid JSON, no prose, no markdown code fences.
- Shape: { "title": string, "cards": [{ "front": string, "back": string }, ...] }
- "title" is a short (2-6 word) title for the deck based on the subject matter.
- Each "front" is a short question, term, or prompt. Each "back" is the concise answer or definition.
- Produce between 5 and 25 cards depending on how much material is present.
- If the image is blurry, empty, or has no readable study material, return { "title": "", "cards": [] }.
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

async function generateFlashcardsFromImage(base64Image, mediaType) {
    const response = await ai.models.generateContent({
        model: MODEL,

        contents: [
            {
                inlineData: {
                    data: base64Image,
                    mimeType: mediaType,
                },
            },
            {
                text: 'Turn the notes in this photo into flashcards, following the JSON format described in your instructions.',
            },
        ],

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
    generateFlashcardsFromImage,
    generateFlashcardsFromText,
}
