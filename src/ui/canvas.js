/* ---------- canvas ---------- */
const cv=document.getElementById('cv'),ctx=cv.getContext('2d');
let dpr=1,CW=0,CH=0;
const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim();
let C={};
function readColors(){for(const k of ['ink','muted','line','accent','accent-soft','handle','guide','ghost','surface','kern-auto','kern-man','kern-grp'])C[k]=css('--'+k)}
function resize(){const r=cv.getBoundingClientRect();dpr=window.devicePixelRatio||1;CW=r.width;CH=r.height;cv.width=Math.round(CW*dpr);cv.height=Math.round(CH*dpr);draw()}
const psx=X=>X*view.s+view.ox,psy=Y=>-Y*view.s+view.oy,pwx=p=>(p-view.ox)/view.s,pwy=p=>-(p-view.oy)/view.s;
/* glyph-local coordinates: sx/sy/wx/wy work in the frame A of one item (normally the active glyph) */
let A={x0:0,by:0,k:1};const frameOf=it=>it&&it.x0!=null?{x0:it.x0,by:it.by,k:it.k}:{x0:0,by:0,k:1};const useA=()=>{A=frameOf(curItem())};
const sx=x=>psx(A.x0+A.k*x),sy=y=>psy(A.by+A.k*y),wx=p=>(pwx(p)-A.x0)/A.k,wy=p=>(pwy(p)-A.by)/A.k;
function botPad(){const gp=document.getElementById('genPanel');if(gp&&!gp.hidden)return gp.offsetHeight+30;if(clean)return 30;
  const d=document.querySelector('.dock'),c=cv.getBoundingClientRect();if(!d||!d.offsetParent)return 40;return Math.max(40,c.bottom-d.getBoundingClientRect().top+12)}
function sidePads(){if(clean)return [24,24];const c=cv.getBoundingClientRect(),l=document.querySelector('.rail.left'),r=document.querySelector('.rail.right');
  const L=l&&l.offsetParent?l.getBoundingClientRect().right-c.left+14:20,Rr=r&&r.offsetParent?c.right-r.getBoundingClientRect().left+14:20;return CW>700?[L,Rr]:[20,20]}
function fit(){const l=layout();const [pl,pr]=sidePads(),bp=botPad(),top=l.top+130,bot=l.bot-130;const w=fmt().w;
  const bw=l.lines.some(n=>n.x0>1)?w:l.width;const s=Math.min((CW-pl-pr)/Math.max(bw,800),(CH-bp)/(top-bot),(CH-bp)/(ASC-DESC+260));view.s=s;
  view.ox=pl+Math.max(0,(CW-pl-pr-bw*s)/2);view.oy=(CH-bp+70)/2+(top+bot)/2*s;
  if((top-bot)*s>CH-bp)view.oy=70+top*s;draw()}
function focusActive(){const it=curItem();if(!it||it.x0==null)return fit();const bp=botPad(),s=(CH-bp)/((ASC-DESC+260)*it.k);view.s=s;view.ox=CW/2-(it.x0+it.w/2)*s;view.oy=(CH-bp+70)/2+(it.by+(ASC+DESC)/2*it.k)*s;draw()}
function fillGlyph(cs,ox,color){const s=view.s*A.k;ctx.save();ctx.setTransform(dpr*s,0,0,-dpr*s,dpr*sx(ox),dpr*sy(0));ctx.fillStyle=color;ctx.fill(pathOf(cs),'nonzero');ctx.restore()}
function strokeGlyph(cs,ox,color,w){const s=view.s*A.k;ctx.save();ctx.setTransform(dpr*s,0,0,-dpr*s,dpr*sx(ox),dpr*sy(0));ctx.strokeStyle=color;ctx.lineWidth=w/s;ctx.stroke(pathOf(cs));ctx.restore()}
function pathOf(cs){const p=new Path2D();for(const c of cs){if(!c.p.length)continue;p.moveTo(c.p[0].x,c.p[0].y);
  for(const [a,b] of segs(c)){if(isCurve(a,b)){const [c1,c2]=ctrl(a,b);p.bezierCurveTo(c1[0],c1[1],c2[0],c2[1],b.x,b.y)}else p.lineTo(b.x,b.y)}if(c.z)p.closePath()}return p}
