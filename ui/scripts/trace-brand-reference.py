from PIL import Image
from collections import defaultdict
from pathlib import Path
import math
import sys

# Trace the supplied artwork into flat vector shapes, keeping the original lettering.
img = Image.open(sys.argv[1]).convert('RGBA').crop((225,160,824,823))
w,h=img.size
palette=[(38,38,38),(194,20,24),(255,242,183),(230,200,96),(255,255,255),(160,160,160)]
labels=[]
for r,g,b,a in img.getdata():
    if a<100: labels.append(-1)
    elif max(r,g,b)<100: labels.append(0)
    elif r>g*1.5 and r>b*1.5: labels.append(1)
    elif r>180 and g>150 and b<210 and r-b>35:
        labels.append(2 if g>215 else 3)
    elif min(r,g,b)>210: labels.append(4)
    else: labels.append(5)

def contours(mask):
    edges=defaultdict(list)
    for y in range(h):
        for x in range(w):
            if not mask[y*w+x]:continue
            if y==0 or not mask[(y-1)*w+x]: edges[(x,y)].append((x+1,y))
            if x==w-1 or not mask[y*w+x+1]: edges[(x+1,y)].append((x+1,y+1))
            if y==h-1 or not mask[(y+1)*w+x]: edges[(x+1,y+1)].append((x,y+1))
            if x==0 or not mask[y*w+x-1]: edges[(x,y+1)].append((x,y))
    result=[]
    while edges:
        start=next(iter(edges)); current=start; points=[]
        while True:
            points.append(current)
            next_point=edges[current].pop()
            if not edges[current]:del edges[current]
            current=next_point
            if current==start:break
        area=sum(points[i][0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points)))/2
        if abs(area)>12:result.append(points)
    return result

def simplify(points,epsilon=0.8):
    if len(points)<3:return points
    a,b=points[0],points[-1]
    dx,dy=b[0]-a[0],b[1]-a[1]; denom=math.hypot(dx,dy)
    distances=[abs(dy*(p[0]-a[0])-dx*(p[1]-a[1]))/denom if denom else math.dist(p,a) for p in points]
    best=max(range(len(points)),key=lambda i:distances[i])
    if distances[best]<=epsilon:return [a,b]
    return simplify(points[:best+1],epsilon)[:-1]+simplify(points[best:],epsilon)

def path(points):
    # Split closed contours at an opposite vertex before simplification.
    split=len(points)//2
    pts=simplify(points[:split+1])+simplify(points[split:]+[points[0]])[1:-1]
    return 'M'+' '.join(f'{x},{y}' for x,y in pts)+'Z'

silhouette=''.join(path(c) for c in contours([v>=0 for v in labels]))
layers=[]
for label,color in enumerate(palette):
    d=''.join(path(c) for c in contours([v==label for v in labels]))
    layers.append(f'<path fill="#{color[0]:02x}{color[1]:02x}{color[2]:02x}" fill-rule="evenodd" d="{d}"/>')
body='\n'.join(layers)
base=Path(__file__).resolve().parents[1] / 'public' / 'brand'
base.joinpath('logo-art.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="-12 -12 {w+24} {h+24}"><title>MediaVerse popcorn and clapperboard logo</title>\n<!-- SILHOUETTE {silhouette} -->\n<!-- BRAND_RIM -->\n{body}\n</svg>\n')
print(f'Traced {w}x{h}; {len(body)} bytes of vector paths')
