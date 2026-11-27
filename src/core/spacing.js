/* horizontal profile: leftmost/rightmost ink per 10-unit row */
const ROWS=131, ROWTOP=1000, ROWH=10;
function profile(cs){
  const Lr=new Float64Array(ROWS).fill(NaN),Rr=new Float64Array(ROWS).fill(NaN);
  const edges=[];for(const c of cs){const f=flat(c,16);for(let i=0;i<f.length;i++){const a=f[i],b=f[(i+1)%f.length];if(a[1]!==b[1])edges.push(a,b)}}
  for(let k=0;k<ROWS;k++){const y=ROWTOP-(k+.5)*ROWH;let mn=Infinity,mx=-Infinity;
    for(let e=0;e<edges.length;e+=2){const a=edges[e],b=edges[e+1];
      if((a[1]>y)!==(b[1]>y)){const x=a[0]+(y-a[1])*(b[0]-a[0])/(b[1]-a[1]);if(x<mn)mn=x;if(x>mx)mx=x}}
    if(mn<Infinity){Lr[k]=mn;Rr[k]=mx}}
  return {L:Lr,R:Rr}}
const rowY=k=>ROWTOP-(k+.5)*ROWH;

/* ---------- spacing ---------- */
const MC=new Map();
const autoSpaceW=()=>Math.round(S.spacing*3.5+40);
function classFactor(ch){ch=kc(ch);return isUp(ch)||/[0-9]/.test(ch)?1.2:isLow(ch)?1:.8}
function gm(ch){
  if(ch===' '||ch==='\u00a0')return {empty:true,adv:S.mono||S.spaceW||autoSpaceW(),dx:0};
  const g=S.glyphs[ch];if(!hasInk(g))return COMPOSE[ch]?compGm(ch):PARTS[ch]?partGm(ch):ALIAS[ch]?aliasGm(ch):null;
  const kl=keyRef(ch,g.lk),kr=keyRef(ch,g.rk);
  const e=MC.get(ch);if(e&&e.v===g.v&&e.sp===S.spacing&&e.kl===kl&&e.kr===kr)return e.m;
  let m=spaceCs(ch,glyphCs(g),g.l,g.r);
  if((kl||kr)&&!S.mono){const L=kl?kl.lsb+(g.l||0):m.lsb,Rr=kr?kr.rsb+(g.r||0):m.rsb;m={...m,lsb:L,rsb:Rr,dx:L-m.b.x0,adv:Math.max(0,Math.round(m.b.x1-m.b.x0+L+Rr))}}
  MC.set(ch,{v:g.v,sp:S.spacing,kl,kr,m});return m}
/* metric keys (like =H in Glyphs): a side takes its spacing from another glyph */
let keyDepth=0;function keyRef(ch,k){if(!k||k===ch||keyDepth>4)return null;keyDepth++;try{const m=gm(k);return m&&!m.empty?m:null}finally{keyDepth--}}
function spaceCs(ch,cs,gl,gr){
  const b=bounds(cs),pr=profile(cs);
  const hi=isLow(kc(ch))?XH:CAP;let rows=[];
  for(let k=0;k<ROWS;k++){const y=rowY(k);if(y>=0&&y<=hi)rows.push(k)}
  if(!rows.some(k=>!isNaN(pr.L[k]))){rows=[];for(let k=0;k<ROWS;k++)if(!isNaN(pr.L[k]))rows.push(k)}
  const D=.2*hi,s=S.spacing*classFactor(ch);let dl=0,dr=0;
  for(const k of rows){dl+=isNaN(pr.L[k])?D:Math.min(D,pr.L[k]-b.x0);dr+=isNaN(pr.R[k])?D:Math.min(D,b.x1-pr.R[k])}
  dl/=rows.length||1;dr/=rows.length||1;
  const lsbA=Math.round(Math.max(s*.2,s-.4*dl)),rsbA=Math.round(Math.max(s*.2,s-.4*dr));
  if(S.mono){const W=S.mono,bw=b.x1-b.x0,L=Math.round((W-bw)/2+((gl||0)-(gr||0))/2);
    return {cs,pr,b,lsbA,rsbA,lsb:L,rsb:Math.round(W-bw-L),dx:L-b.x0,adv:W,over:bw>W}}
  const lsb=lsbA+(gl||0),rsb=rsbA+(gr||0);
  return {cs,pr,b,lsbA,rsbA,lsb,rsb,dx:lsb-b.x0,adv:Math.max(0,Math.round(b.x1-b.x0+lsb+rsb))}}
