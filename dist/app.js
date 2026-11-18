import * as API from './shipment-api.js';
import * as TR from './tracking.js';
import {openTurkeyMap} from './turkey-map.js';
import * as K from './kapsio.js';
import * as O from './operations.js';
import {CATALOG,FAMILIES,LAYOUTS,LAYOUT_HELP,UNITS,BUSINESS_ROLES} from './catalog.js';
import * as D from './data.js';
import {WorldScene} from './scene.js';
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n).toLocaleString('tr-TR'),money=n=>fmt(n)+' ₺',KEY='project-world-v2';
const icons={buildings:'▤',landscape:'♧',containers:'▱',workers:'♙',vehicles:'♧',tasks:'☷',materials:'◇',jobs:'⇄',spaces:'▣',boundary:'⌗',operations:'◈'};
let root,loadIssue='',scene=null,mode='edit',draft=null,view='buildings',group='area',selected=null,detailMode=null,search='',interior=null,route=false,plotting=false,rate=0,cursor=0,lastWrite=0,lastUI=0,history=[],scenarioHistory=[],demand=100,toastTimer,moving=null,cityFilter='',kindFilter='',unitFilter='',dailyScope='portfolio',dailyFilter='all';
try{const saved=localStorage.getItem(KEY);root=saved?D.validate(JSON.parse(saved)):D.initial();D.ensureHierarchy(root);}catch(e){root=D.initial();loadIssue='Önceki kayıt açılamadı: '+e.message;try{const old=localStorage.getItem(KEY);if(old)localStorage.setItem(KEY+'-recovery',old);}catch{}}
const world=()=>mode==='scenario'?draft:root,project=()=>world().projects.find(p=>p.id===world().active),domain=()=>project().domain;
const selectedRecord=()=>selected?project()[selected.col]?.find(r=>r.id===selected.id):null;
function toast(s){clearTimeout(toastTimer);$('#toast').textContent=s;$('#toast').hidden=false;toastTimer=setTimeout(()=>$('#toast').hidden=true,5000);}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(root));$('#save-state').textContent='Tarayıcıya kaydedildi';return true;}catch{$('#save-state').textContent='Kayıt yapılamadı';toast('Tarayıcı kaydı yapılamadı. Araçlar menüsünden JSON yedeği indir.');return false;}}
function setWorld(w){if(mode==='scenario')draft=w;else root=w;}
function mutate(fn){const before=D.clone(world());try{fn(project());const valid=D.validate(world());setWorld(valid);const h=mode==='scenario'?scenarioHistory:history;h.push(before);if(h.length>40)h.shift();if(mode!=='scenario')persist();render();return true;}catch(e){setWorld(before);toast(e.message);const err=$('#form-error');if(err)err.textContent=e.message;return false;}}
function undo(){const h=mode==='scenario'?scenarioHistory:history;if(!h.length)return toast('Geri alınacak değişiklik yok.');setWorld(h.pop());selected=null;detailMode=null;rate=0;if(mode!=='scenario')persist();render();toast('Son değişiklik geri alındı.');}
function chooseProject(key){if(!root.projects.some(p=>p.id===key))return toast('Konum bulunamadı.');kindFilter='';cancelPlot();rate=0;interior=null;selected=null;detailMode=null;route=false;search='';$('#search').value='';root.active=key;if(cityFilter&&root.projects.find(p=>p.id===key).city!==cityFilter)cityFilter='';mode='edit';draft=null;view='buildings';group='area';persist();render();scene?.overview();}
function select(record){cancelPlot();selected=record;detailMode=null;view=record.col;group=['buildings','spaces','landscape','containers'].includes(view)?'area':['workers','vehicles'].includes(view)?'team':'work';dismissBrowser();render();const r=selectedRecord();if(r?.x!=null)scene?.focus(r);else if(r?.buildingId)scene?.focus(project().buildings.find(b=>b.id===(r.targetId||r.buildingId)));$('#inspector').scrollTop=0;}
function groups(){return {area:{name:'Alan',symbol:'▤',views:['buildings','spaces','landscape','containers']},team:{name:'Ekip',symbol:'♙',views:['workers','vehicles']},work:{name:'İşler',symbol:'☷',views:domain()==='business'?['operations','jobs','tasks','materials','alerts']:['operations','jobs','tasks','materials','alerts']}};}
function tab(next){view=next;selected=null;detailMode=null;search='';$('#search').value='';render();}
function render(){
 const p=project();cursor=D.date(p.cursor);const portfolios=root.portfolios.filter(f=>f.domain===p.domain);$('#portfolio').innerHTML=portfolios.map(f=>'<option value="'+esc(f.id)+'">'+esc(f.name)+'</option>').join('');$('#portfolio').value=p.portfolioId;const locations=root.projects.filter(x=>x.domain===p.domain&&x.portfolioId===p.portfolioId),cities=[...new Set(locations.map(x=>x.city))];if(cityFilter&&!cities.includes(cityFilter))cityFilter='';$('#city-filter').innerHTML='<option value="">Tüm şehirler</option>'+cities.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join('');$('#city-filter').value=cityFilter;$('#city-filter').hidden=cities.length<2;const choices=locations.filter(x=>!cityFilter||x.city===cityFilter);const total=D.portfolioStats(root,p.portfolioId);$('#portfolio-summary').textContent=total.cities+' şehir · '+total.locations+' konum · '+total.wholeBuildings+' tam bina · '+total.units+' birim ↗';
 $('#project').innerHTML=choices.map(x=>'<option value="'+esc(x.id)+'">'+esc(x.name)+(x.name.toLocaleLowerCase('tr-TR').includes(x.city.toLocaleLowerCase('tr-TR'))?'':' · '+esc(x.city))+'</option>').join('');$('#project').value=p.id;$('#project').title=p.name+' · '+p.city+(p.address?' · '+p.address:'');
 $('[data-domain="construction"]').classList.toggle('active',p.domain==='construction');$('[data-domain="business"]').classList.toggle('active',p.domain==='business');
 $('#project-meta').textContent=p.city+(p.district?' / '+p.district:'')+' · '+LAYOUTS[p.layoutType];
 $('#business-modes').hidden=p.domain!=='business';$('#new-land').hidden=false;
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
 $('#scene-kicker').textContent=mode==='scenario'?'BAĞIMSIZ SENARYO':p.domain==='business'?'İŞLETME DÜNYASI':'ŞANTİYE DÜNYASI';
 $('[data-domain="construction"]').setAttribute('aria-pressed',String(p.domain==='construction'));$('[data-domain="business"]').setAttribute('aria-pressed',String(p.domain==='business'));
 $('#scene-title').textContent=p.name;$('#scene-copy').textContent=interior?'Depo içindesin. Raf ve palet düzenini oluştur.':mode==='scenario'?'Senaryo kopyasını düzenle; ana dünya bundan etkilenmez.':'Bir nesne seç, bilgilerini ve bağlantılarını keşfet.';
 $('#exit-interior').hidden=!interior;$('#calendar-toggle').hidden=p.domain==='business';$('#summary-toggle').textContent=mode==='scenario'?'Senaryo özeti':'Proje özeti';
 const gs=groups();if(!gs[group].views.includes(view))view=gs[group].views[0];
 $('#groups').innerHTML=Object.entries(gs).map(([key,g])=>'<button data-group="'+key+'" class="'+(group===key?'active':'')+'" aria-pressed="'+(group===key)+'"><span>'+g.symbol+'</span>'+g.name+'</button>').join('');
 $('#groups').querySelectorAll('button').forEach(b=>b.onclick=()=>{group=b.dataset.group;tab(groups()[group].views[0]);});
 $('#views').innerHTML=gs[group].views.map(key=>'<button data-view="'+key+'" class="'+(view===key?'active':'')+'" aria-pressed="'+(view===key)+'">'+(D.LABELS[key]||'Uyarılar')+'</button>').join('');
 $('#views').querySelectorAll('button').forEach(b=>b.onclick=()=>tab(b.dataset.view));
 renderRecords();renderStats();renderDetail();scene?.rebuild(p,{interior,selected,route});updateClockLabel();
 $('#undo').disabled=!(mode==='scenario'?scenarioHistory:history).length;
}
function rowText(col,r){if(col==='operations')return O.TYPES[r.type]+' · '+operationStatus(r)+' · '+r.due;if(col==='spaces')return UNITS[r.type]+' · '+(project().buildings.find(b=>b.id===r.buildingId)?.name||'')+' · '+(r.floor===1?'Zemin':(r.floor-1)+'. kat')+' · '+r.area+' m²';if(col==='buildings')return D.KINDS[r.kind]+' · '+r.w+' × '+r.d+' m · '+r.floors+' kat · '+r.end.slice(0,4);if(col==='workers')return r.role+' · '+D.AUTH[r.authority];if(col==='vehicles')return D.VEHICLES[r.type]+' · '+(project().workers.find(w=>w.id===r.driverId)?.name||'Sürücü atanmadı');if(col==='containers')return project().workers.filter(w=>w.containerId===r.id).length+' / '+r.capacity+' kişi';if(col==='landscape')return D.LAND[r.type]+' · '+r.w+' × '+r.d+' m';if(col==='tasks')return D.STATUS[r.status]+' · '+r.due;if(col==='materials')return fmt(r.stock)+' '+r.unit+' · Minimum '+fmt(r.minimum);if(col==='jobs')return D.JOBS[r.type]+' · '+r.loaded+' / '+r.quantity+' · '+D.STATUS[r.status];return '';}
function renderRecords(){
 const p=project(),out=$('#records'),scroll=out.scrollTop;
 const quick=$('#quick-add'),quickLabel={buildings:'Yapı ekle',spaces:'Birim ekle',landscape:'Peyzaj ekle',containers:'Konteyner ekle',workers:'Çalışan ekle',vehicles:'Araç ekle',operations:'Saha kaydı ekle',tasks:'Görev ekle',materials:'Malzeme ekle',jobs:'İşlem ekle'}[view];
 quick.hidden=!quickLabel;quick.textContent=quickLabel?'＋ '+quickLabel:'';$('#kind-filter').hidden=!['buildings','spaces'].includes(view);$('#list-label').textContent=(D.LABELS[view]||'Uyarılar').toLocaleUpperCase('tr-TR');
 if(view==='alerts'){const a=D.alerts(p,cursor);$('#list-count').textContent=a.length;out.innerHTML=a.map(s=>'<div class="alert">'+esc(s)+'</div>').join('')||'<div class="empty"><strong>Her şey yolunda</strong>Bu tarihte açık uyarı yok.</div>';return;}
 $('#kind-filter').hidden=!['buildings','spaces'].includes(view);$('#kind-filter').innerHTML='<option value="">Tüm yapı kategorileri</option>'+Object.entries(FAMILIES).map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join('');if(view==='spaces'){$('#kind-filter').innerHTML='<option value="">Tüm birim türleri</option>'+Object.entries(UNITS).map(([k,n])=>'<option value="'+k+'">'+n+'</option>').join('');$('#kind-filter').value=unitFilter;}else $('#kind-filter').value=kindFilter;$('#kind-filter').setAttribute('aria-label',view==='spaces'?'Birim türü filtresi':'Yapı kategorisi');const rows=p[view].filter(r=>(view!=='buildings'||!kindFilter||CATALOG[r.kind].family===kindFilter)&&(view!=='spaces'||!unitFilter||r.type===unitFilter)&&(!search||(JSON.stringify(r)+' '+rowText(view,r)).toLocaleLowerCase('tr-TR').includes(search))); $('#list-count').textContent=rows.length;
 out.innerHTML=rows.map(r=>'<button class="record '+(selected?.id===r.id?'active':'')+'" data-id="'+esc(r.id)+'"><span class="symbol">'+icons[view]+'</span><span><strong>'+esc(r.name)+'</strong><small>'+esc(rowText(view,r))+'</small></span>'+(view==='buildings'?'<em>%'+D.phase(r,cursor).percent+'</em>':'')+'</button>').join('')||'<div class="empty"><strong>'+(search?'Sonuç bulunamadı':'Henüz kayıt yok')+'</strong>'+(search?'Başka bir ad veya plaka ara.':'İlk kaydını + Ekle ile oluştur.')+'</div>';
 out.querySelectorAll('button').forEach(b=>b.onclick=()=>select({col:view,id:b.dataset.id}));out.scrollTop=scroll;
}
function renderStats(){const p=project(),m=D.metrics(p),data=p.domain==='business'?[['Yapı',p.buildings.length,''],['Birim',p.spaces.length,''],['Ekip',p.workers.length,'']]:[['Yapı / birim',p.buildings.length+' / '+p.spaces.length,''],['Aktif ekip',p.workers.filter(w=>w.status==='active').length,''],['Araç',p.vehicles.length,'']];$('#stats').innerHTML=data.map(([l,n,u])=>'<div class="stat"><span>'+l+'</span><strong>'+(typeof n==='string'?esc(n):fmt(n))+'</strong>'+(u?'<small>'+u+'</small>':'')+'</div>').join('');}
const kv=rows=>'<dl class="kv">'+rows.map(([a,b])=>'<div><dt>'+esc(a)+'</dt><dd>'+esc(b??'Atanmadı')+'</dd></div>').join('')+'</dl>';
const button=(label,action,css='')=>'<button class="wide '+css+'" data-action="'+action+'">'+esc(label)+'</button>';
const linkRecord=(col,r,label)=>r?'<button class="wide" data-link-col="'+col+'" data-link-id="'+esc(r.id)+'">'+esc(label||r.name)+' ↗</button>':'';
function renderDetail(){
 const p=project(),r=selectedRecord(),el=$('#detail'),open=Boolean(r||detailMode);$('#today-toggle').setAttribute('aria-pressed',String(detailMode==='today'));$('#inspector').hidden=!open;if(!open)return;
 let html='';$('#detail-kicker').textContent=detailMode==='calendar'?'PLANLAMA':mode==='scenario'?'SENARYO KOPYASI':'KAYIT DETAYI';
 if(detailMode==='today'){html=dailyPanel();$('#detail-kicker').textContent='GÜNLÜK TAKİP';}
 else if(detailMode==='calendar'){
  const bounds=D.range(p);html='<h2>Takvim ve hız</h2><p class="detail-copy">Seçtiğin tarihte yapının durumunu gör. Planı hızlandırarak baştan sona izleyebilirsin.</p><label>Görünüm tarihi<input id="plan-date" type="date" min="'+D.iso(bounds.start)+'" max="'+D.iso(bounds.end)+'" value="'+p.cursor+'"></label><label>Plan ilerlemesi<select id="plan-rate">'+[[0,'Seçili tarihte kal'],[.5,'0,5× · 15 gün/sn'],[1,'1× · 30 gün/sn'],[2,'2× · 60 gün/sn'],[5,'5× · 150 gün/sn']].map(([n,s])=>'<option value="'+n+'" '+(rate===n?'selected':'')+'>'+s+'</option>').join('')+'</select></label>'+button('Yapımı başlangıçtan izle','animate','gold')+'<p class="detail-copy">Doğrusal plan senaryosudur; hava, ekip verimi veya gerçek şantiye gecikmelerini hesaplamaz.</p>';
 }else if(detailMode==='summary'||detailMode==='scenario'){
  const total=p.buildings.reduce((n,b)=>n+b.budget,0);html='<span class="tag">'+(mode==='scenario'?'Bağımsız senaryo':'Proje özeti')+'</span><h2>'+esc(p.name)+'</h2>'+kv([['Şehir / ilçe',p.city+(p.district?' / '+p.district:'')],['Adres',p.address||'Belirtilmedi'],['Yerleşke',LAYOUTS[p.layoutType]],['Bağımsız birim',p.spaces.length],['Yapı',p.buildings.length],['Çalışan',p.workers.length],['Araç',p.vehicles.length],['Konaklama',p.containers.length+' konteyner'],['Açık görev',p.tasks.filter(t=>t.status!=='done').length],['Bütçe',money(total)],['Plan bitişi',D.iso(D.range(p).end)]]);
  if(mode==='scenario'){const base=D.metrics(root.projects.find(q=>q.id===p.id)),now=D.metrics(p);html+='<div class="scenario-card">Ana dünya: '+base.capacity+' palet / '+base.production+' adet/sa<br>Senaryo: '+now.capacity+' palet / '+now.production+' adet/sa</div><label>Talep senaryosu: <span id="demand-value">%'+demand+'</span><input id="demand" type="range" min="50" max="200" value="'+demand+'"></label><p class="detail-copy" id="scenario-result">'+scenarioText()+'</p>'+button('Senaryoyu sıfırla','reset-scenario');}
  else html+=button('Konum bilgilerini düzenle','location-edit')+button('Tüm şehirler ve konumlar','portfolio')+button('Parsel sınırı ve giriş kapısı','boundary')+button('Kapsio veri aktarımı','kapsio');
  const a=D.alerts(p,cursor);html+='<h3>Dikkat gerektirenler</h3>'+(a.map(s=>'<div class="alert">'+esc(s)+'</div>').join('')||'<p class="detail-copy">Açık uyarı yok.</p>');
 }else if(r){
  html='<span class="tag">'+esc(D.LABELS[selected.col])+'</span><h2>'+esc(r.name)+'</h2>';
  if(selected.col==='buildings'){const ph=D.phase(r,cursor),m=D.estimate(r);html+='<div class="progress-label"><span id="phase-stage">'+ph.stage+'</span><strong id="phase-percent">%'+ph.percent+'</strong></div><div class="bar"><span id="phase-bar" style="width:'+ph.percent+'%"></span></div>'+kv([['Tür',D.KINDS[r.kind]],['Taban',r.w+' × '+r.d+' m'],['Kat',r.floors],['Başlangıç',r.start],['Bitiş',r.end],['Bütçe',money(r.budget)],['Konum',r.x+' / '+r.z+' m']])+'<h3>Kaba malzeme senaryosu</h3>'+kv([['Toplam kat alanı',m.area+' m²'],['Beton',m.concrete+' m³'],['Çelik',m.steel+' ton'],['Tuğla',m.brick+' adet']])+'<p class="detail-copy">Örnek katsayılara dayanır; stok tüketmez ve mühendislik keşfi değildir.</p>';const units=p.spaces.filter(u=>u.buildingId===r.id);html+='<h3>Bağımsız bölümler · '+units.length+'</h3>'+units.map(u=>linkRecord('spaces',u,u.name+' · '+(u.floor===1?'Zemin':(u.floor-1)+'. kat'))).join('')+button('Bu binaya birim ekle','add-space');if(r.kind==='warehouse'||CATALOG[r.kind].model==='warehouse')html+=button('Depoya gir · Raf ve palet düzenle','enter','gold');html+=button('Yapıyı çoğalt','duplicate');}
  else if(selected.col==='spaces'){const host=p.buildings.find(b=>b.id===r.buildingId);html+=kv([['Birim türü',UNITS[r.type]],['Bina',host?.name],['Seviye',r.floor===1?'Zemin':(r.floor-1)+'. kat'],['Kapı / bölüm',r.number||'Belirtilmedi'],['Alan',r.area+' m²'],['Kişi kapasitesi',r.capacity],['Departman',r.department||'Genel'],['Durum',r.status==='active'?'Kullanımda':r.status==='closed'?'Kapalı':'Planlanan']])+linkRecord('buildings',host,'Bulunduğu binayı aç')+'<h3>Atanmış çalışanlar</h3>'+p.workers.filter(w=>w.spaceId===r.id).map(w=>linkRecord('workers',w)).join('');}
  else if(selected.col==='workers'){const b=p.buildings.find(b=>b.id===r.buildingId),c=p.containers.find(c=>c.id===r.containerId),v=p.vehicles.find(v=>v.driverId===r.id);html+=kv([['Uzmanlık',r.role],['Yetki',D.AUTH[r.authority]],['Görünüm',p.domain==='business'?'İşletme profili · '+D.AUTH[r.authority]:r.authority==='chief'?'Beyaz baret / mavi yelek':r.authority==='leader'?'Mavi baret / yeşil yelek':'Sarı baret / turuncu yelek'],['Vardiya',r.shift],['Durum',D.STATUS[r.status]],['Yapı',b?.name],['Konaklama',c?.name],['Bağımsız birim',p.spaces.find(u=>u.id===r.spaceId)?.name]])+linkRecord('spaces',p.spaces.find(u=>u.id===r.spaceId),'Atanmış birimi aç')+linkRecord('vehicles',v,'Atanmış araç · '+v?.plate);}
  else if(selected.col==='vehicles'){const w=p.workers.find(w=>w.id===r.driverId),b=p.buildings.find(b=>b.id===r.buildingId);html+=kv([['Plaka',r.plate],['Tür',D.VEHICLES[r.type]],['Kapasite',r.capacity+(r.type==='mixer'?' m³':' palet / sınıf')],['Durum',D.STATUS[r.status]],['Yapı',b?.name],['Sürücü',w?.name]])+linkRecord('workers',w,'Araçtaki sürücü · '+w?.name)+'<p class="detail-copy">Saha hareketi temsili animasyondur. Canlı GPS bağlı değildir.</p>';}
  else if(selected.col==='containers'){const occupants=p.workers.filter(w=>w.containerId===r.id);html+=kv([['Ölçü',r.w+' × '+r.d+' m'],['Kapasite',r.capacity+' kişi'],['Doluluk',occupants.length+' kişi'],['Konum',r.x+' / '+r.z]])+occupants.map(w=>linkRecord('workers',w)).join('');}
  else if(selected.col==='landscape'){const b=p.buildings.find(b=>b.id===r.buildingId);html+=kv([['Tür',D.LAND[r.type]],['Ölçü',r.w+' × '+r.d+' m'],['Yükseklik / derinlik',r.h+' m'],['Bağlı yapı',b?.name],['Konum',r.x+' / '+r.z]])+(r.type==='pool'?'<p class="detail-copy">Havuz aşaması: '+esc(D.poolPhase(r,p,cursor).stage)+' · Yapının takvimine bağlı.</p>':'');}
  else if(selected.col==='tasks'){html+=kv([['Bitiş',r.due],['Sorumlu',p.workers.find(w=>w.id===r.workerId)?.name],['Yapı',p.buildings.find(b=>b.id===r.buildingId)?.name]])+'<label>Görev durumu<select id="task-status">'+Object.entries({todo:'Yapılacak',doing:'Devam ediyor',done:'Tamamlandı'}).map(([k,n])=>'<option value="'+k+'" '+(k===r.status?'selected':'')+'>'+n+'</option>').join('')+'</select></label>';}
  else if(selected.col==='operations'){html+=operationDetail(p,r);}
  else if(selected.col==='materials'){html+=kv([['Stok',fmt(r.stock)+' '+r.unit],['Minimum',fmt(r.minimum)+' '+r.unit]])+button('Malzeme girişi yap','receive','gold');}
  else if(selected.col==='jobs'){
   const v=p.vehicles.find(v=>v.id===r.vehicleId),b=p.buildings.find(b=>b.id===r.buildingId),dist={istanbul:453,eskisehir:234,konya:283}[r.route],segments=['Tesis çıkışı','Çevre yolu','Şehirler arası yol','Varış bağlantısı'];
   html+=kv([['İşlem',D.JOBS[r.type]],['Durum',D.STATUS[r.status]],['Tesis',b?.name],['Yüklenen / işlenen',r.loaded+' / '+r.quantity],['Araç',v?.plate],['Beklenen tarih',r.due||'Belirtilmedi'],['Örnek rota',r.route==='istanbul'?'Ankara → İstanbul':r.route==='konya'?'Ankara → Konya':'Ankara → Eskişehir'],['Yol kesimi',segments[Math.min(3,Math.floor(r.progress*4))]],['Planlanan kalan',Math.round(dist*(1-r.progress))+' km']])+linkRecord('vehicles',v);
   if(['planned','loading'].includes(r.status))html+=button(r.type==='production'?'Üretim adımı ekle':'Yük / kabul adımı ekle','job-load','gold');
   if(r.status==='ready')html+=button(r.type==='production'?'Üretimi tamamla':'Aracı yola çıkar','job-dispatch','gold');
   if(r.status==='transit')html+=button('Örnek konumu %25 ilerlet','job-advance','gold');
   html+=button(route?'Tesis görünümüne dön':'Şematik rotayı göster','route')+'<p class="detail-copy">Konum, yol ve mesafe örnek plan verisidir. Araç kendiliğinden gerçek konum bildirmez. Görünen kutular işlem adedini temsil eder.</p>';
  }
  if((selected.col==='jobs'&&r.type!=='production')||(selected.col==='operations'&&r.type==='delivery'))html+=button(r.trip?'Rota ve saatleri düzenle':'Rota ve saat ekle','trip','gold');
  if(r.trip)html+=kv([['Kalkış (Türkiye)',r.trip.departure.replace('T',' ')],['Tahmini varış',r.trip.arrival.replace('T',' ')]]);
  if(['buildings','spaces','landscape'].includes(selected.col)){
   const list=p.operations.filter(o=>selected.col==='spaces'?o.spaceId===r.id:selected.col==='landscape'?o.stage==='pool'&&o.buildingId===r.buildingId:o.buildingId===r.id);
   if(selected.col!=='landscape'||r.type==='pool'&&r.buildingId)html+='<h3>Bağlı saha kayıtları · '+list.length+'</h3>'+list.map(o=>linkRecord('operations',o)).join('')+button('Bu konuma saha kaydı ekle','op-add');
  }
  if(['buildings','landscape','containers'].includes(selected.col))html+=button('Arazide yeni konum seç','move')+button('90° döndür · R','rotate');html+=button('Bilgileri düzenle','edit')+(r.received?'':button('Kaydı kaldır','remove','danger'));
 }
 if(p.log.length&&detailMode!=='calendar')html+='<h3>Son işlemler</h3>'+p.log.slice(0,3).map(l=>'<p class="detail-copy">'+esc(l.message)+'</p>').join('');
 el.innerHTML=html;
 el.querySelectorAll('[data-action]').forEach(b=>b.onclick=()=>act(b.dataset.action));
 el.querySelectorAll('[data-link-id]').forEach(b=>b.onclick=()=>select({col:b.dataset.linkCol,id:b.dataset.linkId}));
 el.querySelectorAll('[data-daily]').forEach(b=>b.onclick=()=>openDailyRecord(b.dataset.site,b.dataset.col,b.dataset.daily));
 $('#daily-scope')?.addEventListener('change',e=>{dailyScope=e.target.value;renderDetail();$('#daily-scope')?.focus();});
 $('#daily-filter')?.addEventListener('change',e=>{dailyFilter=e.target.value;renderDetail();$('#daily-filter')?.focus();});
 $('#task-status')?.addEventListener('change',e=>mutate(p=>D.put(p,'tasks',{...r,status:e.target.value})));
 $('#plan-date')?.addEventListener('change',e=>{try{const t=D.date(e.target.value),range=D.range(p);if(t<range.start||t>range.end)throw Error('Tarih plan aralığında olmalı.');rate=0;p.cursor=e.target.value;cursor=t;persist();scene?.update(p.cursor);renderDetail();renderRecords();updateClockLabel();}catch(err){toast(err.message);renderDetail();}});
 $('#plan-rate')?.addEventListener('change',e=>{rate=Number(e.target.value);if(rate&&cursor>=D.range(p).end){cursor=D.range(p).start;p.cursor=D.iso(cursor);}updateClockLabel();});
 $('#demand')?.addEventListener('input',e=>{demand=Number(e.target.value);$('#demand-value').textContent='%'+demand;$('#scenario-result').textContent=scenarioText();});
}
function scenarioText(){const base=D.metrics(root.projects.find(q=>q.id===project().id)),now=D.metrics(project()),needed=Math.round(base.production*demand/100);return 'Talep '+needed+' adet/sa; senaryo kapasitesi '+now.production+' adet/sa. '+(now.production>=needed?'Kapasite yeterli.':'Kapasite açığı '+(needed-now.production)+' adet/sa.');}
function act(action){
 const p=project(),r=selectedRecord();
 if(action==='trip')return tripForm();
 if(action==='location-edit')return locationForm(true);if(action==='portfolio')return portfolioOverview();if(action==='kapsio')return kapsioPanel();
 if(action==='op-add')return operationForm(null,{buildingId:selected?.col==='buildings'?r.id:r?.buildingId,spaceId:selected?.col==='spaces'?r.id:null,type:selected?.col==='spaces'||domain()==='business'?'maintenance':'stage',stage:selected?.col==='landscape'?'pool':undefined});
 if(action==='accept-delivery')return confirmDialog('Teslim al ve stoğa ekle?',r.name+' için bir kez stok girişi yapılacak.',()=>mutate(p=>D.acceptDelivery(p,r.id)));
 if(action==='edit')return edit(selected.col,r);
 if(action==='rotate')return mutate(p=>D.rotateRecord(p,selected.col,r.id));
 if(action==='move'){if(!scene)return edit(selected.col,r);moving={col:selected.col,id:r.id};plotting=true;$('#plot-hint').hidden=false;$('#plot-hint span').textContent='Nesnenin yeni merkezi için arazide tıkla.';$('#inspector').hidden=true;scene.setPlot(true);return;}
 if(action==='remove')return confirmDialog('Kaydı kaldır?',r.name+' kaydı kaldırılacak. Geri al ile geri dönebilirsin.',()=>{if(mutate(p=>D.remove(p,selected.col,r.id))){selected=null;render();return true;}return false;});
 if(action==='duplicate'){try{const pos=D.findSpot(p,r.w,r.d);return mutate(p=>{const x=D.put(p,'buildings',{...r,id:undefined,name:r.name+' kopyası',...pos});selected={col:'buildings',id:x.id};});}catch(e){return toast(e.message);}}
 if(action==='enter'){interior=r.id;scene?.focus(r);render();return;}
 if(action==='add-space')return edit('spaces');
 if(action==='boundary')return boundaryForm();
 if(action==='receive')return receiveForm(r);
 if(action==='route'){route=!route;render();return;}
 if(action.startsWith('job-'))return mutate(p=>D.stepJob(p,r.id,action.slice(4)));
 if(action==='animate'){cursor=D.range(p).start;p.cursor=D.iso(cursor);rate=.5;renderDetail();scene?.update(p.cursor);return;}
 if(action==='reset-scenario'){const active=root.active;draft=D.clone(root);draft.active=active;scenarioHistory=[];selected=null;render();return;}
}
const inp=(name,label,value='',type='text',attrs='')=>'<label>'+esc(label)+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" required '+attrs+'></label>';
const optional=(name,label,value='')=>inp(name,label,value).replace(' required ',' ');
const sel=(name,label,options,value='')=>'<label>'+esc(label)+'<select aria-label="'+esc(label)+'" name="'+name+'">'+options.map(([k,n])=>'<option value="'+esc(k)+'" '+(String(k)===String(value)?'selected':'')+'>'+esc(n)+'</option>').join('')+'</select></label>';
const options=(collection,label='Atanmadı')=>[['',label],...project()[collection].map(r=>[r.id,r.name])];
function modal(title,basic,advanced,onSubmit,label='Kaydet'){
 rate=0;const d=$('#dialog');d.innerHTML='<div class="dialog-head"><span class="eyebrow">PROJECT WORLD</span><button type="button" id="dialog-close" aria-label="Pencereyi kapat">×</button></div><h2>'+esc(title)+'</h2><form id="form"><div class="form-grid">'+basic+'</div>'+(advanced?'<details class="advanced"><summary>Diğer bilgiler ve yerleşim</summary><div class="form-grid">'+advanced+'</div></details>':'')+'<p id="form-error" class="form-error" role="alert"></p><div class="form-actions"><button type="button" class="soft" id="dialog-cancel">Vazgeç</button><button class="gold" type="submit">'+esc(label)+'</button></div></form><p class="note">Saha kayıtları bu tarayıcıda saklanır. Araçlar menüsünden JSON yedeği indirebilirsin.</p>';
 $('#dialog-close').onclick=()=>d.close();$('#dialog-cancel').onclick=()=>d.close();$('#form').addEventListener('invalid',e=>{const details=e.target.closest('details');if(details)details.open=true;},true);
 $('#form').onsubmit=async e=>{e.preventDefault();try{const input=Object.fromEntries(new FormData(e.target));const btn=e.target.querySelector('[type=submit]');if(btn.disabled)return;btn.disabled=true;try{if(await onSubmit(input)!==false&&d.contains(e.target))d.close();}finally{btn.disabled=false;}}catch(err){$('#form-error').textContent=err.message;toast(err.message);}};d.showModal();
}
function confirmDialog(title,copy,fn){modal(title,'<p class="detail-copy">'+esc(copy)+'</p>','',fn,'Onayla');}
function addMenu(){const d=$('#dialog');rate=0;const list=[['buildings','Bina / yapı','Konut, ticari, sanayi veya karma yapı'],['spaces','Bağımsız bölüm','Binada ofis, daire, dükkân veya depo bölümü'],['pool','Havuz','Ölçü, derinlik ve yapım takvimi'],['landscape','Bahçe ve peyzaj','Çim, yol, ağaç, çit ve pergola'],['containers','Konaklama konteyneri','Kapasite ve ekip yerleşimi'],['workers','Çalışan','Ad, görev, yetki ve atamalar'],['vehicles','Araç','Plaka, sürücü ve kapasite'],['operations','Saha kaydı','Yapım aşaması, bakım arızası veya teslimat'],['tasks','Görev','Sorumlu, yapı ve bitiş tarihi'],['materials','Malzeme','Stok ve minimum miktar'],['boundary','Parsel ve kapı','Sınır biçimi ve giriş']];if(domain()==='business')list.splice(1,0,['jobs','İşlem','Sevkiyat, üretim, tedarik ve transfer']);
 const sections=[['Alan',['buildings','spaces','pool','landscape','containers','boundary']],['Ekip',['workers','vehicles']],['İşler',['operations','jobs','tasks','materials']]];
 const cards=new Map(list.map(([key,n,s])=>[key,'<button data-add="'+key+'"><span class="symbol">'+(icons[key]||'◇')+'</span><span><strong>'+n+'</strong><small>'+s+'</small></span></button>']));
 const sectionIndex={area:0,team:1,work:2}[group];const ordered=[sections[sectionIndex],...sections.filter((_,i)=>i!==sectionIndex)];
 d.innerHTML='<div class="dialog-head"><span class="eyebrow">PROJENE EKLE</span><button id="dialog-close" aria-label="Pencereyi kapat">×</button></div><h2>Ne eklemek istersin?</h2>'+ordered.map(([label,keys])=>'<section class="add-section"><h3>'+label+'</h3><div class="add-menu">'+keys.map(key=>cards.get(key)||'').join('')+'</div></section>').join('');$('#dialog-close').onclick=()=>d.close();d.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{d.close();const key=b.dataset.add;if(key==='buildings')beginPlot();else if(key==='boundary')boundaryForm();else if(key==='pool')edit('landscape',null,{type:'pool'});else edit(key);});d.showModal();
}
function beginPlot(){if(!scene){try{return edit('buildings',null,{...D.findSpot(project(),10,10),w:10,d:10});}catch(e){return toast(e.message);}}plotting=true;$('#plot-hint').hidden=false;dismissBrowser();$('#inspector').hidden=true;scene.setPlot(true);}
function cancelPlot(){moving=null;plotting=false;$('#plot-hint').hidden=true;scene?.setPlot(false);}
function edit(col,record=null,pref={}){
 if(col==='operations')return operationForm(record,pref);
 const p=project();let r=record||{},basic='',advanced='';
 const nums=(values,keys)=>{const result={...values};for(const k of keys)result[k]=Number(result[k]);return result;};
 if(col==='spaces'){
  if(!p.buildings.length)return toast('Önce bir bina ekle veya Tek ofis şablonuyla konum oluştur.');r={name:'Yeni ofis',type:'office',buildingId:selected?.col==='buildings'?selected.id:p.buildings[0].id,floor:1,area:25,capacity:5,number:'',department:'',status:'active',...r};basic=inp('name','Birim adı',r.name)+sel('type','Birim türü',Object.entries(UNITS),r.type)+sel('buildingId','Bulunduğu bina',p.buildings.map(b=>[b.id,b.name]),r.buildingId)+inp('floor','Seviye (1 = zemin)',r.floor,'number','min="1" max="40" step="1"')+inp('area','Alan (m²)',r.area,'number','min="1" step="any"')+inp('capacity','Kişi kapasitesi',r.capacity,'number','min="1" max="10000"');advanced=optional('number','Kapı / bölüm numarası (isteğe bağlı)',r.number||'')+optional('department','Bölüm / departman (isteğe bağlı)',r.department||'')+sel('status','Birim durumu',[['active','Kullanımda'],['planned','Planlanan'],['closed','Kapalı']],r.status);
 }else if(col==='buildings'){
  r={name:'Yeni yapı',kind:domain()==='business'?'office':'building',w:10,d:10,floors:3,x:0,z:0,budget:0,roof:'flat',color:'#c9b99e',start:'2026-10-26',end:'2028-12-31',...r,...pref};
  const family=CATALOG[r.kind].family;const kinds=Object.entries(D.KINDS).filter(([k])=>CATALOG[k].family===family);
  basic=inp('name','Yapı adı',r.name)+sel('family','Yapı kategorisi',Object.entries(FAMILIES),family)+sel('kind','Yapı türü',kinds,r.kind)+inp('w','En (m)',r.w,'number','min="5" max="60" step="any"')+inp('d','Boy (m)',r.d,'number','min="5" max="60" step="any"')+inp('floors','Kat sayısı',r.floors,'number','min="1" max="40" step="1"')+inp('end','Tahmini bitiş tarihi',r.end,'date');
  advanced=sel('scope','Yapı kullanımı',[['whole','Tüm bina / yapı'],['shared','Paylaşılan bina; kendi birimlerim']],r.scope||'whole')+inp('start','Başlangıç tarihi',r.start,'date')+inp('budget','Plan bütçesi (₺)',r.budget,'number','min="0" max="1000000000000"')+sel('roof','Çatı',Object.entries({flat:'Düz çatı',pitched:'Eğimli çatı'}),r.roof)+inp('color','Cephe rengi',r.color,'color')+inp('x','Konum X (m)',r.x,'number','min="-30" max="30" step="any"')+inp('z','Konum Z (m)',r.z,'number','min="-30" max="30" step="any"');
 }else if(col==='workers'){
  const roles=domain()==='business'?BUSINESS_ROLES:D.ROLES;r={firstName:'',lastName:'',role:roles[0],authority:'worker',buildingId:'',containerId:'',shift:'08:00–17:00',status:'active',...r};
  basic=inp('firstName','Adı',r.firstName,'text','maxlength="50"')+inp('lastName','Soyadı',r.lastName,'text','maxlength="50"')+sel('role','Görev / uzmanlık',[...new Set([...roles,r.role])].map(x=>[x,x]),r.role)+sel('authority','Yetki ve görünüm',Object.entries(D.AUTH),r.authority);
  advanced=sel('buildingId','Yapı ataması',options('buildings'),r.buildingId)+sel('containerId','Konaklama konteyneri',options('containers'),r.containerId)+sel('spaceId','Bağımsız birim ataması',options('spaces'),r.spaceId||'')+inp('shift','Vardiya',r.shift)+sel('status','Çalışan durumu',[['active','Aktif'],['off','İzinli']],r.status);
 }else if(col==='vehicles'){
  r={plate:'',type:domain()==='business'?'semi':'mixer',driverId:'',buildingId:'',capacity:domain()==='business'?24:8,status:'active',...r};
  basic=inp('plate','Plaka',r.plate,'text','maxlength="20"')+sel('type','Araç türü',Object.entries(D.VEHICLES),r.type)+sel('driverId','Sürücü / operatör',options('workers'),r.driverId)+inp('capacity','Kapasite (palet / sınıf; mikserde m³)',r.capacity,'number','min="1" max="1000"');
  advanced=sel('buildingId','Yapı ataması',options('buildings'),r.buildingId)+sel('status','Araç durumu',[['active','Aktif'],['maintenance','Bakımda']],r.status);
 }else if(col==='containers'){
  let spot={x:0,z:0};if(!record)try{spot=D.findSpot(p,6,3);}catch{}
  r={name:'Ekip konaklama',w:6,d:3,capacity:12,...spot,...r};
  basic=inp('name','Konteyner adı',r.name)+inp('capacity','Kapasite (kişi)',r.capacity,'number','min="1" max="100" step="1"')+inp('w','En (m)',r.w,'number','min="3" max="15" step="any"')+inp('d','Boy (m)',r.d,'number','min="2" max="8" step="any"');
  advanced=inp('x','Konum X (m)',r.x,'number','min="-30" max="30" step="any"')+inp('z','Konum Z (m)',r.z,'number','min="-30" max="30" step="any"');
 }else if(col==='landscape'){
  const type=pref.type||(interior?'rack':'tree'),dims=landDefaults(type);let spot={x:0,z:0};if(!record)try{spot=D.findSpot(p,dims.w,dims.d);}catch{}
  const parent=interior?p.buildings.find(b=>b.id===interior):null;r={type,name:D.LAND[type],...dims,...spot,buildingId:'',parentId:interior||'',...r,...pref};if(parent&&!record){r.x=parent.x;r.z=parent.z;}
  basic=sel('type','Nesne türü',Object.entries(D.LAND).filter(([k])=>interior?['rack','pallet'].includes(k):!['rack','pallet'].includes(k)),r.type)+inp('name','Nesne adı',r.name)+inp('w','En (m)',r.w,'number','min="0.2" max="60" step="any"')+inp('d','Boy (m)',r.d,'number','min="0.2" max="60" step="any"')+inp('h','Yükseklik / havuz derinliği (m)',r.h,'number','min="0.05" max="10" step="any"')+sel('buildingId','Yapım takvimine bağla',options('buildings'),r.buildingId);
  advanced=inp('x','Konum X (m)',r.x,'number','min="-30" max="30" step="any"')+inp('z','Konum Z (m)',r.z,'number','min="-30" max="30" step="any"');
 }else if(col==='tasks'){
  r={name:'',buildingId:'',workerId:'',due:'2026-12-31',status:'todo',...r};
  basic=inp('name','Görev adı',r.name)+inp('due','Bitiş tarihi',r.due,'date')+sel('workerId','Sorumlu çalışan',options('workers'),r.workerId)+sel('buildingId','Yapı ataması',options('buildings'),r.buildingId)+sel('spaceId','Bağımsız birim ataması',options('spaces'),r.spaceId||'')+sel('status','Görev durumu',[['todo','Yapılacak'],['doing','Devam ediyor'],['done','Tamamlandı']],r.status);
 }else if(col==='materials'){
  r={name:'',unit:'adet',stock:0,minimum:0,...r};basic=inp('name','Malzeme adı',r.name)+inp('unit','Birim',r.unit)+inp('stock','Mevcut stok',r.stock,'number','min="0" max="1000000000" step="any"')+inp('minimum','Minimum stok',r.minimum,'number','min="0" max="1000000000" step="any"');
 }else if(col==='jobs'){
  r={name:'',type:'shipment',buildingId:'',targetId:'',vehicleId:'',quantity:24,loaded:0,status:'planned',route:'istanbul',progress:0,...r};
  basic=inp('name','İşlem adı',r.name)+sel('type','İşlem türü',Object.entries(D.JOBS),r.type)+sel('buildingId','Kaynak tesis',options('buildings','Tesis seç'),r.buildingId)+sel('targetId','Hedef tesis (transfer için)',options('buildings'),r.targetId)+sel('vehicleId','Atanmış araç',options('vehicles'),r.vehicleId)+inp('quantity','Miktar (palet / adet)',r.quantity,'number','min="1" max="500" step="1"');
  advanced=sel('route','Örnek rota',[['istanbul','Ankara → İstanbul'],['eskisehir','Ankara → Eskişehir'],['konya','Ankara → Konya']],r.route)+inp('due','Beklenen tarih (isteğe bağlı)',r.due||'','date').replace(' required ',' ');
 }
 if(!basic)return;
 modal((record?'Kaydı düzenle · ':'Yeni kayıt · ')+D.LABELS[col],basic,advanced,input=>{
  const values={...r,...nums(input,['w','d','floors','x','z','h','capacity','budget','stock','minimum','quantity','floor','area'].filter(k=>Object.hasOwn(input,k)))};
  const ok=mutate(p=>{const created=D.put(p,col,values);selected={col,id:created.id};view=col;group=['buildings','spaces','landscape','containers'].includes(col)?'area':['workers','vehicles'].includes(col)?'team':'work';detailMode=null;});return ok;
 });
 if(col==='spaces'){const host=$('#form [name=buildingId]');const sync=()=>{const b=p.buildings.find(b=>b.id===host.value);if(b){$('#form [name=floor]').max=b.floors;$('#form [name=area]').max=b.w*b.d;}};host.onchange=sync;sync();}
 if(col==='workers'||col==='tasks'){const unit=$('#form [name=spaceId]'),host=$('#form [name=buildingId]');if(unit){unit.onchange=()=>{const u=p.spaces.find(s=>s.id===unit.value);if(u)host.value=u.buildingId;};host.onchange=()=>{const u=p.spaces.find(s=>s.id===unit.value);if(u&&u.buildingId!==host.value)unit.value='';};}}
 if(col==='buildings'){const syncFloor=()=>{const f=$('#form [name=floors]');f.max=CATALOG[$('#form [name=kind]').value].max;if(Number(f.value)>Number(f.max))f.value=f.max;};$('#form [name=kind]').onchange=syncFloor;$('#form [name=family]').onchange=e=>{const kinds=Object.entries(D.KINDS).filter(([k])=>CATALOG[k].family===e.target.value);$('#form [name=kind]').innerHTML=kinds.map(([k,n])=>'<option value="'+k+'">'+esc(n)+'</option>').join('');syncFloor();};syncFloor();}
 if(col==='landscape')$('#form [name=type]').onchange=e=>{const t=e.target.value,defaults=landDefaults(t);$('#form [name=name]').value=D.LAND[t];for(const k of ['w','d','h'])$('#form [name='+k+']').value=defaults[k];};
}
function landDefaults(type){return ({pool:{w:8,d:5,h:1.5},lawn:{w:15,d:12,h:.07},path:{w:2,d:10,h:.08},terrace:{w:8,d:6,h:.12},tree:{w:2,d:2,h:4},fence:{w:7,d:.25,h:1.4},hedge:{w:7,d:.6,h:1.2},pergola:{w:5,d:4,h:2.8},light:{w:.4,d:.4,h:3},road:{w:5,d:25,h:.06},rack:{w:4,d:1.2,h:3},pallet:{w:1.2,d:1,h:.4}})[type];}
function boundaryForm(){const b=project().boundary;modal('Parsel sınırı ve kapı',sel('style','Sınır türü',[['fence','Bahçe çiti'],['wall','Duvar'],['hedge','Yeşil sınır'],['line','Yalnızca çizgi']],b.style)+inp('height','Sınır yüksekliği (m)',b.height,'number','min="0.5" max="3" step="0.1"')+inp('gate','Giriş genişliği (m)',b.gate,'number','min="2" max="10" step="0.5"'),'',input=>mutate(p=>{p.boundary={style:input.style,height:Number(input.height),gate:Number(input.gate)};D.log(p,'Parsel sınırı güncellendi.');}));}
function receiveForm(record){modal('Malzeme girişi · '+record.name,inp('quantity','Giriş miktarı ('+record.unit+')',1,'number','min="0.01" max="100000000" step="any"'),'',input=>mutate(p=>D.receive(p,record.id,Number(input.quantity))));}
function updateClockLabel(){const p=project();$('#scene-status').textContent=(mode==='scenario'?'Senaryo · ':rate?rate+'× takvim · ':'Plan görünümü · ')+new Date(cursor).toLocaleDateString('tr-TR',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});}
function tick(dt){if(rate&&!plotting&&!$('#dialog').open){const p=project(),bounds=D.range(p);cursor=Math.min(bounds.end,cursor+dt*D.DAY*30*rate);p.cursor=D.iso(cursor);if(cursor>=bounds.end){rate=0;renderDetail();}scene?.update(p.cursor);}
 if(performance.now()-lastUI>350){lastUI=performance.now();updateClockLabel();if(rate){const r=selectedRecord();if(selected?.col==='buildings'&&r){const ph=D.phase(r,cursor);if($('#phase-percent')){$('#phase-percent').textContent='%'+ph.percent;$('#phase-stage').textContent=ph.stage;$('#phase-bar').style.width=ph.percent+'%';}}const dateField=$('#plan-date');if(dateField&&document.activeElement!==dateField)dateField.value=project().cursor;renderRecords();}if(rate&&performance.now()-lastWrite>1500){lastWrite=performance.now();persist();}}
}
$('#project').onchange=e=>chooseProject(e.target.value);$('#portfolio').onchange=e=>{cityFilter='';chooseProject(root.projects.find(p=>p.portfolioId===e.target.value)?.id);};$('#city-filter').onchange=e=>{cityFilter=e.target.value;const site=root.projects.find(p=>p.portfolioId===project().portfolioId&&(!cityFilter||p.city===cityFilter));chooseProject(site?.id);};$('#kind-filter').onchange=e=>{if(view==='spaces')unitFilter=e.target.value;else kindFilter=e.target.value;renderRecords();};$('#portfolio-summary').onclick=portfolioOverview;document.querySelectorAll('[data-domain]').forEach(b=>b.onclick=()=>{cityFilter='';chooseProject(root.projects.find(p=>p.domain===b.dataset.domain)?.id);});
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{cancelPlot();rate=0;selected=null;interior=null;route=false;const next=b.dataset.mode;if(next==='scenario'&&!draft){draft=D.clone(root);draft.active=root.active;}mode=next;view=next==='operations'?'jobs':'buildings';group=next==='operations'?'work':'area';detailMode=next==='scenario'?'scenario':null;render();});
$('#quick-add').onclick=()=>{dismissBrowser();if(view==='buildings')beginPlot();else if(Object.hasOwn(D.LABELS,view))edit(view);};
$('#turkey-map').onclick=showMap;
$('#add-main').onclick=()=>{dismissBrowser();addMenu();};$('#search').oninput=e=>{search=e.target.value.toLocaleLowerCase('tr-TR');renderRecords();};
$('#today-toggle').onclick=()=>{dismissBrowser();cancelPlot();selected=null;detailMode=detailMode==='today'?null:'today';renderDetail();};
$('#summary-toggle').onclick=()=>{selected=null;detailMode=['summary','scenario'].includes(detailMode)?null:mode==='scenario'?'scenario':'summary';renderDetail();};
$('#calendar-toggle').onclick=()=>{selected=null;detailMode=detailMode==='calendar'?null:'calendar';renderDetail();};
$('#close-detail').onclick=()=>{selected=null;detailMode=null;render();};$('#mobile-browser').onclick=()=>setBrowser(!$('#browser').classList.contains('open'));$('#close-browser').onclick=()=>{setBrowser(false);$('#mobile-browser').focus();};
$('#new-land').onclick=organizationMenu;
$('#overview').onclick=()=>{selected=null;detailMode=null;interior=null;route=false;render();scene?.overview();};$('#grid').onclick=()=>{if(scene){scene.grid.visible=!scene.grid.visible;$('#grid').setAttribute('aria-pressed',String(scene.grid.visible));}};$('#undo').onclick=undo;$('#cancel-plot').onclick=cancelPlot;
$('#zoom-in').onclick=()=>scene?.zoom(1.2);$('#zoom-out').onclick=()=>scene?.zoom(1/1.2);$('#rotate').onclick=()=>scene?.rotate();$('#camera-reset').onclick=()=>scene?.overview();$('#exit-interior').onclick=()=>{interior=null;render();scene?.overview();};
$('#save').onclick=()=>{if(mode==='scenario')return toast('Senaryo ayrı kopyadır; Araçlar menüsünden JSON olarak indirebilirsin.');if(persist())toast('Bu tarayıcıya kaydedildi. JSON indirerek bağımsız veri yedeği alabilirsin.');};
$('#export').onclick=()=>{const blob=new Blob([JSON.stringify(world(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='Project-World-'+(mode==='scenario'?'Senaryo-':'')+D.iso(Date.now())+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('#file-menu').open=false;};
$('#import').onclick=()=>{$('#import-file').click();$('#file-menu').open=false;};$('#import-file').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{if(f.size>5e6)throw Error('JSON dosyası 5 MB sınırını aşıyor.');const next=D.validate(JSON.parse(await f.text()));confirmDialog('Dünya yedeğini aç','Mevcut dünya bu dosyayla değişecek. Önce JSON yedeği alabilirsin; değişimi Geri al ile geri çevirebilirsin.',()=>{history.push(D.clone(root));root=next;mode='edit';draft=null;selected=null;detailMode=null;rate=0;view='buildings';group='area';interior=null;persist();render();scene?.overview();return true;});}catch(err){toast('Dosya açılamadı: '+err.message);}e.target.value='';};
$('#help').onclick=()=>{modal('Dünyan senin elinde.','<p class="detail-copy full">Önce proje / şirketi, sonra şehri ve konumu seç. Üstteki Yönet menüsünden yeni proje veya şirket, konum ve hazır yerleşke oluştur. Proje / şirket adının altındaki toplamlar tüm konumları açar. Yapılar fiziksel binalardır; Bağımsız birimler bu binaların içindeki ofis, daire veya dükkânlardır. + Ekle tüm ekleme araçlarını açar. Yapı için arazide tıkla veya alan sürükle; sonra en, boy, kat ve tarih gir.<br><br>Çalışana tıklayarak adını ve yetkisini, araca tıklayarak plakayı ve sürücüyü gör. Formlarda ek atamalar Diğer bilgiler ve yerleşim bölümündedir.<br><br>Takvim ve hız planı ilerletir. İşletme sekmesinde Düzenle, İşlemler ve bağımsız Senaryo modlarını kullan. Depoyu seçerek içeri gir, raf ve palet ekle.<br><br>Kaydet yalnızca bu tarayıcıda veri tutar. Araçlar > JSON yedeği indir saha kayıtlarını korur. Kaynak kodları GitHub deposundadır. Canlı GPS ve Kapsio eşitlemesi henüz yoktur. Proje özeti üzerinden Kapsio dosya aktarımına ulaşabilirsin.</p>','',()=>true,'Anladım');};
document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.matches('input,textarea,select')){e.preventDefault();undo();}if(e.key.toLowerCase()==='r'&&!e.target.matches('input,textarea,select')&&!$('#dialog').open&&selected&&['buildings','containers','landscape'].includes(selected.col)){e.preventDefault();act('rotate');}if(e.key==='Escape'){cancelPlot();dismissBrowser();$('#scene-menu').open=false;$('#file-menu').open=false;}});
const compactLayout=matchMedia('(max-width: 820px)');
function setBrowser(open){
 $('#browser').classList.toggle('open',open);
 $('.workspace').classList.toggle('show-records',open);
 $('#mobile-browser').setAttribute('aria-expanded',String(open));
}
function dismissBrowser(){if(compactLayout.matches)setBrowser(false);}
compactLayout.addEventListener('change',()=>setBrowser(!compactLayout.matches));
setBrowser(!compactLayout.matches);
document.addEventListener('click',e=>{
 for(const id of ['#file-menu','#scene-menu']){
  const menu=$(id);if(!menu.contains(e.target)||e.target.closest('.popover button,.popover a'))menu.open=false;
 }
});
try{scene=new WorldScene($('#scene'),{select,plot:rect=>{const target=moving;cancelPlot();if(target){const r=project()[target.col].find(r=>r.id===target.id);mutate(p=>{if(target.col==='buildings'){for(const c of p.landscape.filter(o=>o.parentId===r.id)){c.x+=rect.x-r.x;c.z+=rect.z-r.z;}}D.put(p,target.col,{...r,x:rect.x,z:rect.z});});}else edit('buildings',null,rect);},status:toast});scene.onTick=tick;scene.overview();}catch(e){$('#render-error').hidden=false;console.error('WebGL başlatılamadı',e);let last=performance.now();const loop=now=>{tick(Math.min(.05,(now-last)/1000));last=now;requestAnimationFrame(loop);};requestAnimationFrame(loop);}
render();if(loadIssue)toast(loadIssue);
function changeOrganization(fn){const before=D.clone(root);try{if(mode==='scenario')throw Error('Proje / konum yönetimi için önce Düzenle moduna geç.');fn(root);root=D.validate(root);history.push(before);if(history.length>40)history.shift();selected=null;detailMode=null;interior=null;rate=0;kindFilter='';cityFilter='';view='buildings';group='area';persist();render();scene?.overview();return true;}catch(e){root=before;toast(e.message);if($('#form-error'))$('#form-error').textContent=e.message;return false;}}
function organizationMenu(){const d=$('#dialog');d.innerHTML='<div class="dialog-head"><span class="eyebrow">PROJE VE KONUMLAR</span><button id="organization-close" aria-label="Pencereyi kapat">×</button></div><h2>Nasıl devam edelim?</h2><p class="detail-copy">'+esc(root.portfolios.find(f=>f.id===project().portfolioId).name)+' içindesin. Konumlar aynı projenin farklı şehir veya adreslerdeki yerleşkeleridir.</p><div class="add-menu"><button data-org="portfolio"><span class="symbol">▦</span><span><strong>Yeni '+(domain()==='business'?'şirket':'proje')+'</strong><small>Ayrı kayıtlar ve birden fazla şehir</small></span></button><button data-org="rename"><span class="symbol">✎</span><span><strong>Proje / şirket adını düzenle</strong><small>Mevcut kayıtlarını koruyarak adını değiştir</small></span></button><button data-org="location"><span class="symbol">⌗</span><span><strong>Konum / yerleşke ekle</strong><small>Mevcut proje veya şirkete yeni adres</small></span></button><button data-org="edit"><span class="symbol">✎</span><span><strong>Konumu düzenle</strong><small>Ad, şehir, ilçe, adres ve yerleşke türü</small></span></button><button data-org="overview"><span class="symbol">▤</span><span><strong>Tüm konumları gör</strong><small>Şehirler, binalar ve birimler</small></span></button></div>';$('#organization-close').onclick=()=>d.close();d.querySelectorAll('[data-org]').forEach(b=>b.onclick=()=>{d.close();if(b.dataset.org==='rename'){const f=root.portfolios.find(f=>f.id===project().portfolioId);modal('Proje / şirket adı',inp('name','Ad',f.name),'',input=>changeOrganization(root=>{root.portfolios.find(x=>x.id===f.id).name=input.name;}));}else if(b.dataset.org==='overview')portfolioOverview();else if(b.dataset.org==='edit')locationForm(true);else if(b.dataset.org==='portfolio')newPortfolio();else locationForm(false);});d.showModal();}
function layoutSelect(value='empty'){return sel('layoutType','Yerleşke / başlangıç şablonu',Object.entries(LAYOUTS),value)+'<p class="detail-copy full" id="layout-description">'+esc(LAYOUT_HELP[value])+'</p>'+sel('preview','Başlangıç görünümü',[['start','Plan başlangıcı'],['progress','Yapım devam ediyor'],['finished','Tamamlanmış görünüm']],domain()==='business'?'finished':'progress');}
function wireLayout(){const el=$('#form [name=layoutType]');if(el)el.onchange=e=>$('#layout-description').textContent=LAYOUT_HELP[e.target.value];}
function newPortfolio(){modal(domain()==='business'?'Şirket ve şehirlerini oluştur':'Yeni inşaat projesi oluştur',inp('name',domain()==='business'?'Şirket adı':'Proje adı','')+inp('cities','Şehirler (virgülle ayır)','Ankara')+layoutSelect('empty'),'',input=>changeOrganization(root=>{const cities=[...new Set(input.cities.split(',').map(s=>s.trim()).filter(Boolean))];if(!cities.length||cities.length>20)throw Error('1–20 şehir gir.');if(root.projects.length+cities.length>100)throw Error('Toplam konum sınırı 100.');const f={id:D.id(),name:input.name.trim(),domain:domain()};if(!f.name)throw Error('Ad gerekli.');root.portfolios.push(f);for(const city of cities)D.createLocation(root,{portfolioId:f.id,name:city+' · '+(domain()==='business'?'Şube':'Yerleşke'),city,layoutType:input.layoutType,preview:input.preview});root.active=root.projects.find(p=>p.portfolioId===f.id).id;}),'Oluştur');wireLayout();}
function locationForm(editing=false){const p=project(),f=root.portfolios.find(f=>f.id===p.portfolioId);const basic=inp('name','Konum / yerleşke adı',editing?p.name:'Yeni konum')+inp('city','Şehir',editing?p.city:'Ankara')+optional('district','İlçe (isteğe bağlı)',editing?p.district:'')+(editing?sel('layoutType','Yerleşke türü (etiket)',Object.entries(LAYOUTS),p.layoutType):layoutSelect('empty'));const advanced=optional('address','Adres / saha açıklaması (isteğe bağlı)',editing?p.address:'')+sel('portfolioId',domain()==='business'?'Şirket':'Proje',root.portfolios.filter(f=>f.domain===p.domain).map(f=>[f.id,f.name]),f.id);modal(editing?'Konum bilgileri':'Konum / yerleşke ekle',basic,advanced,input=>changeOrganization(root=>{if(editing){const current=root.projects.find(q=>q.id===p.id);Object.assign(current,{name:input.name,city:input.city,district:input.district,address:input.address,portfolioId:input.portfolioId,layoutType:input.layoutType});}else D.createLocation(root,input);}),editing?'Kaydet':'Konum oluştur');if(!editing)wireLayout();}
function portfolioOverview(){const p=project(),f=root.portfolios.find(f=>f.id===p.portfolioId),stats=D.portfolioStats(root,f.id),sites=root.projects.filter(s=>s.portfolioId===f.id);const d=$('#dialog');d.innerHTML='<div class="dialog-head"><span class="eyebrow">'+(p.domain==='business'?'ŞİRKET':'PROJE')+' GENEL BAKIŞ</span><button id="organization-close" aria-label="Pencereyi kapat">×</button></div><h2>'+esc(f.name)+'</h2><div class="portfolio-totals">'+[['Şehir',stats.cities],['Konum',stats.locations],['Tam bina',stats.wholeBuildings],['Birim',stats.units]].map(([n,k])=>'<span>'+n+'<strong>'+k+'</strong></span>').join('')+'</div><label>Şehirde ara<input id="location-search" placeholder="Şehir, adres veya konum adı…"></label><div id="location-cards"></div><button class="gold wide" id="location-add">＋ Konum ekle</button><p class="note">Tam bina sayısı bütün olarak kullanılan yapıları kapsar. Paylaşılan binadaki ofisler bağımsız birim sayılır; aynı bina yeniden sayılmaz. Her konum ayrı 60 × 60 m sahnede yönetilir. Şehir adları kayıt sınıflandırmasıdır; canlı harita / GPS değildir.</p>';const draw=()=>{const query=($('#location-search').value||'').toLocaleLowerCase('tr-TR');$('#location-cards').innerHTML=sites.filter(s=>(s.city+' '+s.district+' '+s.name+' '+s.address).toLocaleLowerCase('tr-TR').includes(query)).map(s=>'<button class="location-card" data-location="'+esc(s.id)+'"><span class="tag">'+esc(s.city)+'</span><strong>'+esc(s.name)+'</strong><small>'+esc(LAYOUTS[s.layoutType])+' · '+s.buildings.length+' yapı · '+s.spaces.length+' birim</small><small>'+esc(s.district||'İlçe belirtilmedi')+'</small></button>').join('')||'<p class="detail-copy">Bu aramada konum bulunamadı.</p>';d.querySelectorAll('[data-location]').forEach(b=>b.onclick=()=>{d.close();cityFilter='';chooseProject(b.dataset.location);});};$('#location-search').oninput=draw;$('#organization-close').onclick=()=>d.close();$('#location-add').onclick=()=>{d.close();locationForm(false);};draw();d.showModal();}

