/* ---------- effects ---------- */
function burst(pos,col,n,spd,size){ if(reduce) n=Math.ceil(n/4);
  const P=new Float32Array(n*3),V=new Float32Array(n*3);
  for(let i=0;i<n;i++){ P.set([pos.x,pos.y,pos.z],i*3); const v=new THREE.Vector3(rand(-1,1),rand(-1,1),rand(-1,1)).normalize().multiplyScalar(spd*rand(.25,1)); V.set([v.x,v.y,v.z],i*3); }
  const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.BufferAttribute(P,3));
  const m=new THREE.PointsMaterial({color:col.clone().multiplyScalar(1.6),size,map:dotTex,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  const pts=new THREE.Points(g,m); world.add(pts);
  effects.push({t:0,life:1.8,step(dt){ for(let i=0;i<P.length;i++){ P[i]+=V[i]*dt; V[i]*=1-dt*1.6; } g.attributes.position.needsUpdate=true; m.opacity=1-Math.pow(this.t/this.life,2); },
    done(){ world.remove(pts); g.dispose(); m.dispose(); }});
}
function shock(pos,col,maxR){ if(reduce) return;
  const m=new THREE.MeshBasicMaterial({color:col.clone().multiplyScalar(1.4),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});
  const r=new THREE.Mesh(new THREE.RingGeometry(.92,1,128),m); r.rotation.x=-Math.PI/2; r.position.copy(pos); world.add(r);
  effects.push({t:0,life:1.6,step(){ const k=easeOut(this.t/this.life); r.scale.setScalar(.1+k*maxR); m.opacity=(1-k)*.9; }, done(){ world.remove(r); r.geometry.dispose(); m.dispose(); }});
}
function flash(pos,maxR){ const m=new THREE.SpriteMaterial({map:glowTex,color:0xfff4e0,blending:THREE.AdditiveBlending,depthWrite:false,transparent:true});
  const sp=new THREE.Sprite(m); sp.position.copy(pos); world.add(sp);
  effects.push({t:0,life:3.2,step(){ const k=this.t/this.life; sp.scale.setScalar(4+easeOut(Math.min(1,k*2.5))*maxR); m.opacity=k<.15?k/.15:1-(k-.15)/.85; }, done(){ world.remove(sp); m.dispose(); }});
}
const marker=new THREE.Mesh(new THREE.RingGeometry(1,1.04,128),new THREE.MeshBasicMaterial({color:0xffc98a,transparent:true,opacity:.7,depthWrite:false,side:THREE.DoubleSide}));
marker.visible=false; scene.add(marker);
