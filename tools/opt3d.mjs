import {NodeIO} from '@gltf-transform/core';
import {ALL_EXTENSIONS} from '@gltf-transform/extensions';
import {prune,dedup,weld,simplify,textureCompress,quantize} from '@gltf-transform/functions';
import {MeshoptSimplifier} from 'meshoptimizer';
import sharp from 'sharp';
const io=new NodeIO().registerExtensions(ALL_EXTENSIONS);
const B='/home/user/shelbys/forras/3d/';
// glass: keep only Cylinder.011 mesh, drop materials/textures
{const d=await io.read(B+'glass/scene.gltf');const r=d.getRoot();
 for(const n of r.listNodes()){const m=n.getMesh();if(m&&!/^Cylinder\.011_Material_0$/.test(n.getName()))n.setMesh(null)}
 for(const t of r.listTextures())t.dispose();
 await d.transform(prune(),dedup(),weld());
 await io.write(B+'out/glass.glb',d)}
// ice
{const d=await io.read(B+'ice/scene.gltf');
 await d.transform(prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.35,error:.0008}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[1024,1024]}));
 await io.write(B+'out/ice.glb',d)}
// lime
{const d=await io.read(B+'lime/scene.gltf');
 await d.transform(prune(),weld(),simplify({simplifier:MeshoptSimplifier,ratio:.25,error:.0005}),textureCompress({encoder:sharp,targetFormat:'webp',resize:[2048,2048],quality:88}));
 await io.write(B+'out/lime.glb',d)}
