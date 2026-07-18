import * as THREE from "../../vendor/three.module.min.js";

const textureCache = new Map();
const materialCache = new Map();
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const hash2 = (x, y, seed = 0) => {
  let n = Math.imul(x + seed * 17, 374761393) ^ Math.imul(y - seed * 31, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  return ((Math.imul(n, 1274126177) ^ (n >>> 16)) >>> 0) / 4294967295;
};

export const ZONE_ART = Object.freeze({
  willowVale: Object.freeze({
    floor: { grass: "vale-grass", stone: "vale-stone", crypt: "crypt-floor" },
    walls: { 1: "vale-stone", 2: "oak-door", 3: "vale-hedge", 4: "crypt-wall", 5: "throne-wall" },
    sky: 0x60758a, fog: 0x59675a, fogDensity: .021, hemiSky: 0xacc7d4, hemiGround: 0x263023,
    sun: 0xffd7a0, sunIntensity: 2.05, ambient: .17, propSet: "vale",
  }),
  silverPass: Object.freeze({
    floor: { grass: "pass-slate", stone: "pass-road", crypt: "crypt-floor" },
    walls: { 1: "pass-wall", 2: "oak-door", 3: "vale-hedge", 4: "crypt-wall", 5: "void-crystal" },
    sky: 0x43586f, fog: 0x586067, fogDensity: .028, hemiSky: 0x91aac2, hemiGround: 0x2c302d,
    sun: 0xd4d8db, sunIntensity: 1.72, ambient: .14, propSet: "pass",
  }),
  echoCrypt: Object.freeze({
    floor: { grass: "crypt-floor", stone: "crypt-floor", crypt: "crypt-floor" },
    walls: { 1: "crypt-wall", 2: "oak-door", 3: "crypt-wall", 4: "crypt-wall", 5: "throne-wall" },
    sky: 0x09090d, fog: 0x17161d, fogDensity: .092, hemiSky: 0x2b3142, hemiGround: 0x111012,
    sun: 0x6e7c95, sunIntensity: .06, ambient: .30, propSet: "crypt",
  }),
  silverhaven: Object.freeze({
    floor: { grass: "harbor-cobble", stone: "harbor-cobble", crypt: "crypt-floor" },
    walls: { 1: "harbor-plaster", 2: "oak-door", 3: "harbor-timber", 4: "pass-wall", 5: "royal-banner" },
    sky: 0x536a80, fog: 0x647079, fogDensity: .020, hemiSky: 0xb0cad7, hemiGround: 0x34372e,
    sun: 0xffd4a0, sunIntensity: 2.18, ambient: .18, propSet: "harbor",
  }),
  ashenMarch: Object.freeze({
    floor: { grass: "ash-ground", stone: "ash-rock", crypt: "crypt-floor" },
    walls: { 1: "ash-rock", 2: "burnt-wood", 3: "burnt-wood", 4: "crypt-wall", 5: "void-crystal" },
    sky: 0x514a49, fog: 0x574d48, fogDensity: .037, hemiSky: 0x9f8b7b, hemiGround: 0x251f1b,
    sun: 0xd88d60, sunIntensity: 1.55, ambient: .13, propSet: "ash",
  }),
  drownedAbbey: Object.freeze({
    floor: { grass: "abbey-floor", stone: "abbey-floor", crypt: "abbey-floor" },
    walls: { 1: "abbey-wall", 2: "oak-door", 3: "abbey-wall", 4: "abbey-wall", 5: "glass-crystal" },
    sky: 0x0c171b, fog: 0x1b3338, fogDensity: .080, hemiSky: 0x537b80, hemiGround: 0x101b1c,
    sun: 0x7fb8bd, sunIntensity: .11, ambient: .35, propSet: "abbey",
  }),
  glasswood: Object.freeze({
    floor: { grass: "glass-soil", stone: "glass-crystal", crypt: "crypt-floor" },
    walls: { 1: "glass-bark", 2: "oak-door", 3: "glass-bark", 4: "crypt-wall", 5: "glass-crystal" },
    sky: 0x314f5a, fog: 0x3f6469, fogDensity: .030, hemiSky: 0x8bc7ca, hemiGround: 0x1a2b2d,
    sun: 0xc3f0e9, sunIntensity: 1.52, ambient: .23, propSet: "glasswood",
  }),
  obsidianArchive: Object.freeze({
    floor: { grass: "archive-floor", stone: "archive-floor", crypt: "archive-floor" },
    walls: { 1: "archive-wall", 2: "oak-door", 3: "book-leather", 4: "archive-wall", 5: "void-crystal" },
    sky: 0x08070b, fog: 0x15111a, fogDensity: .088, hemiSky: 0x372d48, hemiGround: 0x0b090d,
    sun: 0x8e68b0, sunIntensity: .07, ambient: .31, propSet: "archive",
  }),
  crownCitadel: Object.freeze({
    floor: { grass: "citadel-floor", stone: "citadel-floor", crypt: "crypt-floor" },
    walls: { 1: "citadel-wall", 2: "oak-door", 3: "citadel-wall", 4: "citadel-wall", 5: "royal-banner" },
    sky: 0x3a344d, fog: 0x564b60, fogDensity: .029, hemiSky: 0x9d91b8, hemiGround: 0x2a252d,
    sun: 0xd8c3de, sunIntensity: 1.72, ambient: .17, propSet: "citadel",
  }),
  hollowThrone: Object.freeze({
    floor: { grass: "throne-floor", stone: "throne-floor", crypt: "throne-floor" },
    walls: { 1: "throne-wall", 2: "oak-door", 3: "throne-wall", 4: "throne-wall", 5: "void-crystal" },
    sky: 0x07050b, fog: 0x130d1b, fogDensity: .105, hemiSky: 0x422858, hemiGround: 0x09060c,
    sun: 0x9d62c7, sunIntensity: .05, ambient: .34, propSet: "throne",
  }),
});

const defaultArt = Object.freeze({
  floor: { grass: "vale-grass", stone: "vale-stone", crypt: "crypt-floor" },
  walls: { 1: "pass-wall", 2: "oak-door", 3: "vale-hedge", 4: "crypt-wall", 5: "void-crystal" },
  sky: 0x4a5868, fog: 0x58605c, fogDensity: .028, hemiSky: 0x9bb7c7, hemiGround: 0x293128,
  sun: 0xffd8aa, sunIntensity: 1.8, ambient: .16, propSet: "vale",
});

export function getZoneArt(zoneId) {
  return ZONE_ART[zoneId] || defaultArt;
}

function loadMap(key, suffix, colorSpace = null) {
  const cacheKey = `${key}:${suffix}`;
  if (textureCache.has(cacheKey)) return textureCache.get(cacheKey);
  const url = new URL(`../../assets/textures/world/${key}-${suffix}.png`, import.meta.url).href;
  const texture = new THREE.TextureLoader().load(url);
  if (colorSpace) texture.colorSpace = colorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.anisotropy = 2;
  textureCache.set(cacheKey, texture);
  return texture;
}

export function pbrMaterial(key, options = {}) {
  const repeatX = options.repeatX || 1;
  const repeatY = options.repeatY || 1;
  const cacheKey = `${key}:${repeatX}:${repeatY}:${options.color || 0xffffff}:${options.transparent ? 1 : 0}`;
  if (materialCache.has(cacheKey)) return materialCache.get(cacheKey);
  const diffuse = loadMap(key, "d", THREE.SRGBColorSpace).clone();
  const normal = loadMap(key, "n").clone();
  const roughness = loadMap(key, "r").clone();
  for (const map of [diffuse, normal, roughness]) {
    map.repeat.set(repeatX, repeatY);
    map.needsUpdate = true;
  }
  const material = new THREE.MeshStandardMaterial({
    map: diffuse,
    normalMap: normal,
    roughnessMap: roughness,
    color: options.color || 0xffffff,
    roughness: options.roughness ?? 1,
    metalness: options.metalness ?? 0,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity || 0,
    side: options.side || THREE.FrontSide,
    flatShading: options.flatShading ?? false,
  });
  materialCache.set(cacheKey, material);
  return material;
}

export function createFloorMaterials(zoneId) {
  const art = getZoneArt(zoneId);
  return Object.fromEntries(Object.entries(art.floor).map(([kind, key]) => [kind, pbrMaterial(key, { repeatX: 1.45, repeatY: 1.45 })]));
}

export function createWallMaterials(zoneId) {
  const art = getZoneArt(zoneId);
  return Object.fromEntries(Object.entries(art.walls).map(([tile, key]) => [Number(tile), pbrMaterial(key, { repeatX: 1, repeatY: 2.65 })]));
}

function mat(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? .86,
    metalness: options.metalness ?? .02,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity || 0,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    flatShading: true,
    side: options.side || THREE.FrontSide,
  });
}

