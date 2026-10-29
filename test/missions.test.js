import { test } from 'node:test';
import assert from 'node:assert/strict';
import { draw, isDone, describe, isStale, tierFor, classesForTier, featureUnlocked } from '../src/lib/missions.js';

const ctx=()=>({ stars:[{id:'s1',name:'Ossira',cls:'G',binary:false,bound:false,disc:true,planets:[{id:'p1',name:'Ossira b',type:'lava',rings:false,moons:0,stage:0,alive:false,inHZ:false}]}],
  holes:0, rogues:0, found:{}, legacy:0, counts:{supernovae:0,evacuated:0,massiveMade:0,tde:0,xray:0}, flags:{renamed:false,rateMax:1,arrivals:[],survived:[],captured:0,merged:0} });

test('tier 0 draws three missions about the live universe', () => {
  const ms=draw(ctx(),0,[],[],3,()=>0.5);
  assert.equal(ms.length,3);
  for(const m of ms){ assert.equal(m.tier,0); assert.ok(describe(m).length>5); }
});
test('missions complete when the universe changes', () => {
  const c=ctx(); const [m]=draw(c,0,[],['plant','ocean-hz','rename','fast','three-planets'],1,()=>0);
  assert.equal(m.id,'moon'); assert.equal(isDone(c,m),false);
  c.stars[0].planets[0].moons=1; assert.equal(isDone(c,m),true);
});
test('a mission about a vanished world is stale', () => {
  const c=ctx(); const m={id:'moon',q:{planet:'p1',planetName:'Ossira b'}}; assert.equal(isStale(c,m),false);
  c.stars[0].planets=[]; assert.equal(isStale(c,m),true);
});
test('tiers and unlocks', () => {
  assert.equal(tierFor(0),0); assert.equal(tierFor(3),1); assert.equal(tierFor(9),3); assert.equal(tierFor(30),3);
  assert.deepEqual(classesForTier(0),['G','K','M']); assert.ok(classesForTier(2).includes('O'));
  assert.equal(featureUnlocked('holes',1),false); assert.equal(featureUnlocked('holes',2),true); assert.equal(featureUnlocked('moons',0),true);
});
test('higher tiers fall back to lower-tier missions when their pool is empty', () => {
  const doneT3=['spacefaring','evacuate','massive','tde','xray','legacy'];
  const ms=draw(ctx(),3,[],doneT3,2,()=>0.1);
  assert.equal(ms.length,2); assert.ok(ms.every(m=>m.tier<3));
});

test('missions follow a body through a rename', () => {
  const c=ctx(); const [m]=draw(c,0,[],['plant','ocean-hz','rename','fast','three-planets'],1,()=>0);
  assert.equal(m.id,'moon'); assert.match(describe(m,c),/Ossira b/);
  c.stars[0].planets[0].name='Kepler'; assert.equal(isStale(c,m),false); assert.match(describe(m,c),/Kepler/);
  c.stars[0].planets[0].moons=1; assert.equal(isDone(c,m),true);
  c.stars[0].planets=[]; assert.equal(isStale(c,m),true);
});
