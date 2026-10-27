export class Sound {
 ctx:AudioContext|null=null;enabled=true;
 unlock(){if(!this.ctx)this.ctx=new AudioContext();void this.ctx.resume();}
 play(kind:'click'|'pump'|'success'|'door'|'alarm'|'escape'='click'){
  if(!this.enabled||!this.ctx)return;
  const c=this.ctx,t=c.currentTime,o=c.createOscillator(),g=c.createGain();
  if(kind==='escape'){for(const [i,f] of [523.25,659.25,783.99,1046.5].entries()){const note=c.createOscillator(),amp=c.createGain();note.type='sine';note.frequency.value=f;amp.gain.setValueAtTime(0,t+i*.24);amp.gain.linearRampToValueAtTime(.055,t+i*.24+.03);amp.gain.exponentialRampToValueAtTime(.0001,t+i*.24+1.2);note.connect(amp);amp.connect(c.destination);note.start(t+i*.24);note.stop(t+i*.24+1.3);}return;}

  if(kind==='door'){for(let k=0;k<4;k++)for(const ratio of [1,2.76,5.4]){const metal=c.createOscillator(),amp=c.createGain(),at=t+k*.16;metal.type='sine';metal.frequency.setValueAtTime(190*ratio,at);amp.gain.setValueAtTime(.025/ratio,at);amp.gain.exponentialRampToValueAtTime(.0001,at+.22);metal.connect(amp);amp.connect(c.destination);metal.start(at);metal.stop(at+.25);}}

  o.type=kind==='pump'?'triangle':kind==='door'?'sawtooth':'sine';
  const freq=kind==='success'?660:kind==='door'?65:kind==='alarm'?330:kind==='pump'?130:440;
  o.frequency.setValueAtTime(freq,t);o.frequency.exponentialRampToValueAtTime(kind==='success'?1320:freq*.45,t+.23);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(kind==='door'?.045:.07,t+.015);g.gain.exponentialRampToValueAtTime(.0001,t+(kind==='door'?1.5:.3));
  o.connect(g);g.connect(c.destination);o.start();o.stop(t+1.6);
 }
}