function part(group, geometry, material, pos, scale = [1, 1, 1], rot = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(...pos); mesh.scale.set(...scale); mesh.rotation.set(...rot);
  mesh.castShadow = true; mesh.receiveShadow = true;
  group.add(mesh); return mesh;
}

function edge(root, color = 0x111013) {
  root.traverse((child) => {
    if (!child.isMesh || child.geometry.type === "PlaneGeometry") return;
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 32), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .34 }));
    lines.scale.setScalar(1.005); child.add(lines);
  });
  return root;
}

function boulder(seed = 0, tint = 0x555650) {
  const group = new THREE.Group();
  const rock = mat(tint, { roughness: .98 });
  const count = 1 + (seed % 3);
  for (let i = 0; i < count; i += 1) {
    const mesh = part(group, new THREE.DodecahedronGeometry(.18 + hash2(seed, i, 7) * .24, 0), rock, [(i - (count - 1) / 2) * .22, .13, hash2(i, seed, 5) * .15], [1, .55 + hash2(i, seed, 2) * .7, 1]);
    mesh.rotation.set(hash2(i, 2, seed) * 2, hash2(i, 3, seed) * 5, hash2(i, 4, seed));
  }
  return group;
}

function tree(kind = "oak", seed = 0) {
  const group = new THREE.Group();
  const trunkKey = kind === "glass" ? "glass-bark" : kind === "dead" ? "burnt-wood" : "harbor-timber";
  const trunk = pbrMaterial(trunkKey, { repeatY: 2.5 });
  const leafColors = kind === "willow" ? [0x354d31, 0x48653c] : kind === "pine" ? [0x24392d, 0x304a37] : [0x304932, 0x42603d];
  part(group, new THREE.CylinderGeometry(.1, .17, 1.7, 7), trunk, [0, .85, 0]);
  if (kind === "dead") {
    for (const side of [-1, 1]) {
      part(group, new THREE.CylinderGeometry(.035, .07, .95, 6), trunk, [side * .28, 1.45, 0], [1, 1, 1], [0, 0, side * .72]);
      part(group, new THREE.CylinderGeometry(.02, .04, .55, 5), trunk, [side * .53, 1.75, 0], [1, 1, 1], [0, 0, side * .35]);
    }
  } else if (kind === "pine") {
    const leaves = mat(leafColors[seed % 2], { roughness: .96 });
    part(group, new THREE.ConeGeometry(.72, 1.45, 9), leaves, [0, 1.35, 0]);
    part(group, new THREE.ConeGeometry(.58, 1.25, 9), leaves, [0, 2.05, 0]);
    part(group, new THREE.ConeGeometry(.4, .95, 9), leaves, [0, 2.62, 0]);
  } else if (kind === "glass") {
    const crystal = pbrMaterial("glass-crystal", { emissive: 0x123a45, emissiveIntensity: .42 });
    for (let i = 0; i < 8; i += 1) {
      const a = i / 8 * Math.PI * 2;
      const branch = part(group, new THREE.ConeGeometry(.12, 1.15, 5), crystal, [Math.cos(a) * .35, 1.65 + (i % 3) * .22, Math.sin(a) * .35], [1, 1, 1], [Math.sin(a) * .7, 0, -Math.cos(a) * .7]);
      branch.userData.artMotion = "crystal";
    }
    const crown = part(group, new THREE.OctahedronGeometry(.52, 0), crystal, [0, 2.32, 0]);
    crown.userData.artMotion = "crystal";
  } else {
    const leaves = mat(leafColors[seed % 2], { roughness: .97 });
    for (let i = 0; i < 7; i += 1) {
      const a = i / 7 * Math.PI * 2;
      part(group, new THREE.IcosahedronGeometry(.46 + hash2(i, seed, 9) * .16, 1), leaves, [Math.cos(a) * .47, 1.75 + (i % 2) * .28, Math.sin(a) * .47], [1, .85, 1]);
    }
    if (kind === "willow") {
      const frond = mat(0x405c38, { transparent: true, opacity: .82, side: THREE.DoubleSide });
      for (let i = 0; i < 12; i += 1) {
        const a = i / 12 * Math.PI * 2;
        const plane = part(group, new THREE.PlaneGeometry(.18, 1.25, 1, 3), frond, [Math.cos(a) * .68, 1.45, Math.sin(a) * .68], [1, 1, 1], [0, a, 0]);
        plane.userData.artMotion = "frond";
        plane.userData.phase = i;
      }
    }
  }
  group.scale.setScalar(.84 + hash2(seed, 4, 5) * .28);
  return group;
}

