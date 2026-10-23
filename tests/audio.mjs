import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
let oscillators=0,noiseHits=0;
class Param {
  setValueAtTime(value){this.value=value;} exponentialRampToValueAtTime(value){this.value=value;} setTargetAtTime(value){this.target=value;}
}
class Node {
  constructor(){this.frequency=new Param();this.gain=new Param();this.delayTime=new Param();this.type='sine';this.buffer=null;}
  connect(){} start(){if(this instanceof Oscillator)oscillators++;else if(this instanceof BufferSource)noiseHits++;} stop(){}
}
class Oscillator extends Node {}
class BufferSource extends Node {}
class FakeAudioContext {
  constructor(){this.currentTime=1;this.sampleRate=44100;this.state='running';this.destination=new Node();}
  createGain(){return new Node();}
  createOscillator(){return new Oscillator();}
  createBufferSource(){return new BufferSource();}
  createBiquadFilter(){return new Node();}
  createDelay(){return new Node();}
  createBuffer(_channels,size){return {getChannelData:()=>new Float32Array(size)};}
  resume(){this.state='running';}
}
const g={addColorStop(){}};
const fakeCtx=()=>new Proxy({}, {get(t,k){if(k==='createLinearGradient'||k==='createRadialGradient')return ()=>g;if(k in t)return t[k];return ()=>{};},set(t,k,v){t[k]=v;return true;}});
const canvas={width:390,height:844,addEventListener(){},setPointerCapture(){},getContext:fakeCtx};
const document={getElementById:()=>canvas,createElement:()=>({width:390,height:844,getContext:fakeCtx}),addEventListener(){}};
const window={innerWidth:390,innerHeight:844,addEventListener(){},AudioContext:FakeAudioContext};
const sandbox={window,document,devicePixelRatio:1,performance:{now:()=>0},requestAnimationFrame(){},localStorage:{getItem:()=>null,setItem(){}},console,Math,Date};
vm.createContext(sandbox);
vm.runInContext(js+'\nwindow.__musicTest={audio,userSettings};',sandbox);
const {audio,userSettings}=window.__musicTest;
assert.equal(audio.ac,null,'Audio is gesture-gated');
audio.unlock();
assert.equal(audio.bpm,72,'The ambient score breathes at a slower 72 BPM');
window.__lotusDebug.start(0);
userSettings.sound=false;
userSettings.music=true;
audio.music(1/60,.2,0,0);
assert(oscillators>=3,'Original soundtrack schedules soft plucks, sustained tones and bells');
assert(noiseHits>0,'A quiet brushed texture is scheduled');
assert(audio.onBeat(),'Music can identify beat-aligned touch windows');
const currentGame=window.__lotusDebug.game();
currentGame.fire();
assert(currentGame.projectiles[0].rhythm,'A shot remembers whether it was fired on beat');
audio.ac.currentTime+=.23;
assert(!audio.onBeat(),'Offbeat windows cannot earn bonus');
const before=oscillators+noiseHits;
userSettings.music=false;
audio.music(1/60,0,0,0);
assert.equal(oscillators+noiseHits,before,'Music toggle silences soundtrack independently of SFX');
assert.equal(audio.musicBus.gain.target,0,'Music toggle also fades already-ringing notes');
userSettings.music=true;
for(let i=0;i<8;i++){audio.ac.currentTime+=.13;audio.music(1/60,0,8,3);}
assert(oscillators+noiseHits>before,'Fever chorus and late-temple arrangement schedule successfully');

// The full 64-bar form changes phrases, harmony, density and lead instruments.
const instrumentEvents=[];
let scoreStep=0;
for(const name of ['mallet','gong','flute','ching','plucked','voice'])audio[name]=(...args)=>instrumentEvents.push({name,args,step:scoreStep});
for(scoreStep=0;scoreStep<1024;scoreStep++)audio.scoreStep(scoreStep,scoreStep*60/72/4,0,0,0);
for(const name of ['mallet','gong','flute','ching'])assert(instrumentEvents.some(e=>e.name===name),`Arrangement includes ${name}`);
const sections=Array.from({length:8},(_,i)=>instrumentEvents.filter(e=>Math.floor(e.step/128)===i));
assert(sections.every(events=>events.length>0),'Every long-form section is composed');
assert.equal(new Set(sections.map(events=>JSON.stringify(events.map(e=>[e.name,e.args[0],e.step%128])))).size,8,'The eight passages are musically different');
assert(sections[1].filter(e=>e.name==='flute').length>sections[0].filter(e=>e.name==='flute').length,'The flute takes over from the opening plucks');
assert(sections[5].filter(e=>['plucked','flute'].includes(e.name)).length<sections[6].filter(e=>['plucked','flute'].includes(e.name)).length,'Quiet passages leave space before the fuller duet');
const bells=instrumentEvents.filter(e=>e.name==='ching');assert(bells.length<24,'Bells are occasional accents rather than a repeated half-bar beat');
assert(new Set(bells.slice(1).map((e,i)=>e.step-bells[i].step)).size>=3,'Bell spacing varies across the form');
const firstPass=JSON.stringify(instrumentEvents.filter(e=>e.step<128).map(e=>[e.name,e.args[0],e.step%128]));instrumentEvents.length=0;
for(scoreStep=1024;scoreStep<1152;scoreStep++)audio.scoreStep(scoreStep,scoreStep*60/72/4,0,0,0);
assert.notEqual(JSON.stringify(instrumentEvents.map(e=>[e.name,e.args[0],e.step%128])),firstPass,'The next cycle varies the opening harmony and phrases');
assert(Math.abs(audio.pitch(5)/audio.pitch(0)-2)<1e-10,'Five notes span an octave in the pentatonic dream score');

vm.runInContext("scene='pause'",sandbox);audio.music(1/60);
assert.equal(audio.musicBus.gain.target,0,'Pause fades the music bus');
assert.equal(audio.nextMusicTime,0,'Pause resets scheduling so resuming cannot queue a burst of old notes');
vm.runInContext("scene='title'",sandbox);audio.music(1/60);
assert.equal(audio.musicBus.gain.target,.72,'The title plays the softer menu arrangement');
const drumEvents=[],leadEvents=[];
audio.drum=(...args)=>drumEvents.push(args);audio.plucked=(...args)=>leadEvents.push(args);
for(let step=0;step<64;step++)audio.scoreStep(step,step*60/72/4,1,8,0);
assert(!drumEvents.some(([kind])=>['kick','hand','rim'].includes(kind)),'Danger and Lucid mode keep the arrangement serene');
assert(leadEvents.length<=16,'Lead notes leave space between phrases');
console.log('PASS: eight distinct passages over 64 bars, developing harmony and phrases, sparse irregular bells, quiet/full dynamics, varied second cycle, gesture gating, beat bonuses, music/pause fades');
