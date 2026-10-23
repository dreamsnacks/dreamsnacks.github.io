import fs from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {createCanvas,Image}=require('@napi-rs/canvas');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
const canvas=createCanvas(390,844);
const pointerHandlers={};
canvas.addEventListener=(type,handler)=>{pointerHandlers[type]=handler;};
canvas.setPointerCapture=()=>{};
let nextFrame=null;
const document={getElementById:()=>canvas,createElement:tag=>createCanvas(390,844),addEventListener(){},hidden:false};
const window={innerWidth:390,innerHeight:844,addEventListener(){},devicePixelRatio:1};
const sandbox={window,document,Image,devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame:cb=>{nextFrame=cb;},localStorage:{getItem:()=>null,setItem(){}},console,Math,Date};
vm.createContext(sandbox);
vm.runInContext(js,sandbox,{timeout:7000});
await vm.runInContext('bakuPortrait.decode()',sandbox);
function tick(ms){const cb=nextFrame;nextFrame=null;cb(ms);}
function tap(x,y){pointerHandlers.pointerdown({preventDefault(){},pointerId:73,clientX:x,clientY:y,pointerType:'touch'});pointerHandlers.pointerup({pointerId:73});}
tick(16);tick(32);
fs.writeFileSync('/tmp/lotus-title.png',canvas.toBuffer('image/png'));
tap(195,670);tick(48);
fs.writeFileSync('/tmp/lotus-stage-select.png',canvas.toBuffer('image/png'));
for(let i=0;i<6;i++){tap(345,332);tick(64+i*16);}
fs.writeFileSync('/tmp/lotus-stage-seven.png',canvas.toBuffer('image/png'));
tap(195,731);tick(180);
tap(105,670);tick(196);
vm.runInContext("scene='gauntletSelect'",sandbox);tick(208);
fs.writeFileSync('/tmp/lotus-gauntlet-select.png',canvas.toBuffer('image/png'));
tap(102,408);tick(220);
fs.writeFileSync('/tmp/lotus-gauntlet-practice.png',canvas.toBuffer('image/png'));
window.__lotusDebug.start(0);
for(let i=0;i<120;i++)tick(50+i*16.67);
fs.writeFileSync('/tmp/lotus-play.png',canvas.toBuffer('image/png'));
const festival=window.__lotusDebug.game();
festival.feverTime=8;festival.coin={x:262,y:338,kind:'blessing',expires:100};
tick(2150);
fs.writeFileSync('/tmp/lotus-festival.png',canvas.toBuffer('image/png'));
console.log('Rendered title, Adventure and Gauntlet selection, gameplay, and Fever/Spirit Gift effects');
vm.runInContext("scene='modeSelect'",sandbox);tick(2167);
fs.writeFileSync('/tmp/lotus-modes.png',canvas.toBuffer('image/png'));
for(const [i,mode] of ['challenge','iron','heroic','boss','weekly'].entries()){
 window.__lotusDebug.start(0,mode);tick(2200+i*17);
 fs.writeFileSync(`/tmp/lotus-${mode}.png`,canvas.toBuffer('image/png'));
}
vm.runInContext("scene='title';createStaticArt(getLevelConfig(0))",sandbox);tick(2300);
fs.writeFileSync('/tmp/lotus-guardians.png',canvas.toBuffer('image/png'));
window.__lotusDebug.start(0);
vm.runInContext("const blast={id:123123,balls:[makeMarble('coral'),makeMarble('coral'),makeMarble('coral')],headS:530,delay:0};game.segments.push(blast);game.resolveMatch(blast,1,123124);game.streak=4;game.comboPulse=1;",sandbox);
tick(2320);fs.writeFileSync('/tmp/lotus-impact.png',canvas.toBuffer('image/png'));
vm.runInContext("scene='pause'",sandbox);tick(2340);fs.writeFileSync('/tmp/lotus-pause.png',canvas.toBuffer('image/png'));

// Capture examples of the different arena mechanics and all six patterned pearls.
for(const i of [1,2,3,4,7,13,16,20]){
 window.__lotusDebug.start(i,'practice');tick(2400+i*17);
 fs.writeFileSync(`/tmp/lotus-arena-${i}.png`,canvas.toBuffer('image/png'));
}
for(let i=0;i<4;i++){
 window.__lotusDebug.start(i,'boss');
 for(let frame=0;frame<245;frame++)window.__lotusDebug.game().update(1/60);
 tick(3000+i*17);
 fs.writeFileSync(`/tmp/lotus-duel-active-${i}.png`,canvas.toBuffer('image/png'));
}
