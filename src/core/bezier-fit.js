/* ---------- pen strokes -> editable Bézier outlines ----------
   The stroke outlines are filled on a small offscreen canvas (overlaps merge), the edge is traced,
   smoothed and thinned out, sharp turns stay corners and the rest get round handles. */
function strokesToBez(sts){const cs=[];for(const st of sts)cs.push(...strokeCs(st));return outlinesToBez(cs,3.2,3)}
/* merges outlines (overlaps become one shape) and fits them with few cubic segments */
function outlinesToBez(cs,err,smooth,res=2,forced=[]){if(!cs.length)return [];
  const b=bounds(cs),pad=3,W=Math.ceil((b.x1-b.x0)/res)+pad*2,H=Math.ceil((b.y1-b.y0)/res)+pad*2;
  if(W>3000||H>3000)return [];
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');
  x.setTransform(1/res,0,0,-1/res,-b.x0/res+pad,b.y1/res+pad);x.fillStyle='#000';x.fill(pathOf(cs),'nonzero');
  const d=x.getImageData(0,0,W,H).data,on=(i,j)=>i>=0&&j>=0&&i<W&&j<H&&d[(j*W+i)*4+3]>127;
  /* crack edges with the ink on the right (pixel coords, y down) */
  const out=new Map(),add=(a,c,e,f)=>{const k=a+','+c;let l=out.get(k);if(!l)out.set(k,l=[]);l.push([a,c,e,f])};let n=0;
  for(let j=0;j<H;j++)for(let i=0;i<W;i++)if(on(i,j)){
    if(!on(i,j-1)){add(i,j,i+1,j);n++}if(!on(i+1,j)){add(i+1,j,i+1,j+1);n++}
    if(!on(i,j+1)){add(i+1,j+1,i,j+1);n++}if(!on(i-1,j)){add(i,j+1,i,j);n++}}
  const loops=[];
  while(n){let e=null;for(const l of out.values())if(l.length){e=l.pop();break}n--;const lp=[e];
    for(let g=0;g<1e6;g++){const k=e[2]+','+e[3],l=out.get(k);if(!l||!l.length)break;
      let pi=0;if(l.length>1){const dx=e[2]-e[0],dy=e[3]-e[1];pi=l.findIndex(q=>(q[2]-q[0])===-dy&&(q[3]-q[1])===dx);if(pi<0)pi=0}
      e=l.splice(pi,1)[0];n--;lp.push(e)}
    if(lp.length>=8)loops.push(lp.map(q=>[(q[0]+q[2])/2,(q[1]+q[3])/2]))}
  const toF=q=>[(q[0]-pad)*res+b.x0,b.y1-(q[1]-pad)*res];
  const res2=[],R=v=>Math.round(v*10)/10,nrm=(x,y)=>{const l=Math.hypot(x,y)||1;return [x/l,y/l]};
  for(let p of loops){
    for(let r=0;r<smooth;r++)p=p.map((q,i)=>{const a=p[(i-1+p.length)%p.length],c=p[(i+1)%p.length];return [(a[0]+2*q[0]+c[0])/4,(a[1]+2*q[1]+c[1])/4]});
    p=p.map(toF);if(p.length<8||Math.abs(area(p))<res*res*6)continue;const c=fitLoop(p,res,err,forced);if(c)res2.push(c)}
  return res2}
