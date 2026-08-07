
<div align="center">

# Caliber

**USAGE**
caliberx.vercel.app

**Upload a chat screenshot. Get the perfect reply.**

Caliber reads your DM screenshots and generates context-aware replies — tuned to whatever tone you need, from respectful to ruthless.

</div>

---

## What it does

Caliber takes a screenshot of a text conversation, extracts the text via OCR, and uses AI to generate three ready-to-send replies based on the mode and intensity you pick.

**Modes:**
- **Safe** — clean, respectful, confident replies
- **Spice** — bold and flirty, adjustable heat (1–10)
- **Roast** — savage comebacks, adjustable intensity (1–10)

## Features

- 📷 Drag-and-drop screenshot upload with OCR text extraction
- 🎚️ Live intensity sliders for Spice and Roast modes
- 💬 Instagram-style message bubbles for each generated reply
- 📋 One-tap copy with success animation
- 🌓 Dark, minimal UI with a bottom-sheet mode selector
- ⚡ Skeleton loading states while replies generate

## Tech Stack

**Frontend**
- React + Vite
- Axios
- Custom CSS (dark mode, Geist typography)

**Backend**
- Node.js + Express
- Multer (in-memory file uploads)
- Tesseract.js (OCR)
- Google Gemini API (reply generation)

**Deployment**
- Frontend → Vercel
- Backend → Railway

## How it works

1. User uploads a chat screenshot
2. Backend extracts text via Tesseract.js OCR
3. Extracted text + selected mode/intensity is sent to Gemini
4. Gemini validates it's an actual chat conversation, then generates 3 tailored replies
5. Replies are parsed, cleaned, and returned to the frontend
6. Each reply renders as its own bubble with a copy button

### Installation

```bash
git clone https://github.com/realzlight/caliber.git
cd caliber
