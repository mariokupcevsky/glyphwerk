/* ---------- kerning ---------- */
function autoKern(a,b){
  const A=gm(a),B=gm(b);if(!A||!B||A.empty||B.empty)return 0;
  const D2=.25*CAP,T=25;let sa=0,sb=0,sab=0,n=0,minG=Infinity;
  for(let k=0;k<ROWS;k++){const r=A.pr.R[k],l=B.pr.L[k],va=!isNaN(r),vb=!isNaN(l);if(!va&&!vb)continue;
    const ga=va?A.adv-(r+A.dx):D2,gb=vb?l+B.dx:D2;if(va&&vb)minG=Math.min(minG,ga+gb);
    const ca=Math.min(D2,ga),cb=Math.min(D2,gb);
    sa+=Math.exp(-ca/T);sb+=Math.exp(-cb/T);sab+=Math.exp(-(ca+cb)/T);n++}
  if(!n)return 0;const sm=x=>-T*Math.log(x/n);
  let k=Math.min(0,(S.strength/100)*(sm(sa)+sm(sb)-sm(sab)));
  const clear=.3*S.spacing;if(isFinite(minG)&&minG+k<clear)k=clear-minG;
  k=Math.max(-250,Math.min(150,k));k=Math.round(k/5)*5;return Math.abs(k)<10?0:k}
const kernKey=(a,b)=>a+b;
/* three levels, like Glyphs: 1 spacing (sidebearings, every neighbour), 2 groups (glyphs with the same side shape share kerning), 3 pairs (exceptions) */
function kernInfo(a,b){if(S.mono)return {v:0,src:'m'};const A=baseOf(a),B=baseOf(b);for(const k of [a+b,A+b,a+B,A+B])if(k in S.kern)return {v:S.kern[k],src:'p'};
  const gk=S.gkern&&S.gkern[gkKey(a,b)];if(gk!=null)return {v:gk,src:'g'};return {v:autoKern(a,b),src:'a'}}
function kernOf(a,b){return kernInfo(a,b).v}
const gkKey=(a,b)=>grpOf(a,'r')+'|'+grpOf(b,'l');
let GC=null;const GPRI='HOnoaAVTvsxe';
function sideSig(m,side,ch){const hi=isLow(kc(ch))?XH:CAP,D=.2*hi,v=[];
  for(let k=0;k<ROWS;k++){const y=rowY(k);if(y<0||y>hi)continue;const q=side==='l'?m.pr.L[k]-m.b.x0:m.b.x1-m.pr.R[k];v.push(isNaN(q)?1:Math.min(D,q)/D)}return v}
function autoGroups(){if(GC)return GC;GC={l:{},r:{}};
  const kind=c=>/\p{Ll}/u.test(c)?'lo':/\p{Lu}|\d/u.test(c)?'up':'x';
  const chars=allChars().filter(c=>!COMPOSE[c]&&!PARTS[c]&&!ALIAS[c]&&!MARKS.includes(c)).sort((x,y)=>{const a=GPRI.indexOf(x),b=GPRI.indexOf(y);return (a<0?99:a)-(b<0?99:b)});
  for(const side of ['l','r']){const leaders=[];
    for(const c of chars){const m=gm(c);if(!m||m.empty)continue;const sg=sideSig(m,side,c),kd=kind(c);let best=null,bd=.12;
      if(kd!=='x')for(const L of leaders){if(L.kd!==kd||L.sg.length!==sg.length)continue;let d=0;for(let i=0;i<sg.length;i++)d+=Math.abs(sg[i]-L.sg[i]);d/=sg.length||1;if(d<bd){bd=d;best=L}}
      if(best)GC[side][c]=best.c;else{leaders.push({c,sg,kd});GC[side][c]=c}}}
  return GC}
function grpOf(ch,side){const o=S.groups&&S.groups[ch];if(o&&o[side])return o[side];
  const b=baseOf(ch);if(b!==ch)return grpOf(b,side);if(PARTS[ch]){const ps=PARTS[ch];return grpOf(ps[side==='l'?0:ps.length-1][0],side)}
  return autoGroups()[side][ch]||ch}
function grpMembers(name,side){return allChars().filter(c=>{const m=gm(c);return m&&!m.empty&&grpOf(c,side)===name})}

