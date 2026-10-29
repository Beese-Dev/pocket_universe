const $=s=>document.querySelector(s);
const coarse=matchMedia('(pointer: coarse)').matches;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let RNG=Math.random; /* swapped for a seeded generator while building the daily universe */
const rand=(a,b)=>a+(b-a)*RNG();
const pick=a=>a[Math.floor(RNG()*a.length)];
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const easeOut=t=>1-Math.pow(1-t,3);
const easeBack=t=>{const c1=1.9,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);};
const TAU=Math.PI*2;
let uidN=0; const newUid=()=>(Date.now().toString(36)+(uidN++).toString(36)+Math.random().toString(36).slice(2,5));
const STORE='pocket-universe-v1';

if(!window.THREE){ document.body.insertAdjacentHTML('beforeend','<div id="fail">The 3D engine did not load. Check your connection and reload the page.</div>'); return; }
