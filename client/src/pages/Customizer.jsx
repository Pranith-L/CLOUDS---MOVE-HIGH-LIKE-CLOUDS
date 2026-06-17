import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { fabric } from 'fabric'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import './Customizer.css'

const TEE_COLORS = {
  black: { hex: '#0a0a0a', label: 'Black', printAreaBg: 'rgba(255,255,255,0.06)' },
  blue:  { hex: '#2563a8', label: 'Blue',  printAreaBg: 'rgba(255,255,255,0.1)'  },
  beige: { hex: '#d4b896', label: 'Beige', printAreaBg: 'rgba(0,0,0,0.06)'       },
  white: { hex: '#f8f8f8', label: 'White', printAreaBg: 'rgba(0,0,0,0.05)'       },
}

const STICKERS = ['⭐','🔥','💎','☁','🌊','🦋','🎯','✦','◆','❋','⚡','🌙','🎨','🏆','🎸']
const FONTS = ['Outfit','Georgia','Courier New','Impact','Brush Script MT','Arial Black']
const SIZES = ['XS','S','M','L','XL','XXL']

function TeeBgSVG({ color }) {
  const isWhite = color === '#f8f8f8'
  return (
    <svg viewBox="0 0 400 460" fill="none" xmlns="http://www.w3.org/2000/svg" className="tee-bg-svg">
      <path d="M144 32 C160 64 184 80 200 80 C216 80 240 64 256 32 L340 72 L376 196 L308 216 L308 440 L92 440 L92 216 L24 196 L60 72 Z"
        fill={color} stroke={isWhite ? '#ccc' : color === '#0a0a0a' ? '#1e1e1e' : 'rgba(0,0,0,0.08)'} strokeWidth="2" />
    </svg>
  )
}

