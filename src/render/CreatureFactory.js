import * as THREE from "../../vendor/three.module.min.js";

function material(color, options = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? .78,
    metalness: options.metalness ?? .04,
    emissive: options.emissive || 0x000000,
    emissiveIntensity: options.emissiveIntensity || 0,
    transparent: Boolean(options.transparent),
    opacity: options.opacity ?? 1,
    flatShading: true,
    side: options.side || THREE.FrontSide,
  });
}

function part(group, geometry, mat, position, scale = [1, 1, 1], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(...position); mesh.scale.set(...scale); mesh.rotation.set(...rotation);
  mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh); return mesh;
}

function pivot(root, role, position) {
  const group = new THREE.Group();
  group.position.set(...position); group.userData.motionRole = role; root.add(group); return group;
}

function edges(root, color = 0x08080a, opacity = .42) {
  root.traverse((child) => {
    if (!child.isMesh || child.geometry.type === "PlaneGeometry" || child.geometry.type === "RingGeometry") return;
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(child.geometry, 30), new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
    lines.scale.setScalar(1.005); child.add(lines);
  });
  return root;
}

function humanoid(options = {}) {
  const g = new THREE.Group();
  const armor = material(options.armor || 0x4b5158, { metalness: .68, roughness: .3, emissive: options.spectral ? 0x102038 : 0, emissiveIntensity: options.spectral ? .6 : 0 });
  const dark = material(options.dark || 0x262a30, { metalness: .5, roughness: .42 });
  const cloth = material(options.cloth || 0x28252b, { roughness: .96, transparent: options.spectral, opacity: options.spectral ? .88 : 1, emissive: options.spectral ? 0x150f27 : 0, emissiveIntensity: options.spectral ? .45 : 0 });
  const skin = material(options.skin || 0x7f5a45, { roughness: .9 });
  const bone = material(0xb9ad94, { roughness: .84 });
  part(g, new THREE.CylinderGeometry(.28, .34, .72, 8), cloth, [0, .9, 0], [1, 1, .75]);
  part(g, new THREE.CylinderGeometry(.35, .3, .48, 8), armor, [0, 1.28, 0], [1, 1, .76]);
  part(g, new THREE.BoxGeometry(.65, .12, .34), dark, [0, 1.45, 0]);
  part(g, new THREE.SphereGeometry(.22, 10, 7), options.helmet === false ? skin : dark, [0, 1.7, -.01], [1, 1, .94]);
  if (options.helmet !== false) {
    part(g, new THREE.ConeGeometry(.24, .28, 7), armor, [0, 1.93, 0]);
    part(g, new THREE.BoxGeometry(.37, .04, .24), material(0x0d0e12, { metalness: .2 }), [0, 1.7, -.2]);
    for (const x of [-.12, -.04, .04, .12]) part(g, new THREE.BoxGeometry(.017, .15, .017), bone, [x, 1.7, -.224]);
  }
  for (const side of [-1, 1]) {
    const arm = pivot(g, side < 0 ? "armL" : "armR", [side * .4, 1.37, 0]);
    part(arm, new THREE.SphereGeometry(.17, 8, 6), armor, [0, 0, 0], [1.12, .72, 1]);
    part(arm, new THREE.CapsuleGeometry(.075, .43, 4, 7), dark, [0, -.33, 0]);
    const leg = pivot(g, side < 0 ? "legL" : "legR", [side * .16, .66, 0]);
    part(leg, new THREE.CapsuleGeometry(.09, .48, 4, 7), cloth, [0, -.26, 0]);
    part(leg, new THREE.BoxGeometry(.2, .14, .36), armor, [0, -.58, -.02]);
  }
  if (options.cape) {
    const cape = part(g, new THREE.PlaneGeometry(.9, 1.48, 3, 5), material(options.cape, { roughness: 1, transparent: options.spectral, opacity: options.spectral ? .72 : 1, side: THREE.DoubleSide }), [0, .86, .23]);
    cape.userData.motionRole = "cape";
  }
  return g;
}

