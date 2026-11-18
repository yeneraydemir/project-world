// Explicit adapter contract; no credentials are persisted in world data.
let connection=null;
export function configureApi(endpoint,token){
 const url=new URL(endpoint);
 if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash)throw Error('API için kullanıcı adı, sorgu ve parça içermeyen bir HTTPS adresi gir.');
 if(!token?.trim())throw Error('Bu oturum için API erişim anahtarı gir.');
 connection={endpoint:url.href,token:token.trim()};
}
export function clearApi(){connection=null;}
export function apiReady(){return Boolean(connection);}
export function shipmentPayload(project,record){
 const v=project.vehicles.find(v=>v.id===record.vehicleId),w=project.workers.find(w=>w.id===v?.driverId);
 if(!v||!record.trip)throw Error('Sevkiyat için araç ve rota gerekli.');
 return {schema:'project-world.shipment.v1',externalId:record.id,source:'project-world',location:{id:project.id,name:project.name,city:project.city},
  name:record.name,status:record.status,vehicle:{externalId:v.id,plate:v.plate},driver:w?{externalId:w.id,name:w.name}:null,
  cargo:{description:record.cargo||record.name,quantity:record.quantity,unit:record.cargoUnit||'adet'},
  route:{from:record.trip.from,to:record.trip.to,departure:record.trip.departure+':00+03:00',estimatedArrival:record.trip.arrival+':00+03:00',distanceMeters:record.trip.distance}};
}
export async function sendShipment(project,record){
 if(!connection)throw Error('Kapsio API bağlantısı bu oturumda yapılandırılmadı.');
 const c=connection,payload=shipmentPayload(project,record);
 const response=await fetch(c.endpoint,{method:'POST',redirect:'error',headers:{'Content-Type':'application/json','Authorization':'Bearer '+c.token,'Idempotency-Key':record.id},body:JSON.stringify(payload),signal:AbortSignal.timeout(20000)});
 if(!response.ok)throw Error('Kapsio API isteği başarısız (HTTP '+response.status+'). Kayıt yerelde korundu.');
 let data;try{data=await response.json();}catch{throw Error('API geçerli JSON yanıtı vermedi. Yeniden denemeden önce Kapsio kaydını kontrol et.');}
 if(!data||typeof data.id!=='string'||!data.id.trim()||data.id.length>200)throw Error('API kayıt kimliği döndürmedi. Kapsio kaydını kontrol et.');
 return {id:data.id,syncedAt:new Date().toISOString()};
}
