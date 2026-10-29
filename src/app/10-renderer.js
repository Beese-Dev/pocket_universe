/* ---------- renderer ---------- */
const canvas=$('#c');
let renderer;
try{ renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance',logarithmicDepthBuffer:true}); }
catch(e){ document.body.insertAdjacentHTML('beforeend','<div id="fail">Your browser could not start 3D graphics. Try a recent Chrome, Safari or Firefox.</div>'); return; }
let dpr=Math.min(devicePixelRatio,coarse?1.35:2); const DPR_MAX=dpr; renderer.setPixelRatio(dpr);
renderer.setClearColor(0x05040c,1);
const scene=new THREE.Scene();
/* The universe lives inside a slowly turning galaxy. `world` holds everything the player makes, in universe coordinates;
   `galaxy` rotates about the galactic centre once every 230 Myr. */
const GC=new THREE.Vector3(-9000,0,0);
const galaxy=new THREE.Group(); galaxy.position.copy(GC); scene.add(galaxy);
const world=new THREE.Group(); world.position.copy(GC).negate(); galaxy.add(world);
function lp(o,out){ o.getWorldPosition(out); return world.worldToLocal(out); }   /* an object's position in universe coordinates */
function toWorld(v,out){ return world.localToWorld(out.copy(v)); }
const anchorLocal=new THREE.Vector3(), _ta=new THREE.Vector3(), _tb=new THREE.Vector3(), _ta2=new THREE.Vector3();
function setGalaxyRot(T){ galaxy.rotation.y=-T/2.3e8*TAU; galaxy.updateMatrixWorld(true); }
const camera=new THREE.PerspectiveCamera(50,1,.05,200000);
camera.position.set(14,46,78);
const controls=new THREE.OrbitControls(camera,canvas);
controls.enableDamping=true; controls.dampingFactor=.08;
controls.minDistance=3; controls.maxDistance=60000; controls.maxPolarAngle=Math.PI*.94;
controls.rotateSpeed=.7; controls.zoomSpeed=.9; controls.panSpeed=1.15; controls.screenSpacePanning=false; /* pan slides along the orbital plane, like pushing a map */
controls.dampingFactor=.12;
let oneFingerPan=true; try{ oneFingerPan=localStorage.getItem(STORE+'-touch')!=='spin'; }catch(e){}
function applyTouch(){ controls.touches.ONE=oneFingerPan?THREE.TOUCH.PAN:THREE.TOUCH.ROTATE; controls.touches.TWO=THREE.TOUCH.DOLLY_ROTATE; }
applyTouch();
let following=true;
const composer=new THREE.EffectComposer(renderer);
composer.addPass(new THREE.RenderPass(scene,camera));
const bloom=new THREE.UnrealBloomPass(new THREE.Vector2(coarse?192:256,coarse?192:256),0.95,.5,.92);
composer.addPass(bloom);
function resize(){ const w=innerWidth,h=innerHeight; renderer.setPixelRatio(dpr); renderer.setSize(w,h); composer.setPixelRatio&&composer.setPixelRatio(dpr); composer.setSize(w,h); camera.aspect=w/h; camera.updateProjectionMatrix(); }
/* adaptive resolution: if frames run slow for a few seconds, drop the pixel ratio a notch; creep back up when there is headroom */
let perfAcc=0, perfN=0, perfT=0;
function perfTick(dt){ perfAcc+=dt; perfN++; perfT+=dt; if(perfT<3) return; const avg=perfAcc/perfN; perfAcc=0; perfN=0; perfT=0;
  if(avg>.034&&dpr>.75){ dpr=Math.max(.75,dpr-.2); resize(); } else if(avg<.019&&dpr<DPR_MAX){ dpr=Math.min(DPR_MAX,dpr+.1); resize(); } }
addEventListener('resize',resize); resize();
