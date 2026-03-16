import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { getMyPets, deactivatePet, deletePetPermanent, getFlyerUrl, getPetImageUrl } from '../api/pets'
import { deleteAccount } from '../api/auth'
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
    <div className="page cabinet-page">
      <h1 className="cabinet-title">Личный кабинет</h1>

      <div className="cabinet-layout">
        <aside className="cabinet-profile">
          <div className="cabinet-avatar">
            {user.email.slice(0, 1).toUpperCase()}
          </div>
          <p className="cabinet-profile-label">Имя</p>
          <p className="cabinet-profile-value">{user.email.split('@')[0]}</p>
          <p className="cabinet-profile-label">Email</p>
          <p className="cabinet-profile-value">{user.email}</p>
          <p className="cabinet-profile-label">Ваш пароль</p>
          <p className="cabinet-profile-password">••••••••</p>
          <button type="button" className="cabinet-logout" onClick={logout}>
            Выйти
          </button>
        </aside>

        <section className="cabinet-ads">
          <div className="cabinet-ads-header">
            <h2 className="cabinet-ads-title">Ваши объявления</h2>
            <Link to="/cabinet/new" className="cabinet-create-btn">Создать объявление</Link>
          </div>

          {loading ? (
            <p className="cabinet-loading">Загрузка...</p>
          ) : pets.length === 0 ? (
            <p className="cabinet-empty">У вас пока нет объявлений.</p>
          ) : (
            <div className="cabinet-card-grid">
              {pets.map((pet) => {
                const imageUrl = pet.image_path
                  ? getPetImageUrl(pet.image_path)
                  : pet.image_paths?.length
                    ? getPetImageUrl(pet.image_paths[0])
                    : null
                return (
                  <article key={pet.id} className="cabinet-card">
                    <Link to={`/pet/${pet.id}`} className="cabinet-card-image-link">
                      <div className="cabinet-card-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={pet.name} />
                        ) : (
                          <span className="cabinet-card-no-photo">{pet.species.slice(0, 1)}</span>
                        )}
                      </div>
                    </Link>
                    <div className="cabinet-card-body">
                      <Link to={`/pet/${pet.id}`} className="cabinet-card-title">
                        {pet.is_lost ? 'Пропал' : 'Найден'} {pet.species} по кличке {pet.name}
                      </Link>
                      <p className="cabinet-card-location">
                        Район находки/пропажи: {pet.last_seen_place || pet.city || '—'}
                      </p>
                      <p className="cabinet-card-date">
                        Дата: {pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleDateString('ru-RU') : '—'}
                      </p>
                      <p className="cabinet-card-features">
                        Особые приметы: {pet.description ? `${pet.description.slice(0, 60)}${pet.description.length > 60 ? '…' : ''}` : '—'}
                      </p>
                      <div className="cabinet-card-actions">
                        <Link to={`/cabinet/edit/${pet.id}`} className="cabinet-card-btn cabinet-card-btn-edit">
                          Изменить
                        </Link>
                        <a href={getFlyerUrl(pet.id)} target="_blank" rel="noreferrer" className="cabinet-card-link">
                          Листовка PDF
                        </a>
                        <button type="button" className="cabinet-card-btn cabinet-card-btn-secondary" onClick={() => handleDeactivate(pet.id)}>
                          Снять
                        </button>
                        <button type="button" className="cabinet-card-btn cabinet-card-btn-danger" onClick={() => handleDelete(pet.id)}>
                          Удалить
                        </button>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