function timberHouse(seed = 0) {
  const g = new THREE.Group();
  const plaster = pbrMaterial("harbor-plaster", { repeatX: 1.8, repeatY: 1.4 });
  const timber = pbrMaterial("harbor-timber", { repeatY: 2 });
  const roof = pbrMaterial("roof-slate", { repeatX: 2.2, repeatY: 1.5 });
  const glow = mat(0xc98c46, { emissive: 0x6b330f, emissiveIntensity: 1.25, roughness: .4 });
  const w = 2.6 + (seed % 3) * .35;
  part(g, new THREE.BoxGeometry(w, 2.35, 2), plaster, [0, 1.18, 0]);
  part(g, new THREE.ConeGeometry(2.05, 1.45, 4), roof, [0, 3.0, 0], [1, 1, .72], [0, Math.PI / 4, 0]);
  for (const x of [-w / 2 + .12, 0, w / 2 - .12]) part(g, new THREE.BoxGeometry(.13, 2.45, 2.06), timber, [x, 1.22, 0]);
  for (const y of [.35, 1.25, 2.2]) part(g, new THREE.BoxGeometry(w + .05, .12, 2.06), timber, [0, y, 0]);
  part(g, new THREE.BoxGeometry(.72, 1.25, .12), timber, [0, .63, -1.05]);
  for (const x of [-.82, .82]) part(g, new THREE.BoxGeometry(.46, .56, .08), glow, [x, 1.5, -1.07]);
  return edge(g);
}

