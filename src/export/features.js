/* ---------- named glyphs & OpenType features ----------
   Extra glyphs (a.ss01, f_i, g.fina) live in the Private Use Area internally, so the text line, storage and
   spacing treat them like any letter. In the text field they appear as /name, as in Glyphs.
   Features come from names automatically (Glyphs' conventions) plus the person's own feature code, a subset
   of the AFDKO syntax: classes, single and ligature substitution, contextual rules with ' and ignore. */
const PUA0=0xE000;
const isNamed=ch=>{const c=ch&&ch.charCodeAt(0);return c>=PUA0&&c<0xF8FF};
function nameOf(ch){for(const [n,c] of Object.entries(S.names||{}))if(c===ch)return n;return null}
const validName=n=>[...n].length>1&&!/[\s\/\[\]@;'{}()=#\\,]/.test(n);
function newName(n){S.names=S.names||{};if(S.names[n])return S.names[n];const used=new Set(Object.values(S.names));let c=PUA0;
  while(used.has(String.fromCharCode(c)))c++;return S.names[n]=String.fromCharCode(c)}
function chOfName(n){return [...n].length===1?n:(S.names||{})[n]||null}
function baseText(ch,d=0){if(!isNamed(ch))return ch;if(d>4)return '';const n=nameOf(ch)||'';
  return n.split('.')[0].split('_').map(p=>{const c=[...p].length===1?p:(S.names||{})[p];return c&&c!==ch?baseText(c,d+1):''}).join('')}
const kc=ch=>isNamed(ch)?([...baseText(ch)][0]||'x'):ch;
const disp=ch=>isNamed(ch)?'/'+(nameOf(ch)||'?'):ch;
const textToShow=t=>[...t].map(c=>isNamed(c)?'/'+(nameOf(c)||'?')+' ':c).join('');
/* new names are only created where the person just finished one (at = caret), so text after the caret is never swallowed */
const textFromShow=(s,at=null)=>s.replace(/\/([^\s\/]+)( |(?=\/))/g,(m,n,_,o)=>(S.names||{})[n]?S.names[n]:validName(n)&&(at===null||o+m.length===at)?newName(n):m);
const namedChars=()=>Object.values(S.names||{});
function glyphExists(n){const c=chOfName(n);return !!c&&!!gm(c)}
const FEAT_SUF={sc:'smcp',smcp:'smcp',c2sc:'c2sc',onum:'onum',lnum:'lnum',tnum:'tnum',pnum:'pnum',case:'case',swsh:'swsh',alt:'salt',salt:'salt',sups:'sups',subs:'subs',sinf:'sinf',zero:'zero'};
function autoFea(){const F={},add=(t,l)=>(F[t]=F[t]||[]).push(l);
  for(const n of Object.keys(S.names||{}).sort()){if(!glyphExists(n))continue;const parts=n.split('.'),base=parts[0],suf=parts.slice(1);
    if(base.includes('_')){const comps=base.split('_');if(comps.length>1&&comps.every(c=>c&&glyphExists(c)))
      add(suf.includes('dlig')?'dlig':suf.includes('liga')||comps[0]==='f'?'liga':'dlig',`sub ${comps.join(' ')} by ${n};`);continue}
    if(!suf.length)continue;const last=suf[suf.length-1],src=[base,...suf.slice(0,-1)].join('.');if(!glyphExists(src))continue;
    const tag=/^(ss(0[1-9]|1\d|20)|cv\d\d)$/.test(last)?last:FEAT_SUF[last];if(tag)add(tag,`sub ${src} by ${n};`)}
  const cl=[];
  /* context variants: a named variant (H.ctx1, a.ss01 …) used only before/after chosen letters */
  for(const [n,cx] of Object.entries(S.ctx||{})){if(!glyphExists(n))continue;const base=n.split('.')[0];if(!glyphExists(base))continue;
    const ok=t=>[...new Set([...(t||'')].filter(c=>/\p{L}/u.test(c)&&glyphExists(c)))].join(' ');const p=ok(cx.p),nx=ok(cx.n);if(!p&&!nx)continue;
    add('calt',`sub ${p?'['+p+'] ':''}${base}' ${nx?'['+nx+'] ':''}by ${n};`)}
  /* alternating variants (.r1, .r2 …): in a row of letters each one follows the previous one's form one step further,
     so doubled letters (ee, aa, ll) never look identical. */
  const L=allChars().filter(c=>/\p{L}/u.test(c)&&!nameOf(c)&&glyphExists(c));const lv=[];
  for(let k=1;k<=9;k++){const b=L.filter(c=>glyphExists(c+'.r'+k));if(!b.length)break;lv.push(b)}
  if(lv.length){const other=Object.keys(S.names||{}).filter(n=>!/\.r\d$/.test(n)&&/^[\w.]+$/.test(n)&&glyphExists(n));cl.push(`@GW_R0 = [${[...L,...other].join(' ')}];`);lv.forEach((b,i)=>cl.push(`@GW_R${i+1} = [${b.map(c=>c+'.r'+(i+1)).join(' ')}];`));
    for(let k=lv.length;k>=1;k--)add('calt',`sub @GW_R${k-1} [${lv[k-1].join(' ')}]' by [${lv[k-1].map(c=>c+'.r'+k).join(' ')}];`)}
  return (cl.length?cl.join('\n')+'\n\n':'')+Object.keys(F).sort().map(t=>`feature ${t} {\n  ${F[t].join('\n  ')}\n} ${t};`).join('\n\n')}
/* parser: returns {feats:{tag:[rule]}, errors:[]}; rule = {ign, bt:[set], inp:[set], la:[set], out:[set], marked, line} where set = [names] */
function parseFea(src){
  const errors=[],classes={},feats={},order=[];const toks=[];
  src.split('\n').forEach((ln,i)=>{ln=ln.replace(/#.*/,'');const re=/\\(\S)|([\[\]{};='])|([^\s\[\]{};=']+)/g;let m;
    while((m=re.exec(ln)))toks.push({t:m[1]?m[1]:m[2]||m[3],lit:!!m[1],p:!!m[2],line:i+1})});
  let i=0;const peek=()=>toks[i],next=()=>toks[i++],is=(v)=>toks[i]&&toks[i].p&&toks[i].t===v;
  const err=(m,tk)=>{errors.push(`Zeile ${tk?tk.line:'?'}: ${m}`)};
  const skipStmt=()=>{while(i<toks.length&&!is(';')&&!is('}'))i++;if(is(';'))i++};
  const expand=(a,b)=>{const o=[];const x=a.codePointAt(0),y=b.codePointAt(0);if(y<x||y-x>300)return null;for(let c=x;c<=y;c++)o.push(String.fromCodePoint(c));return o};
  function item(){const tk=next();if(!tk)return null;
    if(tk.p&&tk.t==='['){const set=[];while(i<toks.length&&!is(']')){const g=next();
        if(g.p){err(`„${g.t}“ in einer Klasse`,g);continue}
        if(g.t[0]==='@'&&!g.lit){if(classes[g.t])set.push(...classes[g.t]);else err(`Klasse ${g.t} unbekannt`,g);continue}
        const r=!g.lit&&/^(.)-(.)$/u.exec(g.t);if(r){const e=expand(r[1],r[2]);if(e){set.push(...e);continue}}set.push(g.t)}
      if(!is(']')){err('] fehlt',tk);return null}i++;return {set,tk}}
    if(tk.p){err(`unerwartet „${tk.t}“`,tk);return null}
    if(tk.t[0]==='@'&&!tk.lit){if(!classes[tk.t]){err(`Klasse ${tk.t} unbekannt`,tk);return {set:[],tk}}return {set:classes[tk.t],tk,cls:true}}
    return {set:[tk.t],tk}}
  function seq(stop){const out=[];while(i<toks.length&&!(toks[i].p&&stop.includes(toks[i].t))&&!(!toks[i].lit&&!toks[i].p&&stop.includes(toks[i].t))){
      const it=item();if(!it)return null;if(is("'")){i++;it.mark=true}out.push(it)}return out}
  function classDef(){const nm=next();if(!is('=')){err('= fehlt',nm);skipStmt();return}i++;const it=item();if(it)classes[nm.t]=it.set;if(is(';'))i++;else err('; fehlt',nm)}
  function rule(tag,ign,tk){const lhs=seq(ign?[';']:['by','from',';']);if(!lhs){skipStmt();return}let out=[];
    if(!ign){const k=next();if(!k||k.t!=='by'){err(k&&k.t==='from'?'„from“ (Alternativen) wird nicht unterstützt':'„by“ fehlt',k||tk);skipStmt();return}
      out=seq([';']);if(!out){skipStmt();return}}
    if(!is(';')){err('; fehlt',tk);skipStmt();return}i++;
    const mk=lhs.map(x=>!!x.mark);let a=mk.indexOf(true),b=mk.lastIndexOf(true);const marked=a>=0;
    if(ign&&!marked){a=0;b=0}
    if(marked&&mk.slice(a,b+1).some(x=>!x)){err('markierte Glyphen (\') müssen nebeneinander stehen',tk);return}
    if(!marked){a=0;b=lhs.length-1}
    const r={ign,bt:lhs.slice(0,a).map(x=>x.set),inp:lhs.slice(a,b+1).map(x=>x.set),la:lhs.slice(b+1).map(x=>x.set),out:out.map(x=>x.set),ctx:marked||ign,line:tk.line};
    if(!ign&&r.out.length!==1){err('genau ein Ergebnis nach „by“ (Mehrfach-Ersetzung wird nicht unterstützt)',tk);return}
    if(!ign&&r.inp.length===1&&r.out[0].length>1&&r.out[0].length!==r.inp[0].length){err('Klassen vor und nach „by“ brauchen gleich viele Glyphen',tk);return}
    if(!ign&&r.inp.length>1&&r.out[0].length!==1){err('eine Ligatur ersetzt durch genau eine Glyphe',tk);return}
    (feats[tag]=feats[tag]||[]).push(r)}
  function block(){const tg=next();const tag=tg&&tg.t;if(!tag||!/^[A-Za-z0-9 ]{4}$/.test(tag)){err('Feature-Name braucht 4 Zeichen, z. B. liga oder ss01',tg);}
    if(tg&&!order.includes(tag))order.push(tag);if(!is('{')){err('{ fehlt',tg);skipStmt();return}i++;
    while(i<toks.length&&!is('}')){const tk=peek();
      if(tk.p){err(`unerwartet „${tk.t}“`,tk);i++;continue}
      if(tk.t[0]==='@'&&!tk.lit){classDef();continue}
      if(tk.t==='sub'||tk.t==='substitute'){i++;rule(tag,false,tk);continue}
      if(tk.t==='ignore'){i++;const s=next();if(!s||(s.t!=='sub'&&s.t!=='substitute')){err('nach ignore folgt sub',tk);skipStmt();continue}rule(tag,true,tk);continue}
      if(['script','language','lookupflag','languagesystem'].includes(tk.t)){skipStmt();continue}
      if(tk.t==='pos'||tk.t==='position'){err('pos wird nicht unterstützt, Kerning macht Glyphwerk selbst',tk);skipStmt();continue}
      err(`„${tk.t}“ wird nicht unterstützt`,tk);skipStmt()}
    if(!is('}')){err('} fehlt',tg);return}i++;const e=next();if(!e||e.t!==tag)err(`nach } gehört „${tag};“`,e||tg);if(is(';'))i++}
  while(i<toks.length){const tk=peek();
    if(tk.t==='feature'&&!tk.p){i++;block();continue}
    if(tk.t[0]==='@'&&!tk.lit&&!tk.p){classDef();continue}
    if(['languagesystem','table','include'].includes(tk.t)){skipStmt();continue}
    err(`„${tk.t}“ außerhalb eines Features`,tk);i++}
  return {feats,order,errors}}
/* compile to GSUB bytes. gidOf(name) -> glyph id or -1 */
function tblB(fields){const head=fields.length*2;let off=head;const kids=[],out=[];
  const offs=fields.map(f=>{if(typeof f==='number')return f;const o=off;off+=f.length;kids.push(f);return o});
  if(off>65535)throw new Error('Feature-Tabelle zu groß');
  for(const v of offs)out.push((v>>8)&255,v&255);for(const k of kids)for(const b of k)out.push(b);return out}
const tagU=t=>{const c=[...t.padEnd(4,' ')].map(x=>x.charCodeAt(0)&255);return [(c[0]<<8)|c[1],(c[2]<<8)|c[3]]};
const covB=g=>{const s=[...new Set(g)].sort((a,b)=>a-b);return tblB([1,s.length,...s])};
function compileFea(src,gidOf){
  const P=parseFea(src);const warn=[...P.errors],missing=new Set(),lookups=[],nest=new Map();
  const ids=set=>{const o=[];for(const n of set){const g=gidOf(n);if(g<0)missing.add(n);else o.push(g)}return o};
  const single=pairs=>{pairs.sort((a,b)=>a[0]-b[0]);const u=[],seen=new Set();for(const p of pairs)if(!seen.has(p[0])){seen.add(p[0]);u.push(p)}
    return u.length?tblB([2,covB(u.map(p=>p[0])),u.length,...u.map(p=>p[1])]):null};
  const singlePairs=(inp,out)=>{const pr=[];if(out.length===1){const o=ids(out);if(!o.length)return pr;for(const g of ids(inp))pr.push([g,o[0]])}
    else for(let k=0;k<inp.length;k++){const a=gidOf(inp[k]),b=gidOf(out[k]);if(a<0)missing.add(inp[k]);if(b<0)missing.add(out[k]);if(a>=0&&b>=0)pr.push([a,b])}return pr};
  const ligs=list=>{const by=new Map();for(const l of list){if(!by.has(l.c[0]))by.set(l.c[0],[]);by.get(l.c[0]).push(l)}
    const firsts=[...by.keys()].sort((a,b)=>a-b);if(!firsts.length)return null;
    return tblB([1,covB(firsts),firsts.length,...firsts.map(f=>{const L=by.get(f).sort((a,b)=>b.c.length-a.c.length);return tblB([L.length,...L.map(l=>tblB([l.g,l.c.length,...l.c.slice(1)]))])})])};
  const ligList=(inp,out)=>{const o=ids(out);if(!o.length)return [];let combos=[[]];
    for(const s of inp){const g=ids(s);const nc=[];for(const c of combos)for(const x of g)nc.push([...c,x]);combos=nc;if(combos.length>2000){warn.push('Ligatur mit zu vielen Kombinationen ausgelassen');return []}}
    return combos.map(c=>({c,g:o[0]}))};
  const addLookup=(type,subs)=>{subs=subs.filter(Boolean);if(!subs.length)return -1;lookups.push({type,subs});return lookups.length-1};
  const nested=(r)=>{let key,mk;if(r.inp.length===1){const pr=singlePairs(r.inp[0],r.out[0]);key='s'+JSON.stringify(pr.sort());mk=()=>addLookup(1,[single(pr)])}
    else{const l=ligList(r.inp,r.out[0]);key='l'+JSON.stringify(l);mk=()=>addLookup(4,[ligs(l)])}
    if(!nest.has(key))nest.set(key,mk());return nest.get(key)};
  const feats=[];
  for(const tag of [...P.order].sort()){const rules=P.feats[tag]||[];const li=[];let k=0;
    while(k<rules.length){const kind=rules[k].ctx?'c':rules[k].inp.length===1?'s':'l';let j=k;
      while(j<rules.length&&(rules[j].ctx?'c':rules[j].inp.length===1?'s':'l')===kind)j++;const grp=rules.slice(k,j);k=j;let idx=-1;
      if(kind==='s')idx=addLookup(1,[single(grp.flatMap(r=>singlePairs(r.inp[0],r.out[0])))]);
      else if(kind==='l')idx=addLookup(4,[ligs(grp.flatMap(r=>ligList(r.inp,r.out[0])))]);
      else{const subs=[];for(const r of grp){const cv=s=>{const g=ids(s);return g.length?covB(g):null};
          const bt=r.bt.slice().reverse().map(cv),inp=r.inp.map(cv),la=r.la.map(cv);if([...bt,...inp,...la].some(x=>!x))continue;
          const recs=r.ign?[]:[0,(()=>{const n=nested(r);return n})()];if(!r.ign&&recs[1]<0)continue;
          subs.push({bt,inp,la,recs})}
        if(subs.some(x=>x.recs.length)){lookups.push(null);idx=lookups.length-1;
          lookups[idx]={type:6,subs:subs.map(s=>tblB([3,s.bt.length,...s.bt,s.inp.length,...s.inp,s.la.length,...s.la,s.recs.length?1:0,...s.recs]))}}}
      if(idx>=0)li.push(idx)}
    if(li.length)feats.push({tag,li})}
  if(missing.size)warn.push('Fehlende Glyphen: '+[...missing].join(' '));
  if(!feats.length)return {bytes:null,tags:[],warn,missing:[...missing],lookups:0};
  const n=feats.length,langSys=tblB([0,0xFFFF,n,...feats.map((_,k)=>k)]),script=tblB([langSys,0]);
  const scriptList=tblB([2,...tagU('DFLT'),script,...tagU('latn'),script]);
  const featureList=tblB([n,...feats.flatMap(f=>[...tagU(f.tag),tblB([0,f.li.length,...f.li])])]);
  const lookupList=tblB([lookups.length,...lookups.map(l=>tblB([l.type,0,l.subs.length,...l.subs]))]);
  return {bytes:tblB([1,0,scriptList,featureList,lookupList]),tags:feats.map(f=>f.tag),warn,missing:[...missing],lookups:lookups.length}}
//#core-end

