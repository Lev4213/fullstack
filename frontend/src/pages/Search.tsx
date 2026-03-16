import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { getPets, getPetImageUrl, type PetFilters } from '../api/pets'
import type { Pet } from '../types'

export default function Search() {
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLost, setIsLost] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('')
  const [species, setSpecies] = useState('')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState('')
  const [color, setColor] = useState('')
  const [dateSingle, setDateSingle] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const f: PetFilters = { is_lost: isLost }
    if (city) f.city = city
    if (species) f.species = species
    if (breed) f.breed = breed
    if (sex) f.sex = sex
    if (color) f.color = color
    if (dateSingle) {
      f.date_from = dateSingle
      f.date_to = `${dateSingle}T23:59:59`
    }
    getPets(f)
      .then((data) => { if (!cancelled) { setPets(data); setFetchError(null) } })
      .catch((err) => { if (!cancelled) { setPets([]); setFetchError(err instanceof Error ? err.message : 'Не удалось загрузить объявления') } })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isLost, city, species, breed, sex, color, dateSingle])

  const filteredBySearch = useMemo(() => {
    if (!searchQuery.trim()) return pets
    const q = searchQuery.trim().toLowerCase()
    return pets.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.species.toLowerCase().includes(q) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.breed && p.breed.toLowerCase().includes(q))
    )
  }, [pets, searchQuery])

  return (
    <div className="page search-page">
      <div className="search-tabs">
        <button
          type="button"
          className={`search-tab ${isLost ? 'search-tab-active' : ''}`}
          onClick={() => setIsLost(true)}
        >
          Потерявшиеся
        </button>
        <button
          type="button"
          className={`search-tab ${!isLost ? 'search-tab-active' : ''}`}
          onClick={() => setIsLost(false)}
        >
          Найденные
        </button>
      </div>

      <div className="search-bar-row">
        <div className="search-input-wrap">
          <input
            type="search"
            placeholder="Поиск по объявлениям"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
          <img src="/icon-wrapper.svg" alt="" className="search-input-icon" aria-hidden />
        </div>
        <div className="search-meta">
          <span className="search-city-label">
            <img src="/map-2.svg" alt="" className="search-city-icon" aria-hidden />
            Выберите свой город
          </span>
          <input
            type="text"
            placeholder="Город"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="search-city-input"
          />
          <span className="search-total">Всего найдено объявлений: {filteredBySearch.length}</span>
        </div>
      </div>

      <div className="search-filters">
        <label className="search-filter-label">
          Вид животного
          <select value={species} onChange={(e) => setSpecies(e.target.value)}>
            <option value="">—</option>
            <option value="кошка">Кошка</option>
            <option value="собака">Собака</option>
            <option value="другое">Другое</option>
          </select>
        </label>
        <label className="search-filter-label">
          Порода
          <input
            type="text"
            placeholder="Порода"
            value={breed}
            onChange={(e) => setBreed(e.target.value)}
          />
        </label>
        <label className="search-filter-label">
          Пол
          <select value={sex} onChange={(e) => setSex(e.target.value)}>
            <option value="">—</option>
            <option value="male">Самец</option>
            <option value="female">Самка</option>
          </select>
        </label>
        <label className="search-filter-label">
          Цвет шерсти
          <input
            type="text"
            placeholder="Цвет"
            value={color}
            onChange={(e) => setColor(e.target.value)}
          />
        </label>
        <label className="search-filter-label search-date-label">
          Дата пропажи/находки
          <input
            type="date"
            value={dateSingle}
            onChange={(e) => setDateSingle(e.target.value)}
          />
        </label>
      </div>

      {fetchError && <p className="search-error">Ошибка: {fetchError}. Проверьте, что бэкенд запущен (uvicorn) и база доступна.</p>}
      {loading ? (
        <p className="search-loading">Загрузка...</p>
      ) : (
        <div className="search-results">
          <ul className="search-card-grid">
            {filteredBySearch.map((pet) => (
              <li key={pet.id}>
                <Link to={`/pet/${pet.id}`} className="search-card">
                  <div className="search-card-image">
                    {pet.image_path ? (
                      <img src={getPetImageUrl(pet.image_path) ?? ''} alt="" />
                    ) : (
                      <span className="search-card-image-placeholder">{pet.species.slice(0, 1)}</span>
                    )}
                  </div>
                  <h3 className="search-card-title">
                    {pet.is_lost ? 'Пропал' : 'Найден'} {pet.species} по кличке {pet.name}
                  </h3>
                  <p className="search-card-location">
                    Район находки/пропажи: {pet.last_seen_place || pet.city || '—'}
                  </p>
                  <p className="search-card-date">
                    Дата: {pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleDateString('ru-RU') : '—'}
                  </p>
                  <p className="search-card-features">
                    Особые приметы: {pet.description || '—'}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          {filteredBySearch.length === 0 && <p className="search-empty">Объявлений не найдено</p>}
        </div>
      )}
    </div>
  )
}
