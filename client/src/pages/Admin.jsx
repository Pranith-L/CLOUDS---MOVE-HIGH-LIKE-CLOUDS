import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuth } from '../context/AuthContext'
import './Admin.css'

export default function Admin() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (user && user.role !== 'admin') {
      navigate('/')
      return
    }

    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem('clouds_token')
        const { data } = await axios.get('/api/orders/all', {
          headers: { Authorization: `Bearer ${token}` }
        })
        setOrders(data)
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders')
      } finally {
        setLoading(false)
      }
    }

    if (user) fetchOrders()
  }, [user, navigate])

  if (!user || user.role !== 'admin') return null

  if (loading) return <div className="page-load"><span className="auth-spinner"/></div>

  const parseJSON = (jsonStr) => {
    if (!jsonStr) return null
    try {
      return JSON.parse(jsonStr)
    } catch {
      return null
    }
  }

  const renderDesignDetails = (jsonObj) => {
    if (!jsonObj || !jsonObj.objects || jsonObj.objects.length === 0) return <p className="text-muted">No custom elements</p>
    
    return (
      <ul className="admin-design-list">
        {jsonObj.objects.map((obj, i) => {
          if (obj.type === 'i-text' || obj.type === 'text') {
            return (
              <li key={i}>
                <strong>Text:</strong> "{obj.text}" <br />
                <small>Font: {obj.fontFamily} | Size: {obj.fontSize} | Color: {obj.fill} {obj.fontWeight === 'bold' ? '| Bold' : ''}</small>
              </li>
            )
          }
          if (obj.type === 'image') {
            return (
              <li key={i}>
                <strong>Image Upload</strong> <br />
                <small>Scale: {obj.scaleX?.toFixed(2)} | Dimensions: {Math.round(obj.width * obj.scaleX)}x{Math.round(obj.height * obj.scaleY)}px</small>
                {obj.src && <img src={obj.src} alt="custom img" className="admin-inline-img" />}
              </li>
            )
          }
          return <li key={i}><strong>Element:</strong> {obj.type}</li>
        })}
      </ul>
    )
  }

  return (
    <main className="admin-page container">
      <h1 className="display-md" style={{ marginBottom: '32px' }}>Admin Dashboard</h1>
      {error && <p className="error-text">{error}</p>}

      <div className="admin-orders">
        {orders.length === 0 ? (
          <p>No orders placed yet.</p>
        ) : (
          orders.map(order => (
            <div key={order._id} className="admin-order-card glass">
              <div className="admin-order-header">
                <div>
                  <h3>Order ID: {order._id}</h3>
                  <p className="text-muted">By: {order.user?.name} ({order.user?.email}) - {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="admin-order-status">
                  <span className={`status-badge status-${order.status}`}>{order.status}</span>
                </div>
              </div>
              
              <div className="admin-order-items">
                {order.items.map((item, idx) => (
                  <div key={idx} className="admin-item-row">
                    <div className="admin-item-info">
                      <h4>{item.productName}</h4>
                      <p>Color: <strong>{item.productColor}</strong> | Size: <strong>{item.size}</strong> | Qty: <strong>{item.quantity}</strong></p>
                    </div>

                    {item.customization?.hasCustomization && (
                      <div className="admin-customization-details">
                        <h5>Printing Instructions</h5>
                        <div className="admin-print-sides">
                          <div className="admin-print-side">
                            <h6>FRONT DESIGN</h6>
                            {renderDesignDetails(parseJSON(item.customization.frontJSON))}
                          </div>
                          <div className="admin-print-side">
                            <h6>BACK DESIGN</h6>
                            {renderDesignDetails(parseJSON(item.customization.backJSON))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="admin-order-footer">
                <div className="admin-shipping">
                  <strong>Shipping Address:</strong><br />
                  {order.shippingAddress?.name}<br/>
                  {order.shippingAddress?.street}, {order.shippingAddress?.city}<br/>
                  {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br/>
                  Phone: {order.shippingAddress?.phone}
                </div>
                <div className="admin-total">
                  Total: <span className="text-gradient">₹{order.total}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}
