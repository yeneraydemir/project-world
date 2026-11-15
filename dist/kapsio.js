// Project World interchange contract, not a claim about the native Kapsio API.
import {clone,put} from './data.js';
export const FORMAT='project-world/kapsio-master-v1';
const fields={
 workers:['firstName','lastName','role'],
 vehicles:['plate','type','capacity','status'],
 materials:['name','unit','stock','minimum']
};
function key(value){
 if(typeof value!=='string'||!/^[-\w.]{1,60}$/.test(value))throw Error('Kapsio kayıt kimliği 1–60 karakter olmalı (harf, rakam, nokta, tire veya alt çizgi).');
 return value;
}
export function importMaster(project,input){
 if(!input||input.format!==FORMAT||input.locationId!==project.id)throw Error('Aktarım biçimi veya hedef konum eşleşmiyor. Bu konumdan boş şablon indir.');
 const target=clone(project),counts={},seen={};
 for(const [col,allowed] of Object.entries(fields)){
  const list=input[col]??[];
  if(!Array.isArray(list)||list.length>({workers:200,vehicles:30,materials:100}[col]))throw Error('Kapsio listesi veya kayıt sayısı geçersiz.');
  seen[col]=new Set();counts[col]=0;
  for(const row of list){
   const external=key(row?.externalId);
   if(seen[col].has(external))throw Error('Tekrarlı Kapsio kimliği: '+external);
   seen[col].add(external);
   const id='kapsio:'+col+':'+external,existing=target[col].find(r=>r.id===id);
   const values=Object.fromEntries(allowed.filter(k=>Object.hasOwn(row,k)).map(k=>[k,row[k]]));
   // Preserve stock after first import; otherwise a second import would erase local receipts.
   if(col==='materials'&&existing)delete values.stock;
   if(col==='vehicles'&&Object.hasOwn(row,'driverExternalId'))values.driverId=row.driverExternalId?'kapsio:workers:'+key(row.driverExternalId):null;
   put(target,col,{...existing,...values,id});
   counts[col]++;
  }
 }
 return {target,counts};
}
export function exportOperations(p){
 return {format:'project-world/kapsio-construction-v1',location:{id:p.id,name:p.name,city:p.city},records:p.operations.map(({photos,...r})=>({...r,
  buildingName:p.buildings.find(b=>b.id===r.buildingId)?.name,
  unitName:p.spaces.find(s=>s.id===r.spaceId)?.name,
  responsible:p.workers.find(w=>w.id===r.workerId)?.name,
  plate:p.vehicles.find(v=>v.id===r.vehicleId)?.plate,
  material:p.materials.find(m=>m.id===r.materialId)?.name
 }))};
}
