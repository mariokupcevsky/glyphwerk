/* ---------- hit testing ---------- */
let hitR=20;
function local(px,py){return [wx(px)-gx(),wy(py)]}
function hitPoint(g,px,py){let best=null,bd=hitR;const ox=gx();
  for(const c of g.c)for(const q of c.p){
    for(const [h,k] of [[q.i,'i'],[q.o,'o']])if(h){const d=Math.hypot(sx(h[0]+ox)-px,sy(h[1])-py);if(d<bd-2){bd=d;best={type:'h',q,k,c}}}
    const d=Math.hypot(sx(q.x+ox)-px,sy(q.y)-py);if(d<bd){bd=d;best={type:'p',q,c}}}
  return best}
function hitContour(g,px,py){const [x,y]=local(px,py);let best=null,ba=Infinity;
  for(const c of g.c){if(c.p.length<3)continue;const f=flat({z:true,p:c.p});if(inPoly([x,y],f)){const a=Math.abs(area(f));if(a<ba){ba=a;best=c}}}return best}
function hitSegment(g,px,py){const ox=gx();let best=null,bd=14;
  for(const c of g.c)segs(c).forEach(([a,b],si)=>{const [c1,c2]=ctrl(a,b);const cur=isCurve(a,b);
    for(let k=1;k<40;k++){const t=k/40;const q=cur?bez(a,c1,c2,b,t):[a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t];const d=Math.hypot(sx(q[0]+ox)-px,sy(q[1])-py);if(d<bd){bd=d;best={c,si,t}}}});
  return best}
function hitStroke(g,px,py){if(!g.k)return null;const [x,y]=local(px,py);const tol=hitR/(view.s*A.k);
  for(let n=g.k.length-1;n>=0;n--){const st=g.k[n];for(const c of strokeCs(st))if(inPoly([x,y],c.p.map(q=>[q.x,q.y])))return st;
    for(let i=0;i<st.p.length;i+=4)if(Math.hypot(st.p[i]-x,st.p[i+1]-y)<tol)return st}return null}
function splitAt(h){const {c,si,t}=h;const a=c.p[si],b=c.p[(si+1)%c.p.length];
  if(!isCurve(a,b)){c.p.splice(si+1,0,P(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t));return c.p[si+1]}
  const [c1,c2]=ctrl(a,b);const m=(p,q)=>[p[0]+(q[0]-p[0])*t,p[1]+(q[1]-p[1])*t];const A=[a.x,a.y],B=[b.x,b.y];
  const p01=m(A,c1),p12=m(c1,c2),p23=m(c2,B),p012=m(p01,p12),p123=m(p12,p23),mid=m(p012,p123);
  a.o=p01;b.i=p23;const np=P(mid[0],mid[1],p012,p123,true);c.p.splice(si+1,0,np);return np}
const snapV=v=>grid?Math.round(v/10)*10:Math.round(v);