export default function Customizer() {
  const { color: routeColor } = useParams()
  const navigate = useNavigate()
  const { addItem } = useCart()
  const { user } = useAuth()

  const [teeColor, setTeeColor] = useState(routeColor in TEE_COLORS ? routeColor : 'black')
  const [side, setSide] = useState('front')
  const [activeTab, setActiveTab] = useState('text')
  const [size, setSize] = useState('M')
  const [added, setAdded] = useState(false)

  const frontCanvasRef = useRef(null)
  const backCanvasRef  = useRef(null)
  const frontFabric = useRef(null)
  const backFabric  = useRef(null)

  const [textInput, setTextInput] = useState('')
  const [textColor, setTextColor] = useState('#ffffff')
  const [fontSize, setFontSize] = useState(28)
  const [fontFamily, setFontFamily] = useState('Outfit')
  const [textBold, setTextBold] = useState(false)

  const [aiPrompt, setAiPrompt] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState('')
  const [aiImage, setAiImage] = useState(null)

  const fileRef = useRef(null)

  const getCanvas = useCallback(() => side === 'front' ? frontFabric.current : backFabric.current, [side])

  const updateActiveText = (key, val) => {
    const canvas = getCanvas()
    const obj = canvas?.getActiveObject()
    if (obj && obj.type === 'i-text') {
      obj.set(key, val)
      canvas.renderAll()
    }
  }

  useEffect(() => {
    frontFabric.current = new fabric.Canvas(frontCanvasRef.current, {
      width: 280, height: 320,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    })
    backFabric.current = new fabric.Canvas(backCanvasRef.current, {
      width: 280, height: 320,
      backgroundColor: 'transparent',
      preserveObjectStacking: true,
    })
    return () => {
      frontFabric.current?.dispose()
      backFabric.current?.dispose()
    }
  }, [])

  useEffect(() => {
    const handleSelection = (e) => {
      const obj = e.selected?.[0] || getCanvas()?.getActiveObject()
      if (obj && obj.type === 'i-text') {
        if (obj.text) setTextInput(obj.text)
        if (obj.fill) setTextColor(obj.fill)
        if (obj.fontSize) setFontSize(obj.fontSize)
        if (obj.fontFamily) setFontFamily(obj.fontFamily)
        if (obj.fontWeight) setTextBold(obj.fontWeight === 'bold')
      }
    }
    const fCanvas = frontFabric.current
    const bCanvas = backFabric.current
    
    fCanvas?.on('selection:created', handleSelection)
    fCanvas?.on('selection:updated', handleSelection)
    bCanvas?.on('selection:created', handleSelection)
    bCanvas?.on('selection:updated', handleSelection)

    return () => {
      fCanvas?.off('selection:created', handleSelection)
      fCanvas?.off('selection:updated', handleSelection)
      bCanvas?.off('selection:created', handleSelection)
      bCanvas?.off('selection:updated', handleSelection)
    }
  }, [side, getCanvas])

  const addText = () => {
    const canvas = getCanvas()
    if (!canvas) return
    const text = new fabric.IText(textInput || 'YOUR TEXT', {
      left: 80, top: 100,
      fontSize, fontFamily,
      fill: textColor,
      fontWeight: textBold ? 'bold' : 'normal',
      editable: true,
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const deleteSelected = () => {
    const canvas = getCanvas()
    const obj = canvas?.getActiveObject()
    if (obj) { canvas.remove(obj); canvas.renderAll() }
  }

  const clearCanvas = () => {
    const canvas = getCanvas()
    canvas?.clear()
    canvas?.renderAll()
  }

  const handleImageUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const canvas = getCanvas()
    const reader = new FileReader()
    reader.onload = (ev) => {
      fabric.Image.fromURL(ev.target.result, (img) => {
        img.scaleToWidth(160)
        img.set({ left: 60, top: 80 })
        canvas.add(img)
        canvas.setActiveObject(img)
        canvas.renderAll()
      })
    }
    reader.readAsDataURL(file)
  }

  const addSticker = (s) => {
    const canvas = getCanvas()
    if (!canvas) return
    const text = new fabric.Text(s, {
      left: 110, top: 130,
      fontSize: 48,
      fontFamily: 'Segoe UI Emoji, Arial',
    })
    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  const generateAI = async () => {
    if (!aiPrompt.trim()) return
    if (!user) { navigate('/login'); return }
    setAiLoading(true); setAiError(''); setAiImage(null)
    try {
      const { data } = await axios.post('/api/ai/generate-image', { prompt: aiPrompt })
      setAiImage(data.image)
    } catch (err) {
      const msg = err.response?.data?.message || 'AI generation failed.'
      setAiError(msg)
    } finally { setAiLoading(false) }
  }

  const placeAIImage = () => {
    if (!aiImage) return
    const canvas = getCanvas()
    fabric.Image.fromURL(aiImage, (img) => {
      img.scaleToWidth(180)
      img.set({ left: 50, top: 70 })
      canvas.add(img)
      canvas.setActiveObject(img)
      canvas.renderAll()
    })
  }

  const handleAddToCart = async () => {
    const frontData = frontFabric.current?.toDataURL({ format: 'png', multiplier: 2 }) || null
    const backData  = backFabric.current?.toDataURL({ format: 'png', multiplier: 2 }) || null
    const frontObjs = frontFabric.current?.getObjects().length > 0
    const backObjs  = backFabric.current?.getObjects().length > 0

    const productMock = {
      _id: `${teeColor}-tee`,
      name: `CLOUDS ${TEE_COLORS[teeColor].label} Tee`,
      color: teeColor,
      colorHex: TEE_COLORS[teeColor].hex,
      price: 349,
    }

    addItem(productMock, size, 1, {
      frontImage: frontObjs ? frontData : null,
      backImage: backObjs ? backData : null,
      hasCustomization: frontObjs || backObjs,
    })

    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const colorConfig = TEE_COLORS[teeColor]

  return (
    <main className="customizer-page">
      <div className="container customizer-header">
        <div>
          <p className="subheading text-gradient">Design Studio</p>
          <h1 className="display-md">Customize Your Tee</h1>
        </div>
        <div className="cust-header-actions">
          <div className="size-row">
            <span className="size-label">Size:</span>
            {SIZES.map(s => (
              <button key={s} className={`prod-size-btn ${size === s ? 'active' : ''}`}
                onClick={() => setSize(s)} id={`cust-size-${s}`}>{s}</button>
            ))}
          </div>
          <button className={`btn ${added ? 'btn-dark' : 'btn-primary'} btn-lg`}
            onClick={handleAddToCart} id="cust-add-cart-btn">
            {added ? '✓ Added to Cart' : '+ Add to Cart'}
          </button>
        </div>
      </div>

      <div className="container customizer-layout">

        <div className="cust-panel glass">

          <div className="panel-section">
            <p className="panel-label">Tee Color</p>
            <div className="color-swatches">
              {Object.entries(TEE_COLORS).map(([k, v]) => (
                <button key={k}
                  className={`color-swatch-btn ${teeColor === k ? 'active' : ''}`}
                  style={{ background: v.hex, border: v.hex === '#f8f8f8' ? '1px solid #ccc' : 'none' }}
                  onClick={() => { setTeeColor(k); navigate(`/customize/${k}`, { replace: true }) }}
                  title={v.label} id={`swatch-${k}`}
                />
              ))}
            </div>
          </div>

          <div className="panel-section">
            <p className="panel-label">Side</p>
            <div className="side-toggle">
              <button className={`side-btn ${side === 'front' ? 'active' : ''}`} onClick={() => setSide('front')} id="toggle-front">Front</button>
              <button className={`side-btn ${side === 'back' ? 'active' : ''}`} onClick={() => setSide('back')} id="toggle-back">Back</button>
            </div>
          </div>

          <div className="panel-section">
            <div className="tool-tabs">
              {[['text','📝 Text'],['image','🖼 Image'],['ai','✨ AI Art'],['stickers','🏷 Stickers']].map(([k,l]) => (
                <button key={k} className={`tool-tab ${activeTab === k ? 'active' : ''}`}
                  onClick={() => setActiveTab(k)} id={`tab-${k}`}>{l}</button>
              ))}
            </div>

            {activeTab === 'text' && (
              <div className="tool-content">
                <textarea className="input text-area-input" rows={2}
                  value={textInput} onChange={e => {
                    setTextInput(e.target.value)
                    updateActiveText('text', e.target.value)
                  }}
                  placeholder="Type your text..." />
                <div className="tool-row">
                  <div className="tool-field">
                    <label>Color</label>
                    <input type="color" value={textColor} onChange={e => {
                      setTextColor(e.target.value)
                      updateActiveText('fill', e.target.value)
                    }} className="color-pick" />
                  </div>
                  <div className="tool-field">
                    <label>Size</label>
                    <input type="number" value={fontSize} min={10} max={80}
                      onChange={e => {
                        setFontSize(Number(e.target.value))
                        updateActiveText('fontSize', Number(e.target.value))
                      }} className="input num-input" />
                  </div>
                  <div className="tool-field">
                    <label>Bold</label>
                    <button className={`bold-btn ${textBold ? 'active' : ''}`} onClick={() => {
                      setTextBold(b => {
                        const next = !b
                        updateActiveText('fontWeight', next ? 'bold' : 'normal')
                        return next
                      })
                    }}>B</button>
                  </div>
                </div>
                <div className="tool-field" style={{ marginBottom: 0 }}>
                  <label>Font</label>
                  <select className="input" value={fontFamily} onChange={e => {
                    setFontFamily(e.target.value)
                    updateActiveText('fontFamily', e.target.value)
                  }}>
                    {FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                  </select>
                </div>
                <button className="btn btn-primary" onClick={addText} id="add-text-btn">Add New Text →</button>
              </div>
            )}

            {activeTab === 'image' && (
              <div className="tool-content">
                <div className="upload-zone" onClick={() => fileRef.current?.click()} id="upload-zone">
                  <span className="upload-icon">↑</span>
                  <p>Click to upload image</p>
                  <p className="caption">PNG, JPG, SVG supported</p>
                </div>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={handleImageUpload} />
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="tool-content">
                <p className="caption" style={{ marginBottom: 10, lineHeight: 1.6 }}>
                  Describe the artwork you want on your tee. AI will generate it for you.
                </p>
                <textarea className="input text-area-input" rows={3}
                  value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                  placeholder="e.g. a dragon breathing fire in watercolor style" />
                {aiError && <p className="ai-error">{aiError}</p>}
                {aiImage && (
                  <div className="ai-result">
                    <img src={aiImage} alt="AI generated" className="ai-preview" />
                    <button className="btn btn-primary" onClick={placeAIImage} id="place-ai-btn">Place on Tee →</button>
                  </div>
                )}
                <button className="btn btn-primary" onClick={generateAI}
                  disabled={aiLoading || !aiPrompt.trim()} id="generate-ai-btn">
                  {aiLoading ? <><span className="auth-spinner" /> Generating…</> : '✨ Generate AI Art'}
                </button>
                {!user && <p className="caption" style={{ color: 'var(--gold)', marginTop: 8 }}>
                  <Link to="/login">Sign in</Link> to use AI generation.
                </p>}
              </div>
            )}

            {activeTab === 'stickers' && (
              <div className="tool-content">
                <p className="caption" style={{ marginBottom: 12 }}>Click a sticker to add it to the canvas.</p>
                <div className="stickers-grid">
                  {STICKERS.map(s => (
                    <button key={s} className="sticker-btn" onClick={() => addSticker(s)} title={s}>{s}</button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="panel-section">
            <p className="panel-label">Canvas Actions</p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-ghost btn-sm" onClick={deleteSelected} id="delete-selected-btn">Delete Selected</button>
              <button className="btn btn-ghost btn-sm" onClick={clearCanvas} id="clear-canvas-btn">Clear All</button>
            </div>
          </div>
        </div>

        <div className="cust-preview">
          <div className="tee-preview-wrap" style={{ '--tee-color': colorConfig.hex }}>
            <div className="tee-bg-wrap">
              <TeeBgSVG color={colorConfig.hex} />
            </div>

            <div className={`canvas-overlay ${side === 'front' ? 'canvas-active' : 'canvas-hidden'}`}>
              <canvas ref={frontCanvasRef} id="front-canvas" />
            </div>

            <div className={`canvas-overlay ${side === 'back' ? 'canvas-active' : 'canvas-hidden'}`}>
              <canvas ref={backCanvasRef} id="back-canvas" />
            </div>

            <div className="tee-side-label">{side === 'front' ? 'FRONT' : 'BACK'}</div>
          </div>

          <div className="tee-preview-info">
            <span className="tee-preview-dot" style={{ background: colorConfig.hex, border: colorConfig.hex === '#f8f8f8' ? '1px solid #ccc' : 'none' }} />
            <span>{colorConfig.label} Tee</span>
            <span style={{ color: 'var(--muted)' }}>·</span>
            <span style={{ color: 'var(--gold)', fontWeight: 700 }}>₹349</span>
          </div>
        </div>

        <div className="cust-tips glass">
          <h3 className="panel-label" style={{ marginBottom: 20 }}>How to Use</h3>
          {[
            ['📝', 'Text', 'Add quotes or names using the Text tool.'],
            ['🖼', 'Image', 'Upload your own PNG or JPG design.'],
            ['✨', 'AI Art', 'Generate unique artwork with a text prompt.'],
            ['🏷', 'Stickers', 'Pick from preset emoji stickers.'],
            ['🔄', 'Move', 'Drag elements to reposition. Pinch to resize.'],
            ['🗑', 'Delete', 'Select an item and click Delete Selected.'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="tip-item">
              <span className="tip-icon">{icon}</span>
              <div><strong>{title}</strong><p className="caption">{desc}</p></div>
            </div>
          ))}
          <div className="tip-note">
            <span className="text-gradient">✦</span> Switch between Front & Back to customize both sides!
          </div>
        </div>
      </div>
    </main>
  )
}
