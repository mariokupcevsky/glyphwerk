/* ---------- learn rules from the hand ----------
   "Hand lehrt Maschine": the person draws a few key letters (n o H O) with any tool. We measure the
   drawn shapes (stem width, thin strokes, heights, widths, slant, overshoot) and search the rule
   parameters whose generated n o H O measure the same. Measuring the result, not the tool, means
   it works for every nib, Bézier and shapes alike. The rules can only express what the skeletons
   can (no serifs, no wobble), so the result is a consistent starting point, not a copy. */
const LEARN_CH=['n','o','H','O'];

/* raster a glyph's outline (font units, y up) and read ink runs; 1 px = LK units */
const LK=4,LX0=-200,LY0=-300,LW=350,LH=325;
let learnCv=null;
function learnRaster(cs){
  if(!learnCv){learnCv=document.createElement('canvas');learnCv.width=LW;learnCv.height=LH}
  const c=learnCv.getContext('2d',{willReadFrequently:true});c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,LW,LH);
  c.setTransform(1/LK,0,0,-1/LK,-LX0/LK,LH+LY0/LK);c.fillStyle='#000';c.fill(cs instanceof Path2D?cs:pathOf(cs),'nonzero');
  const d=c.getImageData(0,0,LW,LH).data,ink=new Uint8Array(LW*LH);
  for(let i=0;i<LW*LH;i++)ink[i]=d[i*4+3]>127?1:0;
  const at=(x,y)=>{const px=Math.round((x-LX0)/LK),py=Math.round(LH-(y-LY0)/LK);return px>=0&&px<LW&&py>=0&&py<LH?ink[py*LW+px]:0};
  let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;
  for(let py=0;py<LH;py++)for(let px=0;px<LW;px++)if(ink[py*LW+px]){const x=LX0+px*LK,y=LY0+(LH-py)*LK;
    if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
  if(x0>x1)return null;
  /* sub-pixel top and bottom from the anti-aliased rows just outside the ink (overshoot is only a few units) */
  const rowA=y=>{const py=Math.round(LH-(y-LY0)/LK);if(py<0||py>=LH)return 0;let m=0;for(let px=0;px<LW;px++){const a=d[(py*LW+px)*4+3];if(a>m)m=a}return m};
  y1+=(rowA(y1+LK)/255)*LK;y0-=(rowA(y0-LK)/255)*LK;
  /* runs of ink along a horizontal line y or vertical line x, in font units */
  const hRuns=y=>{const o=[];let s=null;for(let x=x0-LK;x<=x1+LK;x+=LK){const v=at(x,y);if(v&&s===null)s=x;if(!v&&s!==null){o.push([s,x]);s=null}}return o};
  const vRuns=x=>{const o=[];let s=null;for(let y=y0-LK;y<=y1+LK;y+=LK){const v=at(x,y);if(v&&s===null)s=y;if(!v&&s!==null){o.push([s,y]);s=null}}return o};
  return {x0,x1,y0,y1,hRuns,vRuns}}

/* the few numbers the rules are fitted to; null where a letter is not usable */
function learnMeasure(ch,R){
  if(!R)return null;const h=R.y1-R.y0,w=R.x1-R.x0,o={top:R.y1,bot:R.y0,w};
  const run0=y=>{const r=R.hRuns(y);return r.length?r[0]:null},mid=([a,b])=>(a+b)/2;
  if(ch==='n'||ch==='H'){
    const a=run0(R.y0+h*.2),b=run0(R.y0+h*.6);if(!a||!b)return null;
    o.stem=a[1]-a[0];o.slant=Math.atan2(mid(b)-mid(a),h*.4)*180/Math.PI}
  if(ch==='H'){const v=R.vRuns(mid([R.x0,R.x1]));const bar=v.find(r=>r[0]>R.y0+h*.2&&r[1]<R.y1-h*.2);if(bar)o.thin=bar[1]-bar[0]}
  if(ch==='o'||ch==='O'){
    const v=R.vRuns(mid([R.x0,R.x1]));if(v.length>=2){o.thin=((v[0][1]-v[0][0])+(v[v.length-1][1]-v[v.length-1][0]))/2}
    const r=R.hRuns(mid([R.y0,R.y1]));if(r.length>=2)o.stem=((r[0][1]-r[0][0])+(r[r.length-1][1]-r[r.length-1][0]))/2}
  return o}

