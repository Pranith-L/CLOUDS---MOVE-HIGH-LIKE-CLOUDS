import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'
import { useCart } from '../context/CartContext'
import { getTeeImage } from '../teeImages'
import './Products.css'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedSizes, setSelectedSizes] = useState({})
  const [added, setAdded] = useState({})
  const { addItem } = useCart()

  useEffect(() => {
    axios.get('/api/products')
      .then(r => { setProducts(r.data); setLoading(false) })
      .catch(() => {
        setError('Could not load products. Check that the API is running and try again.')
        setLoading(false)
      })
  }, [])

  const handleSize = (id, size) => setSelectedSizes(p => ({ ...p, [id]: size }))

  const handleAdd = (product) => {
    const size = selectedSizes[product._id] || 'M'
    addItem(product, size)
    setAdded(p => ({ ...p, [product._id]: true }))
    setTimeout(() => setAdded(p => ({ ...p, [product._id]: false })), 1800)
  }

  return (
    <main className="products-page">
      <div className="container">
        {/* Header */}
        <div className="products-header">
          <p className="subheading text-gradient">The Collection</p>
          <h1 className="display-lg">Our Tees</h1>
          <p className="products-sub">Four premium colors. One mission — wear your story.</p>
          <div className="divider" style={{ margin: '24px auto 0' }} />
        </div>

        {/* Grid */}
        {loading ? (
          <div className="products-grid">
            {[1,2,3,4].map(i => <div key={i} className="prod-card-skeleton skeleton" />)}
          </div>
        ) : error ? (
          <div className="products-empty">{error}</div>
        ) : products.length === 0 ? (
          <div className="products-empty">No products in the store yet. Please try again in a moment.</div>
        ) : (
          <div className="products-grid">
            {products.map((p, i) => (
              <div key={p._id} className="prod-card" style={{ animationDelay: `${i * 0.1}s` }}>
                {/* Image area */}
                <div className="prod-card-img" style={{ background: p.colorHex === '#f8f8f8' ? '#f0ede6' : p.colorHex + '18' }}>
                  <img src={getTeeImage(p.color)} alt={p.name} className="prod-card-image" loading="lazy" />
                  <div className="prod-card-badge badge badge-gold">Premium Cotton</div>
                </div>

                {/* Body */}
                <div className="prod-card-body">
                  <div className="prod-card-top">
                    <div className="prod-swatch-row">
                      <span className="prod-swatch" style={{ background: p.colorHex, border: p.colorHex === '#f8f8f8' ? '1px solid #ccc' : 'none' }} />
                      <span className="prod-color-name">{p.color.charAt(0).toUpperCase() + p.color.slice(1)}</span>
                    </div>
                    <h2 className="prod-name">{p.name}</h2>
                    <p className="prod-desc">{p.description}</p>
                  </div>

                  {/* Size selector */}
                  <div className="prod-sizes">
                    <p className="prod-sizes-label">Size: <strong>{selectedSizes[p._id] || 'M'}</strong></p>
                    <div className="prod-size-btns">
                      {SIZES.map(s => (
                        <button key={s}
                          className={`prod-size-btn ${(selectedSizes[p._id] || 'M') === s ? 'active' : ''}`}
                          onClick={() => handleSize(p._id, s)}
                          id={`size-${p._id}-${s}`}
                        >{s}</button>
                      ))}
                    </div>
                  </div>

                  {/* Price + Actions */}
                  <div className="prod-card-footer">
                    <div className="prod-price">
                      <span className="prod-price-main">₹{p.price}</span>
                      <span className="prod-price-old">₹449</span>
                    </div>
                    <div className="prod-actions">
                      <button
                        className={`btn ${added[p._id] ? 'btn-dark' : 'btn-primary'} prod-add-btn`}
                        onClick={() => handleAdd(p)}
                        id={`add-cart-${p._id}`}
                      >
                        {added[p._id] ? '✓ Added' : '+ Cart'}
                      </button>
                      <Link to={`/customize/${p.color}`} className="btn btn-ghost prod-cust-btn" id={`customize-${p._id}`}>
                        Customize
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Info bar */}
        <div className="prod-info-bar">
          {['Free shipping over ₹1499', '100% Cotton', 'Easy Returns', 'Secure Checkout'].map((t, i) => (
            <div key={i} className="prod-info-item">
              <span className="text-gradient">✦</span> {t}
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
