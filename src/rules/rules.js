/* ---------- rules mode: letters from skeletons + parameters ----------
   Each letter is a set of centre lines (skeleton). They are "written" with an elliptic or flat nib whose
   size, contrast and angle come from the sliders, so the result is ordinary pen strokes (nib 'gen'). */
const GENP0={w:90,c:35,a:20,wd:100,xh:500,r:25,sl:0,e:'r',ov:15,wc:100,wf:100,sh:45};
const GEN_CH=[...'abcdefghijklmnopqrstuvwxyzßıABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789.,:;-!'];
const isGenGlyph=g=>!!g&&!(g.c&&g.c.length)&&!!(g.k&&g.k.length)&&g.k.every(s=>s.n==='gen');
function genNib(P){const A=P.w/2,B=Math.max(3,A*(1-P.c/100)),an=P.a*Math.PI/180,ca=Math.abs(Math.cos(an)),sa=Math.abs(Math.sin(an));
  return P.e==='f'?{A,B,an,hx:A*ca+B*sa,hy:A*sa+B*ca}:{A,B,an,hx:Math.hypot(A*ca,B*sa),hy:Math.hypot(A*sa,B*ca)}}
function genSkel(P){
  const {hx,hy}=genNib(P),wd=P.wd/100,wC=wd*P.wc/100,wF=wd*P.wf/100,ne=2+3*P.r/100;
  const H=XH,C=CAP,AS=Math.max(C+30,ASC-50),D=DESC+10,ov=P.ov/1000*H,ovC=P.ov/1000*C;
  const b=hy,t=H-hy,bo=hy-ov,to=H-hy+ov,cy=H/2,at=AS-hy,db=D+hy,cb=hy,ct=C-hy,cbo=hy-ovC,cto=C-hy+ovC,X=hx;
  const arc=(cx,cy,rx,ry,a0,a1)=>{const n=Math.max(6,Math.ceil(Math.abs(a1-a0)/180*Math.PI*(rx+ry)/2/6)),o=[];
    for(let i=0;i<=n;i++){const q=(a0+(a1-a0)*i/n)*Math.PI/180,c=Math.cos(q),s=Math.sin(q);
      o.push([cx+rx*Math.sign(c)*Math.pow(Math.abs(c),2/ne),cy+ry*Math.sign(s)*Math.pow(Math.abs(s),2/ne)])}return o};
  const L=(x0,y0,x1,y1)=>[[x0,y0],[x1,y1]],dot=(x,y)=>[[x,y]];
  const G={};
  // lowercase
  const Wn=wd*.52*H+2*hx,nR=Wn-hx,yJ=H*P.sh/100,Wo=Wn*1.1,rxo=Wo/2-hx,ry=H/2-hy+ov;
  const arch=(xl,xr,top)=>arc((xl+xr)/2,yJ,(xr-xl)/2,top-yJ,172,0);
  G.n=[L(X,b,X,t),arch(X,nR,to),L(nR,yJ,nR,b)];
  G.h=[L(X,b,X,at),arch(X,nR,to),L(nR,yJ,nR,b)];
  {const Wm=Wn*1.62,mR=Wm-hx,mM=(X+mR)/2;G.m=[L(X,b,X,t),arch(X,mM,to),L(mM,yJ,mM,b),arch(mM,mR,to),L(mR,yJ,mR,b)]}
  {const yU=H-yJ;G.u=[L(X,t,X,yU),arc((X+nR)/2,yU,(nR-X)/2,yU-bo,180,360),L(nR,t,nR,b)]}
  {const rr=Wn*.36;G.r=[L(X,b,X,t),arc(X+rr,yJ,rr,to-yJ,172,50)]}
  G.o=[arc(Wo/2,cy,rxo,ry,0,360)];
  {const w=Wo*.92;G.c=[arc(w/2,cy,w/2-hx,ry,42,318)]}
  G.e=[arc(Wo/2,cy,rxo,ry,0,328),L(Wo/2-rxo,cy,Wo/2+rxo,cy)];
  {const Wa=Wn*.96,aR=Wa-hx,yA=H*.6,top=H*.56,ryB=(top-bo)/2,rxB=(aR-X)/2;
    G.a=[L(aR,b,aR,yA),arc(Wa/2,yA,aR-Wa/2,to-yA,0,155),arc(X+rxB,bo+ryB,rxB,ryB,0,360)]}
  const bowlL=arc(X+rxo,cy,rxo,ry,0,360),bowlR=arc(Wo/2,cy,rxo,ry,0,360),dR=Wo-hx;
  G.b=[L(X,b,X,at),bowlL];G.d=[L(dR,b,dR,at),bowlR];G.p=[L(X,db,X,t),bowlL];G.q=[L(dR,db,dR,t),bowlR];
  {const yG=db+H*.26,rg=rxo*.95;G.g=[L(dR,t,dR,yG),arc(dR-rg,yG,rg,yG-db,0,-155),bowlR]}
  {const rf=Wn*.3,ryF=H*.2,xf=X+Wn*.12;G.f=[L(xf,b,xf,at-ryF),arc(xf+rf,at-ryF,rf,ryF,180,35),L(xf-Wn*.2,t,xf+Wn*.36,t)]}
  {const rt=Wn*.27,xt=X+Wn*.12,yT=H*.3;G.t=[L(xt,Math.min(at-40,H*1.3),xt,yT),arc(xt+rt,yT,rt,yT-bo,180,330),L(xt-Wn*.16,t,xt+Wn*.36,t)]}
  G['ı']=[L(X,b,X,t)];G.i=[L(X,b,X,t),dot(X,H*1.24)];G.l=[L(X,b,X,at)];
  {const xj=X+Wn*.22,rj=Wn*.3,yj=db+H*.22;G.j=[L(xj,t,xj,yj),arc(xj-rj,yj,rj,yj-db,0,-165),dot(xj,H*1.24)]}
  {const Wk=Wn*.92;G.k=[L(X,b,X,at),L(Wk-hx,t,X,H*.3),L(X+(Wk-X)*.4,H*.47,Wk-hx,b)]}
  const sCurve=(W,top,bot,mid)=>{const cx=W/2,rx=W/2-hx,yu=(top+mid)/2,yl=(bot+mid)/2;
    return [arc(cx,yu,rx*.9,top-yu,28,270),arc(cx,yl,rx,yl-bot,90,-152)]};
  G.s=sCurve(Wn*.86,to,bo,H*.53);
  {const W=Wn;G.v=[[[hx,t],[W/2,b],[W-hx,t]]]}
  {const W=Wn*1.46;G.w=[[[hx,t],[W*.27,b],[W/2,t-H*.05],[W*.73,b],[W-hx,t]]]}
  {const W=Wn*.95;G.x=[L(hx,t,W-hx,b),L(hx,b,W-hx,t)]}
  {const W=Wn,s=(db-t)/(b-t);G.y=[L(hx,t,W/2,b),L(W-hx,t,W-hx+s*(W/2-(W-hx)),db)]}
  {const W=Wn*.9;G.z=[[[hx,t],[W-hx,t],[hx,b],[W-hx,b]]]}
  {const rS=Wn*.34,yM=H*.56,ryU=(at-yM)/2;G['ß']=[L(X,b,X,yM+ryU),arc(X+rS,yM+ryU,rS,ryU,180,-90),arc(X+rS,(yM+bo)/2,rS*1.2,(yM-bo)/2,90,-145)]}
  // capitals
  const Wh=wC*.55*C+2*hx,rH=Wh-hx,mC=C/2;
  G.H=[L(X,cb,X,ct),L(rH,cb,rH,ct),L(X,mC,rH,mC)];G.I=[L(X,cb,X,ct)];
  G.L=[L(X,cb,X,ct),L(X,cb,Wh*.76-hx,cb)];
  {const W=Wh*.84;G.E=[L(X,cb,X,ct),L(X,ct,W-hx,ct),L(X,mC,W*.92-hx,mC),L(X,cb,W-hx,cb)];G.F=[L(X,cb,X,ct),L(X,ct,W-hx,ct),L(X,mC,W*.9-hx,mC)]}
  {const W=Wh*.96;G.T=[L(hx,ct,W-hx,ct),L(W/2,cb,W/2,ct)]}
  {const W=Wh*1.12,yb=C*.3,f=(yb-cb)/(ct-cb),xl=hx+(W/2-hx)*f;G.A=[[[hx,cb],[W/2,ct],[W-hx,cb]],L(xl,yb,W-xl,yb)]}
  {const W=Wh*1.12;G.V=[[[hx,ct],[W/2,cb],[W-hx,ct]]]}
  {const W=Wh*1.6;G.W=[[[hx,ct],[W*.26,cb],[W/2,ct],[W*.74,cb],[W-hx,ct]]]}
  {const W=Wh*1.2;G.M=[[[X,cb],[X,ct],[W/2,cb],[W-hx,ct],[W-hx,cb]]]}
  G.N=[[[X,cb],[X,ct],[rH,cb],[rH,ct]]];
  {const W=Wh*1.02;G.X=[L(hx,ct,W-hx,cb),L(hx,cb,W-hx,ct)]}
  {const W=Wh*1.05,yY=C*.44;G.Y=[[[hx,ct],[W/2,yY],[W-hx,ct]],L(W/2,yY,W/2,cb)]}
  {const W=Wh*.92;G.Z=[[[hx,ct],[W-hx,ct],[hx,cb],[W-hx,cb]]]}
  {const W=Wh*.96;G.K=[L(X,cb,X,ct),L(W-hx,ct,X,C*.36),L(X+W*.3,C*.53,W-hx,cb)]}
  const WO=Wh*1.2,rxO=WO/2-hx,ryO=C/2-hy+ovC;
  G.O=[arc(WO/2,mC,rxO,ryO,0,360)];
  G.Q=[arc(WO/2,mC,rxO,ryO,0,360),L(WO*.56,C*.16,WO*.96,-C*.07)];
  {const W=WO*.93;G.C=[arc(W/2,mC,W/2-hx,ryO,40,320)]}
  {const W=WO*.98,rx=W/2-hx,yb=C*.44;G.G=[arc(W/2,mC,rx,ryO,40,354),L(W/2+rx*.12,yb,W/2+rx,yb),L(W/2+rx,yb,W/2+rx,cbo+C*.06)]}
  {const W=Wh*1.1,xs=W*.45;G.D=[L(X,cb,X,ct),L(X,ct,xs,ct),L(X,cb,xs,cb),arc(xs,mC,W-hx-xs,(ct-cb)/2,90,-90)]}
  const pb=(W,y0,y1,xs)=>[L(X,y1,xs,y1),L(X,y0,xs,y0),arc(xs,(y0+y1)/2,W-hx-xs,(y1-y0)/2,90,-90)];
  {const W=Wh*.95,yP=C*.46;G.P=[L(X,cb,X,ct),...pb(W,yP,ct,W*.55)];G.R=[...G.P,L(W*.5,yP,W-hx,cb)]}
  {const W=Wh*.98,yB=C*.53;G.B=[L(X,cb,X,ct),...pb(W*.92,yB,ct,W*.5),...pb(W,cb,yB,W*.52)]}
  {const W=Wh,yU=C*.36;G.U=[L(X,ct,X,yU),arc(W/2,yU,W/2-hx,yU-cbo,180,360),L(W-hx,yU,W-hx,ct)]}
  {const W=Wh*.8,yU=C*.32,rJ=W*.38;G.J=[L(W-hx,ct,W-hx,yU),arc(W-hx-rJ,yU,rJ,yU-cbo,0,-168)]}
  G.S=sCurve(Wh*.95,cto,cbo,C*.54);
  // figures
  const Wd=wF*.47*C+2*hx,cxd=Wd/2,rxd=Wd/2-hx;
  G['0']=[arc(cxd,mC,rxd,C/2-hy+ovC,0,360)];
  {const xm=Wd*.56;G['1']=[[[xm-Wd*.3,ct-C*.17],[xm,ct],[xm,cb]]]}
  {const y2=C*.7,a=arc(cxd,y2,rxd,cto-y2,165,-28);G['2']=[a.concat([[hx,cb],[Wd-hx,cb]])]}
  {const mid=C*.55,yu=(cto+mid)/2,yl=(cbo+mid)/2;G['3']=[arc(cxd,yu,rxd*.88,cto-yu,152,-90),arc(cxd,yl,rxd,yl-cbo,90,-152)]}
  {const x4=Wd*.7,y4=C*.3;G['4']=[[[x4,cb],[x4,ct],[hx,y4],[Wd-hx,y4]]]}
  {const yt=C*.6,yl=(yt+cbo)/2,a=arc(cxd,yl,rxd,yl-cbo,150,-152);G['5']=[[[Wd-hx*1.1,ct],[hx+Wd*.07,ct],a[0]],a]}
  {const y6=C*.32;G['6']=[arc(cxd,y6,rxd,y6-cbo,0,360),arc(cxd,y6,rxd,cto-y6,62,180)]}
  {const y9=C*.68;G['9']=[arc(cxd,y9,rxd,cto-y9,0,360),arc(cxd,y9,rxd,y9-cbo,0,-118)]}
  G['7']=[[[hx,ct],[Wd-hx,ct],[Wd*.4,cb]]];
  {const mid=C*.54,yu=(cto+mid)/2,yl=(cbo+mid)/2;G['8']=[arc(cxd,yu,rxd*.86,cto-yu,0,360),arc(cxd,yl,rxd,yl-cbo,0,360)]}
  // punctuation
  G['.']=[dot(X,b)];G[',']=[dot(X,b),L(X,b,X-hx*.7,b-H*.2)];G[':']=[dot(X,b),dot(X,t)];G[';']=[dot(X,b),L(X,b,X-hx*.7,b-H*.2),dot(X,t)];
  G['-']=[L(hx,H*.47,hx+H*.38,H*.47)];G['!']=[L(X,C*.3,X,ct),dot(X,b)];
  return G}
function genStrokes(polys,P){const sh=Math.tan(P.sl*Math.PI/180),an=P.a*Math.PI/180;
  return polys.map(pl=>{const p=[];for(const [x,y] of pl)p.push(Math.round((x+y*sh)*10)/10,Math.round(y*10)/10,1,an);return {n:'gen',s:P.w,q:P.c,e:P.e,p}})}