function weaponSword(g, position = [.62, 1.15, -.02], color = 0xa9b0b4, length = 1.55) {
  const steel = material(color, { metalness: .84, roughness: .2 });
  part(g, new THREE.BoxGeometry(.1, length, .075), steel, position, [1, 1, 1], [0, 0, -.15]);
  part(g, new THREE.ConeGeometry(.15, .42, 4), steel, [position[0] + .11, position[1] + length * .55, position[2]], [1, 1, 1], [0, 0, -.15]);
}

function hound() {
  const g = new THREE.Group();
  const fur = material(0x252c34, { roughness: .96 });
  const plate = material(0x48505a, { metalness: .62, roughness: .34 });
  const bone = material(0xc2b395, { roughness: .82 });
  const eye = material(0x78d9ff, { emissive: 0x2189bc, emissiveIntensity: 3.0, roughness: .1 });
  part(g, new THREE.CapsuleGeometry(.31, .72, 6, 10), fur, [0, .62, .12], [1.35, .82, .85], [Math.PI / 2, 0, 0]);
  part(g, new THREE.CapsuleGeometry(.25, .48, 5, 9), plate, [0, .79, .04], [1.35, .62, .78], [Math.PI / 2, 0, 0]);
  const head = pivot(g, "head", [0, .72, -.58]);
  part(head, new THREE.SphereGeometry(.28, 10, 7), fur, [0, 0, 0], [1.1, .86, 1.2]);
  part(head, new THREE.ConeGeometry(.19, .48, 7), fur, [0, -.1, -.34], [1, .75, 1], [Math.PI / 2, 0, 0]);
  part(head, new THREE.BoxGeometry(.35, .08, .31), bone, [0, -.17, -.5]);
  for (const side of [-1, 1]) {
    part(head, new THREE.ConeGeometry(.1, .34, 5), fur, [side * .16, .31, 0], [1, 1, 1], [-.22, 0, side * .14]);
    part(head, new THREE.SphereGeometry(.042, 7, 5), eye, [side * .09, .06, -.27]);
    for (const z of [-.2, .36]) {
      const leg = pivot(g, side < 0 ? (z < 0 ? "legL" : "legL2") : (z < 0 ? "legR" : "legR2"), [side * .29, .4, z]);
      part(leg, new THREE.CapsuleGeometry(.055, .48, 4, 7), fur, [0, -.11, 0]);
      part(leg, new THREE.BoxGeometry(.15, .08, .22), bone, [0, -.35, -.03]);
    }
  }
  for (let i = 0; i < 5; i += 1) part(g, new THREE.ConeGeometry(.07, .3, 5), bone, [0, .98, .15 + i * .18], [1, 1, 1], [Math.PI / 2, 0, 0]);
  return edges(g);
}

function crawler() {
  const g = new THREE.Group();
  const shell = material(0x46552c, { metalness: .18, roughness: .55 });
  const shell2 = material(0x768038, { roughness: .6 });
  const under = material(0x171b13, { roughness: .96 });
  const poison = material(0xb7ec4d, { emissive: 0x4f7e15, emissiveIntensity: 2.4, roughness: .2 });
  for (let i = 0; i < 5; i += 1) part(g, new THREE.SphereGeometry(.25 + i * .015, 9, 6), i % 2 ? shell : shell2, [0, .38, .45 - i * .25], [1.1, .65, 1.05]);
  const head = pivot(g, "head", [0, .36, -.72]);
  part(head, new THREE.SphereGeometry(.37, 10, 7), under, [0, 0, 0], [1.15, .72, .9]);
  for (const side of [-1, 1]) part(head, new THREE.ConeGeometry(.12, .5, 6), shell2, [side * .18, -.01, -.34], [1, 1, 1], [Math.PI / 2, 0, side * .18]);
  for (let i = 0; i < 4; i += 1) for (const side of [-1, 1]) {
    const leg = pivot(g, side < 0 ? `legL${i}` : `legR${i}`, [side * .38, .34, .35 - i * .3]);
    part(leg, new THREE.CylinderGeometry(.035, .055, .62, 6), shell, [side * .06, 0, 0], [1, 1, 1], [0, 0, side * .98]);
    part(leg, new THREE.CylinderGeometry(.025, .035, .56, 6), under, [side * .39, -.22, 0], [1, 1, 1], [0, 0, side * .36]);
  }
  for (const x of [-.15, 0, .15]) part(head, new THREE.SphereGeometry(.035, 7, 5), poison, [x, .13, -.27]);
  return edges(g);
}

