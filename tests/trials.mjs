import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const fakeCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});if(k in t)return t[k];return ()=>{};},set(t,k,v){t[k]=v;return true;}});
const canvas={width:390,height:844,getContext:fakeCtx,addEventListener(){}};
const store=new Map();
const window={innerWidth:390,innerHeight:844,addEventListener(){}};
const sandbox={window,document:{getElementById:()=>canvas,createElement:()=>({getContext:fakeCtx}),addEventListener(){}},localStorage:{getItem:k=>store.get(k),setItem:(k,v)=>store.set(k,v)},requestAnimationFrame(){},performance:{now:()=>0},devicePixelRatio:1,console,Math,Date};
vm.createContext(sandbox);vm.runInContext(source+'\nwindow.__trials={makeMarble,getLevelConfig,weeklyTrial,save};',sandbox);
const debug=window.__lotusDebug,{makeMarble,getLevelConfig,weeklyTrial,save}=window.__trials;
const match=(g,color='coral')=>{const seg={id:97001,balls:[0,1,2].map(()=>makeMarble(color)),headS:430,delay:0,cause:null};g.segments=[seg];assert(g.resolveMatch(seg,1,97002));};

// Match impacts freeze motion briefly while the Sprint timer keeps running.
debug.start(0,'challenge');
const freeze=debug.game(),headBefore=freeze.segments[0].headS;
vm.runInContext('hitPause=.05;update(.02)',sandbox);
assert.equal(freeze.segments[0].headS,headBefore,'Impact pause holds the chain');
assert(freeze.timeLeft<180,'Impact pause does not grant extra Sprint time');
vm.runInContext('update(.04);update(.02)',sandbox);
assert(freeze.segments[0].headS>headBefore,'Chain motion resumes after the impact pause');

debug.start(0,'challenge');let g=debug.game();
assert.equal(g.lives,1);match(g);assert.equal(g.multiplier,1.5);
const before=g.score;g.addScore(100);assert.equal(g.score-before,150,'Sprint multiplier changes earned points');
g.score=g.goal+1;g.update(.1);assert.equal(g.meterFull,false,'Sprint continues after the classic score target');
g.stageTime=7;g.update(.5);assert(g.multiplier<1.5,'Multiplier fades after an idle streak');
g.stageTime=179.95;g.update(.1);assert.equal(debug.getState().scene,'trialResults');assert(g.trialWon);assert.equal(g.timeLeft,0);assert(save.trialBest.challenge>0);

// Pause freezes the clock because the scene loop no longer advances gameplay.
debug.start(0,'challenge');g=debug.game();vm.runInContext("scene='pause';update(2)",sandbox);assert.equal(g.timeLeft,180);
g.segments[0].headS=g.path.length;g.update(.01);assert.equal(debug.getState().scene,'trialResults');assert.equal(g.trialWon,false);

const week=weeklyTrial(new Date('2026-10-22T12:00:00Z'));
assert.equal(week.key,'2026-10-19');assert.equal(weeklyTrial(new Date('2026-10-25T22:00:00Z')).seed,week.seed);assert.notEqual(weeklyTrial(new Date('2026-10-26T12:00:00Z')).seed,week.seed);
debug.start(weeklyTrial().mapId,'weekly');g=debug.game();const opening=JSON.stringify(g.segments[0].balls.map(b=>b.color));
debug.start(weeklyTrial().mapId,'weekly');g=debug.game();assert.equal(JSON.stringify(g.segments[0].balls.map(b=>b.color)),opening,'Weekly openings repeat');g.addScore(500);g.stageTime=180;g.update(.01);assert.equal(save.weeklyBest[g.weekKey],500);

debug.start(0,'iron');g=debug.game();assert.equal(g.lives,1);g.addScore(345);g.victory();debug.start(1,'iron');g=debug.game();assert.equal(g.cumulativeScore,345,'Iron score carries between rounds');assert.equal(g.lives,1);assert.equal(g.level.mapId,2);
g.segments[0].headS=g.path.length;g.update(.01);assert.equal(debug.getState().scene,'trialResults');assert(g.failed);assert.equal(g.lives,0,'Iron has no life retry');assert.equal(save.ironBestRound,1);
debug.start(9,'iron');g=debug.game();g.victory();assert.equal(save.ironBestRound,10,'The tenth clear completes the endurance run');

debug.start(30,'heroic');g=debug.game();assert.equal(g.level.colorCount,6);assert(g.level.speed>getLevelConfig(30).speed);assert(g.goal>getLevelConfig(30).goal);g.addScore(200);g.failLife();g=debug.game();assert.equal(g.mode,'heroic');assert.equal(g.lives,2);assert.equal(g.cumulativeScore,200);g.victory();assert.equal(save.heroicUnlocked,32);debug.start(31,'heroic');assert.equal(debug.game().lives,2,'Heroic carries lives into the next level');

