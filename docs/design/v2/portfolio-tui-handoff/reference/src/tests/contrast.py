import re
css=open(__import__('sys').argv[1]).read()
blocks=re.findall(r'(?::root, )?\[data-skin="([\w-]+)"\]\s*\{([^}]*)\}',css)
def lum(h):
    h=h.lstrip('#'); r,g,b=[int(h[i:i+2],16)/255 for i in (0,2,4)]
    f=lambda c: c/12.92 if c<=0.03928 else ((c+0.055)/1.055)**2.4
    return 0.2126*f(r)+0.7152*f(g)+0.0722*f(b)
def cr(a,b):
    la,lb=lum(a),lum(b); 
    if la<lb: la,lb=lb,la
    return (la+0.05)/(lb+0.05)
bad=0
for name,body in blocks:
    t=dict(re.findall(r'--([\w-]+):\s*(#[0-9a-fA-F]{6})',body))
    checks=[('text','bg'),('text','panel'),('muted','bg'),('muted','panel'),('muted','element'),('muted','accent-subtle'),('text','accent-subtle'),('accent','bg'),('accent','panel'),('accent','element'),('accent-fg','accent'),('ok','bg'),('ok','panel'),('warn','bg'),('warn','panel'),('danger','bg'),('bg','text'),('accent','accent-subtle'),('border-strong','bg')]
    for a,b in checks:
        r=cr(t[a],t[b]); lim=3 if a=='border-strong' else 4.5
        if r<lim: bad+=1; print(f'{name}: {a} on {b} = {r:.2f} (<{lim})')
print('done, failures:',bad)
