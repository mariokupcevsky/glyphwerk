/* ---------- pointer handling ---------- */
const ptrs=new Map();let penSeen=false,drag=null,pinch=null;
let tapS=null,lastTap=null;
cv.addEventListener('pointerdown',e=>{if(!hintSeen){hintSeen=true;try{localStorage.setItem('glyphwerk.hint','1')}catch(_){}setTimeout(renderInsp,1500)}
  
  e.preventDefault();try{cv.setPointerCapture(e.pointerId)}catch(_){}tapS={t:performance.now(),x:e.offsetX,y:e.offsetY,type:e.pointerType,id:e.pointerId};if(e.pointerType==='pen')penSeen=true;
  ptrs.set(e.pointerId,{x:e.offsetX,y:e.offsetY,type:e.pointerType});
  const touches=[...ptrs.values()].filter(p=>p.type==='touch');
  if(touches.length>=2){endDrag(true);const [a,b]=touches;pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2,v:{...view}};return}
  hitR=e.pointerType==='pen'?14:22;
  down(e.offsetX,e.offsetY,e.pointerId,e,e.pointerType==='touch'||(e.pointerType==='mouse'&&mouseSel))});
cv.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;p.x=e.offsetX;p.y=e.offsetY;
  if(pinch){const t=[...ptrs.values()].filter(q=>q.type==='touch');if(t.length>=2){const [a,b]=t;const d=Math.hypot(a.x-b.x,a.y-b.y),mx=(a.x+b.x)/2,my=(a.y+b.y)/2;
      const s=Math.max(.03,Math.min(4,pinch.v.s*d/pinch.d));const wxm=(pinch.mx-pinch.v.ox)/pinch.v.s,wym=(pinch.my-pinch.v.oy)/pinch.v.s;
      view.s=s;view.ox=mx-wxm*s;view.oy=my-wym*s;draw()}return}
  if(drag&&drag.id===e.pointerId)move(e.offsetX,e.offsetY,e)});
function lift(e){
  if(tapS&&tapS.id===e.pointerId&&e.type==='pointerup'&&tapS.type!=='pen'&&Math.hypot(e.offsetX-tapS.x,e.offsetY-tapS.y)<12&&performance.now()-tapS.t<350){const now=performance.now();
    if(lastTap&&now-lastTap.t<450&&Math.hypot(e.offsetX-lastTap.x,e.offsetY-lastTap.y)<40){lastTap=null;focusEd()}else lastTap={t:now,x:e.offsetX,y:e.offsetY}}
  ptrs.delete(e.pointerId);if(pinch){if([...ptrs.values()].filter(q=>q.type==='touch').length<2)pinch=null;return}if(drag&&drag.id===e.pointerId)endDrag(false)}
cv.addEventListener('pointerup',lift);cv.addEventListener('pointercancel',lift);
cv.addEventListener('wheel',e=>{e.preventDefault();if(e.ctrlKey||e.metaKey){const f=Math.exp(-e.deltaY*.01);const s=Math.max(.03,Math.min(4,view.s*f));
  view.ox=e.offsetX-(e.offsetX-view.ox)*s/view.s;view.oy=e.offsetY-(e.offsetY-view.oy)*s/view.s;view.s=s}else{view.ox-=e.deltaX;view.oy-=e.deltaY}draw()},{passive:false});

function activate(i){if(i===active)return;partEditEnd();active=i;sel.clear();selK.clear();selStroke=null;selPart=null;openC=null;pickedPair=null;draw();renderInsp()}
let nib={n:'pointed',s:90,a:35,tilt:false};try{Object.assign(nib,JSON.parse(localStorage.getItem('glyphwerk.nib')||'{}'))}catch(e){}
function saveNib(){try{localStorage.setItem('glyphwerk.nib',JSON.stringify(nib))}catch(e){}}
function addSample(st,e){
  const r=cv.getBoundingClientRect();const evs=e.getCoalescedEvents?e.getCoalescedEvents():[];const list=evs.length?evs:[e];
  for(const ev of list){const px=ev.clientX-r.left,py=ev.clientY-r.top;const [x,y]=local(px,py);const n=st.p.length;
    if(n&&Math.hypot(x-st.p[n-4],y-st.p[n-3])*view.s*A.k<1.5)continue;
    const pr=ev.pointerType==='mouse'?.5:(ev.pressure||.5);let a=nib.a*Math.PI/180;
    if(nib.tilt&&ev.pointerType==='pen'){const az=ev.azimuthAngle!=null?ev.azimuthAngle:Math.atan2(ev.tiltY||0,ev.tiltX||0);a=-(az+Math.PI/2)}
    st.p.push(Math.round(x*10)/10,Math.round(y*10)/10,Math.round(pr*100)/100,Math.round(a*100)/100)}}
