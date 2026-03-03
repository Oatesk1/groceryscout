import { useState, useRef, useEffect } from 'react'

const STORE_COLORS = {
  Walmart: '#0071CE', Kroger: '#E31837', Target: '#CC0000',
  'Whole Foods': '#00674B', Aldi: '#00387A', Costco: '#005DAA',
  Ralphs: '#C8102E', Pavilions: '#6A1B9A', 'Amazon Fresh': '#FF9900',
}

const STORE_EMOJIS = {
  Walmart: '🔵', Kroger: '🔴', Target: '🎯', 'Whole Foods': '🌿',
  Aldi: '🛒', Costco: '📦', Ralphs: '🏪', Pavilions: '🟣', 'Amazon Fresh': '🟠',
}

const SOURCE_TYPE_STYLES = {
  store:        { bg: 'rgba(0,113,206,0.12)', border: 'rgba(0,113,206,0.3)', color: '#60a5fa', label: 'Store Deal' },
  app:          { bg: 'rgba(255,153,0,0.12)', border: 'rgba(255,153,0,0.3)', color: '#fbbf24', label: 'App Rebate' },
  manufacturer: { bg: 'rgba(163,230,53,0.1)', border: 'rgba(163,230,53,0.25)', color: '#a3e635', label: 'Manufacturer' },
  loyalty:      { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)', color: '#c084fc', label: 'Loyalty' },
}

function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
      {[0,1,2].map(i => <span key={i} style={{ width:6, height:6, borderRadius:'50%', background:'#a3e635', animation:`bounce 1.2s ease-in-out ${i*0.2}s infinite` }} />)}
    </span>
  )
}

function parseJSON(text) {
  try { return JSON.parse(text.replace(/```json|```/g,'').trim()) } catch {}
  const m = text.match(/(\{[\s\S]*\})/)
  if (m) { try { return JSON.parse(m[1]) } catch {} }
  return null
}

