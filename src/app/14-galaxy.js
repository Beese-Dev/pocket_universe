/* ---------- the galaxy ---------- */
function buildGalaxy(){ const N=coarse?15000:26000, P=new Float32Array(N*3), C=new Float32Array(N*3); let i=0;
  const put=(x,y,z,r,g,b)=>{ P[i*3]=x; P[i*3+1]=y; P[i*3+2]=z; C[i*3]=r; C[i*3+1]=g; C[i*3+2]=b; i++; };
  const phase=-7.7; /* puts one arm through the player's corner of the galaxy */
  while(i<N*.62){ const th=rand(0,3.6*Math.PI), r=600*Math.exp(.35*th); if(r>15000) continue; const arm=Math.random()<.5?0:Math.PI;
    const sc=r*.11*(Math.random()+Math.random()-1), ang=th+phase+arm; const rr=r+sc;
    const hot=Math.random()<.08; const b=rand(.35,1)*(hot?1.2:1);
    put(rr*Math.cos(ang)+rand(-200,200),rand(-1,1)*rand(0,60)*(1+r/5000),rr*Math.sin(ang)+rand(-200,200),hot?b*1.1:b*.82,hot?b*.55:b*.86,hot?b*.6:b); }
  while(i<N*.77){ const r=Math.abs(rand(-1,1)+rand(-1,1))*900, ang=rand(0,TAU), b=rand(.5,1.2); put(r*Math.cos(ang),rand(-1,1)*rand(0,250),r*Math.sin(ang),b,b*.85,b*.6); }
  while(i<N){ const r=Math.sqrt(Math.random())*14000, ang=rand(0,TAU), b=rand(.15,.5); put(r*Math.cos(ang),rand(-1,1)*rand(0,120),r*Math.sin(ang),b*.9,b*.9,b); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
  const mat=new THREE.PointsMaterial({size:70,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,opacity:0});
  const pts=new THREE.Points(g,mat); pts.renderOrder=-1; galaxy.add(pts);
  const core=new THREE.Sprite(new THREE.SpriteMaterial({map:glowTex,color:0xffe2b0,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true,opacity:0})); core.scale.setScalar(5000); galaxy.add(core);
  return {mat,core}; }
const GAL=buildGalaxy();
function galaxyFade(){ const d=camera.position.distanceTo(controls.target); const k=clamp((d-1200)/3500); GAL.mat.opacity=k*.9; GAL.core.material.opacity=k*.6; GAL.mat.visible=GAL.core.visible=k>0; }
