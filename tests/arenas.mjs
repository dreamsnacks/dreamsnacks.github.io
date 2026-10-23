import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const source=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8').match(/<script>([\s\S]*?)<\/script>/)[1];
const fakeCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>({addColorStop(){}});if(k in t)return t[k];return ()=>{};},set(t,k,v){t[k]=v;return true;}});
const pointer={},keyboard={},canvas={width:390,height:844,getContext:fakeCtx,addEventListener:(type,fn)=>pointer[type]=fn,setPointerCapture(){}};
const window={innerWidth:390,innerHeight:844,addEventListener(){}};
const sandbox={window,document:{getElementById:()=>canvas,createElement:()=>({getContext:fakeCtx}),addEventListener:(type,fn)=>keyboard[type]=fn},localStorage:{getItem:()=>null,setItem(){}},requestAnimationFrame(){},performance:{now:()=>0},devicePixelRatio:1,console,Math,Date};
vm.createContext(sandbox);vm.runInContext(source+'\nwindow.unit={getLevelConfig,courseClearance,makeMarble,lineRectT,CONFIG,COLOR};',sandbox);
const debug=window.__lotusDebug,{getLevelConfig,courseClearance,makeMarble,CONFIG,COLOR}=window.unit;
const {lineRectT}=window.unit;
const key=key=>keyboard.keydown({key,preventDefault(){}});
const touch=(type,x,y)=>pointer[type]({pointerId:82,pointerType:'touch',clientX:x,clientY:y,preventDefault(){}});
const tap=(x,y)=>{touch('pointerdown',x,y);touch('pointerup',x,y);};
const motions=new Set(),positions=new Set();let shutters=0,bridges=0,minLength=Infinity,maxLength=0;
for(let i=0;i<22;i++){
 const l=getLevelConfig(i,'practice');motions.add(l.motion);positions.add(`${l.launcher.x},${l.launcher.y}`);minLength=Math.min(minLength,l.path.length);maxLength=Math.max(maxLength,l.path.length);shutters+=l.gates.length;bridges+=l.tunnels.length;
 assert(courseClearance(l.path,l.launcher)>=59,`Arena ${i} leaves room for launcher and large pearls`);
 for(const pad of l.pads)assert(courseClearance(l.path,pad)>=59,`Arena ${i} pads clear the track`);
 if(l.rail){const axis=l.motion==='horizontal'?'x':'y';for(let t=l.railBounds[0];t<=l.railBounds[1];t+=5)assert(courseClearance(l.path,{...l.launcher,[axis]:t})>=58,`Arena ${i} rail stays clear`);}
 for(const tunnel of l.tunnels){const a=l.path.at(tunnel.s),b=l.path.at(tunnel.over);assert(Math.hypot(a.x-b.x,a.y-b.y)<2,'Tunnel joins actual track crossing');assert(tunnel.over-tunnel.s>120);}
 for(let j=0;j<l.path.samples.length;j++){const p=l.path.samples[j];assert(p.x>22&&p.x<370&&p.y>90&&p.y<712);}
}
assert.deepEqual([...motions].sort(),['fixed','hop','horizontal','vertical']);assert(positions.size>=12,'Launchers vary between arenas');assert(maxLength/minLength>2,'Short pressure tracks and long mazes have different travel times');assert(shutters>=8&&bridges>=2);
assert.deepEqual([0,1,2,3,4].map(i=>getLevelConfig(i).motion),['fixed','horizontal','hop','vertical','fixed']);
// Straight runs are a different topology from the opening coil.
const coil=getLevelConfig(0),steps=getLevelConfig(2);const straightShare=l=>{let count=0,total=0;for(let s=25;s<l.path.length-25;s+=10){const a=l.path.tangent(s-15),b=l.path.tangent(s+15);total++;if(Math.abs(a.x-b.x)+Math.abs(a.y-b.y)<.004)count++;}return count/total;};
assert(straightShare(steps)>.60);assert(straightShare(steps)>straightShare(coil)*1.5);
// Pad taps and the dedicated button move the launcher without firing.
debug.start(2,'practice');let game=debug.game();const old={...game.frog},other=game.level.pads[1];tap(other.x,other.y);assert.equal(game.padIndex,1);assert(game.hopTween>0);assert.equal(game.shots,0);assert.equal(game.fire(),false,'No firing from an invisible destination mid-hop');game.update(.34);assert.equal(game.hopTween,0);assert.equal(game.frog.x,other.x);assert.equal(game.frog.y,other.y);assert(game.fire());game.fireCooldown=0;tap(239,784);assert.equal(game.padIndex,0);game.update(.34);assert.equal(game.frog.x,old.x);key('j');assert.equal(game.padIndex,1);game.update(.34);key('Tab');assert.equal(game.padIndex,0);
// Dragging and keys respect each rail's direction and bounds.
for(const [map,axis,k] of [[1,'x','ArrowRight'],[5,'y','ArrowDown']]){debug.start(map,'practice');game=debug.game();const start=game.frog[axis];key(k);assert(game.frog[axis]>start);touch('pointerdown',game.frog.x,game.frog.y);touch('pointermove',380,700);touch('pointerup',380,700);assert.equal(game.frog[axis],game.level.railBounds[1]);assert.equal(game.shots,0);}
// A closed gate absorbs the same shot that matches when the gate opens.
const shotAt=(g,p,id)=>{g.projectiles=[{id,color:'coral',x:p.x,y:p.y+85,px:p.x,py:p.y+85,vx:0,vy:-1000,life:0,gaps:[]}];g.shotRecords.set(id,{createdAt:0});g.updateProjectiles(.1);};
debug.start(3,'practice');game=debug.game();const gate=game.level.gates[0];game.segments=[{id:88801,balls:[makeMarble('coral')],headS:gate.s,delay:0}];assert(game.hiddenAt(gate.s));shotAt(game,gate.p,88802);assert.equal(game.hits,0);assert.equal(game.projectiles.length,0);assert.equal(game.segments[0].balls.length,1);game.stageTime=3;assert(!game.hiddenAt(gate.s));shotAt(game,gate.p,88803);assert.equal(game.hits,1);assert.equal(game.segments[0].balls.length,2);
// The underground branch is protected, while the visible overpass can be hit.
debug.start(7,'practice');game=debug.game();const tunnel=game.level.tunnels[0];assert(game.hiddenAt(tunnel.s));assert(!game.hiddenAt(tunnel.over));game.segments=[{id:88901,balls:[makeMarble('coral')],headS:tunnel.s,delay:0}];shotAt(game,tunnel.p,88902);assert.equal(game.hits,0);assert.equal(game.projectiles.length,0);game.segments=[{id:88903,balls:[makeMarble('coral')],headS:tunnel.over,delay:0}];shotAt(game,tunnel.p,88904);assert.equal(game.hits,1);
// The enlarged visible loaded pearl is exactly where shots begin.
debug.start(0);game=debug.game();game.angle=.63;const muzzle=game.shotOrigin();assert.equal(CONFIG.ammoRadius,22);assert(Math.abs(Math.hypot(muzzle.x-game.frog.x,muzzle.y-game.frog.y)-48)<.001);game.fire();assert.equal(game.projectiles[0].x,muzzle.x);assert.equal(game.projectiles[0].y,muzzle.y);assert.equal(new Set(Object.values(COLOR).map(c=>c.texture)).size,6);assert.equal(new Set(Object.values(COLOR).map(c=>c.symbol)).size,6);