function raider(champion = false) {
  const g = humanoid({ armor: champion ? 0x65594d : 0x544b45, cloth: champion ? 0x3b241d : 0x241c19, skin: 0x77513e, helmet: champion, cape: 0x2a1614 });
  const hood = material(0x211b1c, { roughness: .98 });
  const leather = material(0x5b351f, { roughness: .87 });
  const iron = material(0x9a9488, { metalness: .72, roughness: .3 });
  if (!champion) part(g, new THREE.ConeGeometry(.34, .56, 8, 1, true), hood, [0, 1.73, .02], [1, 1, 1], [0, 0, Math.PI]);
  if (champion) {
    weaponSword(g, [.68, 1.12, -.02], 0xb6a589, 1.72);
    part(g, new THREE.CylinderGeometry(.42, .42, .09, 12), iron, [-.56, 1.12, .04], [1, 1, 1], [Math.PI / 2, 0, 0]);
    g.scale.setScalar(1.15);
  } else {
    part(g, new THREE.TorusGeometry(.38, .035, 7, 22, Math.PI * 1.7), leather, [.53, 1.07, -.02], [1, 1, 1], [0, .2, Math.PI / 2]);
    part(g, new THREE.CylinderGeometry(.012, .012, .78, 5), iron, [.61, 1.06, -.02], [1, 1, 1], [0, 0, -.17]);
    part(g, new THREE.CylinderGeometry(.16, .18, .6, 8), leather, [-.47, 1.05, .18], [1, .7, 1]);
  }
  return edges(g);
}

function sentinel(knight = false) {
  const g = humanoid({ armor: knight ? 0x706a73 : 0x555d68, cloth: knight ? 0x3b1825 : 0x171a20, skin: 0x82705d, helmet: true, cape: knight ? 0x5b1730 : 0x151724, spectral: !knight });
  const steel = material(knight ? 0xb2a7b2 : 0x89939e, { metalness: .82, roughness: .23, emissive: knight ? 0 : 0x10273b, emissiveIntensity: knight ? 0 : .6 });
  const glow = material(knight ? 0xffbd72 : 0x7edcff, { emissive: knight ? 0x8a4018 : 0x2f9ac4, emissiveIntensity: 3, roughness: .12 });
  weaponSword(g, [.68, 1.08, 0], knight ? 0xc3b5bb : 0x89939e, 1.62);
  part(g, new THREE.CylinderGeometry(.43, .43, .09, 12), steel, [-.55, 1.08, .04], [1, 1, 1], [Math.PI / 2, 0, 0]);
  part(g, new THREE.CylinderGeometry(.08, .08, .1, 12), glow, [-.55, 1.08, -.03], [1, 1, 1], [Math.PI / 2, 0, 0]);
  g.scale.setScalar(knight ? 1.1 : 1.18);
  return edges(g);
}

