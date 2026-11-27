/* ---------- sheets ---------- */
function openSheet(id){document.getElementById(id).hidden=false}
/* dialogs: role, label, focus in/out, Escape, focus trap */
let sheetFocus=[];
for(const sh of document.querySelectorAll('.sheet')){const d=sh.firstElementChild,h=d.querySelector('h2');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.tabIndex=-1;
  if(h){h.id=sh.id+'T';d.setAttribute('aria-labelledby',h.id)}
  new MutationObserver(()=>{if(!sh.hidden){sheetFocus.push(document.activeElement);setTimeout(()=>(d.querySelector('[data-close]')||d).focus({preventScroll:true}),0)}else{const f=sheetFocus.pop();if(f&&f.focus)try{f.focus({preventScroll:true})}catch(e){}}}).observe(sh,{attributes:true,attributeFilter:['hidden']})}
document.addEventListener('keydown',e=>{const sh=[...document.querySelectorAll('.sheet')].find(x=>!x.hidden);if(!sh)return;
  if(e.key==='Escape'){e.preventDefault();e.stopPropagation();sh.hidden=true;return}
  if(e.key==='Tab'){const d=sh.firstElementChild,f=[...d.querySelectorAll('button,input,select,textarea,a[href]')].filter(x=>!x.disabled&&x.offsetParent);if(!f.length)return;const a=f[0],b=f[f.length-1];
    if(e.shiftKey&&(document.activeElement===a||!d.contains(document.activeElement))){e.preventDefault();b.focus()}else if(!e.shiftKey&&document.activeElement===b){e.preventDefault();a.focus()}}},true);
for(const s of document.querySelectorAll('.sheet'))s.addEventListener('click',e=>{if(e.target===s||e.target.closest('[data-close]'))s.hidden=true});
document.getElementById('bSet').onclick=()=>{renderGrid();openSheet('sheetSet')};
function renderGrid(){const gEl=document.getElementById('grid');gEl.textContent='';readColors();renderSetChips();
  const secs=[['Latein',CHARSET]];for(const k of S.sets||[])if(SETS[k])secs.push([SETS[k].n,SETS[k].c]);
  for(const cs of S.csets||[])if(cs.on!==false)secs.push([cs.n,cleanChars(cs.c)]);
  const seen=new Set();const nm=namedChars(),rest=allChars().filter(c=>!CHARSET.includes(c)&&!setChars().includes(c)&&!nm.includes(c));
  secs.unshift(['Leerzeichen',[' ','\u00a0']]);if(nm.length)secs.push(['Varianten',nm]);if(rest.length)secs.push(['Weitere gezeichnete',rest]);
  const io=window.IntersectionObserver?new IntersectionObserver(es=>{for(const e of es)if(e.isIntersecting){io.unobserve(e.target);paintCell(e.target)}},{root:null,rootMargin:'300px'}):null;
  for(const [title,list] of secs){const cl=list.filter(c=>!seen.has(c));cl.forEach(c=>seen.add(c));if(!cl.length)continue;
    const h=document.createElement('h3');h.className='gsec';const done=cl.filter(c=>{const m=gm(c);return m&&(!m.empty||c===' '||c==='\u00a0')}).length;h.textContent=`${title} · ${done}/${cl.length}`;gEl.append(h);
    for(const ch of cl){const b=document.createElement('button');b.className='cell';b.dataset.ch=ch;
      const c=document.createElement('canvas');c.width=112;c.height=112;const sp=document.createElement('span');sp.textContent=disp(ch);b.append(c,sp);
      b.onclick=()=>{const t=[...S.text];let i=t.indexOf(ch);if(i<0){t.splice(active+1,0,ch);S.text=t.join('');i=active+1;txt.value=textToShow(S.text);changed(null)}
        document.getElementById('sheetSet').hidden=true;activate(i);focusActive()};
      gEl.append(b);if(io)io.observe(b);else paintCell(b)}}}
