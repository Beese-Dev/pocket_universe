/* ---------- the clock: one simulated time, in years ---------- */
const RATES=[{y:1/365.25,l:'a day per second'},{y:1/12,l:'a month per second'},{y:1,l:'a year per second'},{y:1e3,l:'a thousand years per second'},{y:1e6,l:'a million years per second'}];
let rateIdx=1, ypr=RATES[1].y, simT=0;
/* slow motion around stellar events: at kyr/s and Myr/s the clock eases to 20% so the moment can be watched */
let slowOn=true; try{ slowOn=localStorage.getItem(STORE+'-slow')!=='0'; }catch(e){}
let slowK=1, slowHold=0, slowReason=null, slowAnnounced=null;
function slowEvent(label){ if(ypr<1e3||!slowOn) return; slowHold=8; slowReason=label; }
/* the event camera: fly to the event, frame it, remember where the player was */
let eventView=null, eventKey=null, eventT=0;
function focusEvent(obj,label,key){ if(!slowOn||!obj) return; if(key&&eventKey===key) return; eventKey=key||label;
  if(pointers.size) { toast(label); return; } /* never yank the view out of someone's hand */
  if(!eventView) eventView={target:controls.target.clone(),cam:camera.position.clone(),sel};
  eventT=0; select(obj,false); following=true;
  desiredDist=obj.kind==='star'?Math.max(30,outerR(obj)*1.7+12):obj.kind==='hole'?obj.r*10:obj.kind==='planet'?(obj.d.size*8+6):20;
  $('#eventTxt').textContent=label; $('#eventBar').hidden=false; }
function eventReturn(){ const v=eventView; eventView=null; eventKey=null; $('#eventBar').hidden=true; if(!v) return;
  const ok=v.sel&&hitTargets.includes(v.sel.hit); select(ok?v.sel:null,false); following=ok;
  overviewTarget=v.target.clone(); desiredDist=v.cam.distanceTo(v.target); }
function eventDismiss(){ eventView=null; eventKey=null; $('#eventBar').hidden=true; }
function eventSoon(){ if(ypr<1e3||!slowOn) return null; const win=ypr*2.5;
  for(const s of stars){ const L=lifetime(s); if(isFinite(L)){ const G=L*.1, a=s.d.age, massive=primaryMass(s)>=8;
      if(a<L&&L-a<win) return {s,what:`${s.d.name} is about to swell into a red ${massive?'supergiant':'giant'}`};
      if(a>=L&&L+G-a<win) return {s,what:massive?(primaryMass(s)>20?`${s.d.name} is about to collapse`:`${s.d.name} is about to go supernova`):`${s.d.name} is about to shed its outer layers`}; }
    if(feeding(s)&&(s.d.mass-.08)/transferRate(s,s.boundHole)<win) return {s,what:`${s.d.name} is about to be swallowed`};
    const mi=mergeIn(s); if(mi<win) return {s,what:`${s.d.name}'s two stars are about to merge`}; }
  return null; }
function realAt(y){ return ypr>0?` · ${fmtReal(y/ypr)} at this speed`:''; }
function mergeIn(s){ const b=s.d.binary; if(!b||s.d.cls==='P'||s.d.cls==='D') return Infinity; const T=mergeTimeYears(b.sep,s.T.r,STAR_TYPES[b.cls].r,!!s.d.bound); return isFinite(T)?T-(s.d.age-(b.since||0)):Infinity; }
function primaryMass(s){ return s.d.binary?Math.max(.1,s.d.mass-STAR_TYPES[s.d.binary.cls].m):s.d.mass; }
function lifetime(s){ const c=s.d.cls; if(c==='P'||c==='D') return Infinity; return lifetimeYears(primaryMass(s)); }
function moonPeriodYears(p,md){ return moonPeriodYearsLib(p.d,md); }
const TYPE_CODE={rocky:0,ocean:1,gas:2,lava:3,ice:4};
const TYPE_LABEL={rocky:'Rocky world',ocean:'Ocean world',gas:'Gas giant',lava:'Lava world',ice:'Ice world'};
const PALETTES={
  rocky:[['#1d3b5e','#6b8e4e','#c9b38a'],['#5a3a24','#c2793f','#e8c48a'],['#3a1d14','#8c3b22','#d08a5a'],['#20184a','#5a3f8c','#c39be0'],['#173f3a','#4f7d5a','#bfc79a']],
  ocean:[['#0b2a55','#1f6f9a','#c9b27a'],['#06323a','#13827f','#e0d7a6'],['#14194d','#3550a8','#9fb987']],
  gas:[['#c99a62','#f1dfbb','#8a4d2c'],['#5a7fb8','#c9dcf0','#2c3f73'],['#b46f8c','#f0c6c0','#5b2f4f'],['#7fa38a','#dfe8c8','#3d5c4d'],['#d9b25a','#fff0c2','#a0582a']],
  lava:[['#1c0e0a','#ff6a1a','#ffb35a'],['#120a12','#ff3d2e','#ff9a5a'],['#160d06','#ffa21f','#ffe08a']],
  ice:[['#d7e8f2','#7fb0cf','#ffffff'],['#e2e0f5','#9a95d0','#ffffff'],['#d8f0ec','#6fb9b0','#ffffff']],
};
const ATMO={rocky:'#7cb8ff',ocean:'#6fb2ff',lava:'#ff7b3d',ice:'#bfe6ff'};
const SYL=['ka','vel','or','sa','thi','mor','an','el','ri','zu','nae','os','tar','ly','qua','ven','ix','ar','eth','ul','sor','pha','do','mi','ra','ne','cy','lo','bre','is','ka','tem'];
function makeName(R=RNG){ let n=''; const k=R()<.6?2:3; for(let i=0;i<k;i++) n+=SYL[Math.floor(R()*SYL.length)]; return n.charAt(0).toUpperCase()+n.slice(1); }
function jitter(hex){ const c=new THREE.Color(hex); c.offsetHSL(rand(-.025,.025),rand(-.06,.06),rand(-.035,.035)); return '#'+c.getHexString(); }
const ROMAN=['I','II','III','IV','V'];
