import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { TEE_IMAGES } from '../teeImages'
import './Home.css'

const HERO_SLIDES = [
  { id: 1, headline: 'MOVE HIGH', sub: 'LIKE CLOUDS', accent: 'Design your identity. Print your soul.', bg: 'linear-gradient(135deg,#0a0a0a 0%,#1a1008 60%,#0a0a0a 100%)', teeColor: '#0a0a0a', teeSlug: 'black', teeLabel: 'BLACK TEE' },
  { id: 2, headline: 'WEAR YOUR', sub: 'STORY', accent: 'AI-powered art generation for your tee.', bg: 'linear-gradient(135deg,#060d18 0%,#0d1f3c 60%,#060d18 100%)', teeColor: '#2563a8', teeSlug: 'blue', teeLabel: 'BLUE TEE' },
  { id: 3, headline: 'PRINT YOUR', sub: 'VISION', accent: 'Custom stickers, quotes and AI prints.', bg: 'linear-gradient(135deg,#1a130a 0%,#2d1f0f 60%,#1a130a 100%)', teeColor: '#d4b896', teeSlug: 'beige', teeLabel: 'BEIGE TEE' },
  { id: 4, headline: 'BEYOND', sub: 'ORDINARY', accent: 'Four colors. Infinite possibilities.', bg: 'linear-gradient(135deg,#141414 0%,#1f1f1f 60%,#141414 100%)', teeColor: '#f8f8f8', teeSlug: 'white', teeLabel: 'WHITE TEE' },
]

const TEE_COLORS = [
  { name: 'Black', hex: '#0a0a0a', slug: 'black', desc: 'The darkest canvas for bold designs.' },
  { name: 'Blue', hex: '#2563a8', slug: 'blue', desc: 'Ocean-deep blue for statement looks.' },
  { name: 'Beige', hex: '#d4b896', slug: 'beige', desc: 'Earthy warmth with premium feel.' },
  { name: 'White', hex: '#f8f8f8', slug: 'white', desc: 'Pure white for vivid prints.' },
]

const FEATURES = [
  { icon: '✦', title: 'AI Art Generation', desc: 'Type a prompt, get AI artwork placed on your tee instantly.' },
  { icon: '◈', title: 'Live Canvas Preview', desc: 'See your design update in real-time on front and back sides.' },
  { icon: '❋', title: 'Premium 100% Cotton', desc: 'Ultra-soft, pre-shrunk, durable and print-ready fabric.' },
  { icon: '⬡', title: 'Fast Delivery', desc: 'Pan-India delivery in 5–7 business days. Tracked.' },
]

