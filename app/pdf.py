import os
from io import BytesIO
from pathlib import Path
from typing import Iterable, Optional

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

_FONT_NAME = "Helvetica"
try:
    _arial_path = os.path.join(os.environ.get("WINDIR", ""), "Fonts", "arial.ttf")
    if os.path.isfile(_arial_path):
        pdfmetrics.registerFont(TTFont("ArialCyr", _arial_path))
        _FONT_NAME = "ArialCyr"
    else:
        for path in (
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
            "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        ):
            if os.path.isfile(path):
                pdfmetrics.registerFont(TTFont("CyrillicFont", path))
                _FONT_NAME = "CyrillicFont"
                break
except Exception:
    pass


def _wrap_text(text: str, max_chars: int) -> list[str]:
    """Простой перенос строк по длине (для листовки хватает)."""
    t = " ".join((text or "").split())
    if not t:
        return [""]
    out: list[str] = []
    cur = ""
    for w in t.split(" "):
        if not cur:
            cur = w
            continue
        if len(cur) + 1 + len(w) <= max_chars:
            cur = f"{cur} {w}"
        else:
            out.append(cur)
            cur = w
    if cur:
        out.append(cur)
    return out


def _resolve_upload_path(image_path: str) -> Optional[Path]:
    # image_path приходит как "pets/filename.jpg" (относительно /uploads/)
    rel = image_path.lstrip("/").replace("\\", "/")
    base = Path(__file__).resolve().parents[1] / "uploads"
    p = base / rel
    return p if p.is_file() else None


def render_pet_flyer_pdf(*, title: str, lines: Iterable[str], image_path: Optional[str] = None) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    margin = 42
    content_w = width - margin * 2

    # Header
    header_h = 86
    c.setFillColor(colors.HexColor("#FF9000"))
    c.rect(0, height - header_h, width, header_h, stroke=0, fill=1)
    c.setFillColor(colors.white)
    c.setFont(_FONT_NAME, 22)
    c.drawString(margin, height - 52, title[:70])
    c.setFont(_FONT_NAME, 11)
    c.drawString(margin, height - 72, "Если вы видели питомца — пожалуйста, свяжитесь по контактам ниже.")

    y_top = height - header_h - 18

    # Фото справа, текст слева
    photo_w = 220
    photo_h = 220
    gap = 18
    left_w = content_w - photo_w - gap
    x_left = margin
    x_photo = margin + left_w + gap
    y_photo = y_top - photo_h

    # Frame for photo
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.setFillColor(colors.HexColor("#F8FAFC"))
    c.rect(x_photo, y_photo, photo_w, photo_h, stroke=1, fill=1)

    img_file: Optional[Path] = None
    if image_path:
        img_file = _resolve_upload_path(image_path)
    if img_file:
        try:
            img = ImageReader(str(img_file))
            iw, ih = img.getSize()
            scale = min(photo_w / iw, photo_h / ih)
            dw, dh = iw * scale, ih * scale
            dx = x_photo + (photo_w - dw) / 2
            dy = y_photo + (photo_h - dh) / 2
            c.drawImage(img, dx, dy, dw, dh, mask="auto")
        except Exception:
            img_file = None

    if not img_file:
        c.setFillColor(colors.HexColor("#64748B"))
        c.setFont(_FONT_NAME, 12)
        c.drawCentredString(x_photo + photo_w / 2, y_photo + photo_h / 2, "Фото отсутствует")

    # Text block
    c.setFillColor(colors.HexColor("#0F172A"))
    y = y_top
    c.setFont(_FONT_NAME, 12)

    def draw_kv(label: str, value: str, *, max_chars: int = 48):
        nonlocal y
        c.setFillColor(colors.HexColor("#334155"))
        c.setFont(_FONT_NAME, 11)
        c.drawString(x_left, y, label)
        c.setFillColor(colors.HexColor("#0F172A"))
        c.setFont(_FONT_NAME, 12)
        y -= 16
        for part in _wrap_text(value, max_chars):
            c.drawString(x_left, y, part)
            y -= 15
        y -= 6

    # Превращаем входные строки в “секции”
    # Ожидаем формат "Ключ: значение", пустая строка — разделитель.
    for raw in lines:
        s = (raw or "").strip()
        if not s:
            y -= 6
            continue
        if ":" in s:
            k, v = s.split(":", 1)
            draw_kv(k.strip(), v.strip())
        else:
            for part in _wrap_text(s, 54):
                c.drawString(x_left, y, part)
                y -= 15
            y -= 6

    # Footer
    c.setStrokeColor(colors.HexColor("#E5E7EB"))
    c.line(margin, margin + 42, width - margin, margin + 42)
    c.setFillColor(colors.HexColor("#475569"))
    c.setFont(_FONT_NAME, 9)
    c.drawString(margin, margin + 26, "Листовка сформирована автоматически. Пожалуйста, перепроверьте контакты.")

    c.showPage()
    c.save()
    return buf.getvalue()
