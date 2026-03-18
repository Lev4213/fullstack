import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPet, getFlyerUrl, getPetImageUrl } from '../api/pets'
import type { Pet } from '../types'

export default function PetDetail() {
  const { id } = useParams<{ id: string }>()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    if (!id) return
    getPet(Number(id))
      .then(setPet)
      .catch(() => setError('Объявление не найдено'))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [pet?.id])

  if (loading) return <div className="page"><p>Загрузка...</p></div>
  if (error || !pet) return <div className="page"><p>{error || 'Не найдено'}</p><Link to="/search">К списку</Link></div>

  const images = pet.image_paths?.length ? pet.image_paths : (pet.image_path ? [pet.image_path] : [])
  const mainImageUrl = images[currentImageIndex] ? getPetImageUrl(images[currentImageIndex]) : null
  const flyerUrl = getFlyerUrl(pet.id)

  return (
    <div className="page pet-detail-page">
      <p><Link to="/search">← К поиску</Link></p>

      <h1 className="pet-detail-heading">Подробная информация</h1>

      <div className="pet-detail-layout">
        <section className="pet-detail-gallery">
          <div className="pet-detail-main-image-wrap">
            {images.length > 1 && (
              <button
                type="button"
                className="pet-detail-arrow pet-detail-arrow-left"
                onClick={() => setCurrentImageIndex((i) => (i - 1 + images.length) % images.length)}
                aria-label="Предыдущее фото"
              >
                ‹
              </button>
            )}
            <div className="pet-detail-main-image">
              {mainImageUrl ? (
                <img src={mainImageUrl} alt={pet.name} />
              ) : (
                <span className="pet-detail-no-photo">Нет фото</span>
              )}
            </div>
            {images.length > 1 && (
              <button
                type="button"
                className="pet-detail-arrow pet-detail-arrow-right"
                onClick={() => setCurrentImageIndex((i) => (i + 1) % images.length)}
                aria-label="Следующее фото"
              >
                ›
              </button>
            )}
          </div>
          {images.length > 0 && (
            <div className="pet-detail-thumbnails">
              {images.map((path, idx) => (
                <button
                  key={path}
                  type="button"
                  className={`pet-detail-thumb ${idx === currentImageIndex ? 'pet-detail-thumb-active' : ''}`}
                  onClick={() => setCurrentImageIndex(idx)}
                >
                  <img src={getPetImageUrl(path) ?? ''} alt="" />
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="pet-detail-info">
          <h2 className="pet-detail-name">{pet.name}</h2>
          <dl className="pet-detail-dl">
            <dt>Порода</dt>
            <dd>{pet.breed || '—'}</dd>
            <dt>Пол</dt>
            <dd>{pet.sex === 'male' ? 'Самец' : pet.sex === 'female' ? 'Самка' : pet.sex || '—'}</dd>
            <dt>Окрас</dt>
            <dd>{pet.color || '—'}</dd>
            <dt>Город</dt>
            <dd>{pet.city || '—'}</dd>
            <dt>Район пропажи / находки</dt>
            <dd>{pet.last_seen_place || '—'}</dd>
            {pet.last_seen_date && (
              <>
                <dt>Дата</dt>
                <dd>{new Date(pet.last_seen_date).toLocaleDateString('ru-RU')}</dd>
              </>
            )}
          </dl>
        </section>
      </div>

      {pet.description && (
        <section className="pet-detail-section">
          <h3 className="pet-detail-section-title">Описание</h3>
          <p className="pet-detail-description">{pet.description}</p>
        </section>
      )}

      {(pet.contact_name || pet.contact_phone || pet.contact_email) && (
        <section className="pet-detail-section">
          <h3 className="pet-detail-section-title">Контактные данные</h3>
          <p className="pet-detail-contact">
            {[pet.contact_name, pet.contact_phone, pet.contact_email].filter(Boolean).join(' · ')}
          </p>
        </section>
      )}

      <p className="pet-detail-actions">
        <a href={flyerUrl} target="_blank" rel="noreferrer" download className="btn-accent secondary">
          <img src="/download.svg" alt="" aria-hidden style={{ width: 16, height: 16, marginRight: 6, verticalAlign: 'text-bottom' }} />
          Скачать листовку
        </a>
      </p>
    </div>
  )
}
