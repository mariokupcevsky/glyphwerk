/* ---------- pixel grid mode: cells -> shared geometry -> real outlines ----------
   Hand-painted cells (or a rasterised drawing) are the input; the global shape rules (roundness, liquid bridge,
   cell gap, merge direction) turn them into ordinary Bézier contours, so preview, spacing and TTF/OTF export just work.
   A glyph keeps its cells in g.px; if its outline is later edited by hand, the rules stop overwriting it. */
const PX0={cols:5,rows:9,base:2,r:0,j:70,gap:0,m:3,d:1};
const pxP=()=>({...PX0,...(S.px||{})});
const pxCell=()=>{const p=pxP();return CAP/Math.max(1,p.rows-p.base)};
function pxHash(c){const t=JSON.stringify(c);let h=5381;for(let i=0;i<t.length;i++)h=((h<<5)+h+t.charCodeAt(i))|0;return h}
function pxBlank(){const p=pxP();return Array.from({length:p.rows},()=>'.'.repeat(p.cols))}
function pxOn(cells,p){return Array.from({length:p.rows},(_,r)=>Array.from({length:p.cols},(_,c)=>(cells[r]||'')[c]==='#'))}
function pxContours(cells){const p=pxP(),u=pxCell(),loops=pxOutline(pxOn(cells,p),p.cols,p.rows,{r:p.r,j:p.j,gap:p.gap,mh:p.m&1,mv:p.m&2,md:!!p.d,ins:p.o?(+p.ot||20)/100:0}),top=(p.rows-p.base)*u,o=[];
  const X=x=>Math.round(x*u*100)/100,Y=y=>Math.round((top-y*u)*100)/100;
  for(const l of loops)o.push({z:true,p:l.map(q=>P(X(q.x),Y(q.y),q.i?[X(q.i[0]),Y(q.i[1])]:null,q.o?[X(q.o[0]),Y(q.o[1])]:null,!!(q.i||q.o)))});return o}
function pxRegen(ch,force){const g=S.glyphs[ch];if(!g||!g.px)return false;
  if(!force&&g.px.h!==pxHash(g.c)){g.px=null;return false}
  g.c=pxContours(g.px.cells);g.px.h=pxHash(g.c);g.v=(g.v||0)+1;return true}
function pxRegenAll(){let n=0;for(const ch of Object.keys(S.glyphs))if(S.glyphs[ch].px&&pxRegen(ch)){dirty.add('g:'+ch);n++}MC.clear();return n}
let pxOpen=false,pxTool='draw',pxPaint=null,pxRaf=0;
const pxMsg=t=>{document.getElementById('pxMsg').textContent=t};
function pxGlyph(create){const ch=curCh();if(!ch||blank(ch))return null;let g=S.glyphs[ch];
  if(!g&&create)g=S.glyphs[ch]={c:[],l:0,r:0,v:0};
  if(g&&create&&!g.px){if(hasInk(g)&&(g.c.length||(g.k&&g.k.length)))return g;g.px={cells:pxBlank(),h:pxHash(g.c)}}
  return g}
