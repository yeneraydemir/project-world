import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {contains} from '../dist/provinces.js';import * as D from '../dist/data.js';import {CITIES,normalizeTrip} from '../dist/tracking.js';import * as A from '../dist/shipment-api.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
test('all 81 plate anchors lie inside their own province',()=>{
 const labels=read('../dist/maps/labels.json'),geo=read('../dist/maps/provinces.json');assert.equal(Object.keys(labels).length,81);
 for(const f of geo.features)assert(contains(f.geometry,labels[f.properties.il_kodu]),f.properties.il_adi);
});
test('road layer has major and connecting roads with finite geometry',()=>{
 const roads=read('../dist/maps/roads.json');assert(roads.length>200);assert(roads.some(r=>r.major));assert(roads.some(r=>!r.major));
 assert(roads.some(r=>r.ref==='E80'));for(const r of roads)assert(r.points.length>=2&&r.points.every(p=>p.length===2&&p.every(Number.isFinite)));
});
function shipment(){
 const p=D.initial().projects.find(p=>p.domain==='business'),v=p.vehicles.find(v=>!p.jobs.some(j=>j.vehicleId===v.id&&j.status!=='delivered'));
 const r=D.put(p,'jobs',{name:'Harita sevkiyatı',type:'shipment',buildingId:p.buildings[0].id,vehicleId:v.id,quantity:1,cargo:'Makine',cargoUnit:'adet',loaded:0,status:'planned',route:'istanbul',progress:0,
 trip:normalizeTrip({from:'Ankara',to:'İstanbul',departure:'2026-11-18T10:00',arrival:'2026-11-18T16:00',coordinates:[CITIES.Ankara,CITIES.İstanbul],distance:441000})});
 return {p,r};
}
test('map shipment creates valid operational record and API payload',()=>{
 const {p,r}=shipment(),payload=A.shipmentPayload(p,r);assert.equal(payload.externalId,r.id);assert.equal(payload.vehicle.plate,p.vehicles.find(v=>v.id===r.vehicleId).plate);assert(payload.route.departure.endsWith('+03:00'));assert.equal(payload.cargo.description,'Makine');assert.equal(p.jobs.at(-1).status,'planned');
});
test('API needs configuration, stable idempotency and explicit receipt',async()=>{
 A.clearApi();const {p,r}=shipment();await assert.rejects(()=>A.sendShipment(p,r),/yapılandırılmadı/);
 assert.throws(()=>A.configureApi('http://example.com','key'));assert.throws(()=>A.configureApi('https://u:p@example.com','key'));
 const old=globalThis.fetch;let options;
 try{
  A.configureApi('https://example.com/shipments','test-key');
  globalThis.fetch=async(url,o)=>{options=o;return {ok:true,json:async()=>({id:'remote-1'})};};
  const receipt=await A.sendShipment(p,r);assert.equal(receipt.id,'remote-1');assert.equal(options.headers['Idempotency-Key'],r.id);
  assert.equal(options.headers.Authorization,'Bearer test-key');assert.equal(options.redirect,'error');
  globalThis.fetch=async()=>({ok:false,status:500});await assert.rejects(()=>A.sendShipment(p,r),/500/);
  globalThis.fetch=async()=>({ok:true,json:async()=>({ok:true})});await assert.rejects(()=>A.sendShipment(p,r),/kimliği/);
  assert(!r.kapsio);
 }finally{globalThis.fetch=old;A.clearApi();}
});
