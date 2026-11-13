import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,textureCompress} from '@gltf-transform/functions';
import sharp from 'sharp';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);const B='/home/user/shelbys/forras/3d/out/';
const d=await io.read(B+'ice.glb');const r=d.getRoot();
for(const m of r.listMaterials()){const n=m.getNormalTexture();for(const t of r.listTextures())if(t!==n)t.dispose();for(const e of m.listExtensions())e.dispose();}
await d.transform(prune(),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024],quality:85}));
await io.write(B+'ice.glb',d);
for(const p of r.listMeshes())console.log(p.listPrimitives().map(x=>x.getAttribute('POSITION').getCount()))
