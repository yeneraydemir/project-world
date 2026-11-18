import {CITIES,position} from './tracking.js';
import {geometryPath,bounds,matchesProvince,canonical} from './provinces.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xy=([lon,lat])=>[(lon-25)*48+20,(43-lat)*61+20];
const path=pts=>pts.map((p,i)=>(i?'L':'M')+xy(p).join(',')).join(' ');
let dataPromise;
export function openTurkeyMap(entries,selectedId,onEdit){
 document.querySelector('#turkey-dialog')?.close();
 const d=document.createElement('dialog');d.id='turkey-dialog';
 d.innerHTML='<header class="dialog-head"><div><span class="eyebrow">81 İL · SEVKİYAT PLAN TAKİBİ</span><h2>Türkiye haritası</h2></div><button aria-label="Haritayı kapat">×</button></header>'+
 '<p class="detail-copy">Bir ile tıkla veya listeden seç. Sürükleyerek kaydır, tekerlek / ＋ − ile yakınlaştır. Araçlar planlanan saatlere göre ilerler; canlı GPS değildir.</p>'+
 '<div class="province-toolbar"><label>İl ara / seç<select id="province-select"><option value="">Türkiye geneli · 81 il</option></select></label><div class="map-zoom"><button id="map-zoom-in" aria-label="Haritayı yakınlaştır">＋</button><button id="map-zoom-out" aria-label="Haritayı uzaklaştır">−</button><button id="map-reset">Türkiye geneli</button><label><input id="map-labels" type="checkbox"> İl adları</label></div></div>'+
 '<div class="turkey-layout"><div class="turkey-canvas"><svg viewBox="0 0 1030 520" role="group" aria-label="Türkiye illeri ve sevkiyat rotaları"><rect x="-2000" y="-2000" width="5000" height="5000" fill="#e5f2fb"/><g id="turkey-land"></g><g id="turkey-cities" pointer-events="none"></g><g id="turkey-route"></g><g id="turkey-truck"></g></svg><p id="map-land-status" role="status"></p></div><section><div id="province-info" aria-live="polite"></div><label>Sevkiyat<select id="map-trip"></select></label><div id="map-info"></div><button id="map-edit" class="gold">Rota ve saatleri düzenle</button></section></div>'+
 (!entries.length?'<p class="empty">Rotalı sevkiyat yok. Araç atanmış sevkiyat veya malzeme teslimatında “Rota ve saat ekle”yi seç.</p>':'')+
 '<p class="note">İl sınırları: OpenStreetMap katkıcıları / cihadturhan/tr-geojson / theaiagent (ODbL, <a href="./maps/ATTRIBUTION.md" target="_blank" rel="noopener">kaynak ve lisans</a>). Yol: OSRM / OpenStreetMap. Genel görselleştirme içindir. Trafik ve tır kısıtları hesaplanmaz; planlanan varış teslimat ve stok kaydını otomatik değiştirmez.</p>';
 document.body.append(d);
 const svg=d.querySelector('svg'),select=d.querySelector('#map-trip'),provinceSelect=d.querySelector('#province-select'),info=d.querySelector('#map-info');
 let features=[],filtered=entries,active=null,current=null,box=[0,0,1030,520],drag=null;
 function setBox(b){box=b;svg.setAttribute('viewBox',b.join(' '));}
 function zoom(factor){const w=Math.max(90,Math.min(1030,box[2]*factor)),h=w*520/1030;setBox([Math.max(-100,Math.min(1130-w,box[0]+(box[2]-w)/2)),Math.max(-60,Math.min(580-h,box[1]+(box[3]-h)/2)),w,h]);}
 function fillTrips(preferred){
  select.innerHTML=filtered.map(e=>'<option value="'+esc(e.record.id)+'">'+esc(e.project.name+' · '+e.record.name)+'</option>').join('');
  select.value=filtered.some(e=>e.record.id===preferred)?preferred:(filtered[0]?.record.id||'');
 }
 function draw(){
  current=filtered.find(e=>e.record.id===select.value);
  select.disabled=!current;d.querySelector('#map-edit').hidden=!current;
  if(!current){info.innerHTML='<p class="empty">Bu görünümde rotalı sevkiyat yok.</p>';d.querySelector('#turkey-route').innerHTML='';d.querySelector('#turkey-truck').innerHTML='';return;}
  const e=current,r=e.record,t=r.trip,v=e.project.vehicles.find(v=>v.id===r.vehicleId),driver=e.project.workers.find(w=>w.id===v?.driverId),state=position(t);
  d.querySelector('#turkey-route').innerHTML='<path d="'+path(t.coordinates)+'" fill="none" stroke="#fff" stroke-width="7" vector-effect="non-scaling-stroke"/><path d="'+path(t.coordinates)+'" fill="none" stroke="#2356cc" stroke-width="4" stroke-linecap="round" vector-effect="non-scaling-stroke"/>';
  const [x,y]=xy(state.point),scale=box[2]/1030;
  d.querySelector('#turkey-truck').innerHTML='<g transform="translate('+x+','+y+') scale('+scale+')"><circle r="13" fill="#2356cc" stroke="white" stroke-width="3"/><path d="M-7-4H2V3H-7ZM2-2H5L8 1V3H2" fill="white"/><circle cx="-4" cy="5" r="2" fill="white"/><circle cx="5" cy="5" r="2" fill="white"/></g>';
  info.innerHTML='<h3>'+esc(t.from)+' → '+esc(t.to)+'</h3><span class="tag">'+esc(state.state)+'</span><dl class="kv">'+[['Plaka',v?.plate||'Araç atanmadı'],['Sürücü',driver?.name||'Atanmadı'],['Kalkış (Türkiye)',t.departure.replace('T',' ')],['Tahmini varış',t.arrival.replace('T',' ')],['Plan ilerlemesi','%'+Math.round(state.f*100)],['Rota',Math.round(t.distance/1000)+' km'],['Kalan süre',Math.max(0,Math.ceil((Date.parse(t.arrival+':00+03:00')-Date.now())/60000))+' dk']].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>';
 }
 function choose(code){
  active=features.find(f=>f.properties.il_kodu===code)||null;provinceSelect.value=active?code:'';
  svg.querySelectorAll('[data-province]').forEach(p=>{const chosen=p.dataset.province===code;p.classList.toggle('selected',chosen);p.setAttribute('aria-pressed',String(chosen));});
  if(active){const [x,y,w,h]=bounds(active.geometry),width=Math.min(1030,Math.max(170,w+36,(h+36)*1030/520)),height=width*520/1030;setBox([x+w/2-width/2,y+h/2-height/2,width,height]);}else setBox([0,0,1030,520]);
  filtered=active?entries.filter(e=>matchesProvince(active,e)):entries;
  fillTrips(select.value||selectedId);
  const p=d.querySelector('#province-info');
  if(active){
   const n=active.properties.il_adi,a=filtered.filter(e=>canonical(e.record.trip.from)===canonical(n)).length,b=filtered.filter(e=>canonical(e.record.trip.to)===canonical(n)).length;
   p.innerHTML='<span class="tag">'+esc(code)+' · '+esc(n)+'</span><h3>'+esc(active.properties.bolge||'İl görünümü')+'</h3><p class="detail-copy">'+a+' kalkış · '+b+' varış · '+(filtered.length-a-b)+' güzergâh kaydı</p><p class="note">Bu proje/şirket kayıtları. Güzergâh eşleşmesi rota noktalarına dayanır.</p>';
  }else p.innerHTML='<p class="detail-copy">Türkiye geneli · 81 il<br>'+entries.length+' rotalı sevkiyat kaydı</p>';
  draw();
 }
 d.querySelector('header button').onclick=()=>d.close();
 select.onchange=draw;provinceSelect.onchange=e=>choose(e.target.value);
 d.querySelector('#map-reset').onclick=()=>choose('');
 d.querySelector('#map-zoom-in').onclick=()=>{zoom(.7);draw();};
 d.querySelector('#map-zoom-out').onclick=()=>{zoom(1.4);draw();};
 d.querySelector('#map-labels').onchange=e=>d.querySelector('#turkey-cities').classList.toggle('show-names',e.target.checked);
 d.querySelector('#map-edit').onclick=()=>{if(current){const e=current;d.close();onEdit(e);}};
 svg.addEventListener('pointerdown',e=>{if(e.button!==0)return;drag={x:e.clientX,y:e.clientY,box:[...box],moved:false};svg.setPointerCapture(e.pointerId);});
 svg.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x,dy=e.clientY-drag.y;if(Math.hypot(dx,dy)>5)drag.moved=true;if(drag.moved){const scale=drag.box[2]/svg.getBoundingClientRect().width;setBox([Math.max(-100,Math.min(1130-box[2],drag.box[0]-dx*scale)),Math.max(-60,Math.min(580-box[3],drag.box[1]-dy*scale)),box[2],box[3]]);}});
 svg.addEventListener('pointerup',e=>{if(!drag)return;const moved=drag.moved;drag=null;if(!moved){const target=document.elementFromPoint(e.clientX,e.clientY)?.closest('[data-province]');if(target&&svg.contains(target))choose(target.dataset.province);}});
 svg.addEventListener('pointercancel',()=>{drag=null;});
 svg.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){const target=e.target.closest('[data-province]');if(target){e.preventDefault();choose(target.dataset.province);}}});
 svg.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:.85);draw();},{passive:false});
 const timer=setInterval(()=>{if(d.open)draw();},1000);
 d.addEventListener('close',()=>{clearInterval(timer);d.remove();},{once:true});
 fillTrips(selectedId);d.showModal();choose('');
 dataPromise??=fetch('./maps/provinces.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>{dataPromise=null;throw Error();});
 dataPromise.then(g=>{
  if(!d.isConnected)return;
  features=g.features;
  d.querySelector('#turkey-land').innerHTML=features.map(f=>'<path class="province-shape" data-province="'+esc(f.properties.il_kodu)+'" role="button" tabindex="0" aria-pressed="false" aria-label="'+esc(f.properties.il_kodu+' '+f.properties.il_adi)+'" d="'+geometryPath(f.geometry)+'"><title>'+esc(f.properties.il_kodu+' · '+f.properties.il_adi)+'</title></path>').join('');
  d.querySelector('#turkey-cities').innerHTML=features.map(f=>{
   const n=f.properties.il_adi,key=Object.keys(CITIES).find(k=>canonical(k)===canonical(n)),[x,y]=key?xy(CITIES[key]):(()=>{const [a,b,w,h]=bounds(f.geometry);return [a+w/2,b+h/2];})();
   return '<text class="province-code" x="'+x+'" y="'+y+'">'+esc(f.properties.il_kodu)+'</text><text class="province-name" x="'+x+'" y="'+(y+8)+'">'+esc(n)+'</text>';
  }).join('');
  provinceSelect.innerHTML='<option value="">Türkiye geneli · 81 il</option>'+[...features].sort((a,b)=>a.properties.il_adi.localeCompare(b.properties.il_adi,'tr')).map(f=>'<option value="'+esc(f.properties.il_kodu)+'">'+esc(f.properties.il_kodu+' · '+f.properties.il_adi)+'</option>').join('');
 }).catch(()=>{if(d.isConnected)d.querySelector('#map-land-status').textContent='İl sınırları yüklenemedi. Haritayı kapatıp tekrar aç.';});
}
