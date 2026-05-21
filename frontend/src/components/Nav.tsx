import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'

export default function Nav() {
  const { user } = useAuth()

  return (
    <header className="nav-header">
      <div className="nav-inner">
        <Link to="/" className="nav-logo">
          <img src="/simple-vector-logo-for-a-lost-pet-service-with-a-c.svg" alt="" width={82} height={72} className="nav-logo-img" />
          <span>ПОТЕРЯШКИ</span>
        </Link>
        <Link to="/search" className="nav-link">
          <span className="nav-link-icon" aria-hidden>☰</span>
          Активные объявления
        </Link>
        <nav className="nav-right">
          {user ? (
            <>
              <Link to="/cabinet">Личный кабинет</Link>
              <Link to="/cabinet">Мои объявления</Link>
            </>
          ) : (
            <>
              <Link to="/login" className="nav-btn-outline">Войти</Link>
              <Link to="/cabinet">Личный кабинет</Link>
              <Link to="/cabinet">Мои объявления</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
