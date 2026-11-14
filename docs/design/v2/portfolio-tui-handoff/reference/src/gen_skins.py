# Generate skin blocks from each theme's OFFICIAL palette (accent, green, yellow, red),
# then minimally darken/lighten only what fails WCAG AA. Prints every adjustment.
import re
def hx(h): h=h.lstrip('#'); return [int(h[i:i+2],16) for i in (0,2,4)]
def toh(c): return '#%02x%02x%02x'%tuple(max(0,min(255,round(v))) for v in c)
def mix(a,b,w): return toh([x*(1-w)+y*w for x,y in zip(hx(a),hx(b))])
def lum(h):
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    r,g,b=[v/255 for v in hx(h)]; return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=sorted([lum(a),lum(b)],reverse=True); return (la+0.05)/(lb+0.05)
S = {
 # id: surfaces..., accent, ok(green), warn(yellow), danger(red), accent-fg, select, scheme
 'ayu-dark':   dict(bg='#0d1017',panel='#0f131a',element='#131721',border='#1c212b',bs='#6c7380',text='#bfbdb6',muted='#6c7380',accent='#e6b450',ok='#aad94c',warn='#ffb454',danger='#d95757',fg='#0d1017',select='#273747',scheme='dark'),
 'ayu-light':  dict(bg='#fcfcfc',panel='#f8f9fa',element='#f3f4f5',border='#e7eaed',bs='#8a9199',text='#5c6166',muted='#8a9199',accent='#ffaa33',ok='#86b300',warn='#f2ae49',danger='#e65050',fg='#fcfcfc',select='#d8e6f6',scheme='light'),
 'catppuccin-mocha': dict(bg='#1e1e2e',panel='#181825',element='#313244',border='#45475a',bs='#7f849c',text='#cdd6f4',muted='#a6adc8',accent='#cba6f7',ok='#a6e3a1',warn='#f9e2af',danger='#f38ba8',fg='#11111b',select='#45475a',scheme='dark'),
 'catppuccin-latte': dict(bg='#eff1f5',panel='#e6e9ef',element='#dce0e8',border='#ccd0da',bs='#8c8fa1',text='#4c4f69',muted='#5c5f77',accent='#8839ef',ok='#40a02b',warn='#df8e1d',danger='#d20f39',fg='#eff1f5',select='#bcc0cc',scheme='light'),
 'dracula':    dict(bg='#282a36',panel='#21222c',element='#343746',border='#44475a',bs='#6272a4',text='#f8f8f2',muted='#6272a4',accent='#bd93f9',ok='#50fa7b',warn='#f1fa8c',danger='#ff5555',fg='#282a36',select='#44475a',scheme='dark'),
 'tokyo-night':dict(bg='#1a1b26',panel='#16161e',element='#292e42',border='#3b4261',bs='#737aa2',text='#c0caf5',muted='#a9b1d6',accent='#7aa2f7',ok='#9ece6a',warn='#e0af68',danger='#f7768e',fg='#1a1b26',select='#283457',scheme='dark'),
 'nord':       dict(bg='#2e3440',panel='#3b4252',element='#3b4252',border='#434c5e',bs='#616e88',text='#eceff4',muted='#d8dee9',accent='#88c0d0',ok='#a3be8c',warn='#ebcb8b',danger='#bf616a',fg='#2e3440',select='#4c566a',scheme='dark'),
 'rose-pine':  dict(bg='#191724',panel='#1f1d2e',element='#26233a',border='#403d52',bs='#6e6a86',text='#e0def4',muted='#908caa',accent='#ebbcba',ok='#9ccfd8',warn='#f6c177',danger='#eb6f92',fg='#191724',select='#403d52',scheme='dark'),
 'rose-pine-dawn': dict(bg='#faf4ed',panel='#fffaf3',element='#f2e9e1',border='#dfdad9',bs='#9893a5',text='#575279',muted='#797593',accent='#d7827e',ok='#286983',warn='#ea9d34',danger='#b4637a',fg='#fffaf3',select='#dfdad9',scheme='light'),
}
need={'text':(['bg','panel','element','subtle'],4.6),'muted':(['bg','panel','element','subtle'],4.6),'accent':(['bg','panel','element','subtle'],4.6),
      'ok':(['bg','panel'],4.6),'warn':(['bg','panel'],4.6),'danger':(['bg','panel'],4.6),'bs':(['bg','panel'],3.1)}
names={'bs':'border-strong'}
out=[]; log=[]
for sid,t in S.items():
    t=dict(t); dark=t['scheme']=='dark'
    t['subtle']=mix(t['panel'],t['accent'],0.16 if dark else 0.12)
    for tok,(bgs,lim) in need.items():
        o=t[tok]; c=o; k=0; target='#ffffff' if dark else '#000000'
        while min(cr(c,t[b]) for b in bgs)<lim and k<60:
            k+=1; c=mix(o,target,0.03*k)
        if c!=o: log.append(f'{sid:17} {names.get(tok,tok):13} {o} -> {c}'); t[tok]=c
    # accent-fg must read on the accent fill
    if cr(t['fg'],t['accent'])<4.5:
        t['fg']='#ffffff' if cr('#ffffff',t['accent'])>cr('#000000',t['accent']) else t['bg'] if cr(t['bg'],t['accent'])>=4.5 else '#000000'
    if sid=='ayu-light': t['text']='#3e4348'   # keep text above muted (official text ≈ adjusted muted)
    shadow='rgba(0, 0, 0, 0.55)' if dark else 'rgba(40, 40, 60, 0.18)'
    body=(f"  --bg: {t['bg']}; --panel: {t['panel']}; --element: {t['element']}; --border: {t['border']}; --border-strong: {t['bs']};\n"
          f"  --text: {t['text']}; --muted: {t['muted']}; --accent: {t['accent']}; --accent-fg: {t['fg']}; --accent-subtle: {t['subtle']};\n"
          f"  --ok: {t['ok']}; --warn: {t['warn']}; --danger: {t['danger']}; --select: {t['select']}; --shadow: {shadow};\n"
          f"  color-scheme: {t['scheme']};\n")
    sel=':root, [data-skin="ayu-dark"]' if sid=='ayu-dark' else f'[data-skin="{sid}"]'
    out.append(f'{sel} {{\n{body}}}\n')
    if sid=='ayu-light':
        out.append('/* no JavaScript: follow the OS with Ayu Light */\n@media (prefers-color-scheme: light) { :root:not([data-skin]) {\n'+body+'} }\n')
    S[sid]=t
css=''.join(out)
p='p1-head.html'; s=open(p).read()
i=s.index(':root, [data-skin="ayu-dark"] {'); j=s.index(':root {\n  --font')
s=s[:i]+css+s[j:]
s=re.sub(r'Only non-green, non-amber palette slots are used; a few values are\n   darkened or lightened slightly to pass WCAG AA \(see the design system view\)\.',
         "Each theme keeps its own official accent, green, yellow and red; values\n   that fail WCAG AA are darkened or lightened just enough to pass.", s)
open(p,'w').write(s)
open('skins.json','w').write(__import__('json').dumps(S))
print('\n'.join(log))
