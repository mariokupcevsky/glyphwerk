/* ---------- TrueType writer ---------- */
class W{constructor(){this.a=[]}u8(v){this.a.push(v&255)}u16(v){v=Math.round(v);this.u8(v>>8);this.u8(v)}i16(v){v=Math.round(v);this.u16(v<0?v+65536:v)}
  u32(v){v=v>>>0;this.u16(v>>>16);this.u16(v&65535)}tag(s){for(const c of s)this.u8(c.charCodeAt(0))}bytes(b){for(const x of b)this.a.push(x)}get len(){return this.a.length}pad4(){while(this.a.length%4)this.a.push(0)}}
function c2q(p0,c1,c2,p3,depth){
  const q=[(3*(c1[0]+c2[0])-p0[0]-p3[0])/4,(3*(c1[1]+c2[1])-p0[1]-p3[1])/4];let err=0;
  for(const t of [.25,.5,.75]){const u=1-t;
    const cx=u*u*u*p0[0]+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*p3[0],cy=u*u*u*p0[1]+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*p3[1];
    const qx=u*u*p0[0]+2*u*t*q[0]+t*t*p3[0],qy=u*u*p0[1]+2*u*t*q[1]+t*t*p3[1];err=Math.max(err,Math.hypot(cx-qx,cy-qy))}
  if(err<.75||depth>=6)return [[q,p3]];
  const m=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];const p01=m(p0,c1),p12=m(c1,c2),p23=m(c2,p3),p012=m(p01,p12),p123=m(p12,p23),mid=m(p012,p123);
  return c2q(p0,p01,p012,mid,depth+1).concat(c2q(mid,p123,p23,p3,depth+1))}
function ttContours(cs,dx){
  const out=[];
  for(const c of cs){const pts=[];const R=(x,y,on)=>pts.push({x:Math.round(x+dx),y:Math.round(y),on});
    R(c.p[0].x,c.p[0].y,true);
    for(const [a,b] of segs(c)){if(isCurve(a,b)){const [c1,c2]=ctrl(a,b);for(const [q,e] of c2q([a.x,a.y],c1,c2,[b.x,b.y],0)){R(q[0],q[1],false);R(e[0],e[1],true)}}else R(b.x,b.y,true)}
    pts.pop();
    const d=[];for(const q of pts){const l=d[d.length-1];if(l&&l.x===q.x&&l.y===q.y&&l.on&&q.on)continue;d.push(q)}
    while(d.length>1&&d[d.length-1].on&&d[0].on&&d[d.length-1].x===d[0].x&&d[d.length-1].y===d[0].y)d.pop();
    if(d.length>=3)out.push(d)}
  return out}
function glyfData(conts){
  if(!conts.length)return {bytes:[],bb:null,np:0,nc:0};
  const all=conts.flat();const bb={x0:Math.min(...all.map(q=>q.x)),y0:Math.min(...all.map(q=>q.y)),x1:Math.max(...all.map(q=>q.x)),y1:Math.max(...all.map(q=>q.y))};
  const w=new W();w.i16(conts.length);w.i16(bb.x0);w.i16(bb.y0);w.i16(bb.x1);w.i16(bb.y1);
  let e=-1;for(const c of conts){e+=c.length;w.u16(e)}w.u16(0);
  for(const q of all)w.u8(q.on?1:0);
  let px=0;for(const q of all){w.i16(q.x-px);px=q.x}let py=0;for(const q of all){w.i16(q.y-py);py=q.y}
  w.pad4();return {bytes:w.a,bb,np:all.length,nc:conts.length}}
function utf16be(s){const a=[];for(const ch of s){const c=ch.charCodeAt(0);a.push(c>>8,c&255)}return a}
function psName(n){return (n.replace(/[^A-Za-z0-9-]/g,'')||'Glyphwerk').slice(0,50)+'-Regular'}
function classDef(m){const e=[...m].sort((x,y)=>x[0]-y[0]);const r=[];for(const [g,c] of e){const z=r[r.length-1];if(z&&z[1]===g-1&&z[2]===c)z[1]=g;else r.push([g,g,c])}
  const w=new W();w.u16(2);w.u16(r.length);for(const [a,b,c] of r){w.u16(a);w.u16(b);w.u16(c)}return w.a}
