/* ---------- constants & state ---------- */
const UPM=1000;let ASC=800, DESC=-200, CAP=700, XH=500;
const MX0={xh:500,cap:700,asc:800,desc:-200};
function applyMx(){const m={...MX0,...((typeof S!=='undefined'&&S&&S.mx)||{})};XH=m.xh;CAP=m.cap;ASC=m.asc;DESC=m.desc}
const MARKS='`´ˆ˜¨˚¸ˇ¯˘˙˝˛';
const COMPOSE={};for(const t of 'ÀA` ÁA´ ÂAˆ ÃA˜ ÄA¨ ÅA˚ ÇC¸ ÈE` ÉE´ ÊEˆ ËE¨ ÌI` ÍI´ ÎIˆ ÏI¨ ÑN˜ ÒO` ÓO´ ÔOˆ ÕO˜ ÖO¨ ÙU` ÚU´ ÛUˆ ÜU¨ ÝY´ ŠSˇ ŽZˇ ČCˇ ĆC´ àa` áa´ âaˆ ãa˜ äa¨ åa˚ çc¸ èe` ée´ êeˆ ëe¨ ìı` íı´ îıˆ ïı¨ ñn˜ òo` óo´ ôoˆ õo˜ öo¨ ùu` úu´ ûuˆ üu¨ ýy´ ÿy¨ šsˇ žzˇ čcˇ ćc´'.split(' ')){const [c,b,m]=[...t];COMPOSE[c]=[b,m]}
const CHARSET=[...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789ßı.,:;!?-\'"()&/„“”‚‘’–—@€%+=*#',...MARKS,...Object.keys(COMPOSE)];
/* more characters: optional sets, own sets. Accented letters are built automatically from base + mark (Unicode decomposition),
   Cyrillic and Greek letters that look like Latin ones reuse the Latin drawing until drawn by hand. */
const rng=(a,b,skip=[])=>{const o=[];for(let i=a;i<=b;i++)if(!skip.includes(i))o.push(String.fromCodePoint(i));return o};
const SETS={latinx:{n:'Latein erweitert',c:[...rng(0xC0,0xFF,[0xD7,0xF7]),...rng(0x100,0x17F,[0x149]),...rng(0x218,0x21B),'ȷ','ẞ']},
  greek:{n:'Griechisch',c:[...rng(0x386,0x386),...rng(0x388,0x38A),'Ό',...rng(0x38E,0x3A9,[0x3A2]),...rng(0x3AA,0x3CE)]},
  cyrillic:{n:'Kyrillisch',c:[...rng(0x400,0x45F),'Ґ','ґ']},
  symbols:{n:'Sonderzeichen',c:[...'¡¿«»‹›…·•°§¶†‡©®™¢£¥¤ƒ$‰′″^~_|¦\\[]{}<>±×÷¬µ¼½¾¹²³ªº−≈≠≤≥∞√∂∆Ω←↑→↓✓★♥№`']}};
const MAPM={'̀':'`','́':'´','̂':'ˆ','̃':'˜','̈':'¨','̊':'˚','̧':'¸','̌':'ˇ','̄':'¯','̆':'˘','̇':'˙','̋':'˝','̨':'˛','̦':',','̣':'.'};
const BELOW='¸˛,.';
function addCompose(ch){if(COMPOSE[ch])return;const d=[...ch.normalize('NFD')];if(d.length!==2||!MAPM[d[1]])return;
  let b=d[0];if(b==='i'||b==='і')b='ı';else if(b==='j')b='ȷ';if(b===ch)return;COMPOSE[ch]=[b,MAPM[d[1]]]}
for(const k in SETS)for(const ch of SETS[k].c)addCompose(ch);
const ALIAS={};for(const t of 'АA ВB ЕE КK МM НH ОO РP СC ТT ХX ЅS ІI ЈJ аa еe оo рp сc хx уy ѕs іi јj һh ԁd ԛq ԝw ΑA ΒB ΕE ΖZ ΗH ΙI ΚK ΜM ΝN ΟO ΡP ΤT ΥY ΧX οo'.split(' ')){const [c,b]=[...t];ALIAS[c]=b}
const cleanChars=t=>{const o=[];t=String(t||'');
  t=t.replace(/U\+([0-9a-f]{2,6})\s*(?:-|–|\.\.)\s*U\+([0-9a-f]{2,6})/gi,(m,a,b)=>{const x=parseInt(a,16),y=parseInt(b,16);if(y>=x&&y-x<1000)for(let i=x;i<=y;i++)o.push(String.fromCodePoint(i));return ''});
  t=t.replace(/U\+([0-9a-f]{2,6})/gi,(m,a)=>{const x=parseInt(a,16);if(x<=0x10FFFF)o.push(String.fromCodePoint(x));return ''});
  for(const c of t)o.push(c);return [...new Set(o.filter(c=>!/[\s\p{C}]/u.test(c)&&!/\p{M}/u.test(c)))]};
function setChars(){const o=[];for(const k of S.sets||[])if(SETS[k])o.push(...SETS[k].c);for(const cs of S.csets||[])if(cs.on!==false)o.push(...cleanChars(cs.c));return o}
let ACC=null,ACK='';
function allChars(){const k=JSON.stringify([S.sets,S.csets,Object.keys(S.glyphs).length,S.names]);if(ACC&&k===ACK)return ACC;
  const sc=setChars();for(const c of sc)addCompose(c);
  ACC=[...new Set([...CHARSET,...sc,...namedChars(),...Object.keys(S.glyphs).filter(c=>c!==' '&&c!=='\n'&&hasInk(S.glyphs[c]))])];ACK=k;return ACC}
const isUp=ch=>ch!==ch.toLowerCase(),isLow=ch=>ch!==ch.toUpperCase()||ch==='ı';
const LOCAL_KEY='glyphwerk.v1';
let S=null;            // project
let active=0;          // index in text
let tool='brush',inv=false,mouseSel=false,selStroke=null,selK=new Set(),selMode='r';try{selMode=localStorage.getItem('glyphwerk.selmode')||'r'}catch(e){}
try{inv=localStorage.getItem('glyphwerk.inv')==='1'}catch(e){}
let LANG='de';try{LANG=localStorage.getItem('glyphwerk.lang')||((navigator.language||'de').toLowerCase().startsWith('de')?'de':'en')}catch(e){LANG=(navigator.language||'de').toLowerCase().startsWith('de')?'de':'en'}
