/* ---------- template font ---------- */
const TPL_FONTS=[['Inter','Inter (Grotesk)'],['IBM Plex Sans','IBM Plex Sans'],['Archivo','Archivo'],['EB Garamond','EB Garamond (Antiqua)'],['Playfair Display','Playfair Display'],['Caveat','Caveat (Handschrift)'],['system-ui','Systemschrift']];
let tplFont='Inter',tplReady=false;const capRatio={};const tplLoaded=new Set(['system-ui']);
try{tplFont=localStorage.getItem('glyphwerk.tpl')||'Inter';if(tplFont.startsWith('Eigene'))tplFont='Inter'}catch(e){}
function tplCss(){return tplFont==='system-ui'?'system-ui,-apple-system,sans-serif':`"${tplFont}",system-ui,sans-serif`}
async function setTplFont(f){tplFont=f;try{localStorage.setItem('glyphwerk.tpl',f)}catch(e){}
  if(!tplLoaded.has(f)&&!f.startsWith('Eigene')){const l=document.createElement('link');l.rel='stylesheet';l.href=`https://fonts.googleapis.com/css2?family=${encodeURIComponent(f).replace(/%20/g,'+')}:wght@400&display=swap`;document.head.append(l);tplLoaded.add(f)}
  try{await document.fonts.load(`400 100px ${tplCss()}`,'HxÄg')}catch(e){}
  delete capRatio[f];draw();if(!document.getElementById('sheetSet').hidden)renderGrid()}
function tplSize(){if(!capRatio[tplFont]){const c=document.createElement('canvas').getContext('2d');c.font=`400 1000px ${tplCss()}`;const m=c.measureText('H');capRatio[tplFont]=(m.actualBoundingBoxAscent||700)/1000}
  return CAP/capRatio[tplFont]}

