/* minimal ZIP (stored), because .otf is not an allowed download type */
const CRCT=(()=>{const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
function crc32(b){let c=0xFFFFFFFF;for(let i=0;i<b.length;i++)c=CRCT[(c^b[i])&255]^(c>>>8);return (c^0xFFFFFFFF)>>>0}
function zipStore(files){const out=[],cd=[];const l16=(a,v)=>a.push(v&255,(v>>>8)&255),l32=(a,v)=>{l16(a,v&65535);l16(a,v>>>16)};
  for(const f of files){const nm=asciiBytes(f.name),crc=crc32(f.data),off=out.length;
    l32(out,0x04034b50);l16(out,20);l16(out,0);l16(out,0);l16(out,0);l16(out,0x21);l32(out,crc);l32(out,f.data.length);l32(out,f.data.length);l16(out,nm.length);l16(out,0);
    out.push(...nm);for(const b of f.data)out.push(b);
    l32(cd,0x02014b50);l16(cd,20);l16(cd,20);l16(cd,0);l16(cd,0);l16(cd,0);l16(cd,0x21);l32(cd,crc);l32(cd,f.data.length);l32(cd,f.data.length);l16(cd,nm.length);
    l16(cd,0);l16(cd,0);l16(cd,0);l16(cd,0);l32(cd,0);l32(cd,off);cd.push(...nm)}
  const cdo=out.length;for(const b of cd)out.push(b);l32(out,0x06054b50);l16(out,0);l16(out,0);l16(out,files.length);l16(out,files.length);l32(out,cd.length);l32(out,cdo);l16(out,0);
  return new Uint8Array(out)}
function asciiBytes(s){return [...s].map(c=>c.charCodeAt(0)<128?c.charCodeAt(0):95)}
function assemble(T,cff){
  const tags=Object.keys(T).sort();const n=tags.length;const out=new W();
  const sr=16*2**Math.floor(Math.log2(n));out.u32(cff?0x4F54544F:0x10000);out.u16(n);out.u16(sr);out.u16(Math.floor(Math.log2(n)));out.u16(16*n-sr);
  let off=12+16*n;const recs=[];
  for(const t of tags){const d=T[t].slice();while(d.length%4)d.push(0);let sum=0;for(let i=0;i<d.length;i+=4)sum=(sum+((d[i]<<24)|(d[i+1]<<16)|(d[i+2]<<8)|d[i+3]))>>>0;
    recs.push({t,sum,off,len:T[t].length,d});off+=d.length}
  for(const r of recs){out.tag(r.t.padEnd(4,' '));out.u32(r.sum);out.u32(r.off);out.u32(r.len)}
  for(const r of recs)out.bytes(r.d);
  const a=out.a;let tot=0;for(let i=0;i<a.length;i+=4)tot=(tot+((a[i]<<24)|(a[i+1]<<16)|(a[i+2]<<8)|a[i+3]))>>>0;
  const adj=(0xB1B0AFBA-tot)>>>0;const ho=recs.find(r=>r.t==='head').off+8;
  a[ho]=adj>>>24;a[ho+1]=(adj>>>16)&255;a[ho+2]=(adj>>>8)&255;a[ho+3]=adj&255;
  return new Uint8Array(a)}
