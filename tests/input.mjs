import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas}=require('@napi-rs/canvas');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const handlers=new Map(),keyHandlers=new Map(),pads=[],canvas=createCanvas(390,844);
canvas.addEventListener=(event,fn)=>handlers.set(event,fn);
canvas.setPointerCapture=()=>{};
let next=null;
const document={getElementById:()=>canvas,createElement:()=>createCanvas(390,844),addEventListener:(event,fn)=>keyHandlers.set(event,fn)};
const window={innerWidth:390,innerHeight:844,addEventListener(){}};
const context={window,document,navigator:{getGamepads:()=>pads},devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame:fn=>next=fn,localStorage:{getItem:()=>null,setItem(){}},console,Math,Date};
vm.createContext(context);vm.runInContext(js,context);
const tick=t=>{const fn=next;next=null;fn(t);};
let now=16;tick(now);
function touch(event,x,y,id=1){handlers.get(event)?.({pointerId:id,clientX:x,clientY:y,pointerType:'touch',preventDefault(){}});}
function tap(x,y,id=1){touch('pointerdown',x,y,id);touch('pointerup',x,y,id);}

tap(195,769);now+=17;tick(now);
assert.equal(window.__lotusDebug.getState().scene,'title','The title has no lore detour');
tap(195,370);now+=17;tick(now);
assert(vm.runInContext('titleJoy',context)>0,'Baku reacts to petting');

// Canvas-only title interface starts a real game.
tap(195,595);
assert.equal(window.__lotusDebug.getState().scene,'play');
const game=window.__lotusDebug.game();
tap(46,300);
assert.equal(game.shots,1,'Tap-to-shoot fires');
assert.equal(game.projectiles.length,1,'Fired projectile is created');

// Tap swap doesn't create a projectile.
const a=game.active,b=game.next;
tap(290,789);
assert.equal(game.active,b);
assert.equal(game.next,a);
assert.equal(game.shots,1);

// Trackpad vertical movement aims remotely and release fires after cooldown.
for(let i=0;i<20;i++){now+=17;tick(now);}
assert(game.hits>=1,'A real launched projectile reaches and inserts into the moving chain');
touch('pointerdown',105,780);
touch('pointermove',105,758);
touch('pointerup',105,758);
assert.equal(game.shots,2,'Remote aim releases a projectile');

// Pause captures UI taps, then resumes without changing score.
tap(360,24);
assert.equal(window.__lotusDebug.getState().scene,'pause');
now+=17;tick(now);
tap(195,395);
assert.equal(window.__lotusDebug.getState().scene,'play');

// Complete a level and advance via the in-world results control.
game.meterFull=true;game.segments=[];game.projectiles=[];
for(let i=0;i<40;i++)game.update(1/60);
assert.equal(window.__lotusDebug.getState().scene,'results');
now+=17;tick(now);
tap(195,647);
assert.equal(window.__lotusDebug.getState().scene,'play');
assert.equal(window.__lotusDebug.getState().level,1);

// Reaching the temple map from gameplay and navigating all thirteen stages.
tap(358,25);now+=17;tick(now);
tap(129,629);now+=17;tick(now);
assert.equal(window.__lotusDebug.getState().scene,'title');
tap(195,670);now+=17;tick(now);
assert.equal(window.__lotusDebug.getState().scene,'select');
for(let i=0;i<12;i++){tap(344,335);now+=17;tick(now);}
assert.equal(vm.runInContext('selectedStage',context),12,'Stage selector reaches the single-level finale');
tap(120,423);
assert.equal(window.__lotusDebug.getState().scene,'select','Locked finale cannot launch prematurely');
tap(190,737);now+=17;tick(now);

