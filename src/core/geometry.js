/* ---------- geometry ---------- */
function segs(c){const o=[],n=c.p.length,m=c.z?n:n-1;for(let k=0;k<m;k++)o.push([c.p[k],c.p[(k+1)%n]]);return o}
const isCurve=(a,b)=>!!(a.o||b.i);
function bez(a,c1,c2,b,t){const u=1-t;return [u*u*u*a.x+3*u*u*t*c1[0]+3*u*t*t*c2[0]+t*t*t*b.x,u*u*u*a.y+3*u*u*t*c1[1]+3*u*t*t*c2[1]+t*t*t*b.y]}
function ctrl(a,b){return [a.o||[a.x,a.y],b.i||[b.x,b.y]]}
function flat(c,steps=12){const r=[];if(!c.p.length)return r;r.push([c.p[0].x,c.p[0].y]);
  for(const [a,b] of segs(c)){if(isCurve(a,b)){const [c1,c2]=ctrl(a,b);for(let t=1;t<=steps;t++)r.push(bez(a,c1,c2,b,t/steps))}else r.push([b.x,b.y])}
  return r}
function area(p){let s=0;for(let i=0,j=p.length-1;i<p.length;j=i++)s+=(p[j][0]*p[i][1]-p[i][0]*p[j][1]);return s/2}
function inPoly(q,p){let c=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const a=p[i],b=p[j];
  if((a[1]>q[1])!==(b[1]>q[1])&&q[0]<(b[0]-a[0])*(q[1]-a[1])/(b[1]-a[1])+a[0])c=!c}return c}
function revC(c){return {z:true,p:c.p.slice().reverse().map(q=>({x:q.x,y:q.y,s:q.s,i:q.o,o:q.i}))}}
/* outer contours clockwise, counters counter-clockwise (TrueType convention, y up) */
function orient(cs){
  cs=cs.filter(c=>c.p.length>=3||(c.p.length===2&&isCurve(c.p[0],c.p[1])));
  const fl=cs.map(c=>flat({z:true,p:c.p})),ar=fl.map(area);
  return cs.map((c,i)=>{let d=0;
    for(let j=0;j<cs.length;j++){if(j===i||Math.abs(ar[j])<=Math.abs(ar[i]))continue;
      let n=0;for(const q of fl[i])if(inPoly(q,fl[j]))n++;if(n>=fl[i].length*.9)d++}
    const wantCW=d%2===0,isCW=ar[i]<0,cc={z:true,p:c.p};return isCW===wantCW?cc:revC(cc)})}
function hasInk(g){return !!g&&(g.c.some(c=>c.p.length>=3||(c.p.length===2&&isCurve(c.p[0],c.p[1])))||!!(g.k&&g.k.length)||!!(g.u&&g.u.some(u=>!u.hide&&S.parts&&S.parts[u.id])))}
