/* Shelby's – 3D copa pohár a keretes átjáróban.
   Modellek: üvegpohár (Helindu: The ultimate glass pack), jégkocka (Adamante: Ice Cube), lime szelet (Arkify 3D: Lime Slice 3D Scan),
   mind CC BY 4.0, a Sketchfabról. A pohár szárát megnyújtjuk, hogy copa legyen belőle; a folyadékot a pohár saját belső íve alapján rajzoljuk.
   Az üveg nem "transmission": átlátszó héj, amelynek a fényes tükröződései adják az alfát, így minden látszik benne, és olcsó is. */
import * as THREE from './three/three.module.min.js';
import { GLTFLoader } from './three/GLTFLoader.js';
import { mergeGeometries } from './three/BufferGeometryUtils.js';

export async function init(canvas, S) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);

  /* ---------- környezet: sötét pince, néhány fénycsík (meleg softbox, keskeny csíkok, alul a pult vörös fénye) */
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x0a0706, side: THREE.BackSide })));
  function panel(w, h, col, k, pos, look) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  }
  panel(12, 0.28, 0xffe2b8, 7, [-1, 7, 5], [0, 0, 0]);     // fölső meleg fénycsík, elölről
  panel(0.25, 8, 0xffd9a8, 4, [-5, 2, 5], [0, 1, 0]);      // bal elülső keskeny csík
  panel(0.5, 9, 0xfff0d8, 9, [7, 1.5, 2.5], [0, 1, 0]);      // jobb oldali keskeny csík
  panel(0.35, 7, 0xffd6a0, 5, [-7, 1, -1.5], [0, 1, 0]);     // bal oldali csík
  panel(12, 0.7, 0xff2a14, 7, [0, -0.6, -7], [0, 0.5, 0]);   // a pult vörös fénye hátul
  panel(10, 0.3, 0xc9a24f, 2.2, [0, -6, 3], [0, 0, 0]);     // alulról arany visszfény (csík)
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.03).texture;
  pm.dispose();

  const key = new THREE.DirectionalLight(0xffe1b5, 2.2); key.position.set(-2, 4, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0xff3a20, 1.6); rim.position.set(1, 1, -4); scene.add(rim);
  scene.add(new THREE.AmbientLight(0x2a1c14, 1));

  /* ---------- a tükröződés adja az alfát: ahol fény csillan, ott látszik az üveg */
  function glassy(mat, base, boost) {
    mat.transparent = true; mat.premultipliedAlpha = true; mat.depthWrite = false;
    mat.onBeforeCompile = (sh) => {
      sh.uniforms.uBase = { value: base }; sh.uniforms.uBoost = { value: boost };
      sh.fragmentShader = 'uniform float uBase;\nuniform float uBoost;\n' + sh.fragmentShader
        .replace('#include <opaque_fragment>', 'float sl=max(max(outgoingLight.r,outgoingLight.g),outgoingLight.b);\ngl_FragColor=vec4(outgoingLight,clamp(uBase*opacity+sl*uBoost,0.,1.)*opacity);')
        .replace('#include <premultiplied_alpha_fragment>', 'gl_FragColor.rgb*=opacity;');
    };
    return mat;
  }

  const loader = new GLTFLoader();
  // az előnézeti tárhely nem szolgál ki .glb-t, ott ugyanaz a fájl más kiterjesztéssel van fent
  const load = (u) => loader.loadAsync(new URL('../models/' + u + '.glb?v=2', import.meta.url).href).catch(() => loader.loadAsync(new URL('../models/' + u + '.wasm?v=2', import.meta.url).href));
  const [gG, gI, gL] = await Promise.all(['glass', 'ice', 'lime'].map(load));
  function firstGeo(g, all) {
    const gs = []; let mat = null; g.scene.updateMatrixWorld(true);
    g.scene.traverse((o) => { if (o.isMesh && (all || !gs.length)) { const q = o.geometry.clone().applyMatrix4(o.matrixWorld); for (const k in q.attributes) if (!['position', 'normal', 'uv'].includes(k)) q.deleteAttribute(k); if (!q.attributes.normal) q.computeVertexNormals(); gs.push(q.index ? q.toNonIndexed() : q); mat = mat || o.material; } });
    return [gs.length > 1 ? mergeGeometries(gs) : gs[0], mat];
  }

  /* ---------- pohár: középre, a szár megnyújtva */
  let [gg] = firstGeo(gG);
  gg.computeBoundingBox();
  let bb = gg.boundingBox, c = new THREE.Vector3(); bb.getCenter(c);
  gg.translate(-c.x, -bb.min.y, -c.z);
  const pos = gg.attributes.position, S0 = 0.15, S1 = 0.42, ADD = 0.45, K = (S1 - S0 + ADD) / (S1 - S0);
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    if (y > S1) pos.setY(i, y + ADD); else if (y > S0) pos.setY(i, S0 + (y - S0) * K);
  }
  pos.needsUpdate = true; gg.computeBoundingBox(); gg.computeBoundingSphere();
  // a pohár belső íve: magasság szerint a legnagyobb sugár, mínusz a falvastagság
  const B = 48, prof = new Float32Array(B).fill(0), y0 = S1 + ADD + 0.09, y1 = gg.boundingBox.max.y;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i); if (y < y0) continue;
    const t = Math.min(B - 1, Math.floor((y - y0) / (y1 - y0) * B));
    prof[t] = Math.max(prof[t], Math.hypot(pos.getX(i), pos.getZ(i)));
  }
  { const q = Float32Array.from(prof); for (let i = 0; i < B; i++) { let a = 0, n = 0; for (let k = -2; k <= 2; k++) { const j = i + k; if (j >= 0 && j < B && q[j] > 0) { a += q[j]; n++; } } prof[i] = n ? a / n : 0; } }
  const inner = (y) => { const t = Math.max(0, Math.min(B - 1, (y - y0) / (y1 - y0) * B - .5)); const a = Math.floor(t), b2 = Math.min(B - 1, a + 1); return Math.max(0, (prof[a] + (prof[b2] - prof[a]) * (t - a)) - 0.034); };

  const glassMat = glassy(new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.035, metalness: 0, ior: 1.5, specularIntensity: 1, envMapIntensity: 2.6, side: THREE.DoubleSide }), 0.05, 1.15);
  const glass = new THREE.Mesh(gg, glassMat); glass.renderOrder = 3;

  /* ---------- folyadék (halvány rózsaszín gin-tonik) */
  const liqMat = glassy(new THREE.MeshPhysicalMaterial({ color: 0xf2a9b0, roughness: 0.14, metalness: 0, ior: 1.33, envMapIntensity: 0.7, emissive: 0x8a2a30, emissiveIntensity: 0.45, side: THREE.FrontSide }), 0.5, 0.35);
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liqMat); liquid.renderOrder = 1;
  let lvlBuilt = -1;
  function buildLiquid(h) {
    if (Math.abs(h - lvlBuilt) < 0.002) return; lvlBuilt = h;
    liquid.visible = h > 0.004;
    if (!liquid.visible) return;
    const top = y0 + 0.02 + h, pts = [new THREE.Vector2(0, y0 + 0.02)];
    const n = 10; for (let i = 0; i <= n; i++) { const y = y0 + 0.02 + h * i / n; pts.push(new THREE.Vector2(Math.max(0.001, inner(y) - (i === 0 ? 0.08 : 0)), y)); }
    pts.push(new THREE.Vector2(0, top));
    liquid.geometry.dispose(); liquid.geometry = new THREE.LatheGeometry(pts, 72);
    S.surf = top; S.surfR = inner(top);
  }

  /* ---------- jég */
  let [ig, im0] = firstGeo(gI);
  ig.computeBoundingBox(); ig.boundingBox.getCenter(c); ig.translate(-c.x, -c.y, -c.z);
  const isz = new THREE.Vector3(); ig.boundingBox.getSize(isz); const ik = 0.22 / Math.max(isz.x, isz.y, isz.z); ig.scale(ik, ik, ik);
  const iceMat = glassy(new THREE.MeshPhysicalMaterial({ color: 0xa8c8de, roughness: 0.06, metalness: 0, ior: 1.31, clearcoat: 1, clearcoatRoughness: 0.12, envMapIntensity: 2.2, normalMap: im0 && im0.normalMap || null, normalScale: new THREE.Vector2(0.45, 0.45) }), 0.08, 0.5);
  iceMat.depthWrite = true;
  const ICE = [
    { x: -0.17, z: 0.08, ry: 0.4, rx: 0.25, s: 0.0 }, { x: 0.18, z: -0.06, ry: 1.2, rx: -0.2, s: 0.11 },
    { x: 0.12, z: 0.1, ry: 2.1, rx: 0.15, s: 0.22 }, { x: -0.02, z: -0.2, ry: 2.9, rx: -0.3, s: 0.33 }
  ].map((o) => { const m = new THREE.Mesh(ig, iceMat); m.renderOrder = 2; o.m = m; m.visible = false; return o; });

  /* ---------- lime karika: a szkennelt fél lime-ot laposra nyomjuk, így a vágott lapja egy vastag karika */
  let [lg, lm0] = firstGeo(gL, true);
  lg.computeBoundingBox(); const lsz = new THREE.Vector3(); lg.boundingBox.getSize(lsz);
  const thin = [lsz.x, lsz.y, lsz.z].indexOf(Math.min(lsz.x, lsz.y, lsz.z));
  if (thin === 0) lg.rotateY(Math.PI / 2); else if (thin === 1) lg.rotateX(Math.PI / 2);
  lg.computeBoundingBox(); lg.boundingBox.getCenter(c); lg.translate(-c.x, -c.y, -lg.boundingBox.min.z);
  lg.boundingBox.getSize(lsz); const lk = 0.34 / Math.max(lsz.x, lsz.y); lg.scale(lk, lk, lk * 0.2);
  lg.computeVertexNormals();
  const lmap = lm0 && lm0.map; if (lmap) lmap.colorSpace = THREE.SRGBColorSpace;
  const limeMat = new THREE.MeshStandardMaterial({ map: lmap, roughness: 0.38, metalness: 0, emissiveMap: lmap, emissive: 0xffffff, emissiveIntensity: 0.42, envMapIntensity: 0.9, side: THREE.DoubleSide });
  const lime = new THREE.Mesh(lg, limeMat); lime.visible = false; lime.renderOrder = 2;

  /* ---------- buborékok és a becsapódás gyűrűi */
  const NB = 46, bubGeo = new THREE.SphereGeometry(1, 10, 8), bubMat = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, blending: THREE.AdditiveBlending, depthWrite: false });
  const bubs = new THREE.InstancedMesh(bubGeo, bubMat, NB); bubs.renderOrder = 2;
  const BS = Array.from({ length: NB }, (_, i) => ({ a: Math.random() * 6.28, r: Math.sqrt(Math.random()), sp: 0.07 + Math.random() * 0.12, ph: Math.random(), s: 0.004 + Math.random() * 0.007 }));
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xfff1dc, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
  const rings = ICE.map(() => { const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1, 64), ringMat.clone()); r.rotation.x = -Math.PI / 2; r.renderOrder = 2; return r; });

  const cup = new THREE.Group();
  cup.add(liquid, glass, bubs, lime, ...ICE.map((o) => o.m), ...rings);
  scene.add(cup);

  /* ---------- méret */
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, S.dpr || 1.75));
    renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // a pohár kb. a képmagasság 62%-át töltse ki, keskeny képernyőn a szélességhez igazítva
    const H = 2.15, fit = Math.max(H / 0.62 / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), 1.3 / 0.62 / 2 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / cam.aspect);
    S.dist = fit; cam.updateProjectionMatrix();
  }
  new ResizeObserver(size).observe(canvas); size();

  /* ---------- idővonal: S.p (0..1) a görgetésből vagy időzítve jön */
  const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t);
  const clamp = (t) => Math.max(0, Math.min(1, t));
  const t0 = performance.now(); let mxs = 0, mys = 0;
  function frame() {
    const p = S.p, tm = (performance.now() - t0) / 1000;
    // pohár érkezik alulról, a végén kicsit feljebb úszik és elhalványul (a vászon CSS-ben halványul)
    const inn = ease(p / 0.14);
    cup.position.y = -0.5 * (1 - inn) + 0.25 * ease((p - 0.86) / 0.14);
    cup.rotation.y = 0.9 * (1 - inn) + (p - 0.5) * 0.5;
    // töltés, minden jégkocka emeli kicsit a szintet
    let lvl = 0.36 * ease((p - 0.13) / 0.2);
    ICE.forEach((o) => { lvl += 0.016 * clamp((p - (0.34 + o.s * 0.68 + 0.04)) / 0.03); });
    buildLiquid(lvl);
    const surf = S.surf || y0, sr = S.surfR || 0.4;
    // jég: zuhan, átüti a felszínt, felbukik, ringatózik
    ICE.forEach((o, i) => {
      const st = 0.34 + o.s * 0.68, q = (p - st) / 0.1, m = o.m;
      m.visible = q > 0;
      const rest = surf - 0.06 + (i % 2) * 0.03;
      let y;
      if (q < 0.45) { const f = q / 0.45; y = rest + 2.2 * (1 - f * f); }
      else { const f = (q - 0.45) / 0.55; y = rest - 0.14 * Math.exp(-f * 4) * Math.cos(f * 9); }
      m.position.set(o.x * sr / 0.45, y + Math.sin(tm * 1.3 + i) * 0.006 * clamp(q - 1 + 1), o.z * sr / 0.45);
      m.rotation.set(o.rx + (1 - clamp(q)) * 1.6, o.ry + (1 - clamp(q)) * 2.4, o.rx * 0.6);
      const rg = rings[i], rq = (p - st - 0.045) / 0.07;
      rg.position.set(m.position.x, surf + 0.002, m.position.z);
      const rs = 0.05 + 0.22 * clamp(rq); rg.scale.set(rs, rs, rs);
      rg.material.opacity = rq > 0 && rq < 1 ? 0.55 * (1 - rq) * (1 - rq) : 0;
    });
    // lime: a végén csúszik be a pohár szélére
    { const q = clamp((p - 0.66) / 0.1), ql = ease(q);
      lime.visible = p > 0.66;
      lime.position.set(-0.04 + 0.02 * ql, surf + 0.01 + 1.9 * (1 - ql) * (1 - ql) + Math.sin(tm * 1.1) * 0.004, 0.25 * ql);
      lime.rotation.set(-0.5 + (1 - ql) * 2.6, 0.15 + (1 - ql) * 1.4, 0.25); }
    // buborékok csak a folyadékban
    const dummy = frame.d || (frame.d = new THREE.Object3D());
    const fill = Math.max(0, surf - y0 - 0.03);
    BS.forEach((b, i) => {
      const f = (b.ph + tm * b.sp) % 1, y = y0 + 0.05 + f * fill, rr = inner(y) * 0.8 * b.r;
      dummy.position.set(Math.cos(b.a) * rr, y, Math.sin(b.a) * rr);
      const s = fill > 0.05 ? b.s * (0.6 + f * 0.6) : 0; dummy.scale.set(s, s, s); dummy.updateMatrix(); bubs.setMatrixAt(i, dummy.matrix);
    });
    bubs.instanceMatrix.needsUpdate = true;
    // kamera: enyhén körbe a görgetéssel, egérre kicsit billen
    mxs += ((S.mx || 0) - mxs) * 0.06; mys += ((S.my || 0) - mys) * 0.06;
    const a = -0.35 + p * 0.7 + mxs * 0.25, d = S.dist || 6;
    cam.position.set(Math.sin(a) * d, 1.05 + 0.55 + mys * 0.35, Math.cos(a) * d);
    cam.lookAt(0, 1.02, 0);
    renderer.render(scene, cam);
  }
  S.frame = frame;
  return S;
}