// Gauntlet's two modes are genuine selection states and all 22 maps paginate.
tap(105,670);now+=17;tick(now);
assert.equal(window.__lotusDebug.getState().scene,'modeSelect');
tap(108,285);now+=17;tick(now);
assert.equal(window.__lotusDebug.getState().scene,'gauntletSelect');
tap(310,705);now+=17;tick(now);
tap(310,705);now+=17;tick(now);
assert.equal(vm.runInContext('gauntletPage',context),2,'Gauntlet selector reaches final six maps');
tap(80,706);now+=17;tick(now);
tap(80,706);now+=17;tick(now);
tap(270,313);now+=17;tick(now);
assert.equal(vm.runInContext('gauntletMode',context),'survival');
tap(280,409);now+=17;tick(now);
assert.equal(window.__lotusDebug.getState().scene,'play');
assert.equal(window.__lotusDebug.getState().mode,'survival');
assert.equal(window.__lotusDebug.getState().mapId,1);
// Real input handlers: hold-to-fire on touch, directional keyboard aim and menus.
window.__lotusDebug.start(0);let current=window.__lotusDebug.game();
touch('pointerdown',352,784);for(let i=0;i<45;i++){now+=17;tick(now);}touch('pointerup',352,784);assert(current.shots>=4,'Touch FIRE repeats while held');const releasedShots=current.shots;for(let i=0;i<12;i++){now+=17;tick(now);}assert.equal(current.shots,releasedShots,'Releasing FIRE stops it');
const keyboard=(type,key)=>keyHandlers.get(type)({key,preventDefault(){}});
keyboard('keydown','w');now+=17;tick(now);keyboard('keyup','w');assert(Math.abs(current.angle+Math.PI/2)<.1,'W aims upwards');
keyboard('keydown','Escape');keyboard('keyup','Escape');now+=17;tick(now);assert.equal(window.__lotusDebug.getState().scene,'pause');keyboard('keydown','Enter');keyboard('keyup','Enter');assert.equal(window.__lotusDebug.getState().scene,'play','Keyboard activates focused resume');
vm.runInContext("scene='modeSelect'",context);now+=17;tick(now);keyboard('keydown','ArrowRight');keyboard('keyup','ArrowRight');keyboard('keydown','Enter');keyboard('keyup','Enter');assert.equal(window.__lotusDebug.getState().mode,'challenge','Keyboard navigates and starts a mode');
// A standard controller covers menus, sticks, held trigger and edge-triggered actions.
const pad={connected:true,mapping:'standard',axes:[0,0,0,0],buttons:Array.from({length:17},()=>({pressed:false,value:0}))};pads.push(pad);
const button=(i,on)=>{pad.buttons[i]={pressed:on,value:on?1:0};};const frame=()=>{now+=17;tick(now);};
vm.runInContext("scene='title';createStaticArt(getLevelConfig(0))",context);frame();button(0,true);frame();assert.equal(window.__lotusDebug.getState().scene,'play','Controller A starts from title');current=window.__lotusDebug.game();assert.equal(current.shots,0,'Menu activation does not also shoot');button(0,false);frame();pad.axes[2]=.8;pad.axes[3]=-.8;button(7,true);for(let i=0;i<35;i++)frame();assert(current.shots>=3,'Right trigger fires repeatedly');assert(Math.abs(current.angle+Math.PI/4)<.1,'Right stick sets the aim');button(7,false);pad.axes[2]=pad.axes[3]=0;frame();const loaded=current.active,queued=current.next;button(2,true);frame();assert.equal(current.active,queued);assert.equal(current.next,loaded);frame();assert.equal(current.active,queued,'Holding X does not repeatedly swap');button(2,false);frame();
window.__lotusDebug.start(2,'practice');current=window.__lotusDebug.game();button(3,true);frame();assert.equal(current.padIndex,1,'Y hops');assert.equal(current.shots,0);button(3,false);frame();button(9,true);frame();assert.equal(window.__lotusDebug.getState().scene,'pause','Start pauses');button(9,false);frame();button(0,true);frame();assert.equal(window.__lotusDebug.getState().scene,'play','A resumes');button(0,false);frame();
window.__lotusDebug.start(1,'practice');current=window.__lotusDebug.game();const railX=current.frog.x;pad.axes[0]=.8;for(let i=0;i<15;i++)frame();assert(current.frog.x>railX,'Left stick repositions on a rail');assert.equal(current.shots,0);pad.axes[0]=0;
console.log('PASS: touch aim/hold fire, keyboard aim/menus/pause, controller sticks/trigger/swap/hop/menus, no accidental firing, 13-stage and 22-map navigation');