function pxDrawGrid(){const cv=document.getElementById('pxCv');if(!cv)return;const p=pxP(),ch=curCh(),g=ch&&S.glyphs[ch],cells=(g&&g.px&&g.px.cells)||pxBlank();
  const cs=Math.max(14,Math.min(28,Math.floor(Math.min(CW-40,300)/Math.max(p.cols+1,1)))),lab=16,W=lab+p.cols*cs,H=lab+p.rows*cs,dpr=window.devicePixelRatio||1;
  cv.style.width=W+'px';cv.style.height=H+'px';cv.width=W*dpr;cv.height=H*dpr;const x=cv.getContext('2d');x.setTransform(dpr,0,0,dpr,0,0);
  const st=getComputedStyle(document.documentElement),ink=st.getPropertyValue('--ink').trim()||'#111',line=st.getPropertyValue('--line').trim()||'#ccc',mut=st.getPropertyValue('--muted').trim()||'#666',acc=st.getPropertyValue('--accent').trim()||'#2446c7';
  x.clearRect(0,0,W,H);x.font='10px "IBM Plex Mono",monospace';x.fillStyle=mut;x.textAlign='center';x.textBaseline='middle';
  for(let c=0;c<p.cols;c++)x.fillText(String(c+1),lab+c*cs+cs/2,lab/2);x.textAlign='right';
  for(let r=0;r<p.rows;r++)x.fillText(String(r+1),lab-3,lab+r*cs+cs/2);
  for(let r=0;r<p.rows;r++)for(let c=0;c<p.cols;c++){if((cells[r]||'')[c]==='#'){x.fillStyle=acc;x.globalAlpha=.85;x.fillRect(lab+c*cs+1,lab+r*cs+1,cs-2,cs-2);x.globalAlpha=1}}
  x.strokeStyle=line;x.lineWidth=1;x.beginPath();for(let c=0;c<=p.cols;c++){x.moveTo(lab+c*cs+.5,lab);x.lineTo(lab+c*cs+.5,H)}for(let r=0;r<=p.rows;r++){x.moveTo(lab,lab+r*cs+.5);x.lineTo(W,lab+r*cs+.5)}x.stroke();
  x.strokeStyle=ink;x.globalAlpha=.5;x.beginPath();const by=lab+(p.rows-p.base)*cs+.5;x.moveTo(lab,by);x.lineTo(W,by);x.stroke();x.globalAlpha=1;
  cv._m={cs,lab,p};document.getElementById('pxCh').textContent=ch&&!blank(ch)?disp(ch):'–';
  for(const b of document.querySelectorAll('[data-pxm]'))b.setAttribute('aria-pressed',String(+b.dataset.pxm===p.m));
  document.getElementById('pxDiag').checked=!!p.d;document.getElementById('pxOut').checked=!!p.o;document.getElementById('pxOT').value=p.ot||20;document.getElementById('pxCols').textContent=p.cols;document.getElementById('pxRows').textContent=p.rows;
  for(const [k,id] of [['r','pxR'],['j','pxJ'],['gap','pxG']]){const e=document.getElementById(id);if(document.activeElement!==e)e.value=Math.min(+e.max,p[k]);const n=document.getElementById(id+'n');if(document.activeElement!==n){n.value=p[k];n.classList.remove('bad')}}}
function pxApply(ch,cells,undoDone){const g=pxGlyph(true);if(!g||!g.px)return;if(!undoDone)pushUndo();g.px.cells=cells;pxRegen(ch,true);dirty.add('g:'+ch);MC.clear();changed(ch);pxDrawGrid()}
function pxCellAt(e){const cv=document.getElementById('pxCv'),m=cv._m,r=cv.getBoundingClientRect(),x=(e.clientX-r.left-m.lab)/m.cs,y=(e.clientY-r.top-m.lab)/m.cs,c=Math.floor(x),rr=Math.floor(y);
  return c>=0&&rr>=0&&c<m.p.cols&&rr<m.p.rows?[c,rr]:null}
function pxSet(cells,c,r,v){const row=(cells[r]||'.'.repeat(pxP().cols)).split('');row[c]=v?'#':'.';cells[r]=row.join('')}
(()=>{const cv=document.getElementById('pxCv');
  cv.addEventListener('pointerdown',e=>{const ch=curCh();const g=pxGlyph(true);if(!g||!g.px){pxMsg('Dieser Buchstabe hat eine Zeichnung. „Aus Zeichnung“ überträgt sie aufs Raster.');return}
    const cc=pxCellAt(e);if(!cc)return;cv.setPointerCapture(e.pointerId);pushUndo();const cells=g.px.cells.slice(),cur=(cells[cc[1]]||'')[cc[0]]==='#';
    const erase=pxTool==='erase'||e.button===2||(e.buttons&2)||(e.pointerType==='mouse'&&e.button===2);pxPaint={ch,v:erase?false:(pxTool==='draw'?!cur:true),cells};
    if(pxTool==='draw'&&!erase&&!cur)pxPaint.v=true;pxPaint.v=erase?false:pxPaint.v;pxSet(cells,cc[0],cc[1],pxPaint.v);pxApply(ch,cells,true)});
  cv.addEventListener('pointermove',e=>{if(!pxPaint)return;const cc=pxCellAt(e);if(!cc)return;if(((pxPaint.cells[cc[1]]||'')[cc[0]]==='#')===pxPaint.v)return;pxSet(pxPaint.cells,cc[0],cc[1],pxPaint.v);pxApply(pxPaint.ch,pxPaint.cells,true)});
  const end=()=>{pxPaint=null};cv.addEventListener('pointerup',end);cv.addEventListener('pointercancel',end);cv.addEventListener('contextmenu',e=>e.preventDefault())})();
