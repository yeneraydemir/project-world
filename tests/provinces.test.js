import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import {geometryPath,bounds,contains,matchesProvince} from '../dist/provinces.js';
const geo=JSON.parse(readFileSync(new URL('../dist/maps/provinces.json',import.meta.url)));
test('all 81 province polygons have unique plate codes and renderable bounds',()=>{
 assert.equal(geo.features.length,81);assert.equal(new Set(geo.features.map(f=>f.properties.il_kodu)).size,81);
 for(const f of geo.features){assert(['Polygon','MultiPolygon'].includes(f.geometry.type));assert(geometryPath(f.geometry).startsWith('M'));assert(bounds(f.geometry).every(Number.isFinite));}
});
test('province point containment respects holes and multipolygons',()=>{
 const g={type:'Polygon',coordinates:[[[0,0],[10,0],[10,10],[0,10],[0,0]],[[4,4],[6,4],[6,6],[4,6],[4,4]]]};
 assert(contains(g,[2,2]));assert(!contains(g,[5,5]));assert(!contains(g,[11,11]));
});
test('province filters match origin, destination or route geometry',()=>{
 const f=geo.features.find(f=>f.properties.il_kodu==='06');
 const entry=(from,to,coordinates)=>({record:{trip:{from,to,coordinates}}});
 assert(matchesProvince(f,entry('Ankara','İstanbul',[])));
 assert(matchesProvince(f,entry('İzmir','Trabzon',[[32.8597,39.9334]])));
 assert(!matchesProvince(f,entry('İzmir','İstanbul',[[27.14,38.42]])));
});
