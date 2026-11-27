/* random sample text: picks German words until (nearly) every target character appears */
const WORDS=('Victor jagt zwölf Boxkämpfer quer über den großen Sylter Deich Falsches Üben von Xylophonmusik quält jeden größeren Zwerg '+
 'Quark Qualle quer Quelle Xaver Xylofon Yacht Yoga Typ Joghurt Jäger jung Juwel Clown Café Chor City Äpfel Ärger ähnlich Öl Ökologie Übermut übrig '+
 'Straße Fuß süß weiß heiß groß Maß Spaß Grüße Fräulein Bäcker Möwe Mühle Würfel König Brücke Löwe Vögel Füchse '+
 'Wald Wolke Wind Fenster Garten Himmel Insel Kaffee Lampe Nacht Ofen Papier Regen Sonne Tisch Uhr Vase Zucker Zebra Brief Dampf Kopf Nebel Hafen Gift '+
 'schnell leise bunt klug wild zart dunkel hell frisch kalt warm schief rund flach '+
 'tanzt springt fliegt kocht malt schreibt zeichnet liest singt baut findet holt bringt webt mixt '+
 'Projekt Kajak Boje Klavier Pulver Kurve Revier brav Gravur Twist Pyjama '+
 'und mit ohne auf unter vor neben zwischen hinter durch für nach bei vom zum').split(' ');
const WORDS_EN=('The quick brown fox jumps over the lazy dog Pack my box with five dozen liquor jugs Sphinx of black quartz judge my vow How vexingly quick daft zebras jump '+
 'Jackdaws love my big sphinx of quartz Waltz bad nymph for quick jigs vex Glib jocks quiz nymph to vex dwarf Quiet Yacht Xylophone Zigzag Kayak Jungle Window Garden River '+
 'and with under over between behind through after quickly gently softly bright dark warm cold').split(' ');
const PUNCT=['.',',',';',':','!','?','–','„','“','(',')',"'",'&','%','@','#','*','/','+','=','€','$','-'];
function randText(onlyDrawn){
  const want=new Set();const ok=c=>!onlyDrawn||!!gm(c);
  for(const c of 'abcdefghijklmnopqrstuvwxyzäöüßABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÜ0123456789')if(ok(c))want.add(c);
  for(const c of PUNCT)if(ok(c))want.add(c);
  if(onlyDrawn)for(const c of Object.keys(S.glyphs))if(!blank(c)&&c!=='ı'&&gm(c))want.add(c);
  const lower=c=>c===c.toLowerCase()&&c!==c.toUpperCase();
  const cands=[];for(const w of (LANG==='en'?WORDS_EN:WORDS)){cands.push(w);if(lower(w[0]))cands.push(w[0].toUpperCase()+w.slice(1))}
  let usable=[...new Set(cands.filter(w=>!onlyDrawn||[...w].every(c=>gm(c))))];
  if(onlyDrawn&&usable.length<12){const lo=[...want].filter(lower),up=[...want].filter(c=>c!==c.toLowerCase());const pick=a=>a[Math.floor(Math.random()*a.length)];
    if(lo.length)for(let q=0;q<24;q++){let w='';const n=3+Math.floor(Math.random()*5);for(let z=0;z<n;z++)w+=pick(lo);if(up.length&&q%3===0)w=pick(up)+w.slice(1);usable.push(w)}
    else if(up.length)for(let q=0;q<12;q++){let w='';for(let z=0;z<4;z++)w+=pick(up);usable.push(w)}}
  const left=new Set([...want].filter(c=>/\p{L}/u.test(c)));const words=[];
  while(left.size&&words.length<60&&usable.length){let best=0;const sc=usable.map(w=>{let n=new Set([...w].filter(c=>left.has(c))).size;if(n&&!(LANG==='en'?WORDS_EN:WORDS).includes(w))n-=.5;if(words.includes(w))n=0;best=Math.max(best,n);return n});
    if(best<=0)break;const top=usable.filter((w,i)=>sc[i]>=best-(best>2?1:0));const w=top[Math.floor(Math.random()*top.length)];words.push(w);for(const c of w)left.delete(c)}
  for(let q=0;words.length<10&&q<50&&usable.length;q++){const w=usable[Math.floor(Math.random()*usable.length)];if(!words.includes(w)||q>40)words.push(w)}
  for(let i=words.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[words[i],words[j]]=[words[j],words[i]]}
  const digits=[...'0123456789'].filter(c=>want.has(c)).sort(()=>Math.random()-.5);const nums=[];while(digits.length)nums.push(digits.splice(0,2+Math.floor(Math.random()*3)).join(''));
  const pu=PUNCT.filter(c=>want.has(c));const out=[];let sent=[],n=0;
  const end=()=>{if(!sent.length)return;let t=sent.join(' ');t=t[0].toUpperCase()+t.slice(1);
    const e=['.','!','?',':',';'].filter(c=>want.has(c));out.push(t+(e.length?e[n++%e.length]:''));sent=[]};
  words.forEach((w,i)=>{sent.push(w);if(nums.length&&Math.random()<.25)sent.push(nums.shift());if(sent.length>=4+Math.floor(Math.random()*4))end()});
  end();if(nums.length)out.push(nums.join(' '));
  let t=out.join(' ');
  if(want.has('„')&&want.has('“'))t=t.replace(/ (\S+) /,' „$1“ ');if(want.has(',')&&!t.includes(','))t=t.replace(/ /,', ');
  if(want.has('(')&&want.has(')'))t=t.replace(/ (\S+) ([^ ]+)$/,' ($1) $2');
  const rest=pu.filter(c=>!t.includes(c));if(rest.length)t+='\n'+rest.join(' ');
  const miss=[...want].filter(c=>/\p{L}|\d/u.test(c)&&!t.includes(c));if(miss.length)t+=' '+miss.join('');
  return t}