debug.start(0,'boss');g=debug.game();
const fireAtSpirit=(color)=>{const b=g.boss,id=98000+g.shots++;g.projectiles=[{id,color,x:b.x,y:b.y+70,px:b.x,py:b.y+70,vx:0,vy:-1000,life:0,gaps:[]}];g.updateProjectiles(.1);};
g.segments=[];const hp=g.boss.health;fireAtSpirit(g.boss.color);assert.equal(g.boss.health,hp,'Closed shield absorbs a shot');
match(g);assert(g.boss.open>0,'A real chain match opens the shield');g.segments=[];
fireAtSpirit(g.boss.color==='jade'?'coral':'jade');assert.equal(g.boss.health,hp,'Spirit requires its displayed color');
fireAtSpirit(g.boss.color);assert.equal(g.boss.health,hp-1);assert.equal(g.boss.open,0,'A spirit hit closes the shield');
g.boss.open=3;g.coin={x:g.boss.x,y:g.boss.y+65,kind:'coin',expires:100};const coinHp=g.boss.health;fireAtSpirit(g.boss.color);assert.equal(g.boss.health,coinHp,'A nearer collectible takes the projectile before the spirit');assert.equal(g.coin,null);
assert.equal(g.lineCircle(0,0,20,0,0,0,10),0,'A shot starting inside a target hits immediately');

// A chain in front of the spirit must take the projectile first.
g.boss.open=3;g.boss.x=198;g.boss.y=220;
const oldPath=g.path;g.path={at:()=>({x:198,y:270}),tangent:()=>({x:0,y:1})};g.segments=[{id:99001,balls:[makeMarble('jade')],headS:100,delay:0}];const blockedHp=g.boss.health;fireAtSpirit(g.boss.color);assert.equal(g.boss.health,blockedHp,'Nearer chain blocks the spirit');assert.equal(g.segments[0].balls.length,2);
g.path=oldPath;g.segments=[];while(g.boss.health>0){g.boss.open=3;fireAtSpirit(g.boss.color);}assert.equal(debug.getState().scene,'trialResults');assert(g.trialWon);const duelScore=g.cumulativeScore;debug.start(1,'boss');assert.equal(debug.game().cumulativeScore,duelScore);assert.equal(debug.game().level.world,1);
assert(JSON.parse(store.get('lotus-naga-save-v2')).trialBest.boss>0,'Trial records persist to storage');
// Enemy casts have a warning, then actual moving projectile blockers and chain pressure.
for(let round=0;round<4;round++){
 debug.start(round,'boss');g=debug.game();g.update(2.6);assert(g.boss.windup>0);assert.equal(g.boss.wards.length,0,'Warning gives the player time to react');g.update(1.3);assert(g.boss.wards.length>=3);assert.equal(g.boss.attacks,1);assert(g.boss.pressure>0);const w=g.boss.wards[0],x=w.x;g.update(.2);assert.notEqual(w.x,x,'Wards move through firing lanes');
 for(const ward of g.boss.wards)assert(Math.hypot(ward.x-g.frog.x,ward.y-g.frog.y)>=89.9,'Enemy wards leave the loaded orb and creature visible');
 g.segments=[];g.coin=null;g.level={...g.level,gates:[],tunnels:[],cover:[],shotStyle:'normal'};const shieldHp=g.boss.health,wardCount=g.boss.wards.length;
 const shootWard=color=>{g.projectiles=[{id:98100,color,x:w.x,y:w.y+65,px:w.x,py:w.y+65,vx:0,vy:-1000,life:0,gaps:[]}];g.updateProjectiles(.08);};
 shootWard(w.color==='coral'?'jade':'coral');assert.equal(g.boss.wards.length,wardCount,'Wrong-color shot is absorbed');assert.equal(g.projectiles.length,0);assert.equal(g.boss.health,shieldHp,'The ward really stands between player and enemy');shootWard(w.color);assert.equal(g.boss.wards.length,wardCount-1);assert.equal(g.boss.brokenWards,1);assert.equal(g.boss.pressure,0,'Countering a ward relieves pressure');assert(g.boss.open>0,'Counter creates a damage opening');
 match(g);assert(g.boss.wards.length>0,'Regular clears open the enemy while wards still interfere');match(g);assert.equal(g.boss.wards.length,0);assert.equal(g.boss.windup,0,'A cascade interrupts the entire attack');assert(g.boss.open>=3.5);
}
debug.start(0,'boss');g=debug.game();g.segments=[{id:98101,balls:[makeMarble('jade')],headS:700,delay:0}];g.boss.pressure=2;let head=g.segments[0].headS;g.moveSegments(.2);assert(Math.abs(g.segments[0].headS-head-g.level.speed*1.28*.2)<.01,'Enemy pressure affects actual chain speed');
debug.start(0,'boss');g=debug.game();g.update(2.6);g.update(1.3);g.active=g.boss.wards[0].color;g.segments=[];const wardTargets=g.boss.wards.filter(w=>w.color===g.active).length;assert(g.inhale(),'Inhale counters matching wards even without a chain target');assert.equal(g.boss.wards.filter(w=>w.color===g.active).length,0);assert.equal(g.score,75*wardTargets);assert.equal(g.shots,0,'A ward inhale never fires a projectile');
console.log('PASS: trials, progression, four telegraphed enemy patterns, moving ward collision/color counters, real chain pressure, interruptible attacks, saved records');
