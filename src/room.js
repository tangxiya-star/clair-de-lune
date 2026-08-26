import * as THREE from "three";

const ROOM = 0x1a1410;
const LIGHT = 0xffc978;
const NEUTRAL = new THREE.Color(0xffffff);
const WARM = new THREE.Color(0xffb488);
const INK = 0x2b2118;
const GOLD = 0xd18800;

const RADIUS = 1.06;
const WALL_Z = -7.4;
const THROW_WIDTH = 11;
const IDLE_BEFORE_SPIN = 1200;

// A unit plane that fades to black at its rim. Under additive blending black
// contributes nothing, so the throw has soft edges without a second pass and
// without touching the tiling the rotation depends on.
function feathered(segX, segY) {
  const geo = new THREE.PlaneGeometry(1, 1, segX, segY);
  const pos = geo.attributes.position;
  const colors = new Float32Array(pos.count * 3);

  for (let i = 0; i < pos.count; i += 1) {
    const u = Math.abs(pos.getX(i)) * 2;
    const v = Math.abs(pos.getY(i)) * 2;
    const fx = 1 - THREE.MathUtils.smoothstep(u, 0.42, 1);
    const fy = 1 - THREE.MathUtils.smoothstep(v, 0.3, 1);
    const f = fx * fy;
    colors[i * 3] = f;
    colors[i * 3 + 1] = f;
    colors[i * 3 + 2] = f;
  }

  geo.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  return geo;
}