function shade(color = 0x251834, glowColor = 0xc889ff) {
  const g = new THREE.Group();
  const robe = material(color, { roughness: .92, transparent: true, opacity: .88, emissive: new THREE.Color(color).multiplyScalar(.55), emissiveIntensity: 1.2, side: THREE.DoubleSide });
  const bone = material(0xa99cb0, { roughness: .75, emissive: 0x241a36, emissiveIntensity: .6 });
  const glow = material(glowColor, { emissive: new THREE.Color(glowColor).multiplyScalar(.55), emissiveIntensity: 3.4, roughness: .1 });
  part(g, new THREE.ConeGeometry(.48, 1.55, 12, 3, true), robe, [0, .74, 0], [1, 1, 1], [0, 0, Math.PI]);
  const head = pivot(g, "head", [0, 1.46, 0]);
  part(head, new THREE.SphereGeometry(.23, 10, 7), bone, [0, 0, 0], [.9, 1.08, .88]);
  for (const side of [-1, 1]) {
    const arm = pivot(g, side < 0 ? "armL" : "armR", [side * .35, 1.18, 0]);
    part(arm, new THREE.CapsuleGeometry(.045, .62, 4, 7), bone, [side * .07, -.18, -.02], [1, 1, 1], [0, 0, side * .35]);
    part(head, new THREE.SphereGeometry(.038, 7, 5), glow, [side * .075, .04, -.2]);
  }
  for (let i = 0; i < 3; i += 1) {
    const ring = part(g, new THREE.TorusGeometry(.28 + i * .12, .018, 5, 22), glow, [0, .75 + i * .22, 0], [1, 1, 1], [Math.PI / 2, 0, 0]);
    ring.userData.orbit = i;
  }
  return edges(g, 0x08060b);
}

function drownedMonk() {
  const g = humanoid({ armor: 0x465b59, cloth: 0x172b2d, skin: 0x6c8177, helmet: false, cape: 0x1c3334, spectral: true });
  const hood = material(0x102629, { transparent: true, opacity: .9, emissive: 0x123f45, emissiveIntensity: .7, side: THREE.DoubleSide });
  part(g, new THREE.ConeGeometry(.38, .65, 10, 1, true), hood, [0, 1.76, 0], [1, 1, 1], [0, 0, Math.PI]);
  const lantern = material(0x71d0cf, { emissive: 0x297b79, emissiveIntensity: 2.8, roughness: .15 });
  part(g, new THREE.OctahedronGeometry(.16), lantern, [.58, .82, -.08]);
  return edges(g, 0x061010);
}

function glassStalker() {
  const g = new THREE.Group();
  const hide = material(0x23383e, { roughness: .72, emissive: 0x10242a, emissiveIntensity: .35 });
  const crystal = material(0x84c8cf, { roughness: .18, metalness: .15, emissive: 0x245761, emissiveIntensity: 1.4 });
  part(g, new THREE.CapsuleGeometry(.28, .82, 6, 10), hide, [0, .55, .08], [1.4, .7, .82], [Math.PI / 2, 0, 0]);
  const head = pivot(g, "head", [0, .65, -.64]);
  part(head, new THREE.SphereGeometry(.25, 10, 7), hide, [0, 0, 0], [1.05, .78, 1.2]);
  part(head, new THREE.ConeGeometry(.17, .48, 6), hide, [0, -.08, -.35], [1, .7, 1], [Math.PI / 2, 0, 0]);
  for (let i = 0; i < 7; i += 1) part(g, new THREE.ConeGeometry(.07 + i * .006, .42 + i * .04, 5), crystal, [0, .88, -.05 + i * .16], [1, 1, 1], [Math.PI / 2, 0, 0]);
  for (const side of [-1, 1]) for (const z of [-.25, .35]) {
    const leg = pivot(g, side < 0 ? `legL${z}` : `legR${z}`, [side * .32, .4, z]);
    part(leg, new THREE.CapsuleGeometry(.055, .46, 4, 7), hide, [0, -.13, 0]);
  }
  return edges(g, 0x071013);
}