function pxEdit(fn){const ch=curCh();const g=pxGlyph(true);if(!g||!g.px)return;const p=pxP(),c=fn(g.px.cells.map(r=>r.padEnd(p.cols,'.')),p);if(c)pxApply(ch,c)}
document.getElementById('pxUndo').onclick=()=>{undo();pxDrawGrid()};document.getElementById('pxRedo').onclick=()=>{redo();pxDrawGrid()};
document.getElementById('pxRand').onclick=()=>pxEdit((c,p)=>{const top=p.rows-p.base,half=Math.ceil(p.cols/2),out=Array.from({length:p.rows},()=>Array(p.cols).fill('.'));
  const dens=.35+Math.random()*.3;let n=0;
  for(let r=0;r<top;r++)for(let k=0;k<half;k++)if(Math.random()<dens){out[r][k]=out[r][p.cols-1-k]='#';n++}
  if(!n)out[Math.floor(top/2)][half-1]='#';return out.map(r=>r.join(''))});
document.getElementById('pxNew').onclick=()=>{let k=1;while(S.names&&S.names['sym'+k]&&S.glyphs[S.names['sym'+k]])k++;
  const c=newName('sym'+k);pushUndo();S.glyphs[c]={c:[],l:0,r:0,v:0,px:{cells:pxBlank(),h:0}};pxRegen(c,true);
  const t=[...S.text];t.splice(active+1,0,c);S.text=t.join('');txt.value=textToShow(S.text);dirty.add('g:'+c);changed(null);activate(active+1);pxDrawGrid();pxMsg('Neues Symbol „sym'+k+'“ angelegt. Malen oder „Zufallssymbol“.')};
document.getElementById('pxMir').onclick=()=>pxEdit(c=>c.map(r=>[...r].reverse().join('')));
document.getElementById('pxSl').onclick=()=>pxEdit((c,p)=>c.map(r=>r.slice(1)+r[0]));
document.getElementById('pxSr').onclick=()=>pxEdit((c,p)=>c.map(r=>r[r.length-1]+r.slice(0,-1)));
document.getElementById('pxClr').onclick=()=>pxEdit(()=>pxBlank());
document.getElementById('pxDraw').onclick=()=>{pxTool='draw';pxTools()};document.getElementById('pxErase').onclick=()=>{pxTool='erase';pxTools()};
function pxTools(){document.getElementById('pxDraw').setAttribute('aria-pressed',pxTool==='draw');document.getElementById('pxErase').setAttribute('aria-pressed',pxTool==='erase')}
document.getElementById('pxPrev').onclick=()=>{if(active>0)activate(active-1)};document.getElementById('pxNext').onclick=()=>{if(active<[...S.text].length-1)activate(active+1)};
document.getElementById('pxFromDraw').onclick=()=>{const ch=curCh(),g=S.glyphs[ch];if(!ch||!g||!hasInk(g)){pxMsg('Hier gibt es noch keine Zeichnung.');return}
  const p=pxP(),u=pxCell(),K=16,cv=document.createElement('canvas');cv.width=p.cols*K;cv.height=p.rows*K;const x=cv.getContext('2d',{willReadFrequently:true});
  const cs=glyphCs({...g,c:g.px?[]:g.c,u:g.u}),b=bounds(cs),sc=K/u,top=(p.rows-p.base)*u;x.setTransform(sc,0,0,-sc,-b.x0*sc,top*sc);x.fillStyle='#000';x.fill(pathOf(cs),'nonzero');
  const d=x.getImageData(0,0,cv.width,cv.height).data,cells=[];
  for(let r=0;r<p.rows;r++){let row='';for(let c=0;c<p.cols;c++){let a=0;for(let yy=0;yy<K;yy+=2)for(let xx=0;xx<K;xx+=2)a+=d[((r*K+yy)*cv.width+c*K+xx)*4+3];row+=a/255/(K*K/4)>=.4?'#':'.'}cells.push(row)}
  pushUndo();g.c=[];g.k=[];g.u=[];g.px={cells,h:0};pxRegen(ch,true);dirty.add('g:'+ch);MC.clear();changed(ch);pxDrawGrid();pxMsg('Zeichnung aufs Raster übertragen.')};
