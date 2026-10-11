export const LANE_WIDTH=2.8;
export const ROUTE_HEIGHT=2.6;
export const FLIGHT_HEIGHT=6;
export const GRAVITY=18;
export const JUMP_VELOCITY=8.8;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function routeHeightAtLocal(route,localZ){
 if(Math.abs(localZ)>route.length/2)return null;
 const progress=route.length/2-localZ;
 if(route.rampIn>0&&progress<route.rampIn)return route.height*progress/route.rampIn;
 if(route.rampOut>0&&progress>route.length-route.rampOut)return route.height*(route.length-progress)/route.rampOut;
 return route.height;
}
export function surfaceAt(routes,x,z=0){let height=0;for(const route of routes){if(Math.abs(x-route.lane*LANE_WIDTH)>1.19)continue;const h=routeHeightAtLocal(route,z-route.z);if(h!==null)height=Math.max(height,h);}return height;}
export function routeProfile(route){return [[route.length/2,route.rampIn?0:route.height],[route.length/2-route.rampIn,route.height],[-route.length/2+route.rampOut,route.height],[-route.length/2,route.rampOut?0:route.height]];}
export function flightHeightAt(elapsed,duration){const up=clamp(elapsed/.55,0,1),down=clamp((duration-elapsed)/.75,0,1),smooth=t=>t*t*(3-2*t);return FLIGHT_HEIGHT*Math.min(smooth(up),smooth(down));}
export function makeHeightSection(speed,index,lane){
 const front=-Math.max(48,speed*3.5),length=speed*2.7,ramp=speed*.7;
 const first={kind:index%2?'dragonway':'cloudway',lane,z:front-length/2,length,height:ROUTE_HEIGHT,rampIn:ramp,rampOut:index===0?ramp:0};
 if(index===0)return [first];
 const gap=speed*.45,secondLength=speed*2.4;
 return [first,{kind:index%2?'cloudway':'dragonway',lane,z:first.z-length/2-gap-secondLength/2,length:secondLength,height:ROUTE_HEIGHT,rampIn:0,rampOut:ramp}];
}