function watchTower() {
  const g = new THREE.Group();
  const stone = pbrMaterial("pass-wall", { repeatX: 1.6, repeatY: 3.5 });
  const timber = pbrMaterial("burnt-wood", { repeatY: 3 });
  part(g, new THREE.CylinderGeometry(1.18, 1.45, 5.8, 10), stone, [0, 2.9, 0]);
  for (let i = 0; i < 10; i += 1) {
    const a = i / 10 * Math.PI * 2;
    part(g, new THREE.BoxGeometry(.45, .55, .45), stone, [Math.cos(a) * 1.08, 6.0, Math.sin(a) * 1.08], [1, 1, 1], [0, -a, 0]);
  }
  part(g, new THREE.BoxGeometry(.85, 1.65, .12), timber, [0, .83, -1.28]);
  return edge(g);
}

function marketStall(seed = 0) {
  const g = new THREE.Group();
  const wood = pbrMaterial("harbor-timber", { repeatY: 2 });
  const cloth = mat(seed % 2 ? 0x6e2634 : 0x2c4d5f, { roughness: .9, side: THREE.DoubleSide });
  part(g, new THREE.BoxGeometry(1.65, .14, .72), wood, [0, .72, 0]);
  for (const x of [-.72, .72]) part(g, new THREE.CylinderGeometry(.035, .05, 1.75, 6), wood, [x, .88, 0]);
  const awning = part(g, new THREE.PlaneGeometry(1.8, 1.05, 4, 1), cloth, [0, 1.66, -.12], [1, 1, 1], [-1.08, 0, 0]);
  awning.userData.artMotion = "banner";
  return g;
}

