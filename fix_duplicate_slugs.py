import os, shutil

ROOT = os.path.dirname(os.path.abspath(__file__))
BASE_URL = "https://transferkharkiv.com.ua"

OPS = [
    ("taksi-kharkiv-izyum", "taksi-kharkiv-izium", "stub"),
    ("taksi-kharkiv-kryvyy-rih", "taksi-kharkiv-kryvyi-rih", "stub"),
    ("taksi-kharkiv-kyyiv", "taksi-kharkiv-kyiv", "stub"),
    ("taksi-kharkiv-mykolayiv", "taksi-kharkiv-mykolaiv", "stub"),
    ("taksi-kharkiv-vinnytsya", "taksi-kharkiv-vinnytsia", "stub"),
    ("taksi-kharkiv-kropyvnytskyy", "taksi-kharkiv-kropyvnytskyi", "stub"),
    ("taksi-kyyiv-kharkiv", "taksi-kyiv-kharkiv", "stub"),
    ("taksi-izyum-kharkiv", "taksi-izium-kharkiv", "rename"),
    ("taksi-kryvyy-rih-kharkiv", "taksi-kryvyi-rih-kharkiv", "rename"),
    ("taksi-mykolayiv-kharkiv", "taksi-mykolaiv-kharkiv", "rename"),
    ("taksi-vinnytsya-kharkiv", "taksi-vinnytsia-kharkiv", "rename"),
    ("taksi-kropyvnytskyy-kharkiv", "taksi-kropyvnytskyi-kharkiv", "rename"),
]

STUB = """<!DOCTYPE html>
<html lang="uk">
<head>
<meta charset="UTF-8">
<title>Сторінку переміщено</title>
<link rel="canonical" href="{url}">
<meta http-equiv="refresh" content="0; url={url}">
</head>
<body>
<p>Сторінку переміщено: <a href="{url}">{url}</a></p>
</body>
</html>
"""

for old, new, action in OPS:
    old_dir = os.path.join(ROOT, old)
    new_dir = os.path.join(ROOT, new)
    if not os.path.isdir(old_dir):
        print(f"⚠ нет папки {old}, пропуск")
        continue
    if action == "rename":
        if os.path.isdir(new_dir):
            print(f"⚠ {new} уже существует, пропускаю rename")
        else:
            shutil.copytree(old_dir, new_dir)
            idx = os.path.join(new_dir, "index.html")
            content = open(idx, encoding="utf-8").read().replace(old, new)
            open(idx, "w", encoding="utf-8").write(content)
            print(f"✓ создано {new} (копия {old})")
    target_url = f"{BASE_URL}/{new}/"
    open(os.path.join(old_dir, "index.html"), "w", encoding="utf-8").write(STUB.format(url=target_url))
    print(f"✓ {old} → редирект-заглушка на {new}")