/* Schneider-style least-squares cubic fit of a run of points; splits where the error is largest */
function fitRun(pts,t1,t2,err,out,cs){const n=pts.length,dist=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1]);
  const go=(a,b,ta,tb,cornerStart)=>{const P0=pts[a],P3=pts[b];
    if(b-a<2){const d=dist(P0,P3)/3;const sg=[P0,[P0[0]+ta[0]*d,P0[1]+ta[1]*d],[P3[0]+tb[0]*d,P3[1]+tb[1]*d],P3];sg.c0=cornerStart;out.push(sg);return}
    let u=[0];for(let i=a+1;i<=b;i++)u.push(u[u.length-1]+dist(pts[i],pts[i-1]));const L=u[u.length-1]||1;u=u.map(v=>v/L);
    let sg=null,me=0,mi=a;
    for(let it=0;it<8;it++){sg=gen(a,b,u,ta,tb);[me,mi]=maxE(a,b,u,sg);if(me<err)break;if(me>err*4)break;u=u.map((t,j)=>newton(sg,pts[a+j],t))}
    if(me<err||b-a<4){sg.c0=cornerStart;out.push(sg);return}
    const tc=(()=>{const p1=pts[Math.max(a,mi-2)],p2=pts[Math.min(b,mi+2)];const l=dist(p1,p2)||1;return [(p2[0]-p1[0])/l,(p2[1]-p1[1])/l]})();
    go(a,mi,ta,[-tc[0],-tc[1]],cornerStart);go(mi,b,tc,tb,false)};
  const bz=(sg,t)=>{const v=1-t;return [v*v*v*sg[0][0]+3*v*v*t*sg[1][0]+3*v*t*t*sg[2][0]+t*t*t*sg[3][0],v*v*v*sg[0][1]+3*v*v*t*sg[1][1]+3*v*t*t*sg[2][1]+t*t*t*sg[3][1]]};
  const gen=(a,b,u,ta,tb)=>{const P0=pts[a],P3=pts[b];let c00=0,c01=0,c11=0,x0=0,x1=0;
    for(let j=0;j<u.length;j++){const t=u[j],v=1-t,b0=v*v*v,b1=3*v*v*t,b2=3*v*t*t,b3=t*t*t;
      const A1=[ta[0]*b1,ta[1]*b1],A2=[tb[0]*b2,tb[1]*b2],q=pts[a+j];
      c00+=A1[0]*A1[0]+A1[1]*A1[1];c01+=A1[0]*A2[0]+A1[1]*A2[1];c11+=A2[0]*A2[0]+A2[1]*A2[1];
      const tx=q[0]-(P0[0]*(b0+b1)+P3[0]*(b2+b3)),ty=q[1]-(P0[1]*(b0+b1)+P3[1]*(b2+b3));x0+=A1[0]*tx+A1[1]*ty;x1+=A2[0]*tx+A2[1]*ty}
    const det=c00*c11-c01*c01;let al=det?(x0*c11-x1*c01)/det:0,be=det?(c00*x1-c01*x0)/det:0;const d=dist(P0,P3);
    if(!(al>d*1e-3)||!(be>d*1e-3)||al>d*2||be>d*2)al=be=d/3;
    return [P0,[P0[0]+ta[0]*al,P0[1]+ta[1]*al],[P3[0]+tb[0]*be,P3[1]+tb[1]*be],P3]};
  const maxE=(a,b,u,sg)=>{let m=0,mi=a+((b-a)>>1);for(let j=1;j<u.length-1;j++){const q=bz(sg,u[j]),d=dist(q,pts[a+j]);if(d>m){m=d;mi=a+j}}return [m,mi]};
  const newton=(sg,q,t)=>{const v=1-t,p=bz(sg,t);
    const d1=[0,1].map(k=>3*(v*v*(sg[1][k]-sg[0][k])+2*v*t*(sg[2][k]-sg[1][k])+t*t*(sg[3][k]-sg[2][k])));
    const d2=[0,1].map(k=>6*(v*(sg[2][k]-2*sg[1][k]+sg[0][k])+t*(sg[3][k]-2*sg[2][k]+sg[1][k])));
    const num=(p[0]-q[0])*d1[0]+(p[1]-q[1])*d1[1],den=d1[0]*d1[0]+d1[1]*d1[1]+(p[0]-q[0])*d2[0]+(p[1]-q[1])*d2[1];
    const r=den?t-num/den:t;return Math.max(0,Math.min(1,r))};
  go(0,n-1,t1,t2,cs)}
