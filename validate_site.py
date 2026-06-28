"""
Валідатор HTML сторінок transfer-site.
Запускати після кожного масового патчу: python3 validate_site.py
"""
from pathlib import Path
import re

BASE = Path(__file__).parent
errors = []
warnings = []

# Правильні ціни з db.py (тільки ті що знаємо точно)
KNOWN_PRICES = {
    'такsi-kharkiv-kyiv': 14000, 'taksi-kharkiv-dnipro': 6200,
    'taksi-kharkiv-lviv': 28500, 'taksi-kharkiv-odesa': 18500,
    'taksi-kyiv-kharkiv': 15000, 'taksi-kharkiv-poltava': 4000,
    'taksi-kharkiv-kramatorsk': 12000, 'taksi-kharkiv-sumy': 6000,
    'taksi-kharkiv-kremenchuk': 6800, 'taksi-kyiv-kramatorsk': 25000,
}

pages = list(BASE.rglob('taksi-*/index.html'))
print(f"Перевіряємо {len(pages)} сторінок...\n")

for f in sorted(pages):
    slug = f.parent.name
    text = f.read_text()

    # Пропускаємо redirect сторінки
    if 'location.replace' in text:
        continue

    # 1. Дублювання тексту
    if 'Підтвердження· Підтвердження' in text:
        errors.append(f"❌ {slug}: дублювання 'Підтвердження'")

    # 2. Стара ціна не відповідає відомій
    price_m = re.search(r'class="price-big">([\d\s\xa0]+)<small>', text)
    if price_m and slug in KNOWN_PRICES:
        actual = int(price_m.group(1).replace('\xa0','').replace(' ','').strip())
        expected = KNOWN_PRICES[slug]
        if actual != expected:
            errors.append(f"❌ {slug}: ціна {actual} != {expected}")

    # 3. Title і price-big не збігаються
    title_m = re.search(r'<title>[^|]+\|\s*([\d\s\xa0&;]+)\s*грн', text)
    price_m2 = re.search(r'class="price-big">([\d\s\xa0]+)<small>', text)
    if title_m and price_m2:
        title_price = title_m.group(1).replace('&nbsp;','').replace('\xa0','').replace(' ','').strip()
        page_price = price_m2.group(1).replace('\xa0','').replace(' ','').strip()
        if title_price != page_price:
            errors.append(f"❌ {slug}: title ціна '{title_price}' != page ціна '{page_price}'")

    # 4. FAQ з ціною яка не відповідає page
    if price_m2:
        page_price_raw = price_m2.group(1).replace('\xa0','').replace(' ','').strip()
        faq_prices = re.findall(r'([\d\xa0 ]+)\s*грн за весь автомобіль', text)
        for fp in faq_prices:
            fp_clean = fp.replace('\xa0','').replace(' ','').strip()
            if fp_clean != page_price_raw and fp_clean.isdigit():
                warnings.append(f"⚠️  {slug}: FAQ ціна '{fp_clean}' != page '{page_price_raw}'")

    # 5. Canonical відсутній
    if 'rel="canonical"' not in text:
        errors.append(f"❌ {slug}: немає canonical")

    # 6. GA4 відсутній
    if 'G-8QK3HWZQ93' not in text:
        warnings.append(f"⚠️  {slug}: немає GA4")

    # 7. Schema.org ціна не відповідає page
    schema_m = re.search(r'"price":"(\d+)"', text)
    if schema_m and price_m2:
        schema_price = schema_m.group(1)
        page_price_raw = price_m2.group(1).replace('\xa0','').replace(' ','').strip()
        if schema_price != page_price_raw:
            warnings.append(f"⚠️  {slug}: schema price '{schema_price}' != page '{page_price_raw}'")

print(f"ПОМИЛКИ ({len(errors)}):")
for e in errors[:20]:
    print(f"  {e}")

print(f"\nПОПЕРЕДЖЕННЯ ({len(warnings)}):")
for w in warnings[:20]:
    print(f"  {w}")

if not errors:
    print("\n✅ Критичних помилок не знайдено")
else:
    print(f"\n❌ Знайдено {len(errors)} критичних помилок")
