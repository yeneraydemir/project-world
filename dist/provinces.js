export const projectPoint=([lon,lat])=>[(lon-25)*48+20,(43-lat)*61+20];
export function rings(geometry){return geometry.type==='MultiPolygon'?geometry.coordinates.flat():geometry.coordinates;}
export function geometryPath(geometry){return rings(geometry).map(r=>r.map((p,i)=>(i?'L':'M')+projectPoint(p).join(',')).join(' ')+'Z').join(' ');}
export function bounds(geometry){
 const pts=rings(geometry).flat().map(projectPoint),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
 return [Math.min(...xs),Math.min(...ys),Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys)];
}
function inRing([x,y],ring){
 let inside=false;
 for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [a,b]=ring[i],[c,d]=ring[j];
  if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)inside=!inside;
 }return inside;
}
export function contains(geometry,point){
 const polygons=geometry.type==='MultiPolygon'?geometry.coordinates:[geometry.coordinates];
 return polygons.some(poly=>inRing(point,poly[0])&&!poly.slice(1).some(hole=>inRing(point,hole)));
}
export const canonical=n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ı/g,'i').toLowerCase();
export function matchesProvince(feature,entry){
 const name=canonical(feature.properties.il_adi),t=entry.record.trip;
 return canonical(t.from)===name||canonical(t.to)===name||t.coordinates.some(p=>contains(feature.geometry,p));
}
