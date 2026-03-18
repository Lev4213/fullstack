import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getPets, getPetImageUrl, type PetFilters } from '../api/pets'
import type { Pet } from '../types'

const PAGE_SIZE = 12

export default function Search() {
  const [pets, setPets] = useState<Pet[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [isLost, setIsLost] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [city, setCity] = useState('')
  const [speciesSelect, setSpeciesSelect] = useState('')
  const [speciesCustom, setSpeciesCustom] = useState('')
  const [breed, setBreed] = useState('')
  const [sex, setSex] = useState('')
  const [color, setColor] = useState('')
  const [dateSingle, setDateSingle] = useState('')
  const [page, setPage] = useState(1)

  const species =
    speciesSelect === 'другое' ? speciesCustom.trim() : speciesSelect

  useEffect(() => {
    setPage(1)
  }, [isLost, city, speciesSelect, speciesCustom, breed, sex, color, dateSingle, searchQuery])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const f: PetFilters = {
      is_lost: isLost,
      limit: PAGE_SIZE,
      offset: (page - 1) * PAGE_SIZE,
    }
    if (city) f.city = city
    if (species) f.species = species
    if (breed) f.breed = breed
    if (sex) f.sex = sex
    if (color) f.color = color
    if (dateSingle) {
      f.date_from = dateSingle
    }
    if (searchQuery.trim()) f.q = searchQuery.trim()
    getPets(f)
      .then((data) => {
        if (!cancelled) {
          setPets(data.items)
          setTotal(data.total)
          setFetchError(null)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setPets([])
          setTotal(0)
          setFetchError(err instanceof Error ? err.message : 'Не удалось загрузить объявления')
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isLost, city, species, breed, sex, color, dateSingle, searchQuery, page])

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const to = Math.min(page * PAGE_SIZE, total)

  function isFeminineSpecies(speciesRaw: string | null | undefined): boolean {
    const s = (speciesRaw ?? '').trim().toLowerCase()
    if (!s) return false
    if (s.includes('кошка') || s.includes('собака')) return true
    // простая эвристика для русских существительных
    return s.endsWith('а') || s.endsWith('я')
  }

  function isFeminineBySexOrSpecies(
    sexRaw: string | null | undefined,
    speciesRaw: string | null | undefined
  ): boolean {
    if (sexRaw === 'female') return true
    if (sexRaw === 'male') return false
    return isFeminineSpecies(speciesRaw)
  }

  function lostVerb(sexRaw: string | null | undefined, speciesRaw: string | null | undefined): string {
    return isFeminineBySexOrSpecies(sexRaw, speciesRaw) ? 'Пропала' : 'Пропал'
  }

  function foundVerb(sexRaw: string | null | undefined, speciesRaw: string | null | undefined): string {
    return isFeminineBySexOrSpecies(sexRaw, speciesRaw) ? 'Найдена' : 'Найден'
  }

  function displaySpecies(sexRaw: string | null | undefined, speciesRaw: string): string {
    const s = speciesRaw.trim().toLowerCase()
    if (s === 'кошка') {
      if (sexRaw === 'female') return 'кошка'
      if (sexRaw === 'male') return 'кот'
      return 'кот/кошка'
    }
    if (s === 'собака') {
      if (sexRaw === 'female') return 'собака'
      if (sexRaw === 'male') return 'пёс'
      return 'пёс/собака'
    }
    return speciesRaw
  }

  // Номера страниц для клика: 1 ... 4 5 6 ... 12
  const pageNumbers: (number | 'ellipsis')[] = (() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }
    const list: (number | 'ellipsis')[] = [1]
    if (page > 3) list.push('ellipsis')
    const start = Math.max(2, page - 1)
    const end = Math.min(totalPages - 1, page + 1)
    for (let i = start; i <= end; i++) list.push(i)
    if (page < totalPages - 2) list.push('ellipsis')
    if (totalPages > 1) list.push(totalPages)
    return list
  })()

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
          <span className="search-total">Всего найдено объявлений: {total}</span>
        </div>
      </div>

      <div className="search-filters">
        <label className="search-filter-label">
          Вид животного
          <select
            value={speciesSelect}
            onChange={(e) => {
              const v = e.target.value
              setSpeciesSelect(v)
              if (v !== 'другое') setSpeciesCustom('')
            }}
          >
            <option value="">—</option>
            <option value="кошка">Кот/кошка</option>
            <option value="собака">Пёс/собака</option>
            <option value="другое">Другое…</option>
          </select>
          {speciesSelect === 'другое' && (
            <input
              type="text"
              placeholder="Например: попугай, кролик…"
              value={speciesCustom}
              onChange={(e) => setSpeciesCustom(e.target.value)}
            />
          )}
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
            {pets.map((pet) => (
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
                    {(pet.is_lost ? lostVerb(pet.sex, pet.species) : foundVerb(pet.sex, pet.species))}{' '}
                    {displaySpecies(pet.sex, pet.species)} по кличке {pet.name}
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
          {total > 0 && (
            <div className="search-pagination">
              <p className="search-pagination-info">
                Показано {from}—{to} из {total}
              </p>
              <div className="search-pagination-buttons">
                <button
                  type="button"
                  className="search-pagination-btn"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Назад
                </button>
                <span className="search-pagination-page">
                  Страница {page} из {totalPages}
                </span>
                <div className="search-pagination-numbers" aria-label="Номера страниц">
                  {pageNumbers.map((n, i) =>
                    n === 'ellipsis' ? (
                      <span key={`e-${i}`} className="search-pagination-ellipsis">…</span>
                    ) : (
                      <button
                        key={n}
                        type="button"
                        className={`search-pagination-num ${n === page ? 'active' : ''}`}
                        onClick={() => setPage(n)}
                        aria-label={`Страница ${n}`}
                        aria-current={n === page ? 'page' : undefined}
                      >
                        {n}
                      </button>
                    )
                  )}
                </div>
                <button
                  type="button"
                  className="search-pagination-btn"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Вперёд
                </button>
              </div>
            </div>
          )}
          {total === 0 && !loading && <p className="search-empty">Объявлений не найдено</p>}
        </div>
      )}
    </div>
  )
}
