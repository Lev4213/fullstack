import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Nav from './components/Nav'
import Home from './pages/Home'
import Search from './pages/Search'
import PetDetail from './pages/PetDetail'
import Login from './pages/Login'
import Register from './pages/Register'
import Cabinet from './pages/Cabinet'
import CreatePet from './pages/CreatePet'
import EditPet from './pages/EditPet'
import './App.css'

function AppContent() {
  const location = useLocation()
  const isAuthFullPage = location.pathname === '/login' || location.pathname === '/register'

  return (
    <>
      <Nav />
      <main>
        {isAuthFullPage ? (
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        ) : (
          <div className="main-wrap">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/search" element={<Search />} />
              <Route path="/pet/:id" element={<PetDetail />} />
              <Route path="/cabinet" element={<Cabinet />} />
              <Route path="/cabinet/edit/:id" element={<EditPet />} />
              <Route path="/cabinet/new" element={<CreatePet />} />
            </Routes>
          </div>
        )}
      </main>
    </>
  )
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
