import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Home from './pages/Home'
import Search from './pages/Search'
import PetDetail from './pages/PetDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Cabinet from './pages/Cabinet'
import CreatePet from './pages/CreatePet'
import './App.css'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <nav className="nav">
          <Link to="/">Главная</Link>
          <Link to="/search">Поиск</Link>
          <Link to="/login">Вход</Link>
          <Link to="/register">Регистрация</Link>
          <Link to="/cabinet">Кабинет</Link>
        </nav>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/search" element={<Search />} />
            <Route path="/pet/:id" element={<PetDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/cabinet" element={<Cabinet />} />
            <Route path="/cabinet/new" element={<CreatePet />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
