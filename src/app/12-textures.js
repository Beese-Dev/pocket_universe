/* ---------- textures ---------- */
function radialTex(stops,size){ const c=document.createElement('canvas'); c.width=c.height=size; const g=c.getContext('2d');
  const gr=g.createRadialGradient(size/2,size/2,0,size/2,size/2,size/2); stops.forEach(([o,a])=>gr.addColorStop(o,`rgba(255,255,255,${a})`));
  g.fillStyle=gr; g.fillRect(0,0,size,size); return new THREE.CanvasTexture(c); }
const glowTex=radialTex([[0,1],[.1,.85],[.24,.36],[.5,.09],[1,0]],256);
const dotTex=radialTex([[0,1],[.3,.85],[1,0]],64);