function operationStatus(r){
 return r.type==='delivery'?{todo:'Bekleniyor',doing:'Yolda',done:'Teslim alındı'}[r.status]:O.STATES[r.status];
}
function dailyPanel(){
 const p=project(),day=O.today(),sites=dailyScope==='site'?[p]:world().projects.filter(q=>q.portfolioId===p.portfolioId);
 const all=O.daily(sites,day);
 const labels={late:'Geciken',today:'Bugün',upcoming:'Yaklaşan',open:'Tarihsiz'};
 const visible=all.filter(o=>dailyFilter==='all'||dailyFilter===o.state||
  (dailyFilter==='delivery'&&(o.r.type==='delivery'||o.r.type==='shipment'))||dailyFilter===o.r.type);
 return '<h2>Bugün ne oluyor?</h2><p class="detail-copy">'+esc(new Intl.DateTimeFormat('tr-TR',{dateStyle:'long',timeZone:'Europe/Istanbul'}).format(new Date()))+
  ' · '+all.filter(o=>o.state==='late').length+' geciken · '+all.filter(o=>o.state==='today').length+' bugün · '+all.length+' açık</p>'+
  sel('daily-scope','Kapsam',[['portfolio','Tüm proje / şirket konumları'],['site','Yalnızca bu konum']],dailyScope).replace('<select','<select id="daily-scope"')+
  sel('daily-filter','Göster',[['all','Tüm açık kayıtlar'],...Object.entries(labels),...Object.entries(O.TYPES)],dailyFilter).replace('<select','<select id="daily-filter"')+
  button('Bu konuma saha kaydı ekle','op-add','gold')+
  '<div class="daily-list">'+(visible.map(({p,r,col,state})=>{
   const b=p.buildings.find(b=>b.id===(r.targetId||r.buildingId)),unit=p.spaces.find(u=>u.id===r.spaceId);
   return '<button class="daily-row" data-daily="'+esc(r.id)+'" data-site="'+esc(p.id)+'" data-col="'+col+'"><span class="daily-state '+state+'">'+labels[state]+(r.priority==='urgent'?' · Öncelikli':'')+'</span><strong>'+esc(r.name)+'</strong><small>'+esc([p.city,p.name,b?.name,unit?.name,r.due].filter(Boolean).join(' · '))+'</small></button>';
  }).join('')||'<p class="detail-copy">Bu filtrede açık kayıt yok.</p>')+'</div>';
}
function openDailyRecord(site,col,id){
 if(site!==project().id){
  if(mode==='scenario'){draft.active=site;cityFilter='';}
  else chooseProject(site);
 }
 interior=null;route=false;rate=0;select({col,id});
}
function operationDetail(p,r){
 const b=p.buildings.find(b=>b.id===r.buildingId),u=p.spaces.find(u=>u.id===r.spaceId),w=p.workers.find(w=>w.id===r.workerId);
 const state=O.dueState(r,O.today());
 let html=kv([['Durum',operationStatus(r)],['Öncelik',O.PRIORITIES[r.priority]],['Hedef tarih',r.due+(state==='late'?' · Gecikti':'')],['Tamamlanma',r.completed||'—'],['Sorumlu',w?.name],['Yapı',b?.name],['Bağımsız bölüm',u?.name]])+linkRecord('buildings',b)+linkRecord('spaces',u);
 if(r.type==='stage'){
  const planned=O.plannedStage(r,O.today()),delta=r.actual-planned;
  html+='<h3>'+esc(O.STAGES[r.stage])+'</h3>'+kv([['Plan başlangıcı',r.start],['Bugünkü plan','%'+planned],['Gerçekleşen','%'+r.actual],['Plan farkı',(delta>0?'+':'')+delta+' puan']])+
   '<progress class="operation-progress" aria-label="Gerçekleşen ilerleme" max="100" value="'+r.actual+'"></progress>'+
   '<p class="detail-copy">3D takvim planı canlandırır. Gerçekleşen oran sahadan girilir.</p>'+
   (r.photos.length?'<div class="operation-photos">'+r.photos.map((url,i)=>'<img src="'+esc(url)+'" alt="İlerleme fotoğrafı '+(i+1)+'">').join('')+'</div>':'');
 }
 if(r.type==='maintenance')html+=kv([['Ekipman / bölüm',r.asset||'Genel alan']]);
 if(r.type==='delivery'){
  const m=p.materials.find(m=>m.id===r.materialId),v=p.vehicles.find(v=>v.id===r.vehicleId),driver=p.workers.find(w=>w.id===v?.driverId);
  html+=kv([['Malzeme',m?.name],['Miktar',fmt(r.quantity)+' '+m?.unit],['Çıkış yeri',r.origin||'—'],['Son bildirilen yol',r.road||'—'],['Plaka',v?.plate],['Sürücü',driver?.name]])+
   linkRecord('vehicles',v)+linkRecord('materials',m,'Stok kartını aç')+
   (!r.received?button('Teslim al ve stoğa ekle','accept-delivery','gold'):'')+'<p class="detail-copy">Yol bilgisi elle güncellenir. Canlı GPS bağlı değil.</p>';
 }
 return html+(r.notes?'<p class="operation-notes">'+esc(r.notes)+'</p>':'');
}
function operationForm(record,pref={}){
 const p=project();if(!p.buildings.length)return toast('Saha kaydı için önce bir yapı ekle.');
 const r={name:'',type:p.domain==='business'?'maintenance':'stage',due:O.today(),start:O.today(),status:'todo',priority:'normal',photos:[],...pref,...record};
 const basic=inp('name','Kayıt adı',r.name,'text','maxlength="100"')+
  sel('type','Kayıt türü',Object.entries(O.TYPES),r.type)+sel('buildingId','Yapı / konum',options('buildings','Yapı seç'),r.buildingId||'')+
  inp('due','Hedef / beklenen tarih',r.due,'date')+sel('workerId','Sorumlu',options('workers'),r.workerId||'')+
  sel('priority','Öncelik',Object.entries(O.PRIORITIES),r.priority)+
  '<fieldset class="operation-fields" data-type="stage">'+sel('stage','Yapım aşaması',Object.entries(O.STAGES),r.stage||'foundation')+
  inp('start','Plan başlangıcı',r.start||O.today(),'date')+inp('actual','Gerçekleşen (%)',r.actual??0,'number','min="0" max="100" step="1"')+
  '<label>İlerleme fotoğrafı (en çok 3)<input name="photos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label>'+
  (r.photos.length?'<div class="photo-remove">'+r.photos.map((url,i)=>'<label><img src="'+esc(url)+'" alt="Mevcut fotoğraf '+(i+1)+'"><span><input type="checkbox" name="remove-'+i+'"> Kaldır</span></label>').join('')+'</div>':'')+
  '</fieldset><fieldset class="operation-fields" data-type="maintenance">'+sel('spaceId','Bağımsız bölüm',options('spaces'),r.spaceId||'')+
  optional('asset','Ekipman / arıza noktası',r.asset||'')+sel('status','Bakım durumu',Object.entries(O.STATES),r.status)+'</fieldset>'+
  '<fieldset class="operation-fields" data-type="delivery">'+sel('materialId','Malzeme',p.materials.map(m=>[m.id,m.name+' · '+m.unit]),r.materialId||'')+
  inp('quantity','Miktar (malzeme biriminde)',r.quantity??1,'number','min="0.01" max="100000000" step="any"')+
  sel('vehicleId','Araç / plaka',options('vehicles'),r.vehicleId||'')+optional('origin','Çıkış / tedarikçi',r.origin||'')+
  optional('road','Son bildirilen yol veya konum',r.road||'')+sel('status','Teslimat durumu',r.received?[['done','Teslim alındı']]:[['todo','Bekleniyor'],['doing','Yolda']],r.status)+'</fieldset>'+
  '<label class="full">Saha notu<textarea name="notes" rows="3" maxlength="1000">'+esc(r.notes)+'</textarea></label>';
 modal(record?'Saha kaydını düzenle':'Yeni saha kaydı',basic,'',async input=>{
  const form=$('#form');
  const photos=r.photos.filter((_,i)=>!input['remove-'+i]);
  if(input.type==='stage'){
   const files=[...form.elements.photos.files];if(photos.length+files.length>3)throw Error('Toplamda en fazla üç fotoğraf eklenebilir.');
   for(const file of files)photos.push(await smallPhoto(file));
  }
  if(!form.isConnected||!$('#dialog').open)return false;
  const ok=mutate(p=>{
   const saved=D.put(p,'operations',{...r,...input,photos,status:input.status||'todo'});
   const size=world().projects.reduce((n,q)=>n+q.operations.reduce((m,o)=>m+o.photos.reduce((a,url)=>a+url.length,0),0),0);
   if(size>1_500_000)throw Error('Bu dünyanın fotoğraf alanı doldu. Önce kullanılmayan fotoğrafları kaldır.');
   selected={col:'operations',id:saved.id};group='work';view='operations';detailMode=null;
  });
  if(ok){interior=null;route=false;select(selected);}return ok;
 });
 const form=$('#form'),type=form.elements.type,host=form.elements.buildingId,unit=form.elements.spaceId;
 const sync=()=>form.querySelectorAll('fieldset[data-type]').forEach(f=>{f.hidden=f.dataset.type!==type.value;f.disabled=f.hidden;});
 if(record){type.disabled=true;const hidden=document.createElement('input');hidden.type='hidden';hidden.name='type';hidden.value=r.type;form.append(hidden);}
 type.onchange=sync;sync();
 unit.onchange=()=>{const u=p.spaces.find(u=>u.id===unit.value);if(u)host.value=u.buildingId;};
 host.onchange=()=>{const u=p.spaces.find(u=>u.id===unit.value);if(u&&u.buildingId!==host.value)unit.value='';};
}
async function smallPhoto(file){
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12e6)throw Error('JPEG, PNG veya WebP seç; dosya en fazla 12 MB olabilir.');
 const bitmap=await createImageBitmap(file);
 try{
  const canvas=document.createElement('canvas'),ratio=Math.min(1,960/Math.max(bitmap.width,bitmap.height));
  canvas.width=Math.max(1,Math.round(bitmap.width*ratio));canvas.height=Math.max(1,Math.round(bitmap.height*ratio));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);
  for(const quality of [.8,.64,.48,.32,.2]){const data=canvas.toDataURL('image/jpeg',quality);if(data.length<=115000)return data;}
  throw Error('Fotoğraf çok ayrıntılı. Daha küçük bir görsel seç.');
 }finally{bitmap.close();}
}

