import test from 'node:test';import assert from 'node:assert/strict';
import * as T from '../dist/tracking.js';import * as D from '../dist/data.js';
const trip=()=>T.normalizeTrip({from:'Ankara',to:'İstanbul',departure:'2026-11-18T10:00',arrival:'2026-11-18T16:00',coordinates:[T.CITIES.Ankara,[31,40.5],T.CITIES.İstanbul],distance:450000});
test('Turkey clock uses +03 consistently',()=>{assert.equal(T.instant('2026-11-18T10:00'),Date.parse('2026-11-18T07:00Z'));assert.throws(()=>T.instant('2026-02-30T10:00'));});
test('vehicle follows polyline and clamps before and after journey',()=>{const t=trip();assert.deepEqual(T.position(t,T.instant('2026-11-18T09:00')).point,t.coordinates[0]);assert.equal(T.position(t,T.instant('2026-11-18T13:00')).f,.5);assert.deepEqual(T.position(t,T.instant('2026-11-18T17:00')).point,t.coordinates.at(-1));});
test('bad schedules and mismatched geometry are rejected',()=>{assert.throws(()=>T.normalizeTrip({...trip(),arrival:'2026-11-18T09:00'}));assert.throws(()=>T.normalizeTrip({...trip(),to:'Ankara'}));assert.throws(()=>T.normalizeTrip({...trip(),coordinates:[[0,0],[1,1]]}));});
test('v3 migration preserves records and planned trips survive backup',()=>{const w=D.initial(),p=w.projects.find(p=>p.domain==='business'),j=p.jobs[0];D.put(p,'jobs',{...j,trip:trip()});w.version=3;const next=D.validate(w);assert.equal(next.version,4);assert.deepEqual(next.projects.find(q=>q.id===p.id).jobs[0].trip,j.trip||trip());});
test('all 81 provinces selectable',()=>assert.equal(Object.keys(T.CITIES).length,81));
test('vehicle heading follows route direction and stops at final point',async()=>{
 const {vehiclePose}=await import('../dist/tracking.js'),t=trip(),pose=vehiclePose(t,T.instant('2026-11-18T13:00'));
 assert(Number.isFinite(pose.angle));assert(pose.angle<0||pose.angle>90);
 assert.equal(vehiclePose(t,T.instant('2026-11-18T18:00')).f,1);
});
