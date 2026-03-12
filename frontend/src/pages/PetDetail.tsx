import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getPet, getFlyerUrl } from '../api/pets'
import type { Pet } from '../types'

export default function PetDetail() {
  const { id } = useParams<{ id: string }>()
  const [pet, setPet] = useState<Pet | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    getPet(Number(id))
      .then(setPet)
      .catch(() => setError('Объявление не найдено'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="page"><p>Загрузка...</p></div>
  if (error || !pet) return <div className="page"><p>{error || 'Не найдено'}</p><Link to="/search">К списку</Link></div>

  const flyerUrl = getFlyerUrl(pet.id)
  const token = localStorage.getItem('token')
  const href = token ? `${flyerUrl}` : flyerUrl

  return (
    <div className="page">
      <p><Link to="/search">← К поиску</Link></p>
      <h1>{pet.name}</h1>
      <p><strong>Вид:</strong> {pet.species}</p>
      {pet.breed && <p><strong>Порода:</strong> {pet.breed}</p>}
      {pet.sex && <p><strong>Пол:</strong> {pet.sex}</p>}
      {pet.city && <p><strong>Город:</strong> {pet.city}</p>}
      <p><strong>Статус:</strong> {pet.is_lost ? 'Потерян' : 'Найден'}</p>
      {pet.last_seen_place && <p><strong>Где видели:</strong> {pet.last_seen_place}</p>}
      {pet.last_seen_date && <p><strong>Когда:</strong> {new Date(pet.last_seen_date).toLocaleDateString()}</p>}
      {pet.description && <p><strong>Описание:</strong> {pet.description}</p>}
      {(pet.contact_name || pet.contact_phone || pet.contact_email) && (
        <p><strong>Контакт:</strong> {[pet.contact_name, pet.contact_phone, pet.contact_email].filter(Boolean).join(', ')}</p>
      )}
      <p>
        <a href={href} target="_blank" rel="noreferrer" download>Скачать листовку (PDF)</a>
      </p>
    </div>
  )
}
