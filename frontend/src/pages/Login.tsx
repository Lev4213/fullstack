import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const LOGIN_IMAGE = '/login-panel.png'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!password.trim()) {
      setError('Введите пароль')
      return
    }
    try {
      await login(email, password)
      navigate('/cabinet')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-form-wrap">
          <h1 className="login-title">Рады видеть вас!</h1>
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <p className="error">{error}</p>}
            <label>
              <input
                type="email"
                placeholder="Почта"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label>
              <input
                type="password"
                placeholder="Пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            <p className="login-links">
              <a href="#" className="login-link-muted">Забыли пароль?</a>
              <Link to="/register" className="login-link-accent">Зарегистрироваться</Link>
            </p>
            <button type="submit" className="btn-login">Войти</button>
          </form>
        </div>
      </div>
      <div className="login-right">
        <svg width="0" height="0" aria-hidden focusable="false">
          <defs>
            <clipPath id="loginWaveClip" clipPathUnits="objectBoundingBox">
              <path d="M 0.04 0 Q 0 0.5 0.04 1 L 1 1 L 1 0 Z" />
            </clipPath>
          </defs>
        </svg>
        <div className="login-image" style={{ backgroundImage: `url(${LOGIN_IMAGE})` }} />
      </div>
    </div>
  )
}
