import '../styles/Home.css'
import axios from "axios"
import { useState } from 'react'

const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    <path d="M9 12l2 2 4-4" />
  </svg>
)

const FlameIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2c1 3-3 4.5-3 8.5a3 3 0 006 0c0-1.2-.8-2-1.2-3 2.2 1.3 4.2 4 4.2 6.8a6 6 0 11-12 0C6 9 9 6 12 2z" />
  </svg>
)

const MicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="2" width="6" height="11" rx="3" />
    <path d="M5 11a7 7 0 0014 0" />
    <path d="M12 18v4M9 22h6" />
  </svg>
)

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 15V4M12 4L7.5 8.5M12 4l4.5 4.5" />
    <path d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2" />
  </svg>
)

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="12" height="12" rx="2" />
    <path d="M5 15V5a2 2 0 012-2h10" />
  </svg>
)

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
)

const MODES = [
  { id: 'safe', label: 'Safe', Icon: ShieldIcon },
  { id: 'spice', label: 'Spice', Icon: FlameIcon },
  { id: 'roast', label: 'Roast', Icon: MicIcon },
]

export default function Home() {
  const [mode, setMode] = useState('safe')
  const [spiceLevel, setSpiceLevel] = useState(5)
  const [roastLevel, setRoastLevel] = useState(5)

  const [file, setFile] = useState(null)
  const [dragActive, setDragActive] = useState(false)
  const [replies, setReplies] = useState([])
  const [copiedIndex, setCopiedIndex] = useState(null)
  const [replyTime, setReplyTime] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = (f) => {
    if (f && f.type.startsWith('image/')) setFile(f)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragActive(false)
    handleFile(e.dataTransfer.files[0])
  }

  const stampTime = () =>
    setReplyTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))

  const handleCopy = (text, i) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(i)
    setTimeout(() => setCopiedIndex(null), 1500)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) return alert("Upload a screenshot first")

    setLoading(true)
    setReplies([])
    const formData = new FormData()
    formData.append('screenshot', file)
    formData.append('mode', mode)
    if (mode === 'spice') formData.append('spiceLevel', spiceLevel)
    if (mode === 'roast') formData.append('roastLevel', roastLevel)

    try {
      const res = await axios.post('/api/upload', formData)
      setReplies(res.data.replies)
      stampTime()
    } catch (err) {
      const msg = err.response?.data?.error || err.message
      setReplies(['Error: ' + msg])
      stampTime()
    }
    setLoading(false)
  }

  const level = mode === 'spice' ? spiceLevel : roastLevel
  const setLevel = mode === 'spice' ? setSpiceLevel : setRoastLevel
  const fillPct = ((level - 1) / 9) * 100

  return (
    <div className="page">
      <nav className="navbar">
        <div className="nav-brand">
          <span className="nav-mark">C</span>
          Caliber
        </div>
        <span className="nav-badge">Beta</span>
      </nav>

      <div className="content">
        <header className="header">
          <h1>Get the perfect reply</h1>
          <p>Upload a screenshot. Pick your tone. Done.</p>
        </header>

        <div className="mode-grid">
          {MODES.map(({ id, label, Icon }) => (
            <button
              key={id}
              type="button"
              className={`mode-card mode-${id} ${mode === id ? 'active' : ''}`}
              onClick={() => setMode(id)}
            >
              <span className="mode-icon"><Icon /></span>
              <span className="mode-name">{label}</span>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label
            className={`upload-zone ${dragActive ? 'drag-active' : ''} ${file ? 'has-file' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragActive(true) }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
          >
            <input
              type="file"
              accept="image/*"
              onChange={(e) => handleFile(e.target.files[0])}
              hidden
            />
            <span className="upload-icon"><UploadIcon /></span>
            <span className="upload-title">{file ? file.name : 'Drop screenshot here'}</span>
            <span className="upload-sub">{file ? 'Tap to replace' : 'or tap to browse'}</span>
          </label>

          <div className="controls-wrap">
            {(mode === 'spice' || mode === 'roast') && (
              <div className={`slider-section slider-${mode} fade-in`} key={mode}>
                <div className="slider-label-row">
                  <span className="slider-label">{mode === 'spice' ? 'Spice Meter' : 'Roast Meter'}</span>
                  <span className="slider-value">{level}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={level}
                  onChange={(e) => setLevel(Number(e.target.value))}
                  className="slider"
                  style={{ '--fill': `${fillPct}%` }}
                />
                <div className="slider-scale">
                  <span>Mild</span>
                  <span>Extreme</span>
                </div>
              </div>
            )}

            {mode === 'safe' && (
              <p className="hint fade-in" key="safe">Safe mode — play it clean, not unhinged.</p>
            )}
          </div>

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Generating' : 'Generate Reply'}
          </button>
        </form>

        {loading && (
          <div className="bubble-wrap fade-in">
            <span className="avatar skeleton-block" />
            <div className="bubble skeleton-bubble">
              <span className="skeleton-dot" />
              <span className="skeleton-dot" />
              <span className="skeleton-dot" />
            </div>
          </div>
        )}

{!loading && replies.length > 0 && (
          <div className="replies-container fade-in">
            {replies.map((r, i) => (
              <div className="bubble-wrap" key={i}>
                <span className="avatar">C</span>
                <div className="bubble">
                  <div className="bubble-head">
                    <span className="bubble-sender">Caliber</span>
                    <span className="bubble-time">{replyTime}</span>
                  </div>
                  <p>{r}</p>
                  <button
                    type="button"
                    className={`copy-btn ${copiedIndex === i ? 'copied' : ''}`}
                    onClick={() => handleCopy(r, i)}
                  >
                    {copiedIndex === i ? <CheckIcon /> : <CopyIcon />}
                    {copiedIndex === i ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