// Bank shots sweep the reflected leg, and paper doors never sweep across the teleport gap.
const testProjectile=(g,x,y,vx,vy,id=99111)=>{const p={id,color:'coral',x,y,px:x,py:y,vx,vy,life:0,gaps:[]};g.projectiles=[p];g.shotRecords.set(id,{createdAt:0});return p;};
debug.start(4,'practice');game=debug.game();assert.equal(game.level.shotStyle,'mirror');game.path={at:()=>({x:320,y:228}),tangent:()=>({x:1,y:0})};game.segments=[{id:99112,balls:[makeMarble('jade')],headS:100,delay:0}];let projectile=testProjectile(game,330,320,1000,-1000);game.updateProjectiles(.15);assert.equal(projectile.bounces,1);assert(projectile.vx<0);assert.equal(game.hits,1,'Reflected trajectory can hit a marble after bouncing');
debug.start(6,'practice');game=debug.game();assert.equal(game.level.shotStyle,'wrap');game.path={at:()=>({x:50,y:300}),tangent:()=>({x:1,y:0})};game.segments=[{id:99113,balls:[makeMarble('jade')],headS:100,delay:0}];projectile=testProjectile(game,350,300,1000,0);game.updateProjectiles(.1);assert.equal(projectile.bounces,1);assert(projectile.vx>0);assert.equal(game.hits,1,'A shot can hit the far side after passing through a door');
game.hits=0;game.path.at=()=>({x:200,y:300});game.segments=[{id:99114,balls:[makeMarble('jade')],headS:100,delay:0}];testProjectile(game,350,300,1000,0);game.updateProjectiles(.1);assert.equal(game.hits,0,'A door does not collide with marbles between the two edges');assert.equal(game.projectiles.length,1);assert(Math.abs(game.projectiles[0].x-98)<.001);
// Inhale consumes up to six of the loaded color; other colors and protected orbs remain.
debug.start(0);game=debug.game();game.active='coral';game.segments=[{id:99115,balls:[...Array(8).fill('coral'),'jade','jade'].map(c=>makeMarble(c)),headS:900,delay:0}];tap(44,784);assert.equal(game.dreamCharge,0);assert.equal(game.shots,0);assert.equal(game.currentColors().get('coral'),2);assert.equal(game.currentColors().get('jade'),2);assert(game.inhaleTime>0);assert(game.retreatLeft>=100);assert.equal(game.inhale(),false,'The ability needs recharging');
debug.start(7,'practice');game=debug.game();game.active='coral';game.segments=[{id:99116,balls:[makeMarble('coral')],headS:game.level.tunnels[0].s,delay:0}];assert.equal(game.inhale(),false);assert.equal(game.dreamCharge,100,'Protected underground marbles cannot waste the charge');
// A clear kicks the chain back by more than two pearl diameters; larger combos kick harder.
debug.start(0);game=debug.game();game.dreamCharge=0;let seg={id:99117,balls:['coral','coral','coral','jade','gold','azure'].map(c=>makeMarble(c)),headS:950,delay:0};game.segments=[seg];assert(game.resolveMatch(seg,1,99118));assert.equal(game.dreamCharge,28);const head=game.segments[0].headS;for(let i=0;i<30;i++)game.moveSegments(1/60);assert(head-game.segments[0].headS>70,'A basic match gives visible retreat');assert.equal(game.retreatLeft,0);game.pushBack(6,3);assert(game.retreatLeft>140,'Large cascades have stronger knockback');
// Slow and Lucid mode cannot weaken reverse, and no new chain is spawned during retreat.
debug.start(0);game=debug.game();game.segments=[{id:99119,balls:['coral','jade','azure','gold','coral','jade','azure','gold'].map(c=>makeMarble(c)),headS:1000,delay:0}];game.powerEffects.reverse=3.5;game.powerEffects.slow=6;game.feverTime=8;const size=game.segments[0].balls.length;for(let i=0;i<60;i++)game.update(1/60);assert(Math.abs(game.segments[0].headS-895)<.01,'Reverse travels 105 pixels in one second even with slow and Lucid active');assert.equal(game.segments[0].balls.length,size,'Retreat pauses spawning');

