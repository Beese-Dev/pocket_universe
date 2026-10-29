/* ---------- top bar ---------- */
function setRate(i){ rateIdx=i; ypr=i<0?0:RATES[i].y; document.querySelectorAll('[data-rate]').forEach(x=>x.setAttribute('aria-pressed',+x.dataset.rate===i)); $('#timeChipT').textContent=RATE_NAMES[i+1]; if(mobile&&!$('#timeSheet').hidden) closeSheets(); if(sel) updatePanel(); }
document.querySelectorAll('[data-rate]').forEach(b=>b.addEventListener('click',()=>setRate(+b.dataset.rate)));
document.querySelectorAll('[data-seed]').forEach(b=>b.addEventListener('click',()=>{ seedMode=b.dataset.seed; setHint();
  document.querySelectorAll('[data-seed]').forEach(x=>x.setAttribute('aria-pressed',x===b)); }));
$('#sound').addEventListener('click',()=>{ soundOn=!soundOn; $('#sound').setAttribute('aria-pressed',soundOn); $('#soundT').textContent=soundOn?'Sound on':'Sound off';
  $('#wave').style.display=soundOn?'':'none'; try{localStorage.setItem(STORE+'-sound',soundOn?'1':'0');}catch(e){}
  if(soundOn){ droneStart(); droneGain(.055); } else droneGain(0); });
let armed=false; const resetB=$('#reset'), resetNo=$('#resetNo');
function disarm(){ armed=false; resetB.classList.remove('warn'); resetB.firstChild.textContent='New universe'; resetNo.hidden=true; }
resetB.addEventListener('click',()=>{ if(!armed){ armed=true; resetB.classList.add('warn'); resetB.firstChild.textContent='Erase everything'; resetNo.hidden=false; return; }
  disarm(); clearUniverse(); toast('A blank universe. Plant your first star anywhere.'); });
resetNo.addEventListener('click',disarm);
/* frame everything that exists */
function overview(){ const pts=[...stars.map(s=>s.group.position),...holes.map(h=>h.group.position),...rogues.map(r=>r.holder.position)];
  if(!pts.length){ toast('Nothing out there yet. Plant a star.'); return; }
  const box=new THREE.Box3().setFromPoints(pts); const c=box.getCenter(new THREE.Vector3()); const size=box.getSize(new THREE.Vector3()).length();
  select(null); overviewTarget=toWorld(c,new THREE.Vector3()); desiredDist=Math.max(90,size*.75+60); }
let overviewTarget=null;
$('#overview').addEventListener('click',overview);
/* keyboard panning: arrows or WASD glide the view across the plane */
const keys={};
addEventListener('keydown',e=>{ if(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA') return; const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k)){ keys[k]=true; e.preventDefault(); } if(k==='o') overview(); if(k==='l'){ $('#atlasBtn').click(); }
  if(k==='['||k===','){ setRate(Math.max(-1,rateIdx-1)); } if(k===']'||k==='.'){ setRate(Math.min(4,rateIdx+1)); } if(k===' '){ setRate(rateIdx<0?1:-1); e.preventDefault(); } });
addEventListener('keyup',e=>{ keys[e.key.toLowerCase()]=false; });
const _fwd=new THREE.Vector3(), _right=new THREE.Vector3();
function keyPan(dt){ let x=0,z=0; if(keys.arrowup||keys.w) z+=1; if(keys.arrowdown||keys.s) z-=1; if(keys.arrowleft||keys.a) x-=1; if(keys.arrowright||keys.d) x+=1; if(!x&&!z) return;
  camera.getWorldDirection(_fwd); _fwd.y=0; if(_fwd.lengthSq()<1e-6) _fwd.set(0,0,-1); _fwd.normalize(); _right.crossVectors(_fwd,new THREE.Vector3(0,1,0));
  const sp=camera.position.distanceTo(controls.target)*1.1*dt; _fwd.multiplyScalar(z*sp); _right.multiplyScalar(x*sp); _fwd.add(_right);
  controls.target.add(_fwd); camera.position.add(_fwd); if(sel) select(null); overviewTarget=null; }
$('#homeBtn').addEventListener('click',()=>{ if(!visiting) return; visiting=false; $('#homeBtn').hidden=true; resetB.hidden=false; loadState(homeState||sample()); homeState=null; toast('Home again.'); });

function updateCounts(){ const np=stars.reduce((a,s)=>a+s.planets.length,0), nm=stars.reduce((a,s)=>a+s.planets.reduce((b,p)=>b+p.moons.length,0),0);
  const pl=(n,w)=>`${n} ${w}${n===1?'':'s'}`; $('#counts').textContent=`${pl(stars.length,'star')} · ${pl(np,'planet')} · ${pl(nm,'moon')}${holes.length?` · ${pl(holes.length,'black hole')}`:''}${rogues.length?` · ${pl(rogues.length,'rogue world')}`:''}${visiting?' · visiting':''}`; $('#clock').textContent=`T + ${fmtYears(simT)}${mode!=='daily'&&legacy>=1?` · Legacy ${Math.round(legacy).toLocaleString('en-US')}`:''}`; }
