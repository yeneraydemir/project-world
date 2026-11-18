import {CITIES,position} from './tracking.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const xy=([lon,lat])=>[(lon-25)*48+20,(43-lat)*61+20];
const path=pts=>pts.map((p,i)=>(i?'L':'M')+xy(p).join(',')).join(' ');
let landPromise;
export function openTurkeyMap(entries,selectedId,onEdit){
 document.querySelector('#turkey-dialog')?.remove();
 const d=document.createElement('dialog');d.id='turkey-dialog';
 const selected=entries.find(e=>e.record.id===selectedId)||entries[0];
 d.innerHTML='<header class="dialog-head"><div><span class="eyebrow">SEVKİYAT PLAN TAKİBİ</span><h2>Türkiye haritası</h2></div><button aria-label="Haritayı kapat">×</button></header>'+
 '<p class="detail-copy">Araç konumları kalkış ve tahmini varış saatine göre hesaplanır. Canlı GPS değildir. Saatler Türkiye saatidir.</p>'+
 '<div class="turkey-layout"><div class="turkey-canvas"><svg viewBox="0 0 1030 520" role="img" aria-label="Türkiye ve planlanan araç rotaları"><rect width="1030" height="520" fill="#e5f2fb"/><g id="turkey-land"></g><g id="turkey-cities"></g><g id="turkey-route"></g><g id="turkey-truck"></g></svg><p id="map-land-status" role="status"></p></div><section><label>Sevkiyat<select id="map-trip">'+entries.map(e=>'<option value="'+esc(e.record.id)+'">'+esc(e.project.name+' · '+e.record.name)+'</option>').join('')+'</select></label><div id="map-info"></div><button id="map-edit" class="gold">Rota ve saatleri düzenle</button></section></div>'+
 (!entries.length?'<p class="empty">Henüz rotalı sevkiyat yok. İşler → İşlemler veya Saha kayıtları bölümünden araç atanmış bir sevkiyatı açıp “Rota ve saat ekle”yi seç.</p>':'')+
 '<p class="note">Ülke sınırı: Natural Earth (public domain). Yol: OSRM / OpenStreetMap katkıda bulunanlar (ODbL). Şehir merkezi rotasıdır; tır geçiş uygunluğu doğrulanmaz. Varış saatine ulaşmak teslimat kaydını veya stoğu otomatik değiştirmez.</p>';
 document.body.append(d);d.querySelector('header button').onclick=()=>d.close();
 const select=d.querySelector('#map-trip');if(selected)select.value=selected.record.id;
 const cities=d.querySelector('#turkey-cities');
 cities.innerHTML=['İstanbul','Ankara','İzmir','Antalya','Adana','Trabzon','Samsun','Gaziantep','Erzurum','Van','Diyarbakır'].map(n=>{const [x,y]=xy(CITIES[n]);return '<circle cx="'+x+'" cy="'+y+'" r="3" fill="#68849b"/><text x="'+(x+5)+'" y="'+(y-5)+'" font-size="11" fill="#314d64">'+esc(n)+'</text>';}).join('');
 const info=d.querySelector('#map-info');let current=null;
 const draw=()=>{
  const e=entries.find(e=>e.record.id===select.value);current=e;
  if(!e){select.disabled=true;d.querySelector('#map-edit').hidden=true;return;}
  const r=e.record,t=r.trip,v=e.project.vehicles.find(v=>v.id===r.vehicleId),driver=e.project.workers.find(w=>w.id===v?.driverId),state=position(t);
  d.querySelector('#turkey-route').innerHTML='<path d="'+path(t.coordinates)+'" fill="none" stroke="#fff" stroke-width="7"/><path d="'+path(t.coordinates)+'" fill="none" stroke="#2356cc" stroke-width="4" stroke-linecap="round"/>';
  const [x,y]=xy(state.point);
  d.querySelector('#turkey-truck').innerHTML='<g transform="translate('+x+','+y+')"><circle r="13" fill="#2356cc" stroke="white" stroke-width="3"/><path d="M-7-4H2V3H-7ZM2-2H5L8 1V3H2" fill="white"/><circle cx="-4" cy="5" r="2" fill="white"/><circle cx="5" cy="5" r="2" fill="white"/></g>';
  info.innerHTML='<h3>'+esc(t.from)+' → '+esc(t.to)+'</h3><span class="tag">'+esc(state.state)+'</span><dl class="kv">'+[['Plaka',v?.plate||'Araç atanmadı'],['Sürücü',driver?.name||'Atanmadı'],['Kalkış',t.departure.replace('T',' ')],['Tahmini varış',t.arrival.replace('T',' ')],['Plan ilerlemesi','%'+Math.round(state.f*100)],['Rota',Math.round(t.distance/1000)+' km'],['Kalan süre',Math.max(0,Math.ceil((Date.parse(t.arrival+':00+03:00')-Date.now())/60000))+' dk']].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+esc(v)+'</dd></div>').join('')+'</dl>';
 };
 select.onchange=draw;
 d.querySelector('#map-edit').onclick=()=>{if(current){const e=current;d.close();onEdit(e);}};
 const timer=setInterval(()=>{if(d.open)draw();},1000);
 d.addEventListener('close',()=>{clearInterval(timer);d.remove();},{once:true});
 d.showModal();draw();
 landPromise??=fetch('./maps/turkey.json').then(r=>{if(!r.ok)throw Error();return r.json();}).catch(()=>{landPromise=null;throw Error();});
 landPromise.then(g=>{
  if(!d.isConnected)return;
  const rings=g.type==='MultiPolygon'?g.coordinates.flatMap(poly=>poly):g.coordinates;
  d.querySelector('#turkey-land').innerHTML='<path d="'+rings.map(r=>path(r)+'Z').join(' ')+'" fill="#fafbf4" stroke="#9bb6c6" stroke-width="1.5" fill-rule="evenodd"/>';
 }).catch(()=>{if(d.isConnected)d.querySelector('#map-land-status').textContent='Ülke sınırı yüklenemedi. Rota ve şehirler gösteriliyor.';});
}