function wisp(mirror = false) {
  const g = new THREE.Group();
  const coreColor = mirror ? 0xc3f1f0 : 0xa06ce1;
  const core = material(coreColor, { emissive: mirror ? 0x3d9291 : 0x5a2788, emissiveIntensity: 3.6, roughness: .08, transparent: true, opacity: .88 });
  const shell = material(mirror ? 0x668a91 : 0x49345e, { metalness: .65, roughness: .2, transparent: true, opacity: .72 });
  part(g, new THREE.IcosahedronGeometry(.22, 1), core, [0, .92, 0]);
  for (let i = 0; i < 3; i += 1) {
    const ring = part(g, new THREE.TorusGeometry(.34 + i * .12, .025, 6, 24), shell, [0, .92, 0], [1, 1, 1], [i * .7, i * .4, 0]);
    ring.userData.orbit = i + 1;
  }
  for (let i = 0; i < 4; i += 1) {
    const shard = part(g, new THREE.OctahedronGeometry(.09), core, [Math.cos(i * Math.PI / 2) * .48, .92, Math.sin(i * Math.PI / 2) * .48]);
    shard.userData.orbit = i + 4;
  }
  g.userData.floating = true;
  return edges(g, 0x05070a, .3);
}

function archiveWraith() {
  const g = shade(0x1b1721, 0xd2a4ff);
  const book = material(0x5b3024, { roughness: .72, emissive: 0x2b1310, emissiveIntensity: .3 });
  const page = material(0xd1c6a8, { roughness: .92, side: THREE.DoubleSide });
  part(g, new THREE.BoxGeometry(.52, .08, .72), book, [0, .92, -.5], [1, 1, 1], [.3, 0, 0]);
  part(g, new THREE.PlaneGeometry(.42, .62), page, [-.12, .95, -.51], [1, 1, 1], [-1.3, 0, -.08]);
  part(g, new THREE.PlaneGeometry(.42, .62), page, [.12, .95, -.51], [1, 1, 1], [-1.3, 0, .08]);
  return g;
}

function golem() {
  const g = new THREE.Group();
  const stone = material(0x27252d, { roughness: .68, metalness: .22, emissive: 0x140d22, emissiveIntensity: .25 });
  const crystal = material(0xaa6ed4, { emissive: 0x5a2782, emissiveIntensity: 3.2, roughness: .12 });
  part(g, new THREE.DodecahedronGeometry(.46, 0), stone, [0, 1.13, 0], [1.15, 1.25, .8]);
  part(g, new THREE.DodecahedronGeometry(.29, 0), stone, [0, 1.82, -.04], [1, .9, .92]);
  for (const side of [-1, 1]) {
    const arm = pivot(g, side < 0 ? "armL" : "armR", [side * .5, 1.42, 0]);
    part(arm, new THREE.DodecahedronGeometry(.23, 0), stone, [side * .12, -.12, 0]);
    part(arm, new THREE.BoxGeometry(.28, .64, .3), stone, [side * .22, -.48, 0]);
    const leg = pivot(g, side < 0 ? "legL" : "legR", [side * .22, .76, 0]);
    part(leg, new THREE.BoxGeometry(.34, .72, .4), stone, [0, -.34, 0]);
  }
  part(g, new THREE.OctahedronGeometry(.15), crystal, [0, 1.25, -.38]);
  for (const x of [-.11, .11]) part(g, new THREE.SphereGeometry(.035, 7, 5), crystal, [x, 1.86, -.25]);
  g.scale.setScalar(1.25);
  return edges(g, 0x050407);
}

function boss(finalBoss = false) {
  const g = humanoid({ armor: finalBoss ? 0x292735 : 0x3e4857, cloth: 0x0d0d15, skin: 0x645b59, helmet: true, cape: 0x0d0815, spectral: true });
  const voidSteel = material(finalBoss ? 0x394251 : 0x596673, { metalness: .78, roughness: .2, emissive: finalBoss ? 0x160b2f : 0x102b3d, emissiveIntensity: 1.05 });
  const glow = material(finalBoss ? 0xb26cff : 0x6ec9e8, { emissive: finalBoss ? 0x6b25bd : 0x26799a, emissiveIntensity: 3.3, roughness: .1 });
  for (let i = -3; i <= 3; i += 1) part(g, new THREE.ConeGeometry(.065, .42 + Math.abs(i) * .08, 5), voidSteel, [i * .09, 2.03, 0], [1, 1, 1], [0, 0, i * .08]);
  weaponSword(g, [.72, 1.15, -.05], finalBoss ? 0xb26cff : 0xa4d5e3, 1.78);
  part(g, new THREE.OctahedronGeometry(.12), glow, [0, 1.42, -.28]);
  for (const side of [-1, 1]) {
    part(g, new THREE.CylinderGeometry(.04, .08, .82, 6), voidSteel, [side * .58, 1.76, .06], [1, 1, 1], [0, 0, side * .58]);
    part(g, new THREE.ConeGeometry(.09, .38, 5), voidSteel, [side * .84, 2.02, .06], [1, 1, 1], [0, 0, side * .58]);
  }
  g.scale.setScalar(finalBoss ? 1.48 : 1.28);
  return edges(g, 0x050407);
}