export default function GroceryAgent({ apiKey, onClearKey }) {
  const [inputText, setInputText] = useState('')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [coupons, setCoupons] = useState(null)
  const [error, setError] = useState(null)
  const [statusMsg, setStatusMsg] = useState('')
  const [activeTab, setActiveTab] = useState('prices')
  const textareaRef = useRef(null)

  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      @keyframes bounce { 0%,80%,100%{transform:scale(0.6);opacity:0.4} 40%{transform:scale(1);opacity:1} }
      @keyframes fadeSlideIn { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
      @keyframes spin { to{transform:rotate(360deg)} }
      .result-card { animation: fadeSlideIn 0.5s ease both; }
      .coupon-card { animation: fadeSlideIn 0.5s ease both; }
      textarea:focus { outline: none; }
      input:focus { outline: none; }
    `
    document.head.appendChild(style)
    return () => document.head.removeChild(style)
  }, [])

  const callClaude = async (prompt) => {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] }),
    })
    const data = await res.json()
    if (data.error) throw new Error(data.error.message)
    return data.content?.map(c => c.text || '').join('') || ''
  }

  const fetchPrices = async (items) => {
    const text = await callClaude(`You are a grocery price comparison assistant. The user wants to buy: ${items.join(', ')}.

For each item, provide realistic estimated prices at: Walmart, Kroger, Target, Whole Foods, Aldi, Costco, Ralphs, Pavilions, Amazon Fresh.
Ralphs and Pavilions are Southern California chains. Prices should be realistic and vary by store.

Respond ONLY with raw JSON, no markdown, no explanation:
{"results":[{"item":"item name","unit":"e.g. per lb","prices":{"Walmart":2.49,"Kroger":2.79,"Target":2.99,"Whole Foods":3.49,"Aldi":1.99,"Costco":null,"Ralphs":2.89,"Pavilions":3.19,"Amazon Fresh":2.69},"bestStore":"Aldi","bestPrice":1.99,"tip":"brief tip"}],"summary":"1-2 sentence summary"}

Use null if a store doesn't carry the item comparably.`)
    const parsed = parseJSON(text)
    if (!parsed) throw new Error('Could not parse prices')
    return parsed
  }

  const fetchCoupons = async (items) => {
    const text = await callClaude(`You are a grocery coupon expert. The user is shopping for: ${items.join(', ')}.

Generate realistic coupons available at US grocery stores (Walmart, Kroger, Target, Whole Foods, Ralphs, Pavilions, Amazon Fresh, Ibotta, Fetch, manufacturers, loyalty programs).

Respond ONLY with raw JSON, no markdown, no explanation:
{"coupons":[{"item":"item name","discount":"$0.75 off","discountValue":0.75,"source":"Kroger Digital Coupon","sourceType":"store","code":"SAVE75 or null","expiry":"End of month","howToRedeem":"Clip in Kroger app"}],"totalCouponSavings":3.50,"couponSummary":"1 sentence summary"}

sourceType must be one of: store, app, manufacturer, loyalty.
Generate 1-3 realistic coupons per item where applicable. Omit items with no realistic coupon.`)
    const parsed = parseJSON(text)
    if (!parsed) throw new Error('Could not parse coupons')
    return parsed
  }

  const addItem = () => {
    const trimmed = inputText.trim()
    if (!trimmed) return
    setItems(prev => [...prev, ...trimmed.split(/[\n,]+/).map(s => s.trim()).filter(Boolean)])
    setInputText('')
    textareaRef.current?.focus()
  }

  const removeItem = (idx) => setItems(prev => prev.filter((_, i) => i !== idx))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addItem() }
  }

  const handleSearch = async () => {
    if (!items.length) return
    setLoading(true); setError(null); setResults(null); setCoupons(null)
    setActiveTab('prices'); setStatusMsg('Scanning prices & hunting coupons...')
    try {
      const [priceData, couponData] = await Promise.all([fetchPrices(items), fetchCoupons(items)])
      setResults(priceData); setCoupons(couponData); setStatusMsg('')
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally { setLoading(false) }
  }

  const totalSavings = results?.results?.reduce((acc, r) => {
    const prices = Object.values(r.prices).filter(p => p !== null)
    return acc + (Math.max(...prices) - r.bestPrice)
  }, 0) || 0
  const couponSavings = coupons?.totalCouponSavings || 0
  const couponCount = coupons?.coupons?.length || 0

  return (
    <div style={{ minHeight:'100vh', background:'#0d0f0a', fontFamily:"'Syne', sans-serif", color:'#e8f0d8' }}>
      {/* Header */}
      <div style={{ background:'linear-gradient(135deg,#0d0f0a,#141a0e,#0d0f0a)', borderBottom:'1px solid rgba(163,230,53,0.15)', padding:'20px 16px 16px', position:'sticky', top:0, zIndex:10 }}>
        <div style={{ maxWidth:760, margin:'0 auto', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ fontSize:22 }}>🛍️</span>
            <h1 style={{ margin:0, fontSize:20, fontWeight:800, color:'#a3e635', letterSpacing:'-0.5px' }}>GroceryScout</h1>
            <span style={{ background:'rgba(163,230,53,0.12)', border:'1px solid rgba(163,230,53,0.3)', borderRadius:4, padding:'2px 7px', fontSize:9, fontFamily:"'DM Mono',monospace", color:'#a3e635', letterSpacing:1 }}>AI</span>
          </div>
          <button onClick={onClearKey} style={{ background:'none', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'5px 10px', color:'#4a5640', fontSize:11, fontFamily:"'DM Mono',monospace", cursor:'pointer' }}>
            ⚙ API Key
          </button>
        </div>
      </div>

      <div style={{ maxWidth:760, margin:'0 auto', padding:'16px' }}>
        {/* Input */}
        <div style={{ background:'#111407', border:'1px solid rgba(163,230,53,0.12)', borderRadius:12, padding:16, marginBottom:12 }}>
          <div style={{ display:'flex', gap:8 }}>
            <textarea
              ref={textareaRef}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add grocery items e.g. milk, eggs, bread..."
              rows={2}
              style={{ flex:1, background:'#0d0f0a', border:'1px solid rgba(163,230,53,0.2)', borderRadius:8, padding:'10px 12px', color:'#e8f0d8', fontSize:15, fontFamily:"'Syne',sans-serif", resize:'none', lineHeight:1.5 }}
            />
            <button onClick={addItem} style={{ background:'#a3e635', color:'#0d0f0a', border:'none', borderRadius:8, padding:'0 16px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:13, cursor:'pointer', whiteSpace:'nowrap' }}>
              + Add
            </button>
          </div>
          <p style={{ margin:'6px 0 0', fontSize:11, color:'#4a5640', fontFamily:"'DM Mono',monospace" }}>Enter to add · Comma-separate multiple items</p>
        </div>

        {/* Item chips */}
        {items.length > 0 && (
          <div style={{ background:'#111407', border:'1px solid rgba(163,230,53,0.12)', borderRadius:12, padding:16, marginBottom:12 }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
              <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", color:'#6b7a5a', letterSpacing:1, textTransform:'uppercase' }}>
                {items.length} item{items.length !== 1 ? 's' : ''}
              </span>
              <button onClick={() => setItems([])} style={{ background:'none', border:'none', color:'#4a5640', fontSize:11, fontFamily:"'DM Mono',monospace", cursor:'pointer', padding:0 }}>clear all</button>
            </div>
            <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginBottom:14 }}>
              {items.map((item, idx) => (
                <div key={idx} style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(163,230,53,0.07)', border:'1px solid rgba(163,230,53,0.18)', borderRadius:6, padding:'5px 10px' }}>
                  <span style={{ fontSize:13, color:'#d4e8a0' }}>{item}</span>
                  <button onClick={() => removeItem(idx)} style={{ background:'none', border:'none', color:'#6b7a5a', cursor:'pointer', padding:'0 2px', fontSize:15, lineHeight:1 }}>×</button>
                </div>
              ))}
            </div>
            <button
              onClick={handleSearch}
              disabled={loading}
              style={{ width:'100%', background:loading ? 'rgba(163,230,53,0.3)' : '#a3e635', color:loading ? '#6b7a5a' : '#0d0f0a', border:'none', borderRadius:8, padding:'13px', fontFamily:"'Syne',sans-serif", fontWeight:700, fontSize:14, cursor:loading ? 'not-allowed' : 'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:10 }}
            >
              {loading
                ? <><span style={{ width:14, height:14, border:'2px solid #6b7a5a', borderTopColor:'#a3e635', borderRadius:'50%', animation:'spin 0.8s linear infinite', display:'inline-block' }} />{statusMsg}<LoadingDots /></>
                : '🔍 Find Best Prices & Coupons'
              }
            </button>
          </div>
        )}

        {error && (
          <div style={{ background:'rgba(255,80,80,0.08)', border:'1px solid rgba(255,80,80,0.2)', borderRadius:8, padding:'12px 14px', color:'#ff8080', fontSize:13, marginBottom:12, fontFamily:"'DM Mono',monospace" }}>
            ⚠ {error}
          </div>
        )}

        {/* Results */}
        {(results || coupons) && (
          <div>
            {/* Summary */}
            <div style={{ background:'rgba(163,230,53,0.06)', border:'1px solid rgba(163,230,53,0.2)', borderRadius:12, padding:'14px 16px', marginBottom:12, display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ display:'flex', gap:16 }}>
                {[['Price Savings', `$${totalSavings.toFixed(2)}`, '#a3e635'], ['Coupons', `$${couponSavings.toFixed(2)}`, '#fbbf24'], ['Total', `$${(totalSavings+couponSavings).toFixed(2)}`, '#e8f0d8']].map(([label, val, color]) => (
                  <div key={label}>
                    <div style={{ fontSize:10, color:'#6b7a5a', fontFamily:"'DM Mono',monospace", letterSpacing:1, textTransform:'uppercase', marginBottom:1 }}>{label}</div>
                    <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
                  </div>
                ))}
              </div>
              <p style={{ margin:0, fontSize:12, color:'#9aad7a', lineHeight:1.6, flex:1, minWidth:160 }}>{results?.summary}</p>
            </div>

            {/* Tabs */}
            <div style={{ display:'flex', gap:4, marginBottom:12, background:'#111407', border:'1px solid rgba(163,230,53,0.1)', borderRadius:10, padding:4 }}>
              {[{id:'prices', label:'💰 Prices', count:results?.results?.length||0},{id:'coupons', label:'✂️ Coupons', count:couponCount}].map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                  flex:1, padding:'10px', borderRadius:7, fontFamily:"'Syne',sans-serif", fontWeight:600, fontSize:13, cursor:'pointer', transition:'all 0.2s',
                  background: activeTab===tab.id ? (tab.id==='coupons' ? 'rgba(251,191,36,0.12)' : 'rgba(163,230,53,0.1)') : 'transparent',
                  color: activeTab===tab.id ? (tab.id==='coupons' ? '#fbbf24' : '#a3e635') : '#6b7a5a',
                  border: activeTab===tab.id ? `1px solid ${tab.id==='coupons' ? 'rgba(251,191,36,0.3)' : 'rgba(163,230,53,0.25)'}` : '1px solid transparent',
                }}>
                  {tab.label} <span style={{ marginLeft:6, fontSize:11, fontFamily:"'DM Mono',monospace", opacity:0.7 }}>{tab.count}</span>
                </button>
              ))}
            </div>

            {/* Prices Tab */}
            {activeTab === 'prices' && (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {results?.results?.map((r, idx) => {
                  const prices = Object.entries(r.prices).filter(([,v]) => v !== null)
                  const maxPrice = Math.max(...prices.map(([,v]) => v))
                  return (
                    <div key={idx} className="result-card" style={{ animationDelay:`${idx*0.07}s`, background:'#111407', border:'1px solid rgba(163,230,53,0.1)', borderRadius:12, padding:16 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                        <div>
                          <div style={{ fontWeight:700, fontSize:15, color:'#e8f0d8', marginBottom:2 }}>{r.item}</div>
                          <div style={{ fontSize:11, color:'#4a5640', fontFamily:"'DM Mono',monospace" }}>{r.unit}</div>
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(163,230,53,0.1)', border:'1px solid rgba(163,230,53,0.25)', borderRadius:6, padding:'4px 10px' }}>
                          <span style={{ fontSize:11 }}>{STORE_EMOJIS[r.bestStore]}</span>
                          <span style={{ fontWeight:700, color:'#a3e635', fontSize:14, fontFamily:"'DM Mono',monospace" }}>${r.bestPrice?.toFixed(2)}</span>
                          <span style={{ fontSize:11, color:'#6b7a5a' }}>{r.bestStore}</span>
                        </div>
                      </div>
                      <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                        {prices.sort(([,a],[,b]) => a-b).map(([store, price]) => {
                          const isBest = store === r.bestStore
                          return (
                            <div key={store} style={{ display:'flex', alignItems:'center', gap:8 }}>
                              <div style={{ width:70, fontSize:11, color:isBest?'#a3e635':'#6b7a5a', fontFamily:"'DM Mono',monospace", textAlign:'right', flexShrink:0 }}>
                                {store.length > 9 ? store.slice(0,8)+'…' : store}
                              </div>
                              <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
                                <div style={{ height:'100%', width:`${(price/maxPrice)*100}%`, background:isBest?'#a3e635':`${STORE_COLORS[store]}88`, borderRadius:3 }} />
                              </div>
                              <div style={{ width:44, fontSize:12, color:isBest?'#a3e635':'#9aad7a', fontFamily:"'DM Mono',monospace", fontWeight:isBest?600:400, flexShrink:0 }}>
                                ${price.toFixed(2)}
                              </div>
                              {isBest && <span style={{ fontSize:10, color:'#a3e635' }}>★</span>}
                            </div>
                          )
                        })}
                      </div>
                      {r.tip && <div style={{ marginTop:10, padding:'7px 12px', background:'rgba(163,230,53,0.04)', borderLeft:'2px solid rgba(163,230,53,0.3)', borderRadius:'0 4px 4px 0', fontSize:12, color:'#6b7a5a', fontStyle:'italic' }}>💡 {r.tip}</div>}
                    </div>
                  )
                })}
              </div>
            )}

            {/* Coupons Tab */}
            {activeTab === 'coupons' && (
              <div>
                {coupons?.couponSummary && <div style={{ background:'rgba(251,191,36,0.06)', border:'1px solid rgba(251,191,36,0.18)', borderRadius:10, padding:'10px 14px', marginBottom:10, fontSize:13, color:'#fbbf24' }}>🎉 {coupons.couponSummary}</div>}
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {coupons?.coupons?.map((coupon, idx) => {
                    const s = SOURCE_TYPE_STYLES[coupon.sourceType] || SOURCE_TYPE_STYLES.manufacturer
                    return (
                      <div key={idx} className="coupon-card" style={{ animationDelay:`${idx*0.07}s`, background:'#111407', border:'1px solid rgba(163,230,53,0.08)', borderRadius:12, padding:14, display:'flex', gap:12 }}>
                        <div style={{ flexShrink:0, width:72, textAlign:'center', background:s.bg, border:`1px solid ${s.border}`, borderRadius:8, padding:'10px 6px', display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <div style={{ fontSize:13, fontWeight:800, color:s.color, fontFamily:"'DM Mono',monospace", lineHeight:1.3, wordBreak:'break-word' }}>{coupon.discount}</div>
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4, flexWrap:'wrap' }}>
                            <span style={{ fontWeight:700, fontSize:14, color:'#e8f0d8' }}>{coupon.item}</span>
                            <span style={{ fontSize:9, background:s.bg, border:`1px solid ${s.border}`, color:s.color, borderRadius:4, padding:'2px 6px', fontFamily:"'DM Mono',monospace", letterSpacing:0.5, textTransform:'uppercase' }}>{s.label}</span>
                          </div>
                          <div style={{ fontSize:13, fontWeight:600, color:'#c4d99a', marginBottom:3 }}>{coupon.source}</div>
                          <div style={{ fontSize:12, color:'#6b7a5a', marginBottom:6, lineHeight:1.5 }}>{coupon.howToRedeem}</div>
                          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
                            <span style={{ fontSize:11, color:'#4a5640', fontFamily:"'DM Mono',monospace" }}>⏱ {coupon.expiry}</span>
                            {coupon.code && <span style={{ fontSize:11, fontFamily:"'DM Mono',monospace", background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:4, padding:'2px 8px', color:'#9aad7a', letterSpacing:1 }}>{coupon.code}</span>}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p style={{ textAlign:'center', fontSize:11, color:'#3a4430', fontFamily:"'DM Mono',monospace", marginTop:16, paddingBottom:24 }}>
              AI-estimated. Verify prices & coupons in-store or on store apps before shopping.
            </p>
          </div>
        )}

        {!items.length && !results && (
          <div style={{ textAlign:'center', padding:'56px 24px', color:'#3a4430' }}>
            <div style={{ fontSize:48, marginBottom:14 }}>🥦</div>
            <div style={{ fontSize:14, fontFamily:"'DM Mono',monospace" }}>Add items above to find prices and coupons</div>
          </div>
        )}
      </div>
    </div>
  )
}
