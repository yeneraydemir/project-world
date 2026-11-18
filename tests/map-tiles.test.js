import test from 'node:test';import assert from 'node:assert/strict';
import {mapPoint,visibleTiles} from '../dist/map-tiles.js';import {projectPoint} from '../dist/provinces.js';import {readFileSync} from 'node:fs';
test('OSM tile projection matches province and route coordinates',()=>{
 const p=mapPoint([32.8597,39.9334]);assert.deepEqual(p,projectPoint([32.8597,39.9334]));
 const tiles=visibleTiles([0,0,1030,520],1000);assert(tiles.length>0&&tiles.length<50);
 assert(tiles.some(t=>p[0]>=t.x&&p[0]<t.x+t.size&&p[1]>=t.y&&p[1]<t.y+t.size));
 for(const t of tiles)assert(t.url.startsWith('https://tile.openstreetmap.org/'));
});
test('tile selection only covers current view and stays bounded when zoomed',()=>{
 for(const box of [[0,0,1030,520],[350,180,200,101],[400,200,90,45]]){
  const tiles=visibleTiles(box,800);assert(tiles.length<50);
  assert.equal(new Set(tiles.map(t=>t.key)).size,tiles.length);
  for(const t of tiles)assert(t.x<=box[0]+box[2]&&t.x+t.size>=box[0]&&t.y<=box[1]+box[3]&&t.y+t.size>=box[1]);
 }
});
test('sparse static roads are no longer loaded and focus has no blue fill',()=>{
 const module=readFileSync(new URL('../dist/turkey-map.js',import.meta.url),'utf8');
 assert(!module.includes("fetch('./maps/roads.json')"));assert(module.includes('mountTiles('));
 const css=readFileSync(new URL('../dist/style.css',import.meta.url),'utf8');
 assert(css.includes('fill:transparent!important;stroke:#697a8866!important'));
});