function downloadJSON(name,data){
 const url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function kapsioPanel(){
 const p=project();
 modal('Kapsio veri aktarımı','<p class="detail-copy full">Bu işlem yalnızca '+esc(p.name)+' konumuna uygulanır. Personel, araç ve malzeme kayıtlarını belirtilen JSON biçiminde alabilirsin. Mevcut stok, tekrar içe aktarmada korunur. Canlı bağlantı yoktur.</p>'+
 '<button type="button" id="kapsio-template">Aktarım şablonunu indir</button><button type="button" id="kapsio-export">Saha kayıtlarını indir</button>'+
 '<label class="full">Kapsio verisinden hazırlanmış JSON dosyası<input name="kapsioFile" type="file" accept=".json,application/json"></label>',
 '',async ({kapsioFile:file})=>{
  if(!file?.size||file.size>1e6)throw Error('1 MB sınırı içinde bir JSON dosyası seç.');
  const form=$('#form'),payload=JSON.parse(await file.text());
  if(!form.isConnected||!$('#dialog').open)return false;
  const {counts}=K.importMaster(project(),payload);
  if(!Object.values(counts).some(Boolean))throw Error('Dosyada aktarılacak kayıt yok.');
  $('#dialog').close();
  confirmDialog('Kapsio kayıtlarını uygula?',counts.workers+' çalışan, '+counts.vehicles+' araç, '+counts.materials+' malzeme işlenecek.',()=>mutate(p=>Object.assign(p,K.importMaster(p,payload).target)));
  return false;
 },'Aktarımı incele');
 $('#kapsio-template').onclick=()=>downloadJSON('Kapsio-Aktarim-Sablonu.json',{format:K.FORMAT,locationId:p.id,workers:[],vehicles:[],materials:[],
  examples:{workers:[{externalId:'EMP-001',firstName:'Örnek',lastName:'Çalışan',role:'Sürücü'}],vehicles:[{externalId:'VH-001',plate:'06 PW 001',type:'truck',capacity:24,status:'active',driverExternalId:'EMP-001'}],materials:[{externalId:'MAT-001',name:'Örnek malzeme',unit:'adet',stock:20,minimum:5}]}});
 $('#kapsio-export').onclick=()=>downloadJSON('Project-World-Kapsio-Saha.json',K.exportOperations(p));
}

function tripEntries(){
 const p=project();
 return world().projects.filter(q=>q.portfolioId===p.portfolioId).flatMap(q=>['jobs','operations'].flatMap(col=>q[col].filter(r=>r.trip&&(col==='jobs'?r.type!=='production':r.type==='delivery')).map(r=>({project:q,record:r,col}))));
}
function showMap(){
 rate=0;dismissBrowser();openTurkeyMap(tripEntries(),selected?.id,entry=>{
  if(entry.project.id!==project().id){if(mode==='scenario')draft.active=entry.project.id;else chooseProject(entry.project.id);}
  select({col:entry.col,id:entry.record.id});tripForm();
 },mapShipmentForm,apiConnectionForm,syncMapShipment);
}
function tripForm(){
 const record=selectedRecord(),col=selected?.col;if(!record)return toast('Önce bir sevkiyat veya malzeme teslimatı seç.');
 if(!record.vehicleId)return toast('Rota takibi için önce kayda bir araç ata.');
 const originalProject=project().id;
 const cities=Object.keys(TR.CITIES).sort((a,b)=>a.localeCompare(b,'tr')).map(n=>[n,n]);
 const defaults=record.trip||{from:TR.CITIES[project().city]?project().city:'Ankara',to:'İstanbul',departure:TR.localNow(),arrival:TR.localNow(Date.now()+6*3600000)};
 modal('Sevkiyat rotası ve saatleri',sel('from','Kalkış şehri',cities,defaults.from)+sel('to','Varış şehri',cities,defaults.to)+inp('departure','Kalkış · Türkiye saati',defaults.departure,'datetime-local')+inp('arrival','Tahmini varış · Türkiye saati',defaults.arrival,'datetime-local')+'<p class="detail-copy full">Araç, kalkış ve varış arasında yol çizgisinde zamana göre ilerler. Şehir merkezleri kullanılır. Canlı GPS, trafik ve tır kısıtları hesaplanmaz. Rota isteğinde yalnızca iki şehir koordinatı OSRM servisine gönderilir.</p>','',async input=>{
  TR.instant(input.departure);TR.instant(input.arrival);if(TR.instant(input.arrival)<=TR.instant(input.departure))throw Error('Varış kalkıştan sonra olmalı.');
  const form=$('#form');let geometry=record.trip&&input.from===record.trip.from&&input.to===record.trip.to?record.trip:await TR.roadRoute(input.from,input.to);
  if(!form.isConnected||!$('#dialog').open||project().id!==originalProject)return false;
  const ok=mutate(p=>D.put(p,col,{...record,trip:TR.normalizeTrip({...input,...geometry,departure:input.departure,arrival:input.arrival})}));
  if(ok){$('#dialog').close();showMap();}return false;
 },'Rotayı kaydet');
}

function apiConnectionForm(){
 modal('Kapsio API bağlantısı',
 '<p class="detail-copy full">Bağlantı henüz doğrulanmadı. Bu ekran, Project World sevkiyat sözleşmesini kabul eden bir Kapsio uç noktası içindir. Anahtar yalnız bu açık sekmenin belleğinde tutulur; yedeğe yazılmaz. Tarayıcıdan erişim için Kapsio CORS izni gerekir.</p>'+
 inp('endpoint','Kapsio sevkiyat oluşturma URL','', 'url')+inp('token','Oturumluk erişim anahtarı','','password','autocomplete="off"')+
 '<button type="button" id="api-disconnect">Bu oturumdaki bağlantıyı kaldır</button>',
 '',input=>{API.configureApi(input.endpoint,input.token);toast('Otomatik gönderim bu sekmede etkin. Bekleyen yeni sevkiyatlar gönderiliyor.');queueMicrotask(sendPendingShipments);return true;},'Bağlantıyı hazırla');
 $('#api-disconnect').onclick=()=>{API.clearApi();$('#dialog').close();toast('API bağlantısı kaldırıldı.');};
}
async function syncMapShipment(entry){
 if(mode==='scenario')return toast('Senaryo kayıtları Kapsio’ya gönderilemez.');
 if(!API.apiReady())return apiConnectionForm();
 if(entry.col!=='jobs')return toast('API gönderimi yalnız sevkiyat kayıtları için hazır.');
 const p=root.projects.find(p=>p.id===entry.project.id),r=p?.jobs.find(r=>r.id===entry.record.id);
 if(!r)return toast('Sevkiyat bulunamadı.');
 if(r.kapsio?.id)return toast('Kapsio kaydı daha önce onaylandı: '+r.kapsio.id);
 confirmDialog('Sevkiyatı Kapsio’ya gönder',r.name+' kaydının plaka, sürücü, yük ve zaman bilgileri yapılandırdığın Kapsio API adresine gönderilecek.',async()=>{
  const receipt=await API.sendShipment(p,r);
  const current=root.projects.find(q=>q.id===p.id)?.jobs.find(j=>j.id===r.id);
  if(!current)throw Error('Yerel kayıt bulunamadı; API kaydını kontrol et.');
  current.kapsio=receipt;D.log(p,'Kapsio sevkiyat kaydı onaylandı: '+receipt.id);persist();render();
  toast('Kapsio kayıt kimliği alındı: '+receipt.id);return true;
 },'Gönder');
}
function mapShipmentForm(provinceName=''){
 const p=project();if(!p.vehicles.length)return toast('Sevkiyat oluşturmak için Ekip → Araçlar bölümünden önce bir araç ekle.');
 if(!p.buildings.length)return toast('Önce sevkiyatın bağlı olduğu bir yapı / tesis ekle.');
 const cities=Object.keys(TR.CITIES).sort((a,b)=>a.localeCompare(b,'tr')).map(n=>[n,n]);
 const from=Object.keys(TR.CITIES).find(n=>n.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()===provinceName.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase())||(TR.CITIES[p.city]?p.city:'Ankara');
 const originalProject=p.id;
 modal('Haritadan yeni sevkiyat',
 inp('name','Sevkiyat adı','')+sel('buildingId','Bağlı tesis / yapı',p.buildings.map(b=>[b.id,b.name]),p.buildings[0].id)+
 sel('vehicleId','Araç / plaka',p.vehicles.filter(v=>v.status==='active').map(v=>[v.id,v.plate]),'')+
 inp('cargo','Yük açıklaması','')+inp('quantity','Miktar (araç kapasite biriminde)',1,'number','min="1" max="500" step="1"')+
 inp('cargoUnit','Yük birimi','adet')+sel('from','Kalkış şehri',cities,from)+sel('to','Varış şehri',cities,from==='İstanbul'?'Ankara':'İstanbul')+
 inp('departure','Kalkış · Türkiye saati',TR.localNow(),'datetime-local')+inp('arrival','Tahmini varış · Türkiye saati',TR.localNow(Date.now()+6*3600000),'datetime-local')+
 '<p class="note full">Sevkiyat planlandı olarak kaydedilir; yükleme ve teslim durumu ayrıca yönetilir. Araç konumu, girilen saatlere göre planlanan ilerlemeyi gösterir. Kapsio bağlantısı açıksa yeni sevkiyat otomatik gönderilir; kapalıysa gönderim bekler.</p>',
 '',async input=>{
  TR.instant(input.departure);if(TR.instant(input.arrival)<=TR.instant(input.departure))throw Error('Varış kalkıştan sonra olmalı.');
  if(!input.vehicleId)throw Error('Aktif araç seç.');
  const form=$('#form'),road=await TR.roadRoute(input.from,input.to);
  if(!form.isConnected||!$('#dialog').open||project().id!==originalProject)return false;
  const trip=TR.normalizeTrip({...input,...road});
  const ok=mutate(p=>{
   const r=D.put(p,'jobs',{name:input.name,type:'shipment',buildingId:input.buildingId,vehicleId:input.vehicleId,quantity:Number(input.quantity),apiPending:true,cargo:input.cargo.slice(0,180),cargoUnit:input.cargoUnit.slice(0,20),loaded:0,status:'planned',route:'istanbul',progress:0,due:input.arrival.slice(0,10),trip});
   selected={col:'jobs',id:r.id};
  });
  if(ok){$('#dialog').close();showMap();void sendPendingShipments();}return false;
 },'Sevkiyatı oluştur');
}

let autoSending=false;
async function sendPendingShipments(){
 if(autoSending||!API.apiReady()||mode==='scenario')return;
 autoSending=true;
 try{
  const pending=root.projects.flatMap(p=>p.jobs.filter(r=>r.apiPending&&!r.kapsio?.id).map(r=>({p,r})));
  for(const {p,r} of pending){
   if(!API.apiReady()||mode==='scenario')break;
   try{
    const receipt=await API.sendShipment(p,r);
    const live=root.projects.find(q=>q.id===p.id)?.jobs.find(j=>j.id===r.id);
    if(live){live.kapsio=receipt;live.apiPending=false;delete live.apiError;persist();}
   }catch(e){
    const live=root.projects.find(q=>q.id===p.id)?.jobs.find(j=>j.id===r.id);
    if(live){live.apiError='Gönderim tamamlanmadı; bağlantıyı ve Kapsio kaydını kontrol et.';persist();}
    toast('Kapsio otomatik gönderimi tamamlanmadı. Sevkiyat yerelde korundu.');break;
   }
  }
 }finally{autoSending=false;render();}
}
