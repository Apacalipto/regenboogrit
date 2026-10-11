export const LANE_WIDTH=2.8;
export const ROUTE_HEIGHT=2.6;
export const FLIGHT_HEIGHT=6;
export const GRAVITY=18;
export const JUMP_VELOCITY=8.8;
export const BOOST_LANDING_SECONDS=1.6;
export const LANDING_CLEAR_SECONDS=3;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const smootherStep=v=>{const t=clamp(v,0,1);return t*t*t*(t*(t*6-15)+10);};
// Shared sampled ramp profile keeps render geometry and collision heights identical.
function rampEase(t){const n=12,x=clamp(t,0,1)*n,i=Math.min(n-1,Math.floor(x));return smootherStep(i/n)+(smootherStep((i+1)/n)-smootherStep(i/n))*(x-i);}
export function routeHeightAtLocal(route,localZ){
 if(Math.abs(localZ)>route.length/2)return null;
 const progress=route.length/2-localZ;
 if(route.rampIn>0&&progress<route.rampIn)return route.height*rampEase(progress/route.rampIn);
 if(route.rampOut>0&&progress>route.length-route.rampOut)return route.height*rampEase((route.length-progress)/route.rampOut);
 return route.height;
}
export function surfaceAt(routes,x,z=0){let height=0;for(const route of routes){if(Math.abs(x-route.lane*LANE_WIDTH)>1.19)continue;const h=routeHeightAtLocal(route,z-route.z);if(h!==null)height=Math.max(height,h);}return height;}
export function routeProfile(route){
 const half=route.length/2,points=[[half,route.rampIn?0:route.height]];
 if(route.rampIn)for(let i=1;i<=12;i++)points.push([half-route.rampIn*i/12,route.height*smootherStep(i/12)]);
 points.push([-half+route.rampOut,route.height]);
 if(route.rampOut)for(let i=1;i<=12;i++)points.push([-half+route.rampOut*(1-i/12),route.height*smootherStep(1-i/12)]);
 return points;
}
export function flightHeightAt(elapsed,duration){return FLIGHT_HEIGHT*Math.min(smootherStep(elapsed/.7),smootherStep((duration-elapsed)/BOOST_LANDING_SECONDS));}
export function flightSpeedMultiplierAt(elapsed,duration){return 1+2*Math.min(smootherStep(elapsed/.7),smootherStep((duration-elapsed)/BOOST_LANDING_SECONDS));}
export function flightPoseAt(elapsed,duration){return Math.min(smootherStep(elapsed/.45),smootherStep((duration-elapsed)/.65));}
// Forecast an obstacle's arrival using the same speed ramp as the actual flight.
export function flightDistanceAt(arrival,duration,speedAtTime){
 let distance=0,previous=speedAtTime(0)*flightSpeedMultiplierAt(0,duration);
 const steps=Math.max(1,Math.ceil(arrival*120)),dt=arrival/steps;
 for(let i=1;i<=steps;i++){const t=i*dt,next=speedAtTime(t)*flightSpeedMultiplierAt(t,duration);distance+=(previous+next)*.5*dt;previous=next;}
 return distance;
}
export function makeHeightSection(speed,index,lane){
 const front=-Math.max(48,speed*3.5),length=speed*(index===0?3.3:2.7),ramp=speed*.9;
 const first={kind:index%2?'dragonway':'cloudway',lane,z:front-length/2,length,height:ROUTE_HEIGHT,rampIn:ramp,rampOut:index===0?ramp:0};
 if(index===0)return [first];
 const gap=speed*.45,secondLength=speed*2.4;
 return [first,{kind:index%2?'cloudway':'dragonway',lane,z:first.z-length/2-gap-secondLength/2,length:secondLength,height:ROUTE_HEIGHT,rampIn:ramp*.8,rampOut:ramp}];
}
