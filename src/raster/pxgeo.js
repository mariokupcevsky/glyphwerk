/* PXGEO-BEGIN: pixel-grid -> outline (cell units, y down). Original implementation. */
function pxOutline(on,cols,rows,par){
  if(par.ins>0&&!par._in)return pxOutline(on,cols,rows,{...par,ins:0}).concat(pxOutline(on,cols,rows,{...par,_in:Math.min(.45,par.ins)}));
  const ins=par._in||0;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const g=clamp(+par.gap||0,0,95)/100,flush=g<1e-6,mh=!!par.mh,mv=!!par.mv,md=!!par.md;
  const body=1-g,pr=clamp(+par.r||0,0,100)/100,pj=clamp(+par.j||0,0,100)/100;
  let rho=Math.max(0,pr*body/2-ins),jr=pj*body/2;
  const wmin=Math.max(.3*body,1e-3),avail=body-wmin;
  if(2*(rho+jr)>avail)jr=Math.max(0,avail/2-rho);
  const wn=Math.max(wmin,body-2*(rho+jr));
  const O=(c,r)=>c>=0&&r>=0&&c<cols&&r<rows&&!!on[r][c];
  const R=[];// rectangles x0,x1,y0,y1
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){if(!on[r][c])continue;
    {let x0=flush?c:c+g/2,x1=flush?c+1:c+1-g/2,y0=flush?r:r+g/2,y1=flush?r+1:r+1-g/2;
      if(ins){if(!O(c-1,r))x0+=ins;if(!O(c+1,r))x1-=ins;if(!O(c,r-1))y0+=ins;if(!O(c,r+1))y1-=ins;if(x1-x0<1e-3||y1-y0<1e-3)continue}
      R.push([x0,x1,y0,y1])}
    if(md&&!ins){const hw=g/2+wn/2;
      if(O(c+1,r+1)&&!O(c+1,r)&&!O(c,r+1))R.push([c+1-hw,c+1+hw,r+1-hw,r+1+hw]);
      if(O(c-1,r+1)&&!O(c-1,r)&&!O(c,r+1))R.push([c-hw,c+hw,r+1-hw,r+1+hw])}
    if(flush)continue;
    if(mh&&O(c+1,r))R.push([c+1-g/2,c+1+g/2,r+.5-wn/2,r+.5+wn/2]);
    if(mv&&O(c,r+1))R.push([c+.5-wn/2,c+.5+wn/2,r+1-g/2,r+1+g/2]);
    if(mh&&mv&&O(c+1,r)&&O(c,r+1)&&O(c+1,r+1))R.push([c+1-g/2,c+1+g/2,r+1-g/2,r+1+g/2])}
  if(!R.length)return [];
  const q=v=>Math.round(v*1e6)/1e6,ux=new Set(),uy=new Set();
  for(const a of R){ux.add(q(a[0]));ux.add(q(a[1]));uy.add(q(a[2]));uy.add(q(a[3]))}
  const xs=[...ux].sort((a,b)=>a-b),ys=[...uy].sort((a,b)=>a-b),W=xs.length-1,H=ys.length-1;
  const xi=new Map(xs.map((v,i)=>[v,i])),yi=new Map(ys.map((v,i)=>[v,i]));
  const F=Array.from({length:H},()=>new Uint8Array(W));
  for(const a of R){const i0=xi.get(q(a[0])),i1=xi.get(q(a[1])),j0=yi.get(q(a[2])),j1=yi.get(q(a[3]));
    for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++)F[j][i]=1}
  const f=(i,j)=>i>=0&&j>=0&&i<W&&j<H&&F[j][i]===1;
  // directed boundary edges, filled area on the right (clockwise on screen, y down)
  const out=new Map(),key=(i,j)=>i*(H+1)+j,add=(a,b,c,d)=>{const k=key(a,b);if(!out.has(k))out.set(k,[]);out.get(k).push([c,d])};
  for(let j=0;j<H;j++)for(let i=0;i<W;i++){if(!F[j][i])continue;
    if(!f(i,j-1))add(i,j,i+1,j);
    if(!f(i+1,j))add(i+1,j,i+1,j+1);
    if(!f(i,j+1))add(i+1,j+1,i,j+1);
    if(!f(i-1,j))add(i,j+1,i,j)}
  const loops=[];
  for(const [k0,lst0] of out){
    while(lst0.length){
      let [i,j]=[Math.floor(k0/(H+1)),k0%(H+1)];const si=i,sj=j;let nx=lst0.pop();const pts=[[i,j]];let dir=[nx[0]-i,nx[1]-j];i=nx[0];j=nx[1];
      let guard=0;
      while(!(i===si&&j===sj)&&guard++<1e6){pts.push([i,j]);const l=out.get(key(i,j));if(!l||!l.length)break;
        const rt=[-dir[1],dir[0]];let pick=0,best=-9;
        for(let t=0;t<l.length;t++){const d=[l[t][0]-i,l[t][1]-j];const sc=(d[0]===rt[0]&&d[1]===rt[1])?3:(d[0]===dir[0]&&d[1]===dir[1])?2:1;if(sc>best){best=sc;pick=t}}
        nx=l.splice(pick,1)[0];dir=[nx[0]-i,nx[1]-j];i=nx[0];j=nx[1]}
      loops.push(pts)}}
  const res=[];
  for(const lp of loops){
    // to coordinates, drop collinear
    let P=lp.map(([i,j])=>[xs[i],ys[j]]);
    let ch=true;while(ch&&P.length>=4){ch=false;const n=P.length,keep=[];
      for(let k=0;k<n;k++){const a=P[(k+n-1)%n],b=P[k],c=P[(k+1)%n];const cr=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);
        if(Math.abs(cr)<1e-9)ch=true;else keep.push(b)}
      P=keep}
    const n=P.length;if(n<3)continue;
    const cv=[],len=[],rad=[];
    for(let k=0;k<n;k++){const a=P[(k+n-1)%n],b=P[k],c=P[(k+1)%n];
      const cr=(b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]);cv.push(cr>0);
      len.push(Math.hypot(c[0]-b[0],c[1]-b[1]));rad.push(cr>0?rho:jr)}
    const fe=len.map((L,k)=>{const s=rad[k]+rad[(k+1)%n];return s>L&&s>0?L/s:1});
    const fr=rad.map((r0,k)=>r0*Math.min(fe[k],fe[(k+n-1)%n]));
    const pts=[],K=.5523;
    for(let k=0;k<n;k++){const a=P[(k+n-1)%n],b=P[k],c=P[(k+1)%n],r0=fr[k];
      if(r0<1e-6){pts.push({x:b[0],y:b[1],i:null,o:null});continue}
      const d1=Math.hypot(a[0]-b[0],a[1]-b[1]),d2=Math.hypot(c[0]-b[0],c[1]-b[1]);
      const t1=[b[0]+(a[0]-b[0])/d1*r0,b[1]+(a[1]-b[1])/d1*r0],t2=[b[0]+(c[0]-b[0])/d2*r0,b[1]+(c[1]-b[1])/d2*r0];
      pts.push({x:t1[0],y:t1[1],i:null,o:[t1[0]+(b[0]-t1[0])*K,t1[1]+(b[1]-t1[1])*K]});
      pts.push({x:t2[0],y:t2[1],i:[t2[0]+(b[0]-t2[0])*K,t2[1]+(b[1]-t2[1])*K],o:null})}
    res.push(pts)}
  return res}
/* PXGEO-END */
