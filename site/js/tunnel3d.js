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
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor(0x0e0c0a, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.45;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x0e0c0a, 0.11);
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

  /* ---------- a felirat az utolsó keretben, előtte matt fekete tábla */
  const wText = await (await fetch(new URL('../img/logo-word.svg?v=3', import.meta.url).href)).text();
  const wShapes = shapesFrom(wText);
  const wGeo = new THREE.ExtrudeGeometry(wShapes, { depth: 30, bevelEnabled: true, bevelThickness: 4, bevelSize: 2.5, bevelSegments: 2, curveSegments: 6 });
  wGeo.computeBoundingBox();
  const wb = wGeo.boundingBox, wk = 1.572 / (wb.max.x - wb.min.x);
  wGeo.translate(-(wb.min.x + wb.max.x) / 2, -(wb.min.y + wb.max.y) / 2, -wb.max.z);
  wGeo.scale(wk, -wk, wk);
  const word = new THREE.Mesh(wGeo, new THREE.MeshStandardMaterial({ color: 0xeec46c, metalness: 1, roughness: 0.18, envMapIntensity: 1.7 }));
  word.position.set(0, 0.012, zEnd + 0.012);
  scene.add(word);
  const back = new THREE.Mesh(new THREE.PlaneGeometry(1.94, 1.94), new THREE.MeshBasicMaterial({ color: 0x1b1a19 }));
  back.position.set(0, 0, zEnd - 0.06); scene.add(back);

  /* ---------- por a fényben: kevés, apró, lassan száll */
  const ND = 420, dp = new Float32Array(ND * 3), ds = new Float32Array(ND);
  for (let i = 0; i < ND; i++) { dp[i * 3] = (Math.random() - .5) * 2.6; dp[i * 3 + 1] = (Math.random() - .5) * 2.4; dp[i * 3 + 2] = 2 - Math.random() * (N * GAP + 1); ds[i] = Math.random(); }
  const dGeo = new THREE.BufferGeometry(); dGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3)); dGeo.setAttribute('seed', new THREE.BufferAttribute(ds, 1));
  const dMat = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uT: { value: 0 }, uPx: { value: 1 }, uCam: { value: new THREE.Vector3() } },
    vertexShader: 'attribute float seed;uniform float uT,uPx;uniform vec3 uCam;varying float vA;void main(){vec3 p=position;p.y+=sin(uT*.12+seed*40.)*.08+fract(uT*.006+seed)*.3;p.x+=sin(uT*.09+seed*17.)*.06;vec4 mv=modelViewMatrix*vec4(p,1.);float dl=length(p-uCam-vec3(0.,0.,-1.2));vA=smoothstep(3.2,.4,dl)*(.35+.65*seed);gl_PointSize=uPx*(1.2+2.2*seed)*(3./-mv.z);gl_Position=projectionMatrix*mv;}',
    fragmentShader: 'varying float vA;void main(){float r=length(gl_PointCoord-.5);float a=smoothstep(.5,0.,r);gl_FragColor=vec4(vec3(1.,.82,.55)*a*vA*.55,1.);}'
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
    cam.updateProjectionMatrix(); dMat.uniforms.uPx.value = dpr * h / 900;
  }
  new ResizeObserver(size).observe(canvas); size();

  /* ---------- kamera útja: keretről keretre, a végén megáll a logó előtt */
  const ease = (t) => t < 0 ? 0 : t > 1 ? 1 : 1 - Math.pow(1 - t, 3);
  const t0 = performance.now(); let mxs = 0, mys = 0;
  const start = 2.4;
  const stopAt = () => zEnd + (cam.aspect < 1 ? 1.25 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)) / Math.min(1, cam.aspect) * 1.08 : 1.18 / Math.tan(THREE.MathUtils.degToRad(cam.fov / 2)));
  function frame() {
    const p = S.p, tm = (performance.now() - t0) / 1000;
    // végig repülünk a kereteken, egyre lassabban, és a logó előtt megállunk
    const q = Math.min(1, Math.max(0, p / .9)), z = start + (stopAt() - start) * (1 - Math.pow(1 - q, 1.8));
    mxs += ((S.mx || 0) - mxs) * .05; mys += ((S.my || 0) - mys) * .05;
    const settle = ease((p - .7) / .3);
    const sway = (1 - settle) * .05;
    cam.position.set(Math.sin(p * 9.4) * sway + mxs * .12, Math.sin(p * 6.1 + 1) * sway * .6 - mys * .08, z);
    cam.lookAt(mxs * .05, -mys * .03, z - 3);
    cam.rotation.z = (1 - settle) * Math.sin(p * 5.3) * .025;
    lamp.position.set(.3, .45, z - 1.1);
    lamp.intensity = 16 + settle * 6;
    dMat.uniforms.uT.value = tm; dMat.uniforms.uCam.value.copy(cam.position);
    renderer.render(scene, cam);
  }
  S.frame = frame;
  return S;
}
