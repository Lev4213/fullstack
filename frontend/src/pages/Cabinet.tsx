import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMyPets, deactivatePet, deletePetPermanent } from '../api/pets'
import { getFlyerUrl } from '../api/pets'
import type { Pet } from '../types'

export default function Cabinet() {
  const { user, loading: authLoading, logout } = useAuth()
  const navigate = useNavigate()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    getMyPets()
      .then(setPets)
      .catch(() => setPets([]))
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading) return <div className="page"><p>Загрузка...</p></div>
  if (!user) {
    navigate('/login')
    return null
  }

  async function handleDeactivate(id: number) {
    if (!confirm('Снять объявление с публикации?')) return
    try {
      await deactivatePet(id)
      setPets((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить объявление навсегда? Это нельзя отменить.')) return
    try {
      await deletePetPermanent(id)
      setPets((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  return (
    <div className="page">
      <h1>Личный кабинет</h1>
      <p>Вы вошли как {user.email}. <button type="button" className="link-btn" onClick={logout}>Выйти</button></p>
      <p><Link to="/cabinet/new">Создать объявление</Link></p>
      <h2>Мои объявления</h2>
      {loading ? <p>Загрузка...</p> : (
        <ul className="pet-list">
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link to={`/pet/${pet.id}`}>{pet.name} — {pet.species}</Link>
              {' '}
              <a href={getFlyerUrl(pet.id)} target="_blank" rel="noreferrer">PDF</a>
              {' '}
              <button type="button" className="link-btn" onClick={() => handleDeactivate(pet.id)}>Снять</button>
              {' '}
              <button type="button" className="link-btn danger" onClick={() => handleDelete(pet.id)}>Удалить</button>
            </li>
          ))}
        </ul>
      )}
      {!loading && pets.length === 0 && <p>У вас пока нет объявлений.</p>}
    </div>
  )
}
