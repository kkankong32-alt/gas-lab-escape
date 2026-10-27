import {type State,type Gas,balloonEquilibrium,gasOxygen} from './science.ts';
export type Exploration={version:1;capHeld:boolean;observed:Record<Gas,boolean>;hintClicks:number;retries:number[];maxBalloon:number;minOxygen:number;tracked:boolean};
export function exploration(s:State,fresh=false):Exploration{const x=(s as State&{exploration?:Exploration}).exploration;if(x?.version===1&&Array.isArray(x.retries)&&x.retries.length===5)return x;return {version:1,capHeld:false,observed:{He:!fresh&&s.gases.done.He,CO2:!fresh&&s.gases.done.CO2,N2:!fresh&&s.gases.done.N2,O2:!fresh&&s.gases.done.O2},hintClicks:0,retries:[0,0,0,0,0],maxBalloon:balloonEquilibrium(s.press.nOutside).v*1e6,minOxygen:gasOxygen(s,'N2')*100,tracked:fresh};}
export function record(s:State,x:Exploration){x.maxBalloon=Math.max(x.maxBalloon,balloonEquilibrium(s.press.nOutside).v*1e6);x.minOxygen=Math.min(x.minOxygen,gasOxygen(s,'N2')*100);}
export const allObserved=(x:Exploration)=>Object.values(x.observed).every(Boolean);
