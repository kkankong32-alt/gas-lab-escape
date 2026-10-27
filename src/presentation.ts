export type Shot='heat'|'piston'|'bridge'|'pins'|'door'|'passage';
export function finalShot(f:{stroke:number;open:number;escaped:boolean}):Shot{
 if(f.escaped)return 'passage';if(f.open>0)return 'door';if(f.stroke>.67)return 'pins';if(f.stroke>.30)return 'bridge';if(f.stroke>.025)return 'piston';return 'heat';
}
export function entryPrompt(s:{walk:boolean;paused:boolean;routing:boolean;transition:boolean;near:number;locked:boolean;touch:boolean;experienced:boolean}){
 if(!s.walk||s.paused||s.routing||s.transition)return 'none';
 if(s.near>=0)return 'enter';
 return !s.touch&&!s.locked&&!s.experienced?'look':'none';
}