function dockSegment() {
  const g = new THREE.Group();
  const wood = pbrMaterial("harbor-timber", { repeatX: 2, repeatY: 1 });
  for (let i = -2; i <= 2; i += 1) part(g, new THREE.BoxGeometry(.58, .10, 1.8), wood, [i * .59, .12, 0]);
  for (const x of [-1.2, 1.2]) for (const z of [-.7, .7]) part(g, new THREE.CylinderGeometry(.055, .08, .8, 7), wood, [x, -.22, z]);
  return g;
}

function deadCart() {
  const g = new THREE.Group();
  const wood = pbrMaterial("burnt-wood");
  const iron = pbrMaterial("iron", { metalness: .7 });
  part(g, new THREE.BoxGeometry(1.25, .28, .75), wood, [0, .52, 0], [1, 1, 1], [0, 0, .12]);
  for (const x of [-.55, .55]) {
    part(g, new THREE.TorusGeometry(.33, .055, 6, 14), iron, [x, .3, 0], [1, 1, 1], [0, Math.PI / 2, 0]);
  }
  part(g, new THREE.CylinderGeometry(.04, .06, 1.65, 6), wood, [0, .54, .95], [1, 1, 1], [Math.PI / 2, 0, 0]);
  return edge(g);
}

function abbeyArch() {
  const g = new THREE.Group();
  const stone = pbrMaterial("abbey-wall", { repeatY: 2.4 });
  for (const x of [-.65, .65]) part(g, new THREE.BoxGeometry(.34, 2.3, .5), stone, [x, 1.15, 0]);
  const arch = part(g, new THREE.TorusGeometry(.65, .18, 8, 18, Math.PI), stone, [0, 2.25, 0], [1, 1, 1], [0, 0, Math.PI]);
  arch.rotation.z = Math.PI;
  return edge(g);
}

function sarcophagus() {
  const g = new THREE.Group();
  const stone = pbrMaterial("crypt-wall");
  part(g, new THREE.BoxGeometry(.72, .42, 1.65), stone, [0, .25, 0]);
  part(g, new THREE.BoxGeometry(.64, .18, 1.52), stone, [0, .53, 0]);
  part(g, new THREE.CapsuleGeometry(.18, .55, 4, 7), stone, [0, .7, -.1], [1, 1, 1], [Math.PI / 2, 0, 0]);
  return edge(g);
}

function bookshelf(seed = 0) {
  const g = new THREE.Group();
  const wood = pbrMaterial("burnt-wood", { repeatY: 2 });
  const leather = pbrMaterial("book-leather", { repeatX: 2.8, repeatY: 2 });
  part(g, new THREE.BoxGeometry(1.5, 2.25, .34), wood, [0, 1.12, 0]);
  for (const y of [.32, .83, 1.34, 1.85]) part(g, new THREE.BoxGeometry(1.4, .08, .42), wood, [0, y, -.02]);
  for (let row = 0; row < 4; row += 1) {
    for (let i = 0; i < 8; i += 1) {
      const h = .28 + hash2(seed + row, i, 12) * .12;
      part(g, new THREE.BoxGeometry(.12, h, .23), leather, [-.56 + i * .16, .49 + row * .51, -.23], [1, 1, 1], [0, 0, (hash2(i, row, seed) - .5) * .1]);
    }
  }
  return g;
}

function obsidianColumn() {
  const g = new THREE.Group();
  const dark = pbrMaterial("archive-wall", { repeatY: 3.2, metalness: .18 });
  const crystal = pbrMaterial("void-crystal", { emissive: 0x35134f, emissiveIntensity: .75 });
  part(g, new THREE.CylinderGeometry(.28, .42, 2.65, 6), dark, [0, 1.32, 0]);
  const tip = part(g, new THREE.OctahedronGeometry(.26, 0), crystal, [0, 2.82, 0]);
  tip.userData.artMotion = "crystal";
  return edge(g, 0x050407);
}

