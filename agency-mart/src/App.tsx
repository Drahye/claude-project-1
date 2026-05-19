import { HashRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import Nav from './components/Nav'
import Home from './pages/Home'
import CategoryPage from './pages/CategoryPage'
import './index.css'

export default function App() {
  return (
    <CartProvider>
      <HashRouter>
        <Nav />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/category/:categoryId" element={<CategoryPage />} />
        </Routes>
      </HashRouter>
    </CartProvider>
  )
}