function pxGlobal(){cancelAnimationFrame(pxRaf);pxRaf=requestAnimationFrame(()=>{const n=pxRegenAll();changed(null);pxDrawGrid();if(!n)return})}
for(const [k,id,mx] of [['r','pxR',100],['j','pxJ',100],['gap','pxG',95]]){
  const sl=document.getElementById(id),nu=document.getElementById(id+'n');
  const set=v=>{S.px={...pxP(),[k]:v};pxGlobal()};
  sl.addEventListener('input',()=>{nu.value=sl.value;nu.classList.remove('bad');set(+sl.value)});
  nu.addEventListener('input',()=>{const t=nu.value.trim(),v=Number(t);if(t===''||!Number.isFinite(v)||v<0||v>mx){nu.classList.add('bad');pxMsg(`Bitte eine Zahl von 0 bis ${mx} eingeben.`);return}nu.classList.remove('bad');pxMsg('');sl.value=Math.min(+sl.max,v);set(v)})}
document.getElementById('pxOut').onchange=e=>{S.px={...pxP(),o:e.target.checked?1:0};pxGlobal()};
document.getElementById('pxOT').oninput=e=>{S.px={...pxP(),ot:+e.target.value};pxGlobal()};
document.getElementById('pxDiag').onchange=e=>{S.px={...pxP(),d:e.target.checked?1:0};pxGlobal()};
for(const b of document.querySelectorAll('[data-pxm]'))b.onclick=()=>{S.px={...pxP(),m:+b.dataset.pxm};pxGlobal()};
for(const b of document.querySelectorAll('[data-pxs]'))b.onclick=()=>{const p=pxP(),a=b.dataset.pxs;let {cols,rows}=p;
  if(a==='c+')cols=Math.min(20,cols+1);if(a==='c-')cols=Math.max(3,cols-1);if(a==='r+')rows=Math.min(24,rows+1);if(a==='r-')rows=Math.max(5,rows-1);
  if(cols===p.cols&&rows===p.rows)return;
  const st=document.getElementById('pxStretch').checked;
  if(st){for(const g of Object.values(S.glyphs))if(g.px){const o=Array.from({length:p.rows},(_,r)=>(g.px.cells[r]||'').padEnd(p.cols,'.'));
    g.px.cells=Array.from({length:rows},(_,r)=>{const sr=Math.min(p.rows-1,Math.floor((r+.5)*p.rows/rows));let t='';for(let c=0;c<cols;c++)t+=o[sr][Math.min(p.cols-1,Math.floor((c+.5)*p.cols/cols))];return t})}}
  else{
  for(const g of Object.values(S.glyphs))if(g.px){for(let r=0;r<g.px.cells.length;r++){const row=g.px.cells[r];if(r>=rows&&/#/.test(row)||(cols<p.cols&&/#/.test(row.slice(cols)))){pxMsg('Dafür müssten Zellen gelöscht werden. Erst leeren oder verschieben.');return}}}
  for(const g of Object.values(S.glyphs))if(g.px)g.px.cells=Array.from({length:rows},(_,r)=>(g.px.cells[r]||'').padEnd(cols,'.').slice(0,cols))}
  S.px={...p,cols,rows,base:Math.min(p.base,rows-3)};pxGlobal()};
const PXS={A:'.###./#...#/#...#/#####/#...#/#...#/#...#',B:'####./#...#/#...#/####./#...#/#...#/####.',C:'.####/#..../#..../#..../#..../#..../.####',D:'####./#...#/#...#/#...#/#...#/#...#/####.',E:'#####/#..../#..../####./#..../#..../#####',F:'#####/#..../#..../####./#..../#..../#....',G:'.####/#..../#..../#.###/#...#/#...#/.###.',H:'#...#/#...#/#...#/#####/#...#/#...#/#...#',I:'#####/..#../..#../..#../..#../..#../#####',J:'..###/....#/....#/....#/....#/#...#/.###.',K:'#...#/#..#./#.#../##.../#.#../#..#./#...#',L:'#..../#..../#..../#..../#..../#..../#####',M:'#...#/##.##/#.#.#/#.#.#/#...#/#...#/#...#',N:'#...#/##..#/#.#.#/#..##/#...#/#...#/#...#',O:'.###./#...#/#...#/#...#/#...#/#...#/.###.',P:'####./#...#/#...#/####./#..../#..../#....',Q:'.###./#...#/#...#/#...#/#.#.#/#..#./.##.#',R:'####./#...#/#...#/####./#.#../#..#./#...#',S:'.####/#..../#..../.###./....#/....#/####.',T:'#####/..#../..#../..#../..#../..#../..#..',U:'#...#/#...#/#...#/#...#/#...#/#...#/.###.',V:'#...#/#...#/#...#/#...#/#...#/.#.#./..#..',W:'#...#/#...#/#...#/#.#.#/#.#.#/##.##/#...#',X:'#...#/#...#/.#.#./..#../.#.#./#...#/#...#',Y:'#...#/#...#/.#.#./..#../..#../..#../..#..',Z:'#####/....#/...#./..#../.#.../#..../#####',
 '0':'.###./#...#/#..##/#.#.#/##..#/#...#/.###.','1':'..#../.##../..#../..#../..#../..#../.###.','2':'.###./#...#/....#/...#./..#../.#.../#####','3':'####./....#/....#/.###./....#/....#/####.','4':'#...#/#...#/#...#/#####/....#/....#/....#','5':'#####/#..../####./....#/....#/#...#/.###.','6':'.###./#..../#..../####./#...#/#...#/.###.','7':'#####/....#/...#./..#../.#.../.#.../.#...','8':'.###./#...#/#...#/.###./#...#/#...#/.###.','9':'.###./#...#/#...#/.####/....#/....#/.###.',
 a:'2|.###./....#/.####/#...#/.####',b:'0|#..../#..../####./#...#/#...#/#...#/####.',c:'2|.####/#..../#..../#..../.####',d:'0|....#/....#/.####/#...#/#...#/#...#/.####',e:'2|.###./#...#/#####/#..../.####',f:'0|..##./.#.../####./.#.../.#.../.#.../.#...',g:'2|.####/#...#/#...#/.####/....#/....#/.###.',h:'0|#..../#..../####./#...#/#...#/#...#/#...#',i:'0|..#../...../.##../..#../..#../..#../.###.',j:'0|...#./...../..##./...#./...#./...#./...#./#..#./.##..',k:'0|#..../#..../#..#./#.#../##.../#.#../#..#.',l:'0|.##../..#../..#../..#../..#../..#../.###.',m:'2|##.#./#.#.#/#.#.#/#.#.#/#.#.#',n:'2|####./#...#/#...#/#...#/#...#',o:'2|.###./#...#/#...#/#...#/.###.',p:'2|####./#...#/#...#/#...#/####./#..../#....',q:'2|.####/#...#/#...#/#...#/.####/....#/....#',r:'2|#.###/##..#/#..../#..../#....',s:'2|.####/#..../.###./....#/####.',t:'1|.#.../####./.#.../.#.../.#.../..##.',u:'2|#...#/#...#/#...#/#...#/.####',v:'2|#...#/#...#/#...#/.#.#./..#..',w:'2|#...#/#...#/#.#.#/#.#.#/.#.#.',x:'2|#...#/.#.#./..#../.#.#./#...#',y:'2|#...#/#...#/#...#/.####/....#/....#/.###.',z:'2|#####/...#./..#../.#.../#####',
 '.':'6|..#..',',':'6|..#../.#...',':':'3|..#../...../...../..#..','!':'0|..#../..#../..#../..#../..#../...../..#..','?':'0|.###./#...#/....#/...#./..#../...../..#..','-':'3|.###.'};
function pxStarterCells(def){const p=pxP();let off=p.rows-p.base-7,rows;if(def.includes('|')){const [st,r]=def.split('|');off+=+st;rows=r.split('/')}else rows=def.split('/');
  const cells=pxBlank();rows.forEach((row,i)=>{const y=off+i;if(y<0||y>=p.rows)return;const a=cells[y].split('');for(let c=0;c<p.cols&&c<row.length;c++)if(row[c]==='#')a[c]='#';cells[y]=a.join('')});return cells}
document.getElementById('pxStarter').onclick=e=>confirm2(e.currentTarget,()=>{let n=0;for(const [ch,def] of Object.entries(PXS)){const g=S.glyphs[ch];if(g&&hasInk(g)&&!g.px)continue;
  if(!g)S.glyphs[ch]={c:[],l:0,r:0,v:0};const gg=S.glyphs[ch];gg.px={cells:pxStarterCells(def),h:0};pxRegen(ch,true);dirty.add('g:'+ch);n++}
  MC.clear();changed(null);fit();pxDrawGrid();pxMsg(`${n} Starter-Buchstaben gesetzt. Selbst Gezeichnetes bleibt.`)});
function pxToggle(on){pxOpen=on;document.getElementById('pxPanel').hidden=!on;document.querySelector('.stage').classList.toggle('gen',on);document.getElementById('bPx').setAttribute('aria-pressed',on);
  if(on&&genBase)genClose(false);if(on){pxDrawGrid()}relayout();fit()}
document.getElementById('bPx').onclick=()=>pxToggle(!pxOpen);document.getElementById('pxDone').onclick=()=>pxToggle(false);

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


