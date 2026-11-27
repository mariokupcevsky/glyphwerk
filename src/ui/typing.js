/* ---------- typing directly on the canvas ----------
   A hidden textarea holds the text (named glyphs as /name). It gets focus on a double tap, Enter or the
   keyboard button, so the iPad keyboard (or a hardware keyboard) types at the caret drawn on the canvas.
   Paragraph styles follow their paragraph when lines are added or removed. */
const ed=document.getElementById('ed');
const showLen=c=>textToShow([...S.text].slice(0,c).join('')).length;
function syncEd(){ed.value=textToShow(S.text);syncEdSel()}
function syncEdSel(){caret=Math.max(0,Math.min(caret,[...S.text].length));const n=showLen(caret);try{ed.setSelectionRange(n,n)}catch(e){}placeEd();if(document.activeElement===ed)draw()}
function placeEd(){if(!CW)return;const cp=caretPos(caret);ed.style.left=Math.max(0,Math.min(CW-4,psx(cp.x)))+'px';ed.style.top=Math.max(0,Math.min(CH-30,psy(cp.by+ASC*cp.k)))+'px'}
function focusEd(){syncEd();ed.focus({preventScroll:true});renderInsp();draw()}
function caretFromEd(){const st=ed.selectionStart||0;return [...textFromShow(ed.value.slice(0,st),-1)].length}
function keepCaretVisible(){const cp=caretPos(caret),x=psx(cp.x),yT=psy(cp.by+ASC*cp.k),yB=psy(cp.by+DESC*cp.k),mx=CW>760?130:30,bp=botPad();
  let moved=false;if(x>CW-mx){view.ox-=x-(CW-mx);moved=true}else if(x<mx){view.ox+=mx-x;moved=true}
  if(yB>CH-bp){view.oy-=yB-(CH-bp);moved=true}else if(yT<40){view.oy+=40-yT;moved=true}if(moved)draw()}
ed.addEventListener('input',()=>{const before=(S.text.match(/\n/g)||[]).length;S.text=textFromShow(ed.value,ed.selectionStart);const c=caretFromEd();
  const after=(S.text.match(/\n/g)||[]).length,d=after-before;
  if(d){S.ps=S.ps||[];const p=paraOf(c);if(d>0){const base=S.ps[Math.max(0,p-d)]||{};S.ps.splice(p-d+1,0,...Array.from({length:d},()=>({...base})))}else S.ps.splice(p+1,-d)}
  caret=c;active=Math.max(0,Math.min(c-1,[...S.text].length-1));sel.clear();selStroke=null;openC=null;
  changed(null);placeEd();keepCaretVisible()});
document.addEventListener('selectionchange',()=>{if(document.activeElement!==ed)return;const c=caretFromEd();if(c===caret)return;caret=c;
  const t=[...S.text];active=Math.max(0,Math.min(c>0?c-1:0,t.length-1));sel.clear();selStroke=null;placeEd();renderInsp();draw();keepCaretVisible()});
ed.addEventListener('focus',()=>{renderInsp();draw()});ed.addEventListener('blur',()=>{renderInsp();draw()});
cv.addEventListener('dblclick',e=>{if(e.pointerType!=='touch')focusEd()});
