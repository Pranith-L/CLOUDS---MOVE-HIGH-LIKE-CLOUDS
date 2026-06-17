/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react'

// eslint-disable-next-line
export const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem('clouds_cart')) || [] }
    catch { return [] }
  })

  useEffect(() => {
    localStorage.setItem('clouds_cart', JSON.stringify(items))
  }, [items])

  const addItem = (product, size, quantity = 1, customization = null) => {
    setItems(prev => {
      const key = `${product._id}-${size}-${customization ? 'custom' : 'plain'}`
      const exists = prev.find(i => i.key === key)
      if (exists && !customization) {
        return prev.map(i => i.key === key ? { ...i, quantity: i.quantity + quantity } : i)
      }
      return [...prev, {
        key,
        productId: product._id,
        name: product.name,
        color: product.color,
        colorHex: product.colorHex,
        price: product.price,
        size,
        quantity,
        customization
      }]
    })
  }

  const removeItem = (key) => setItems(prev => prev.filter(i => i.key !== key))

  const updateQty = (key, qty) => {
    if (qty < 1) return removeItem(key)
    setItems(prev => prev.map(i => i.key === key ? { ...i, quantity: qty } : i))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const count = items.reduce((sum, i) => sum + i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, total, count }}>
      {children}
    </CartContext.Provider>
  )
}