function battlement() {
  const g = new THREE.Group();
  const stone = pbrMaterial("citadel-wall", { repeatX: 2.4, repeatY: 2.5 });
  part(g, new THREE.BoxGeometry(3.4, 2.25, 1.25), stone, [0, 1.12, 0]);
  for (let i = -3; i <= 3; i += 1) part(g, new THREE.BoxGeometry(.35, .58, 1.28), stone, [i * .53, 2.52, 0]);
  return edge(g);
}

function banner(seed = 0) {
  const g = new THREE.Group();
  const iron = pbrMaterial("iron", { metalness: .7 });
  const cloth = pbrMaterial("royal-banner", { side: THREE.DoubleSide });
  part(g, new THREE.CylinderGeometry(.03, .045, 2.65, 6), iron, [0, 1.32, 0]);
  const flag = part(g, new THREE.PlaneGeometry(.8, 1.45, 4, 5), cloth, [.42, 1.85, 0], [1, 1, 1], [0, Math.PI / 2, 0]);
  flag.userData.artMotion = "banner"; flag.userData.phase = seed;
  return g;
}

function throne() {
  const g = new THREE.Group();
  const stone = pbrMaterial("throne-wall", { repeatY: 2.6 });
  const crystal = pbrMaterial("void-crystal", { emissive: 0x5b207e, emissiveIntensity: 1.15 });
  part(g, new THREE.BoxGeometry(1.8, .38, 1.35), stone, [0, .19, 0]);
  part(g, new THREE.BoxGeometry(1.35, 2.5, .42), stone, [0, 1.55, .36]);
  part(g, new THREE.BoxGeometry(1.3, .35, 1.1), stone, [0, .73, 0]);
  for (const x of [-.8, .8]) {
    part(g, new THREE.BoxGeometry(.28, 1.35, .38), stone, [x, 1.08, .05]);
    const gem = part(g, new THREE.OctahedronGeometry(.16), crystal, [x, 1.85, .05]); gem.userData.artMotion = "crystal";
  }
  for (let i = -2; i <= 2; i += 1) part(g, new THREE.ConeGeometry(.12, .72 + Math.abs(i) * .12, 5), stone, [i * .24, 3.12, .35]);
  return edge(g, 0x040306);
}

function graveMarker(seed = 0) {
  const g = new THREE.Group();
  const stone = pbrMaterial(seed % 2 ? "crypt-wall" : "vale-stone");
  part(g, new THREE.BoxGeometry(.36, .84, .16), stone, [0, .42, 0]);
  part(g, new THREE.BoxGeometry(.72, .18, .16), stone, [0, .62, 0]);
  return edge(g);
}

function waterPatch(scale = 1.6) {
  const g = new THREE.Group();
  const water = pbrMaterial("abbey-water", { transparent: true, opacity: .58, roughness: .32, metalness: .05, side: THREE.DoubleSide });
  const plane = part(g, new THREE.PlaneGeometry(scale, scale, 8, 8), water, [0, .026, 0], [1, 1, 1], [-Math.PI / 2, 0, 0]);
  plane.userData.artMotion = "water";
  return g;
}

function crystalCluster(seed = 0, purple = false) {
  const g = new THREE.Group();
  const key = purple ? "void-crystal" : "glass-crystal";
  const crystal = pbrMaterial(key, { emissive: purple ? 0x4b176d : 0x123a48, emissiveIntensity: .75 });
  const count = 3 + (seed % 4);
  for (let i = 0; i < count; i += 1) {
    const h = .35 + hash2(seed, i, 4) * .85;
    const mesh = part(g, new THREE.ConeGeometry(.08 + h * .08, h, 5), crystal, [(i - (count - 1) / 2) * .18, h / 2, hash2(i, seed, 8) * .22], [1, 1, 1], [(hash2(i, 2, seed) - .5) * .2, 0, (hash2(i, 3, seed) - .5) * .25]);
    mesh.userData.artMotion = "crystal"; mesh.userData.phase = i + seed;
  }
  return g;
}