let PAPER='#fff',INK='#000';
function draw(){
  if(!S||!CW)return;readColors();PAPER=inv?C.ink:C.surface;INK=inv?C.surface:C.ink;
  ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle=PAPER;ctx.fillRect(0,0,CW,CH);
  const l=layout();useA();
  if(clean){for(const it of l.items){if(!it||it.end||it.x0==null||!it.m||it.m.empty)continue;A=frameOf(it);fillGlyph(it.m.cs,it.dx,INK)}useA();return}
  ctx.lineWidth=1;ctx.font='11px "IBM Plex Mono",monospace';ctx.textBaseline='bottom';
  const ai=curItem(),aln=ai&&ai.ln!=null?ai.ln:0;
  for(const ln of l.lines){if(ln.n===aln)continue;const y=Math.round(psy(ln.by))+.5;ctx.strokeStyle=C.line;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();ctx.globalAlpha=1}
  if(fmt().w*view.s<CW*3){ctx.save();ctx.strokeStyle=C.line;ctx.setLineDash([2,6]);for(const X of [0,fmt().w]){const x=Math.round(psx(X))+.5;ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,CH);ctx.stroke()}ctx.restore()}
  if(l.lines.length){const ln=l.lines[aln]||l.lines[0];A={x0:0,by:ln.by,k:ln.k};
    let ly=-99;
    for(const [v,n] of [[ASC,'Oberlänge '+ASC],[CAP,'Versalhöhe '+CAP],[XH,'x-Höhe '+XH],[0,'Grundlinie 0'],[DESC,'Unterlänge '+String(DESC).replace('-','−')]]){
      const y=Math.round(sy(v))+.5;ctx.strokeStyle=v===0?C.guide:C.line;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(CW,y);ctx.stroke();ctx.fillStyle=C.muted;const tn=trLbl(n),tx=psx(ln.x1)+14,tw=ctx.measureText(tn).width;if(y-ly>13&&tx+tw<CW-sidePads()[1]){ctx.fillText(tn,tx,y-2);ly=y}}}
  l.items.forEach((it,i)=>{
    if(!it||it.end||it.x0==null)return;A=frameOf(it);const S_=view.s*it.k;
    const isA=i===active,ox=it.dx;
    if(isA){ctx.fillStyle=C['accent-soft'];ctx.globalAlpha=.45;ctx.fillRect(sx(0),sy(ASC+60),it.adv*S_,(ASC-DESC+120)*S_);ctx.globalAlpha=1;
      ctx.strokeStyle=C.accent;ctx.setLineDash([4,4]);for(const x of [0,it.adv]){ctx.beginPath();ctx.moveTo(Math.round(sx(x))+.5,sy(ASC+60));ctx.lineTo(Math.round(sx(x))+.5,sy(DESC-60));ctx.stroke()}ctx.setLineDash([])}
    if(S.mono&&it.m&&it.m.over){ctx.save();ctx.strokeStyle='#d33';ctx.lineWidth=2;ctx.strokeRect(sx(0),sy(ASC+60),it.adv*S_,(ASC-DESC+120)*S_);ctx.restore()}
    const g=S.glyphs[it.ch];
    if((it.missing||tpl)&&it.ch!==' '){ctx.save();ctx.fillStyle=INK;ctx.font=`400 ${tplSize()*S_}px ${tplCss()}`;ctx.textBaseline='alphabetic';
      const w=ctx.measureText(baseText(it.ch)).width;ctx.globalAlpha=it.missing?.2:isA?.17:.12;ctx.fillText(baseText(it.ch),sx(0)+(it.adv*S_-w)/2,sy(0));ctx.restore()}
    if(isNamed(it.ch)){ctx.save();ctx.fillStyle=C.muted;ctx.font='11px "IBM Plex Mono",monospace';ctx.textAlign='center';ctx.fillText(nameOf(it.ch)||'',sx(it.adv/2),sy(ASC+30));ctx.restore()}
    if(g&&(g.c.length||(g.k&&g.k.length)||(g.u&&g.u.length))){
      if(isA&&!preview){const ks=[];for(const st of g.k||[])ks.push(...strokeCs(st));if(ks.length)fillGlyph(ks,ox,INK);
        for(const u of g.u||[]){if(u.hide)continue;const pc=partCs(u);fillGlyph(pc,ox,INK);strokeGlyph(pc,ox,C['kern-grp'],u===selPart?3:1.5)}
        if(editPart&&editPart.ch===it.ch){const ec=[];for(const st of g.k||[])if(st._pt)ec.push(...strokeCs(st));if(ec.length)strokeGlyph(ec,ox,C['kern-grp'],2)}
        if(g.c.length){ctx.save();ctx.globalAlpha=.16;fillGlyph(orient(g.c),ox,INK);ctx.restore();strokeGlyph(g.c,ox,INK,1.5)}}
      else if(!it.missing)fillGlyph(glyphCs(g),ox,INK)}
    else if(it.m&&it.m.comp)fillGlyph(it.m.cs,ox,isA?C.muted:INK);
    if(showMet&&isA&&it.m&&!it.m.empty&&it.adv*S_>34){ctx.fillStyle=C.muted;ctx.font='10px "IBM Plex Mono",monospace';ctx.textBaseline='top';const y=sy(DESC)+22;
      ctx.textAlign='left';ctx.fillText(it.m.lsb,sx(0)+2,y);ctx.textAlign='right';ctx.fillText(it.m.rsb,sx(it.adv)-2,y);
      if(it.adv*S_>90){ctx.textAlign='center';ctx.fillText(it.adv,sx(it.adv/2),y)}ctx.textAlign='left'}
    const nx=l.items[i+1];
    if(it.kern&&nx&&nx.ln===it.ln&&!nx.end&&it.kern*S_){const src=kernInfo(it.ch,nx.ch).src;ctx.fillStyle=src==='p'?C['kern-man']:src==='g'?C['kern-grp']:C['kern-auto'];ctx.font='11px "IBM Plex Mono",monospace';ctx.textBaseline='top';
      const x=sx(it.adv+it.kern/2);ctx.textAlign='center';ctx.fillText((it.kern>0?'+':'−')+Math.abs(it.kern),x,sy(DESC)+6);ctx.textAlign='left'}
  });
  if(document.activeElement===ed){const cp=caretPos(caret);const x=Math.round(psx(cp.x))+.5;ctx.strokeStyle=C.accent;ctx.lineWidth=2.5;ctx.beginPath();
    ctx.moveTo(x,psy(cp.by+ASC*cp.k));ctx.lineTo(x,psy(cp.by+DESC*cp.k));ctx.stroke();ctx.lineWidth=1}
  useA();
  if(pickedPair&&tool==='kern'){const it=l.items[pickedPair.i];if(it){A=frameOf(it);ctx.strokeStyle=C['kern-man'];ctx.lineWidth=2;const x=sx(0);ctx.beginPath();ctx.moveTo(x,sy(ASC));ctx.lineTo(x,sy(DESC));ctx.stroke();ctx.lineWidth=1;useA()}}
  const g=curGlyph(false);
  if(g&&!preview&&tool!=='kern')drawPoints(g);
  if(drag&&drag.kind==='shape'&&drag.shape)strokeGlyph([drag.shape],gx(),C.accent,1.5);
  if(drag&&drag.kind==='marq'&&drag.pts.length>1){const P0=drag.pts,o=gx();ctx.save();ctx.strokeStyle=C.accent;ctx.setLineDash([5,4]);ctx.lineWidth=1.5;ctx.beginPath();
    if(selMode==='l'){P0.forEach((q,i)=>i?ctx.lineTo(sx(q[0]+o),sy(q[1])):ctx.moveTo(sx(q[0]+o),sy(q[1])));ctx.closePath()}else{const a=P0[0],b=P0[P0.length-1];ctx.rect(sx(Math.min(a[0],b[0])+o),sy(Math.max(a[1],b[1])),Math.abs(sx(b[0])-sx(a[0])),Math.abs(sy(b[1])-sy(a[1])))}
    ctx.stroke();ctx.fillStyle=C.accent;ctx.globalAlpha=.08;ctx.fill();ctx.restore()}
  if(selK.size&&curGlyph(false)){ctx.save();ctx.globalAlpha=.55;for(const st of selK)if((curGlyph(false).k||[]).includes(st))fillGlyph(strokeCs(st),gx(),C.accent);ctx.restore()}
  if(selStroke&&curGlyph(false)&&(curGlyph(false).k||[]).includes(selStroke)){ctx.save();ctx.globalAlpha=.55;fillGlyph(strokeCs(selStroke),gx(),C.accent);ctx.restore()}
  if(drag&&drag.kind==='brush'&&drag.st.p.length){SC.delete(drag.st);fillGlyph(strokeCs(drag.st),gx(),INK)}
  const it=curItem();
  if(it&&it.m&&!it.m.empty&&it.x0!=null){ctx.fillStyle=C.accent;ctx.font='11px "IBM Plex Mono",monospace';ctx.textBaseline='top';
    ctx.fillText(String(it.m.lsb),sx(0)+4,sy(ASC+60)+4);const t=String(it.m.rsb);ctx.fillText(t,sx(it.adv)-ctx.measureText(t).width-4,sy(ASC+60)+4)}
}
function drawPoints(g){
  const ox=gx();ctx.lineWidth=1;
  for(const c of g.c){
    c.p.forEach((q,idx)=>{
      for(const h of [q.i,q.o])if(h){ctx.strokeStyle=C.handle;ctx.beginPath();ctx.moveTo(sx(q.x+ox),sy(q.y));ctx.lineTo(sx(h[0]+ox),sy(h[1]));ctx.stroke();
        ctx.fillStyle=PAPER;ctx.beginPath();ctx.arc(sx(h[0]+ox),sy(h[1]),4.5,0,7);ctx.fill();ctx.strokeStyle=C.handle;ctx.stroke()}
      const X=sx(q.x+ox),Y=sy(q.y),on=sel.has(q);ctx.fillStyle=on?C.accent:PAPER;ctx.strokeStyle=C.accent;ctx.lineWidth=1.5;ctx.beginPath();
      if(q.s)ctx.arc(X,Y,5.5,0,7);else ctx.rect(X-5,Y-5,10,10);ctx.fill();ctx.stroke();
      if(idx===0&&c===openC){ctx.beginPath();ctx.arc(X,Y,10,0,7);ctx.stroke()}
    })}
}

