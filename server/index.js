import express from "express"
import multer from "multer"
import cors from "cors"
import Tesseract from "tesseract.js"
import { GoogleGenerativeAI } from "@google/generative-ai"
import dotenv from "dotenv"

dotenv.config()

const app = express()
const PORT = 5000

app.use(cors())
app.use(express.json())

// Memory storage - nothing saved to disk
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB max
})

// Init Gemini
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ GEMINI_API_KEY is missing from .env file")
  process.exit(1)
}
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Caliber AI is running 🔥" })
})

// Main route
app.post("/api/upload", upload.single("screenshot"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No screenshot uploaded" })
    }

    const { mode, spiceLevel } = req.body
    console.log("✅ File received:", req.file.size, "bytes")
    console.log("Mode:", mode, "SpiceLevel:", spiceLevel)

    // 1. Extract text from screenshot
    console.log("📖 Reading screenshot with Tesseract...")
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng")
    console.log("✅ Text extracted:", text.slice(0, 150).replace(/\n/g, " | "))

    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: "Couldn't read any text from image" })
    }

    // 2. Build prompt based on mode
    const basePrompt = `You are Caliber, an AI that helps guys craft the perfect reply to a girl in a DM conversation.

INPUT VALIDATION (do this first, before anything else):
- The text below was extracted via OCR from a screenshot.
- Only proceed if it clearly resembles a real DM/text conversation between two people (short messages, back-and-forth, casual texting tone, timestamps, or usernames).
- If it does NOT look like a chat conversation — for example it's a random photo caption, a document, an article, a meme, a profile bio, a group chat about something unrelated, or garbled/nonsense OCR text — output EXACTLY this single token and nothing else: NOT_A_CHAT

OUTPUT RULES (only apply if input passed validation above):
- Output ONLY the 3 replies. Nothing else.
- Do NOT include intros like "Here are some replies", "Sure, here you go", "Option 1:", etc.
- Do NOT number the replies or add bullet points, quotes, or dashes.
- Do NOT explain your reasoning or add any commentary before or after.
- Each reply must be on its own line.
- Each reply must be exactly 1 line, short, and sound like a real text message a guy would actually send — not overly poetic, not robotic.
- Replies must directly respond to the LAST message from the other person in the conversation, using context from the full chat.

Chat context (raw OCR text):
"${text}"`

    let prompt = ""
    if (mode === "safe") {
      prompt = `${basePrompt}

MODE: SAFE
Give 3 short, safe, flirty, respectful replies for a guy to send to a girl.
- No cringe, no cheesy pickup lines, no try-hard humor.
- Should sound like something a confident, normal guy would actually text.
- Keep it natural and light.`
    } else {
      prompt = `${basePrompt}

MODE: SPICY
Spice level: ${spiceLevel}/10
Give 3 bold, funny, unfiltered replies matching this spice level:
- 1-3 = playful and teasing
- 4-6 = flirty and confident
- 7-8 = spicy and forward
- 9-10 = unhinged, chaotic, but never illegal, never explicit, never degrading.
Stay funny and bold, not creepy.`
    }

    // 3. Call Gemini with timeout protection
    console.log("🤖 Calling Gemini...")
    let rawReply = ""
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" })

      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Gemini API timeout after 30s")), 30000)
      )

      const resultPromise = model.generateContent(prompt)
      const result = await Promise.race([resultPromise, timeoutPromise])

      rawReply = result.response.text().trim()
      console.log("✅ Gemini responded:", rawReply.slice(0, 150).replace(/\n/g, " | "))
    } catch (geminiErr) {
      console.error("❌ Gemini error:", geminiErr.message)
      return res.status(500).json({ error: `Gemini failed: ${geminiErr.message}` })
    }

    // 4. Reject non-chat images
    if (rawReply.includes("NOT_A_CHAT")) {
      console.log("❌ Rejected: not a chat screenshot")
      return res.status(400).json({
        error: "This doesn't look like a chat screenshot. Please upload a DM conversation."
      })
    }

    // 5. Extra safety net against stray intros
    const bannedStarts = ["here are", "sure,", "sure!", "here's", "these are", "option"]
    const isBadLine = (line) =>
      bannedStarts.some(b => line.toLowerCase().startsWith(b))

    const replies = rawReply
      .split("\n")
      .map(r => r.trim())
      .filter(r => r.length > 0 && !isBadLine(r))

    console.log("✅ Final replies count:", replies.length)
    console.log("Replies:", replies)

    if (replies.length === 0) {
      return res.status(500).json({ error: "AI didn't return usable replies, try again" })
    }

    // 6. Send back
    res.json({
      replies, // array of clean replies, one per bubble
      extractedText: text.slice(0, 200) // debug only
    })

  } catch (err) {
    console.error("❌ ERROR:", err.message)
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Caliber server running on http://localhost:${PORT}`)
})
