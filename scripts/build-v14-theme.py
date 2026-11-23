"""Build the V0.11 brown brand palette without changing layout or images."""
from pathlib import Path
import re, colorsys
base=Path(__file__).resolve().parent.parent
html=(base/'index.html').read_text()
files=re.findall(r'href="([^"?]+\.css)\?',html)
HEX=re.compile(r'#[0-9a-fA-F]{8}\b|#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{4}\b|#[0-9a-fA-F]{3}\b')
def color(match):
    raw=match.group()[1:]
    if len(raw) in (3,4): raw=''.join(c*2 for c in raw)
    rgb=[int(raw[i:i+2],16)/255 for i in (0,2,4)]
    h,l,s=colorsys.rgb_to_hls(*rgb)
    if not (75<=h*360<=175 or 190<=h*360<=245) or s<.05:return match.group()
    target=colorsys.hls_to_rgb(30/360,l,min(s,.42))
    return '#'+''.join(f'{round(c*255):02x}' for c in target)+raw[6:]
def rules(text):
    text=re.sub(r'/\*[\s\S]*?\*/','',text)
    output=[];start=0;i=0
    while i<len(text):
        if text[i]!='{':i+=1;continue
        pre=text[start:i].strip();depth=1;j=i+1;quote=None
        while j<len(text) and depth:
            c=text[j]
            if quote:
                if c==quote and text[j-1]!='\\':quote=None
            elif c in ('"',"'"):quote=c
            elif c=='{':depth+=1
            elif c=='}':depth-=1
            j+=1
        body=text[i+1:j-1]
        if pre.startswith('@'):
            if pre.startswith(('@media','@supports','@layer')):
                inner=rules(body)
                if inner:output.append(pre+'{\n'+inner+'\n}')
        elif not re.search(r'(?:\.tag\.ok|\.notice\.green|success|danger|error|warn)',pre):
            declarations=[]
            for decl in body.split(';'):
                if ':' not in decl:continue
                prop,value=decl.split(':',1)
                if not re.search(r'(?:color|background|border|shadow|fill|stroke|--)',prop) or 'url(' in value:continue
                changed=HEX.sub(color,value)
                if changed!=value:declarations.append(prop.strip()+':'+changed.strip())
            if declarations:output.append(pre+'{'+ ';'.join(declarations)+'}')
        i=j;start=j
    return '\n'.join(output)
chunks=['/* V0.11 宸 Club 棕色主题。由 scripts/build-v14-theme.py 生成，仅覆盖品牌色；不改变布局或照片。 */']
for filename in files:
    if filename in ('v14-theme.css','v15-brand.css','assets/icons.css'):continue
    css=rules((base/filename).read_text())
    if css:chunks.extend(['/* '+filename+' */',css])
chunks.append(':root,body[data-desktop="true"]{--primary:#79583d;--ink:#79583d;--deep:#493528;--gold:#a08050;--gold-dark:#785735;--soft:#f1eae1;--text:#3e352e;--muted:#958779}')
(base/'v14-theme.css').write_text('\n'.join(chunks)+'\n')
print(f'Built {len(chunks)//2} source layers, {(base/"v14-theme.css").stat().st_size} bytes')
