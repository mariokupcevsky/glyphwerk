/* ---------- boot ---------- */
S=loadLocal()||freshProject();if(S.example){S.glyphs={};S.example=false}caret=[...S.text].length;
syncUI();syncEd();updButtons();
new ResizeObserver(()=>{const first=!CW;resize();if(first)fit()}).observe(cv);
matchMedia('(prefers-color-scheme: dark)').addEventListener('change',draw);
new MutationObserver(draw).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
setTool('brush');
document.getElementById('bLang').onclick=()=>setLang(LANG==='en'?'de':'en');i18nStart();document.getElementById('bLang').textContent=LANG==='en'?'DE':'EN';
const VERSION='1.18',REPO='mariokupcevsky/glyphwerk';let fbKind='bug';
function fbText(){const k=fbKind==='bug'?'Fehler':'Idee',t=document.getElementById('fbTitle').value.trim(),b=document.getElementById('fbBody').value.trim();
  const g=Object.values(S.glyphs).filter(v=>hasInk(v)).length;
  return {title:`[${k}] ${t||'(ohne Titel)'}`,body:`${b||'(keine Beschreibung)'}\n\n---\nGlyphwerk ${VERSION} · ${LANG} · ${innerWidth}x${innerHeight} @${devicePixelRatio} · ${g} Glyphen\n${navigator.userAgent}`}}
function fbPick(k){fbKind=k;document.getElementById('fbBug').setAttribute('aria-pressed',k==='bug');document.getElementById('fbIdea').setAttribute('aria-pressed',k==='idea')}
document.getElementById('bFb').onclick=()=>{document.getElementById('fbMsg').textContent='';openSheet('sheetFb')};
document.getElementById('fbBug').onclick=()=>fbPick('bug');document.getElementById('fbIdea').onclick=()=>fbPick('idea');
document.getElementById('fbSend').onclick=()=>{const f=fbText(),m=document.getElementById('fbMsg');
  if(!document.getElementById('fbTitle').value.trim()){m.textContent='Bitte kurz beschreiben, worum es geht.';return}
  const u=`https://github.com/${REPO}/issues/new?title=${encodeURIComponent(f.title)}&body=${encodeURIComponent(f.body.slice(0,6000))}&labels=${fbKind==='bug'?'bug':'enhancement'}`;
  window.open(u,'_blank','noopener');m.textContent='GitHub wurde geöffnet. Dort noch auf „Submit new issue“ tippen.'};
document.getElementById('fbCopy').onclick=async()=>{const f=fbText(),m=document.getElementById('fbMsg'),t=f.title+'\n\n'+f.body;
  try{await navigator.clipboard.writeText(t);m.textContent='Kopiert. Schick den Text an Mario.'}catch(e){m.textContent='Kopieren ging nicht. Markiere den Text selbst.'}};
const IN_CLAUDE=!!(window.claude&&window.claude.use);
if(IN_CLAUDE)document.getElementById('feaAI').hidden=false;
else{document.getElementById('bOTF').textContent='OTF exportieren';
  const n=document.getElementById('bOTF').closest('.sheet').querySelector('.note:last-of-type');
  if(n)n.textContent='Die OTF wird direkt heruntergeladen. Damit Pages, Notizen oder Word auf dem iPad die Schrift nutzen, muss sie installiert werden, zum Beispiel mit einer Schrift-Installations-App aus dem App Store. Auf Mac und Windows reicht ein Doppelklick auf die Datei.'}
const inspTgl=document.getElementById('inspTgl');
inspTgl.onclick=()=>{const c=document.body.classList.toggle('insp-closed');inspTgl.setAttribute('aria-expanded',!c);inspTgl.lastElementChild.textContent=c?'▸':'▾';setTimeout(()=>{resize();fit()},0)};
setTimeout(initStore,0);