/* fits a closed dense outline (font units) with few cubic segments; sharp turns stay corners */
function fitLoop(p,res,err,forced=[]){p=p.slice();const n=p.length;const R=v=>Math.round(v*10)/10,nrm=(x,y)=>{const l=Math.hypot(x,y)||1;return [x/l,y/l]};
    /* corners: sharp turns of the thinned-out outline */
    const kv=rdpLoop(p,res*.75),corner=new Set();
    for(let i=0;i<kv.length;i++){const a=p[kv[(i-1+kv.length)%kv.length]],q=p[kv[i]],c=p[kv[(i+1)%kv.length]];
      const u=nrm(q[0]-a[0],q[1]-a[1]),v=nrm(c[0]-q[0],c[1]-q[1]);if(u[0]*v[0]+u[1]*v[1]<Math.cos(50*Math.PI/180))corner.add(kv[i])}
    /* known corners (from the original outlines) win: exact position, and no second corner right next to them */
    const tolF=Math.max(3,res*2.5);
    for(const f of forced){let bi=-1,bd=tolF;for(let i=0;i<n;i++){const d=Math.hypot(p[i][0]-f[0],p[i][1]-f[1]);if(d<bd){bd=d;bi=i}}
      if(bi<0)continue;for(const k of [...corner])if(Math.hypot(p[k][0]-p[bi][0],p[k][1]-p[bi][1])<tolF*2)corner.delete(k);p[bi]=[f[0],f[1]];corner.add(bi)}
    let cut=[...corner].sort((x,y)=>x-y);
    if(!cut.length){let lo=0,hi=0,bo=0,to=0;for(let i=1;i<n;i++){if(p[i][0]<p[lo][0])lo=i;if(p[i][0]>p[hi][0])hi=i;if(p[i][1]<p[bo][1])bo=i;if(p[i][1]>p[to][1])to=i}cut=[...new Set([lo,hi,bo,to])].sort((x,y)=>x-y)}
    const at=i=>p[((i%n)+n)%n],K=4;
    const tan=(i,dir)=>{if(corner.has(((i%n)+n)%n)){const q=at(i),o=at(i+dir*K);return nrm(o[0]-q[0],o[1]-q[1])}
      const a=at(i-K),c=at(i+K);const t=nrm(c[0]-a[0],c[1]-a[1]);return dir>0?t:[-t[0],-t[1]]};
    const segsOut=[];
    for(let k=0;k<cut.length;k++){const s=cut[k],e=k+1<cut.length?cut[k+1]:cut[0]+n;const run=[];for(let i=s;i<=e;i++)run.push(at(i));
      const A0=run[0],B0=run[run.length-1],L0=Math.hypot(B0[0]-A0[0],B0[1]-A0[1]);
      if(L0>0&&run.every(q=>Math.abs((B0[0]-A0[0])*(q[1]-A0[1])-(B0[1]-A0[1])*(q[0]-A0[0]))/L0<Math.max(1,err*.6))){
        const sg=[A0,[A0[0]+(B0[0]-A0[0])/3,A0[1]+(B0[1]-A0[1])/3],[A0[0]+(B0[0]-A0[0])*2/3,A0[1]+(B0[1]-A0[1])*2/3],B0];sg.c0=corner.has(s%n);sg.line=true;segsOut.push(sg);continue}
      const t1=tan(s,1),t2=tan(e,-1);fitRun(run,t1,t2,err,segsOut,corner.has(s%n))}
    /* a corner between two straight edges sits exactly where the two lines meet */
    for(let k=0;k<segsOut.length;k++){const a=segsOut[(k-1+segsOut.length)%segsOut.length],b=segsOut[k];if(!a.line||!b.line||!b.c0)continue;
      const p1=a[0],p2=a[3],p3=b[0],p4=b[3],d=(p1[0]-p2[0])*(p3[1]-p4[1])-(p1[1]-p2[1])*(p3[0]-p4[0]);if(Math.abs(d)<1e-6)continue;
      const t=((p1[0]-p3[0])*(p3[1]-p4[1])-(p1[1]-p3[1])*(p3[0]-p4[0]))/d,X=[p1[0]+t*(p2[0]-p1[0]),p1[1]+t*(p2[1]-p1[1])];
      if(Math.hypot(X[0]-p3[0],X[1]-p3[1])<Math.max(4,err*1.5)){b[0]=X;a[3]=X}}
    const pts=segsOut.map((sg,k)=>{const pv=segsOut[(k-1+segsOut.length)%segsOut.length],sm=!sg.c0;
      const q=P(R(sg[0][0]),R(sg[0][1]),[R(pv[2][0]),R(pv[2][1])],[R(sg[1][0]),R(sg[1][1])],sm);return q});
    /* nearly straight segments: drop their handles */
    for(let k=0;k<segsOut.length;k++){const sg=segsOut[k],a=sg[0],d=sg[3],L=Math.hypot(d[0]-a[0],d[1]-a[1])||1;
      const off=h=>Math.abs((d[0]-a[0])*(h[1]-a[1])-(d[1]-a[1])*(h[0]-a[0]))/L;
      const tol=Math.max(1.6,L*.015);if(off(sg[1])<tol&&off(sg[2])<tol){pts[k].o=null;pts[(k+1)%pts.length].i=null}}
  return pts.length>=2?{z:true,p:pts}:null}
