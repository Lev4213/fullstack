# Тестирование (Лабораторная работа №5)



## Тестовая модель



### Критические сценарии



| Сценарий | Уровень | Файлы |

|----------|---------|-------|

| Регистрация / вход / `/auth/me` | integration, e2e | `tests/integration/test_auth_api.py`, `tests/e2e/test_user_journey.py` |

| CRUD объявлений, права владельца | integration, e2e | `tests/integration/test_pets_api.py`, `tests/e2e/test_user_journey.py` |

| Поиск, фильтры, пагинация | integration | `tests/integration/test_pets_api.py` |

| Загрузка фото и PDF-листовка | integration | `tests/integration/test_pets_api.py` |

| UI: форма входа, навигация | unit (frontend) | `frontend/src/**/*.test.tsx` |



### Бизнес-правила



- Пароль не короче 6 символов (`UserCreate`, `ChangePasswordRequest`).

- Телефон — минимум 10 цифр (`PetCreate`).

- Редактировать/удалять объявление может только владелец (403).

- В списке только активные объявления (`is_active=True`).



### Зоны риска



| Область | Риск | Покрытие |

|---------|------|----------|

| JWT / сессия | высокий | `test_auth_*`, e2e logout |

| Права на pets | высокий | `test_update_forbidden_*`, e2e permissions |

| Файлы (uploads) | средний | `test_upload_photo_*` |

| PDF | низкий | `tests/unit/test_pdf.py` |

| Внешний API | н/д в MVP | `/health` как интеграционная точка |



## Структура



```

tests/

  conftest.py          # SQLite in-memory, фикстуры client / auth

  unit/                # @pytest.mark.unit

  integration/         # @pytest.mark.integration

  e2e/                 # @pytest.mark.e2e (сквозные API-сценарии)

frontend/src/

  **/*.test.ts(x)      # Vitest: unit + компоненты

```



## Запуск



### Всё одной командой (Windows)



```powershell

.\scripts\run-all-tests.ps1

```



### Backend (из корня репозитория)



```powershell

python -m venv .venv

.\.venv\Scripts\pip install -r requirements-dev.txt

$env:DATABASE_URL = "sqlite+aiosqlite:///:memory:"

.\.venv\Scripts\python -m pytest -v

```



С покрытием:



```powershell

.\.venv\Scripts\python -m pytest --cov=app --cov-report=term-missing

```



Только быстрые (без сквозных e2e):



```powershell

.\.venv\Scripts\python -m pytest -m "not e2e"

```



### Frontend



```powershell

cd frontend

npm install

npm run test

npm run test:coverage

```



## Метрики



| Слой | Инструмент | Порог (минимум) |

|------|------------|-----------------|

| Backend | pytest-cov | 45% строк `app/` |

| Frontend | vitest coverage | 40% (api, components, pages) |



Разделение по скорости:



- **unit** — секунды (`pytest -m unit`, Vitest)

- **integration** — API с тестовой БД

- **e2e** — сквозные сценарии в `tests/e2e/` (полный HTTP-поток через FastAPI)



## Именование



- Backend: `test_<модуль>_<поведение>.py`, функции `test_<действие>_<ожидание>`

- Frontend: `*.test.ts(x)` рядом с модулем


