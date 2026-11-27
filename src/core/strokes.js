/* ---------- pen strokes -> outlines ----------
   Each stroke is a list of samples [x,y,pressure,angle]. Every sample is stamped with the nib shape
   (circle or flat edge); consecutive stamps are joined by their convex hull. All hulls run clockwise,
   so under the non-zero rule they merge into one clean filled shape without holes. */
const NIBS={pointed:'Spitzfeder',broad:'Breitfeder',brush:'Pinsel',marker:'Marker',gen:'Regel'};
function stamp(n,x,y,r,a,size,st){
  if(n==='gen'){const A=size/2,B=Math.max(3,A*(1-(st.q||0)/100)),c=Math.cos(a),sn=Math.sin(a);
    if(st.e==='f')return [[-A,-B],[A,-B],[A,B],[-A,B]].map(([u,v])=>[x+u*c-v*sn,y+u*sn+v*c]);
    const k=A<12?12:A<40?20:28,o=[];for(let i=0;i<k;i++){const t=i/k*Math.PI*2,u=Math.cos(t)*A,v=Math.sin(t)*B;o.push([x+u*c-v*sn,y+u*sn+v*c])}return o}
  if(n==='broad'){const L=size*(.9+.2*r)/2,t=Math.max(3,size*.07)/2,c=Math.cos(a),sn=Math.sin(a);
    return [[x-c*L+sn*t,y-sn*L-c*t],[x+c*L+sn*t,y+sn*L-c*t],[x+c*L-sn*t,y+sn*L+c*t],[x-c*L-sn*t,y-sn*L+c*t]]}
  const k=r<12?10:r<40?16:24,o=[];const ov=st&&st.o?st.o/100:0;
  if(ov){const rb=r*(1-ov),c=Math.cos(a),sn=Math.sin(a);for(let i=0;i<k;i++){const t=i/k*Math.PI*2,u=Math.cos(t)*r,v=Math.sin(t)*rb;o.push([x+u*c-v*sn,y+u*sn+v*c])}return o}
  for(let i=0;i<k;i++){const t=i/k*Math.PI*2;o.push([x+Math.cos(t)*r,y+Math.sin(t)*r])}return o}
function hull(pts){pts=pts.slice().sort((a,b)=>a[0]-b[0]||a[1]-b[1]);if(pts.length<3)return pts;
  const cr=(o,a,b)=>(a[0]-o[0])*(b[1]-o[1])-(a[1]-o[1])*(b[0]-o[0]);const lo=[],up=[];
  for(const q of pts){while(lo.length>=2&&cr(lo[lo.length-2],lo[lo.length-1],q)<=0)lo.pop();lo.push(q)}
  for(let i=pts.length-1;i>=0;i--){const q=pts[i];while(up.length>=2&&cr(up[up.length-2],up[up.length-1],q)<=0)up.pop();up.push(q)}
  up.pop();lo.pop();return lo.concat(up)}
function inHull(q,h,tol){for(let i=0;i<h.length;i++){const a=h[i],b=h[(i+1)%h.length];const ex=b[0]-a[0],ey=b[1]-a[1],l=Math.hypot(ex,ey)||1;
  if((ex*(q[1]-a[1])-ey*(q[0]-a[0]))/l<-tol)return false}return true}
function strokeSamples(st){
  const raw=[];for(let i=0;i<st.p.length;i+=4)raw.push([st.p[i],st.p[i+1],st.p[i+2],st.p[i+3]]);
  if(st.n==='gen')return raw.map(q=>({x:q[0],y:q[1],r:1,a:q[3]}));
  const sm=raw.map((q,i)=>{if(i===0||i===raw.length-1)return q.slice();const a=raw[i-1],b=raw[i+1];
    return [(a[0]+2*q[0]+b[0])/4,(a[1]+2*q[1]+b[1])/4,(a[2]+2*q[2]+b[2])/4,q[3]]});
  let len=0;const d=[0];for(let i=1;i<sm.length;i++){len+=Math.hypot(sm[i][0]-sm[i-1][0],sm[i][1]-sm[i-1][1]);d.push(len)}
  const S0=st.s,taper=Math.min(S0*1.2,len/2.5);
  return sm.map((q,i)=>{const p=Math.max(.05,Math.min(1,q[2]));let r;
    if(st.n==='marker')r=S0/2;
    else if(st.n==='pointed')r=Math.max(S0*.025,S0*.5*Math.pow(p,1.6));
    else if(st.n==='brush'){const tp=taper>0?Math.max(.12,Math.min(1,d[i]/taper,(len-d[i])/taper)):1;r=S0*.5*(.25+.75*p)*tp}
    else r=p;
    return {x:q[0],y:q[1],r,a:q[3]}})}
const SC=new WeakMap();
function strokeCs(st){
  let c=SC.get(st);if(c)return c;
  const sm=strokeSamples(st);const stamps=sm.map(q=>stamp(st.n,q.x,q.y,q.r,q.a,st.s,st));const out=[];
  const toC=h=>{if(area(h)>0)h=h.slice().reverse();return {z:true,p:h.map(q=>({x:Math.round(q[0]*10)/10,y:Math.round(q[1]*10)/10,s:false,i:null,o:null}))}};
  if(stamps.length===1)out.push(toC(hull(stamps[0])));
  let i=0;while(i<stamps.length-1){let j=i+1,best=hull(stamps[i].concat(stamps[j]));
    while(j+1<stamps.length){const h=hull(stamps[i].concat(stamps[j+1]));let ok=true;
      for(let k=i+1;k<=j&&ok;k++)for(const q of stamps[k])if(!inHull(q,h,1.2)){ok=false;break}
      if(!ok)break;j++;best=h}
    out.push(toC(best));i=j}
  SC.set(st,out);return out}
function glyphCs(g){const o=orient(g.c);if(g.k)for(const st of g.k)o.push(...strokeCs(st));if(g.u)for(const u of g.u)if(!u.hide)o.push(...partCs(u));return o}
