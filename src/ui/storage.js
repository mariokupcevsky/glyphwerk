/* ---------- change tracking & storage ---------- */
let dirty=new Set(),saveT=null,db=null,uid=null,saving=false;
function changed(ch){if(ch){const g=S.glyphs[ch];if(g)g.v=(g.v||0)+1;dirty.add('g:'+ch)}else{dirty.add('meta');if(document.activeElement!==ed)syncEd()}
  if(S.example&&ch){S.example=false;dirty.add('meta')}
  S.t=Date.now();GC=null;relayout();draw();renderInsp();schedule()}
function schedule(){clearTimeout(saveT);saveT=setTimeout(flush,900);setStatus('Ändert…')}
const gid=ch=>'g_'+ch.codePointAt(0).toString(16).padStart(4,'0');
function serial(){const g={};for(const [k,v] of Object.entries(S.glyphs))g[k]={...(v.px?{px:v.px}:{}),c:v.c,k:v.k||[],l:v.l||0,r:v.r||0,...(v.u&&v.u.length?{u:v.u.map(({id,dx,dy})=>({id,dx,dy}))}:{}),...(v.lk?{lk:v.lk}:{}),...(v.rk?{rk:v.rk}:{})};
  return {px:S.px||null,mx:S.mx||{},gen:S.gen||null,name:S.name,spacing:S.spacing,strength:S.strength,kern:S.kern,gkern:S.gkern||{},groups:S.groups||{},parts:S.parts||{},text:S.text,example:!!S.example,t:S.t,names:S.names||{},fea:S.fea||'',feaAuto:S.feaAuto!==false,ps:S.ps||[],fmt:S.fmt||{},mono:S.mono||0,spaceW:S.spaceW||0,sets:S.sets||[],csets:S.csets||[],ctx:S.ctx||{},glyphs:g}}
async function flush(){
  let okLocal=true;try{localStorage.setItem(LOCAL_KEY,JSON.stringify(serial()))}catch(e){okLocal=false}
  if(!okLocal){setStatus('Speichern im Browser fehlgeschlagen (Speicher voll?). Bitte „Projekt sichern (.json)“ unter Schrift & Export nutzen.');if(!db){dirty.clear();return}}
  else if(!db){setStatus('Auf diesem Gerät gespeichert');dirty.clear();return}
  if(saving){schedule();return}saving=true;const keys=[...dirty];dirty.clear();
  try{for(const k of keys){
      if(k==='meta')await db.doc(`data/users/${uid}/meta`).set({name:S.name,spacing:S.spacing,strength:S.strength,kern:JSON.stringify(S.kern),gkern:JSON.stringify(S.gkern||{}),groups:JSON.stringify(S.groups||{}),parts:JSON.stringify(S.parts||{}),text:S.text,example:!!S.example,t:S.t,names:JSON.stringify(S.names||{}),fea:S.fea||'',feaAuto:S.feaAuto!==false,ps:JSON.stringify(S.ps||[]),fmt:JSON.stringify(S.fmt||{}),mono:S.mono||0,spaceW:S.spaceW||0,sets:JSON.stringify(S.sets||[]),csets:JSON.stringify(S.csets||[]),ctx:JSON.stringify(S.ctx||{})});
      else{const ch=k.slice(2),g=S.glyphs[ch];await db.doc(`data/users/${uid}/${gid(ch)}`).set({ch,c:JSON.stringify(g?g.c:[]),k:JSON.stringify(g?g.k||[]:[]),u:JSON.stringify(g&&g.u?g.u.map(({id,dx,dy})=>({id,dx,dy})):[]),l:g?g.l||0:0,r:g?g.r||0:0,lk:g&&g.lk||'',rk:g&&g.rk||'',t:S.t})}}
    setStatus('In deinem Konto gespeichert')}
  catch(e){for(const k of keys)dirty.add(k);setStatus('Speichern fehlgeschlagen, nur lokal');}
  saving=false}
function setStatus(t){document.getElementById('status').textContent=t}
function fromSerial(o){const g={};for(const [k,v] of Object.entries(o.glyphs||{}))g[k]={px:v.px||null,c:v.c||[],k:v.k||[],u:v.u||[],l:v.l||0,r:v.r||0,lk:v.lk||'',rk:v.rk||'',v:1};
  return {px:o.px||null,mx:o.mx||{},gen:o.gen||null,name:o.name||'Meine Schrift',spacing:+o.spacing||60,strength:o.strength??50,kern:o.kern||{},gkern:o.gkern||{},groups:o.groups||{},parts:o.parts||{},glyphs:g,text:o.text||'HOT AVO nono',example:!!o.example,t:o.t||0,names:o.names||{},fea:o.fea||'',feaAuto:o.feaAuto!==false,ps:o.ps||[],fmt:o.fmt||{},mono:+o.mono||0,spaceW:+o.spaceW||0,sets:o.sets||[],csets:o.csets||[],ctx:o.ctx||{}}}
function loadLocal(){try{const s=localStorage.getItem(LOCAL_KEY);if(s)return fromSerial(JSON.parse(s))}catch(e){}return null}
async function initStore(){
  if(!window.claude||!window.claude.use){setStatus(S.example?'Beispiel, nur auf diesem Gerät':'Auf diesem Gerät gespeichert');return}
  try{const [u,d]=await Promise.all([claude.use('user'),claude.use('db')]);
    if(!u||!d){setStatus('Nur auf diesem Gerät');return}
    const id=await u.id();if(!id){setStatus('Nur auf diesem Gerät');return}
    const snapq=await d.collection(`data/users/${id}`).get();db=d;uid=id;
    let meta=null;const gl={};
    for(const doc of snapq.docs){const v=doc.data();if(!v)continue;if(doc.id==='meta')meta=v;else if(v.ch)gl[v.ch]={c:JSON.parse(v.c||'[]'),k:JSON.parse(v.k||'[]'),u:JSON.parse(v.u||'[]'),l:v.l||0,r:v.r||0,lk:v.lk||'',rk:v.rk||'',v:1}}
    if(meta&&(meta.t||0)>=(S.t||0)){
      S={name:meta.name||'Meine Schrift',spacing:meta.spacing||60,strength:meta.strength??50,kern:JSON.parse(meta.kern||'{}'),gkern:JSON.parse(meta.gkern||'{}'),groups:JSON.parse(meta.groups||'{}'),parts:JSON.parse(meta.parts||'{}'),glyphs:gl,text:meta.text||'HOT AVO nono',example:!!meta.example,t:meta.t||0,names:JSON.parse(meta.names||'{}'),fea:meta.fea||'',feaAuto:meta.feaAuto!==false,ps:JSON.parse(meta.ps||'[]'),fmt:JSON.parse(meta.fmt||'{}'),mono:+meta.mono||0,spaceW:+meta.spaceW||0,sets:JSON.parse(meta.sets||'[]'),csets:JSON.parse(meta.csets||'[]'),ctx:JSON.parse(meta.ctx||'{}')};
      MC.clear();active=Math.min(active,[...S.text].length-1);syncUI();relayout();fit();renderInsp();setStatus('In deinem Konto gespeichert')}
    else if(!S.example){dirty.add('meta');for(const ch of Object.keys(S.glyphs))dirty.add('g:'+ch);flush()}
    else setStatus('Beispiel, wird beim ersten Strich gespeichert')}
  catch(e){setStatus('Nur auf diesem Gerät')}}