function learnHandSet(){
  const out={};for(const ch of LEARN_CH){const g=S.glyphs[ch];if(!g||!hasInk(g)||isGenGlyph(g))continue;
    const m=learnMeasure(ch,learnRaster(glyphCs(g)));if(m)out[ch]=m}
  return out}

/* fast outline for measuring only: the hull of each pair of neighbouring nib stamps, filled with the
   non-zero rule, covers the same ink as strokeCs without its (slow) merging of hulls */
function learnStrokePath(sts){const p=new Path2D();
  for(const st of sts){const sm=strokeSamples(st),sp=sm.map(q=>stamp(st.n,q.x,q.y,q.r,q.a,st.s,st));
    for(let i=0;i<sp.length;i++){const h=hull(i+1<sp.length?sp[i].concat(sp[i+1]):sp[i]);if(h.length<3)continue;
      p.moveTo(h[0][0],h[0][1]);for(let j=1;j<h.length;j++)p.lineTo(h[j][0],h[j][1]);p.closePath()}}
  return p}

/* measure what the rules would generate for the learn letters with parameters P (and heights xh/cap) */
function learnGenMeasure(P){
  const sx=XH,sc=CAP;XH=P._xh;CAP=P._cap;
  try{const G=genSkel(P),o={};for(const ch of LEARN_CH)if(G[ch])o[ch]=learnMeasure(ch,learnRaster(learnStrokePath(genStrokes(G[ch],P))));return o}
  finally{XH=sx;CAP=sc}}

function learnErr(hand,gen,keys){
  let e=0;const f=(a,b,scale)=>{if(a==null||b==null)return;const d=(a-b)/scale;e+=d*d};
  for(const ch of Object.keys(hand)){const h=hand[ch],g=gen[ch];if(!g){e+=4;continue}
    if(keys&&!keys.includes(ch))continue;
    f(h.stem,g.stem,8);f(h.thin,g.thin,8);f(h.w,g.w,25);f(h.top,g.top,10);f(h.bot,g.bot,10)}
  return e}

