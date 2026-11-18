// Web Mercator tile alignment. Only currently visible tiles are requested.
const merc=lat=>Math.log(Math.tan(Math.PI/4+lat*Math.PI/360))*180/Math.PI;
export const mapPoint=([lon,lat])=>[(lon-25)*48+20,(merc(43)-merc(lat))*48+20];
export function visibleTiles(box,width=800){
 const [x,y,w,h]=box;
 const z=Math.max(5,Math.min(10,Math.round(Math.log2(360*48*width/(256*w)))));
 const n=2**z,span=360*48/n;
 const originX=(-180-25)*48+20,originY=(merc(43)-180)*48+20;
 const firstX=Math.max(0,Math.floor((x-originX)/span)),lastX=Math.min(n-1,Math.floor((x+w-originX)/span));
 const firstY=Math.max(0,Math.floor((y-originY)/span)),lastY=Math.min(n-1,Math.floor((y+h-originY)/span));
 const tiles=[];
 for(let tx=firstX;tx<=lastX;tx++)for(let ty=firstY;ty<=lastY;ty++)tiles.push({key:z+'/'+tx+'/'+ty,url:'https://tile.openstreetmap.org/'+z+'/'+tx+'/'+ty+'.png',x:originX+tx*span,y:originY+ty*span,size:span});
 return tiles;
}
export function mountTiles(svg,layer,status){
 let pending,enabled=true,disposed=false,failed=0;
 const render=()=>{
  if(disposed)return;
  layer.style.display=enabled?"":"none";if(!enabled)return;
  const box=svg.getAttribute('viewBox').split(/\s+/).map(Number);
  const tiles=visibleTiles(box,svg.getBoundingClientRect().width||800),keys=new Set(tiles.map(t=>t.key));
  for(const child of [...layer.children])if(!keys.has(child.dataset.tile))child.remove();
  const existing=new Set([...layer.children].map(el=>el.dataset.tile));
  for(const t of tiles){
   if(existing.has(t.key))continue;
   const el=document.createElementNS('http://www.w3.org/2000/svg','image');
   el.dataset.tile=t.key;el.setAttribute('x',t.x);el.setAttribute('y',t.y);el.setAttribute('width',t.size+.01);el.setAttribute('height',t.size+.01);
   el.setAttribute('preserveAspectRatio','none');el.setAttribute('referrerpolicy','strict-origin-when-cross-origin');
   el.addEventListener('error',()=>{failed++;status.textContent='Yol haritasının bazı parçaları yüklenemedi. İnternet bağlantısını kontrol edip haritayı yeniden aç.';},{once:true});
   el.setAttribute('href',t.url);layer.append(el);
  }
 };
 const schedule=()=>{clearTimeout(pending);pending=setTimeout(render,180);};
 const observer=new MutationObserver(schedule);observer.observe(svg,{attributes:true,attributeFilter:['viewBox']});
 const resize=new ResizeObserver(schedule);resize.observe(svg);
 return {show(value){enabled=value;layer.style.display=value?"":"none";if(!value&&failed)status.textContent='';render();},
 destroy(){disposed=true;clearTimeout(pending);observer.disconnect();resize.disconnect();}};
}
