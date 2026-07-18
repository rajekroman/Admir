import * as THREE from "../../vendor/three.module.min.js";
import { getEnemyDefinition } from "../data/enemies.js";
import { applyZoneAtmosphere, buildZoneArt, createFloorMaterials, createWallMaterials, pbrMaterial, updateZoneArt } from "./WorldArtDirector.js";
import { animateCreatureModel, createCreatureModel, createLightweightCreatureModel } from "./CreatureFactory.js";

const WORLD_SCALE = 1;
const EYE_HEIGHT = 1.62;
const WALL_HEIGHT = 2.7;
const textureCache = new Map();

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const hash2 = (x, y, seed = 0) => {
  let n = Math.imul(x + seed * 17, 374761393) ^ Math.imul(y - seed * 31, 668265263);
  n = (n ^ (n >>> 13)) >>> 0;
  return ((Math.imul(n, 1274126177) ^ (n >>> 16)) >>> 0) / 4294967295;
};

function canvasTexture(key, colors, options = {}) {
  if (textureCache.has(key)) return textureCache.get(key);
  const size = options.size || 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(size, size);
  const palette = colors.map((hex) => new THREE.Color(hex));
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const index = (y * size + x) * 4;
      const grain = hash2(x, y, options.seed || 0);
      const coarse = hash2(Math.floor(x / (options.coarse || 12)), Math.floor(y / (options.coarse || 12)), (options.seed || 0) + 4);
      const color = palette[Math.floor(coarse * palette.length) % palette.length].clone();
      const light = (grain - 0.5) * (options.grain || 0.12);
      color.offsetHSL(0, 0, light);
      image.data[index] = Math.round(color.r * 255);
      image.data[index + 1] = Math.round(color.g * 255);
      image.data[index + 2] = Math.round(color.b * 255);
      image.data[index + 3] = 255;
    }
  }
  ctx.putImageData(image, 0, 0);

  if (options.stone) {
    const rowH = Math.max(8, Math.floor(size / 7));
    const brickW = Math.max(14, Math.floor(size / 3));
    ctx.globalAlpha = .72;
    for (let y = 0; y <= size; y += rowH) {
      ctx.fillStyle = "rgba(10,10,9,.72)";
      ctx.fillRect(0, y, size, 2);
      ctx.fillStyle = "rgba(215,207,181,.16)";
      ctx.fillRect(0, y + 2, size, 1);
      const offset = (Math.floor(y / rowH) % 2) * Math.floor(brickW / 2);
      for (let x = offset; x < size; x += brickW) {
        ctx.fillStyle = "rgba(9,9,8,.66)";
        ctx.fillRect(x, y, 2, rowH);
        if ((x + y) % 3 === 0) {
          ctx.fillStyle = "rgba(235,225,194,.12)";
          ctx.fillRect(x + 3, y + 3, Math.max(3, brickW - 7), 1);
        }
      }
    }
    ctx.globalAlpha = 1;
  }
  if (options.wood) {
    const plank = Math.max(8, Math.floor(size / 6));
    ctx.globalAlpha = .55;
    for (let x = 0; x < size; x += plank) {
      ctx.fillStyle = "rgba(21,12,7,.65)";
      ctx.fillRect(x, 0, 2, size);
      ctx.fillStyle = "rgba(220,157,80,.12)";
      ctx.fillRect(x + 2, 0, 1, size);
      for (let y = (x * 3) % 17; y < size; y += 18) {
        ctx.fillStyle = "rgba(28,15,8,.48)";
        ctx.fillRect(x + 4, y, Math.max(2, plank - 6), 1);
      }
    }
    ctx.globalAlpha = 1;
  }
  if (options.grass) {
    ctx.globalAlpha = 0.45;
    for (let i = 0; i < 600; i += 1) {
      const x = hash2(i, 9, 3) * size;
      const y = hash2(i, 17, 8) * size;
      const h = 2 + hash2(i, 21, 2) * 7;
      ctx.strokeStyle = i % 3 === 0 ? "#829253" : "#263a22";
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (i % 2 ? 1 : -1), y - h); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  if (options.runes) {
    ctx.globalAlpha = 0.7;
    ctx.strokeStyle = "#8f70df";
    ctx.shadowColor = "#6d4ed7";
    ctx.shadowBlur = 10;
    ctx.lineWidth = 3;
    for (let y = 26; y < size; y += 58) {
      for (let x = 28; x < size; x += 64) {
        ctx.beginPath();
        ctx.moveTo(x, y + 16); ctx.lineTo(x + 9, y); ctx.lineTo(x + 18, y + 16); ctx.moveTo(x + 4, y + 9); ctx.lineTo(x + 15, y + 9);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 1;
  texture.generateMipmaps = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  textureCache.set(key, texture);
  return texture;
}

function material(key, colors, options = {}) {
  const map = canvasTexture(key, colors, options);
  map.repeat.set(options.repeatX || 1, options.repeatY || 1);
  return new THREE.MeshStandardMaterial({
    map,
    color: options.tint || 0xffffff,
    roughness: options.roughness ?? 0.88,
    metalness: options.metalness ?? 0.02,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity || 0,
    flatShading: true,
  });
}


function fileTexture(key, relativePath, repeatX = 1, repeatY = 1) {
  if (textureCache.has(key)) return textureCache.get(key);
  const texture = new THREE.TextureLoader().load(new URL(`../../assets/textures/professional/${relativePath}`, import.meta.url).href);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeatX, repeatY);
  texture.generateMipmaps = false;
  texture.magFilter = THREE.NearestFilter;
  texture.minFilter = THREE.NearestFilter;
  textureCache.set(key, texture);
  return texture;
}

function fileMaterial(key, relativePath, options = {}) {
  return new THREE.MeshStandardMaterial({
    map: fileTexture(key, relativePath, options.repeatX || 1, options.repeatY || 1),
    color: options.color || 0xffffff,
    roughness: options.roughness ?? .88,
    metalness: options.metalness ?? .02,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity || 0,
    flatShading: options.flatShading ?? true,
  });
}


function createPostProcessMaterial() {
  return new THREE.ShaderMaterial({
    uniforms: {
      tDiffuse: { value: null },
      resolution: { value: new THREE.Vector2(512, 288) },
      time: { value: 0 },
      saturation: { value: 0.94 },
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float time;
      uniform float saturation;
      varying vec2 vUv;

      float bayer4(vec2 frag) {
        vec2 p = mod(floor(frag), 4.0);
        float x = p.x;
        float y = p.y;
        if (y < 1.0) {
          if (x < 1.0) return 0.0;
          if (x < 2.0) return 8.0;
          if (x < 3.0) return 2.0;
          return 10.0;
        }
        if (y < 2.0) {
          if (x < 1.0) return 12.0;
          if (x < 2.0) return 4.0;
          if (x < 3.0) return 14.0;
          return 6.0;
        }
        if (y < 3.0) {
          if (x < 1.0) return 3.0;
          if (x < 2.0) return 11.0;
          if (x < 3.0) return 1.0;
          return 9.0;
        }
        if (x < 1.0) return 15.0;
        if (x < 2.0) return 7.0;
        if (x < 3.0) return 13.0;
        return 5.0;
      }

      void main() {
        vec3 color = texture2D(tDiffuse, vUv).rgb;
        float luma = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luma), color, saturation);
        color = pow(max(color, 0.0), vec3(0.94));
        color = (color - 0.5) * 1.07 + 0.5;
        float threshold = (bayer4(gl_FragCoord.xy) / 16.0 - 0.5) / 15.0;
        color = floor(clamp(color + threshold, 0.0, 1.0) * 15.0 + 0.5) / 15.0;
        vec2 centered = vUv * 2.0 - 1.0;
        float vignette = smoothstep(1.35, 0.32, dot(centered, centered));
        color *= mix(0.72, 1.0, vignette);
        float scan = 0.985 + 0.015 * sin((gl_FragCoord.y + time * 5.0) * 3.14159265);
        color *= scan;
        gl_FragColor = vec4(color, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
}

function addPart(group, geometry, mat, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position);
  mesh.scale.set(...scale);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function createHumanoid({ armor = 0x505963, cloth = 0x283243, skin = 0x8f654d, spectral = false, crown = false } = {}) {
  const group = new THREE.Group();
  const armorMat = new THREE.MeshStandardMaterial({ color: armor, roughness: .42, metalness: .6, emissive: spectral ? 0x263c66 : 0, emissiveIntensity: spectral ? 1.2 : 0 });
  const clothMat = new THREE.MeshStandardMaterial({ color: cloth, roughness: .9, transparent: spectral, opacity: spectral ? .82 : 1, emissive: spectral ? 0x111e46 : 0, emissiveIntensity: spectral ? .8 : 0 });
  const skinMat = new THREE.MeshStandardMaterial({ color: skin, roughness: .82 });
  const eyeMat = new THREE.MeshBasicMaterial({ color: spectral ? 0x8be8ff : 0xffc36a });

  addPart(group, new THREE.CapsuleGeometry(.27, .58, 5, 10), clothMat, [0, .95, 0], [1.12, 1, .78]);
  addPart(group, new THREE.SphereGeometry(.22, 12, 8), skinMat, [0, 1.58, 0]);
  addPart(group, new THREE.CylinderGeometry(.34, .28, .4, 8), armorMat, [0, 1.27, 0]);
  addPart(group, new THREE.CapsuleGeometry(.095, .52, 4, 8), armorMat, [-.38, 1.16, 0], [1, 1, 1], [0, 0, -.18]);
  addPart(group, new THREE.CapsuleGeometry(.095, .52, 4, 8), armorMat, [.38, 1.16, 0], [1, 1, 1], [0, 0, .18]);
  addPart(group, new THREE.CapsuleGeometry(.11, .56, 4, 8), clothMat, [-.16, .36, 0]);
  addPart(group, new THREE.CapsuleGeometry(.11, .56, 4, 8), clothMat, [.16, .36, 0]);
  addPart(group, new THREE.SphereGeometry(.035, 8, 6), eyeMat, [-.075, 1.62, -.195]);
  addPart(group, new THREE.SphereGeometry(.035, 8, 6), eyeMat, [.075, 1.62, -.195]);
  if (crown) {
    for (let i = -2; i <= 2; i += 1) addPart(group, new THREE.ConeGeometry(.055, .26 + Math.abs(i) * .025, 5), armorMat, [i * .09, 1.89, 0], [1, 1, 1], [0, 0, i * .08]);
  }
  return group;
}

function createHound() {
  const group = new THREE.Group();
  const hide = new THREE.MeshStandardMaterial({ color: 0x303c48, roughness: .72, metalness: .08 });
  const mane = new THREE.MeshStandardMaterial({ color: 0x17202a, roughness: .95 });
  const glow = new THREE.MeshBasicMaterial({ color: 0x6ee7ff });
  addPart(group, new THREE.SphereGeometry(.46, 14, 9), hide, [0, .58, 0], [1.35, .76, .72]);
  addPart(group, new THREE.SphereGeometry(.29, 12, 8), mane, [0, .72, -.53], [1.05, .9, 1.1]);
  addPart(group, new THREE.ConeGeometry(.19, .55, 8), hide, [0, .64, -.82], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (const x of [-.27, .27]) {
    for (const z of [-.28, .29]) addPart(group, new THREE.CapsuleGeometry(.065, .42, 4, 7), hide, [x, .25, z], [1, 1, 1], [0, 0, x > 0 ? -.08 : .08]);
  }
  addPart(group, new THREE.ConeGeometry(.08, .31, 5), mane, [-.17, 1.04, -.55], [1, 1, 1], [-.24, 0, -.18]);
  addPart(group, new THREE.ConeGeometry(.08, .31, 5), mane, [.17, 1.04, -.55], [1, 1, 1], [-.24, 0, .18]);
  addPart(group, new THREE.SphereGeometry(.045, 8, 6), glow, [-.105, .8, -.78]);
  addPart(group, new THREE.SphereGeometry(.045, 8, 6), glow, [.105, .8, -.78]);
  group.scale.setScalar(.86);
  return group;
}

function createCrawler() {
  const group = new THREE.Group();
  const shell = new THREE.MeshStandardMaterial({ color: 0x4f5c2c, roughness: .52, metalness: .15 });
  const belly = new THREE.MeshStandardMaterial({ color: 0x202616, roughness: .9 });
  const glow = new THREE.MeshBasicMaterial({ color: 0xb6f15c });
  addPart(group, new THREE.SphereGeometry(.48, 12, 8), shell, [0, .42, .18], [1.15, .65, 1.3]);
  addPart(group, new THREE.SphereGeometry(.34, 12, 8), belly, [0, .39, -.44], [1.12, .8, .9]);
  for (let i = 0; i < 4; i += 1) {
    const z = -.35 + i * .25;
    for (const side of [-1, 1]) {
      const leg = new THREE.Group();
      addPart(leg, new THREE.CylinderGeometry(.04, .065, .62, 6), shell, [side * .36, .36, z], [1, 1, 1], [0, 0, side * .95]);
      addPart(leg, new THREE.CylinderGeometry(.025, .04, .52, 6), belly, [side * .68, .12, z], [1, 1, 1], [0, 0, side * .38]);
      group.add(leg);
    }
  }
  for (const x of [-.13, 0, .13]) addPart(group, new THREE.SphereGeometry(.035, 8, 6), glow, [x, .53, -.75]);
  return group;
}

function createRaider() {
  const group = createHumanoid({ armor: 0x5d4637, cloth: 0x2a1c17, skin: 0x7d5843 });
  const wood = new THREE.MeshStandardMaterial({ color: 0x5d351b, roughness: .82 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x9d9385, roughness: .35, metalness: .72 });
  addPart(group, new THREE.TorusGeometry(.34, .035, 6, 18, Math.PI * 1.55), wood, [.48, 1.08, -.08], [1, 1, 1], [0, .2, Math.PI / 2]);
  addPart(group, new THREE.CylinderGeometry(.012, .012, .66, 5), metal, [.58, 1.08, -.07], [1, 1, 1], [0, 0, -.18]);
  return group;
}

function createSentinel() {
  const group = createHumanoid({ armor: 0x626a71, cloth: 0x20252a, spectral: true });
  group.scale.set(1.18, 1.22, 1.18);
  const metal = new THREE.MeshStandardMaterial({ color: 0x7f8995, roughness: .28, metalness: .82, emissive: 0x162542, emissiveIntensity: .6 });
  addPart(group, new THREE.BoxGeometry(.12, 1.42, .11), metal, [.56, 1.05, 0], [1, 1, 1], [0, 0, -.14]);
  addPart(group, new THREE.ConeGeometry(.16, .42, 4), metal, [.66, 1.8, 0], [1, 1, 1], [0, 0, -.14]);
  return group;
}

function createShade() {
  const group = new THREE.Group();
  const smoke = new THREE.MeshStandardMaterial({ color: 0x332457, roughness: .5, transparent: true, opacity: .68, emissive: 0x261346, emissiveIntensity: 1.25, side: THREE.DoubleSide });
  const glow = new THREE.MeshBasicMaterial({ color: 0xd6a6ff });
  addPart(group, new THREE.ConeGeometry(.42, 1.3, 14, 1, true), smoke, [0, .65, 0], [1, 1, 1], [0, 0, Math.PI]);
  addPart(group, new THREE.SphereGeometry(.25, 12, 8), smoke, [0, 1.4, 0]);
  addPart(group, new THREE.SphereGeometry(.04, 8, 6), glow, [-.08, 1.46, -.21]);
  addPart(group, new THREE.SphereGeometry(.04, 8, 6), glow, [.08, 1.46, -.21]);
  return group;
}

function createWarden(boss = false) {
  const group = createHumanoid({ armor: boss ? 0x292d3b : 0x414b5c, cloth: 0x171824, spectral: true, crown: boss });
  group.scale.setScalar(boss ? 1.55 : 1.28);
  const bladeMat = new THREE.MeshStandardMaterial({ color: 0xb8d5df, emissive: 0x347b9d, emissiveIntensity: 1.5, roughness: .15, metalness: .85 });
  addPart(group, new THREE.BoxGeometry(.1, 1.55, .09), bladeMat, [.57, 1.15, -.08], [1, 1, 1], [0, 0, -.18]);
  addPart(group, new THREE.ConeGeometry(.16, .5, 4), bladeMat, [.72, 2.03, -.08], [1, 1, 1], [0, 0, -.18]);
  return group;
}

function createEnemyMesh(enemyId) {
  switch (enemyId) {
    case "echoHound": return createHound();
    case "mireCrawler": return createCrawler();
    case "ashRaider": return createRaider();
    case "hollowSentinel": return createSentinel();
    case "echoShade": return createShade();
    case "morKharr": return createWarden(true);
    default: return createWarden(false);
  }
}


function gothicMaterial(color, { metalness = .05, roughness = .78, emissive = 0, emissiveIntensity = 0, transparent = false, opacity = 1 } = {}) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness, emissive, emissiveIntensity, transparent, opacity, flatShading: true, side: THREE.FrontSide });
}

function addEdges(root, color = 0x0a0a0c, threshold = 28) {
  root.traverse((child) => {
    if (!child.isMesh || child.geometry.type === "PlaneGeometry" || child.geometry.type === "RingGeometry") return;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, threshold), new THREE.LineBasicMaterial({ color, transparent: true, opacity: .72 }));
    edges.scale.set(1.008, 1.008, 1.008);
    child.add(edges);
  });
  return root;
}

function createArmoredTorso({ armor = 0x4c5057, cloth = 0x25262b, skin = 0x8b6652, helm = true, cape = false, spectral = false } = {}) {
  const g = new THREE.Group();
  const steel = gothicMaterial(armor, { metalness: .66, roughness: .33, emissive: spectral ? 0x0d1f35 : 0, emissiveIntensity: spectral ? .85 : 0 });
  const darkSteel = gothicMaterial(new THREE.Color(armor).multiplyScalar(.48), { metalness: .56, roughness: .42 });
  const fabric = gothicMaterial(cloth, { roughness: .98, emissive: spectral ? 0x130d24 : 0, emissiveIntensity: spectral ? .55 : 0, transparent: spectral, opacity: spectral ? .9 : 1 });
  const flesh = gothicMaterial(skin, { roughness: .9 });
  const bone = gothicMaterial(0xc1b49b, { roughness: .82 });
  addPart(g, new THREE.CylinderGeometry(.27,.34,.7,8), fabric,[0,.91,0],[1,1,.72]);
  addPart(g, new THREE.CylinderGeometry(.36,.31,.46,8), steel,[0,1.28,0],[1,1,.74]);
  addPart(g, new THREE.BoxGeometry(.64,.12,.34), darkSteel,[0,1.43,-.02]);
  addPart(g, new THREE.SphereGeometry(.215,10,7), helm ? darkSteel : flesh,[0,1.69,-.015],[1,.98,.92]);
  if (helm) {
    addPart(g,new THREE.ConeGeometry(.23,.26,7),steel,[0,1.91,0]);
    addPart(g,new THREE.BoxGeometry(.36,.035,.24),gothicMaterial(0x101116,{metalness:.35,roughness:.4}),[0,1.69,-.2]);
    for (const x of [-.12,-.04,.04,.12]) addPart(g,new THREE.BoxGeometry(.018,.15,.018),bone,[x,1.69,-.225]);
  }
  for (const side of [-1,1]) {
    addPart(g,new THREE.SphereGeometry(.18,8,6),steel,[side*.42,1.36,0],[1.15,.7,1]);
    addPart(g,new THREE.CapsuleGeometry(.08,.42,4,7),darkSteel,[side*.43,1.02,0],[1,1,1],[0,0,side*.09]);
    addPart(g,new THREE.CapsuleGeometry(.09,.46,4,7),fabric,[side*.16,.42,0]);
    addPart(g,new THREE.BoxGeometry(.2,.14,.35),steel,[side*.16,.12,-.02]);
  }
  if (cape) {
    const capeMat = gothicMaterial(new THREE.Color(cloth).multiplyScalar(.65),{roughness:1,transparent:spectral,opacity:spectral?.72:1});
    const capeGeo = new THREE.PlaneGeometry(.88,1.45,3,5);
    const capeMesh=addPart(g,capeGeo,capeMat,[0,.83,.23],[1,1,1],[0,0,0]);
    capeMesh.material.side=THREE.DoubleSide;
  }
  return g;
}

function createProfessionalHound() {
  const g=new THREE.Group();
  const fur=gothicMaterial(0x252d35,{roughness:.96});
  const plate=gothicMaterial(0x454d55,{metalness:.65,roughness:.32});
  const bone=gothicMaterial(0xd0c1a3,{roughness:.8});
  const eye=gothicMaterial(0x7be4ff,{emissive:0x28a8d8,emissiveIntensity:3,roughness:.1});
  addPart(g,new THREE.CapsuleGeometry(.31,.72,6,10),fur,[0,.62,.12],[1.35,.82,.85],[Math.PI/2,0,0]);
  addPart(g,new THREE.CapsuleGeometry(.25,.48,5,9),plate,[0,.78,.05],[1.36,.62,.78],[Math.PI/2,0,0]);
  addPart(g,new THREE.SphereGeometry(.28,10,7),fur,[0,.72,-.58],[1.1,.86,1.2]);
  addPart(g,new THREE.ConeGeometry(.19,.48,7),fur,[0,.62,-.91],[1,.75,1],[Math.PI/2,0,0]);
  addPart(g,new THREE.BoxGeometry(.35,.08,.31),bone,[0,.55,-1.08]);
  for (const side of [-1,1]) {
    addPart(g,new THREE.ConeGeometry(.1,.34,5),fur,[side*.16,1.03,-.59],[1,1,1],[-.22,0,side*.14]);
    addPart(g,new THREE.SphereGeometry(.042,7,5),eye,[side*.09,.78,-.84]);
    for (const z of [-.2,.36]) {
      addPart(g,new THREE.CapsuleGeometry(.055,.48,4,7),fur,[side*.29,.29,z],[1,1,1],[0,0,side*.08]);
      addPart(g,new THREE.BoxGeometry(.15,.08,.22),bone,[side*.3,.05,z-.03]);
    }
  }
  for (let i=0;i<5;i++) addPart(g,new THREE.ConeGeometry(.07,.3,5),bone,[0,.98,.15+i*.18],[1,1,1],[Math.PI/2,0,0]);
  addPart(g,new THREE.CylinderGeometry(.04,.07,.82,6),fur,[0,.73,.83],[1,1,1],[-.9,0,0]);
  g.scale.setScalar(.93);
  return addEdges(g);
}

function createProfessionalCrawler() {
  const g=new THREE.Group();
  const shell=gothicMaterial(0x46552c,{metalness:.2,roughness:.54});
  const shell2=gothicMaterial(0x768038,{metalness:.12,roughness:.6});
  const under=gothicMaterial(0x171b13,{roughness:.96});
  const poison=gothicMaterial(0xb7ec4d,{emissive:0x4f7e15,emissiveIntensity:2.4,roughness:.2});
  for(let i=0;i<5;i++) addPart(g,new THREE.SphereGeometry(.25+i*.015,9,6),i%2?shell:shell2,[0,.38,.45-i*.25],[1.1,.65,1.05]);
  addPart(g,new THREE.SphereGeometry(.37,10,7),under,[0,.36,-.72],[1.15,.72,.9]);
  addPart(g,new THREE.ConeGeometry(.12,.5,6),shell2,[-.18,.35,-1.06],[1,1,1],[Math.PI/2,0,-.18]);
  addPart(g,new THREE.ConeGeometry(.12,.5,6),shell2,[.18,.35,-1.06],[1,1,1],[Math.PI/2,0,.18]);
  for(let i=0;i<4;i++) for(const side of [-1,1]) {
    const z=.35-i*.3;
    addPart(g,new THREE.CylinderGeometry(.035,.055,.62,6),shell,[side*.42,.34,z],[1,1,1],[0,0,side*.98]);
    addPart(g,new THREE.CylinderGeometry(.025,.035,.56,6),under,[side*.75,.11,z],[1,1,1],[0,0,side*.36]);
  }
  for(const x of [-.15,0,.15]) addPart(g,new THREE.SphereGeometry(.035,7,5),poison,[x,.49,-.96]);
  return addEdges(g);
}

function createProfessionalRaider() {
  const g=createArmoredTorso({armor:0x58504a,cloth:0x241c19,skin:0x77513e,helm:false,cape:true});
  const hood=gothicMaterial(0x211b1c,{roughness:.98});
  const leather=gothicMaterial(0x5b351f,{roughness:.87});
  const iron=gothicMaterial(0x9a9488,{metalness:.72,roughness:.3});
  addPart(g,new THREE.ConeGeometry(.34,.56,8,1,true),hood,[0,1.73,.02],[1,1,1],[0,0,Math.PI]);
  addPart(g,new THREE.TorusGeometry(.38,.035,7,22,Math.PI*1.7),leather,[.53,1.07,-.02],[1,1,1],[0,.2,Math.PI/2]);
  addPart(g,new THREE.CylinderGeometry(.012,.012,.78,5),iron,[.61,1.06,-.02],[1,1,1],[0,0,-.17]);
  addPart(g,new THREE.CylinderGeometry(.16,.18,.6,8),leather,[-.47,1.05,.18],[1,.7,1]);
  for(let i=0;i<4;i++) addPart(g,new THREE.ConeGeometry(.025,.54,5),iron,[-.48+i*.03,1.19,.2],[1,1,1],[.2,0,0]);
  return addEdges(g);
}

function createProfessionalSentinel() {
  const g=createArmoredTorso({armor:0x555d68,cloth:0x171a20,skin:0x82705d,helm:true,cape:true,spectral:true});
  const steel=gothicMaterial(0x89939e,{metalness:.82,roughness:.23,emissive:0x10273b,emissiveIntensity:.6});
  const glow=gothicMaterial(0x7edcff,{emissive:0x2f9ac4,emissiveIntensity:3,roughness:.12});
  addPart(g,new THREE.BoxGeometry(.13,1.56,.13),steel,[.62,1.0,0],[1,1,1],[0,0,-.14]);
  addPart(g,new THREE.ConeGeometry(.18,.48,4),steel,[.75,1.88,0],[1,1,1],[0,0,-.14]);
  addPart(g,new THREE.CylinderGeometry(.43,.43,.09,12),steel,[-.55,1.08,.04],[1,1,1],[Math.PI/2,0,0]);
  addPart(g,new THREE.CylinderGeometry(.08,.08,.1,12),glow,[-.55,1.08,-.03],[1,1,1],[Math.PI/2,0,0]);
  g.scale.setScalar(1.18);
  return addEdges(g);
}

function createProfessionalShade() {
  const g=new THREE.Group();
  const robe=gothicMaterial(0x251834,{roughness:.92,transparent:true,opacity:.88,emissive:0x1b0d32,emissiveIntensity:1.2});
  robe.side=THREE.DoubleSide;
  const bone=gothicMaterial(0xa99cb0,{roughness:.75,emissive:0x241a36,emissiveIntensity:.6});
  const glow=gothicMaterial(0xc889ff,{emissive:0x7935c2,emissiveIntensity:3.4,roughness:.1});
  addPart(g,new THREE.ConeGeometry(.48,1.55,12,3,true),robe,[0,.74,0],[1,1,1],[0,0,Math.PI]);
  addPart(g,new THREE.SphereGeometry(.23,10,7),bone,[0,1.46,0],[.9,1.08,.88]);
  for(const side of [-1,1]) {
    addPart(g,new THREE.CapsuleGeometry(.045,.62,4,7),bone,[side*.42,1.0,-.02],[1,1,1],[0,0,side*.35]);
    for(let i=0;i<3;i++) addPart(g,new THREE.CylinderGeometry(.01,.016,.25,5),bone,[side*(.57+i*.035),.75-i*.02,-.03],[1,1,1],[0,0,side*.12]);
    addPart(g,new THREE.SphereGeometry(.038,7,5),glow,[side*.075,1.5,-.2]);
  }
  for(let i=0;i<3;i++) { const ring=addPart(g,new THREE.TorusGeometry(.28+i*.12,.018,5,22),glow,[0,.75+i*.22,0],[1,1,1],[Math.PI/2,0,0]); ring.userData.orbit=i; }
  return addEdges(g,0x08060b);
}

function createProfessionalBoss() {
  const g=createArmoredTorso({armor:0x272d39,cloth:0x0d0d15,skin:0x645b59,helm:true,cape:true,spectral:true});
  const voidSteel=gothicMaterial(0x394251,{metalness:.78,roughness:.2,emissive:0x160b2f,emissiveIntensity:1.05});
  const purple=gothicMaterial(0xb26cff,{emissive:0x6b25bd,emissiveIntensity:3.3,roughness:.1});
  for(let i=-3;i<=3;i++) addPart(g,new THREE.ConeGeometry(.065,.42+Math.abs(i)*.08,5),voidSteel,[i*.09,2.03,0],[1,1,1],[0,0,i*.08]);
  addPart(g,new THREE.BoxGeometry(.18,1.78,.15),voidSteel,[.72,1.15,-.05],[1,1,1],[0,0,-.15]);
  addPart(g,new THREE.ConeGeometry(.24,.66,4),purple,[.87,2.17,-.05],[1,1,1],[0,0,-.15]);
  addPart(g,new THREE.OctahedronGeometry(.12),purple,[0,1.42,-.28]);
  for(const side of [-1,1]) {
    addPart(g,new THREE.CylinderGeometry(.04,.08,.82,6),voidSteel,[side*.58,1.76,.06],[1,1,1],[0,0,side*.58]);
    addPart(g,new THREE.ConeGeometry(.09,.38,5),voidSteel,[side*.84,2.02,.06],[1,1,1],[0,0,side*.58]);
  }
  g.scale.setScalar(1.48);
  return addEdges(g,0x050407);
}

function createProfessionalEnemy(enemyId) {
  return createCreatureModel(enemyId);
}


const ENEMY_BILLBOARD_ROWS = Object.freeze({
  echoHound: 0,
  mireCrawler: 1,
  ashRaider: 2,
  hollowSentinel: 3,
  echoShade: 4,
  morKharr: 5,
});

function createEnemyBillboard(enemyId, atlas) {
  if (!atlas) return createEnemyMesh(enemyId);
  const row = ENEMY_BILLBOARD_ROWS[enemyId] ?? 5;
  const map = atlas.clone();
  map.needsUpdate = true;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  map.repeat.set(1 / 12, 1 / 6);
  map.offset.set(0, 1 - (row + 1) / 6);
  const material = new THREE.SpriteMaterial({
    map,
    transparent: true,
    alphaTest: .08,
    depthWrite: true,
    toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  const boss = enemyId === "morKharr";
  sprite.center.set(.5, .08);
  sprite.scale.set(boss ? 2.8 : 1.65, boss ? 2.8 : 1.65, 1);
  sprite.userData.pixelSprite = true;
  sprite.userData.spriteTexture = map;
  sprite.userData.spriteRow = row;
  sprite.userData.baseScale = sprite.scale.clone();
  return sprite;
}

function createTree(seed = 0) {
  const group = new THREE.Group();
  const trunk = new THREE.MeshStandardMaterial({ color: 0x4b3424, roughness: 1 });
  const leafA = new THREE.MeshStandardMaterial({ color: seed % 2 ? 0x294d2c : 0x315d35, roughness: .92 });
  addPart(group, new THREE.CylinderGeometry(.1, .16, 1.3, 7), trunk, [0, .65, 0]);
  addPart(group, new THREE.ConeGeometry(.65, 1.4, 9), leafA, [0, 1.45, 0]);
  addPart(group, new THREE.ConeGeometry(.52, 1.1, 9), leafA, [0, 2.05, 0]);
  group.scale.setScalar(.85 + (seed % 5) * .07);
  return group;
}

function createBackdropHouse() {
  const group = new THREE.Group();
  const plaster = material("retro-house-plaster", ["#5b4e3d", "#77644a", "#473c31", "#8a7353"], { size: 32, coarse: 4, grain: .18 });
  const beams = material("retro-house-beams", ["#2b1b12", "#422a18", "#1a110c"], { size: 32, wood: true, coarse: 5, grain: .14 });
  const roof = material("retro-house-roof", ["#382721", "#4e342b", "#271b18"], { size: 32, coarse: 4, grain: .2 });
  addPart(group, new THREE.BoxGeometry(3.2, 2.8, 2.2), plaster, [0, 1.4, 0]);
  addPart(group, new THREE.ConeGeometry(2.45, 1.8, 4), roof, [0, 3.45, 0], [1, 1, .75], [0, Math.PI / 4, 0]);
  for (const x of [-1.25, 0, 1.25]) addPart(group, new THREE.BoxGeometry(.16, 2.9, 2.28), beams, [x, 1.45, 0]);
  for (const y of [.55, 1.55, 2.55]) addPart(group, new THREE.BoxGeometry(3.25, .13, 2.25), beams, [0, y, 0]);
  addPart(group, new THREE.BoxGeometry(.78, 1.45, .12), beams, [0, .73, -1.16]);
  const windowMat = new THREE.MeshStandardMaterial({ color: 0xc79042, emissive: 0x7d3e12, emissiveIntensity: .8, roughness: .6 });
  for (const x of [-1.0, 1.0]) addPart(group, new THREE.BoxGeometry(.55, .62, .08), windowMat, [x, 1.65, -1.18]);
  group.scale.setScalar(.9);
  return group;
}

function createRuinedTower() {
  const group = new THREE.Group();
  const stone = material("retro-ruin-stone", ["#4b4c4a", "#676761", "#343634", "#77766c"], { size: 32, stone: true, coarse: 5, grain: .18 });
  addPart(group, new THREE.CylinderGeometry(1.2, 1.45, 5.8, 8), stone, [0, 2.9, 0]);
  addPart(group, new THREE.BoxGeometry(1.0, 2.2, .22), new THREE.MeshBasicMaterial({ color: 0x080909 }), [0, 2.25, -1.18]);
  for (let i = 0; i < 8; i += 1) {
    if (i in {2:1, 5:1}) continue;
    const angle = i / 8 * Math.PI * 2;
    addPart(group, new THREE.BoxGeometry(.48, .7, .48), stone, [Math.cos(angle) * 1.05, 6.1, Math.sin(angle) * 1.05]);
  }
  const crystalMat = new THREE.MeshStandardMaterial({ color: 0x8f4ae0, emissive: 0x6c22c4, emissiveIntensity: 2.5, roughness: .25 });
  addPart(group, new THREE.OctahedronGeometry(.38), crystalMat, [0, 6.8, 0]);
  return group;
}

function createBackdropSignpost() {
  const group = new THREE.Group();
  const wood = material("retro-sign-wood", ["#603a1d", "#8a5528", "#452814", "#a16933"], { size: 32, wood: true, coarse: 4, grain: .2 });
  addPart(group, new THREE.BoxGeometry(.13, 2.0, .13), wood, [0, 1, 0]);
  const boards = [
    [0, 1.72, 0, .08],
    [.08, 1.38, 0, -.1],
    [-.04, 1.05, 0, .05],
  ];
  for (const [x, y, z, rot] of boards) addPart(group, new THREE.BoxGeometry(1.35, .28, .1), wood, [x, y, z], [1, 1, 1], [0, rot, 0]);
  return group;
}


const WORLD_BILLBOARD_ROWS = Object.freeze({
  npc: 0,
  obelisk: 1, portal: 1,
  sign: 2,
  torch: 3,
  fragment: 4,
  satchel: 5,
  herb: 6,
  key: 7,
  lever: 8, mechanism: 8,
  trap: 9,
  chest: 10,
  crate: 11,
  stall: 12,
  corpse: 13,
});

function createWorldBillboard(entity, atlas) {
  const row = WORLD_BILLBOARD_ROWS[entity.kind];
  if (!atlas || row == null) return createWorldObject(entity);
  const map = atlas.clone();
  map.needsUpdate = true;
  map.wrapS = map.wrapT = THREE.ClampToEdgeWrapping;
  map.magFilter = THREE.NearestFilter;
  map.minFilter = THREE.NearestFilter;
  map.generateMipmaps = false;
  map.repeat.set(1 / 4, 1 / 14);
  map.offset.set(0, 1 - (row + 1) / 14);
  const material = new THREE.SpriteMaterial({
    map, transparent: true, alphaTest: .08, depthWrite: true, toneMapped: false,
  });
  const sprite = new THREE.Sprite(material);
  const scales = { npc: 1.48, obelisk: 1.42, portal: 1.42, sign: 1.25, torch: 1.18, fragment: .78, satchel: .72, herb: .68, key: .68, lever: .78, mechanism: .78, trap: .88, chest: .92, crate: .95, stall: 1.42, corpse: .92 };
  const scale = scales[entity.kind] || .9;
  sprite.center.set(.5, entity.kind === "trap" || entity.kind === "corpse" ? .18 : .06);
  sprite.scale.set(scale, scale, 1);
  sprite.userData.pixelWorldSprite = true;
  sprite.userData.spriteTexture = map;
  sprite.userData.spriteRow = row;
  sprite.userData.baseScale = sprite.scale.clone();
  if (entity.kind === "torch") {
    const light = new THREE.PointLight(0xff9b45, 1.8, 6.5, 2);
    light.position.set(0, .68, .08);
    light.userData.flameLight = true;
    sprite.add(light);
  }
  return sprite;
}

function createWorldObject(entity) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0x5f3b22, roughness: .85 });
  const iron = new THREE.MeshStandardMaterial({ color: 0x555b61, roughness: .42, metalness: .65 });
  const stone = new THREE.MeshStandardMaterial({ color: 0x6d6b66, roughness: .92 });
  const gold = new THREE.MeshStandardMaterial({ color: 0xb78a3a, roughness: .35, metalness: .72 });
  const glow = new THREE.MeshStandardMaterial({ color: 0x86d9ff, emissive: 0x2d8bbb, emissiveIntensity: 2.2, roughness: .2 });
  switch (entity.kind) {
    case "npc": return createHumanoid({ armor: 0x4f5965, cloth: 0x26364b, skin: 0x9a7058 });
    case "torch": {
      addPart(group, new THREE.CylinderGeometry(.035, .05, 1.1, 7), wood, [0, .55, 0]);
      const flame = addPart(group, new THREE.ConeGeometry(.11, .34, 8), glow, [0, 1.24, 0]);
      flame.userData.flame = true;
      const light = new THREE.PointLight(0xffa74a, 2.1, 7.5, 2);
      light.position.set(0, 1.35, 0);
      light.castShadow = false;
      light.userData.flameLight = true;
      group.add(light);
      return group;
    }
    case "chest": case "satchel": {
      addPart(group, new THREE.BoxGeometry(.75, .36, .48), wood, [0, .18, 0]);
      addPart(group, new THREE.CylinderGeometry(.24, .24, .75, 12, 1, false, 0, Math.PI), wood, [0, .39, 0], [1, 1, 1], [0, 0, Math.PI / 2]);
      addPart(group, new THREE.BoxGeometry(.1, .2, .04), gold, [0, .33, -.255]);
      return group;
    }
    case "crate": case "stall": {
      addPart(group, new THREE.BoxGeometry(.72, .72, .72), wood, [0, .36, 0]);
      addPart(group, new THREE.BoxGeometry(.06, .75, .75), iron, [0, .36, 0]);
      return group;
    }
    case "sign": {
      addPart(group, new THREE.CylinderGeometry(.04, .06, 1.25, 7), wood, [0, .62, 0]);
      addPart(group, new THREE.BoxGeometry(.92, .32, .08), wood, [0, 1.18, 0]);
      return group;
    }
    case "lever": case "mechanism": {
      addPart(group, new THREE.CylinderGeometry(.18, .24, .18, 8), stone, [0, .09, 0]);
      addPart(group, new THREE.CylinderGeometry(.035, .05, .68, 7), iron, [0, .48, 0], [1, 1, 1], [0, 0, -.42]);
      addPart(group, new THREE.SphereGeometry(.09, 8, 6), gold, [-.16, .78, 0]);
      return group;
    }
    case "obelisk": case "portal": {
      addPart(group, new THREE.CylinderGeometry(.22, .4, 1.65, 6), stone, [0, .82, 0]);
      addPart(group, new THREE.OctahedronGeometry(.18), glow, [0, 1.75, 0]);
      return group;
    }
    case "fragment": case "key": case "herb": {
      if (entity.kind === "herb") {
        for (let i = 0; i < 5; i += 1) addPart(group, new THREE.ConeGeometry(.05, .35, 5), new THREE.MeshStandardMaterial({ color: 0x4e8c4e, roughness: .9 }), [(i - 2) * .07, .18, 0], [1, 1, 1], [0, 0, (i - 2) * .18]);
      } else if (entity.kind === "key") {
        addPart(group, new THREE.TorusGeometry(.14, .035, 6, 14), gold, [0, .22, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
        addPart(group, new THREE.BoxGeometry(.06, .06, .38), gold, [0, .22, .26]);
      } else addPart(group, new THREE.OctahedronGeometry(.24), glow, [0, .32, 0]);
      return group;
    }
    case "trap": {
      addPart(group, new THREE.RingGeometry(.18, .42, 8), glow, [0, .012, 0], [1, 1, 1], [-Math.PI / 2, 0, 0]);
      return group;
    }
    default:
      addPart(group, new THREE.DodecahedronGeometry(.28), stone, [0, .28, 0]);
      return group;
  }
}

export class CinematicRenderer {
  constructor(canvas, assets = null) {
    this.canvas = canvas;
    this.assets = assets;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: "high-performance", precision: "mediump" });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.NoToneMapping;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.BasicShadowMap;
    this.renderer.setPixelRatio(1);
    this.renderer.sortObjects = true;
    this.renderer.autoClear = true;
    this.detailLevel = 1;
    this.postEnabled = true;
    this.safeMode = false;
    this.contextLost = false;
    this.mobileSafeCreatures = /iPhone|iPad|iPod/i.test(globalThis.navigator?.userAgent || "");
    this.entityCreationFailures = 0;
    this.renderTarget = new THREE.WebGLRenderTarget(512, 288, {
      minFilter: THREE.NearestFilter,
      magFilter: THREE.NearestFilter,
      depthBuffer: true,
      stencilBuffer: false,
    });
    this.postScene = new THREE.Scene();
    this.postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.postMaterial = createPostProcessMaterial();
    this.postQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.postMaterial);
    this.postScene.add(this.postQuad);
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(63, 16 / 9, .05, 70);
    this.camera.rotation.order = "YXZ";
    this.scene.add(this.camera);
    this.clock = new THREE.Clock();
    this.zoneGroup = new THREE.Group();
    this.entityGroup = new THREE.Group();
    this.projectileGroup = new THREE.Group();
    this.scene.add(this.zoneGroup, this.entityGroup, this.projectileGroup);
    this.entityMeshes = new Map();
    this.projectileMeshes = new Map();
    this.zoneId = null;
    this.mapSignature = "";
    this.lastMapCheck = 0;
    const enemyImage = assets?.images?.get?.("enemies") || null;
    this.enemyAtlas = enemyImage ? new THREE.Texture(enemyImage) : new THREE.TextureLoader().load(new URL("../../assets/sprites/enemies.png", import.meta.url).href);
    this.enemyAtlas.colorSpace = THREE.SRGBColorSpace;
    this.enemyAtlas.magFilter = THREE.NearestFilter;
    this.enemyAtlas.minFilter = THREE.NearestFilter;
    this.enemyAtlas.generateMipmaps = false;
    this.enemyAtlas.needsUpdate = true;
    const worldImage = assets?.images?.get?.("world") || null;
    this.worldAtlas = worldImage ? new THREE.Texture(worldImage) : new THREE.TextureLoader().load(new URL("../../assets/sprites/world.png", import.meta.url).href);
    this.worldAtlas.colorSpace = THREE.SRGBColorSpace;
    this.worldAtlas.magFilter = THREE.NearestFilter;
    this.worldAtlas.minFilter = THREE.NearestFilter;
    this.worldAtlas.generateMipmaps = false;
    this.worldAtlas.needsUpdate = true;
    this.weapon = this.#createWeapon();
    this.camera.add(this.weapon);
    this.#installLights();
    canvas.addEventListener?.("webglcontextlost", (event) => {
      event.preventDefault?.();
      this.contextLost = true;
      this.enableSafeMode(new Error("WebGL context lost"));
    });
    canvas.addEventListener?.("webglcontextrestored", () => {
      this.contextLost = false;
      this.mapSignature = "";
      this.lastMapCheck = 0;
    });
  }

  setAssets() {}

  enableSafeMode(error = null) {
    if (error) console.warn("Cinematic renderer switched to safe mode", error);
    this.safeMode = true;
    this.postEnabled = false;
    this.detailLevel = Math.min(this.detailLevel, .55);
    this.renderer.shadowMap.enabled = false;
    this.entityGroup.clear();
    this.entityMeshes.clear();
    this.mapSignature = "";
    this.lastMapCheck = 0;
  }

  setQualityProfile(profile = {}) {
    const nextDetail = clamp(profile.detail ?? 1, 0.45, 1);
    const changed = Math.abs(nextDetail - this.detailLevel) > 0.05;
    this.detailLevel = nextDetail;
    this.renderer.shadowMap.enabled = profile.shadows !== false;
    this.postEnabled = profile.postProcess !== false;
    if (changed) {
      this.mapSignature = "";
      this.lastMapCheck = 0;
    }
  }

  #installLights() {
    this.hemi = new THREE.HemisphereLight(0x9cc8ff, 0x29301f, 1.75);
    this.sun = new THREE.DirectionalLight(0xffe2b4, 2.4);
    this.sun.position.set(-8, 14, -5);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(256, 256);
    this.sun.shadow.camera.left = -18;
    this.sun.shadow.camera.right = 18;
    this.sun.shadow.camera.top = 18;
    this.sun.shadow.camera.bottom = -18;
    this.sun.shadow.camera.near = 1;
    this.sun.shadow.camera.far = 44;
    this.scene.add(this.hemi, this.sun);
    this.ambient = new THREE.AmbientLight(0x40384f, .18);
    this.scene.add(this.ambient);
  }

  #createWeapon() {
    const group = new THREE.Group();
    const steel = gothicMaterial(0xb9c1c4, { metalness: .88, roughness: .16 });
    const darkSteel = gothicMaterial(0x46505c, { metalness: .78, roughness: .24 });
    const gold = gothicMaterial(0xb78638, { metalness: .82, roughness: .23 });
    const leather = gothicMaterial(0x4c2718, { roughness: .88 });
    const gem = gothicMaterial(0xb51d2d, { emissive: 0x5e0610, emissiveIntensity: 1.4, roughness: .15 });
    const blade = new THREE.Shape();
    blade.moveTo(-.055, -.54); blade.lineTo(.055, -.54); blade.lineTo(.075, .44); blade.lineTo(0, .67); blade.lineTo(-.075, .44); blade.closePath();
    const bladeGeo = new THREE.ExtrudeGeometry(blade, { depth: .022, bevelEnabled: true, bevelSegments: 1, bevelSize: .012, bevelThickness: .012 });
    const bladeMesh = addPart(group, bladeGeo, steel, [0, .38, 0], [1, 1.45, 1], [0, 0, 0]);
    bladeMesh.geometry.center();
    addPart(group, new THREE.BoxGeometry(.58,.07,.075), gold, [0,-.36,0]);
    addPart(group, new THREE.BoxGeometry(.08,.38,.07), leather, [0,-.58,0]);
    addPart(group, new THREE.CylinderGeometry(.09,.09,.08,10), gold, [0,-.8,0]);
    addPart(group, new THREE.OctahedronGeometry(.075), gem, [0,-.36,-.055]);
    addPart(group, new THREE.BoxGeometry(.025,.82,.028), darkSteel, [0,.24,-.035]);
    group.position.set(.64,-.58,-1.35);
    group.rotation.set(-.05,.2,-.12);
    group.scale.setScalar(.78);
    group.renderOrder = 999;
    group.traverse((child) => { if (child.isMesh) { child.renderOrder = 999; child.material.depthTest = false; child.material.depthWrite = false; child.frustumCulled = false; } });
    return group;
  }

  resize(width, height) {
    const aspect = Math.max(.8, width / Math.max(1, height));
    const w = Math.max(320, Math.min(800, Math.floor(width)));
    const h = Math.max(180, Math.min(500, Math.round(w / aspect)));
    this.renderer.setSize(w, h, false);
    this.renderTarget.setSize(w, h);
    this.postMaterial.uniforms.resolution.value.set(w, h);
    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();
  }

  render(world) {
    if (this.contextLost) return;
    const elapsed = world.time || this.clock.getElapsedTime();
    this.#updateEnvironment(world);
    this.#syncMap(world, elapsed);
    this.#syncEntities(world, elapsed);
    this.#syncProjectiles(world, elapsed);
    this.#updateCamera(world, elapsed);
    updateZoneArt(this.zoneGroup, elapsed);
    if (!this.postEnabled) {
      this.renderer.setRenderTarget(null);
      this.renderer.render(this.scene, this.camera);
      return;
    }
    this.renderer.setRenderTarget(this.renderTarget);
    this.renderer.render(this.scene, this.camera);
    this.renderer.setRenderTarget(null);
    this.postMaterial.uniforms.tDiffuse.value = this.renderTarget.texture;
    this.postMaterial.uniforms.time.value = elapsed;
    this.renderer.render(this.postScene, this.postCamera);
  }

  #updateEnvironment(world) {
    applyZoneAtmosphere(this, world, { hemi: this.hemi, sun: this.sun, ambient: this.ambient });
  }

  #makeMapSignature(world) {
    return world.zone.map.map((row, y) => [...row].map((_, x) => world.getTile(x, y)).join("")).join("|");
  }

  #syncMap(world, elapsed) {
    const due = elapsed - this.lastMapCheck > .35;
    if (!due && this.zoneId === world.zoneId) return;
    this.lastMapCheck = elapsed;
    const signature = this.#makeMapSignature(world);
    if (this.zoneId === world.zoneId && signature === this.mapSignature) return;
    this.zoneId = world.zoneId;
    this.mapSignature = signature;
    this.#buildZone(world);
  }

  #buildZone(world) {
    this.zoneGroup.clear();
    const rows = world.zone.map.length;
    const cols = Math.max(...world.zone.map.map((row) => row.length));
    const dungeon = world.zone.environment === "dungeon";
    const mats = createFloorMaterials(world.zoneId);
    const floorByMaterial = new Map();
    for (let y = 0; y < rows; y += 1) {
      for (let x = 0; x < cols; x += 1) {
        if (world.getTile(x, y) !== 0) continue;
        const floorKind = world.getFloorMaterial(x + .5, y + .5);
        if (!floorByMaterial.has(floorKind)) floorByMaterial.set(floorKind, []);
        floorByMaterial.get(floorKind).push([x, y]);
      }
    }
    for (const [kind, tiles] of floorByMaterial) {
      const geo = new THREE.PlaneGeometry(1.02, 1.02);
      const mesh = new THREE.InstancedMesh(geo, mats[kind] || mats.grass, tiles.length);
      const dummy = new THREE.Object3D();
      tiles.forEach(([x, y], i) => {
        dummy.position.set(x + .5, 0, y + .5);
        dummy.rotation.set(-Math.PI / 2, 0, hash2(x, y, 4) * Math.PI * 2);
        dummy.updateMatrix();
        mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.receiveShadow = true;
      this.zoneGroup.add(mesh);
    }

    const wallMaterials = createWallMaterials(world.zoneId);
    for (let tile = 1; tile <= 5; tile += 1) {
      const positions = [];
      for (let y = 0; y < rows; y += 1) for (let x = 0; x < cols; x += 1) if (world.getTile(x, y) === tile) positions.push([x, y]);
      if (!positions.length) continue;
      const geometry = new THREE.BoxGeometry(1, WALL_HEIGHT, 1);
      const mesh = new THREE.InstancedMesh(geometry, wallMaterials[tile], positions.length);
      const dummy = new THREE.Object3D();
      positions.forEach(([x, y], i) => {
        dummy.position.set(x + .5, WALL_HEIGHT / 2, y + .5);
        dummy.updateMatrix(); mesh.setMatrixAt(i, dummy.matrix);
      });
      mesh.castShadow = tile !== 3;
      mesh.receiveShadow = true;
      this.zoneGroup.add(mesh);

      if (tile === 1 || tile === 4 || tile === 5) {
        const capGeo = new THREE.BoxGeometry(1.05, .09, 1.05);
        const capMat = tile === 4 ? wallMaterials[4] : wallMaterials[1];
        const caps = new THREE.InstancedMesh(capGeo, capMat, positions.length);
        positions.forEach(([x, y], i) => {
          dummy.position.set(x + .5, WALL_HEIGHT + .045, y + .5);
          dummy.rotation.set(0, 0, 0);
          dummy.updateMatrix(); caps.setMatrixAt(i, dummy.matrix);
        });
        caps.castShadow = true; caps.receiveShadow = true; this.zoneGroup.add(caps);
      }

      if (tile === 2) {
        const bandMat = gothicMaterial(0x3d4146, { metalness: .72, roughness: .32 });
        const bandGeo = new THREE.BoxGeometry(1.03, .055, 1.03);
        const bandCount = positions.length * 3;
        const bands = new THREE.InstancedMesh(bandGeo, bandMat, bandCount);
        let bi = 0;
        for (const [x, y] of positions) for (const h of [.55, 1.36, 2.18]) {
          dummy.position.set(x + .5, h, y + .5); dummy.rotation.set(0,0,0); dummy.updateMatrix(); bands.setMatrixAt(bi++, dummy.matrix);
        }
        bands.castShadow = true; this.zoneGroup.add(bands);
      }
    }

    const runeTiles = [];
    for (let y = 0; y < rows; y += 1) for (let x = 0; x < cols; x += 1) if (world.getTile(x, y) === 5) runeTiles.push([x,y]);
    runeTiles.slice(0, 6).forEach(([x,y], i) => {
      const light = new THREE.PointLight(0x9a55e8, 1.25, 5.5, 2);
      light.position.set(x + .5, 1.45 + (i % 2) * .25, y + .5); this.zoneGroup.add(light);
    });

    if (dungeon) {
      const ceilingMat = pbrMaterial(world.zoneId === "drownedAbbey" ? "abbey-wall" : world.zoneId === "obsidianArchive" ? "archive-wall" : world.zoneId === "hollowThrone" ? "throne-wall" : "crypt-wall", { repeatX: Math.max(1, cols / 3), repeatY: Math.max(1, rows / 3), color: 0x777477 });
      const ceiling = new THREE.Mesh(new THREE.PlaneGeometry(cols, rows), ceilingMat);
      ceiling.position.set(cols / 2, WALL_HEIGHT, rows / 2);
      ceiling.rotation.x = Math.PI / 2;
      ceiling.receiveShadow = true;
      this.zoneGroup.add(ceiling);
    } else {
      this.#buildOutdoorBackdrop(world, rows, cols);
    }
    buildZoneArt(world, this.zoneGroup, rows, cols, this.detailLevel);
  }

  #scatterOutdoorProps(world, rows, cols) {
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x575a53, roughness: .98 });
    for (let y = 1; y < rows - 1; y += 1) {
      for (let x = 1; x < cols - 1; x += 1) {
        if (world.getTile(x, y) !== 0) continue;
        const materialKind = world.getFloorMaterial(x + .5, y + .5);
        const r = hash2(x, y, world.zoneId.length);
        if (materialKind === "grass" && r > (this.detailLevel > .9 ? .88 : this.detailLevel > .7 ? .91 : .945)) {
          const tree = createTree(Math.floor(r * 100));
          tree.position.set(x + .2 + hash2(x, y, 10) * .6, 0, y + .2 + hash2(x, y, 11) * .6);
          tree.rotation.y = r * Math.PI * 2;
          this.zoneGroup.add(tree);
        } else if (r > .84 && r < .875) {
          const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.18 + r * .22, 0), rockMat);
          rock.position.set(x + hash2(x, y, 7), .12, y + hash2(x, y, 8));
          rock.scale.y = .55 + hash2(x, y, 9) * .55;
          rock.rotation.set(r * 2, r * 4, r);
          rock.castShadow = true;
          rock.receiveShadow = true;
          this.zoneGroup.add(rock);
        }
      }
    }
  }

  #buildOutdoorBackdrop(world, rows, cols) {
    const mountainMat = new THREE.MeshStandardMaterial({ color: 0x4f5960, roughness: 1, flatShading: true });
    const farMat = new THREE.MeshStandardMaterial({ color: 0x38434b, roughness: 1, flatShading: true });
    const centerX = cols / 2;
    const centerZ = rows / 2;
    const mountainCount = this.detailLevel > .9 ? 26 : this.detailLevel > .7 ? 20 : 14;
    for (let i = 0; i < mountainCount; i += 1) {
      const angle = (i / mountainCount) * Math.PI * 2;
      const radius = Math.max(cols, rows) * (1.05 + hash2(i, 3, world.zoneId.length) * .38);
      const height = 4.5 + hash2(i, 8, 5) * 8.5;
      const width = 2.8 + hash2(i, 12, 7) * 4.5;
      const mountain = new THREE.Mesh(new THREE.ConeGeometry(width, height, 7), i % 3 === 0 ? farMat : mountainMat);
      mountain.position.set(centerX + Math.cos(angle) * radius, height / 2 - .35, centerZ + Math.sin(angle) * radius);
      mountain.rotation.y = hash2(i, 6, 9) * Math.PI;
      mountain.scale.z = .7 + hash2(i, 10, 4) * .7;
      mountain.receiveShadow = true;
      this.zoneGroup.add(mountain);
    }
    const cloudMat = new THREE.MeshBasicMaterial({ color: 0xd9d8cf, transparent: true, opacity: .28, depthWrite: false });
    const cloudCount = this.detailLevel > .9 ? 14 : this.detailLevel > .7 ? 10 : 6;
    for (let i = 0; i < cloudCount; i += 1) {
      const cloud = new THREE.Group();
      for (let j = 0; j < 4; j += 1) addPart(cloud, new THREE.SphereGeometry(.8 + j * .13, 10, 7), cloudMat, [(j - 1.5) * .8, Math.sin(j) * .16, 0], [1.5, .55, .75]);
      const angle = hash2(i, 20, 3) * Math.PI * 2;
      const radius = 12 + hash2(i, 21, 6) * 11;
      cloud.position.set(centerX + Math.cos(angle) * radius, 7 + hash2(i, 23, 7) * 5, centerZ + Math.sin(angle) * radius);
      cloud.rotation.y = angle + Math.PI / 2;
      this.zoneGroup.add(cloud);
    }
  }

  #syncEntities(world, elapsed) {
    const visibleIds = new Set();
    for (const entity of world.entities) {
      if (!world.isEntityVisible(entity) || entity.render === false) continue;
      const state = entity.enemyId ? world.combat.getEnemyState(entity.id) : null;
      if (state?.dead && state.deathTimer <= 0) continue;
      visibleIds.add(entity.id);
      let mesh = this.entityMeshes.get(entity.id);
      if (!mesh) {
        if (entity.enemyId) {
          const lightweight = this.safeMode || this.mobileSafeCreatures || this.detailLevel <= .58;
          try {
            mesh = lightweight ? createLightweightCreatureModel(entity.enemyId) : createProfessionalEnemy(entity.enemyId);
          } catch (error) {
            this.entityCreationFailures += 1;
            console.warn(`Enemy model ${entity.enemyId} failed; using lightweight model.`, error);
            try { mesh = createLightweightCreatureModel(entity.enemyId); }
            catch (fallbackError) {
              console.warn(`Lightweight enemy ${entity.enemyId} failed; using billboard.`, fallbackError);
              mesh = createEnemyBillboard(entity.enemyId, this.enemyAtlas);
            }
          }
          mesh.userData.enemyId = entity.enemyId;
        } else {
          try { mesh = createWorldObject(entity); }
          catch (error) {
            console.warn(`World object ${entity.kind} failed; using neutral marker.`, error);
            mesh = new THREE.Mesh(new THREE.DodecahedronGeometry(.24), gothicMaterial(0x56504a));
          }
        }
        mesh.userData.baseScale = mesh.scale.clone();
        mesh.userData.seed = hash2(Math.floor(entity.x * 11), Math.floor(entity.y * 17), entity.id.length);
        this.entityMeshes.set(entity.id, mesh);
        this.entityGroup.add(mesh);
      }
      mesh.position.set(entity.x, 0, entity.y);
      const dx = world.player.x - entity.x;
      const dz = world.player.y - entity.y;
      mesh.rotation.y = Math.atan2(-dx, -dz);
      const phase = elapsed * (1.4 + mesh.userData.seed);
      const definition = entity.enemyId ? getEnemyDefinition(entity.enemyId) : null;
      const brain = entity.enemyId ? world.combat.getEnemyBrain(entity.id) : null;
      const active = Boolean(brain?.state && brain.state !== "idle");
      const bob = entity.kind === "torch" ? Math.sin(phase * 5) * .03 : Math.sin(phase * (active ? 5 : 2)) * (active ? .035 : .012);
      mesh.position.y = bob;
      mesh.rotation.z = 0;
      mesh.visible = true;
      if (entity.enemyId) {
        const hpRatio = state && definition ? state.hp / definition.maxHp : 1;
        const attackPulse = state?.attackTimer > 0 ? Math.sin((1 - state.attackTimer) * Math.PI) : 0;
        if (!mesh.userData.pixelSprite) animateCreatureModel(mesh, elapsed + mesh.userData.seed * 2.7, active, attackPulse);
        mesh.position.y += attackPulse * .09;
        mesh.rotation.x = attackPulse * -.16;
        if (state?.hitFlash > 0) {
          mesh.rotation.z = Math.sin(elapsed * 28) * .075;
          mesh.traverse((child) => { if (child.isMesh && child.material?.emissive) child.material.emissiveIntensity = 1.8; });
        } else {
          mesh.traverse((child) => { if (child.isMesh && child.material?.emissive && child.material.emissiveIntensity > 1.25) child.material.emissiveIntensity *= .92; });
        }
        if (state?.dead) {
          const death = clamp(1 - (state.deathTimer || 0), 0, 1);
          mesh.rotation.z = death * Math.PI / 2;
          mesh.position.y = -death * .55;
          mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(1 - death * .18);
        } else {
          const breath = 1 + Math.sin(phase * 2.4) * .018;
          mesh.scale.copy(mesh.userData.baseScale).multiplyScalar(breath * (hpRatio < .25 ? .97 : 1));
          mesh.traverse((child) => {
            if (child.userData.orbit != null) child.rotation.z = elapsed * (.5 + child.userData.orbit * .22);
          });
        }
      } else {
        mesh.scale.copy(mesh.userData.baseScale);
        mesh.traverse((child) => {
          if (child.userData.flame) {
            const s = .84 + Math.sin(elapsed * 13 + mesh.userData.seed * 9) * .2;
            child.scale.set(s, 1.05 + Math.sin(elapsed * 17) * .18, s);
          }
          if (child.userData.flameLight) child.intensity = 1.7 + Math.sin(elapsed * 15 + mesh.userData.seed * 7) * .35;
        });
      }
    }
    for (const [id, mesh] of this.entityMeshes) {
      if (!visibleIds.has(id)) {
        this.entityGroup.remove(mesh);
        this.entityMeshes.delete(id);
      }
    }
  }

  #syncProjectiles(world, elapsed) {
    const seen = new Set();
    for (const projectile of world.combat.projectiles || []) {
      seen.add(projectile.id);
      let mesh = this.projectileMeshes.get(projectile.id);
      if (!mesh) {
        const hostile = projectile.owner === "enemy";
        const color = projectile.kind?.toLowerCase().includes("fire") ? 0xff7a32 : hostile ? 0xb873ff : 0x76dcff;
        const mat = new THREE.MeshBasicMaterial({ color });
        mesh = new THREE.Mesh(projectile.kind?.includes("Arrow") ? new THREE.ConeGeometry(.035, .42, 6) : new THREE.IcosahedronGeometry(.1, 1), mat);
        this.projectileMeshes.set(projectile.id, mesh);
        this.projectileGroup.add(mesh);
      }
      mesh.position.set(projectile.x, .95 + Math.sin(elapsed * 12) * .04, projectile.y);
      mesh.rotation.z += .16;
      mesh.rotation.x += .12;
    }
    for (const [id, mesh] of this.projectileMeshes) if (!seen.has(id)) {
      this.projectileGroup.remove(mesh);
      this.projectileMeshes.delete(id);
    }
  }

  #updateCamera(world, elapsed) {
    const player = world.player;
    const moving = Math.abs(world.stepAccumulator || 0) > .01;
    const walkBob = moving ? Math.sin(elapsed * 8.5) * .018 : Math.sin(elapsed * 1.8) * .006;
    this.camera.position.set(player.x, EYE_HEIGHT + walkBob, player.y);
    this.camera.rotation.y = -player.direction - Math.PI / 2;
    this.camera.rotation.x = clamp(player.pitch || 0, -.65, .65);
    const view = world.getCombatView();
    const cooldown = view.cooldown || 0;
    const swing = cooldown > 0 ? clamp(cooldown / .75, 0, 1) : 0;
    const attackArc = Math.sin((1 - swing) * Math.PI);
    this.weapon.rotation.z = -.12 - attackArc * .78;
    this.weapon.rotation.x = -.05 + attackArc * .24;
    this.weapon.rotation.y = .2 - attackArc * .18;
    this.weapon.position.x = .64 - attackArc * .2;
    this.weapon.position.y = -.58 + Math.sin(elapsed * 1.7) * .008 + attackArc * .13;
  }
}