function addObject(group, object, x, z, rotation = 0, scale = 1) {
  object.position.set(x, 0, z); object.rotation.y = rotation; object.scale.multiplyScalar(scale); group.add(object); return object;
}

function openAdjacentToWall(world, x, y) {
  if (world.getTile(x, y) !== 0) return false;
  return world.getTile(x + 1, y) !== 0 || world.getTile(x - 1, y) !== 0 || world.getTile(x, y + 1) !== 0 || world.getTile(x, y - 1) !== 0;
}

function scatterProps(world, group, rows, cols, detailLevel, profile) {
  const density = detailLevel > .88 ? 1 : detailLevel > .68 ? .72 : .48;
  const zoneSeed = [...world.zoneId].reduce((a, c) => a + c.charCodeAt(0), 0);
  for (let y = 1; y < rows - 1; y += 1) {
    for (let x = 1; x < cols - 1; x += 1) {
      if (world.getTile(x, y) !== 0) continue;
      const r = hash2(x, y, zoneSeed);
      const edgeTile = openAdjacentToWall(world, x, y);
      let obj = null;
      const seed = Math.floor(r * 9999);
      switch (profile.propSet) {
        case "vale":
          if (r > 1 - .070 * density) obj = tree(r > .97 ? "willow" : "oak", seed);
          else if (r > 1 - .115 * density) obj = boulder(seed, 0x52564d);
          else if (edgeTile && r > 1 - .145 * density) obj = graveMarker(seed);
          break;
        case "pass":
          if (r > 1 - .055 * density) obj = tree("pine", seed);
          else if (r > 1 - .135 * density) obj = boulder(seed, 0x50565b);
          break;
        case "harbor":
          if (edgeTile && r > 1 - .070 * density) obj = seed % 2 ? marketStall(seed) : dockSegment();
          else if (r > 1 - .105 * density) obj = boulder(seed, 0x555650);
          break;
        case "ash":
          if (r > 1 - .065 * density) obj = tree("dead", seed);
          else if (r > 1 - .115 * density) obj = seed % 2 ? deadCart() : boulder(seed, 0x3c3835);
          break;
        case "crypt":
          if (edgeTile && r > 1 - .080 * density) obj = seed % 3 ? sarcophagus() : graveMarker(seed);
          break;
        case "abbey":
          if (edgeTile && r > 1 - .072 * density) obj = seed % 2 ? abbeyArch() : graveMarker(seed);
          else if (r > 1 - .105 * density) obj = waterPatch(1.0 + hash2(seed, 3, 2) * .6);
          break;
        case "glasswood":
          if (r > 1 - .068 * density) obj = tree(seed % 3 ? "glass" : "dead", seed);
          else if (r > 1 - .13 * density) obj = crystalCluster(seed, false);
          break;
        case "archive":
          if (edgeTile && r > 1 - .082 * density) obj = seed % 3 ? bookshelf(seed) : obsidianColumn();
          break;
        case "citadel":
          if (edgeTile && r > 1 - .065 * density) obj = seed % 2 ? banner(seed) : boulder(seed, 0x625d65);
          break;
        case "throne":
          if (edgeTile && r > 1 - .070 * density) obj = seed % 2 ? obsidianColumn() : crystalCluster(seed, true);
          break;
        default: break;
      }
      if (!obj) continue;
      const ox = x + .18 + hash2(seed, 1, 2) * .64;
      const oz = y + .18 + hash2(seed, 2, 3) * .64;
      addObject(group, obj, ox, oz, r * Math.PI * 2, .55 + hash2(seed, 8, 9) * .38);
    }
  }
}