export function createRoom(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(ROOM, 1);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(ROOM, 8, 18);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 60);
  camera.position.set(0, 0.35, 6.4);

  // --- back wall -----------------------------------------------------------
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(46, 28),
    new THREE.MeshStandardMaterial({ color: 0x1d150f, roughness: 0.98, metalness: 0 })
  );
  wall.position.z = WALL_Z;
  scene.add(wall);

  // The throw. A stretched copy of the cut, additively blended and parallaxed
  // against the pointer. Cheaper and warmer than a shadow map.
  const throwMat = new THREE.MeshBasicMaterial({
    color: LIGHT,
    transparent: true,
    opacity: 0.5,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexColors: true,
  });
  const projection = new THREE.Mesh(feathered(48, 24), throwMat);
  projection.position.z = WALL_Z + 0.06;
  projection.visible = false;
  scene.add(projection);

  // --- lantern -------------------------------------------------------------
  const lantern = new THREE.Group();
  lantern.position.y = 0.4;
  scene.add(lantern);

  const shellGeo = new THREE.CylinderGeometry(RADIUS, RADIUS, 2.2, 128, 1, true);

  // Flat vermillion straight from the band texture, alpha-tested so the cut
  // edges stay crisp like paper and depth sorting stays honest.
  const shellMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    side: THREE.DoubleSide,
    alphaTest: 0.5,
    transparent: false,
  });
  const shell = new THREE.Mesh(shellGeo, shellMat);
  lantern.add(shell);

  // Seen through the holes: a lit interior wall. The bulb slides across it, so
  // the hot spot travels behind the cut.
  const coreMat = new THREE.MeshStandardMaterial({
    color: 0xc98a4e,
    side: THREE.BackSide,
    roughness: 1,
    metalness: 0,
    emissive: 0x1a0c04,
  });
  const core = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS * 0.93, RADIUS * 0.93, 2.18, 64, 1, true),
    coreMat
  );
  lantern.add(core);

  const capMat = new THREE.MeshStandardMaterial({ color: 0x1a0f08, roughness: 1 });
  for (const sign of [1, -1]) {
    const cap = new THREE.Mesh(new THREE.CircleGeometry(RADIUS * 0.93, 64), capMat);
    cap.rotation.x = (sign * Math.PI) / 2;
    cap.position.y = sign * 1.09;
    lantern.add(cap);
  }

  const ringMat = new THREE.MeshStandardMaterial({
    color: INK,
    metalness: 0.72,
    roughness: 0.34,
    emissive: GOLD,
    emissiveIntensity: 0.07,
  });
  const rings = [];
  for (const sign of [1, -1]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(RADIUS + 0.035, 0.05, 14, 128), ringMat);
    ring.rotation.x = Math.PI / 2;
    ring.position.y = sign * 1.1;
    lantern.add(ring);
    rings.push(ring);
  }

  const cord = new THREE.Mesh(
    new THREE.CylinderGeometry(0.011, 0.011, 6, 8),
    new THREE.MeshStandardMaterial({ color: INK, roughness: 0.7 })
  );
  cord.position.y = 4.1;
  scene.add(cord);

  const tassel = new THREE.Group();
  tassel.position.y = -1.22;
  lantern.add(tassel);
  tassel.add(
    new THREE.Mesh(
      new THREE.SphereGeometry(0.04, 12, 10),
      new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.7, roughness: 0.3 })
    )
  );
  for (let i = 0; i < 3; i++) {
    const strand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.007, 0.003, 0.38, 6),
      new THREE.MeshStandardMaterial({ color: 0xc41e3a, roughness: 0.8 })
    );
    strand.position.set((i - 1) * 0.035, -0.26, 0);
    tassel.add(strand);
  }

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(14, 64),
    new THREE.MeshStandardMaterial({ color: 0x120e0b, roughness: 1, metalness: 0 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.15;
  scene.add(floor);

  // --- the lamp ------------------------------------------------------------
  // Tight decay so there is a real hot spot to chase instead of a flat wash.
  const bulb = new THREE.PointLight(LIGHT, 5.5, 9, 2);
  scene.add(bulb);

  const filament = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 20, 16),
    new THREE.MeshBasicMaterial({ color: 0xfff0d6 })
  );
  scene.add(filament);

  scene.add(new THREE.AmbientLight(0x3a2718, 0.35));
  const fill = new THREE.DirectionalLight(0x6d5238, 0.3);
  fill.position.set(-2, 3, 4);
  scene.add(fill);

  // --- state ---------------------------------------------------------------
  const pointer = new THREE.Vector2(0, 0);
  const smooth = new THREE.Vector2(0, 0);
  let lastMove = -Infinity;
  let spin = 0;
  let spinRate = 0;
  let aspect = 3;
  let hasBand = false;

  function resize() {
    const w = canvas.clientWidth || window.innerWidth;
    const h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Pull the camera back on narrow screens so the lantern always fits.
    camera.position.z = camera.aspect < 0.85 ? 8.6 : 6.4;
    camera.updateProjectionMatrix();
  }

  function setBand({ paperTex, lightTex, aspect: bandAspect }) {
    aspect = bandAspect;

    const height = (2 * Math.PI * RADIUS) / aspect;
    const clamped = THREE.MathUtils.clamp(height, 1.5, 3.1);
    lantern.scale.set(1, clamped / 2.2, 1);
    for (const ring of rings) ring.scale.set(1, 1, 2.2 / clamped);

    shellMat.map?.dispose();
    shellMat.map = paperTex;
    shellMat.needsUpdate = true;

    throwMat.map?.dispose();
    throwMat.map = lightTex;
    throwMat.needsUpdate = true;

    projection.scale.set(THROW_WIDTH, (THROW_WIDTH / aspect) * 1.5, 1);
    projection.visible = true;
    hasBand = true;
  }

  function movePointer(nx, ny) {
    pointer.set(THREE.MathUtils.clamp(nx, -1, 1), THREE.MathUtils.clamp(ny, -1, 1));
    lastMove = performance.now();
  }

  const clock = new THREE.Clock();

  function frame() {
    const dt = Math.min(clock.getDelta(), 0.05);
    const now = performance.now();

    smooth.lerp(pointer, 1 - Math.pow(0.0016, dt));

    // The pointer is the lamp: it lives inside the shade.
    const lx = smooth.x * RADIUS * 0.62;
    const ly = lantern.position.y + smooth.y * 0.66;
    const lz = 0.24;
    bulb.position.set(lx, ly, lz);
    filament.position.copy(bulb.position);

    // Hold still while the hand is working, drift when it is not.
    const idle = now - lastMove > IDLE_BEFORE_SPIN;
    spinRate = THREE.MathUtils.lerp(spinRate, idle ? 0.1 : 0, 1 - Math.pow(0.1, dt));
    spin += spinRate * dt;
    lantern.rotation.y = spin;

    if (hasBand) {
      // Light on the left throws the pattern to the right.
      projection.position.x = -smooth.x * 3.4;
      projection.position.y = lantern.position.y - smooth.y * 2.2;
      projection.scale.x = THROW_WIDTH * (1 + Math.abs(smooth.x) * 0.08);
      throwMat.opacity = 0.5 + (1 - Math.abs(smooth.x)) * 0.22;

      const tex = throwMat.map;
      if (tex) {
        // Only the half of the band facing the wall casts, and it slides as
        // the lantern turns.
        tex.repeat.x = 0.58;
        tex.offset.x = -spin / (Math.PI * 2) - smooth.x * 0.05 + 0.21;
      }

      // The paper picks up the lamp as it comes round to face you.
      shellMat.color.lerpColors(NEUTRAL, WARM, 0.1 + (1 - Math.abs(smooth.x)) * 0.28);
    }

    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  requestAnimationFrame(frame);

  return { setBand, movePointer };
}
