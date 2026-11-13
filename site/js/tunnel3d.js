/* Shelby's – az átjáró 3D-ben: a logó saját art deco kerete aranyból, egymás mögött, a végén a felirat.
   A keret és a felirat ugyanaz a vektor, mint az oldalon (#kf és logo-word.svg), itt kihúzva valódi fém lapokká.
   S.p (0..1) a görgetésből vagy időzítve jön, S.mx/S.my az egérből. */
import * as THREE from './three/three.module.min.js';
import { SVGLoader } from './three/SVGLoader.min.js';

function shapesFrom(svgText) {
  const data = new SVGLoader().parse(svgText);
  const out = [];
  data.paths.forEach((p) => { p.userData.style.fillRule = 'evenodd'; out.push(...SVGLoader.createShapes(p)); });
  return out;
}

export async function init(canvas, S) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, stencil: true, powerPreference: 'high-performance' });
  renderer.setClearColor(0x140a07, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x1c0c08, 0.1);
  const cam = new THREE.PerspectiveCamera(40, 1, 0.05, 60);

  /* ---------- környezet a fém tükröződéseihez: sötét pince, meleg fénycsíkok, alul a pult vörös fénye */
  const env = new THREE.Scene();
  env.add(new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), new THREE.MeshBasicMaterial({ color: 0x050403, side: THREE.BackSide })));
  function strip(w, h, col, k, pos, look) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(col).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(...look); env.add(m);
  }
  strip(16, 0.5, 0xffe0b0, 12, [0, 8, 2], [0, 0, 0]);
  strip(0.45, 14, 0xffd9a0, 9, [-9, 0, 3], [0, 0, 0]);
  strip(0.45, 14, 0xfff0d8, 7, [9, 0, -2], [0, 0, 0]);
  strip(18, 0.6, 0xff2a12, 5, [0, -8, -3], [0, 0, 0]);
  strip(8, 3, 0xffc880, 2.4, [0, 1, 10], [0, 0, 0]);
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(env, 0.02).texture;
  pm.dispose();

  // a kamerával együtt haladó meleg fény: a közeli keret felragyog, a távoliak a sötétben maradnak
  const lamp = new THREE.PointLight(0xffd29a, 16, 7, 1.4); scene.add(lamp);
  const key = new THREE.DirectionalLight(0xffe2b8, 0.6); key.position.set(-2, 3, 4); scene.add(key);

  /* ---------- a keret: a logó vektora (#kf), 2 egység szélesre méretezve, fém lappá kihúzva */
  const d = document.getElementById('kf').getAttribute('d');
  const fShapes = shapesFrom('<svg xmlns="http://www.w3.org/2000/svg"><path d="' + d + '"/></svg>');
  const fGeo = new THREE.ExtrudeGeometry(fShapes, { depth: 26, bevelEnabled: true, bevelThickness: 3, bevelSize: 2.2, bevelSegments: 1, curveSegments: 3 });
  fGeo.computeBoundingBox();
  const fb = fGeo.boundingBox, fw = fb.max.x - fb.min.x, fk = 2 / fw;
  fGeo.translate(-(fb.min.x + fb.max.x) / 2, -(fb.min.y + fb.max.y) / 2, -fb.max.z);
  fGeo.scale(fk, -fk, fk);   // az SVG y lefelé nő
  const gold = new THREE.MeshStandardMaterial({ color: 0xe2b457, metalness: 1, roughness: 0.22, envMapIntensity: 1.6 });
  const N = 8, GAP = 2.3;
  const frames = new THREE.InstancedMesh(fGeo, gold, N);
  const m4 = new THREE.Matrix4();
  for (let i = 0; i < N; i++) { m4.makeTranslation(0, 0, -i * GAP); frames.setMatrixAt(i, m4); }
  scene.add(frames);
  const zEnd = -(N - 1) * GAP;

  /* ---------- az utolsó keret kétszárnyú ajtó: sötét tábla, rajta a fém felirat. A betűk szárnyanként vannak szétosztva,
     így nyitáskor a felirat a két szárnnyal együtt fordul el, a vágás betűk között fut. */
  const wText = await (await fetch(new URL('../img/logo-word.svg?v=3', import.meta.url).href)).text();
  const wShapes = shapesFrom(wText);
  const XO = { depth: 30, bevelEnabled: true, bevelThickness: 4, bevelSize: 2.5, bevelSegments: 2, curveSegments: 6 };
  const allGeo = new THREE.ExtrudeGeometry(wShapes, XO); allGeo.computeBoundingBox();
  const wb = allGeo.boundingBox, wk = 1.572 / (wb.max.x - wb.min.x), wcx = (wb.min.x + wb.max.x) / 2, wcy = (wb.min.y + wb.max.y) / 2;
  allGeo.dispose();
  const halves = [[], []];
  wShapes.forEach((sh) => { const pts = sh.getPoints(4); let mn = 1e9, mx = -1e9; pts.forEach((q) => { mn = Math.min(mn, q.x); mx = Math.max(mx, q.x); }); halves[(mn + mx) / 2 < wcx ? 0 : 1].push(sh); });
  const wordMat = new THREE.MeshStandardMaterial({ color: 0xeec46c, metalness: 1, roughness: 0.18, envMapIntensity: 1.7 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0x1b1a19, metalness: .35, roughness: .55, envMapIntensity: .5 });
  const HW = 0.97, leaves = [];
  [-1, 1].forEach((sd, k) => {
    const g = new THREE.ExtrudeGeometry(halves[k], XO); g.computeBoundingBox();
    g.translate(-wcx, -wcy, -g.boundingBox.max.z); g.scale(wk, -wk, wk);
    const pivot = new THREE.Group(); pivot.position.set(sd * HW, 0, zEnd);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(HW - .004, 1.94, .04), plateMat);
    plate.position.set(-sd * HW / 2 - sd * .002, 0, -.08);
    const w = new THREE.Mesh(g, wordMat); w.position.set(-sd * HW, .012, .012);
    pivot.add(plate, w); scene.add(pivot); leaves.push({ pivot, sd });
  });

  /* ---------- az ajtó mögött a pince: a bár saját boltíves fotója, és meleg fény, ami nyitáskor kiárad */
  const photoMat = new THREE.MeshBasicMaterial({ color: 0xffffff, fog: false, transparent: true, opacity: 0,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.EqualStencilFunc, stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: THREE.KeepStencilOp });
  // a fotó csak az ajtónyíláson át látszik: a nyílás a stencilbe ír, a fotó csak ott rajzolódik
  const hole = new THREE.Mesh(new THREE.PlaneGeometry(1.96, 1.96), new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false,
    stencilWrite: true, stencilRef: 1, stencilFunc: THREE.AlwaysStencilFunc, stencilZPass: THREE.ReplaceStencilOp }));
  hole.position.set(0, 0, zEnd - .02); hole.renderOrder = -1; scene.add(hole);
  const photo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat);
  const zPhoto = zEnd - 2.6; let HP = 3.0, tAsp = 1.6;
  photo.position.set(0, 0, zPhoto); photo.scale.set(HP * tAsp, HP, 1); scene.add(photo);
  new THREE.TextureLoader().load(new URL(S.dpr > 1.6 || innerWidth < 900 ? '../img/boltiv-1600.webp?v=2' : '../img/boltiv-2400.webp?v=2', import.meta.url).href, (t) => {
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); tAsp = t.image.width / t.image.height;
    photoMat.map = t; photoMat.needsUpdate = true; fitPhoto();
  });
  const spill = new THREE.PointLight(0xffb36b, 0, 6, 1.6); spill.position.set(0, .2, zEnd - .6); scene.add(spill);
  // a belépés végén a fotó kitölti a képet: ennyire kell közel menni (a látott rész a fotó 80%-a)
  // a belépés vége: az ajtónyílás épp kitölti a képet. A fotó akkora, hogy útközben sehol ne látszódjon a széle a nyílásban.
  let dF = 2;
  const zFinal = () => zEnd + dF;
  function fitPhoto() {
    const tv = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)), th = tv * cam.aspect, gap = zEnd - zPhoto, dS = stopAt() - zEnd;
    dF = .98 / Math.max(tv, th) * .84;
    let nh = 0, nw = 0;
    for (let i = 0; i <= 24; i++) { const d = dF + (dS - dF) * i / 24, D = d + gap; nh = Math.max(nh, 2 * D * Math.min(tv, .98 / d)); nw = Math.max(nw, 2 * D * Math.min(th, .98 / d)); }
    HP = Math.max(nh, nw / tAsp) * 1.04; photo.scale.set(HP * tAsp, HP, 1);
  }
  /* ---------- háttér: a pince meleg sötétje, alul a pult vörös fénye, fent a téglaboltív homálya */
  const bgMat = new THREE.ShaderMaterial({
    depthWrite: false, fog: false, side: THREE.BackSide,
    uniforms: { uT: { value: 0 } },
    vertexShader: 'varying vec3 vP;void main(){vP=normalize(position);gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
    fragmentShader: 'varying vec3 vP;uniform float uT;' +
      'void main(){float y=vP.y;float fw=clamp(-vP.z,0.,1.);' +
      'vec3 c=mix(vec3(.075,.035,.025),vec3(.02,.012,.01),smoothstep(-.1,.8,y));' +
      'c+=vec3(.42,.06,.03)*pow(smoothstep(.15,-.75,y),1.6)*(.55+.45*fw)*(.92+.08*sin(uT*.7));' +
      'c+=vec3(.38,.2,.09)*.35*exp(-pow(length(vP.xy)*2.2,2.))*fw;' +
      'gl_FragColor=vec4(c,1.);}'
  });
  const bg = new THREE.Mesh(new THREE.SphereGeometry(30, 32, 16), bgMat);
  scene.add(bg);

  /* ---------- életlen fények a háttérben, mint a palackokban égő fényfüzér egy fotón: kevés, puha korong */
  const NB = 64, bp = new Float32Array(NB * 3), bs = new Float32Array(NB);
  for (let i = 0; i < NB; i++) {
    const a = Math.random() * Math.PI * 2, r = 1.7 + Math.random() * 1.6;
    bp[i * 3] = Math.cos(a) * r * 1.2; bp[i * 3 + 1] = Math.sin(a) * r * .8 - .2; bp[i * 3 + 2] = 1 - Math.random() * (N * GAP + 3); bs[i] = Math.random();
  }
  const bGeo = new THREE.BufferGeometry(); bGeo.setAttribute('position', new THREE.BufferAttribute(bp, 3)); bGeo.setAttribute('seed', new THREE.BufferAttribute(bs, 1));
  const bMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPx: { value: 1 } },
    vertexShader: 'attribute float seed;uniform float uT,uPx;varying float vS;varying float vA;void main(){vec3 p=position;p.y+=sin(uT*.15+seed*30.)*.05;vec4 mv=modelViewMatrix*vec4(p,1.);vS=seed;float d=-mv.z;vA=smoothstep(.4,1.6,d)*smoothstep(14.,6.,d)*(.55+.45*sin(uT*(.4+seed)+seed*20.));gl_PointSize=uPx*(26.+40.*seed)*(2.2/d);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying float vS;varying float vA;void main(){float r=length(gl_PointCoord-.5)*2.;float disc=smoothstep(1.,.82,r);float rim=smoothstep(.7,.95,r)*disc*.35;vec3 col=mix(vec3(1.,.62,.3),vec3(1.,.28,.16),step(.72,vS));gl_FragColor=vec4(col*(disc*.22+rim)*vA*.5,1.);}'
  });
  scene.add(new THREE.Points(bGeo, bMat));

  /* ---------- por a fényben: kevés, apró, lassan száll, meleg színű */
  const ND = 160, dp = new Float32Array(ND * 3), ds = new Float32Array(ND);
  for (let i = 0; i < ND; i++) { dp[i * 3] = (Math.random() - .5) * 2.2; dp[i * 3 + 1] = (Math.random() - .5) * 2; dp[i * 3 + 2] = 2 - Math.random() * (N * GAP + 1); ds[i] = Math.random(); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dGeo.setAttribute('seed', new THREE.BufferAttribute(ds, 1));
  const dMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPx: { value: 1 }, uCam: { value: new THREE.Vector3() } },
    vertexShader: 'attribute float seed;uniform float uT,uPx;uniform vec3 uCam;varying float vA;void main(){vec3 p=position;p.y+=sin(uT*.12+seed*40.)*.08+fract(uT*.006+seed)*.3;p.x+=sin(uT*.09+seed*17.)*.06;vec4 mv=modelViewMatrix*vec4(p,1.);float dl=length(p-uCam-vec3(0.,0.,-1.2));vA=smoothstep(1.8,.3,dl)*(.35+.65*seed);gl_PointSize=uPx*(1.2+1.6*seed)*(3./-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r);gl_FragColor=vec4(vec3(1.,.72,.42)*a*vA*.4,1.);}'
  });
  scene.add(new THREE.Points(dGeo, dMat));

  /* ---------- méret */
  function size() {
    const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
    const dpr = Math.min(devicePixelRatio || 1, S.dpr || 1.5);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    cam.aspect = w / h;
    // keskeny képernyőn a keret férjen el szélességben is
    cam.fov = w / h < 1 ? 2 * THREE.MathUtils.radToDeg(Math.atan(Math.tan(THREE.MathUtils.degToRad(20)) / (w / h) * .9)) : 40;
    cam.updateProjectionMatrix(); fitPhoto(); dMat.uniforms.uPx.value = dpr * h / 900; bMat.uniforms.uPx.value = dpr * h / 900;
  }
  new ResizeObserver(size).observe(canvas); size();

  /* ---------- kamera útja: keretről keretre, megáll a logós ajtó előtt, az ajtó kinyílik, és belépünk a pincébe */
  const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
  const t0 = performance.now(); let mxs = 0, mys = 0;
  const start = 2.4;
  function stopAt() { return zEnd + (cam.aspect < 1 ? 1.25 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / Math.min(1, cam.aspect) * 1.08 : 1.18 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))); }

  const sm = (a, b, t) => { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x * x * (3 - 2 * x); };
  function frame() {
    const p = S.p, tm = (performance.now() - t0) / 1000;
    // 0–.66: végigrepülünk a kereteken, és megállunk a logó előtt; .62–.84: kinyílik az ajtó; .8–1: belépünk a pincébe
    const q = Math.min(1, p / .66), zStop = stopAt();
    let z = start + (zStop - start) * (1 - Math.pow(1 - q, 1.8));
    const open = sm(.62, .84, p), enter = sm(.8, 1, p);
    z += (Math.min(zFinal(), zStop) - zStop) * enter;
    mxs += ((S.mx || 0) - mxs) * .05; mys += ((S.my || 0) - mys) * .05;
    const settle = ease((p - .5) / .16);
    const sway = (1 - settle) * .05, mouse = 1 - enter;
    cam.position.set(Math.sin(p * 9.4) * sway + mxs * .12 * mouse, Math.sin(p * 6.1 + 1) * sway * .6 - mys * .08 * mouse, z);
    cam.lookAt(mxs * .05 * mouse, -mys * .03 * mouse, z - 3);
    cam.rotation.z = (1 - settle) * Math.sin(p * 5.3) * .025;
    leaves.forEach((l) => { l.pivot.rotation.y = -l.sd * open * 1.95; });
    photoMat.opacity = sm(.6, .68, p);
    spill.intensity = open * 14 * (1 - enter * .7);
    lamp.position.set(.3, .45, z - 1.1);
    lamp.intensity = (16 + settle * 6) * (1 - enter);
    dMat.uniforms.uT.value = tm; dMat.uniforms.uCam.value.copy(cam.position); bMat.uniforms.uT.value = tm; bgMat.uniforms.uT.value = tm; bg.position.copy(cam.position);
    renderer.render(scene, cam);
  }
  S.frame = frame;
  return S;
}
