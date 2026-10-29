/* ---------- comets ---------- */
let nextComet=rand(1,4), lastCometReal=-99;
function spawnComet(s){
  const grazer=Math.random()<.18; const e=rand(.93,.985), q=grazer?rand(s.T.r*.2,s.T.r*.8):rand(innerR(s)*.8,outerR(s)*.9), a=q/(1-e), Rmax=outerR(s)+rand(28,45);
  const cosMax=(a*(1-e*e)/Rmax-1)/e; if(cosMax<=-1||cosMax>=1) return;
  const thMax=Math.acos(cosMax);
  const quat=new THREE.Quaternion().setFromEuler(new THREE.Euler(Math.random()<.75?rand(-.08,.08):rand(-.6,.6),rand(0,TAU),0));
  const N=56, P=new Float32Array(N*3), C=new Float32Array(N*3);
  for(let i=0;i<N;i++){ const k=Math.pow(1-i/N,1.8); C.set([k,k*.95,k*.85],i*3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
  const trail=new THREE.Points(g,new THREE.PointsMaterial({size:1.1,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  const M=22, P2=new Float32Array(M*3), C2=new Float32Array(M*3);
  for(let i=0;i<M;i++){ const k=Math.pow(1-i/M,1.4)*.8; C2.set([k*.55,k*.8,k],i*3); }
  const g2=new THREE.BufferGeometry(); g2.setAttribute('position',new THREE.BufferAttribute(P2,3)); g2.setAttribute('color',new THREE.BufferAttribute(C2,3));
  const ion=new THREE.Points(g2,new THREE.PointsMaterial({size:1.5,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  const head=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xdff2ff,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true})); head.scale.setScalar(2.6);
  world.add(trail,ion,head);
  const c={star:s,a,e,th:-thMax,thMax,quat,trail,ion,head,P,P2,N,M,filled:0,pos:new THREE.Vector3(),mu:GM_UNITS*s.d.mass,
    dispose(){ world.remove(trail,ion,head); g.dispose(); g2.dispose(); }};
  comets.push(c); toast(`A comet is falling through ${s.d.name}`); discover('comet');
}
const _v=new THREE.Vector3(), _w=new THREE.Vector3();
function stepComet(c,dy){
  const p=c.a*(1-c.e*c.e), r=p/(1+c.e*Math.cos(c.th)); const h=Math.sqrt(c.mu*p);
  c.th+=Math.min(h/(r*r)*dy,.5); if(c.th>c.thMax) return false;
  const rr=p/(1+c.e*Math.cos(c.th));
  _v.set(rr*Math.cos(c.th),0,rr*Math.sin(c.th)).applyQuaternion(c.quat).add(c.star.group.position);
  if(holes.length){ for(const hh of holes){ if(_v.distanceTo(hh.group.position)<hh.r*1.6){ burst(_v,new THREE.Color(1,.8,.6),60,6,.6); return false; } } }
  c.pos.copy(_v); c.head.position.copy(_v);
  if(dy>0){ const s=c.star; const sr=(s.d.binary&&s.d.cls!=='P'&&s.d.cls!=='D'?s.d.binary.sep/2:0)+s.T.r*(s.giantF||1)*1.05;
    if(_v.distanceTo(s.group.position)<sr){ sungraze(c,s); return false; }
    for(const p of s.planets){ lp(p.holder,_w); if(_v.distanceTo(_w)<p.d.size*1.9+.7){ impact(c,p,_w); return false; } } }
  if(dy>0){ const P=c.P; for(let i=c.N-1;i>0;i--){ P[i*3]=P[i*3-3]; P[i*3+1]=P[i*3-2]; P[i*3+2]=P[i*3-1]; } P[0]=_v.x; P[1]=_v.y; P[2]=_v.z;
    if(c.filled<c.N){ c.filled++; for(let i=c.filled;i<c.N;i++){ P[i*3]=_v.x; P[i*3+1]=_v.y; P[i*3+2]=_v.z; } } c.trail.geometry.attributes.position.needsUpdate=true; }
  _w.copy(_v).sub(c.star.group.position); const dist=_w.length(); _w.normalize();
  const len=clamp(40/dist,.2,1.4)*16; const P2=c.P2;
  for(let i=0;i<c.M;i++){ const k=i/c.M; P2[i*3]=_v.x+_w.x*len*k+(Math.random()-.5)*k*1.2; P2[i*3+1]=_v.y+(Math.random()-.5)*k*1.2; P2[i*3+2]=_v.z+_w.z*len*k+(Math.random()-.5)*k*1.2; }
  c.ion.geometry.attributes.position.needsUpdate=true;
  c.head.scale.setScalar(1.6+clamp(30/dist,0,1.6)); return true;
}
