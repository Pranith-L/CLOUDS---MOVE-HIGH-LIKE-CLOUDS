import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import './Cart.css'

export default function Cart() {
  const { items, removeItem, updateQty, clearCart, total } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [step, setStep] = useState('cart') // cart | shipping | success
  const [addr, setAddr] = useState({ name: '', street: '', city: '', state: '', pincode: '', phone: '' })
  const [paying, setPaying] = useState(false)
  const [orderId, setOrderId] = useState(null)

  const handleAddr = e => setAddr(p => ({ ...p, [e.target.name]: e.target.value }))

  const initiatePayment = async () => {
    if (!user) return navigate('/login')
    setPaying(true)
    try {
      const { data } = await axios.post('/api/orders/create-payment', { amount: total + 49 })

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_key',
        amount: data.amount,
        currency: data.currency,
        name: 'CLOUDS',
        description: 'Custom T-Shirt Order',
        order_id: data.orderId,
        handler: async (response) => {
          try {
            const orderItems = items.map(i => ({
              productId: i.productId,
              size: i.size,
              quantity: i.quantity,
              customization: i.customization
            }))
            const res = await axios.post('/api/orders/verify-and-place', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: orderItems,
              shippingAddress: addr,
              total: total + 49
            })
            setOrderId(res.data.order._id)
            clearCart()
            setStep('success')
          } catch { alert('Order verification failed.') }
        },
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#d4a853' }
      }
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (err) {
      alert(err.response?.data?.message || 'Payment initiation failed.')
    } finally { setPaying(false) }
  }

  if (step === 'success') return (
    <main className="cart-page">
      <div className="container cart-success">
        <div className="success-icon">✓</div>
        <h1 className="display-md">Order Confirmed!</h1>
        <p>Your custom tee is being prepared. Order ID: <strong>{orderId?.slice(-8).toUpperCase()}</strong></p>
        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 32 }}>Continue Shopping →</Link>
      </div>
    </main>
  )

  if (items.length === 0) return (
    <main className="cart-page">
      <div className="container cart-empty">
        <div className="cart-empty-icon">🛍</div>
        <h2 className="display-md">Your cart is empty</h2>
        <p style={{ color: 'var(--muted)', marginTop: 12 }}>Add some custom tees to get started.</p>
        <Link to="/products" className="btn btn-primary btn-lg" style={{ marginTop: 32 }} id="cart-shop-btn">Shop Now →</Link>
      </div>
    </main>
  )

  return (
    <main className="cart-page">
      <div className="container">
        <h1 className="display-md cart-title">Your Cart <span className="text-gradient">({items.length})</span></h1>

        <div className="cart-layout">
          {/* Items */}
          <div className="cart-items">
            {step === 'cart' ? (
              items.map(item => (
                <div key={item.key} className="cart-item">
                  {/* Tee preview */}
                  <div className="cart-item-img" style={{ background: item.colorHex === '#f8f8f8' ? '#f0ede6' : item.colorHex + '22' }}>
                    {item.customization?.frontImage
                      ? <img src={item.customization.frontImage} alt="custom" className="cart-custom-preview" />
                      : <div className="cart-tee-placeholder" style={{ background: item.colorHex, border: item.colorHex === '#f8f8f8' ? '1px solid #ccc' : 'none' }} />
                    }
                  </div>
                  <div className="cart-item-body">
                    <h3 className="cart-item-name">{item.name}</h3>
                    <div className="cart-item-meta">
                      <span className="cart-tag">Size: {item.size}</span>
                      <span className="cart-tag" style={{ background: item.colorHex + '33', borderColor: item.colorHex + '66' }}>{item.color}</span>
                      {item.customization?.hasCustomization && <span className="cart-tag cart-tag-custom">✦ Custom Design</span>}
                    </div>
                    <div className="cart-item-row">
                      <div className="cart-qty">
                        <button onClick={() => updateQty(item.key, item.quantity - 1)} className="cart-qty-btn">−</button>
                        <span>{item.quantity}</span>
                        <button onClick={() => updateQty(item.key, item.quantity + 1)} className="cart-qty-btn">+</button>
                      </div>
                      <span className="cart-item-price">₹{item.price * item.quantity}</span>
                      <button onClick={() => removeItem(item.key)} className="cart-remove">Remove</button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              /* Shipping form */
              <div className="shipping-form">
                <h2 className="heading" style={{ marginBottom: 24 }}>Shipping Details</h2>
                {['name', 'street', 'city', 'state', 'pincode', 'phone'].map(f => (
                  <div key={f} className="auth-field" style={{ marginBottom: 16 }}>
                    <label>{f.charAt(0).toUpperCase() + f.slice(1)}</label>
                    <input name={f} className="input" placeholder={f} value={addr[f]} onChange={handleAddr} required />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="cart-summary glass">
            <h3 className="cart-summary-title">Order Summary</h3>
            <div className="cart-summary-rows">
              <div className="cart-summary-row"><span>Subtotal</span><span>₹{total}</span></div>
              <div className="cart-summary-row"><span>Shipping</span><span>₹49</span></div>
              <div className="cart-summary-row cart-summary-total"><span>Total</span><span className="text-gradient">₹{total + 49}</span></div>
            </div>
            {step === 'cart' ? (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 24 }}
                onClick={() => user ? setStep('shipping') : navigate('/login')} id="checkout-btn">
                {user ? 'Proceed to Checkout →' : 'Login to Checkout →'}
              </button>
            ) : (
              <button className="btn btn-primary" style={{ width: '100%', marginTop: 24 }}
                onClick={initiatePayment} disabled={paying} id="pay-btn">
                {paying ? 'Processing…' : '💳 Pay ₹' + (total + 49)}
              </button>
            )}
            <Link to="/products" className="btn btn-ghost" style={{ width: '100%', marginTop: 12, justifyContent: 'center' }}>
              ← Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
