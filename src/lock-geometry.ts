// Metres, in station coordinates. Rendering and the science interlock use the same geometry.
export const LOCK={headY:1.84,pinLength:.36,travel:.38,receiverTop:1.80,receiverBottom:1.68,z:-2.12,x:1.45} as const;
export const lockClearance=(stroke:number)=>LOCK.headY+stroke*LOCK.travel-LOCK.pinLength-LOCK.receiverTop;
export const pinsClear=(stroke:number)=>lockClearance(stroke)>.025;
