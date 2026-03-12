import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPets, type PetFilters } from '../api/pets'
import type { Pet } from '../types'

export default function Search() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [species, setSpecies] = useState('')
  const [city, setCity] = useState('')
  const [isLost, setIsLost] = useState<boolean | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const f: PetFilters = {}
    if (species) f.species = species
    if (city) f.city = city
    if (isLost !== undefined) f.is_lost = isLost
    getPets(f)
      .then((data) => { if (!cancelled) setPets(data) })
      .catch(() => { if (!cancelled) setPets([]) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [species, city, isLost])

  return (
    <div className="page">
      <h1>Поиск объявлений</h1>
      <div className="filters">
        <input placeholder="Вид (например, кошка)" value={species} onChange={(e) => setSpecies(e.target.value)} />
        <input placeholder="Город" value={city} onChange={(e) => setCity(e.target.value)} />
        <select value={isLost === undefined ? '' : isLost ? 'lost' : 'found'} onChange={(e) => setIsLost(e.target.value === '' ? undefined : e.target.value === 'lost')}>
          <option value="">Все</option>
          <option value="lost">Потерян</option>
          <option value="found">Найден</option>
        </select>
      </div>
      {loading ? <p>Загрузка...</p> : (
        <ul className="pet-list">
          {pets.map((pet) => (
            <li key={pet.id}>
              <Link to={`/pet/${pet.id}`}>
                <strong>{pet.name}</strong> — {pet.species}{pet.city ? `, ${pet.city}` : ''} ({pet.is_lost ? 'потерян' : 'найден'})
              </Link>
            </li>
          ))}
        </ul>
      )}
      {!loading && pets.length === 0 && <p>Объявлений нет</p>}
    </div>
  )
}
