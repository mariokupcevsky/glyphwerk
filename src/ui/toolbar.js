/* ---------- toolbar ---------- */
document.getElementById('tools').addEventListener('click',e=>{const b=e.target.closest('button[data-tool]');if(!b)return;if(b.dataset.nib){nib.n=b.dataset.nib;saveNib()}setTool(b.dataset.tool)});
const nibSize=document.getElementById('nibSize'),nibAng=document.getElementById('nibAng'),nibOv=document.getElementById('nibOv');nib.ov=nib.ov||0;if(nib.a>180||nib.a<0)nib.a=35;
function syncNib(){nibSize.value=nib.s;document.getElementById('nibSizeV').textContent=nib.s;nibAng.value=nib.a;nibAng.disabled=!!nib.tilt;document.getElementById('nibAngV').textContent=nib.tilt?'Pencil':nib.a+'°';
  nibOv.value=nib.ov;document.getElementById('nibOvV').textContent=nib.ov?nib.ov+'%':'rund';const br=tool==='brush';document.getElementById('lOv').hidden=!br||nib.n==='broad';document.getElementById('lAng').hidden=!br}
nibSize.oninput=()=>{nib.s=+nibSize.value;saveNib();syncNib()};
nibAng.oninput=()=>{nib.a=+nibAng.value;if(nib.n!=='broad'&&!nib.ov)nib.ov=40;saveNib();syncNib();renderInsp()};
nibOv.oninput=()=>{nib.ov=+nibOv.value;saveNib();syncNib();renderInsp()};syncNib();
function setTool(t){if(openC&&t!=='pen'){openC.z=true;openC=null;changed(curCh())}tool=t;pickedPair=null;
  for(const b of document.querySelectorAll('[data-tool]'))b.setAttribute('aria-pressed',b.dataset.tool===t&&(!b.dataset.nib||b.dataset.nib===nib.n));if(typeof syncNib==='function')syncNib();renderInsp();draw()}
function toggle(id,get,set){const b=document.getElementById(id);b.addEventListener('click',()=>{set(!get());b.setAttribute('aria-pressed',get());draw()})}
toggle('bGrid',()=>grid,v=>grid=v);toggle('bInv',()=>inv,v=>{inv=v;try{localStorage.setItem('glyphwerk.inv',v?'1':'0')}catch(e){}});document.getElementById('bInv').setAttribute('aria-pressed',inv);
toggle('bMouse',()=>mouseSel,v=>mouseSel=v);toggle('bTpl',()=>tpl,v=>tpl=v);toggle('bPrev',()=>preview,v=>preview=v);
document.getElementById('bUndo').onclick=undo;document.getElementById('bRedo').onclick=redo;
toggle('bMet',()=>showMet,v=>showMet=v);
function stepGlyph(d){const AC=allChars();const t=[...S.text];const ch=t[active];let i=AC.indexOf(ch);if(i<0)i=0;i=(i+d+AC.length)%CHARSET.length;
  const nc=AC[i];S.text=t.map(c=>c===ch?nc:c).join('');txt.value=textToShow(S.text);sel.clear();openC=null;changed(null)}
document.getElementById('bPrevG').onclick=()=>stepGlyph(-1);document.getElementById('bNextG').onclick=()=>stepGlyph(1);
document.getElementById('bCtx').onclick=()=>{const ch=curCh();if(blank(ch))return;
  S.text=isLow(kc(ch))?`nn${ch}nn oo${ch}oo`:/[0-9]/.test(ch)?`00${ch}00 11${ch}11`:`HH${ch}HH OO${ch}OO`;active=2;txt.value=textToShow(S.text);sel.clear();openC=null;changed(null);fit()};
