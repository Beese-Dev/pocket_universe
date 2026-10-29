/* ---------- discoveries ---------- */
const DISC=[
  ['rocky','Rocky world','Grow planets in the middle orbits'],['ocean','Ocean world','Temperate orbits, with luck'],['gas','Gas giant','The outer orbits of any star'],
  ['lava','Lava world','The innermost orbits'],['ice','Ice world','The far edge of a system'],['scorched','Scorched world','A planet that survived a supernova'],
  ['ringed','Ringed planet','Common on gas giants and ice worlds'],['moon','Moon','Add a moon to any planet'],
  ['O','O-class star','Blue giant. Rare, and short-lived'],['B','B-class star','Blue-white. Burns out in minutes'],['A','A-class star','White'],['F','F-class star','Yellow-white'],
  ['G','G-class star','Yellow dwarf, like the Sun'],['K','K-class star','Orange dwarf'],['M','M-class star','Red dwarf, the most common'],
  ['binary','Binary pair','Keep planting stars; some arrive in pairs'],['supernova','Supernova','Watch a blue giant reach the end of its life'],['pulsar','Pulsar','What a supernova leaves behind'],
  ['comet','Comet','Wait and watch'],['hole','Black hole','Switch Plant to Black hole'],
  ['core','Stripped core','A gas giant with its atmosphere blasted off'],['rogue','Rogue world','A planet flung loose when its star lost its mass'],['captured','Captured world','A rogue world caught by a neighbouring star'],
  ['bound','Bound system','A star caught in orbit around a black hole'],['tde','Tidal disruption','Plant a star very close to a black hole'],['xray','X-ray binary','A star close enough to a black hole to feed it'],['consumed','Consumed star','A donor star drained to nothing'],['giant','Red giant','Let a star reach the end of its main sequence'],['whitedwarf','White dwarf','What a Sun-like star leaves behind'],['nebula','Planetary nebula','The shell a dying giant sheds'],['collapse','Stellar black hole','A star over 20 solar masses collapses'],['locked','Tidally locked world','A planet hugging its star'],['probe','First probe','Launch a probe from any planet'],['impact','Comet impact','Wait for a comet to find a world'],['sungrazer','Sungrazer','A comet that falls into its star'],['extinction','Mass extinction','A living world struck by a comet'],
];
let found={}; try{ found=JSON.parse(localStorage.getItem(STORE+'-disc')||'{}')||{}; }catch(e){}
function discover(k){ if(found[k]) return; found[k]=1; try{ localStorage.setItem(STORE+'-disc',JSON.stringify(found)); }catch(e){}
  const d=DISC.find(x=>x[0]===k); setTimeout(()=>toast(`Discovery · ${d?d[1]:k}`,true),900); renderDisc(); }
function renderDisc(){ const n=DISC.filter(d=>found[d[0]]).length; $('#discN').textContent=`${n}/${DISC.length}`; $('#discBar').style.width=(n/DISC.length*100)+'%';
  $('#discP').textContent=n===DISC.length?'You have seen everything this universe can make. For now.':`${n} of ${DISC.length} found. Unfound entries carry a hint.`;
  $('#discGrid').innerHTML=DISC.map(([k,name,hint])=>`<div class="${found[k]?'on':''}"><b>${found[k]?name:'?'}</b><small>${hint}</small></div>`).join(''); }
