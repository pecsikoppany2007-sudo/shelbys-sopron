import {NodeIO} from '@gltf-transform/core';
const d=await new NodeIO().read('/home/user/shelbys/forras/3d/out/glass.glb');
const n=d.getRoot().listNodes().find(n=>n.getMesh());const M=n.getWorldMatrix();
const p=n.getMesh().listPrimitives()[0].getAttribute('POSITION');const v=[];
for(let i=0;i<p.getCount();i++){const a=p.getElement(i,[]);const x=M[0]*a[0]+M[4]*a[1]+M[8]*a[2]+M[12],y=M[1]*a[0]+M[5]*a[1]+M[9]*a[2]+M[13],z=M[2]*a[0]+M[6]*a[1]+M[10]*a[2]+M[14];v.push([x,y,z])}
let mn=[1e9,1e9,1e9],mx=[-1e9,-1e9,-1e9];v.forEach(q=>q.forEach((c,k)=>{mn[k]=Math.min(mn[k],c);mx[k]=Math.max(mx[k],c)}));console.log(mn.map(x=>x.toFixed(3)),mx.map(x=>x.toFixed(3)));
// up axis guess: largest extent
const up=[0,1,2].sort((a,b)=>(mx[b]-mn[b])-(mx[a]-mn[a]))[0];console.log('up',up);
const B=30,rows=Array.from({length:B},()=>[1e9,-1e9]);const o=[0,1,2].filter(k=>k!==up);const cx=(mn[o[0]]+mx[o[0]])/2,cz=(mn[o[1]]+mx[o[1]])/2;
v.forEach(q=>{const t=Math.min(B-1,Math.floor((q[up]-mn[up])/(mx[up]-mn[up])*B));const r=Math.hypot(q[o[0]]-cx,q[o[1]]-cz);rows[t][0]=Math.min(rows[t][0],r);rows[t][1]=Math.max(rows[t][1],r)});
rows.forEach((r,i)=>console.log(i,(mn[up]+(i+.5)/B*(mx[up]-mn[up])).toFixed(3),r[0].toFixed(3),r[1].toFixed(3)));
