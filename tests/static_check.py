from pathlib import Path
from html.parser import HTMLParser
from urllib.parse import urlparse, unquote
from collections import Counter
ROOT=Path(__file__).resolve().parents[1]
class Page(HTMLParser):
    def __init__(self,text):
        super().__init__();self.ids=[];self.links=[];self.feed(text)
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs)
        if 'id' in attrs:self.ids.append(attrs['id'])
        for k in ['href','src']:
            if k in attrs:self.links.append(attrs[k])
pages={p:Page(p.read_text()) for p in ROOT.glob('*.html')}
errors=[]
for path,page in pages.items():
    for id,count in Counter(page.ids).items():
        if count>1:errors.append(f'{path.name}: duplicate ID {id}')
    for value in page.links:
        u=urlparse(value)
        if u.scheme or u.netloc:continue
        target=(path.parent/unquote(u.path)).resolve() if u.path else path
        if not target.is_file():errors.append(f'{path.name}: missing {value}');continue
        if u.fragment and target in pages and unquote(u.fragment) not in pages[target].ids:errors.append(f'{path.name}: missing fragment {value}')
if errors:raise SystemExit('\n'.join(errors))
print(f'Passed: {len(pages)} HTML pages, local assets, links, fragments and unique IDs.')