function pairFmt2(cl){const cov=[...cl.c1.keys()].sort((x,y)=>x-y);const cd1=classDef(cl.c1),cd2=classDef(cl.c2);
  const n1=cl.n1,n2=cl.n2,head=16+2*n1*n2;const cw=new W();cw.u16(1);cw.u16(cov.length);for(const g of cov)cw.u16(g);
  const w=new W();w.u16(2);w.u16(head);w.u16(4);w.u16(0);w.u16(head+cw.a.length);w.u16(head+cw.a.length+cd1.length);w.u16(n1);w.u16(n2);
  for(let i=0;i<n1;i++)for(let j=0;j<n2;j++)w.i16(cl.v[i*n2+j]||0);w.bytes(cw.a);w.bytes(cd1);w.bytes(cd2);return w.a}
function buildGPOS(pairs,cls){
  const subs=[];if(pairs.length)subs.push(pairFmt1(pairs));if(cls)subs.push(pairFmt2(cls));
  const w=new W();
  w.u16(1);w.u16(0);w.u16(10);w.u16(48);w.u16(62);
  w.u16(2);w.tag('DFLT');w.u16(14);w.tag('latn');w.u16(26);
  for(let i=0;i<2;i++){w.u16(4);w.u16(0);w.u16(0);w.u16(0xFFFF);w.u16(1);w.u16(0)}
  w.u16(1);w.tag('kern');w.u16(8);w.u16(0);w.u16(1);w.u16(0);
  w.u16(1);w.u16(4);w.u16(2);w.u16(0);w.u16(subs.length);let off=6+2*subs.length;for(const sb of subs){w.u16(off);off+=sb.length}for(const sb of subs)w.bytes(sb);
  return w.a}
function pairFmt1(pairs){
  const by=new Map();for(const [a,b,v] of pairs){if(!by.has(a))by.set(a,[]);by.get(a).push([b,v])}
  const firsts=[...by.keys()].sort((x,y)=>x-y);
  const sub=new W();const head=10+2*firsts.length;let off=head;const offs=[];
  for(const f of firsts){offs.push(off);off+=2+4*by.get(f).length}
  sub.u16(1);sub.u16(off);sub.u16(4);sub.u16(0);sub.u16(firsts.length);for(const o of offs)sub.u16(o);
  for(const f of firsts){const l=by.get(f).sort((x,y)=>x[0]-y[0]);sub.u16(l.length);for(const [b,v] of l){sub.u16(b);sub.i16(v)}}
  sub.u16(1);sub.u16(firsts.length);for(const f of firsts)sub.u16(f);
  return sub.a}
