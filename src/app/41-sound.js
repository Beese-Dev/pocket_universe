/* ---------- sound ---------- */
let ac=null, soundOn=true, drone=null, droneRoot=110, nextTick=0;
function audio(){ try{ ac=ac||new (window.AudioContext||window.webkitAudioContext)(); if(ac.state==='suspended') ac.resume(); }catch(e){ ac=null; } return ac; }
/* each star class has its own voice: blue stars rasp, white stars ring, yellow and orange stars hum, red dwarfs rumble */
const TIMBRE={O:['sawtooth',2600,.3],B:['sawtooth',2200,.32],A:['triangle',1900,.7],F:['triangle',1600,.75],G:['sine',1400,1],K:['sine',1100,1],M:['sine',800,1.1],P:['square',3000,.25],D:['triangle',2400,.6],hole:['sine',300,1.2]};
function chime(f,dur,gain,cls){ if(!soundOn) return; const a=audio(); if(!a) return; const t=a.currentTime; const [wave,cut,amp]=TIMBRE[cls]||['sine',1600,1];
  const filt=a.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=cut; filt.connect(a.destination);
  const parts=[[1,1],[1.5,.5],[2.005,.35],[3.01,.12]]; if(cls==='M'||cls==='K') parts.push([.5,.5]);
  parts.forEach(([mul,g])=>{ const o=a.createOscillator(),v=a.createGain(); o.type=wave; o.frequency.value=f*mul;
    v.gain.setValueAtTime(0,t); v.gain.linearRampToValueAtTime(gain*g*amp,t+.03); v.gain.exponentialRampToValueAtTime(.0001,t+dur*(1-mul*.08));
    o.connect(v).connect(filt); o.start(t); o.stop(t+dur+.1); }); }
function boom(k,pos){ if(!soundOn) return; const a=audio(); if(!a) return; const t=a.currentTime, len=3.5;
  if(pos){ const dist=camera.position.distanceTo(toWorld(pos,_tb)); k*=clamp(350/Math.max(dist,1),.1,1); } /* quieter the further away it happens */
  const buf=a.createBuffer(1,a.sampleRate*len,a.sampleRate), ch=buf.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*Math.pow(1-i/ch.length,2.2);
  const src=a.createBufferSource(); src.buffer=buf; const f=a.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(1800,t); f.frequency.exponentialRampToValueAtTime(80,t+len);
  const g=a.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(.5*k,t+.08); g.gain.exponentialRampToValueAtTime(.0001,t+len);
  src.connect(f).connect(g).connect(a.destination); src.start(t);
  const o=a.createOscillator(),og=a.createGain(); o.frequency.setValueAtTime(90,t); o.frequency.exponentialRampToValueAtTime(28,t+2.5); og.gain.setValueAtTime(.4*k,t); og.gain.exponentialRampToValueAtTime(.0001,t+2.8); o.connect(og).connect(a.destination); o.start(t); o.stop(t+3); }
function tick(){ const a=audio(); if(!a) return; const t=a.currentTime; const o=a.createOscillator(),g=a.createGain(); o.type='square'; o.frequency.value=1400;
  g.gain.setValueAtTime(.025,t); g.gain.exponentialRampToValueAtTime(.0001,t+.04); o.connect(g).connect(a.destination); o.start(t); o.stop(t+.05); }
/* the ambient drone: five detuned voices through a slowly breathing low-pass filter */
function droneStart(){ const a=audio(); if(!a||drone) return; const t=a.currentTime;
  const master=a.createGain(); master.gain.setValueAtTime(0,t); master.gain.linearRampToValueAtTime(.055,t+4);
  const filt=a.createBiquadFilter(); filt.type='lowpass'; filt.frequency.value=520; filt.Q.value=.8;
  const lfo=a.createOscillator(); lfo.frequency.value=.045; const lg=a.createGain(); lg.gain.value=260; lfo.connect(lg).connect(filt.frequency); lfo.start();
  const voices=[[1,'sine',.55],[1.003,'sine',.3],[1.5,'triangle',.11],[2.004,'sine',.2],[.5,'sine',.4]].map(([mul,type,amp],i)=>{
    const o=a.createOscillator(); o.type=type; o.frequency.value=droneRoot*mul; const g=a.createGain(); g.gain.value=amp;
    const l=a.createOscillator(); l.frequency.value=.03+i*.017; const lg2=a.createGain(); lg2.gain.value=amp*.45; l.connect(lg2).connect(g.gain); l.start();
    o.connect(g).connect(filt); o.start(); return {o,mul}; });
  filt.connect(master).connect(a.destination); drone={master,voices,filt}; }
function droneSet(root,cls){ if(!drone||!ac) return; droneRoot=root; const t=ac.currentTime; drone.voices.forEach(v=>v.o.frequency.setTargetAtTime(root*v.mul,t,1.6)); const tb=TIMBRE[cls]; if(tb) drone.filt.frequency.setTargetAtTime(tb[1]*.4,t,2.5); }
function droneGain(g){ if(!drone||!ac) return; drone.master.gain.setTargetAtTime(g,ac.currentTime,.8); }