function voidHerald() {
  const g = shade(0x16101f, 0xe0a2ff);
  const wing = material(0x251532, { transparent: true, opacity: .76, emissive: 0x1d0a2d, emissiveIntensity: .9, side: THREE.DoubleSide });
  for (const side of [-1, 1]) {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0); shape.lineTo(side * .85, .65); shape.lineTo(side * .58, -.45); shape.lineTo(side * .2, -.75); shape.closePath();
    const mesh = part(g, new THREE.ShapeGeometry(shape), wing, [0, 1.25, .15], [1, 1, 1], [0, 0, 0]);
    mesh.userData.motionRole = side < 0 ? "wingL" : "wingR";
  }
  return edges(g, 0x030205);
}


function lightweightHumanoid(primary = 0x4f5661, accent = 0x252831, spectral = false, bossScale = 1) {
  const g = new THREE.Group();
  const body = material(primary, { metalness: .45, roughness: .48, transparent: spectral, opacity: spectral ? .88 : 1, emissive: spectral ? 0x101c35 : 0, emissiveIntensity: spectral ? .55 : 0 });
  const cloth = material(accent, { roughness: .94, transparent: spectral, opacity: spectral ? .82 : 1 });
  const glow = material(spectral ? 0x75d7ff : 0xd4a85b, { emissive: spectral ? 0x276f96 : 0x4e2d10, emissiveIntensity: 1.8, roughness: .2 });
  part(g, new THREE.CylinderGeometry(.3, .36, .85, 6), cloth, [0, .9, 0], [1, 1, .76]);
  part(g, new THREE.BoxGeometry(.62, .42, .34), body, [0, 1.34, 0]);
  part(g, new THREE.SphereGeometry(.21, 7, 5), body, [0, 1.68, 0]);
  part(g, new THREE.SphereGeometry(.035, 5, 4), glow, [-.075, 1.7, -.19]);
  part(g, new THREE.SphereGeometry(.035, 5, 4), glow, [.075, 1.7, -.19]);
  for (const side of [-1, 1]) {
    const arm = pivot(g, side < 0 ? "armL" : "armR", [side * .39, 1.38, 0]);
    part(arm, new THREE.CapsuleGeometry(.065, .42, 2, 5), body, [0, -.26, 0]);
    const leg = pivot(g, side < 0 ? "legL" : "legR", [side * .16, .62, 0]);
    part(leg, new THREE.CapsuleGeometry(.075, .48, 2, 5), cloth, [0, -.28, 0]);
  }
  part(g, new THREE.BoxGeometry(.07, 1.26, .055), body, [.57, 1.08, 0], [1, 1, 1], [0, 0, -.15]);
  g.scale.setScalar(bossScale);
  g.userData.lightweight = true;
  return g;
}

