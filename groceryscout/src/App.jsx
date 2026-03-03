import { useState, useEffect } from 'react'
import GroceryAgent from './GroceryAgent.jsx'

const KEY_STORAGE = 'groceryscout_api_key'

export default function App() {
  const [apiKey, setApiKey] = useState(() => localStorage.getItem(KEY_STORAGE) || '')
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [testing, setTesting] = useState(false)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Mono:wght@400;500&display=swap');
      @keyframes fadeIn { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      * { -webkit-tap-highlight-color: transparent; }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const handleSave = () => {
    const key = input.trim()
    if (!key.startsWith('sk-ant-')) {
      setError('That doesn\'t look like a valid Anthropic API key. It should start with sk-ant-')
      return
    }
    localStorage.setItem(KEY_STORAGE, key)
    setApiKey(key)
  }

  const handleClear = () => {
    localStorage.removeItem(KEY_STORAGE)
    setApiKey('')
    setInput('')
  }

  if (apiKey) return <GroceryAgent apiKey={apiKey} onClearKey={handleClear} />

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f0a', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Syne', sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 420, animation: 'fadeIn 0.5s ease' }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🛍️</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#a3e635', margin: '0 0 8px', letterSpacing: '-0.5px' }}>GroceryScout</h1>
          <p style={{ color: '#6b7a5a', fontSize: 13, fontFamily: "'DM Mono', monospace" }}>Best prices + coupons across 9 stores</p>
        </div>

        <div style={{ background: '#111407', border: '1px solid rgba(163,230,53,0.15)', borderRadius: 14, padding: 24 }}>
          <label style={{ display: 'block', fontSize: 11, fontFamily: "'DM Mono', monospace", color: '#6b7a5a', letterSpacing: 1, textTransform: 'uppercase', marginBottom: 10 }}>
            Anthropic API Key
          </label>
          <input
            type="password"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            placeholder="sk-ant-api03-..."
            style={{ width: '100%', background: '#0d0f0a', border: '1px solid rgba(163,230,53,0.2)', borderRadius: 8, padding: '12px 14px', color: '#e8f0d8', fontSize: 14, fontFamily: "'DM Mono', monospace", marginBottom: 12, outline: 'none' }}
          />

          {error && (
            <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '10px 14px', color: '#ff8080', fontSize: 12, fontFamily: "'DM Mono', monospace", marginBottom: 12, lineHeight: 1.5 }}>
              ⚠ {error}
            </div>
          )}

          <button
            onClick={handleSave}
            disabled={testing || !input.trim()}
            style={{ width: '100%', background: testing || !input.trim() ? 'rgba(163,230,53,0.3)' : '#a3e635', color: testing || !input.trim() ? '#6b7a5a' : '#0d0f0a', border: 'none', borderRadius: 8, padding: '13px', fontFamily: "'Syne', sans-serif", fontWeight: 700, fontSize: 14, cursor: testing || !input.trim() ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {testing ? (
              <><span style={{ width: 14, height: 14, border: '2px solid #6b7a5a', borderTopColor: '#a3e635', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Verifying...</>
            ) : 'Save & Launch App'}
          </button>

          <div style={{ marginTop: 20, padding: '14px', background: 'rgba(163,230,53,0.04)', borderRadius: 8, border: '1px solid rgba(163,230,53,0.08)' }}>
            <p style={{ margin: '0 0 6px', fontSize: 12, color: '#6b7a5a', fontFamily: "'DM Mono', monospace", lineHeight: 1.6 }}>
              🔒 Your key is stored only on this device and never sent anywhere except directly to Anthropic.
            </p>
            <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noreferrer" style={{ fontSize: 12, color: '#a3e635', fontFamily: "'DM Mono', monospace" }}>
              Get your API key →
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