function paintCell(b){const ch=b.dataset.ch,c=b.querySelector('canvas'),x=c.getContext('2d'),m=gm(ch);
  if(ch===' '||ch==='\u00a0'){const sc=112/1200,w=m.adv*sc;x.strokeStyle=C.accent;x.lineWidth=2;x.beginPath();x.moveTo(56-w/2,70);x.lineTo(56-w/2,82);x.lineTo(56+w/2,82);x.lineTo(56+w/2,70);x.stroke();b.querySelector('span').textContent=`${ch===' '?'space':'nbsp'} · ${m.adv}`;return}
  if(!m||m.empty)b.classList.add('empty');
  const sc=112/1200;x.fillStyle=C.ghost;x.font=`400 ${tplSize()*sc}px ${tplCss()}`;x.textAlign='center';x.textBaseline='alphabetic';x.fillText(baseText(ch),56,112-250*sc);
  if(m&&!m.empty){x.setTransform(sc,0,0,-sc,(112-(m.b.x1-m.b.x0)*sc)/2-m.b.x0*sc,112-250*sc);x.fillStyle=C.ink;x.fill(pathOf(m.cs))}
  if(m&&!m.empty)b.querySelector('span').textContent=`${disp(ch)} · ${m.adv}`;if(m&&m.over)b.style.borderColor='#d33'}
function renderSetChips(){const box=document.getElementById('setChips');box.textContent='';
  const chip=(label,on,fn,del)=>{const w=document.createElement('span');w.className='chip';const b=document.createElement('button');b.className='solid';b.textContent=label;b.setAttribute('aria-pressed',on);b.onclick=fn;w.append(b);
    if(del){const d=document.createElement('button');d.className='solid';d.textContent='×';d.setAttribute('aria-label','Satz löschen');d.onclick=e=>confirm2(e.currentTarget,del);w.append(d)}box.append(w)};
  chip('Latein',true,()=>{});
  for(const k of Object.keys(SETS)){const on=(S.sets||[]).includes(k);chip(SETS[k].n+' · '+SETS[k].c.filter(c=>!CHARSET.includes(c)).length,on,()=>{S.sets=on?S.sets.filter(x=>x!==k):[...(S.sets||[]),k];changed(null);renderGrid()})}
  (S.csets||[]).forEach((cs,i)=>chip(cs.n+' · '+cleanChars(cs.c).length,cs.on!==false,()=>{cs.on=cs.on===false;changed(null);renderGrid()},()=>{S.csets.splice(i,1);changed(null);renderGrid()}))}
document.getElementById('csAdd').onclick=()=>{const n=document.getElementById('csName').value.trim()||'Eigene',t=document.getElementById('csChars').value,cl=cleanChars(t),m=document.getElementById('csMsg');
  if(!cl.length){m.textContent='Keine Zeichen erkannt. Tippe Zeichen ein oder Codes wie U+0416.';return}
  S.csets=S.csets||[];const ex=S.csets.find(x=>x.n===n);if(ex){ex.c=cleanChars(ex.c+cl.join('')).join('');ex.on=true}else S.csets.push({n,c:cl.join(''),on:true});
  document.getElementById('csChars').value='';m.textContent=`${cl.length} Zeichen in „${n}“.`;changed(null);renderGrid()};
