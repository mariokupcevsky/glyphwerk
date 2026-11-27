/* ---------- rules mode UI ----------
   Opening snapshots every letter the rules can make. Each slider move restores that snapshot and writes the
   generated letters again (live in the text line). Hand-drawn letters stay unless "Gezeichnete ersetzen" is on.
   Übernehmen saves and adds one undo step for all letters; Verwerfen restores the snapshot. */
let genP={...GENP0},genBase=null,genAll=false,genRaf=0;try{const g=JSON.parse(localStorage.getItem('glyphwerk.gen')||'null');if(g)genP={...GENP0,...g}}catch(e){}
const gIn={w:'gW',c:'gC',a:'gA',wd:'gWd',xh:'gX',cap:'gCap',sh:'gSh',ov:'gOv',wc:'gWc',wf:'gWf',r:'gR',sl:'gS'},gUnit={w:'',c:' %',a:'°',wd:' %',xh:'',cap:'',sh:' %',ov:' ‰',wc:' %',wf:' %',r:' %',sl:'°'};
const gMx=k=>k==='xh'||k==='cap';
const gVal=k=>gMx(k)?(k==='xh'?XH:CAP):genP[k];
function genSync(){for(const [k,id] of Object.entries(gIn)){const el=document.getElementById(id);el.value=gVal(k);document.getElementById(id+'v').textContent=gVal(k)+gUnit[k]}
  document.getElementById('gEnd').setAttribute('aria-pressed',genP.e==='f');}
function genRestoreBase(){for(const [ch,sn] of Object.entries(genBase.snaps)){const d=JSON.parse(sn.d);
  if(d){const g=S.glyphs[ch]||(S.glyphs[ch]={v:0});g.c=d.c;g.k=d.k;g.l=d.l;g.r=d.r;g.v=(g.v||0)+1}else delete S.glyphs[ch]}}
function genApply(){if(!genBase)return;genRestoreBase();const G=genSkel(genP);
  for(const ch of GEN_CH){if(!G[ch]||(genBase.hand[ch]&&!genAll))continue;const old=S.glyphs[ch];
    S.glyphs[ch]={c:[],k:genStrokes(G[ch],genP),l:0,r:0,v:(old&&old.v||0)+1}}
  MC.clear();relayout();const l=layout(),mx=CW>760?120:20;if(view.ox+l.width*view.s>CW-mx||view.ox<mx-1)fit();else draw()}
function genQueue(){cancelAnimationFrame(genRaf);genRaf=requestAnimationFrame(genApply)}
function genOpen(){if(genBase)return;if(S.gen)genP={...GENP0,...S.gen};selStroke=null;sel.clear();const snaps={},hand={};
  for(const ch of GEN_CH){snaps[ch]=snap(ch);const g=S.glyphs[ch];hand[ch]=!S.example&&hasInk(g)&&!isGenGlyph(g)}
  genBase={snaps,hand,mx:JSON.stringify(S.mx||{}),gen:JSON.stringify(genP)};document.getElementById('genPanel').hidden=false;document.querySelector('.stage').classList.add('gen');
  document.getElementById('bGen').setAttribute('aria-pressed','true');genSync();genApply();fit();
  const n=Object.values(hand).filter(Boolean).length;alertMsg(n?`${n} selbst gezeichnete Buchstaben bleiben, solange „Gezeichnete ersetzen“ aus ist.`:'Regler bewegen, die Buchstaben ändern sich sofort im Text.')}
function genClose(keep){if(!genBase)return;cancelAnimationFrame(genRaf);
  if(keep){genApply();const ch=[];for(const c of GEN_CH)if(snap(c).d!==genBase.snaps[c].d)ch.push(c);
    if(ch.length){undoS.push({multi:ch.map(c=>genBase.snaps[c])});redoS.length=0;updButtons()}
    if(S.example){S.example=false;dirty.add('meta')}for(const c of ch)dirty.add('g:'+c);
    S.gen={...genP};dirty.add('meta');try{localStorage.setItem('glyphwerk.gen',JSON.stringify(genP))}catch(e){}
    genBase=null;S.t=Date.now();MC.clear();relayout();draw();renderInsp();schedule();alertMsg(`${ch.length} Buchstaben aus Regeln übernommen. Rückgängig macht alles in einem Schritt zurück.`)}
  else{genRestoreBase();S.mx=JSON.parse(genBase.mx);genP=JSON.parse(genBase.gen);applyMx();syncMx();genBase=null;MC.clear();relayout();draw();renderInsp();alertMsg('Regeln verworfen.')}
  document.getElementById('genPanel').hidden=true;document.querySelector('.stage').classList.remove('gen');document.getElementById('bGen').setAttribute('aria-pressed','false');fit()}
document.getElementById('bGen').onclick=()=>{genBase?genClose(true):genOpen()};
for(const [k,id] of Object.entries(gIn))document.getElementById(id).addEventListener('input',e=>{const v=+e.target.value;if(gMx(k)){S.mx=S.mx||{};S.mx[k]=v;applyMx();MC.clear();dirty.add('meta')}else genP[k]=v;document.getElementById(id+'v').textContent=v+gUnit[k];genQueue()});
document.getElementById('gEnd').onclick=()=>{genP.e=genP.e==='f'?'r':'f';genSync();genQueue()};
document.getElementById('gReset').onclick=()=>{genP={...GENP0};S.mx={};applyMx();MC.clear();dirty.add('meta');genSync();genQueue()};
document.getElementById('gCancel').onclick=()=>genClose(false);
document.getElementById('gOk').onclick=()=>genClose(true);


