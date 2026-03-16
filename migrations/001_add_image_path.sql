-- Добавить колонку image_path в таблицу pets (для фото объявлений)
ALTER TABLE pets ADD COLUMN IF NOT EXISTS image_path VARCHAR(500);