// Every gap pulls its front section back, even when the two colors differ.
debug.start(0);game=debug.game();game.segments=[{id:99500,balls:[makeMarble('coral'),makeMarble('jade')],headS:300,delay:0,cause:null},{id:99501,balls:[makeMarble('gold'),makeMarble('azure')],headS:500,delay:0,cause:null}];game.moveSegments(.1);assert.equal(game.segments[0].headS,300,'Rear chain never lunges forward into a gap');assert(game.segments[1].headS<482,'Front chain rolls backward across nonmatching colors');for(let i=0;i<70;i++)game.update(1/60);assert.equal(game.segments.length,1,'Differently colored ends still form a solid chain');assert.equal(game.segments[0].balls.length,4);assert(game.segments[0].headS<400,'Gap closure gives back actual track distance');
// Authored launch positions change which targets can be reached around solid cover.
let coverArenas=0,meaningfulPositions=0;
for(let mapId=0;mapId<22;mapId++){
 const l=getLevelConfig(mapId,'practice');if(!l.cover.length)continue;coverArenas++;
 const axis=l.motion==='horizontal'?'x':'y',poses=l.motion==='hop'?l.pads:l.railBounds.map(v=>({...l.launcher,[axis]:v}));
 for(const r of l.cover){assert(courseClearance(l.path,{x:r.x+r.w/2,y:r.y+r.h/2})>=29,'Cover never sits on the marble course');}
 let fixture=null;
 for(let ss=60;ss<l.path.length-45;ss+=65){const target=l.path.at(ss),hits=poses.map(p=>l.cover.some(r=>lineRectT(p.x,p.y,target.x,target.y,r,CONFIG.radius*.8)!==null));if(hits[0]!==hits[1]){fixture={ss,target,hits};break;}}
 assert(fixture,`Arena ${mapId} has a target visible from one launch position and covered from the other`);meaningfulPositions++;
 // The very same target and launch angle are swept through real projectile collision.
 for(let i=0;i<2;i++){debug.start(mapId,'practice');game=debug.game();game.frog={...poses[i]};game.level={...game.level,gates:[],tunnels:[],shotStyle:'normal'};game.segments=[];game.path={at:()=>fixture.target,tangent:()=>({x:1,y:0}),length:2000};game.segments=[{id:88000,balls:[makeMarble('jade')],headS:fixture.ss,delay:0}];game.aim(fixture.target);game.fire();game.updateProjectiles(.6);assert.equal(game.hits,fixture.hits[i]?0:1,`Cover physics depend on position in arena ${mapId}`);assert.equal(game.projectiles.length,0);}
}
assert(coverArenas>=10,'Moving arenas have genuine cover decisions');assert.equal(meaningfulPositions,coverArenas);
// Movement strip clamps both axes and never fires or swaps when released.
for(const [mapId,axis] of [[1,'x'],[5,'y']]){debug.start(mapId,'practice');game=debug.game();const active=game.active,next=game.next;touch('pointerdown',105,738);touch('pointermove',288,738);touch('pointerup',288,738);assert.equal(game.frog[axis],game.level.railBounds[1]);assert.equal(game.shots,0);assert.equal(game.active,active);assert.equal(game.next,next);touch('pointerdown',105,738);touch('pointerup',105,738);assert.equal(game.frog[axis],game.level.railBounds[0]);}
debug.start(2,'practice');game=debug.game();tap(288,738);assert.equal(game.padIndex,1);assert.equal(game.shots,0);
// Cleanup must expose the last orbs even when repeated clears keep queuing recoil.
debug.start(0);game=debug.game();game.meterFull=true;game.segments=[{id:99600,balls:Array.from({length:13},()=>makeMarble('jade')),headS:99,delay:0}];const tailBefore=99-12*CONFIG.spacing;for(let i=0;i<90;i++){game.retreatLeft=CONFIG.spacing*7;game.moveSegments(1/60);}assert(game.segments[0].headS-12*CONFIG.spacing>tailBefore+35,'Final wave emerges instead of remaining pinned at the entrance');game.active='pearl';game.next='orchid';game.update(1/60);assert.equal(game.active,'jade');assert.equal(game.next,'jade','Cleanup ammo never supplies a color that is already gone');
console.log(`PASS: 22 arenas, ${coverArenas} meaningful cover layouts, swept position-dependent collisions, dedicated mobile movement without firing, rails, hops, gates, tunnels, bank/wrap shots, inhale, solid backward chain joining`);
// The portrait turns into movement and settles, without shifting the firing origin.
debug.start(1,'practice');game=debug.game();for(let i=0;i<24;i++){game.moveLauncher(i/23);game.update(1/60);}assert(game.bodyTurn>.04,'Sliding right visibly turns and leans Baku');const rightTurn=game.bodyTurn;for(let i=0;i<30;i++)game.update(1/60);assert(Math.abs(game.bodyTurn)<rightTurn*.2,'The creature settles when movement stops');for(let i=0;i<24;i++){game.moveLauncher(1-i/23);game.update(1/60);}assert(game.bodyTurn<-.04,'Changing travel direction reverses the lean');const origin=game.shotOrigin();game.fireCooldown=0;game.fire();assert.equal(game.projectiles.at(-1).x,origin.x);assert.equal(game.projectiles.at(-1).y,origin.y,'Body animation cannot displace the loaded shot');
debug.start(2,'practice');game=debug.game();game.hop();for(let i=0;i<8;i++)game.update(1/60);assert(game.bodyMotion>.2);assert(Math.abs(game.bodyTurn)>.01,'Hops have directional movement');for(let i=0;i<13;i++)game.update(1/60);assert(game.bodyLanding>0,'Landing animates a short squash');
