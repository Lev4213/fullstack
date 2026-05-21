"""Модульные тесты генерации PDF."""

import pytest

from app.pdf import _wrap_text, render_pet_flyer_pdf


@pytest.mark.unit
def test_wrap_text_splits_long_line():
    text = "один два три четыре пять шесть семь восемь девять десять"
    lines = _wrap_text(text, max_chars=15)
    assert len(lines) >= 2
    assert all(len(line) <= 15 or " " not in line for line in lines)


@pytest.mark.unit
def test_render_pet_flyer_pdf_returns_bytes():
    pdf = render_pet_flyer_pdf(
        title="Тест",
        lines=["Имя: Барсик", "Вид: кошка"],
        image_path=None,
    )
    assert pdf.startswith(b"%PDF")
