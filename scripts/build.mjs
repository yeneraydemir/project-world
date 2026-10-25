import {mkdir,copyFile} from 'node:fs/promises';
await mkdir('dist/vendor',{recursive:true});
for(const [src,dst] of [['node_modules/three/build/three.module.js','three.module.js'],['node_modules/three/examples/jsm/controls/OrbitControls.js','OrbitControls.js'],['node_modules/three/LICENSE','LICENSE.txt']])await copyFile(src,'dist/vendor/'+dst);
console.log('Yerel Three.js dosyaları hazır.');
