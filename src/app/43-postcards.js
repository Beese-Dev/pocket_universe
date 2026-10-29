/* ---------- postcards ---------- */
let cardBlob=null;
function wrapText(g,text,x,y,maxW,lh){ const words=text.split(' '); let line=''; for(const w of words){ const t=line?line+' '+w:w; if(g.measureText(t).width>maxW&&line){ g.fillText(line,x,y); y+=lh; line=w; } else line=t; } if(line){ g.fillText(line,x,y); y+=lh; } return y; }
function postcard(o){ if(!o) return; composer.render(); const src=renderer.domElement;
  const W=1200,H=800,c=document.createElement('canvas'); c.width=W; c.height=H; const g=c.getContext('2d');
  const sc=Math.max(W/src.width,H/src.height), dw=src.width*sc, dh=src.height*sc; g.drawImage(src,(W-dw)/2,(H-dh)/2,dw,dh);
  const gr=g.createLinearGradient(0,H*.4,0,H); gr.addColorStop(0,'rgba(6,5,13,0)'); gr.addColorStop(1,'rgba(6,5,13,.94)'); g.fillStyle=gr; g.fillRect(0,0,W,H);
  const planet=o.kind==='planet'?o:o.planet; const star=planet.star;
  g.fillStyle='#efe9f7'; g.font='italic 74px "Instrument Serif", "Iowan Old Style", Georgia, serif'; g.fillText(o.d.name,64,H-196);
  g.font='500 15px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle='#a39cbc'; try{ g.letterSpacing='0.14em'; }catch(e){}
  const kind=o.kind==='moon'?`MOON OF ${planet.d.name} · ${star.d.name}`:`${planetKind(o)} · ${(o.d.orbit/15).toFixed(2)} AU from ${star.d.name}`;
  g.fillText(kind.toUpperCase(),66,H-158); try{ g.letterSpacing='0'; }catch(e){}
  g.font='19px "Instrument Sans", system-ui, sans-serif'; g.fillStyle='#efe9f7'; let y=H-118;
  if(o.kind==='planet'){ const rows=notesFor(o).rows; for(const k of ['Mean temperature','Atmosphere','Weather','Life']){ const r=rows.find(x=>x[0]===k); if(r&&y<H-40) y=wrapText(g,`${k}: ${r[1]}`,64,y,W-128,26); } }
  else { y=wrapText(g,`Radius ${Math.round(o.d.size*1.15*6371).toLocaleString('en-US')} km · orbits ${planet.d.name} every ${moonPeriodDays(o).toFixed(1)} days.`,64,y,W-128,26); }
  g.font='500 13px "IBM Plex Mono", ui-monospace, monospace'; g.fillStyle='#a39cbc'; g.textAlign='right'; g.fillText(`STARCRADLE · T + ${fmtYears(simT).toUpperCase()}`,W-64,H-40); g.textAlign='left';
  const url=c.toDataURL('image/png'); $('#cardImg').src=url; const sv=$('#cardSave'); /* the public site has a Save button; the artifact host blocks downloads, so there it is absent */ if(sv){ sv.href=url; sv.download=`${o.d.name.replace(/[^\w-]+/g,'_')}-postcard.png`; } $('#cardMsg').textContent=sv?'':'Press and hold, or right-click, to save it.'; cardBlob=null; c.toBlob(b=>{ cardBlob=b; },'image/png'); openSheet('#cardSheet'); }
$('#cardCopy').addEventListener('click',async()=>{ const msg=$('#cardMsg'); try{ if(!cardBlob||!navigator.clipboard||!window.ClipboardItem) throw 0; await navigator.clipboard.write([new ClipboardItem({'image/png':cardBlob})]); msg.textContent='Copied to the clipboard.'; }
  catch(e){ msg.textContent='Copying is not available here. Press and hold, or right-click the image, to save it.'; } });
