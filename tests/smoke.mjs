import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
assert(js,'Inline game script exists');
new Function(js);

function fakeCtx(){
  const g={addColorStop(){}};
  return new Proxy({}, {get(target,k){
    if(k==='canvas')return {width:390,height:844};
    if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>g;
    if(k==='measureText')return ()=>({width:80});
    if(k in target)return target[k];
    return ()=>{};
  },set(target,k,v){target[k]=v;return true;}});
}
const canvas={width:390,height:844,addEventListener(){},getContext(){return fakeCtx();},setPointerCapture(){}};
const document={getElementById:()=>canvas,createElement:()=>({width:390,height:844,getContext:()=>fakeCtx()}),addEventListener(){},hidden:false};
const window={innerWidth:390,innerHeight:844,addEventListener(){},devicePixelRatio:1};
const store={getItem:()=>null,setItem(){}};
const sandbox={window,document,devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame(){},localStorage:store,console,Math,Date};
vm.createContext(sandbox);
vm.runInContext(js+'\nwindow.__unit={makeMarble,MarbleGame,getLevelConfig,CONFIG,CurvePath,STAGE_COUNT,GAUNTLET_MAP_COUNT,STAGE_MAP_IDS,ADVENTURE_LEVELS,MAP_NAMES};',sandbox,{timeout:5000});
const dbg=window.__lotusDebug,utils=window.__unit;
assert.equal(dbg.getState().scene,'title');
dbg.start(0);
assert.equal(dbg.getState().scene,'play');
assert(dbg.getState().marbles>=17);
assert(utils.getLevelConfig(0).path.length>1200);

// A target made of two coral pearls must match a fired third pearl.
const g=dbg.game();
const names=['jade','jade','coral','coral','jade','jade'];
const fakeSeg={id:10001,balls:names.map(c=>utils.makeMarble(c)),headS:530,delay:0,cause:null};
g.segments=[fakeSeg];g.meterFull=true;g.score=0;g.shotRecords.set(1223,{explosions:0,matched:false,gaps:0});
const hitS=fakeSeg.headS-(names.length-1-2)*utils.CONFIG.spacing;
const p=g.path.at(hitS),t=g.path.tangent(hitS);
g.insertProjectile({id:1223,color:'coral'}, {seg:fakeSeg,index:2,s:hitS,pos:p},p.x+t.x*7,p.y+t.y*7);
assert.equal(g.segments.length,2,'Match creates two separate segments');
assert.equal(g.segments.reduce((n,s)=>n+s.balls.length,0),4,'First match removes three coral pearls');
assert(g.score>=30,'Initial match awards points');
assert(g.flow>0,'Successful matches charge the Lotus Flow meter');
g.flow=95;g.earnFlow(10,{x:200,y:200});
assert(g.feverTime>7.5&&g.feverCount===1,'Full Flow begins a timed Lotus Fever');
const feverScore=g.score;g.addScore(100);
assert.equal(g.score-feverScore,175,'Lotus Fever adds a 1.75x score multiplier');

// Aggressive arcade modifiers: high-risk scoring and every-third-match thunder.
dbg.start(0);
const risk=dbg.game();
risk.segments=[{id:70001,balls:[utils.makeMarble('jade')],headS:risk.path.length*.84,delay:0,cause:null}];
const beforeRisk=risk.score;risk.addScore(100);
assert.equal(risk.score-beforeRisk,145,'Edge of Doom boosts points at the gate');
risk.feverTime=8;
const beforeStack=risk.score;risk.addScore(100);
assert.equal(risk.score-beforeStack,254,'Danger and Rage multipliers stack');
risk.executionCount=2;
const thunderSeg={id:70002,balls:['coral','coral','coral'].map(c=>utils.makeMarble(c)),headS:330,delay:0,cause:null};
const thunderTarget={id:70003,balls:['gold','gold','gold','gold'].map(c=>utils.makeMarble(c)),headS:450,delay:0,cause:null};
risk.segments=[thunderSeg,thunderTarget];
assert.equal(risk.resolveMatch(thunderSeg,1,70004),true);
assert.equal(risk.executionCount,3,'Third Rage match triggers thunder');
assert(risk.segments.reduce((n,s)=>n+s.balls.length,0)<4,'Thunder blast destroys additional marbles');

// Matching ends should retract toward each other and cause a cascade.
for(let i=0;i<140;i++)g.moveSegments(1/60);
assert.equal(g.segments.length,0,'Four jade pearls should explode when reconnecting');
assert(g.bestCombo>=2,'Cascade raises combo depth');

