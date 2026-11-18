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

// Visual centre: the interior point with the greatest clearance from the boundary.
export function labelPoint(geometry){
 const polygons=geometry.type==='MultiPolygon'?geometry.coordinates:[geometry.coordinates];
 const area=ring=>Math.abs(ring.reduce((sum,p,i)=>{const q=ring[(i+1)%ring.length];return sum+p[0]*q[1]-q[0]*p[1];},0)/2);
 const poly=[...polygons].sort((a,b)=>area(b[0])-area(a[0]))[0];
 const xs=poly[0].map(p=>p[0]),ys=poly[0].map(p=>p[1]);
 let minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys),best=null,score=-1;
 const distance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],t=dx||dy?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/(dx*dx+dy*dy))):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
 for(let pass=0;pass<3;pass++){
  const sx=(maxX-minX)/24,sy=(maxY-minY)/24;
  for(let i=0;i<=24;i++)for(let j=0;j<=24;j++){
   const p=[minX+i*sx,minY+j*sy];if(!inRing(p,poly[0])||poly.slice(1).some(r=>inRing(p,r)))continue;
   let clearance=Infinity;for(const ring of poly)for(let k=1;k<ring.length;k++)clearance=Math.min(clearance,distance(p,ring[k-1],ring[k]));
   if(clearance>score){score=clearance;best=p;}
  }
  if(!best)continue;
  minX=best[0]-sx;maxX=best[0]+sx;minY=best[1]-sy;maxY=best[1]+sy;
 }
 return best||poly[0][0];
}
