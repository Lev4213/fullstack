import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="page">
      <h1>Потерянные питомцы</h1>
      <p>Сервис для поиска потерянных и найденных животных. Просматривайте объявления, создавайте свои и помогайте другим.</p>
      <nav className="home-links">
        <Link to="/search">Искать объявления</Link>
        <Link to="/login">Войти</Link>
        <Link to="/register">Регистрация</Link>
      </nav>
    </div>
  )
}
