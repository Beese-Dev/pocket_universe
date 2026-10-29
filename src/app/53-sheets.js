/* ---------- sheets: discoveries + share ---------- */
function openSheet(id){ closeSheets(); $(id).hidden=false; }
function closeSheets(){ document.querySelectorAll('.sheet').forEach(s=>s.hidden=true); }
document.querySelectorAll('.sheet').forEach(s=>{ s.addEventListener('click',e=>{ if(e.target===s) closeSheets(); }); s.querySelector('[data-close]').addEventListener('click',closeSheets); });
$('#discBtn').addEventListener('click',()=>{ renderDisc(); openSheet('#discSheet'); });
$('#overview').addEventListener('click',()=>{ if(mobile) closeSheets(); });
$('#shareBtn').addEventListener('click',async()=>{ tourFlags.share=true; openSheet('#shareSheet'); $('#copyMsg').textContent=''; $('#visitMsg').textContent=''; $('#shareOut').value='Packing your universe…'; $('#shareOut').value=await encode(serialize()); });
$('#copyBtn').addEventListener('click',async()=>{ const ta=$('#shareOut'); try{ await navigator.clipboard.writeText(ta.value); $('#copyMsg').textContent='Copied.'; }
  catch(e){ ta.focus(); ta.select(); $('#copyMsg').textContent='Select the code and copy it.'; } });
$('#visitBtn').addEventListener('click',async()=>{ const code=$('#shareIn').value.trim(); const msg=$('#visitMsg'); if(mode==='daily'){ msg.textContent='Leave the daily run before visiting.'; return; } if(!code){ msg.textContent='Paste a code first.'; return; }
  let st=null; try{ st=await decode(code); }catch(e){} if(!st||!Array.isArray(st.stars)){ msg.textContent='That code did not unpack. Check it was copied whole.'; return; }
  if(!visiting){ homeState=serialize(); visiting=true; } $('#homeBtn').hidden=false; resetB.hidden=true; disarm();
  loadState(st); closeSheets(); $('#shareIn').value=''; toast(`Visiting a shared universe: ${st.stars.length} star${st.stars.length===1?'':'s'}. Changes here are not saved.`); });

function b64u(bytes){ let s=''; for(let i=0;i<bytes.length;i+=0x8000) s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000)); return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,''); }
function unb64u(str){ str=str.replace(/-/g,'+').replace(/_/g,'/'); while(str.length%4) str+='='; const bin=atob(str); const out=new Uint8Array(bin.length); for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i); return out; }
async function encode(obj){ const bytes=new TextEncoder().encode(JSON.stringify(obj));
  if(window.CompressionStream){ try{ const cs=new CompressionStream('deflate-raw'); const w=cs.writable.getWriter(); w.write(bytes); w.close();
    const buf=new Uint8Array(await new Response(cs.readable).arrayBuffer()); return 'PU1.'+b64u(buf); }catch(e){} }
  return 'PU0.'+b64u(bytes); }
async function decode(code){ code=code.replace(/\s+/g,''); const i=code.indexOf('.'); const tag=code.slice(0,i), body=unb64u(code.slice(i+1));
  if(tag==='PU1'){ const ds=new DecompressionStream('deflate-raw'); const w=ds.writable.getWriter(); w.write(body); w.close(); return JSON.parse(await new Response(ds.readable).text()); }
  if(tag==='PU0') return JSON.parse(new TextDecoder().decode(body)); throw new Error('bad tag'); }
