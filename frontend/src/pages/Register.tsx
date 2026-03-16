import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const REGISTER_IMAGE = '/login-panel.png'
const MIN_PASSWORD_LENGTH = 6

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { register } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Пароль должен быть не менее ${MIN_PASSWORD_LENGTH} символов`)
      return
    }
    try {
      await register(email, password)
      navigate('/cabinet')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации')
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-form-wrap">
          <h1 className="login-title">Создайте аккаунт</h1>
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
                placeholder={`Пароль (мин. ${MIN_PASSWORD_LENGTH} символов)`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={MIN_PASSWORD_LENGTH}
              />
            </label>
            <p className="login-links">
              <Link to="/login" className="login-link-accent">Уже есть аккаунт? Войти</Link>
            </p>
            <button type="submit" className="btn-login">Зарегистрироваться</button>
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
        <div className="login-image" style={{ backgroundImage: `url(${REGISTER_IMAGE})` }} />
      </div>
    </div>
  )
}