function addLandmarks(world, group, rows, cols, profile) {
  const cx = cols / 2; const cz = rows / 2;
  switch (profile.propSet) {
    case "vale":
      addObject(group, timberHouse(2), -1.4, Math.max(4, cz - 4), .18, 1.0);
      addObject(group, tree("willow", 77), cols + 1.5, Math.max(3, cz - 3), -.3, 1.65);
      break;
    case "pass":
      addObject(group, watchTower(), cols + 2.7, Math.max(4, cz - 4), -.25, .92);
      for (let i = 0; i < 4; i += 1) addObject(group, boulder(80 + i, 0x555b61), -1.5 - i * .45, cz - 3 + i * 2.1, i, 1.7);
      break;
    case "harbor":
      addObject(group, timberHouse(5), -1.3, cz - 5, .2, 1.08);
      addObject(group, timberHouse(6), cols + 1.4, cz - 1, -.2, 1.12);
      addObject(group, watchTower(), cols + 2.3, cz + 7, -.5, .74);
      break;
    case "ash":
      addObject(group, watchTower(), cols + 2.4, cz - 4, -.25, .65);
      addObject(group, deadCart(), -1.2, cz + 3, .4, 1.35);
      break;
    case "glasswood":
      addObject(group, tree("glass", 201), cols + 1.8, cz - 3, .3, 2.1);
      addObject(group, crystalCluster(233, false), -1.2, cz + 3, .5, 2.2);
      break;
    case "citadel":
      addObject(group, battlement(), -1.8, cz - 4, 0, 1.1);
      addObject(group, battlement(), cols + 1.8, cz + 2, Math.PI, 1.1);
      addObject(group, watchTower(), cols + 2.8, cz - 7, -.2, 1.0);
      break;
    case "throne":
      addObject(group, throne(), cx, 1.9, Math.PI, 1.0);
      break;
    default: break;
  }
}

export function buildZoneArt(world, zoneGroup, rows, cols, detailLevel = 1) {
  scatterProps(world, zoneGroup, rows, cols, detailLevel, getZoneArt(world.zoneId));
  addLandmarks(world, zoneGroup, rows, cols, getZoneArt(world.zoneId));
}

export function applyZoneAtmosphere(renderer, world, lights) {
  const profile = getZoneArt(world.zoneId);
  const daylight = clamp(world.daylight ?? 1, .12, 1);
  const dungeon = world.zone.environment === "dungeon";
  const sky = new THREE.Color(profile.sky).multiplyScalar(dungeon ? .62 : .68 + daylight * .42);
  renderer.scene.background = sky;
  renderer.scene.fog = new THREE.FogExp2(profile.fog, profile.fogDensity * (dungeon ? 1 : 1.08 - daylight * .18));
  lights.hemi.color.set(profile.hemiSky);
  lights.hemi.groundColor.set(profile.hemiGround);
  lights.hemi.intensity = dungeon ? .31 : .82 + daylight * .86;
  lights.sun.color.set(daylight < .34 ? 0x8fa9d1 : profile.sun);
  lights.sun.intensity = dungeon ? profile.sunIntensity : profile.sunIntensity * (.45 + daylight * .62);
  lights.ambient.intensity = profile.ambient;
}

export function updateZoneArt(zoneGroup, elapsed) {
  zoneGroup.traverse((child) => {
    const motion = child.userData?.artMotion;
    if (motion === "water") {
      child.position.y = .026 + Math.sin(elapsed * 1.55 + child.id * .01) * .008;
      if (child.material?.map) {
        child.material.map.offset.x = (elapsed * .012) % 1;
        child.material.map.offset.y = (elapsed * .007) % 1;
      }
    } else if (motion === "crystal") {
      const base = child.userData.baseEmissive ?? child.material?.emissiveIntensity ?? .7;
      child.userData.baseEmissive ??= base;
      if (child.material?.emissive) child.material.emissiveIntensity = base * (.82 + Math.sin(elapsed * 2.1 + (child.userData.phase || 0)) * .18);
    } else if (motion === "banner") {
      child.rotation.y = Math.sin(elapsed * 1.7 + (child.userData.phase || 0)) * .035;
    } else if (motion === "frond") {
      child.rotation.z = Math.sin(elapsed * 1.35 + (child.userData.phase || 0)) * .06;
    }
  });
}
