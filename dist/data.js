export const VERSION=2, DAY=86400000;
export const LABELS={buildings:'Yapılar',landscape:'Peyzaj',containers:'Konteynerler',workers:'Çalışanlar',vehicles:'Araçlar',tasks:'Görevler',materials:'Malzeme',jobs:'İşlemler'};
export const KINDS={building:'Çok katlı yapı',villa:'Villa',house:'Tek katlı ev',warehouse:'Depo',factory:'Fabrika',office:'Ofis'};
export const LAND={pool:'Havuz',lawn:'Çim alan',path:'Yürüyüş yolu',terrace:'Teras',tree:'Ağaç',hedge:'Bitki çiti',fence:'Bahçe çiti',pergola:'Pergola',light:'Aydınlatma',road:'Araç yolu',rack:'Depo rafı',pallet:'Palet'};
export const AUTH={worker:'Çalışan',leader:'Ekip lideri',chief:'Yetkili / şef'};
export const VEHICLES={mixer:'Beton mikseri',excavator:'Ekskavatör',truck:'Malzeme kamyonu',semi:'Tır'};
export const JOBS={shipment:'Sevkiyat',production:'Üretim',procurement:'Tedarik',transfer:'Depo transferi'};
export const STATUS={planned:'Planlandı',loading:'Yükleniyor',ready:'Hazır',transit:'Yolda',delivered:'Teslim edildi',todo:'Yapılacak',doing:'Devam ediyor',done:'Tamamlandı',active:'Aktif',maintenance:'Bakımda',off:'İzinli'};
export const ROLES=['Şantiye şefi','Kalıp ustası','Demir ustası','Beton ustası','Cephe ustası','Elektrikçi','Operatör / sürücü','İş güvenliği'];
export const id=()=>globalThis.crypto?.randomUUID?.()||Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
export const clone=x=>structuredClone(x);
export function date(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s))throw Error('Geçerli bir tarih gir.');const t=Date.parse(s+'T00:00:00Z');if(!Number.isFinite(t)||iso(t)!==s)throw Error('Geçersiz takvim tarihi.');return t;}
export const iso=t=>new Date(t).toISOString().slice(0,10);
const txt=(v,max=100)=>String(v??'').trim().slice(0,max);
const num=(v,min,max,label)=>{const n=Number(v);if(!Number.isFinite(n)||n<min||n>max)throw Error(label+' '+min+'–'+max+' aralığında olmalı.');return n;};
const one=(v,list,label)=>{if(!Object.hasOwn(list,v))throw Error(label+' geçersiz.');return v;};
const named=r=>{r.id=txt(r.id||id());r.name=txt(r.name);if(!r.name)throw Error('Ad alanı gerekli.');return r;};
export function phase(b,t){const start=date(b.start),end=date(b.end),f=Math.max(0,Math.min(1,(t-start)/(end-start)));return {f,percent:Math.round(f*100),floors:Math.min(b.floors,Math.floor(Math.max(0,(f-.12)/.76)*b.floors)),stage:f>=1?'Tamamlandı':f>.88?'Çatı ve çevre':f>.7?'Cephe ve tesisat':f>.12?'Kaba yapı':'Temel'};}
export function range(p){const a=p.buildings;return a.length?{start:Math.min(...a.map(b=>date(b.start))),end:Math.max(...a.map(b=>date(b.end)))}:{start:date('2026-01-01'),end:date('2030-12-31')};}
export function collision(a,b,gap=.2){return Math.abs(a.x-b.x)<(a.w+b.w)/2+gap&&Math.abs(a.z-b.z)<(a.d+b.d)/2+gap;}
export function validFootprint(p,r,exclude=null){
 if(Math.abs(r.x)+r.w/2>30||Math.abs(r.z)+r.d/2>30)throw Error('Nesne 60 × 60 m arazi sınırları içinde olmalı.');
 const flat=['lawn','path','terrace','road'];if(flat.includes(r.type))return true;
 for(const o of [...p.buildings,...p.containers,...p.landscape].filter(o=>o.id!==exclude&&!flat.includes(o.type)&&!o.parentId&&!r.parentId))if(collision(o,r))throw Error('Yerleşim başka bir nesneyle çakışıyor.');
 return true;
}
export function findSpot(p,w,d){for(let z=-26;z<=26;z+=2)for(let x=-26;x<=26;x+=2){try{validFootprint(p,{x,z,w,d});return {x,z};}catch{}}throw Error('Bu ölçüde boş yer bulunamadı; daha küçük ölçü seç.');}
const exists=(p,collection,key)=>!key||p[collection].some(r=>r.id===key);
function ref(p,col,key,label){if(!exists(p,col,key))throw Error(label+' kaydı bulunamadı.');return key||null;}
export function normalize(p,col,input,previous=null){
 let r={...input};r.id=previous?.id||r.id||id();
 if(col==='buildings'){
  named(r);r.kind=one(r.kind,KINDS,'Yapı türü');r.w=num(r.w,5,60,'En');r.d=num(r.d,5,60,'Boy');r.x=num(r.x,-30,30,'Konum X');r.z=num(r.z,-30,30,'Konum Z');r.floors=num(r.floors,1,r.kind==='house'?1:r.kind==='villa'?4:40,'Kat sayısı');if(!Number.isInteger(r.floors))throw Error('Kat sayısı tam sayı olmalı.');r.budget=num(r.budget||0,0,1e12,'Bütçe');r.color=/^#[a-f\d]{6}$/i.test(r.color)?r.color:'#cfbfa4';r.roof=one(r.roof||'flat',{flat:1,pitched:1},'Çatı');date(r.start);date(r.end);if(date(r.end)<=date(r.start))throw Error('Bitiş tarihi başlangıçtan sonra olmalı.');validFootprint(p,r,r.id);
 } else if(col==='workers'){
  r.firstName=txt(r.firstName,50);r.lastName=txt(r.lastName,50);if(!r.firstName||!r.lastName)throw Error('Ad ve soyadı gerekli.');r.name=r.firstName+' '+r.lastName;r.role=txt(r.role)||ROLES[0];r.authority=one(r.authority||'worker',AUTH,'Yetki');r.status=one(r.status||'active',{active:1,off:1},'Durum');r.shift=txt(r.shift)||'08:00–17:00';r.buildingId=ref(p,'buildings',r.buildingId,'Yapı');r.containerId=ref(p,'containers',r.containerId,'Konteyner');if(r.containerId){const c=p.containers.find(c=>c.id===r.containerId),n=p.workers.filter(w=>w.id!==r.id&&w.containerId===c.id).length;if(n>=c.capacity)throw Error('Konteyner kapasitesi dolu.');}
 } else if(col==='vehicles'){
  r.plate=txt(r.plate,20).toLocaleUpperCase('tr-TR');if(!r.plate)throw Error('Plaka gerekli.');if(p.vehicles.some(v=>v.id!==r.id&&v.plate===r.plate))throw Error('Bu plaka zaten kayıtlı.');r.name=r.plate;r.type=one(r.type,VEHICLES,'Araç türü');r.driverId=ref(p,'workers',r.driverId,'Sürücü');if(r.driverId&&p.vehicles.some(v=>v.id!==r.id&&v.driverId===r.driverId))throw Error('Bu sürücü başka bir araca atanmış.');r.buildingId=ref(p,'buildings',r.buildingId,'Yapı');r.capacity=num(r.capacity,1,1000,'Kapasite');r.status=one(r.status||'active',{active:1,maintenance:1},'Durum');const assigned=p.jobs.filter(j=>j.vehicleId===r.id&&j.status!=='delivered');if(assigned.some(j=>j.quantity>r.capacity))throw Error('Atanmış yük araç kapasitesini aşıyor.');
 } else if(col==='containers'){
  named(r);r.w=num(r.w||6,3,15,'En');r.d=num(r.d||3,2,8,'Boy');r.x=num(r.x,-30,30,'Konum X');r.z=num(r.z,-30,30,'Konum Z');r.capacity=num(r.capacity,1,100,'Kapasite');if(!Number.isInteger(r.capacity))throw Error('Kapasite tam sayı olmalı.');if(p.workers.filter(w=>w.containerId===r.id).length>r.capacity)throw Error('Atanmış kişi sayısı kapasiteyi aşıyor.');validFootprint(p,r,r.id);
 } else if(col==='landscape'){
  named(r);r.type=one(r.type,LAND,'Nesne türü');r.w=num(r.w,r.type==='pool'?3:.2,60,'En');r.d=num(r.d,r.type==='pool'?2:.2,60,'Boy');r.h=num(r.h,r.type==='pool'?.5:.05,r.type==='pool'?3:10,'Yükseklik');r.x=num(r.x,-30,30,'Konum X');r.z=num(r.z,-30,30,'Konum Z');r.buildingId=ref(p,'buildings',r.buildingId,'Yapı');r.parentId=ref(p,'buildings',r.parentId,'Depo');if(r.parentId){const b=p.buildings.find(b=>b.id===r.parentId);if(b.kind!=='warehouse'||!['rack','pallet'].includes(r.type))throw Error('Depo içine raf ve palet eklenebilir.');if(Math.abs(r.x-b.x)+r.w/2>b.w/2-.5||Math.abs(r.z-b.z)+r.d/2>b.d/2-.5)throw Error('Nesne depo duvarları içinde kalmalı.');}else validFootprint(p,r,r.id);
 } else if(col==='tasks'){
  named(r);r.buildingId=ref(p,'buildings',r.buildingId,'Yapı');r.workerId=ref(p,'workers',r.workerId,'Sorumlu');date(r.due);r.status=one(r.status||'todo',{todo:1,doing:1,done:1},'Durum');
 } else if(col==='materials'){
  named(r);r.unit=txt(r.unit,20)||'adet';r.stock=num(r.stock,0,1e9,'Stok');r.minimum=num(r.minimum,0,1e9,'Minimum stok');
 } else if(col==='jobs'){
  named(r);r.type=one(r.type,JOBS,'İşlem türü');r.buildingId=ref(p,'buildings',r.buildingId,'Tesis');if(!r.buildingId)throw Error('Kaynak tesis seç.');r.targetId=ref(p,'buildings',r.targetId,'Hedef');if(r.type==='transfer'&&(!r.targetId||r.targetId===r.buildingId))throw Error('Transfer için farklı bir hedef seç.');r.vehicleId=ref(p,'vehicles',r.vehicleId,'Araç');r.quantity=num(r.quantity,1,500,'Miktar');if(!Number.isInteger(r.quantity))throw Error('Miktar tam sayı olmalı.');r.loaded=num(r.loaded||0,0,r.quantity,'Yüklenen / işlenen miktar');r.route=one(r.route||'istanbul',{istanbul:1,eskisehir:1,konya:1},'Rota');r.progress=num(r.progress||0,0,1,'Rota ilerlemesi');r.status=one(r.status||'planned',{planned:1,loading:1,ready:1,transit:1,delivered:1},'İşlem durumu');
  if(r.vehicleId){const v=p.vehicles.find(v=>v.id===r.vehicleId);if(v.status==='maintenance'&&r.status!=='delivered')throw Error('Araç bakımda.');if(r.quantity>v.capacity)throw Error('Yük araç kapasitesini aşıyor.');if(r.status!=='delivered'&&p.jobs.some(j=>j.id!==r.id&&j.vehicleId===v.id&&j.status!=='delivered'))throw Error('Araçta başka bir açık görev var.');}
  if(['ready','transit','delivered'].includes(r.status)&&r.loaded<r.quantity)throw Error('Yük / işlem tamamlanmadan bu aşamaya geçilemez.');
 }
 return r;
}
export function put(p,col,input){
 if(!Object.hasOwn(LABELS,col))throw Error('Kayıt türü geçersiz.');const previous=p[col].find(r=>r.id===input.id);if(!previous&&p[col].length>=({buildings:12,workers:200,vehicles:30,tasks:300,containers:30,landscape:300,materials:100,jobs:100}[col]))throw Error('Bu kayıt türünün sınırına ulaşıldı.');
 const r=normalize(p,col,input,previous);
 if(col==='buildings')for(const child of p.landscape.filter(o=>o.parentId===r.id)){if(Math.abs(child.x-r.x)+child.w/2>r.w/2-.5||Math.abs(child.z-r.z)+child.d/2>r.d/2-.5)throw Error('Depo içindeki raf / palet yeni ölçülerde dışarıda kalıyor.');}
 if(previous)p[col][p[col].indexOf(previous)]=r;else p[col].push(r);log(p,r.name+(previous?' güncellendi.':' eklendi.'));return r;
}
export function remove(p,col,key){const r=p[col].find(r=>r.id===key);if(!r)return;
 if(col==='buildings'&&[...p.workers,...p.vehicles,...p.landscape,...p.tasks,...p.jobs].some(o=>o.buildingId===key||o.parentId===key||o.targetId===key))throw Error('Bağlı kayıtları önce başka bir yapıya taşı.');
 if(col==='workers'&&[...p.vehicles,...p.tasks].some(o=>o.driverId===key||o.workerId===key))throw Error('Önce araç ve görev atamalarını kaldır.');
 if(col==='containers'&&p.workers.some(o=>o.containerId===key))throw Error('Önce konaklama atamalarını kaldır.');
 if(col==='vehicles'&&p.jobs.some(o=>o.vehicleId===key))throw Error('Araca bağlı işlem kayıtları var.');
 p[col]=p[col].filter(o=>o.id!==key);log(p,r.name+' kaldırıldı.');
}
export function receive(p,key,quantity){const m=p.materials.find(m=>m.id===key);if(!m)throw Error('Malzeme bulunamadı.');m.stock+=num(quantity,.01,1e8,'Giriş miktarı');log(p,m.name+' stoku güncellendi.');}
export function stepJob(p,key,action){
 const j=p.jobs.find(j=>j.id===key);if(!j)throw Error('İşlem bulunamadı.');const next=clone(j);
 if(action==='load'){if(!['planned','loading'].includes(j.status))throw Error('Bu aşamada yük eklenemez.');next.loaded=Math.min(j.quantity,j.loaded+Math.max(1,Math.ceil(j.quantity/3)));next.status=next.loaded===next.quantity?'ready':'loading';}
 else if(action==='dispatch'){if(j.status!=='ready')throw Error('Önce yükü / işlemi tamamla.');if(j.type==='production'){next.status='delivered';}else{const v=p.vehicles.find(v=>v.id===j.vehicleId);if(!v||!v.driverId||v.status!=='active')throw Error('Çıkış için sürücülü aktif araç gerekli.');next.status='transit';}}
 else if(action==='advance'){if(j.status!=='transit')throw Error('İşlem yolda değil.');next.progress=Math.min(1,j.progress+.25);if(next.progress>=1)next.status='delivered';}
 else throw Error('Geçersiz işlem adımı.');return put(p,'jobs',next);
}
export function alerts(p,at){return [...p.materials.filter(m=>m.stock<m.minimum).map(m=>m.name+' minimum stok altında.'),...p.vehicles.filter(v=>v.status==='active'&&!v.driverId).map(v=>v.plate+' için sürücü atanmadı.'),...p.tasks.filter(t=>t.status!=='done'&&date(t.due)<at).map(t=>t.name+' görevi gecikti.')];}
export function estimate(b){const area=b.w*b.d*b.floors;return {area,concrete:Math.round(area*.35),steel:Math.round(area*.04*100)/100,brick:Math.round(area*28)};}
export function metrics(p){return {area:p.buildings.reduce((n,b)=>n+b.w*b.d*b.floors,0),capacity:p.buildings.filter(b=>b.kind==='warehouse').reduce((n,b)=>n+Math.floor(b.w*b.d*1.2),0),production:p.buildings.filter(b=>b.kind==='factory').reduce((n,b)=>n+Math.floor(b.w*b.d*.8),0)};}
export function log(p,message){p.log.unshift({at:new Date().toISOString(),message});p.log=p.log.slice(0,30);}
export function blank(key,name,domain='construction'){return {id:key,name,domain,cursor:'2026-10-26',boundary:{style:'fence',height:1.5,gate:6},buildings:[],workers:[],vehicles:[],containers:[],landscape:[],tasks:[],materials:[{id:'concrete-'+key,name:'Hazır beton',stock:180,minimum:50,unit:'m³'},{id:'steel-'+key,name:'Donatı çeliği',stock:12,minimum:20,unit:'ton'},{id:'brick-'+key,name:'Tuğla',stock:4200,minimum:1000,unit:'adet'}],jobs:[],log:[]};}
const building=(p,name,x,z,w,d,floors,kind='building')=>put(p,'buildings',{name,x,z,w,d,floors,kind,start:'2026-01-01',end:kind==='villa'?'2027-05-01':'2028-12-31',budget:kind==='villa'?9500000:45000000,roof:kind==='villa'?'pitched':'flat',color:'#d2c4ac'});
function team(p){const names=[['Elif','Aydın'],['Murat','Kaya'],['Can','Demir'],['Derya','Çelik'],['Ali','Şahin'],['Ece','Koç'],['Emre','Yıldız'],['Deniz','Aksoy']];
 for(let i=0;i<names.length;i++)put(p,'workers',{firstName:names[i][0],lastName:names[i][1],role:ROLES[i],authority:i===0?'chief':i===1?'leader':'worker',buildingId:p.buildings[i%p.buildings.length]?.id,containerId:p.containers[0]?.id,status:'active',shift:'08:00–17:00'});
}
export function initial(){
 const a=blank('construction-1','İnşaat 1 · Kuzey Yaşam'),b=blank('construction-2','İnşaat 2'),c=blank('construction-3','İnşaat 3'),v=blank('villa','Avlu Villa'),vill=blank('village','Villa Yerleşkesi'),biz=blank('business','Ankara Yerleşkesi','business');
 building(a,'A Blok',-13,-10,12,14,12);building(a,'B Blok',9,-10,12,14,9);building(a,'C Blok',7,12,14,12,15);
 put(a,'containers',{name:'Ekip konaklama',x:-22,z:18,w:6,d:3,capacity:12});team(a);
 for(let i=0;i<3;i++)put(a,'vehicles',{plate:['06 PW 301','06 PW 302','06 PW 303'][i],type:['mixer','excavator','truck'][i],driverId:a.workers[5+i].id,capacity:i===0?8:24,status:'active'});
 put(a,'tasks',{name:'A Blok kalıp kontrolü',buildingId:a.buildings[0].id,workerId:a.workers[1].id,due:'2026-11-02',status:'doing'});
 const vb=building(v,'Avlu Villa',-7,-4,14,10,2,'villa');v.cursor='2027-02-15';
 const addLand=(p,type,name,x,z,w,d,h,bid=null)=>put(p,'landscape',{type,name,x,z,w,d,h,buildingId:bid});
 addLand(v,'pool','Avlu havuzu',13,-4,8,5,1.5,vb.id);addLand(v,'terrace','Ahşap teras',11,-4,14,9,.12,vb.id);addLand(v,'path','Giriş yolu',-7,14,3,19,.08);addLand(v,'lawn','Bahçe',0,0,55,55,.06);
 for(const [x,z]of [[-23,-21],[22,-22],[-23,22],[22,20]])addLand(v,'tree','Zeytin ağacı',x,z,2,2,4,vb.id);
 addLand(v,'pergola','Bahçe pergolası',14,12,7,5,3,vb.id);put(v,'containers',{name:'Saha ekibi',x:-23,z:12,w:6,d:3,capacity:10});team(v);
 for(const [x,z]of [[-14,-13],[12,-13],[-14,12],[12,12]]){const q=building(vill,'Bahçe Villa '+(vill.buildings.length+1),x,z,10,8,2,'villa');addLand(vill,'pool','Özel havuz',x,z+7,6,3,1.4,q.id);}
 vill.cursor='2027-03-01';team(vill);
 building(biz,'Merkez Depo',-13,-12,16,12,1,'warehouse');building(biz,'Üretim Tesisi',12,-12,14,14,2,'factory');building(biz,'Dağıtım Deposu',-13,12,16,10,1,'warehouse');building(biz,'Yönetim Ofisi',13,13,12,10,3,'office');biz.cursor='2030-01-01';team(biz);
 addLand(biz,'road','Ana servis yolu',0,0,5,58,.05);
 for(let i=0;i<4;i++)put(biz,'vehicles',{plate:['06 TR 401','06 TR 402','06 TR 403','06 TR 404'][i],type:'semi',driverId:biz.workers[i+4].id,capacity:24,status:'active'});
 for(let i=0;i<4;i++)put(biz,'jobs',{name:['İstanbul mağaza sevkiyatı','Üretim emri · Panel','Tedarik · Hammadde','Depolar arası transfer'][i],type:['shipment','production','procurement','transfer'][i],buildingId:biz.buildings[i===1?1:0].id,targetId:i===3?biz.buildings[2].id:null,vehicleId:i===1?null:biz.vehicles[i].id,quantity:i===1?120:24,loaded:i===0?8:0,status:i===0?'loading':'planned',route:'istanbul',progress:0});
 for(const p of [a,b,c,v,vill,biz])p.log=[];
 return {version:VERSION,projects:[a,b,c,v,vill,biz],active:'construction-1'};
}
export function validate(input){
 if(!input||input.version!==VERSION||!Array.isArray(input.projects)||input.projects.length!==6)throw Error('Project World v2 dünya JSON dosyası gerekli. Eski v1 dosyaları bu sürüme doğrudan aktarılamaz.');
 const root=clone(input),ids=new Set();const keys=['construction-1','construction-2','construction-3','villa','village','business'];
 for(const p of root.projects){
  if(!keys.includes(p.id)||ids.has(p.id))throw Error('Proje kimliği geçersiz.');ids.add(p.id);p.name=txt(p.name);if(!p.name)throw Error('Proje adı gerekli.');p.domain=p.id==='business'?'business':'construction';date(p.cursor);p.boundary={style:one(p.boundary?.style||'fence',{fence:1,wall:1,hedge:1,line:1},'Sınır'),height:num(p.boundary?.height??1.5,.5,3,'Sınır yüksekliği'),gate:num(p.boundary?.gate??6,2,10,'Kapı genişliği')};p.log=Array.isArray(p.log)?p.log.slice(0,30).map(l=>({at:txt(l.at),message:txt(l.message,180)})):[];
  const used=new Set();for(const col of Object.keys(LABELS)){if(!Array.isArray(p[col])||p[col].length>({buildings:12,workers:200,vehicles:30,tasks:300,containers:30,landscape:300,materials:100,jobs:100}[col]))throw Error('Kayıt sayısı veya liste biçimi geçersiz.');for(const r of p[col]){if(!r||typeof r.id!=='string'||!r.id||used.has(r.id))throw Error('Kayıt kimliği eksik veya tekrarlı.');used.add(r.id);}}
  for(const col of ['buildings','containers','workers','vehicles','landscape','tasks','materials','jobs'])p[col]=p[col].map(r=>normalize(p,col,r,r));
 }
 if(!ids.has(root.active))throw Error('Aktif proje bulunamadı.');return root;
}
