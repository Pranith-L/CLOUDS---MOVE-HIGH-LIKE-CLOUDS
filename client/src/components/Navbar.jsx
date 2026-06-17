import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useCart } from '../context/CartContext'
import './Navbar.css'

export default function Navbar() {
  const { user, logout } = useAuth()
  const { count } = useCart()
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // eslint-disable-next-line
  useEffect(() => { setMenuOpen(false) }, [location])

  return (
    <nav className={`navbar ${scrolled ? 'navbar--scrolled' : ''}`}>
      <div className="navbar__inner container">
        {/* Logo */}
        <Link to="/" className="navbar__logo">
          <span className="navbar__logo-icon">☁</span>
          <span className="navbar__logo-text">CLOUDS</span>
        </Link>

        {/* Nav links */}
        <ul className={`navbar__links ${menuOpen ? 'navbar__links--open' : ''}`}>
          <li><Link to="/" className={location.pathname === '/' ? 'active' : ''}>Home</Link></li>
          <li><Link to="/products" className={location.pathname === '/products' ? 'active' : ''}>Shop</Link></li>
          <li><Link to="/customize/black" className={location.pathname.startsWith('/customize') ? 'active' : ''}>Customize</Link></li>
          <li><Link to="/support" className={location.pathname === '/support' ? 'active' : ''}>Support</Link></li>
        </ul>

        {/* Right actions */}
        <div className="navbar__actions">
          <Link to="/cart" className="navbar__cart" id="nav-cart-btn">
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 01-8 0"/>
            </svg>
            {count > 0 && <span className="navbar__badge">{count}</span>}
          </Link>

          {user ? (
            <div className="navbar__user">
              <span className="navbar__user-name">{user.name.split(' ')[0]}</span>
              <button onClick={logout} className="btn btn-ghost btn-sm">Logout</button>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm">Sign In</Link>
          )}

          <button className="navbar__hamburger hide-desktop" onClick={() => setMenuOpen(!menuOpen)} id="hamburger-btn">
            <span /><span /><span />
          </button>
        </div>
      </div>
    </nav>
  )
}
