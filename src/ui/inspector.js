/* ---------- inspector ---------- */
const insp=document.getElementById('insp');
function btn(act,label,extra=''){return `<button class="solid" data-act="${act}" ${extra}>${label}</button>`}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function keySel(ch,side){const g=S.glyphs[ch]||{},cur=g[side+'k']||'';const cs=allChars().filter(c=>c!==ch&&!COMPOSE[c]&&(()=>{const m=gm(c);return m&&!m.empty})());
  return `<select class="sel" data-key="${side}" data-ch="${esc(ch)}" aria-label="${side==='l'?'Links':'Rechts'} gleich wie"><option value="">eigen</option>${cs.map(c=>`<option value="${esc(c)}" ${c===cur?'selected':''}>= ${esc(disp(c))}</option>`).join('')}</select>`}
let toastUntil=0,toastTxt='';function toast(t){toastTxt=t;toastUntil=Date.now()+3500;renderInsp();setTimeout(renderInsp,3600)}
let hintSeen=false;try{hintSeen=localStorage.getItem('glyphwerk.hint')==='1'}catch(e){}
let inspTab='g';
const TABS=[['g','Glyphe'],['s','Abstand'],['k','Kerning'],['p','Absatz']];
function tabOf(h){return /data-act="(pk[-+]|pal-|ptr[-+]|flh|fw[-+])/.test(h)?'p':/data-act="(kp|kgo)|data-grp/.test(h)?'k':/data-act="(l[-+]|r[-+]|spw)/.test(h)?'s':'g'}
function renderTabs(parts){
  const tb=document.getElementById('inspTabs');
  if(tool==='kern'){tb.hidden=true;insp.removeAttribute('role');insp.innerHTML=parts.join('');return}
  const busy=sel.size||selStroke||selPart||openC||editPart||selK.size;
  const by={g:[],s:[],k:[],p:[]};for(const h of parts)by[tabOf(h)].push(h);
  if(busy)inspTab='g';
  tb.hidden=false;tb.innerHTML=TABS.map(([k,l])=>`<button role="tab" class="${k===inspTab?'on':''}" data-tab="${k}" aria-selected="${k===inspTab}">${l}</button>`).join('');
  insp.setAttribute('role','tabpanel');
  insp.innerHTML=by[inspTab].join('')||'<span class="note">Hier gibt es für die aktuelle Auswahl nichts einzustellen.</span>'}
document.getElementById('inspTabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(!b)return;inspTab=b.dataset.tab;renderInsp()});
function renderInsp(){if(typeof pxOpen!=='undefined'&&pxOpen)pxDrawGrid();
  const parts=[];const ch=curCh();const it=curItem();
  if(tool==='brush'&&(nib.n==='broad'||nib.ov))parts.push(`<div class="blk"><span class="lbl">Neigung</span><span class="num">${nib.tilt?'vom Pencil':nib.a+'°'}</span><button class="solid" data-act="tilt" aria-pressed="${nib.tilt}">Neigung vom Pencil nehmen</button></div>`);
  if(tool==='select')parts.push(`<div class="blk"><span class="lbl">Auswahl</span><span class="seg">${btn('sm-r','▭ Rechteck','aria-pressed="'+(selMode==='r')+'"')}${btn('sm-l','Lasso','aria-pressed="'+(selMode==='l')+'"')}</span><span class="note">Mit dem Stift ins Leere ziehen wählt aus. Ausgewähltes ziehen verschiebt es.</span></div>`);
  if(selK.size&&tool!=='kern')parts.push(`<div class="blk"><span class="lbl">${selK.size} ${selK.size===1?'Strich':'Striche'} ausgewählt</span>${btn('kselbez','In Bézier')}${btn('kseldel','Löschen')}</div>`);
  if(tool==='kern'){const L=kLevel,pp=pickedPair;
    if(S.mono)parts.push(`<span class="note">Monospace ist an: Alle Zeichen haben ${S.mono} Breite, Kerning wirkt nicht. Links/rechts verschiebt das Zeichen in seiner Zelle.</span>`);
    parts.push(`<div class="blk"><span class="lbl">Ebene</span><span class="seg">${btn('kl-s','1 Abstand','aria-pressed="'+(L==='s')+'"')}${btn('kl-g','2 Gruppe','aria-pressed="'+(L==='g')+'"')}${btn('kl-p','3 Paar','aria-pressed="'+(L==='p')+'"')}</span></div>`);
    if(L==='s'){parts.push(`<div class="blk"><span class="lbl">Grundabstand</span>${btn('gsp-','−')}<span class="num">${S.spacing}</span>${btn('gsp+','+')}<span class="lbl">Auto-Kerning</span>${btn('gks-','−')}<span class="num">${S.strength}%</span>${btn('gks+','+')}</div>`);
      const c=pp?sbTarget(pp.b):null,m=c&&gm(c);
      if(m&&!m.empty){const g=S.glyphs[c]||{};parts.push(`<div class="blk"><span class="lbl">${esc(disp(c))} links</span>${S.glyphs[c]&&hasInk(S.glyphs[c])?keySel(c,'l'):''}${btn('sbl-10','−')}<span class="num ${g.l?'man':''}">${m.lsb}</span>${btn('sbl+10','+')}<span class="lbl">rechts</span>${S.glyphs[c]&&hasInk(S.glyphs[c])?keySel(c,'r'):''}${btn('sbr-10','−')}<span class="num ${g.r?'man':''}">${m.rsb}</span>${btn('sbr+10','+')}${(g.l||g.r)?btn('sbaut','Auto'):''}</div>`)}
      parts.push(`<span class="note">Ebene 1 gilt für alle Nachbarn. Zieh einen Buchstaben seitlich: sein linker Abstand ändert sich überall.${c&&c!==pp.b?' '+esc(disp(pp.b))+' folgt '+esc(disp(c))+'.':''}</span>`)}
    else if(!pp)parts.push(`<span class="note">${L==='g'?'Ebene 2: Tippe auf einen Buchstaben und zieh ihn seitlich. Das gilt für alle Paare aus denselben Gruppen, z. B. H, I, M, N links gleich.':'Ebene 3: Ausnahme nur für genau dieses Paar. Sie geht vor Gruppe und Automatik.'} Farben: blau automatisch, grün Gruppe, pink Paar.</span>`);
    if(pp&&L!=='s'){const a=pp.a,b=pp.b,inf=kernInfo(a,b),au=autoKern(a,b),gl=grpOf(a,'r'),gr=grpOf(b,'l'),gk=S.gkern&&S.gkern[gkKey(a,b)],pk=kernKey(a,b) in S.kern;
      const srcT={p:'aus Paar',g:'aus Gruppe',a:'automatisch',m:'Monospace'}[inf.src],cls=inf.src==='p'?'man':inf.src==='g'?'grp':'';
      parts.push(`<div class="blk"><span class="lbl">Paar</span><b>${esc(disp(a))}${esc(disp(b))}</b><span class="num ${cls}">${inf.v}</span><span class="lbl">${srcT}</span>
        ${btn('k-10','−10')}${btn('k-2','−2')}${btn('k2','+2')}${btn('k10','+10')}${L==='g'?(gk!=null?btn('kgdel','Gruppe weg'):''):(pk?btn('kauto','Ausnahme weg'):'')}</div>`);
      const opts=(side,ch)=>{const cur=grpOf(ch,side),names=[...new Set(allChars().filter(c=>{const m=gm(c);return m&&!m.empty}).map(c=>grpOf(c,side)))];if(!names.includes(cur))names.push(cur);
        return `<select class="sel" data-grp="${side}" data-ch="${esc(ch)}">${names.map(n=>`<option value="${esc(n)}" ${n===cur?'selected':''}>wie ${esc(disp(n))}</option>`).join('')}<option value="@own">eigene Gruppe</option><option value="@auto">automatisch</option></select>`};
      const mem=(n,side)=>grpMembers(n,side).slice(0,14).map(disp).join(' ');
      parts.push(`<div class="blk"><span class="lbl">${esc(disp(a))} rechts</span>${opts('r',a)}<span class="note">${esc(mem(gl,'r'))}</span></div><div class="blk"><span class="lbl">${esc(disp(b))} links</span>${opts('l',b)}<span class="note">${esc(mem(gr,'l'))}</span></div>`);
      if(L==='g'&&pk)parts.push(`<span class="note">Für ${esc(disp(a))}${esc(disp(b))} gibt es eine Paar-Ausnahme, sie geht vor. Gruppenwerte siehst du bei den anderen Paaren.</span>`)}
  }else{
    const gk=curGlyph(false),nk=gk&&gk.k?gk.k.length:0;
    const chs=a=>a.map(c=>esc(disp(c))).join(', ');
    if(editPart&&editPart.ch===ch)parts.push(`<div class="blk"><span class="lbl">Bauteil bearbeiten</span><span class="note">Grün umrandete Striche gehören zum Bauteil. Neue Striche auch. Gilt für ${chs(partUsers(editPart.u.id))}.</span>${btn('pend','Fertig')}</div>`);
    if(selStroke){const sims=selStroke._pt?[]:similarStrokes(ch,selStroke);
      parts.push(`<div class="blk"><span class="lbl">Strich · ${esc(NIBS[selStroke.n]||'')}</span>${btn('sdel','Löschen')}${btn('sdup','Duplizieren')}${btn('sbez','In Bézier')}${selStroke._pt||selStroke.n==='gen'?'':sims.length?btn('pmks','Mit '+chs([...new Set(sims.map(x=>x.ch))])+' verknüpfen'):btn('pmk','Als Bauteil')}</div>`)}
    else if(selPart){const P=S.parts[selPart.id]||{},us=partUsers(selPart.id);const P0=P.k&&P.k[0];const more=P0?similarStrokes(ch,{...P0,p:P0.p.map((v,i)=>i%4===0?v+(selPart.dx||0):i%4===1?v+(selPart.dy||0):v)}):[];
      parts.push(`<div class="blk"><span class="lbl">${esc(P.name||'Bauteil')} · in ${chs(us)}</span>${btn('pmv-l','←')}${btn('pmv-r','→')}${btn('pmv-u','↑')}${btn('pmv-d','↓')}${btn('ped','Form bearbeiten')}${btn('pdet','Lösen')}${btn('pdel','Entfernen')}${more.length?btn('plink','Auch '+chs([...new Set(more.map(x=>x.ch))])+' verknüpfen'):''}</div>`)}
    else if(nk)parts.push(`<div class="blk"><span class="lbl">${nk} ${nk===1?'Strich':'Striche'}</span>${btn('klast','Letzten weg')}${btn('kall','Alle weg')}${btn('kbez','Alle in Bézier')}${btn('simp','Vereinfachen')}</div>`);
    if(sel.size===1){const q=[...sel][0];
      parts.push(`<div class="blk"><span class="lbl">Punkt</span><span class="num">${Math.round(q.x)}</span><span class="num">${Math.round(q.y)}</span>
      ${btn('nl','←')}${btn('nr','→')}${btn('nu','↑')}${btn('nd','↓')}${btn('smooth',q.s?'Ecke':'Kurve')}${btn('straight','Griffe weg')}${btn('del','Löschen')}</div>`)}
    else if(sel.size>1)parts.push(`<div class="blk"><span class="lbl">${sel.size} Punkte</span>${btn('nl','←')}${btn('nr','→')}${btn('nu','↑')}${btn('nd','↓')}${btn('delc','Kontur löschen')}${btn('red','Punkte reduzieren')}${btn('copy','Kopieren')}${editPart?'':btn('pmkc','Als Bauteil')}</div>`);
    if(!sel.size&&!selStroke&&!selPart&&!openC&&!editPart&&gk){const sug=[];(gk.k||[]).forEach((st,i)=>{if(sug.length<3&&st.n!=='gen'){const sm=similarStrokes(ch,st);if(sm.length)sug.push(`<span class="note">Strich ${i+1} ≈ ${chs([...new Set(sm.map(x=>x.ch))])}</span>${btn('psug-'+i,'Verknüpfen')}`)}});
      if(sug.length)parts.push(`<div class="blk"><span class="lbl">Gleiche Striche</span>${sug.join('')}</div>`);
      const ids=Object.keys(S.parts||{}).filter(id=>partUsers(id).length&&!(gk.u||[]).some(u=>u.id===id));
      if(ids.length)parts.push(`<div class="blk"><span class="lbl">Bauteil einsetzen</span><select class="sel" data-pins="1"><option value="">wählen…</option>${ids.map(id=>`<option value="${id}">${esc(S.parts[id].name)} (${chs(partUsers(id))})</option>`).join('')}</select></div>`)}
    if(!sel.size&&!selStroke&&!selPart&&!openC&&!nk&&gk&&gk.c&&gk.c.length){const np=gk.c.reduce((a,c)=>a+c.p.length,0);parts.push(`<div class="blk"><span class="lbl">${gk.c.length} ${gk.c.length===1?'Kontur':'Konturen'} · ${np} Punkte</span>${btn('simp','Vereinfachen')}</div>`)}
    if(openC)parts.push(`<div class="blk">${btn('close','Kontur schließen')}${btn('endopen','Fertig')}</div>`);
    if(clip&&ch&&ch!==' ')parts.push(`<div class="blk">${btn('paste','Einfügen')}</div>`);
    {const nm=ch&&nameOf(ch);
      if(nm&&nm.includes('.')&&!sel.size&&!openC&&!selStroke){const cx=(S.ctx||{})[nm]||{},b=nm.split('.')[0],rm=/\.r(\d)$/.exec(nm);
        parts.push(rm?`<div class="blk"><span class="lbl">Wechsel-Variante ${rm[1]}</span><span class="note">Kommt im Text automatisch abwechselnd mit ${esc(b)}, z. B. im zweiten ${esc(b)} von ${esc(b+b)}. Sichtbar im Probetext.</span></div>`
          :`<div class="blk"><span class="lbl">Nur vor</span><input class="ctxin" data-ctx="n" data-name="${esc(nm)}" value="${esc(cx.n||'')}" placeholder="z. B. aeo" size="8"><span class="lbl">Nur nach</span><input class="ctxin" data-ctx="p" data-name="${esc(nm)}" value="${esc(cx.p||'')}" placeholder="z. B. T" size="8"><span class="note">Leer = nur über Feature ${esc(nm.split('.').pop())}. Mit Buchstaben ersetzt ${esc(b)} sich automatisch, z. B. ${esc(b)} vor a.</span></div>`)}
      else if(ch&&!nm&&/\p{L}/u.test(ch)&&gm(ch)&&!sel.size&&!openC&&!selStroke&&!selPart&&!editPart)parts.push(`<div class="blk"><span class="lbl">Varianten</span>${btn('mkrot','+ Wechsel-Variante')}${btn('mkctx','+ Kontext-Variante')}${(()=>{const nx=[...S.text][active+1];return nx&&/\p{L}/u.test(nx)&&!nameOf(nx)&&gm(nx)?btn('mklig','+ Ligatur '+esc(ch+nx)):''})()}</div>`)}
    if(it&&it.m&&it.m.comp&&!sel.size&&!openC)parts.push(`<div class="blk"><span class="lbl">Verknüpft</span><span class="note">„${esc(disp(ch))}“ = ${it.m.comp.map(c=>esc(disp(c))).join(' + ')}. Änderst du die Teile, ändert sich das hier mit. Zeichnest du hier, gilt deine Version.</span>${btn('decomp','Zerlegen')}</div>`);
    else if(ch&&(COMPOSE[ch]||PARTS[ch]||ALIAS[ch])&&hasInk(S.glyphs[ch])&&!sel.size&&!openC)parts.push(`<div class="blk"><span class="lbl">Eigene Version</span>${btn('relink','Wieder aus '+(COMPOSE[ch]||(ALIAS[ch]?[ALIAS[ch]]:PARTS[ch].map(q=>q[0]))).filter((c,i,a)=>a.indexOf(c)===i).map(c=>esc(disp(c))).join(' + '))}</div>`);
    else if(it&&it.m&&!it.m.empty&&S.glyphs[ch]){const g=S.glyphs[ch];
      parts.push(`<div class="blk"><span class="lbl">Abstand ${esc(disp(ch))} links</span>${keySel(ch,'l')}${btn('l-','−')}<span class="num ${g.l?'man':''}">${it.m.lsb}</span>${btn('l+','+')}
        <span class="lbl">rechts</span>${keySel(ch,'r')}${btn('r-','−')}<span class="num ${g.r?'man':''}">${it.m.rsb}</span>${btn('r+','+')}<span class="lbl">Breite</span><span class="num">${it.m.adv}</span>${it.m.over?'<span class="note" style="color:#d33">Breiter als die Monospace-Breite</span>':''}${(g.l||g.r)?btn('sbauto','Auto'):''}</div>`)}
    else if((ch===' '||ch==='\u00a0')&&tool!=='kern')parts.push(`<div class="blk"><span class="lbl">${ch===' '?'Leerzeichen':'Geschütztes Leerzeichen'} · Breite</span>${S.mono?'<span class="num">'+S.mono+'</span><span class="note">Monospace: so breit wie alle Zeichen.</span>':`${btn('spw-50','−50')}${btn('spw-10','−')}<span class="num ${S.spaceW?'man':''}">${S.spaceW||autoSpaceW()}</span>${btn('spw10','+')}${btn('spw50','+50')}${S.spaceW?btn('spwauto','Auto'):''}<span class="note">Wortabstand in Einheiten (1000 pro Geviert). Gilt für Leerzeichen und geschütztes Leerzeichen, wird mit exportiert. Auto folgt dem Grundabstand.</span>`}</div>`);
    else if(ch&&ch!==' '&&!sel.size&&!openC)parts.push(`<span class="note">„${esc(disp(ch))}“ ist noch leer. Mit Schreiben, Bézier, Rechteck oder Ellipse direkt in der Zeile zeichnen.</span>`);
  }
  if(tool!=='kern'&&ch&&!blank(ch)&&!openC&&!editPart&&S.glyphs[ch]&&hasInk(S.glyphs[ch]))parts.push(`<div class="blk"><span class="lbl">${esc(disp(ch))}</span>${btn('gdel','Ganze Glyphe löschen')}</div>`);
  if(tool!=='kern'&&ch&&!blank(ch)&&!sel.size&&!openC){const t=[...S.text],pr=[];const a=t[active-1],b=t[active+1];
    const one=(x,y,s)=>{if(!x||!y||blank(x)||blank(y)||x==='\n'||y==='\n')return '';const k=kernKey(x,y),man=k in S.kern,inf=kernInfo(x,y),v=inf.v;
      return `<b>${esc(disp(x))}${esc(disp(y))}</b>${btn('kp'+s+'-10','−')}<span class="num ${man?'man':inf.src==='g'?'grp':''}">${v}</span>${btn('kp'+s+'+10','+')}${man?btn('kp'+s+'a','Auto'):''}`};
    const h=one(a,ch,'l')+one(ch,b,'r');if(h)parts.push(`<div class="blk"><span class="lbl">Paar-Kerning</span>${h}${btn('kgo','Abstand & Gruppen …')}</div>`)}
  if(tool!=='kern'){const pi=paraOf(caret),st=pStyle(pi),F=fmt();
    parts.push(`<div class="blk"><span class="lbl">Absatz ${pi+1}</span>${btn('pk-','A−')}<span class="num">${Math.round(st.k*100)}%</span>${btn('pk+','A+')}
      ${btn('pal-l','Links','aria-pressed="'+(st.al==='l')+'"')}${btn('pal-c','Mitte','aria-pressed="'+(st.al==='c')+'"')}${btn('pal-r','Rechts','aria-pressed="'+(st.al==='r')+'"')}
      <span class="lbl">Laufweite</span>${btn('ptr-','−')}<span class="num">${st.tr}</span>${btn('ptr+','+')}</div>
      <div class="blk"><span class="lbl">Zeilenabstand</span>${btn('flh-','−')}<span class="num">${F.lh.toFixed(2)}</span>${btn('flh+','+')}<span class="lbl">Satzbreite</span>${btn('fw-','−')}<span class="num">${F.w}</span>${btn('fw+','+')}</div>`)}
  renderTabs(parts);
  const hint=document.getElementById('hint');
  if(Date.now()<toastUntil){hint.textContent=toastTxt;return}
  hint.textContent=tool==='kern'?(kLevel==='s'?'Ebene 1 Abstand: seitlich ziehen ändert den linken Abstand des Buchstabens, überall.':kLevel==='g'?'Ebene 2 Gruppe: seitlich ziehen gilt für alle Paare aus diesen zwei Gruppen.':'Ebene 3 Paar: seitlich ziehen gilt nur für genau dieses Paar.'):tool==='select'?'Auswahl: Punkte, Griffe, Konturen und Striche antippen und ziehen. Nichts wird gezeichnet.':tool==='pen'?'Tippen setzt Ecken, ziehen setzt Kurvenpunkte. Ersten Punkt antippen schließt die Kontur. Auf eine Linie tippen fügt einen Punkt ein. Griffe (kleine Kreise) ziehen formt die Rundung, „Kurve“ gibt einer Ecke Griffe.':
    document.activeElement===ed?'Tippen schreibt an der Cursor-Stelle, Return beginnt einen neuen Absatz. Der Stift zeichnet weiter.':(hintSeen?'':'Stift zeichnet. Finger: antippen wählt, doppelt tippen öffnet die Tastatur. Ziehen verschiebt, zwei Finger zoomen.');
}
let clip=null;
for(const evn of ['pointerdown','mousedown'])insp.addEventListener(evn,e=>{if(document.activeElement===ed&&e.target.closest('button'))e.preventDefault()});
insp.addEventListener('change',e=>{const t=e.target;if(t.dataset&&t.dataset.ctx){pushUndoMeta();S.ctx=S.ctx||{};const o=S.ctx[t.dataset.name]||(S.ctx[t.dataset.name]={});o[t.dataset.ctx]=t.value.replace(/\s+/g,'');return changed(null)}if(t.dataset&&t.dataset.pins&&t.value){pushUndo();const G=curGlyph(true);(G.u||(G.u=[])).push({id:t.value,dx:0,dy:0});selPart=G.u[G.u.length-1];return changed(curCh())}if(t.dataset&&t.dataset.key){const c=t.dataset.ch;pushUndoFor(c);const G=sbGlyph(c);G[t.dataset.key+'k']=t.value;G.l=t.dataset.key==='l'&&t.value?0:G.l;G.r=t.dataset.key==='r'&&t.value?0:G.r;return changed(c)}
  if(!t.dataset||!t.dataset.grp)return;const side=t.dataset.grp,ch=t.dataset.ch,v=t.value;
  pushUndoMeta();S.groups=S.groups||{};const o={...(S.groups[ch]||{})};if(v==='@auto')delete o[side];else o[side]=v==='@own'?ch:v;
  if(o.l||o.r)S.groups[ch]=o;else delete S.groups[ch];changed(null)});
insp.addEventListener('input',e=>{
  if(e.target.id==='nibA'){nib.a=+e.target.value;e.target.nextElementSibling.textContent=nib.a+'°';saveNib()}});
insp.addEventListener('click',e=>{const b=e.target.closest('button[data-act]');if(!b)return;const a=b.dataset.act;const ch=curCh();const g=curGlyph(false);
  if(a==='simp'&&g&&(g.c.length||(g.k||[]).length)){pushUndo();const lv=(g._sl||0)+1;const err=[2.5,4,6,9][Math.min(lv,4)-1];
    const n0=g.c.filter(c=>!c._pt).length+(g.k||[]).filter(st=>!st._pt).length,p0=g.c.filter(c=>!c._pt).reduce((x,c)=>x+c.p.length,0);
    const out=simplifyGlyph(g,err);if(!out){undoS.pop();updButtons();return}g.c=[...g.c.filter(c=>c._pt),...out];g.k=(g.k||[]).filter(st=>st._pt);g._sl=lv;sel.clear();selK.clear();selStroke=null;
    const p1=out.reduce((x,c)=>x+c.p.length,0);toast(`${n0} Formen mit ${p0} Punkten → ${out.length} Formen mit ${p1} Punkten. Nochmal tippen vereinfacht stärker, Rückgängig holt alles zurück.`);return changed(ch)}
  if((a==='red'||a==='redall')&&g&&g.c.length){pushUndo();const lv=(g._rl||0)+1;g._rl=lv;const err=Math.min(2+lv*2,10);
    const tgt=a==='red'?g.c.filter(c=>c.p.some(q=>sel.has(q))):g.c.slice();const n0=tgt.reduce((x,c)=>x+c.p.length,0);
    const nc=tgt.map(c=>c.z===false?c:reduceC(c,err));g.c=g.c.map(c=>{const i=tgt.indexOf(c);return i<0?c:nc[i]});const n1=nc.reduce((x,c)=>x+c.p.length,0);
    if(a==='red')sel=new Set(nc.flatMap(c=>c.p));toast(n1<n0?`Von ${n0} auf ${n1} Punkte. Nochmal tippen reduziert stärker.`:'Weniger Punkte geht nicht, ohne die Form zu verändern.');return changed(ch)}
  if(a==='sm-r'||a==='sm-l'){selMode=a.slice(3);try{localStorage.setItem('glyphwerk.selmode',selMode)}catch(e){}renderInsp();return}
  if((a==='kselbez'||a==='kseldel')&&g&&selK.size){pushUndo();const L=[...selK].filter(st=>(g.k||[]).includes(st));selK.clear();if(a==='kseldel')g.k=g.k.filter(st=>!L.includes(st));else bezStrokes(ch,L);return changed(ch)}
  if(a==='mklig'){const t=[...S.text],nx=t[active+1];const A=gm(ch),B=gm(nx);if(!A||!B)return;const n=`${ch}_${nx}.liga`,c=newName(n);
    if(!S.glyphs[c]||!hasInk(S.glyphs[c])){const k=kernOf(ch,nx),off=A.adv+k-A.dx+B.dx;S.glyphs[c]={c:[...A.cs.map(q=>shiftC(q,0,0)),...B.cs.map(q=>shiftC(q,off,0))],k:[],l:0,r:0,v:1}}
    t.splice(active,2,c);S.text=t.join('');txt.value=textToShow(S.text);dirty.add('g:'+c);changed(null);activate(active);
    toast(`Ligatur ${ch}${nx} angelegt, aus beiden Buchstaben zusammengesetzt. Zeichne die Verbindung, im Text ersetzt sie ${ch}${nx} automatisch.`);return}
  if(a==='mkrot'||a==='mkctx'){let k=1;const pre=a==='mkrot'?'.r':'.ctx';while(chOfName(ch+pre+k)&&S.glyphs[chOfName(ch+pre+k)])k++;const n=ch+pre+k,c=newName(n),src=S.glyphs[ch],it=curItem();
    const J=x=>JSON.parse(JSON.stringify(x||[]));S.glyphs[c]=src&&hasInk(src)?{c:J(src.c),k:J(src.k),u:J(src.u),l:src.l||0,r:src.r||0,v:1}:{c:J(it&&it.m?it.m.cs:[]),k:[],l:0,r:0,v:1};
    const t=[...S.text];t.splice(active+1,0,c);S.text=t.join('');txt.value=textToShow(S.text);dirty.add('g:'+c);changed(null);activate(active+1);
    toast(a==='mkrot'?`${n} angelegt, als Kopie. Verändere sie leicht, dann wechseln sich die Formen im Text ab.`:`${n} angelegt. Trag ein, vor oder nach welchen Buchstaben sie kommt.`);return}
  if(a==='sbez'&&selStroke&&g){pushUndo();const st=selStroke;selStroke=null;if(!bezStrokes(ch,[st]))toast('Zu klein für Kurven.');else toast('Strich ist jetzt eine Kontur mit Punkten und Griffen.');return changed(ch)}
  if(a==='kbez'&&g&&g.k&&g.k.length){pushUndo();const n=bezStrokes(ch,g.k.slice());toast(n+' Konturen. Tippe auf eine Kontur, um Punkte und Griffe zu bearbeiten.');return changed(ch)}
  if(a==='sdel'&&selStroke&&g){pushUndo();g.k=g.k.filter(x=>x!==selStroke);selStroke=null;return changed(ch)}
  if(a==='sdup'&&selStroke&&g){pushUndo();const c2={n:selStroke.n,s:selStroke.s,...(selStroke.o?{o:selStroke.o}:{}),...(selStroke._pt?{_pt:selStroke._pt}:{}),p:selStroke.p.map((v,i)=>i%4===0?v+40:i%4===1?v-40:v)};g.k.push(c2);selStroke=c2;return changed(ch)}
  if(a==='tilt'){nib.tilt=!nib.tilt;saveNib();syncNib();return renderInsp()}
  if(/^(pk|pal|ptr|flh|fw)/.test(a)){const pi=paraOf(caret);S.ps=S.ps||[];const st={...pStyle(pi)};const F=fmt();
    if(a==='pk+')st.k=Math.min(4,Math.round((st.k*1.25)*100)/100);if(a==='pk-')st.k=Math.max(.1,Math.round((st.k/1.25)*100)/100);
    if(a.startsWith('pal-'))st.al=a.slice(4);if(a==='ptr+')st.tr+=10;if(a==='ptr-')st.tr-=10;
    if(a==='flh+')F.lh=Math.min(3,Math.round((F.lh+.05)*100)/100);if(a==='flh-')F.lh=Math.max(.7,Math.round((F.lh-.05)*100)/100);
    if(a==='fw+')F.w=Math.min(60000,Math.round(F.w*1.2/100)*100);if(a==='fw-')F.w=Math.max(1500,Math.round(F.w/1.2/100)*100);
    for(let q=S.ps.length;q<pi;q++)S.ps[q]=S.ps[q]||{};S.ps[pi]=st;S.fmt=F;MC.clear();changed(null);if(document.activeElement===ed)ed.focus();return}
  if(a==='pmk'&&selStroke){makePart(ch,selStroke,null,false);return}
  if(a==='pmks'&&selStroke){const n=makePart(ch,selStroke,null,true);toast(`Bauteil in ${n+1} Buchstaben verknüpft.`);return}
  if(a==='pmkc'&&sel.size&&g){const cs=g.c.filter(c=>c.p.some(q=>sel.has(q)));makePart(ch,null,cs,false);return}
  if(a.startsWith('psug-')&&g){const st=g.k[+a.slice(5)];if(st){const n=makePart(ch,st,null,true);toast(`Bauteil in ${n+1} Buchstaben verknüpft.`)}return}
  if(a.startsWith('pmv-')&&selPart){pushUndo();const d=a.slice(4),st=grid?10:5;if(d==='l')selPart.dx=(selPart.dx||0)-st;if(d==='r')selPart.dx=(selPart.dx||0)+st;if(d==='u')selPart.dy=(selPart.dy||0)+st;if(d==='d')selPart.dy=(selPart.dy||0)-st;return changed(ch)}
  if(a==='ped'&&selPart){partEditStart(ch,selPart);return}
  if(a==='pend'){partEditEnd();return}
  if(a==='pdet'&&selPart){partDetach(ch,selPart);return}
  if(a==='pdel'&&selPart&&g){pushUndo();g.u=g.u.filter(x=>x!==selPart);selPart=null;return changed(ch)}
  if(a==='plink'&&selPart){const n=linkMore(ch,selPart);toast(`${n} weitere Buchstaben verknüpft.`);return}
  if(a==='gdel'&&ch&&S.glyphs[ch]){pushUndo();delete S.glyphs[ch];dirty.add('g:'+ch);sel.clear();selK.clear();selStroke=null;selPart=null;MC.clear();changed(ch);toast('Glyphe gelöscht. Rückgängig mit ↶.');return}
  if(a==='klast'&&g&&g.k&&g.k.length){pushUndo();g.k.pop();return changed(ch)}
  if(a==='kall'&&g&&g.k){pushUndo();g.k=[];return changed(ch)}
  const nud=(dx,dy)=>{pushUndo();const st=grid?10:1;for(const q of sel){q.x+=dx*st;q.y+=dy*st;for(const h of [q.i,q.o])if(h){h[0]+=dx*st;h[1]+=dy*st}}changed(ch)};
  if(/^(kp|gsp|gks|kgdel)/.test(a)||(a[0]==='k'&&pickedPair&&/^k(-?\d+|auto)$/.test(a)))pushUndoMeta();
  if(a.startsWith('kp')){const t=[...S.text],x=a[2]==='l'?t[active-1]:ch,y=a[2]==='l'?ch:t[active+1];if(!x||!y)return;const k=kernKey(x,y);
    if(a.endsWith('a'))delete S.kern[k];else S.kern[k]=kernOf(x,y)+parseInt(a.slice(3));changed(null);if(document.activeElement===ed)ed.focus();return}
  if(a==='decomp'){const it=curItem();if(!it||!it.m||!it.m.comp)return;pushUndo();const G=curGlyph(true);G.c=it.m.cs.map(c=>shiftC(c,0,0));G.k=[];G.v=(G.v||0)+1;return changed(ch)}
  if(a==='relink'&&g){pushUndo();g.c=[];g.k=[];g.v=(g.v||0)+1;sel.clear();selStroke=null;return changed(ch)}
  if(a==='kgo'){setTool('kern');const t=[...S.text],pa=t[active-1];if(pa&&!blank(pa)&&!blank(ch)&&gm(pa)&&gm(ch)){pickedPair={a:pa,b:ch,i:active};renderInsp()}return}
  if(a.startsWith('kl-')){kLevel=a.slice(3);try{localStorage.setItem('glyphwerk.klevel',kLevel)}catch(e){}renderInsp();draw();return}
  if(a==='gsp+'||a==='gsp-'){S.spacing=Math.max(10,Math.min(160,S.spacing+(a==='gsp+'?5:-5)));MC.clear();syncUI();return changed(null)}
  if(a==='gks+'||a==='gks-'){S.strength=Math.max(0,Math.min(150,S.strength+(a==='gks+'?10:-10)));MC.clear();syncUI();return changed(null)}
  if(/^sb[lr][+-]/.test(a)&&pickedPair){const c=sbTarget(pickedPair.b),G=sbGlyph(c);pushUndo();G[a[2]]=(G[a[2]]||0)+parseInt(a.slice(3));return changed(c)}
  if(a==='sbaut'&&pickedPair){const c=sbTarget(pickedPair.b),G=sbGlyph(c);pushUndo();G.l=0;G.r=0;return changed(c)}
  if(a==='kgdel'&&pickedPair){delete S.gkern[gkKey(pickedPair.a,pickedPair.b)];return changed(null)}
  if(a[0]==='k'&&pickedPair&&/^k(-?\d+|auto)$/.test(a)){const pa=pickedPair.a,pb=pickedPair.b,d=a==='kauto'?0:parseInt(a.slice(1));
    if(kLevel==='g'){const k=gkKey(pa,pb);S.gkern=S.gkern||{};S.gkern[k]=(S.gkern[k]!=null?S.gkern[k]:kernInfo(pa,pb).src==='p'?autoKern(pa,pb):kernOf(pa,pb))+d}
    else{const k=kernKey(pa,pb);if(a==='kauto')delete S.kern[k];else S.kern[k]=kernOf(pa,pb)+d}changed(null);return}
  if(/^spw/.test(a)){pushUndoMeta();S.spaceW=a==='spwauto'?0:Math.max(0,(S.spaceW||autoSpaceW())+parseInt(a.slice(3)));changed(null);return}
  switch(a){
    case 'nl':return nud(-1,0);case 'nr':return nud(1,0);case 'nu':return nud(0,1);case 'nd':return nud(0,-1);
    case 'smooth':{pushUndo();const q=[...sel][0];q.s=!q.s;if(q.s&&!q.i&&!q.o){const c=g.c.find(c=>c.p.includes(q)),i=c.p.indexOf(q),n=c.p.length,pv=c.p[(i-1+n)%n],nx=c.p[(i+1)%n];
        const dx=(nx.x-pv.x)/6,dy=(nx.y-pv.y)/6;q.i=[q.x-dx,q.y-dy];q.o=[q.x+dx,q.y+dy]}return changed(ch)}
    case 'straight':{pushUndo();for(const q of sel){q.i=null;q.o=null;q.s=false}return changed(ch)}
    case 'del':{pushUndo();for(const q of sel){const c=g.c.find(c=>c.p.includes(q));if(c){c.p.splice(c.p.indexOf(q),1);if(c.p.length<2){g.c.splice(g.c.indexOf(c),1);if(c===openC)openC=null}}}sel.clear();return changed(ch)}
    case 'delc':{pushUndo();g.c=g.c.filter(c=>!c.p.some(q=>sel.has(q)));sel.clear();openC=null;return changed(ch)}
    case 'copy':{const cs=g.c.filter(c=>c.p.some(q=>sel.has(q)));clip=JSON.stringify(cs);return renderInsp()}
    case 'paste':{pushUndo();const G=curGlyph(true);const cs=JSON.parse(clip);G.c.push(...cs);sel=new Set(cs.flatMap(c=>c.p));return changed(ch)}
    case 'close':{pushUndo();openC.z=true;openC=null;return changed(ch)}
    case 'endopen':{openC.z=true;openC=null;return changed(ch)}
    case 'l-':case 'l+':case 'r-':case 'r+':{pushUndo();const st=a[1]==='+'?5:-5;if(a[0]==='l')g.l=(g.l||0)+st;else g.r=(g.r||0)+st;return changed(ch)}
    case 'sbauto':{pushUndo();g.l=0;g.r=0;return changed(ch)}
  }});