function lightweightHound() {
  const g = new THREE.Group();
  const hide = material(0x29323b, { roughness: .9 });
  const bone = material(0xa99f8c, { roughness: .78 });
  const glow = material(0x7adfff, { emissive: 0x246f92, emissiveIntensity: 2.2, roughness: .15 });
  part(g, new THREE.CapsuleGeometry(.26, .62, 3, 6), hide, [0, .58, .08], [1.25, .78, .82], [Math.PI / 2, 0, 0]);
  const head = pivot(g, "head", [0, .66, -.5]);
  part(head, new THREE.SphereGeometry(.25, 7, 5), hide, [0, 0, 0], [1.05, .86, 1.1]);
  part(head, new THREE.ConeGeometry(.16, .4, 5), hide, [0, -.08, -.29], [1, .7, 1], [Math.PI / 2, 0, 0]);
  part(head, new THREE.SphereGeometry(.035, 5, 4), glow, [-.08, .05, -.23]);
  part(head, new THREE.SphereGeometry(.035, 5, 4), glow, [.08, .05, -.23]);
  for (const side of [-1, 1]) for (const z of [-.18, .28]) {
    const leg = pivot(g, side < 0 ? `legL${z}` : `legR${z}`, [side * .25, .38, z]);
    part(leg, new THREE.CapsuleGeometry(.045, .38, 2, 5), hide, [0, -.2, 0]);
  }
  for (let i = 0; i < 3; i += 1) part(g, new THREE.ConeGeometry(.055, .22, 5), bone, [0, .88, .02 + i * .2], [1, 1, 1], [Math.PI / 2, 0, 0]);
  g.userData.lightweight = true;
  return g;
}

function lightweightCrawler() {
  const g = new THREE.Group();
  const shell = material(0x59632f, { roughness: .62, metalness: .12 });
  const under = material(0x1b2016, { roughness: .95 });
  const glow = material(0xb7ee58, { emissive: 0x496f14, emissiveIntensity: 2, roughness: .2 });
  part(g, new THREE.SphereGeometry(.38, 7, 5), shell, [0, .38, .1], [1.2, .65, 1.35]);
  part(g, new THREE.SphereGeometry(.28, 7, 5), under, [0, .35, -.45], [1.05, .7, .9]);
  for (let i = 0; i < 3; i += 1) for (const side of [-1, 1]) {
    const leg = pivot(g, side < 0 ? `legL${i}` : `legR${i}`, [side * .35, .34, -.25 + i * .28]);
    part(leg, new THREE.CylinderGeometry(.025, .045, .58, 4), shell, [side * .2, -.08, 0], [1, 1, 1], [0, 0, side * .78]);
  }
  for (const x of [-.12, 0, .12]) part(g, new THREE.SphereGeometry(.03, 5, 4), glow, [x, .48, -.67]);
  g.userData.lightweight = true;
  return g;
}

function lightweightShade(color = 0x302044, glowColor = 0xc88aff, scale = 1) {
  const g = new THREE.Group();
  const robe = material(color, { transparent: true, opacity: .78, emissive: color, emissiveIntensity: .6, roughness: .8, side: THREE.DoubleSide });
  const glow = material(glowColor, { emissive: glowColor, emissiveIntensity: 2.5, roughness: .1 });
  part(g, new THREE.ConeGeometry(.4, 1.25, 7, 1, true), robe, [0, .63, 0], [1, 1, 1], [0, 0, Math.PI]);
  const head = pivot(g, "head", [0, 1.34, 0]);
  part(head, new THREE.SphereGeometry(.22, 7, 5), robe, [0, 0, 0]);
  part(head, new THREE.SphereGeometry(.035, 5, 4), glow, [-.07, .03, -.18]);
  part(head, new THREE.SphereGeometry(.035, 5, 4), glow, [.07, .03, -.18]);
  g.userData.floating = true;
  g.userData.lightweight = true;
  g.scale.setScalar(scale);
  return g;
}