export default function Home() {
  const [slide, setSlide] = useState(0)
  const [prev, setPrev] = useState(null)
  const [visible, setVisible] = useState(new Set())
  const refs = useRef([])
  const timer = useRef(null)

  const startTimer = () => {
    clearInterval(timer.current)
    timer.current = setInterval(() => {
      setSlide(s => { setPrev(s); return (s + 1) % HERO_SLIDES.length })
    }, 4500)
  }

  useEffect(() => { startTimer(); return () => clearInterval(timer.current) }, [])

  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setVisible(v => new Set([...v, e.target.dataset.s])) }),
      { threshold: 0.12 }
    )
    refs.current.forEach(el => el && obs.observe(el))
    return () => obs.disconnect()
  }, [])

  const goTo = (i) => { setPrev(slide); setSlide(i); startTimer() }
  const cur = HERO_SLIDES[slide]

  return (
    <main className="home">

      {/* ── HERO ── */}
      <section className="hero">
        {HERO_SLIDES.map((s, i) => (
          <div key={s.id} className={`hero-bg ${i === slide ? 'hero-bg--active' : ''} ${i === prev ? 'hero-bg--out' : ''}`}
            style={{ background: s.bg }} />
        ))}
        <div className="hero-grid" />
        <div className="container hero-content">
          <div className="hero-text">
            <div className="badge badge-gold animate-fade-up">☁ {cur.teeLabel} — Live Now</div>
            <h1 className="hero-h1 animate-fade-up delay-100">
              {cur.headline}<br /><span className="text-gradient">{cur.sub}</span>
            </h1>
            <p className="hero-accent animate-fade-up delay-200">{cur.accent}</p>
            <div className="hero-btns animate-fade-up delay-300">
              <Link to="/products" className="btn btn-primary btn-lg" id="hero-shop-btn">Shop Now →</Link>
              <Link to="/customize/black" className="btn btn-ghost btn-lg" id="hero-customize-btn">Customize Yours</Link>
            </div>
            <div className="hero-dots animate-fade-up delay-400">
              {HERO_SLIDES.map((_, i) => (
                <button key={i} className={`hero-dot ${i === slide ? 'active' : ''}`} onClick={() => goTo(i)} />
              ))}
            </div>
          </div>
          <div className="hero-tee animate-float">
            <div className="hero-tee-card">
              <div className="hero-tee-glow" style={{ background: cur.teeColor === '#f8f8f8' ? 'rgba(255,255,255,0.06)' : cur.teeColor + '28' }} />
              <img src={TEE_IMAGES[cur.teeSlug]} alt={cur.teeLabel} className="hero-tee-img" />
              <div className="hero-tee-tag">{cur.teeLabel}</div>
            </div>
          </div>
        </div>
        <div className="hero-scroll"><div className="hero-scroll-line" /><span>Scroll</span></div>
      </section>

      {/* ── MARQUEE ── */}
      <div className="marquee-wrap">
        <div className="marquee-track">
          {[...Array(3)].flatMap(() =>
            ['CUSTOM PRINTED', '☁', 'AI DESIGNED', '◆', 'MOVE HIGH', '☁', 'PREMIUM COTTON', '◆', 'WEAR YOUR STORY', '☁']
          ).map((t, i) => <span key={i} className={t === '☁' || t === '◆' ? 'marquee-sym' : ''}>{t}</span>)}
        </div>
      </div>

      {/* ── 4 COLORS ── */}
      <section className={`section ${visible.has('c') ? 'sec-visible' : 'sec-hidden'}`}
        ref={el => refs.current[0] = el} data-s="c">
        <div className="container">
          <p className="subheading text-gradient" style={{ textAlign: 'center', marginBottom: 10 }}>The Collection</p>
          <h2 className="display-md" style={{ textAlign: 'center', marginBottom: 56 }}>
            Four Colors. <span className="text-gradient">Zero Limits.</span>
          </h2>
          <div className="colors-grid">
            {TEE_COLORS.map((t, i) => (
              <Link to={`/customize/${t.slug}`} key={t.slug} className="tee-card" id={`home-tee-${t.slug}`}
                style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="tee-card-img" style={{ background: t.hex === '#f8f8f8' ? '#f0ede6' : t.hex + '18' }}>
                  <img src={TEE_IMAGES[t.slug]} alt={`${t.name} tee`} className="tee-card-photo" />
                </div>
                <div className="tee-card-body">
                  <div className="tee-card-row">
                    <span className="tee-swatch" style={{ background: t.hex, border: t.hex === '#f8f8f8' ? '1px solid #ccc' : 'none' }} />
                    <span className="tee-name">{t.name} Tee</span>
                    <span className="tee-price"><span className="tee-price-old">₹499</span> ₹349</span>
                  </div>
                  <p className="tee-desc">{t.desc}</p>
                  <div className="tee-cta">Customize →</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section className={`section ${visible.has('f') ? 'sec-visible' : 'sec-hidden'}`}
        ref={el => refs.current[1] = el} data-s="f" style={{ background: 'var(--surface)' }}>
        <div className="container">
          <p className="subheading text-gradient" style={{ textAlign: 'center', marginBottom: 10 }}>Why CLOUDS</p>
          <h2 className="display-md" style={{ textAlign: 'center', marginBottom: 56 }}>Built Different.</h2>
          <div className="feats-grid">
            {FEATURES.map((f, i) => (
              <div key={i} className="feat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="feat-icon">{f.icon}</div>
                <h3 className="feat-title">{f.title}</h3>
                <p className="feat-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className={`section ${visible.has('h') ? 'sec-visible' : 'sec-hidden'}`}
        ref={el => refs.current[2] = el} data-s="h">
        <div className="container">
          <p className="subheading text-gradient" style={{ textAlign: 'center', marginBottom: 10 }}>The Process</p>
          <h2 className="display-md" style={{ textAlign: 'center', marginBottom: 56 }}>Three Steps to Yours.</h2>
          <div className="steps-grid">
            {[
              { n: '01', title: 'Choose Your Color', desc: 'Pick from Black, Blue, Beige, or White.' },
              { n: '02', title: 'Design It', desc: 'Add text, upload images, or generate AI art.' },
              { n: '03', title: 'Order & Receive', desc: 'We print and deliver it to your door.' },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num text-gradient">{s.n}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className={`cta-bar ${visible.has('cta') ? 'sec-visible' : 'sec-hidden'}`}
        ref={el => refs.current[3] = el} data-s="cta">
        <div className="container cta-bar-inner">
          <div>
            <h2 className="display-md">Ready to Create <span className="text-gradient">Something Iconic?</span></h2>
            <p style={{ color: 'var(--muted)', marginTop: 10 }}>Start designing your custom tee in minutes.</p>
          </div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <Link to="/customize/black" className="btn btn-primary btn-lg" id="cta-design-btn">Start Designing</Link>
            <Link to="/products" className="btn btn-ghost btn-lg" id="cta-shop-link">View All Tees</Link>
          </div>
        </div>
      </section>
    </main>
  )
}