function down(px,py,id,ev,selPtr){
  if(clean){drag={kind:'pan',id,x:px,y:py,v:{...view}};return}
  useA();const [x,y]=local(px,py);const T=tool==='kern'?'kern':selPtr?'select':tool;
  if(T==='brush'){if(blank(curCh()))return;curGlyph(true);pushUndo();frozen=true;drag={kind:'brush',id,st:nib.n!=='broad'&&nib.ov?{n:nib.n,s:nib.s,o:nib.ov,p:[]}:{n:nib.n,s:nib.s,p:[]}};addSample(drag.st,ev);draw();return}
  if(T==='kern'){const i=itemAt(px,py).i;if(i>0){const it=layout().items;if(!it[i-1]||it[i-1].ln!==it[i].ln)return;const a=it[i-1].ch,b=it[i].ch;
      if(blank(a)||blank(b)||!gm(a)||!gm(b))return;pickedPair={a,b,i};const sb=kLevel==='s'?sbTarget(b):null;if(sb)pushUndoFor(sb);else pushUndoMeta();
      drag={kind:'kern',id,x:px,k:it[i].k,lvl:kLevel,sb,start:kLevel==='s'?(S.glyphs[sb]?S.glyphs[sb].l||0:0):kLevel==='g'?(S.gkern&&S.gkern[gkKey(a,b)]!=null?S.gkern[gkKey(a,b)]:kernInfo(a,b).src==='p'?autoKern(a,b):kernOf(a,b)):kernOf(a,b),key:kLevel==='g'?gkKey(a,b):kernKey(a,b)};frozen=false;renderInsp();draw()}return}
  const g=curGlyph(false);
  if(T==='select'){
    const h=g&&hitPoint(g,px,py);
    if(h){pushUndo();frozen=true;
      if(h.type==='h'){drag={kind:'handle',id,h}}
      else{if(!sel.has(h.q)){sel.clear();selK.clear();sel.add(h.q)}drag={kind:'move',id,lx:x,ly:y,moved:false}}
      renderInsp();draw();return}
    const sh=g&&hitStroke(g,px,py);
    if(sh&&selK.has(sh)){pushUndo();frozen=true;drag={kind:'move',id,lx:x,ly:y,moved:false};return}
    if(sh){pushUndo();frozen=true;sel.clear();selK.clear();selPart=null;selStroke=sh;drag={kind:'moveStroke',id,lx:x,ly:y,moved:false};renderInsp();draw();return}
    const c=g&&hitContour(g,px,py);
    if(c){pushUndo();frozen=true;selStroke=null;selPart=null;selK.clear();sel=new Set(c.p);drag={kind:'move',id,lx:x,ly:y};renderInsp();draw();return}
    const hu=hitPart(g,px,py);
    if(hu){pushUndo();frozen=true;sel.clear();selStroke=null;selPart=hu;drag={kind:'movePart',id,lx:x,ly:y,moved:false};renderInsp();draw();return}
    if(tool==='select'&&!selPtr&&g&&!blank(curCh())){sel.clear();selK.clear();selStroke=null;selPart=null;drag={kind:'marq',id,pts:[[x,y]]};renderInsp();draw();return}
    const h2=itemAt(px,py);if(h2.ln&&h2.inBand){caret=h2.c;syncEdSel()}
    if(h2.i>=0&&h2.i!==active&&h2.inBand){activate(h2.i);if(!blank(curCh())){caret=h2.i+1;syncEdSel()}drag={kind:'pan',x:px,y:py,v:{...view},id};return}
    if(sel.size||selStroke||selPart||selK.size){sel.clear();selK.clear();selStroke=null;selPart=null;renderInsp();draw()}
    drag={kind:'pan',x:px,y:py,v:{...view},id};return}
  if(T==='pen'){
    if(blank(curCh()))return;
    const G=curGlyph(true);pushUndo();frozen=true;
    if(openC){const f=openC.p[0];if(openC.p.length>=2&&Math.hypot(sx(f.x+gx())-px,sy(f.y)-py)<hitR){openC.z=true;const c=openC;openC=null;sel=new Set([f]);drag={kind:'handlePull',id,q:f,closing:true,c};draw();return}
      const q=P(snapV(x),snapV(y));openC.p.push(q);sel=new Set([q]);drag={kind:'handlePull',id,q};draw();return}
    const hp=hitPoint(G,px,py);if(hp&&hp.type==='h'){drag={kind:'handle',id,h:hp};draw();return}if(hp&&hp.type==='p'){sel=new Set([hp.q]);drag={kind:'move',id,lx:x,ly:y};renderInsp();draw();return}
    const hs=hitSegment(G,px,py);if(hs){const q=splitAt(hs);sel=new Set([q]);drag={kind:'move',id,lx:x,ly:y};draw();return}
    const q=P(snapV(x),snapV(y));openC={z:false,p:[q]};if(editPart&&editPart.ch===curCh())openC._pt=editPart.u.id;G.c.push(openC);sel=new Set([q]);drag={kind:'handlePull',id,q};draw();renderInsp();return}
  if(T==='rect'||T==='ellipse'){if(blank(curCh()))return;curGlyph(true);pushUndo();frozen=true;drag={kind:'shape',id,x0:snapV(x),y0:snapV(y),shape:null};return}
}
function move(px,py,ev){
  useA();const [x,y]=local(px,py);
  if(drag.kind==='brush'){addSample(drag.st,ev);draw();return}
  if(drag.kind==='movePart'){const dx=Math.round(x-drag.lx),dy=Math.round(y-drag.ly);if(!dx&&!dy)return;selPart.dx=(selPart.dx||0)+dx;selPart.dy=(selPart.dy||0)+dy;drag.lx+=dx;drag.ly+=dy;drag.moved=true;MC.delete(curCh());draw();return}
  if(drag.kind==='moveStroke'){const dx=x-drag.lx,dy=y-drag.ly;if(!dx&&!dy)return;const p=selStroke.p;for(let i=0;i<p.length;i+=4){p[i]=Math.round((p[i]+dx)*10)/10;p[i+1]=Math.round((p[i+1]+dy)*10)/10}
    SC.delete(selStroke);drag.lx=x;drag.ly=y;drag.moved=true;MC.delete(curCh());draw();return}
  if(drag.kind==='pan'){view.ox=drag.v.ox+(px-drag.x);view.oy=drag.v.oy+(py-drag.y);draw();return}
  if(drag.kind==='kern'){const upp=Math.max(.5,Math.min(2,.35/(view.s*(drag.k||1))));const v=Math.round((drag.start+(px-drag.x)*upp)/5)*5;
    if(drag.lvl==='s'){const g=sbGlyph(drag.sb);if(g.l===v)return;g.l=v;g.v=(g.v||0)+1}else if(drag.lvl==='g'){(S.gkern||(S.gkern={}))[drag.key]=v}else S.kern[drag.key]=v;
    relayout();draw();renderInsp();return}
  if(drag.kind==='marq'){const l=drag.pts[drag.pts.length-1];if(Math.hypot(x-l[0],y-l[1])*view.s*A.k>3)drag.pts.push([x,y]);draw();return}
  if(drag.kind==='move'){const nx=snapV(x),ny=snapV(y),ox=snapV(drag.lx),oy=snapV(drag.ly);const dx=nx-ox,dy=ny-oy;if(!dx&&!dy)return;
    for(const q of sel){q.x+=dx;q.y+=dy;if(q.i){q.i[0]+=dx;q.i[1]+=dy}if(q.o){q.o[0]+=dx;q.o[1]+=dy}}for(const st of selK){for(let i=0;i<st.p.length;i+=4){st.p[i]=Math.round((st.p[i]+dx)*10)/10;st.p[i+1]=Math.round((st.p[i+1]+dy)*10)/10}SC.delete(st)}if(selK.size)MC.delete(curCh());drag.lx+=dx;drag.ly+=dy;drag.moved=true;draw();return}
  if(drag.kind==='handle'){const {q,k}=drag.h;const nx=Math.round(x),ny=Math.round(y);q[k]=[nx,ny];
    const ok=k==='i'?'o':'i';if(q.s&&q[ok]){const len=Math.hypot(q[ok][0]-q.x,q[ok][1]-q.y),dl=Math.hypot(nx-q.x,ny-q.y)||1;q[ok]=[q.x-(nx-q.x)/dl*len,q.y-(ny-q.y)/dl*len]}draw();return}
  if(drag.kind==='handlePull'){const q=drag.q;const dx=x-q.x,dy=y-q.y;if(Math.hypot(dx,dy)*view.s*A.k<8)return;
    q.s=true;q.o=[Math.round(q.x+dx),Math.round(q.y+dy)];q.i=[Math.round(q.x-dx),Math.round(q.y-dy)];draw();return}
  if(drag.kind==='shape'){const x1=snapV(x),y1=snapV(y);const a=Math.min(drag.x0,x1),b=Math.min(drag.y0,y1),w=Math.abs(x1-drag.x0),h=Math.abs(y1-drag.y0);
    drag.shape=w&&h?(tool==='rect'?rect(a,b,w,h):ellipse(a+w/2,b+h/2,w/2,h/2)):null;draw()}
}
function endDrag(cancel){
  if(!drag)return;const d=drag;drag=null;frozen=false;
  if(cancel){relayout();draw();return}
  if(d.kind==='pan')return;
  if(d.kind==='marq'){const g=curGlyph(false),pts=d.pts;if(g&&pts.length>1){let inside;
      if(selMode==='l'&&pts.length>2)inside=q=>inPoly(q,pts);else{const x0=Math.min(pts[0][0],pts[pts.length-1][0]),x1=Math.max(pts[0][0],pts[pts.length-1][0]),y0=Math.min(pts[0][1],pts[pts.length-1][1]),y1=Math.max(pts[0][1],pts[pts.length-1][1]);inside=q=>q[0]>=x0&&q[0]<=x1&&q[1]>=y0&&q[1]<=y1}
      for(const c of g.c)for(const q of c.p)if(inside([q.x,q.y]))sel.add(q);
      for(const st of g.k||[]){let n=0,m=0;for(let i=0;i<st.p.length;i+=4){m++;if(inside([st.p[i],st.p[i+1]]))n++}if(m&&n>=m*.8)selK.add(st)}}
    renderInsp();draw();return}
  if(d.kind==='moveStroke'&&!d.moved){undoS.pop();updButtons();draw();return}
  if(d.kind==='movePart'){if(!d.moved){undoS.pop();updButtons();draw()}else changed(curCh());return}
  if(d.kind==='kern'){if(d.lvl==='s'){dirty.add('meta');changed(d.sb)}else changed(null);return}
  if(d.kind==='brush'){if(d.st.p.length){SC.delete(d.st);const G=curGlyph(true);if(editPart&&editPart.ch===curCh())d.st._pt=editPart.u.id;(G.k||(G.k=[])).push(d.st);changed(curCh())}else{undoS.pop();updButtons();draw()}return}
  if(d.kind==='shape'){if(d.shape){const G=curGlyph(true);if(editPart&&editPart.ch===curCh())d.shape._pt=editPart.u.id;G.c.push(d.shape);sel=new Set(d.shape.p);changed(curCh())}else{undoS.pop();updButtons();draw()}return}
  if(d.kind==='move'&&d.moved===false&&tool==='select'&&!selK.size){draw();renderInsp();undoS.pop();updButtons();return}
  changed(curCh())}

