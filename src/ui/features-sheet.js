/* ---------- features sheet ---------- */
const feaCode=document.getElementById('feaCode'),feaAutoCb=document.getElementById('feaAuto');
function feaCheck(){const auto=S.feaAuto!==false?autoFea():'';document.getElementById('feaAutoCode').textContent=auto||'Noch keine Glyphen mit Feature-Namen gezeichnet.';
  let r;try{r=buildTTF().fea}catch(e){document.getElementById('feaMsg').textContent='Fehler: '+e.message;return}
  const m=document.getElementById('feaMsg');m.textContent=(r.tags.length?`Aktiv: ${r.tags.join(', ')}. `:'Noch keine Features. ')+r.warn.filter(w=>!w.startsWith('Fehlende')).join(' · ');
  const box=document.getElementById('feaMissing');box.textContent='';
  if(r.missing.some(validName)){const sp=document.createElement('span');sp.className='note';sp.textContent='Fehlt noch, antippen zum Zeichnen:';box.append(sp)}
  for(const n of r.missing){if(!validName(n))continue;const b=document.createElement('button');b.className='solid';b.textContent='/'+n+' zeichnen';
    b.onclick=()=>{const c=newName(n);const t=[...S.text];t.splice(active+1,0,c);S.text=t.join('');txt.value=textToShow(S.text);document.getElementById('sheetFea').hidden=true;changed(null);activate(active+1);focusActive()};box.append(b)}}
let feaT=null;
feaCode.addEventListener('input',()=>{S.fea=feaCode.value;clearTimeout(feaT);feaT=setTimeout(()=>{feaCheck();changed(null)},500)});
feaAutoCb.onchange=()=>{S.feaAuto=feaAutoCb.checked;feaCheck();changed(null)};
document.getElementById('bFea').onclick=()=>{feaCode.value=S.fea||'';feaAutoCb.checked=S.feaAuto!==false;document.getElementById('feaAIMsg').textContent='';openSheet('sheetFea');feaCheck()};
document.getElementById('bFeaAI').onclick=async()=>{const ask=document.getElementById('feaAsk').value.trim(),am=document.getElementById('feaAIMsg'),bt=document.getElementById('bFeaAI');
  if(!ask){am.textContent='Erst beschreiben, was passieren soll.';return}
  let sample=null;try{sample=await claude.use('sample')}catch(e){}
  if(!sample){am.textContent='Claude ist hier nicht erreichbar. Den Code kannst du trotzdem selbst schreiben.';return}
  const drawn=allChars().filter(c=>{const m=gm(c);return m&&!m.empty}).map(c=>isNamed(c)?nameOf(c):c);
  const prompt=`You write OpenType feature code for a small font editor. It understands ONLY this subset of AFDKO feature syntax:
- glyph classes: @name = [a b c]; ranges like [a-z] are allowed
- feature blocks: feature xxxx { ... } xxxx;  (4-letter tags: liga, dlig, calt, salt, ss01-ss20, smcp, onum, case, ...)
- single substitution: sub a by a.alt;  sub [a b] by [a.sc b.sc];
- ligature: sub f i by f_i;
- contextual with marks: sub x' y by x.alt;  sub @lc g' by g.fina;  and ignore rules: ignore sub g' @letters;
- NOT supported: pos, from, lookup blocks, multiple output glyphs, script/language.
Glyph names: single characters stand for themselves (a, A, 1, ä). Extra glyphs use names like a.ss01, g.fina, f_i, T_h.
Glyphs that exist in the font: ${drawn.join(' ')}
Already automatic (do not repeat): ${(S.feaAuto!==false?autoFea():'').replace(/\n/g,' ')||'none'}
Current own code:
${S.fea||'(empty)'}
The designer asks (in German): "${ask}"
Write the complete new feature code that should replace the current own code (keep what is still useful). You may use glyph names that do not exist yet if the request needs new shapes, the app will offer to draw them. Reply with ONLY the code, no explanation, no markdown fences. Put one short German comment line starting with # at the top that says what the code does.`;
  bt.disabled=true;am.textContent='Claude denkt…';
  try{const r=await sample(prompt,{modelTier:'default',cache:false});let code=(r.text||'').trim().replace(/^```\w*\n?|```$/g,'').trim();
    if(!code){am.textContent='Keine Antwort erhalten.';return}
    S.fea=code;feaCode.value=code;feaCheck();changed(null);am.textContent='Fertig. Prüfe den Code unten, mit Rückgängig im Feld kommst du zurück.'}
  catch(e){am.textContent=e&&e.code==='not_granted'?'Du hast Claude für diese Seite nicht erlaubt.':e&&e.code==='rate_limited'?'Gerade zu viele Anfragen, bitte kurz warten.':'Claude hat nicht geantwortet: '+(e&&e.message||e)}
  finally{bt.disabled=false}};

