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

    // 1. Extract text from screenshot
    console.log("Reading screenshot...")
    const { data: { text } } = await Tesseract.recognize(req.file.buffer, "eng")
    
    if (!text || text.trim().length < 3) {
      return res.status(400).json({ error: "Couldn't read any text from image" })
    }

    // 2. Build prompt based on mode
    let prompt = ""
    if (mode === "safe") {
      prompt = `You are Caliber, a dating reply assistant. 
      Chat context: "${text}"
      Give 3 short, safe, flirty, respectful replies for a guy to send to a girl. 
      1 line each. No cringe. No pickup lines. Sound natural.`
    } else {
      prompt = `You are Caliber, a dating reply assistant. 
      Chat context: "${text}"
      Spice level: ${spiceLevel}/10
      Give 3 bold, funny, unfiltered replies. 
      Spice 1-3 = playful, 4-6 = flirty, 7-8 = spicy, 9-10 = unhinged but not illegal.
      1 line each.`
    }

    // 3. Call Gemini
    console.log("Calling Gemini...")
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })
    const result = await model.generateContent(prompt)
    const aiReply = result.response.text()

    // 4. Send back
    res.json({ 
      reply: aiReply,
      extractedText: text.slice(0, 200) // just for debugging
    })

  } catch (err) {
    console.error(err)
    res.status(500).json({ error: err.message })
  }
})

app.listen(PORT, () => {
  console.log(`Caliber server running on http://localhost:${PORT}`)
})