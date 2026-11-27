/* CFF (PostScript outlines, cubic like the editor) */
function csNum(v){v=Math.round(v);if(v>=-107&&v<=107)return [v+139];if(v>=108&&v<=1131){v-=108;return [(v>>8)+247,v&255]}
  if(v>=-1131&&v<=-108){v=-v-108;return [(v>>8)+251,v&255]}return [28,(v>>8)&255,v&255]}
function csData(cs,dx,adv){
  const o=[];let first=true,cx=0,cy=0,np=0;const X=v=>Math.round(v+dx),Y=v=>Math.round(v);
  const op=(args,code)=>{if(first){if(adv)args=[adv,...args];first=false}for(const a of args)o.push(...csNum(a));o.push(code)};
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(const c0 of cs){const c=revC(c0);const p0=c.p[0];let x=X(p0.x),y=Y(p0.y);op([x-cx,y-cy],21);cx=x;cy=y;
    for(const [a,b] of segs(c)){const bx=X(b.x),by=Y(b.y);np++;
      if(isCurve(a,b)){const [c1,c2]=ctrl(a,b);const ax=X(c1[0]),ay=Y(c1[1]),qx=X(c2[0]),qy=Y(c2[1]);op([ax-cx,ay-cy,qx-ax,qy-ay,bx-qx,by-qy],8)}
      else op([bx-cx,by-cy],5);cx=bx;cy=by}}
  op([],14);
  let bb=null;if(cs.length){const b=bounds(cs);bb={x0:Math.floor(b.x0+dx),y0:Math.floor(b.y0),x1:Math.ceil(b.x1+dx),y1:Math.ceil(b.y1)}}
  return {bytes:o,bb,np,nc:cs.length}}
function cffIndex(items){if(!items.length)return [0,0];const tot=items.reduce((s,a)=>s+a.length,0)+1;
  const os=tot<256?1:tot<65536?2:tot<16777216?3:4;const o=[items.length>>8,items.length&255,os];
  const put=v=>{for(let k=os-1;k>=0;k--)o.push((v>>>(8*k))&255)};let off=1;put(off);for(const a of items){off+=a.length;put(off)}
  for(const a of items)for(const b of a)o.push(b);return o}
function dInt(v){v=Math.round(v);if(v>=-32768&&v<=32767&&!(v>=-1131&&v<=1131))return [28,(v>>8)&255,v&255];return v>=-1131&&v<=1131?csNum(v):dInt5(v)}
function dInt5(v){return [29,(v>>>24)&255,(v>>>16)&255,(v>>>8)&255,v&255]}
function buildCFF(ps,fam,glyphNames,charstrings,gl){
  const asc=s=>[...s].map(c=>c.charCodeAt(0)<128?c.charCodeAt(0):63);
  const strings=[fam,fam,...glyphNames];const sid=i=>391+i;
  const bbs=gl.filter(g=>g.bb).map(g=>g.bb);const bb=[Math.min(...bbs.map(b=>b.x0)),Math.min(...bbs.map(b=>b.y0)),Math.max(...bbs.map(b=>b.x1)),Math.max(...bbs.map(b=>b.y1))];
  const nameI=cffIndex([asc(ps)]),strI=cffIndex(strings.map(asc)),gsub=cffIndex([]);
  const charset=[0];glyphNames.forEach((_,i)=>{const v=sid(2+i);charset.push(v>>8,v&255)});
  const csI=cffIndex(charstrings);const priv=[...dInt(0),20,...dInt(0),21];
  const top=o=>[...dInt(sid(0)),2,...dInt(sid(1)),3,...bb.flatMap(dInt),5,...dInt5(o.cs0),15,...dInt5(o.cs),17,...dInt(priv.length),...dInt5(o.pv),18];
  const topLen=cffIndex([top({cs0:0,cs:0,pv:0})]).length;
  const oc=4+nameI.length+topLen+strI.length+gsub.length,ocs=oc+charset.length,opv=ocs+csI.length;
  return [1,0,4,4,...nameI,...cffIndex([top({cs0:oc,cs:ocs,pv:opv})]),...strI,...gsub,...charset,...csI,...priv]}
