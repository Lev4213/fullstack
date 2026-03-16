-- Таблица для нескольких фото у объявления
CREATE TABLE IF NOT EXISTS pet_images (
    id SERIAL PRIMARY KEY,
    pet_id INTEGER NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    image_path VARCHAR(500) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS ix_pet_images_pet_id ON pet_images(pet_id);
