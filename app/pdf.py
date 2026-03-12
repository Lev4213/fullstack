import os
from io import BytesIO

from reportlab.lib.pagesizes import A4
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

# Шрифт с кириллицей: пробуем Arial (Windows) или встроенный DejaVu
_FONT_NAME = "Helvetica"
try:
    _arial_path = os.path.join(os.environ.get("WINDIR", ""), "Fonts", "arial.ttf")
    if os.path.isfile(_arial_path):
        pdfmetrics.registerFont(TTFont("ArialCyr", _arial_path))
        _FONT_NAME = "ArialCyr"
    else:
        # Linux и др.: часто есть DejaVu в reportlab или системе
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


def render_pet_flyer_pdf(*, title: str, lines: list) -> bytes:
    buf = BytesIO()
    c = canvas.Canvas(buf, pagesize=A4)
    width, height = A4

    y = height - 60
    c.setFont(_FONT_NAME, 20)
    c.drawString(50, y, title)

    y -= 40
    c.setFont(_FONT_NAME, 12)
    for line in lines:
        if not line:
            y -= 10
            continue
        c.drawString(50, y, line[:120])
        y -= 18
        if y < 60:
            c.showPage()
            y = height - 60
            c.setFont(_FONT_NAME, 12)

    c.showPage()
    c.save()
    return buf.getvalue()