/* fewer points: the contour is sampled finely and fitted again with a looser tolerance */
function reduceC(c,err){const fl=flat(c,24);if(fl.length<6)return c;const pts=[];
  for(let i=0;i<fl.length;i++){const a=fl[i],b=fl[(i+1)%fl.length],L=Math.hypot(b[0]-a[0],b[1]-a[1]),k=Math.max(1,Math.ceil(L/2));for(let j=0;j<k;j++)pts.push([a[0]+(b[0]-a[0])*j/k,a[1]+(b[1]-a[1])*j/k])}
  const d=[];for(const q of pts){const l=d[d.length-1];if(!l||Math.hypot(q[0]-l[0],q[1]-l[1])>.5)d.push(q)}while(d.length>2&&Math.hypot(d[0][0]-d[d.length-1][0],d[0][1]-d[d.length-1][1])<.5)d.pop();
  if(d.length<8)return c;const fc=c.p.filter((q,i)=>{const n=c.p.length,a=c.p[(i-1+n)%n],b=c.p[(i+1)%n];if(q.s)return false;const u=q.i?[q.x-q.i[0],q.y-q.i[1]]:[q.x-a.x,q.y-a.y],v=q.o?[q.o[0]-q.x,q.o[1]-q.y]:[b.x-q.x,b.y-q.y];const L=Math.hypot(...u)*Math.hypot(...v)||1;return (u[0]*v[0]+u[1]*v[1])/L<Math.cos(25*Math.PI/180)}).map(q=>[q.x,q.y]);const r=fitLoop(d,1,err,fc);if(!r||r.p.length>=c.p.length)return c;if(c._pt)r._pt=c._pt;return r}
/* simplify a whole glyph: overlapping contours and strokes become as few shapes as possible, each with as few points as possible.
   Corners snap back to the original corner points so the shape keeps its exact edges. */
function simplifyGlyph(g,err){const own=x=>!x._pt;
  const items=[];for(const c of orient(g.c.filter(own)))items.push({cs:[c],stroke:false});for(const st of (g.k||[]).filter(own))items.push({cs:strokeCs(st),stroke:true});
  if(!items.length)return null;
  const fl=items.map(it=>it.cs.map(c=>flat(c,8))),bb=items.map(it=>bounds(it.cs));
  const segX=(a,b,c,d)=>{const o=(p,q,r)=>(q[0]-p[0])*(r[1]-p[1])-(q[1]-p[1])*(r[0]-p[0]);return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0};
  const cross=(i,j)=>{if(bb[i].x1<bb[j].x0||bb[j].x1<bb[i].x0||bb[i].y1<bb[j].y0||bb[j].y1<bb[i].y0)return false;
    for(const P of fl[i])for(const Q of fl[j])for(let a=0;a<P.length;a++){const a1=P[a],a2=P[(a+1)%P.length];for(let k=0;k<Q.length;k++)if(segX(a1,a2,Q[k],Q[(k+1)%Q.length]))return true}return false};
  const par=items.map((_,i)=>i),find=i=>par[i]===i?i:(par[i]=find(par[i]));
  for(let i=0;i<items.length;i++)for(let j=i+1;j<items.length;j++)if(find(i)!==find(j)&&cross(i,j))par[find(i)]=find(j);
  const groups=new Map();items.forEach((it,i)=>{const r=find(i);if(!groups.has(r))groups.set(r,[]);groups.get(r).push(it)});
  const out=[];
  for(const gr of groups.values()){
    if(gr.length===1&&!gr[0].stroke){out.push(reduceC(gr[0].cs[0],err));continue}
    const cs=gr.flatMap(it=>it.cs),forced=[];for(const it of gr)if(!it.stroke)for(const q of it.cs[0].p)if(!q.s)forced.push([q.x,q.y]);
    out.push(...outlinesToBez(cs,err,gr.some(it=>it.stroke)?2:0,1,forced))}
  return out}
function rdpLoop(p,eps){const n=p.length;let far=0,best=-1;
  for(let i=1;i<n;i++){const dd=Math.hypot(p[i][0]-p[0][0],p[i][1]-p[0][1]);if(dd>best){best=dd;far=i}}
  const rdp=(s,e,o)=>{let mx=-1,mi=-1;const A=p[s],B=p[e%n],dx=B[0]-A[0],dy=B[1]-A[1],L=Math.hypot(dx,dy)||1;
    for(let i=s+1;i<e;i++){const q=p[i%n],dd=Math.abs(dx*(q[1]-A[1])-dy*(q[0]-A[0]))/L;if(dd>mx){mx=dd;mi=i}}
    if(mx>eps){rdp(s,mi,o);o.push(mi%n);rdp(mi,e,o)}};
  const o=[0];rdp(0,far,o);o.push(far);rdp(far,n,o);return o}
function bezStrokes(ch,sts){const g=S.glyphs[ch];if(!g||!sts.length)return 0;const by=new Map();
  for(const st of sts){const k=st._pt||'';if(!by.has(k))by.set(k,[]);by.get(k).push(st)}let made=0;
  for(const [k,list] of by){const cs=strokesToBez(list);if(!cs.length)continue;made+=cs.length;
    for(const c of cs){if(k)c._pt=k;g.c.push(c)}g.k=g.k.filter(st=>!list.includes(st))}
  return made}