function buildFont(cff){
  const chars=allChars().filter(ch=>{const m=gm(ch);return m&&!m.empty});
  const order=['.notdef',' ','\u00a0',...chars];
  const gl=order.map(ch=>{
    if(ch==='.notdef'){const nd=orient([rect(50,0,400,700),rect(100,50,300,600)]);return cff?{adv:500,...csData(nd,0,500)}:{adv:500,...glyfData(ttContours(nd,0))}}
    const m=gm(ch);if(m.empty)return cff?{adv:m.adv,...csData([],0,m.adv)}:{adv:m.adv,...glyfData([])};
    return cff?{adv:m.adv,...csData(m.cs,m.dx,m.adv)}:{adv:m.adv,...glyfData(ttContours(m.cs,m.dx))}});
  const n=order.length;const T={};
  const fam=(S.name||'Meine Schrift').trim().slice(0,40)||'Meine Schrift';
  if(cff){T['CFF ']=buildCFF(psName(fam),fam,order.slice(1).map(ch=>{const n=isNamed(ch)&&nameOf(ch);return n&&/^[A-Za-z0-9._]{1,60}$/.test(n)&&!/^uni[0-9A-F]{4}$/.test(n)?n:'uni'+ch.charCodeAt(0).toString(16).toUpperCase().padStart(4,'0')}),gl.map(g=>g.bytes),gl)}
  else{const glyf=new W(),loca=new W();for(const g of gl){loca.u32(glyf.len);glyf.bytes(g.bytes)}loca.u32(glyf.len);T.glyf=glyf.a;T.loca=loca.a}
  const bbs=gl.filter(g=>g.bb).map(g=>g.bb);
  const fb={x0:Math.min(...bbs.map(b=>b.x0)),y0:Math.min(...bbs.map(b=>b.y0)),x1:Math.max(...bbs.map(b=>b.x1)),y1:Math.max(...bbs.map(b=>b.y1))};
  const now=Math.floor(Date.now()/1000)+2082844800;
  const head=new W();head.u32(0x10000);head.u32(0x10000);head.u32(0);head.u32(0x5F0F3CF5);head.u16(0x000B);head.u16(UPM);
  head.u32(0);head.u32(now);head.u32(0);head.u32(now);head.i16(fb.x0);head.i16(fb.y0);head.i16(fb.x1);head.i16(fb.y1);
  head.u16(0);head.u16(8);head.i16(2);head.i16(1);head.i16(0);T.head=head.a;
  const advMax=Math.max(...gl.map(g=>g.adv));const withBB=gl.filter(g=>g.bb);
  const hhea=new W();hhea.u32(0x10000);hhea.i16(ASC);hhea.i16(DESC);hhea.i16(200);hhea.u16(advMax);
  hhea.i16(Math.min(...withBB.map(g=>g.bb.x0)));hhea.i16(Math.min(...withBB.map(g=>g.adv-g.bb.x1)));hhea.i16(Math.max(...withBB.map(g=>g.bb.x1)));
  hhea.i16(1);hhea.i16(0);hhea.i16(0);for(let i=0;i<4;i++)hhea.i16(0);hhea.i16(0);hhea.u16(n);T.hhea=hhea.a;
  const hmtx=new W();for(const g of gl){hmtx.u16(g.adv);hmtx.i16(g.bb?g.bb.x0:0)}T.hmtx=hmtx.a;
  const maxp=new W();if(cff){maxp.u32(0x5000);maxp.u16(n)}else{maxp.u32(0x10000);maxp.u16(n);maxp.u16(Math.max(...gl.map(g=>g.np)));maxp.u16(Math.max(...gl.map(g=>g.nc)));
  maxp.u16(0);maxp.u16(0);maxp.u16(2);for(let i=0;i<8;i++)maxp.u16(0)}T.maxp=maxp.a;
  const map=order.map((ch,gid)=>[ch.length===1?ch.charCodeAt(0):-1,gid]).filter(x=>x[0]>=0).sort((a,b)=>a[0]-b[0]);
  const segC=map.length+1,sr=2*2**Math.floor(Math.log2(segC)),es=Math.floor(Math.log2(segC));
  const f4=new W();f4.u16(4);f4.u16(16+8*segC);f4.u16(0);f4.u16(segC*2);f4.u16(sr);f4.u16(es);f4.u16(segC*2-sr);
  for(const [c] of map)f4.u16(c);f4.u16(0xFFFF);f4.u16(0);for(const [c] of map)f4.u16(c);f4.u16(0xFFFF);
  for(const [c,g] of map)f4.u16((g-c+65536)%65536);f4.u16(1);for(let i=0;i<segC;i++)f4.u16(0);
  const cmap=new W();cmap.u16(0);cmap.u16(2);cmap.u16(0);cmap.u16(3);cmap.u32(20);cmap.u16(3);cmap.u16(1);cmap.u32(20);cmap.bytes(f4.a);T.cmap=cmap.a;
  const names=[[1,fam],[2,'Regular'],[3,fam+';1.000;Glyphwerk'],[4,fam],[5,'Version 1.000'],[6,psName(fam)]];
  const recs=[];for(const [id,s] of names)recs.push([1,0,0,id,[...s].map(c=>c.charCodeAt(0)<128?c.charCodeAt(0):63)]);
  for(const [id,s] of names)recs.push([3,1,0x409,id,utf16be(s)]);
  const name=new W();name.u16(0);name.u16(recs.length);name.u16(6+12*recs.length);let so=0;
  for(const r of recs){name.u16(r[0]);name.u16(r[1]);name.u16(r[2]);name.u16(r[3]);name.u16(r[4].length);name.u16(so);so+=r[4].length}
  for(const r of recs)name.bytes(r[4]);T.name=name.a;
  const advs=gl.map(g=>g.adv).filter(a=>a>0);
  const os2=new W();os2.u16(4);os2.i16(advs.reduce((a,b)=>a+b,0)/advs.length);os2.u16(400);os2.u16(5);os2.u16(0);
  for(const v of [650,600,0,75,650,600,0,350,50,280])os2.i16(v);os2.i16(0);for(let i=0;i<10;i++)os2.u8(0);
  os2.u32(7);os2.u32(0);os2.u32(0);os2.u32(0);os2.tag('NONE');os2.u16(0x00C0);os2.u16(32);os2.u16(Math.max(...map.map(x=>x[0])));
  os2.i16(ASC);os2.i16(DESC);os2.i16(200);os2.u16(Math.max(ASC,fb.y1));os2.u16(Math.max(-DESC,-fb.y0));os2.u32(3);os2.u32(0);
  os2.i16(XH);os2.i16(CAP);os2.u16(0);os2.u16(32);os2.u16(2);T['OS/2']=os2.a;
  const post=new W();post.u32(0x30000);post.u32(0);post.i16(-100);post.i16(50);post.u32(S.mono?1:0);for(let i=0;i<4;i++)post.u32(0);T.post=post.a;
  const pairs=[],flat=[];for(let i=2;i<n;i++)for(let j=2;j<n;j++){const f=kernInfo(order[i],order[j]);if(f.v)flat.push([i,j,f.v]);if((f.v||f.src==='p')&&f.src!=='g')pairs.push([i,j,f.v])}
  // group kerning as class kerning (PairPos format 2): only groups that have a value
  let cls=null;const gks=Object.entries(S.gkern||{}).filter(([k,v])=>v!=null);
  if(gks.length){const L=new Set(gks.map(([k])=>k.split('|')[0])),Rr=new Set(gks.map(([k])=>k.split('|')[1]));
    const i1=new Map([...L].map((g,i)=>[g,i+1])),i2=new Map([...Rr].map((g,i)=>[g,i+1]));const c1=new Map(),c2=new Map();
    for(let i=2;i<n;i++){const a=i1.get(grpOf(order[i],'r')),b=i2.get(grpOf(order[i],'l'));if(a)c1.set(i,a);if(b)c2.set(i,b)}
    if(c1.size&&c2.size){const n1=L.size+1,n2=Rr.size+1,v=new Array(n1*n2).fill(0);for(const [k,val] of gks){const [x,y]=k.split('|');v[i1.get(x)*n2+i2.get(y)]=val}cls={c1,c2,n1,n2,v}}}
  if(!cls)for(const f of flat)if(!pairs.some(p=>p[0]===f[0]&&p[1]===f[1]))pairs.push(f);
  if(flat.length){
    if(pairs.length>10000){pairs.sort((a,b)=>Math.abs(b[2])-Math.abs(a[2]));pairs.length=10000}
    pairs.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const kp=(flat.length>10000?flat.sort((a,b)=>Math.abs(b[2])-Math.abs(a[2])).slice(0,10000):flat).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
    const kern=new W();kern.u16(0);kern.u16(1);kern.u16(0);kern.u16(14+6*kp.length);kern.u16(1);
    const ksr=6*2**Math.floor(Math.log2(kp.length));kern.u16(kp.length);kern.u16(ksr);kern.u16(Math.floor(Math.log2(kp.length)));kern.u16(6*kp.length-ksr);
    for(const [a,b,v] of kp){kern.u16(a);kern.u16(b);kern.i16(v)}T.kern=kern.a;T.GPOS=buildGPOS(pairs,cls)}
  const fr=compileFea(feaSource(),n=>{const c=n==='space'?' ':chOfName(n);return c?order.indexOf(c):-1});if(fr.bytes)T.GSUB=fr.bytes;
  return {buf:assemble(T,cff),glyphs:chars.length,pairs:flat.length,classes:cls?cls.n1+cls.n2-2:0,fea:fr}}
const feaSource=()=>(S.feaAuto!==false?autoFea():'')+'\n'+(S.fea||'');
const buildTTF=()=>buildFont(false),buildOTF=()=>buildFont(true);
