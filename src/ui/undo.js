/* ---------- undo ---------- */
function snap(ch){const g=S.glyphs[ch];return {ch,d:JSON.stringify(g?{px:g.px||null,c:g.c,k:g.k||[],u:(g.u||[]).map(({id,dx,dy})=>({id,dx,dy})),l:g.l,r:g.r,lk:g.lk||'',rk:g.rk||''}:null)}}
function pushUndo(){const ch=curCh();if(!ch)return;undoS.push(snap(ch));if(undoS.length>200)undoS.shift();redoS.length=0;updButtons()}
function restore(s){const d=JSON.parse(s.d);if(d){const g=S.glyphs[s.ch]||(S.glyphs[s.ch]={v:0});g.c=d.c;g.px=d.px||null;g.k=d.k||[];g.u=d.u||[];g.l=d.l;g.r=d.r;g.lk=d.lk||'';g.rk=d.rk||''}else delete S.glyphs[s.ch];
  sel.clear();openC=null;changed(s.ch)}
function metaSnap(){return {m:JSON.stringify({px:S.px||null,mx:S.mx||{},kern:S.kern,gkern:S.gkern||{},groups:S.groups||{},spacing:S.spacing,strength:S.strength,mono:S.mono||0,spaceW:S.spaceW||0,ctx:S.ctx||{}})}}
function pushUndoMeta(){undoS.push(metaSnap());if(undoS.length>200)undoS.shift();redoS.length=0;updButtons()}
function restoreMeta(s){Object.assign(S,JSON.parse(s.m));MC.clear();syncUI();changed(null)}
function undo(){const s=undoS.pop();if(!s)return;if(s.m){redoS.push(metaSnap());restoreMeta(s);updButtons();return}if(s.multi){redoS.push({multi:s.multi.map(x=>snap(x.ch))});s.multi.forEach(restore)}else{redoS.push(snap(s.ch));restore(s)}updButtons()}
function redo(){const s=redoS.pop();if(!s)return;if(s.m){undoS.push(metaSnap());restoreMeta(s);updButtons();return}if(s.multi){undoS.push({multi:s.multi.map(x=>snap(x.ch))});s.multi.forEach(restore)}else{undoS.push(snap(s.ch));restore(s)}updButtons()}
function updButtons(){document.getElementById('bUndo').disabled=!undoS.length;document.getElementById('bRedo').disabled=!redoS.length}

