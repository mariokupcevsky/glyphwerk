/* ---------- layout ---------- */
const PS0={k:1,al:'l',tr:0};
const pStyle=p=>({...PS0,...((S.ps||[])[p]||{})});
const fmt=()=>({w:9000,lh:1.3,...(S.fmt||{})});
const blank=ch=>!ch||ch===' '||ch==='\n';
/* Paragraphs (split at \n) are wrapped greedily at spaces to the column width. Every character gets an item,
   newlines included, so items[i] belongs to text index i. Item frame: page x0, baseline by, scale k. */
function layout(){
  if(frozen&&L)return L;
  const t=[...S.text],F=fmt(),W=F.w;const items=new Array(t.length),lines=[];let i=0,p=0,by=0,prevK=null,maxW=0;
  while(true){let j=i;while(j<t.length&&t[j]!=='\n')j++;const st=pStyle(p),k=st.k;
    const pit=[];
    for(let n=i;n<j;n++){const ch=t[n],m=gm(ch);let it;
      if(m)it={ch,dx:m.dx,adv:m.adv,m};else it={ch,dx:0,adv:isLow(kc(ch))?480:600,missing:true};
      it.kern=0;if(n<j-1&&m&&!m.empty)it.kern=kernOf(ch,t[n+1]);it.k=k;it.tr=st.tr;it.w=k*(it.adv+it.kern+st.tr);it.i=n;it.p=p;pit.push(it)}
    const rows=[];let row=[],rw=0;
    for(const it of pit){row.push(it);rw+=it.w;
      if(rw>W&&row.length>1&&it.ch!==' '){let sp=-1;for(let q=row.length-2;q>=0;q--)if(row[q].ch===' '){sp=q;break}
        const rest=sp>=0?row.splice(sp+1):[row.pop()];rows.push(row);row=rest;rw=row.reduce((a,b)=>a+b.w,0)}}
    rows.push(row);
    rows.forEach((r,ri)=>{if(prevK!==null)by-=(-DESC*prevK+ASC*k)*F.lh;prevK=k;
      let lw=r.reduce((a,b)=>a+b.w,0);let tl=lw;for(let q=r.length-1;q>=0&&r[q].ch===' ';q--)tl-=r[q].w;
      const x0=st.al==='c'?(W-tl)/2:st.al==='r'?W-tl:0;let x=x0;const ln={by,k,p,x0,x1:x0+lw,items:r,n:lines.length};
      for(const it of r){it.x0=x;it.by=by;it.ln=ln.n;x+=it.w;items[it.i]=it}
      if(ri===rows.length-1){const nl={ch:t[j]==='\n'?'\n':'',dx:0,adv:0,kern:0,w:0,k,tr:0,i:j,p,x0:x,by,ln:ln.n,end:true};ln.end=nl;if(j<t.length)items[j]=nl}
      maxW=Math.max(maxW,tl);lines.push(ln)});
    if(j>=t.length)break;i=j+1;p++}
  const f=lines[0],z=lines[lines.length-1];
  L={items,lines,width:Math.min(W,Math.max(maxW,1)),colW:W,top:ASC*f.k,bot:z.by+DESC*z.k,paras:p+1};return L}
function itemAt(px,py){const l=layout(),X=pwx(px),Y=pwy(py);let best=null,bd=Infinity;
  for(const ln of l.lines){const d=Y>ln.by+ASC*ln.k?Y-(ln.by+ASC*ln.k):Y<ln.by+DESC*ln.k?(ln.by+DESC*ln.k)-Y:0;if(d<bd){bd=d;best=ln}}
  if(!best)return {i:-1,c:0,ln:null,inBand:false};const its=best.items;const endI=best.end?best.end.i:(its.length?its[its.length-1].i+1:0);
  let i=-1,c=endI;for(const it of its){if(X<it.x0+it.w){i=it.i;c=X<it.x0+it.w/2?it.i:it.i+1;break}}
  if(i<0&&its.length){i=X<its[0].x0?its[0].i:its[its.length-1].i;if(X<its[0].x0)c=its[0].i}
  return {i,c,ln:best,inBand:bd<(ASC-DESC)*best.k*.3}}
function caretPos(c){const l=layout(),n=[...S.text].length;if(!l.lines.length)return {x:0,by:0,k:1};
  if(c<n&&l.items[c])return {x:l.items[c].x0,by:l.items[c].by,k:l.items[c].k};
  const z=l.lines[l.lines.length-1];return {x:z.end?z.end.x0:z.x1,by:z.by,k:z.k}}
const paraOf=c=>[...S.text].slice(0,c).filter(x=>x==='\n').length;
function trLbl(n){if(LANG!=='en')return n;const m=/^(\D+?) (−?\d+)$/.exec(n);if(!m)return tr(n);const w={'Oberlänge':'Ascender','Versalhöhe':'Cap height','x-Höhe':'x-height','Grundlinie':'Baseline','Unterlänge':'Descender'}[m[1]];return w?w+' '+m[2]:tr(n)}
function relayout(){applyMx();L=null;GC=null;layout()}
const curItem=()=>layout().items[active];
const curCh=()=>[...S.text][active];
function curGlyph(create){const ch=curCh();if(blank(ch))return null;
  if(!S.glyphs[ch]&&create)S.glyphs[ch]={c:[],l:0,r:0,v:0};return S.glyphs[ch]||null}
const gx=()=>{const it=curItem();return it?it.dx:0};
let caret=0;