// A normal game should spawn repeatedly and reach Zuma when goal is fulfilled.
dbg.start(2);
const g2=dbg.game(),initial=g2.segments.reduce((n,s)=>n+s.balls.length,0);
dbg.advance(2.5);
assert(g2.segments.reduce((n,s)=>n+s.balls.length,0)>initial,'Marbles spawn on live track');
g2.score=g2.goal;
dbg.advance(.1);
assert(g2.meterFull,'Zuma meter fills');
assert(g2.powerEffects.reverse>0,'Filling meter triggers retreat');

// Purple spirit gifts can be collected by an actual swept projectile.
dbg.start(1);const spirit=dbg.game();spirit.segments=[];
spirit.coin={x:200,y:300,kind:'blessing',expires:100};
spirit.projectiles=[{id:99001,color:'jade',x:200,y:400,px:200,py:400,vx:0,vy:-1000,life:0,gaps:[]}];
spirit.shotRecords.set(99001,{createdAt:0});spirit.updateProjectiles(.15);
assert.equal(spirit.blessings,1,'A Spirit Gift hit activates the blessing');
assert(spirit.flow>=28&&spirit.powerEffects.slow>0,'The gift grants Flow and a temple-specific power');

// Original Deluxe structure: 13 stages with 5/6/7 rounds and the Space finale.
assert.equal(utils.STAGE_COUNT,76);
assert.equal(utils.GAUNTLET_MAP_COUNT,22);
assert.equal(utils.STAGE_MAP_IDS.length,13);
assert.deepEqual(Array.from(utils.STAGE_MAP_IDS,a=>a.length),[5,5,5,6,6,6,7,7,7,7,7,7,1]);
assert.equal(utils.getLevelConfig(75).mapName,'Space');
assert.equal(utils.getLevelConfig(75).stageLabel,'13-1');
assert.equal(new Set(Array.from(utils.ADVENTURE_LEVELS,a=>a.mapId)).size,22);
assert.equal(utils.getLevelConfig(0).colorCount,4);
assert.equal(utils.getLevelConfig(30).colorCount,5);
assert.equal(utils.getLevelConfig(75).colorCount,6);
for(let i=0;i<76;i++){
  const lv=utils.getLevelConfig(i);
  assert(lv.path.length>1000 && lv.path.length<2800,`Track ${i} has usable length`);
  for(const s of lv.path.samples){assert(s.x>22&&s.x<370&&s.y>90&&s.y<712,`Track ${i} stays visible`);}
}
const pathFingerprints=new Set();
for(let i=0;i<22;i++){
 const route=utils.getLevelConfig(i,'practice');
 assert.equal(route.mapId,i,'Gauntlet map selection is independent from adventure order');
 assert(route.path.length>1000);
 pathFingerprints.add(JSON.stringify([20,100,200,400,600].map(s=>{const p=route.path.at(s);return [Math.round(p.x),Math.round(p.y)];})));
}
assert.equal(pathFingerprints.size,22,'All 22 temple routes have distinct geometry');

// Practice finishes after the bloom meter, while Survival keeps escalating.
dbg.start(12,'practice');const practice=dbg.game();assert.equal(practice.mode,'practice');
practice.score=practice.goal;dbg.advance(.1);assert(practice.meterFull,'Practice uses finite score threshold');
dbg.start(0,'survival');const endless=dbg.game();const speed=endless.level.speed;
endless.score=endless.goal;dbg.advance(.1);
assert.equal(endless.meterFull,false,'Survival keeps spawning after each Zuma cycle');
assert(endless.level.speed>speed,'Survival increases speed at each cycle');
assert.equal(endless.gauntletRound,1,'Survival counts escalating rounds');
endless.level.colorCount=6;endless.failLife();
const resumed=dbg.game();
assert.equal(resumed.gauntletRound,1,'Survival rank survives a life loss');
assert.equal(resumed.level.colorCount,6,'Survival colors survive a life loss');
resumed.applyPower('slow',{x:195,y:310});
assert(resumed.powerEffects.slow>0,'Slowdown activates');
resumed.applyPower('reverse',{x:195,y:310});
assert(resumed.powerEffects.reverse>0,'Reverse activates');
resumed.applyPower('accuracy',{x:195,y:310});
assert(resumed.powerEffects.accuracy>0,'Accuracy activates');

// Real loss path: no firing eventually reaches the demon gate, consumes lives,
// and presents game-over rather than silently freezing or overflowing.
dbg.start(0);
dbg.advance(230);
assert.equal(dbg.getState().scene,'gameover','Unopposed advancing chain ultimately ends the run');
console.log('PASS: 76-stage campaign, 22 distinct Gauntlet tracks, Practice/Survival rules, insertion, cascades, scoring, spawning, power-ups, loss path');
