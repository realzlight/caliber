import '../styles/Home.css'
import axios from "axios"
import { useState } from 'react'

export default function Home(){
  const [mode, setMode] = useState('safe') // 'safe' or 'spice'
  const [spiceLevel, setSpiceLevel] = useState(5)
  const [file, setFile] = useState(null)
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if(!file) return alert("Upload a screenshot first")

    setLoading(true)
    const formData = new FormData()
    formData.append('screenshot', file)
    formData.append('mode', mode)
    if(mode === 'spice') formData.append('spiceLevel', spiceLevel)

    try {
      const res = await axios.post('/api/upload', formData)
      setReply(res.data.reply)
    } catch (err) {
      setReply('Error: ' + err.message)
    }
    setLoading(false)
  }

  return (
    <div className="home-container">
      <h1>Caliber 📸</h1>
      <p>Upload chat screenshot. Get perfect replies.</p>

      {/* MODE SELECTOR */}
      <div className="mode-toggle">
        <button
          type="button"
          className={mode === 'safe'? 'active' : ''}
          onClick={() => setMode('safe')}
        >
          Safe
        </button>
        <button
          type="button"
          className={mode === 'spice'? 'active' : ''}
          onClick={() => setMode('spice')}
        >
          Spice
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <label>
          Upload Chat Screenshot
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files[0])}
            required
          />
        </label>

        {/* Only show slider if Spice is selected */}
        {mode === 'spice' && (
          <label>
            Spice Meter: {spiceLevel}/10
            <input
              type="range"
              min="1"
              max="10"
              value={spiceLevel}
              onChange={(e) => setSpiceLevel(e.target.value)}
            />
          </label>
        )}

        {mode === 'safe' && (
          <p className="hint">Safe Mode: Girl-friendly rizz only 💅</p>
        )}

        <button type="submit" disabled={loading}>
          {loading? 'Cooking reply...' : 'Generate Reply'}
        </button>
      </form>

      {reply && <div className="reply-box"><h2>Your Reply:</h2><p>{reply}</p></div>}
    </div>
  )
}