const fName=document.getElementById('fName'),fSp=document.getElementById('fSp'),fKs=document.getElementById('fKs');
const MXI={xh:'mXH',cap:'mCAP',asc:'mASC',desc:'mDESC'};
function syncMx(){applyMx();for(const [k,id] of Object.entries(MXI)){const v={xh:XH,cap:CAP,asc:ASC,desc:DESC}[k];document.getElementById(id).value=v;document.getElementById(id+'v').textContent=v}}
for(const [k,id] of Object.entries(MXI))document.getElementById(id).addEventListener('input',e=>{const v=+e.target.value;if(S.mx&&S.mx[k]===undefined&&v===MX0[k])return;pushUndoMetaOnce();S.mx=S.mx||{};S.mx[k]=v;syncMx();MC.clear();changed(null)});
document.getElementById('mReset').onclick=()=>{pushUndoMeta();S.mx={};syncMx();MC.clear();changed(null)};
let mxUndoT=0;function pushUndoMetaOnce(){if(Date.now()-mxUndoT>1500)pushUndoMeta();mxUndoT=Date.now()}
function syncUI(){syncMx();txt.value=textToShow(S.text);fName.value=S.name;fSp.value=S.spacing;fKs.value=S.strength;const mo=document.getElementById('fMono'),mw=document.getElementById('fMw');mo.checked=!!S.mono;mw.value=S.mono||S.monoW||600;mw.disabled=!S.mono;document.getElementById('fMwV').textContent=mw.value;
  document.getElementById('fSpV').textContent=S.spacing;document.getElementById('fKsV').textContent=S.strength+' %';document.getElementById('fontNameLbl').textContent=S.name}
let testFmt='ttf',testN=0;const testOn={};const DEF_ON=['liga','calt','clig','ccmp','locl','rlig'];
function applyTestFeat(){const ta=document.getElementById('tArea');ta.style.fontFeatureSettings=Object.entries(testOn).map(([t,v])=>`"${t}" ${v?1:0}`).join(', ')||'normal'}
function renderTestFeat(tags){const box=document.getElementById('tFeat');box.textContent='';
  for(const t of tags){if(!(t in testOn))testOn[t]=DEF_ON.includes(t);const l=document.createElement('label'),c=document.createElement('input');c.type='checkbox';c.checked=testOn[t];
    c.onchange=()=>{testOn[t]=c.checked;applyTestFeat()};l.append(c,document.createTextNode(t));box.append(l)}applyTestFeat()}
async function runTest(){const m=t=>document.getElementById('tMsg').textContent=t;
  try{const r=testFmt==='ttf'?buildTTF():buildOTF();if(!r.glyphs){m('Noch keine Buchstaben gezeichnet.');return}
    const fam='GWTest'+(++testN);const f=new FontFace(fam,r.buf.buffer.slice(0));await f.load();document.fonts.add(f);
    const ta=document.getElementById('tArea');ta.style.fontFamily=`"${fam}",system-ui`;ta.style.fontSize=document.getElementById('tSize').value+'px';
    renderTestFeat(r.fea.tags);
    m(`${testFmt.toUpperCase()} geladen: ${r.glyphs} Zeichen, ${r.pairs} Kerning-Paare${r.fea.tags.length?', Features: '+r.fea.tags.join(', '):''}. Nicht gezeichnete Zeichen erscheinen in der Systemschrift.`)}
  catch(e){m('Die Schrift ließ sich nicht laden: '+(e&&e.message||e))}}
document.getElementById('bTest').onclick=()=>{const ta=document.getElementById('tArea');if(!ta.value)ta.value=S.text;openSheet('sheetTest');runTest()};
for(const [id,f] of [['tTTF','ttf'],['tOTF','otf']])document.getElementById(id).onclick=()=>{testFmt=f;document.getElementById('tTTF').setAttribute('aria-pressed',f==='ttf');document.getElementById('tOTF').setAttribute('aria-pressed',f==='otf');runTest()};
{const ta=document.getElementById('tArea');
  document.getElementById('tTrack').oninput=e=>{ta.style.letterSpacing=(+e.target.value/100)+'em'};
  document.getElementById('tLead').oninput=e=>{ta.style.lineHeight=(+e.target.value/100)};
  document.getElementById('tInk').oninput=e=>{ta.style.color=e.target.value};
  document.getElementById('tPaper').oninput=e=>{ta.style.background=e.target.value}}
document.getElementById('tSize').oninput=e=>{document.getElementById('tArea').style.fontSize=e.target.value+'px'};
document.getElementById('bExp').onclick=()=>{syncUI();document.getElementById('expMsg').textContent='';openSheet('sheetExp')};