/* returns {P, xh, cap, from:[letters], err} or null when fewer than two key letters are drawn */
function learnRules(base){
  const hand=learnHandSet(),from=Object.keys(hand);if(from.length<2)return null;
  const lc=hand.n||hand.o,uc=hand.H||hand.O;
  const P0={...GENP0,...(base||{})};
  /* straight from the drawing (same geometry as genSkel): flat tops give the heights, round bottoms
     the overshoot, stems the slant */
  const ovL=hand.o?-hand.o.bot:null,ovU=hand.O?-hand.O.bot:null;
  let xh=XH,cap=CAP;
  if(hand.n&&ovL!=null)xh=hand.n.top-ovL;else if(hand.n)xh=hand.n.top/(1+P0.ov/1000);else if(hand.o)xh=hand.o.top+hand.o.bot;
  if(hand.H)cap=hand.H.top;else if(hand.O)cap=hand.O.top+hand.O.bot;
  xh=Math.max(380,Math.min(650,Math.round(xh/5)*5));cap=Math.max(560,Math.min(850,Math.round(cap/5)*5));
  const ovs=[];if(ovL!=null)ovs.push(ovL/xh*1000);if(ovU!=null)ovs.push(ovU/cap*1000);
  if(ovs.length)P0.ov=Math.max(0,Math.min(40,Math.round(ovs.reduce((a,b)=>a+b)/ovs.length)));
  const sls=[hand.n,hand.H].filter(m=>m&&m.slant!=null).map(m=>m.slant);
  if(sls.length)P0.sl=Math.max(-5,Math.min(18,Math.round(sls.reduce((a,b)=>a+b)/sls.length)));
  const P={...P0,_xh:xh,_cap:cap};
  /* broad-nib strokes tell the nib angle and flat ends directly */
  const st=[];for(const ch of from)for(const s of S.glyphs[ch].k||[])st.push(s);
  const broad=st.filter(s=>s.n==='broad');
  if(broad.length&&broad.length>=st.length/2){P.e='f';const an=[];for(const s of broad)for(let i=3;i<s.p.length;i+=4)an.push(s.p[i]*180/Math.PI);
    an.sort((a,b)=>a-b);let a=an[an.length>>1]||P.a;a=((a%180)+180)%180;if(a>90)a-=180;P.a=Math.max(-60,Math.min(90,Math.round(a)))}
  else P.e='r';
  /* nib from stem (horizontal half-width hx) and thin strokes (vertical half-height hy): for each
     candidate angle the elliptic nib's axes follow from two linear equations in A² and B² */
  const V=(lc&&lc.stem||uc&&uc.stem||0)/2,T=((uc&&uc.thin)||(lc&&lc.thin)||0)/2;
  const ang=P.e==='f'?[P.a]:Array.from({length:16},(_,i)=>-60+i*10);
    const nW=hand.n?hand.n.w:0;
  /* n ink width grows by exactly 0.52·x-height per 100 % of width, so one measured step solves it */
  const nMeasure=Q=>{const sx=XH,sc=CAP;XH=Q._xh;CAP=Q._cap;try{const G=genSkel(Q);return learnMeasure('n',learnRaster(learnStrokePath(genStrokes(G.n,Q))))}finally{XH=sx;CAP=sc}};
  const fit=Q=>{if(nW){const m=nMeasure(Q);if(m)Q.wd=Math.max(60,Math.min(150,Math.round(Q.wd+(nW-m.w)/(.52*Q._xh)*100)))}return Q};
  const starts=[];
  for(const a of ang){const Q={...P,a};
    if(V&&T){const r=a*Math.PI/180,c2=Math.cos(r)**2,s2=Math.sin(r)**2,det=c2*c2-s2*s2;
      if(Math.abs(det)>.05){const A2=(V*V*c2-T*T*s2)/det,B2=(T*T*c2-V*V*s2)/det;
        if(A2>0&&B2>0){const A=Math.sqrt(Math.max(A2,B2)),B=Math.sqrt(Math.min(A2,B2));
          Q.w=Math.max(16,Math.min(220,Math.round(2*A)));Q.c=Math.max(0,Math.min(90,Math.round((1-B/A)*100)))}}}
    else if(V)Q.w=Math.max(16,Math.min(220,Math.round(2*V)));
    fit(Q);starts.push({Q,e:learnErr(hand,learnGenMeasure(Q))})}
  starts.sort((x,y)=>x.e-y.e);
  /* refine the nib (size, contrast, angle) from the three most promising angles; width follows */
  const lower=['n','o','H','O'];
  const descend=(Q,e,keys,letters)=>{
    for(const step of [.08,.03,.01])for(const [k,lo,hi] of keys){const span=Math.max(1,Math.round((hi-lo)*step));
      for(const dir of [1,-1])for(;;){const v=Math.max(lo,Math.min(hi,Q[k]+dir*span));if(v===Q[k])break;
        const N=fit({...Q,[k]:v}),ee=learnErr(hand,learnGenMeasure(N),letters);if(ee<e-1e-6){e=ee;Object.assign(Q,N)}else break}}
    return e};
  const NIB=P.e==='f'?[['w',16,220],['c',0,90]]:[['w',16,220],['c',0,90],['a',-60,90]];
  let best=Infinity,bestP=P;
  for(const {Q:Q0,e:e0} of starts.slice(0,3)){const Q={...Q0};const e=descend(Q,e0,NIB,lower);if(e<best){best=e;bestP=Q}}
  Object.assign(P,bestP);
  /* capital width only changes capitals */
  if(hand.H||hand.O)best=descend(P,learnErr(hand,learnGenMeasure(P)),[['wc',70,130]],null);
  const {_xh,_cap,...R}=P;return {P:R,xh:_xh,cap:_cap,from,err:best}}
