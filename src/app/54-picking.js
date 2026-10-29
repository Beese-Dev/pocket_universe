/* ---------- picking ---------- */
const ray=new THREE.Raycaster(), ndc=new THREE.Vector2(), plane=new THREE.Plane(new THREE.Vector3(0,1,0),0);
function pickAt(x,y,loose){ ndc.set(x/innerWidth*2-1,-(y/innerHeight)*2+1); ray.setFromCamera(ndc,camera); const h=ray.intersectObjects(hitTargets,false); if(h.length) return h[0].object.userData.ref;
  if(!loose) return null;
  /* nothing under the thumb: take the nearest visible object within about 26px */
  let best=null,bd=26*26; for(const t of hitTargets){ if(!t.visible||!t.parent) continue; const o=t.userData.ref; if(o.kind==='planet'&&o.smeared) continue; if(o.kind==='moon'&&!o.mesh.visible) continue;
    t.getWorldPosition(_ta); _ta.project(camera); if(_ta.z>1) continue; const px=(_ta.x*.5+.5)*innerWidth, py=(-_ta.y*.5+.5)*innerHeight; const d2=(px-x)*(px-x)+(py-y)*(py-y); if(d2<bd){ bd=d2; best=o; } }
  return best; }
function handleTap(x,y){
  const o=pickAt(x,y,coarse);
  if(probeFrom){ const from=probeFrom; probeFrom=null; setHint(); if(o&&o!==from) launchProbe(from,o); else toast('Probe stood down.'); return; }
  if(o){ if(o===sel&&o.kind==='star') growPlanet(o); else if(o===sel){ following=true; } else select(o); return; }
  const pt=new THREE.Vector3(); if(!ray.ray.intersectPlane(plane,pt)){ toast('Tilt the view down to reach open space'); return; } world.worldToLocal(pt);
  const pad=seedMode==='hole'?10:14;
  for(const s of stars){ if(pt.distanceTo(s.group.position)<outerR(s)+pad){
    if(seedMode==='hole'){ toast(`Too close to ${s.d.name}. Give it some room.`); return; }
    if(mode==='daily'&&daily&&!daily.done){ if(daily.used.stars>=DAILY_BUDGET.stars){ toast('Daily rules: two extra stars only.'); return; } daily.used.stars++; }
    if(mode==='daily'&&daily&&daily.done){ toast('This run is over.'); return; }
    formBinary(s,pt); return; } }
  for(const h of holes){ const dd=pt.distanceTo(h.group.position); if(seedMode==='hole'?dd<h.r*8+10:dd<h.r*2.4){ toast(seedMode==='hole'?`Too close to ${h.d.name}.`:`Nothing can form that close to ${h.d.name}.`); return; } }
  if(mode==='daily'&&daily&&!daily.done){ const k=seedMode==='hole'?'holes':'stars'; if(daily.used[k]>=DAILY_BUDGET[k]){ toast(seedMode==='hole'?'Daily rules: one black hole only.':'Daily rules: two extra stars only.'); return; } daily.used[k]++; }
  if(mode==='daily'&&daily&&daily.done){ toast('This run is over. Start today again, or go back to the sandbox.'); return; }
  seedMode==='hole'?plantHole(pt):plantStar(pt);
}
const pointers=new Set(); let tap=null;
canvas.addEventListener('pointerdown',e=>{ pointers.add(e.pointerId); tap=pointers.size===1?{x:e.clientX,y:e.clientY,t:performance.now(),id:e.pointerId}:null; if(soundOn){ audio(); droneStart(); } });
addEventListener('pointerup',e=>{ pointers.delete(e.pointerId);
  if(tap&&tap.id===e.pointerId&&e.button===0){ const dx=e.clientX-tap.x,dy=e.clientY-tap.y; if(dx*dx+dy*dy<70&&performance.now()-tap.t<650) handleTap(e.clientX,e.clientY); }
  tap=null; });
addEventListener('pointercancel',e=>{ pointers.delete(e.pointerId); tap=null; });
canvas.addEventListener('pointermove',e=>{ if(pointers.size||coarse) return; canvas.style.cursor=pickAt(e.clientX,e.clientY)?'pointer':'crosshair'; });
controls.addEventListener('start',()=>{ desiredDist=null; overviewTarget=null; if(eventView&&eventT>2) eventDismiss(); });
