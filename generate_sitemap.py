import glob
from datetime import date

today = date.today().isoformat()
base_url = "https://transferkharkiv.com.ua"

EXCLUDE_SLUGS = {
    "taksi-kharkiv-izyum", "taksi-kharkiv-kryvyy-rih", "taksi-kharkiv-kyyiv",
    "taksi-kharkiv-mykolayiv", "taksi-kharkiv-vinnytsya", "taksi-kharkiv-kropyvnytskyy",
    "taksi-kyyiv-kharkiv", "taksi-izyum-kharkiv", "taksi-kryvyy-rih-kharkiv",
    "taksi-mykolayiv-kharkiv", "taksi-vinnytsya-kharkiv", "taksi-kropyvnytskyy-kharkiv",
}

folders = sorted(d.rstrip('/') for d in glob.glob('taksi-*/') if d.rstrip('/') not in EXCLUDE_SLUGS)

xml = ['<?xml version="1.0" encoding="UTF-8"?>']
xml.append('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
xml.append('  <url>')
xml.append(f'    <loc>{base_url}/</loc>')
xml.append(f'    <lastmod>{today}</lastmod>')
xml.append('    <priority>1.0</priority>')
xml.append('  </url>')
for slug in folders:
    xml.append('  <url>')
    xml.append(f'    <loc>{base_url}/{slug}/</loc>')
    xml.append(f'    <lastmod>{today}</lastmod>')
    xml.append('    <priority>0.8</priority>')
    xml.append('  </url>')
xml.append('</urlset>')

with open('sitemap.xml', 'w', encoding='utf-8') as f:
    f.write('\n'.join(xml) + '\n')

print(f"Generated sitemap.xml with {len(folders) + 1} URLs ({len(folders)} routes + homepage)")
