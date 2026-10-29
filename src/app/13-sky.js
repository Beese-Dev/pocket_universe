/* ---------- sky ---------- */
const sky=new THREE.Group(); sky.rotation.set(.35,0,.22); scene.add(sky);
const neb=new THREE.Mesh(new THREE.SphereGeometry(1800,48,32),new THREE.ShaderMaterial({vertexShader:VS,fragmentShader:NEB_FS,side:THREE.BackSide,depthWrite:false}));
neb.renderOrder=-2; sky.add(neb);
function starfield(n,r0,r1,size){ const P=new Float32Array(n*3),C=new Float32Array(n*3);
  const tints=[[1,1,1],[.78,.86,1],[1,.9,.74],[1,.76,.68]];
  for(let i=0;i<n;i++){ const u=rand(-1,1),th=rand(0,TAU),r=rand(r0,r1);
    const uu=Math.random()<.45?u*.25:u; const ss=Math.sqrt(1-uu*uu);
    P.set([r*ss*Math.cos(th),r*uu,r*ss*Math.sin(th)],i*3);
    const t=pick(tints),b=Math.pow(Math.random(),2.2)*.9+.1; C.set([t[0]*b,t[1]*b,t[2]*b],i*3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3)); g.setAttribute('color',new THREE.BufferAttribute(C,3));
  const pts=new THREE.Points(g,new THREE.PointsMaterial({size,map:dotTex,vertexColors:true,transparent:true,depthWrite:false,sizeAttenuation:false,blending:THREE.AdditiveBlending}));
  pts.renderOrder=-1; return pts; }
sky.add(starfield(coarse?2600:5000,1200,1600,1.7)); sky.add(starfield(coarse?260:500,1200,1600,3.4));
