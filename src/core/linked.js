/* linked parts (like components in Glyphs): built from other glyphs and updated with them, until drawn by hand.
   Each part: [glyph, x: l = as drawn, c = centred over the first part, n = next to the previous part,
   y: 0 = as drawn, xh = top at x-height, cap = top at cap height, above = bottom just above x-height, up/down = for =] */
const PARTS={';':[[',','l',0],['.','c','xh']],':':[['.','l',0],['.','c','xh']],'¨':[['.','l','above'],['.','n','above']],
  '„':[[',','l',0],[',','n',0]],'‚':[[',','l',0]],'’':[[',','l','cap']],'”':[[',','l','cap'],[',','n','cap']],'"':[["'",'l',0],["'",'n',0]],
  '=':[['-','l','up'],['-','l','down']],'˙':[['.','l','above']],'¯':[['-','l','above']],'˝':[['´','l',0],['´','n',0]],'i':[['ı','l',0],['.','c','above']],'–':[['-','l',0],['-','n2',0]],'—':[['-','l',0],['-','n2',0],['-','n2',0]]};
function partGm(ch){const ps=PARTS[ch],ms=ps.map(p=>gm(p[0]));if(ms.some(m=>!m||m.empty))return null;
  const e=MC.get(ch),g=S.glyphs[ch];if(e&&e.ms&&e.sp===S.spacing&&e.ms.every((m,i)=>m===ms[i])&&e.l===(g&&g.l||0)&&e.r===(g&&g.r||0))return e.m;
  const cs=[];let prev=null,first=null;
  ps.forEach((p,i)=>{const m=ms[i],b=m.b,w=b.x1-b.x0;let ox=0,oy=0;
    if(p[1]==='c'&&first)ox=(first.x0+first.x1)/2-(b.x0+b.x1)/2;else if(p[1]==='n'&&prev)ox=prev.x1+Math.max(30,w*.5)-b.x0;else if(p[1]==='n2'&&prev)ox=prev.x1-w*.08-b.x0;else if(first)ox=first.x0-b.x0;
    if(p[2]==='xh')oy=XH-b.y1;else if(p[2]==='cap')oy=CAP-b.y1;else if(p[2]==='above')oy=XH*1.12-b.y0;else if(p[2]==='up')oy=XH*.11;else if(p[2]==='down')oy=-XH*.11;
    const sh=m.cs.map(c=>shiftC(c,ox,oy));cs.push(...sh);const nb={x0:b.x0+ox,x1:b.x1+ox};if(!first)first=nb;prev=nb});
  const m={...spaceCs(ch,cs,g&&g.l,g&&g.r),comp:[...new Set(ps.map(p=>p[0]))]};
  MC.set(ch,{sp:S.spacing,ms,l:g&&g.l||0,r:g&&g.r||0,m});return m}

function shiftC(c,dx,dy){const f=h=>h&&[h[0]+dx,h[1]+dy];return {z:true,p:c.p.map(q=>({x:q.x+dx,y:q.y+dy,s:q.s,i:f(q.i),o:f(q.o)}))}}
/* accented letters: base + mark, unless drawn by hand. Marks are drawn for lowercase and lifted for capitals. */
function compGm(ch){
  let [bc,mc]=COMPOSE[ch];let dot=false;if(bc==='ı'&&!gm('ı')){bc='i';dot=true}else if(bc==='ȷ'&&!gm('ȷ')){bc='j';dot=true}
  const base=gm(bc),mk=gm(mc);if(!base||!mk||base.empty||mk.empty)return null;
  const e=MC.get(ch);if(e&&e.base===base&&e.mk===mk&&e.sp===S.spacing)return e.m;
  let bcs=base.cs;if(dot)bcs=bcs.filter(c=>bounds([c]).y0<XH*.85);
  const bb=bounds(bcs),ox=Math.round((bb.x0+bb.x1)/2-(mk.b.x0+mk.b.x1)/2),oy=mc===','||mc==='.'?-mk.b.y1-40:BELOW.includes(mc)?0:isUp(ch)?CAP-XH:0;
  const cs=[...bcs,...mk.cs.map(c=>shiftC(c,ox,oy))];
  const m={cs,pr:profile(cs),b:bounds(cs),lsbA:base.lsbA,rsbA:base.rsbA,lsb:base.lsb,rsb:base.rsb,dx:base.dx,adv:base.adv,comp:[bc,mc]};
  MC.set(ch,{base,mk,sp:S.spacing,m});return m}
function baseOf(ch){if(hasInk(S.glyphs[ch]))return ch;
  if(COMPOSE[ch]){let b=COMPOSE[ch][0];if(b==='ı'&&!hasInk(S.glyphs['ı']))b='i';else if(b==='ȷ'&&!hasInk(S.glyphs['ȷ']))b='j';return ALIAS[b]?baseOf(b):b}
  return ALIAS[ch]?baseOf(ALIAS[ch]):ch}
function aliasGm(ch){const m=gm(ALIAS[ch]);return m&&!m.empty?{...m,comp:[ALIAS[ch]]}:null}

