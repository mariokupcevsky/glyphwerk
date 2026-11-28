fName.oninput=()=>{S.name=fName.value;document.getElementById('fontNameLbl').textContent=S.name;changed(null)};
fSp.oninput=()=>{S.spacing=+fSp.value;MC.clear();syncUI();changed(null)};
fKs.oninput=()=>{S.strength=+fKs.value;syncUI();changed(null)};
document.getElementById('fMono').onchange=e=>{pushUndoMeta();S.mono=e.target.checked?(+document.getElementById('fMw').value||600):0;MC.clear();syncUI();changed(null)};
document.getElementById('fMw').oninput=e=>{document.getElementById('fMwV').textContent=e.target.value;if(!S.mono)return;S.mono=+e.target.value;MC.clear();changed(null)};
const msg=t=>document.getElementById('expMsg').textContent=t;
async function saveFile(filename,data){
  const dl=window.claude&&window.claude.use?await claude.use('downloads'):null;
  if(!dl){try{const u=URL.createObjectURL(data instanceof Blob?data:new Blob([data])),l=document.createElement('a');l.href=u;l.download=filename;document.body.append(l);l.click();l.remove();setTimeout(()=>URL.revokeObjectURL(u),60000);return true}
    catch(e){msg('Speichern ging nicht ('+(e&&e.message||'Fehler')+').');return false}}
  try{await dl.save({filename,data});return true}
  catch(e){msg(e&&e.code==='declined'?'Speichern abgebrochen.':'Speichern ging nicht ('+(e&&e.code||'Fehler')+').');return false}}
document.getElementById('bTTF').onclick=async()=>{
  try{const r=buildTTF();if(!r.glyphs){msg('Noch keine Buchstaben gezeichnet.');return}
    const fn=psName((S.name||'Glyphwerk').trim())+'.ttf';
    if(await saveFile(fn,new Blob([r.buf],{type:'font/ttf'})))msg(`${fn} gespeichert: ${r.glyphs} Zeichen, ${r.pairs} Kerning-Paare.`)}
  catch(e){msg('Export fehlgeschlagen: '+e.message)}};
document.getElementById('bOTF').onclick=async()=>{
  try{const r=buildOTF();if(!r.glyphs){msg('Noch keine Buchstaben gezeichnet.');return}
    const base=psName((S.name||'Glyphwerk').trim());
    if(!(window.claude&&window.claude.use)){if(await saveFile(base+'.otf',new Blob([r.buf],{type:'font/otf'})))msg(`${base}.otf gespeichert: ${r.glyphs} Zeichen, ${r.pairs} Kerning-Paare.`);return}
    const z=zipStore([{name:base+'.otf',data:r.buf}]);
    if(await saveFile(base+'-otf.zip',new Blob([z],{type:'application/zip'})))msg(`${base}-otf.zip gespeichert: ${r.glyphs} Zeichen, ${r.pairs} Kerning-Paare. In Dateien antippen zum Entpacken.`)}
  catch(e){msg('Export fehlgeschlagen: '+e.message)}};
document.getElementById('bBackup').onclick=async()=>{if(await saveFile(psName(S.name)+'.glyphwerk.json',JSON.stringify(serial())))msg('Projekt gesichert.')};
const fileIn=document.getElementById('fileIn');
document.getElementById('bLoad').onclick=()=>fileIn.click();
let prevProj=null;
function stashPrev(){try{prevProj=JSON.stringify(serial())}catch(e){prevProj=null}try{if(prevProj)localStorage.setItem('glyphwerk.prev',prevProj)}catch(e){}document.getElementById('fRestore').hidden=!prevProj}
try{prevProj=localStorage.getItem('glyphwerk.prev')}catch(e){}
function applyProject(o,m){stashPrev();S=fromSerial(o);S.t=Date.now();MC.clear();active=0;caret=0;sel.clear();selStroke=null;openC=null;undoS.length=0;redoS.length=0;syncUI();
  dirty.add('meta');for(const ch of new Set([...allChars(),...Object.keys(S.glyphs)]))dirty.add('g:'+ch);
  relayout();fit();renderInsp();schedule();changed(null);msg(m);document.getElementById('fileMsg').textContent=tr(m)}
fileIn.onchange=async()=>{const f=fileIn.files[0];if(!f)return;try{const o=JSON.parse(await f.text());if(!o.glyphs)throw new Error('keine Glyphwerk-Datei');applyProject(o,'Projekt geladen.')}catch(e){msg('Laden fehlgeschlagen: '+e.message)}fileIn.value=''};
document.getElementById('bFile').onclick=()=>{document.getElementById('fileMsg').textContent='';document.getElementById('fRestore').hidden=!prevProj;openSheet('sheetFile')};
document.getElementById('fNew').onclick=e=>confirm2(e.currentTarget,()=>applyProject(JSON.parse(JSON.stringify(freshProject())),'Neue leere Schrift. Die vorherige lässt sich unter „Datei“ wiederherstellen.'));
document.getElementById('fOpen').onclick=()=>fileIn.click();
document.getElementById('fSave').onclick=()=>document.getElementById('bBackup').click();
document.getElementById('fExp').onclick=()=>{document.getElementById('sheetFile').hidden=true;document.getElementById('bExp').click()};
document.getElementById('fDup').onclick=async()=>{const base=psName(S.name);if(await saveFile(base+'.glyphwerk.json',JSON.stringify(serial()))){S.name=(S.name||'Meine Schrift')+' Kopie';syncUI();changed(null);const m='Original gesichert, du arbeitest jetzt an „'+S.name+'“.';msg(m);document.getElementById('fileMsg').textContent=m}};
document.getElementById('fRestore').onclick=()=>{if(!prevProj)return;const o=JSON.parse(prevProj);applyProject(o,'Vorheriges Projekt wiederhergestellt.')};
function confirm2(b,fn){if(b.dataset.armed){delete b.dataset.armed;b.textContent=b.dataset.t;fn();return}b.dataset.t=b.textContent;b.dataset.armed=1;b.textContent='Wirklich? Nochmal tippen';setTimeout(()=>{if(b.dataset.armed){delete b.dataset.armed;b.textContent=b.dataset.t}},3000)}
document.getElementById('bKernReset').onclick=e=>confirm2(e.currentTarget,()=>{pushUndoMeta();S.kern={};S.gkern={};changed(null);msg('Eigenes Kerning gelöscht (Paare und Gruppen). Rückgängig mit ↶.')});
document.getElementById('bExLoad').onclick=()=>{let n=0;for(const [k,v] of Object.entries(examples())){if(S.glyphs[k]&&hasInk(S.glyphs[k]))continue;pushUndoFor(k);S.glyphs[k]={c:v.c,l:0,r:0,v:1};dirty.add('g:'+k);n++}MC.clear();changed(null);msg(n?'Beispielformen geladen (H T A V O n o ¨ ´).':'Die Beispielformen sind schon da.')};
document.getElementById('bExamples').onclick=e=>confirm2(e.currentTarget,()=>{for(const k of Object.keys(examples())){pushUndoFor(k);delete S.glyphs[k];dirty.add('g:'+k)}S.example=false;MC.clear();changed(null);msg('Beispielformen entfernt.')});
function pushUndoFor(ch){undoS.push(snap(ch));updButtons()}


