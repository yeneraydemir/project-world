import test from 'node:test';
import assert from 'node:assert/strict';
import * as D from '../dist/data.js';
import * as O from '../dist/operations.js';
import * as K from '../dist/kapsio.js';
const fixture=()=>{const root=D.initial(),p=root.projects[0];return {root,p,buildingId:p.buildings[0].id};};
test('v2 migration adds independent operational collection without deleting old tasks',()=>{
 const {root,p}=fixture();root.version=2;delete p.operations;
 const next=D.validate(root);assert.equal(next.version,4);assert.deepEqual(next.projects[0].operations,[]);assert.deepEqual(next.projects[0].tasks,p.tasks);
});
test('receipt posts stock exactly once and locks the credited quantity',()=>{
 const {p,buildingId,root}=fixture(),m=p.materials[0],before=m.stock;
 const r=D.put(p,'operations',{type:'delivery',name:'Beton',due:'2026-11-15',buildingId,materialId:m.id,quantity:5});
 assert.throws(()=>D.put(p,'operations',{...r,status:'done',received:true}),/Teslim al/);
 const accepted=D.acceptDelivery(p,r.id,'2026-11-16');assert.equal(m.stock,before+5);
 assert.throws(()=>D.acceptDelivery(p,r.id));assert.throws(()=>D.put(p,'operations',{...accepted,quantity:6}));assert.throws(()=>D.remove(p,'operations',r.id));
 assert.equal(D.validate(root).projects[0].operations[0].completed,'2026-11-16');
});
test('daily agenda uses Istanbul day and ignores completed work and simulation cursor',()=>{
 const {p,buildingId}=fixture();p.tasks=[];p.cursor='2030-01-01';
 const day=O.today(new Date('2026-11-14T22:30:00Z'));assert.equal(day,'2026-11-15');
 for(const [due,status] of [['2026-11-14','todo'],['2026-11-15','todo'],['2026-11-16','doing'],['2026-11-10','done']])D.put(p,'operations',{type:'maintenance',name:due,due,buildingId,status});
 assert.deepEqual(O.daily([p],day).map(x=>x.state),['late','today','upcoming']);
});
test('stage percentage compares dates independently and validates attachments',()=>{
 const {p,buildingId}=fixture();const input={type:'stage',stage:'roof',name:'Çatı',start:'2026-11-10',due:'2026-11-20',actual:25,buildingId};
 const r=D.put(p,'operations',input);assert.equal(r.status,'doing');assert.equal(O.plannedStage(r,'2026-11-15'),50);
 assert.throws(()=>D.put(p,'operations',{...input,photos:['https://example.com/photo']}),/JPEG/);
 assert.throws(()=>D.put(p,'operations',{...input,due:'2026-11-09'}),/başlangıç/);
});
test('maintenance binds the unit to its building and blocks orphaning',()=>{
 const {p,buildingId,root}=fixture();
 const u=D.put(p,'spaces',{name:'Ofis',type:'office',buildingId,floor:1,area:15});
 const r=D.put(p,'operations',{type:'maintenance',name:'Klima',spaceId:u.id,due:'2026-11-15'});
 assert.equal(r.buildingId,buildingId);assert.throws(()=>D.remove(p,'spaces',u.id));assert.doesNotThrow(()=>D.validate(root));
});
test('Kapsio interchange is location scoped and reimport preserves local stock',()=>{
 const {p}=fixture();
 const payload={format:K.FORMAT,locationId:p.id,workers:[{externalId:'E1',firstName:'Ali',lastName:'Kaya'}],vehicles:[{externalId:'V1',plate:'06 K 01',type:'truck',driverExternalId:'E1',capacity:10}],materials:[{externalId:'M1',name:'Çimento',unit:'kg',stock:1,minimum:1}]};
 assert.throws(()=>K.importMaster(p,{...payload,locationId:'elsewhere'}));
 const {target}=K.importMaster(p,payload),m=target.materials.find(r=>r.id==='kapsio:materials:M1');D.receive(target,m.id,3);
 assert.equal(K.importMaster(target,payload).target.materials.find(r=>r.id===m.id).stock,4);
 assert.equal(target.vehicles.at(-1).driverId,target.workers.at(-1).id);
 assert.equal(p.workers.some(w=>w.id==='kapsio:workers:E1'),false);
});
