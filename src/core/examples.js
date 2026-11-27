/* ---------- example shapes ---------- */
function P(x,y,i,o,s){return {x,y,s:!!s,i:i||null,o:o||null}}
function rect(x,y,w,h){return {z:true,p:[P(x,y),P(x+w,y),P(x+w,y+h),P(x,y+h)]}}
function poly(a){const p=[];for(let k=0;k<a.length;k+=2)p.push(P(a[k],a[k+1]));return {z:true,p}}
function ellipse(cx,cy,rx,ry){const k=.5523;return {z:true,p:[
  P(cx+rx,cy,[cx+rx,cy-ry*k],[cx+rx,cy+ry*k],1),P(cx,cy+ry,[cx+rx*k,cy+ry],[cx-rx*k,cy+ry],1),
  P(cx-rx,cy,[cx-rx,cy+ry*k],[cx-rx,cy-ry*k],1),P(cx,cy-ry,[cx-rx*k,cy-ry],[cx+rx*k,cy-ry],1)]}}
