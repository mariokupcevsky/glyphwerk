/* shared parts (Bauteile): drawn once, used in several glyphs; each use has its own offset. Editing the part changes every glyph. */
function partCs(u){const P=S.parts&&S.parts[u.id];if(!P)return [];const o=[];for(const c of orient(P.c||[]))o.push(shiftC(c,u.dx||0,u.dy||0));
  for(const st of P.k||[])for(const c of strokeCs(st))o.push(shiftC(c,u.dx||0,u.dy||0));return o}
function partUsers(id){return Object.keys(S.glyphs).filter(ch=>{const g=S.glyphs[ch];return g.u&&g.u.some(u=>u.id===id)})}
function touchPart(id){for(const ch of partUsers(id)){const g=S.glyphs[ch];g.v=(g.v||0)+1;dirty.add('g:'+ch)}MC.clear()}
const newPartId=()=>'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);
function rsStroke(st){const q=[];for(let i=0;i<st.p.length;i+=4)q.push([st.p[i],st.p[i+1]]);if(q.length<2)return null;
  const d=[0];for(let i=1;i<q.length;i++)d.push(d[i-1]+Math.hypot(q[i][0]-q[i-1][0],q[i][1]-q[i-1][1]));const L=d[d.length-1]||1,o=[];let j=0;
  for(let k=0;k<16;k++){const t=L*k/15;while(j<q.length-2&&d[j+1]<t)j++;const f=(t-d[j])/((d[j+1]-d[j])||1);o.push([q[j][0]+(q[j+1][0]-q[j][0])*f,q[j][1]+(q[j+1][1]-q[j][1])*f])}
  const cx=o.reduce((a,b)=>a+b[0],0)/16,cy=o.reduce((a,b)=>a+b[1],0)/16;return {o:o.map(([x,y])=>[x-cx,y-cy]),cx,cy,L}}
function similarStrokes(ch,st){const A0=rsStroke(st);if(!A0||st.n==='gen')return [];const out=[];
  for(const [c2,g2] of Object.entries(S.glyphs)){if(c2===ch||!g2.k)continue;for(const s2 of g2.k){if(s2===st||s2.n!==st.n||s2.n==='gen'||s2._pt)continue;
    if(Math.abs((s2.s||0)-(st.s||0))>Math.max(8,.2*(st.s||0))||(s2.o||0)!==(st.o||0))continue;const B=rsStroke(s2);if(!B||Math.abs(B.L-A0.L)>Math.max(30,.12*A0.L))continue;
    const tol=Math.max(22,.07*A0.L);let d1=0,d2=0;for(let i=0;i<16;i++){d1+=Math.hypot(A0.o[i][0]-B.o[i][0],A0.o[i][1]-B.o[i][1]);d2+=Math.hypot(A0.o[i][0]-B.o[15-i][0],A0.o[i][1]-B.o[15-i][1])}
    if(Math.min(d1,d2)/16<tol){out.push({ch:c2,st:s2,dx:Math.round(B.cx-A0.cx),dy:Math.round(B.cy-A0.cy)});break}}}return out}
let selPart=null,editPart=null;
function makePart(ch,st,cs,withSim){const g=S.glyphs[ch];const id=newPartId();S.parts=S.parts||{};
  const sims=withSim&&st?similarStrokes(ch,st):[];undoS.push({multi:[ch,...sims.map(x=>x.ch)].map(snap)});redoS.length=0;updButtons();
  const n=Object.keys(S.parts).length+1;S.parts[id]={name:(LANG==='en'?'Part ':'Bauteil ')+n,k:st?[st]:[],c:cs||[]};
  if(st)g.k=g.k.filter(x=>x!==st);if(cs)g.c=g.c.filter(x=>!cs.includes(x));(g.u||(g.u=[])).push({id,dx:0,dy:0});
  for(const x of sims){const g2=S.glyphs[x.ch];g2.k=g2.k.filter(y=>y!==x.st);(g2.u||(g2.u=[])).push({id,dx:x.dx,dy:x.dy});g2.v=(g2.v||0)+1;dirty.add('g:'+x.ch)}
  dirty.add('meta');selStroke=null;sel.clear();selPart=g.u[g.u.length-1];MC.clear();changed(ch);return sims.length}
function linkMore(ch,u){const P=S.parts[u.id];const st=P.k&&P.k[0];if(!st)return 0;const ref={...st,p:st.p.map((v,i)=>i%4===0?v+(u.dx||0):i%4===1?v+(u.dy||0):v)};
  const sims=similarStrokes(ch,ref);if(!sims.length)return 0;undoS.push({multi:sims.map(x=>snap(x.ch))});updButtons();
  for(const x of sims){const g2=S.glyphs[x.ch];g2.k=g2.k.filter(y=>y!==x.st);(g2.u||(g2.u=[])).push({id:u.id,dx:(u.dx||0)+x.dx,dy:(u.dy||0)+x.dy});g2.v=(g2.v||0)+1;dirty.add('g:'+x.ch)}
  MC.clear();changed(ch);return sims.length}
function partEditStart(ch,u){const g=S.glyphs[ch],P=S.parts[u.id];if(!P)return;pushUndo();
  for(const st of P.k||[])(g.k||(g.k=[])).push({...st,_pt:u.id,p:st.p.map((v,i)=>i%4===0?v+(u.dx||0):i%4===1?v+(u.dy||0):v)});
  for(const c of P.c||[])g.c.push({...shiftC(c,u.dx||0,u.dy||0),z:c.z!==false,_pt:u.id});u.hide=true;editPart={ch,u};selPart=null;changed(ch)}
function partEditEnd(){if(!editPart)return;const {ch,u}=editPart;editPart=null;const g=S.glyphs[ch],P=S.parts&&S.parts[u.id];delete u.hide;if(!g||!P)return;
  const mk=g.k?g.k.filter(st=>st._pt===u.id):[],mc=g.c.filter(c=>c._pt===u.id);
  P.k=mk.map(st=>{const o={...st,p:st.p.map((v,i)=>i%4===0?v-(u.dx||0):i%4===1?v-(u.dy||0):v)};delete o._pt;return o});
  P.c=mc.map(c=>{const o=shiftC(c,-(u.dx||0),-(u.dy||0));o.z=c.z!==false;return o});
  if(g.k)g.k=g.k.filter(st=>st._pt!==u.id);g.c=g.c.filter(c=>c._pt!==u.id);dirty.add('meta');touchPart(u.id);selStroke=null;sel.clear();changed(ch)}
function partDetach(ch,u){const g=S.glyphs[ch],P=S.parts[u.id];pushUndo();
  for(const st of P.k||[])(g.k||(g.k=[])).push({...st,p:st.p.map((v,i)=>i%4===0?v+(u.dx||0):i%4===1?v+(u.dy||0):v)});
  for(const c of P.c||[])g.c.push(shiftC(c,u.dx||0,u.dy||0));g.u=g.u.filter(x=>x!==u);selPart=null;changed(ch)}
function hitPart(g,px,py){if(!g||!g.u)return null;const [x,y]=local(px,py);for(let n=g.u.length-1;n>=0;n--){const u=g.u[n];if(u.hide)continue;for(const c of partCs(u))if(inPoly([x,y],flat({z:true,p:c.p})))return u}return null}
function bounds(cs){let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const c of cs)for(const q of flat(c,8)){x0=Math.min(x0,q[0]);x1=Math.max(x1,q[0]);y0=Math.min(y0,q[1]);y1=Math.max(y1,q[1])}return {x0,x1,y0,y1}}