document.getElementById('selSample').onchange=e=>{let v=e.target.value;if(!v)return;if(v.startsWith('@rnd')){v=randText(v==='@rndd');S.ps=[]}S.text=v;active=0;txt.value=v;sel.clear();openC=null;changed(null);fit();e.target.value=''};
const selTpl=document.getElementById('selTpl'),tplFile=document.getElementById('tplFile');
function fillTplSel(){selTpl.innerHTML='';for(const [v,l] of TPL_FONTS){const o=document.createElement('option');o.value=v;o.textContent=l;selTpl.append(o)}
  if(tplFont.startsWith('Eigene')){const o=document.createElement('option');o.value=tplFont;o.textContent=tplFont;selTpl.append(o)}
  const o=document.createElement('option');o.value='__file';o.textContent='Eigene Schrift laden…';selTpl.append(o);selTpl.value=tplFont}
selTpl.onchange=()=>{if(selTpl.value==='__file'){selTpl.value=tplFont;tplFile.click();return}setTplFont(selTpl.value)};
tplFile.onchange=async()=>{const f=tplFile.files[0];if(!f)return;try{const fam='Eigene: '+f.name.replace(/\.[^.]+$/,'').slice(0,30);const ff=new FontFace(fam,await f.arrayBuffer());await ff.load();document.fonts.add(ff);
    tplLoaded.add(fam);tplFont=fam;fillTplSel();await setTplFont(fam)}catch(e){alertMsg('Diese Schrift ließ sich nicht laden.')}tplFile.value=''};
function alertMsg(t){document.getElementById('hint').textContent=t}
fillTplSel();setTplFont(tplFont);
document.getElementById('bKbd').onclick=()=>{caret=Math.min([...S.text].length,active+1);focusEd()};document.getElementById('bFit').onclick=fit;document.getElementById('bFocus').onclick=focusActive;
const txt=document.getElementById('txt');
txt.addEventListener('input',()=>{S.text=textFromShow(txt.value)||' ';active=Math.min(active,[...S.text].length-1);sel.clear();openC=null;changed(null)});
const blurR=document.getElementById('blurR');blurR.oninput=()=>{document.getElementById('blurV').textContent=blurR.value;cv.style.filter=clean&&+blurR.value?`blur(${blurR.value}px)`:''};
document.getElementById('bClean').onclick=()=>setClean(true);document.getElementById('bCleanX').onclick=()=>setClean(false);
document.addEventListener('keydown',e=>{if(clean&&(e.key==='Escape'||(e.key.toLowerCase()==='e'&&e.target.tagName!=='TEXTAREA'&&!e.metaKey&&!e.ctrlKey))){e.preventDefault();setClean(false);return}
  if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'||e.target.tagName==='SELECT')return;
  if(e.key.toLowerCase()==='e'&&!e.metaKey&&!e.ctrlKey&&!e.altKey){e.preventDefault();setClean(true);return}
  if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.shiftKey?redo():undo()}
  else if((e.key==='Backspace'||e.key==='Delete')&&selStroke){e.preventDefault();insp.querySelector('[data-act="sdel"]')?.click()}
  else if((e.key==='Backspace'||e.key==='Delete')&&sel.size){e.preventDefault();insp.querySelector('[data-act="del"],[data-act="delc"]')?.click()}
  else if(e.key==='ArrowLeft'&&!sel.size)activate(Math.max(0,active-1));else if(e.key==='ArrowRight'&&!sel.size)activate(Math.min([...S.text].length-1,active+1));
  else if(e.key==='Enter'&&!sel.size&&!selStroke&&!openC){e.preventDefault();focusEd()}});