function lightweightGolem() {
  const g = new THREE.Group();
  const stone = material(0x343842, { roughness: .72, metalness: .18 });
  const glow = material(0xa36bff, { emissive: 0x5c27a2, emissiveIntensity: 2.4, roughness: .12 });
  part(g, new THREE.BoxGeometry(.85, .8, .55), stone, [0, 1.05, 0]);
  part(g, new THREE.BoxGeometry(.42, .38, .38), stone, [0, 1.63, 0]);
  part(g, new THREE.OctahedronGeometry(.11), glow, [0, 1.08, -.31]);
  for (const side of [-1, 1]) {
    const arm = pivot(g, side < 0 ? "armL" : "armR", [side * .58, 1.2, 0]);
    part(arm, new THREE.BoxGeometry(.28, .82, .3), stone, [0, -.3, 0]);
    const leg = pivot(g, side < 0 ? "legL" : "legR", [side * .22, .62, 0]);
    part(leg, new THREE.BoxGeometry(.3, .72, .34), stone, [0, -.3, 0]);
  }
  g.userData.lightweight = true;
  g.scale.setScalar(1.15);
  return g;
}

export function createLightweightCreatureModel(enemyId) {
  switch (enemyId) {
    case "echoHound": return lightweightHound();
    case "mireCrawler": return lightweightCrawler();
    case "echoShade":
    case "mirrorWisp":
    case "archiveWraith": return lightweightShade(enemyId === "mirrorWisp" ? 0x263657 : 0x302044, enemyId === "mirrorWisp" ? 0x79dfff : 0xc88aff, enemyId === "archiveWraith" ? 1.18 : 1);
    case "obsidianGolem": return lightweightGolem();
    case "morKharr": return lightweightHumanoid(0x252a36, 0x111018, true, 1.48);
    case "voidHerald":
    case "echoWarden": return lightweightHumanoid(0x404958, 0x171a24, true, 1.22);
    case "crownKnight": return lightweightHumanoid(0x6b6570, 0x321823, false, 1.12);
    case "ashChampion": return lightweightHumanoid(0x65584b, 0x35221d, false, 1.12);
    case "drownedMonk": return lightweightHumanoid(0x40545c, 0x1c3237, true, 1.02);
    case "glassStalker": return lightweightHumanoid(0x526873, 0x1e2930, true, 1.05);
    case "harborCutthroat":
    case "ashRaider": return lightweightHumanoid(0x55483f, 0x271c18, false, 1);
    case "hollowSentinel": return lightweightHumanoid(0x555e69, 0x171a20, true, 1.12);
    default: return lightweightHumanoid();
  }
}

export function createCreatureModel(enemyId) {
  switch (enemyId) {
    case "echoHound": return hound();
    case "mireCrawler": return crawler();
    case "ashRaider": return raider(false);
    case "ashChampion": return raider(true);
    case "harborCutthroat": return raider(false);
    case "hollowSentinel": return sentinel(false);
    case "crownKnight": return sentinel(true);
    case "echoShade": return shade();
    case "drownedMonk": return drownedMonk();
    case "glassStalker": return glassStalker();
    case "mirrorWisp": return wisp(true);
    case "archiveWraith": return archiveWraith();
    case "obsidianGolem": return golem();
    case "voidHerald": return voidHerald();
    case "morKharr": return boss(true);
    case "echoWarden": return boss(false);
    default: return sentinel(false);
  }
}

export function animateCreatureModel(root, elapsed, active = false, attackPulse = 0) {
  const stride = active ? Math.sin(elapsed * 6.2) : Math.sin(elapsed * 1.8) * .16;
  root.traverse((child) => {
    const role = child.userData?.motionRole;
    if (!role) return;
    const side = role.includes("L") ? 1 : -1;
    if (role.startsWith("arm")) child.rotation.x = side * stride * .24 - attackPulse * .65;
    else if (role.startsWith("leg")) child.rotation.x = -side * stride * .22;
    else if (role === "head") child.rotation.y = Math.sin(elapsed * 1.3) * .04;
    else if (role === "cape") child.rotation.x = .05 + Math.sin(elapsed * 1.7) * .03;
    else if (role.startsWith("wing")) child.rotation.y = side * (.18 + Math.sin(elapsed * 2.4) * .08);
  });
  if (root.userData.floating) root.position.y += .18 + Math.sin(elapsed * 2.2) * .08;
}
