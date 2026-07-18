(() => {
  "use strict";

  const byId = id => document.getElementById(id);
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
  const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const random = (min, max) => min + Math.random() * (max - min);
  const choose = arr => arr[Math.floor(Math.random() * arr.length)];
  const angleDelta = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
  const escapeHtml = value => String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]);

  const app = byId("app");
  const canvas = byId("gameCanvas");
  const context = canvas.getContext("2d", { alpha: false, desynchronized: true });

  if (!context) throw new Error("Canvas 2D není v tomto prohlížeči dostupný.");

  const screens = {
    menu: byId("menuScreen"), brief: byId("briefScreen"), dialog: byId("dialogScreen"),
    dig: byId("digScreen"), identify: byId("identifyScreen"), theft: byId("theftScreen"),
    pause: byId("pauseScreen"), how: byId("howScreen"), jury: byId("juryScreen"), result: byId("resultScreen")
  };

  const ui = {
    hud: byId("hud"), controls: byId("controls"), levelNumber: byId("levelNumber"), levelName: byId("levelName"),
    objectiveText: byId("objectiveText"), stoneCount: byId("stoneCount"), dangerHud: byId("dangerHud"),
    dangerState: byId("dangerState"), dangerFill: byId("dangerFill"), bossHud: byId("bossHud"),
    bossHudName: byId("bossHudName"), bossState: byId("bossState"), bossFill: byId("bossFill"),
    toast: byId("toast"), actionButton: byId("actionButton"), actionIcon: byId("actionIcon"), actionLabel: byId("actionLabel"),
    joystick: byId("joystick"), joystickKnob: byId("joystickKnob")
  };

  const SAVE_KEY = "lovecVltavinuCleanV6";
  const RECORD_KEY = "lovecVltavinuCleanRecordsV6";
  const IS_TOUCH = navigator.maxTouchPoints > 0 || "ontouchstart" in window || matchMedia("(pointer:coarse)").matches;

  const storage = {
    get(key) { try { return localStorage.getItem(key); } catch { return null; } },
    set(key, value) { try { localStorage.setItem(key, value); return true; } catch { return false; } },
    remove(key) { try { localStorage.removeItem(key); } catch {} }
  };

  const LEVELS = [
    {
      id: "chlum", name: "Chlum", title: "Chlum po bouřce", theme: "field", music: "field",
      description: "Promluv s Václavem, získej souhlas a projdi otevřené rozorané pole. Po dešti jsou zelené záblesky lépe vidět, ale mezi brázdami znovu pracuje velký traktor.",
      goal: "Získej souhlas a najdi 4 pravé vltavíny.",
      why: "Tahle lokalita musí položit základ sbírky, kterou na konci představíš porotě v KD Slávie."
    },
    {
      id: "locenice", name: "Ločenice", title: "Písčitý borový les", theme: "sandforest", music: "meadow",
      description: "Projdi řídký borový les se světlými písčitými valy a starými prohlubněmi. Mezi pravými kusy leží i lahvové střepy.",
      goal: "Správně urči alespoň 5 vzorků a získej 3 pravé kusy.",
      why: "Nejlepší sbírka není největší hromada. Musíš prokázat, že poznáš přírodní vltavín od obyčejného skla."
    },
    {
      id: "nesmen", name: "Nesměň", title: "Lesní profily", theme: "forest", music: "forest",
      description: "V písčitém lese můžeš otevřít pouze čisté obdélníkové profily. Každý profil po vyzvednutí nálezu znovu zahrab.",
      goal: "Vykopej a zahrab 3 profily.",
      why: "Porota hodnotí také doložený a odpovědný způsob sběru. Otevřená jáma po tobě zůstat nesmí."
    },
    {
      id: "besednice", name: "Besednice", title: "Ježková těžební plocha", theme: "night", music: "night",
      description: "Na okraji rozryté těžební plochy najdi tři stopy vedoucí k ježkovému profilu. Ve tmě hlídá terén kopáč a vzácný kus chce ukrást Krystalový Karel.",
      goal: "Najdi 3 stopy, vykopej ježkový profil a získej kámen zpět od Karla.",
      why: "Besednický ježek je nejsilnější kus celé výpravy a může rozhodnout hlavní cenu události Na zelené vlně."
    },
    {
      id: "malse", name: "Malše a Slávie", title: "Poslední cesta na výstavu", theme: "city", music: "city",
      description: "Projdi nábřeží Malše, posbírej tři části dokumentace a dožeň Frantu, který utíká k výrazné budově KD Slávie.",
      goal: "Získej dokumentaci, poraz Frantu a vstup do KD Slávie.",
      why: "Bez dokumentů a posledního certifikátu nemůžeš před porotou obhájit původ nejlepší sbírky."
    }
  ];

  const SAMPLES = [
    { real: true, name: "Olivový úlomek", text: "Matný leptaný povrch, nepravidelná hrana a proměnlivá průsvitnost." },
    { real: false, name: "Lahvový střep", text: "Hladká plochá stěna, pravidelná tloušťka a ostrý průmyslový lom." },
    { real: true, name: "Hnědozelený splash", text: "Zvlněná skulptace, různá tloušťka a přirozeně nepravidelný tvar." },
    { real: false, name: "Zelený odlitek", text: "Stejnoměrná barva, kulaté okraje a opakující se povrch." },
    { real: true, name: "Drobný celotvar", text: "Jemně leptaný povrch a vnitřní struktura viditelná proti světlu." },
    { real: false, name: "Lesklé sklo", text: "Dokonale hladký lesk a nepřirozeně sytá zelená barva." }
  ];

  class MusicManager {
    constructor() {
      this.enabled = true;
      this.theme = null;
      this.audio = new Audio();
      this.audio.loop = true;
      this.audio.preload = "auto";
      this.audio.playsInline = true;
      this.audio.volume = 0.28;
      this.context = null;
      this.sfxGain = null;
      this.tracks = {
        field: "./assets/audio/music/field.wav", meadow: "./assets/audio/music/meadow.wav",
        forest: "./assets/audio/music/forest.wav", night: "./assets/audio/music/night.wav", city: "./assets/audio/music/city.wav"
      };
    }
    unlock() {
      if (!this.context) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) {
          this.context = new AC();
          this.sfxGain = this.context.createGain();
          this.sfxGain.gain.value = 0.45;
          this.sfxGain.connect(this.context.destination);
        }
      }
      if (this.context?.state === "suspended") this.context.resume().catch(() => {});
    }
    setTheme(theme) {
      if (this.theme === theme) { this.play(); return; }
      this.theme = theme;
      const source = this.tracks[theme];
      if (!source) return;
      this.audio.pause();
      this.audio.src = source;
      this.audio.currentTime = 0;
      this.play();
    }
    play() { if (this.enabled && this.audio.src) this.audio.play().catch(() => {}); }
    pause() { this.audio.pause(); }
    toggle() { this.enabled = !this.enabled; if (this.enabled) this.play(); else this.pause(); return this.enabled; }
    tone(frequency, duration = 0.12, type = "triangle", volume = 0.12, slide = 0) {
      if (!this.enabled || !this.context || !this.sfxGain) return;
      const now = this.context.currentTime;
      const oscillator = this.context.createOscillator();
      const gain = this.context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (slide) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, frequency + slide), now + duration);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(volume, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain); gain.connect(this.sfxGain); oscillator.start(now); oscillator.stop(now + duration + 0.03);
    }
    noise(duration = 0.08, volume = 0.08) {
      if (!this.enabled || !this.context || !this.sfxGain) return;
      const length = Math.max(1, Math.floor(this.context.sampleRate * duration));
      const buffer = this.context.createBuffer(1, length, this.context.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      gain.gain.value = volume;
      source.buffer = buffer; source.connect(gain); gain.connect(this.sfxGain); source.start();
    }
    sfx(name) {
      this.unlock();
      const sounds = {
        click: () => this.tone(380, 0.05, "square", 0.04),
        look: () => { this.tone(260, 0.2, "sine", 0.07, 330); this.tone(540, 0.18, "sine", 0.04, 180); },
        dig: () => { this.noise(0.1, 0.1); this.tone(86, 0.12, "triangle", 0.06); },
        good: () => { this.tone(620, 0.13, "triangle", 0.09); this.tone(930, 0.16, "sine", 0.06); },
        rare: () => [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => this.tone(f, 0.26, "triangle", 0.075), i * 55)),
        bad: () => { this.tone(190, 0.22, "square", 0.08, -70); this.noise(0.08, 0.06); },
        alert: () => { this.tone(150, 0.16, "sawtooth", 0.09); this.tone(110, 0.2, "sawtooth", 0.07); },
        hit: () => { this.noise(0.12, 0.11); this.tone(100, 0.18, "square", 0.08); },
        win: () => [392, 494, 587, 784].forEach((f, i) => setTimeout(() => this.tone(f, 0.34, "triangle", 0.08), i * 90))
      };
      sounds[name]?.();
    }
  }

  const music = new MusicManager();

  let mode = "menu";
  let state = createState();
  let world = null;
  let dialogCallback = null;
  let currentDig = null;
  let currentSample = null;
  let digMarker = 0;
  let digDirection = 1;
  let digHits = 0;
  let lookCooldown = 0;
  let nearest = null;
  let toastTimer = 0;
  let jurySelection = new Set();
  let lastTime = performance.now();
  let viewport = { width: innerWidth, height: innerHeight, dpr: 1 };
  let camera = { x: 0, y: 0 };
  let shake = 0;
  let flash = 0;
  let flashColor = "255,255,255";
  let particles = [];
  let input = { x: 0, y: 0 };
  let joystickPointer = null;
  let danger = { active: false, source: "", rate: 0, exposure: 0, catchAfter: Infinity };

  const player = { x: 0, y: 0, r: 18, angle: 0, step: 0, moving: false, invulnerable: 0, spawnX: 0, spawnY: 0 };

  function createState() {
    return {
      version: 6, levelIndex: 0, score: 0, heat: 0, stones: [], caught: 0,
      completed: {}, settings: { music: true }, startedAt: Date.now()
    };
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, element]) => element?.classList.toggle("is-visible", key === name));
  }

  function setPlaying(enabled) {
    ui.hud.classList.toggle("is-hidden", !enabled);
    ui.controls.classList.toggle("is-hidden", !enabled || !IS_TOUCH);
  }

  function toast(message, type = "good", duration = 1500) {
    ui.toast.textContent = message;
    ui.toast.className = `toast show ${type}`;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ui.toast.className = "toast"; }, duration);
  }

  function saveGame() {
    const payload = { ...state, player: { x: player.x, y: player.y } };
    storage.set(SAVE_KEY, JSON.stringify(payload));
    refreshContinue();
  }

  function loadGame() {
    const raw = storage.get(SAVE_KEY);
    if (!raw) return false;
    try {
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.stones)) return false;
      state = { ...createState(), ...parsed, settings: { music: true, ...(parsed.settings || {}) } };
      music.enabled = state.settings.music !== false;
      return true;
    } catch { return false; }
  }

  function refreshContinue() { byId("continueButton").classList.toggle("is-hidden", !storage.get(SAVE_KEY)); }

  function startNewGame() {
    music.unlock(); music.sfx("click");
    storage.remove(SAVE_KEY);
    state = createState();
    showBrief(0);
  }

  function continueGame() {
    music.unlock();
    if (!loadGame()) { startNewGame(); return; }
    showBrief(clamp(state.levelIndex, 0, LEVELS.length - 1));
  }

  function showBrief(index) {
    const level = LEVELS[index];
    state.levelIndex = index;
    mode = "brief";
    setPlaying(false);
    byId("briefKicker").textContent = `LOKALITA ${index + 1} / ${LEVELS.length}`;
    byId("briefTitle").textContent = level.title;
    byId("briefDescription").textContent = level.description;
    byId("briefGoal").textContent = level.goal;
    byId("briefWhy").textContent = level.why;
    showScreen("brief");
  }

  function enterLevel() {
    generateLevel(state.levelIndex);
    mode = "playing";
    showScreen(null);
    setPlaying(true);
    music.unlock(); music.setTheme(LEVELS[state.levelIndex].music);
    toast(`Cíl: ${LEVELS[state.levelIndex].goal}`, "good", 2500);
    saveGame();
  }

  function pauseGame() {
    if (mode !== "playing") return;
    mode = "pause"; setPlaying(false); music.pause(); showScreen("pause");
  }

  function resumeGame() {
    mode = "playing"; showScreen(null); setPlaying(true); music.play(); lastTime = performance.now();
  }

  function saveAndExit() {
    saveGame(); mode = "menu"; world = null; setPlaying(false); music.pause(); showScreen("menu");
  }

  function generateLevel(index) {
    const level = LEVELS[index];
    world = {
      id: level.id, theme: level.theme, width: 2200, height: 1400,
      props: [], hotspots: [], items: [], npcs: [], patrols: [], boss: null, exit: null,
      runtime: {}, darkness: level.id === "besednice"
    };
    particles = [];
    danger = { active: false, source: "", rate: 0, exposure: 0, catchAfter: Infinity };
    lookCooldown = 0;
    if (level.id === "chlum") buildChlum();
    if (level.id === "locenice") buildLocenice();
    if (level.id === "nesmen") buildNesmen();
    if (level.id === "besednice") buildBesednice();
    if (level.id === "malse") buildMalse();
    player.spawnX = player.x; player.spawnY = player.y; player.invulnerable = 1.5; player.angle = -Math.PI / 2;
    camera.x = clamp(player.x - viewport.width / 2, 0, Math.max(0, world.width - viewport.width));
    camera.y = clamp(player.y - viewport.height / 2, 0, Math.max(0, world.height - viewport.height));
    updateHud();
  }

  function addProp(type, x, y, options = {}) { world.props.push({ type, x, y, scale: 1, angle: 0, ...options }); }
  function addHotspot(x, y, options = {}) { world.hotspots.push({ x, y, active: true, revealed: false, profile: false, needsFill: false, rarity: "common", width: 86, height: 48, ...options }); }
  function addItem(type, x, y, options = {}) { world.items.push({ type, x, y, active: true, hidden: false, ...options }); }
  function addNpc(role, name, x, y, options = {}) { world.npcs.push({ role, name, x, y, ...options }); }
  function addPatrol(type, path, options = {}) {
    world.patrols.push({ type, path, pathIndex: 1, x: path[0].x, y: path[0].y, speed: 70, radius: type === "tractor" ? 54 : 22, vision: 0, halfAngle: 0.55, angle: 0, active: true, ...options });
  }

  function buildChlum() {
    world.runtime = { permit: false, collected: 0 };
    player.x = 340; player.y = 1190;
    addProp("farm", 150, 1180, { scale: 1.15 });
    addNpc("farmer", "Václav", 310, 1080);
    [[560,1050,210,92,-.08],[980,850,255,105,.07],[1480,690,225,92,-.1],[830,480,185,78,.12]].forEach(v => addProp("fieldPit", v[0], v[1], { width:v[2], height:v[3], angle:v[4] }));
    for (let i = 0; i < 14; i++) addProp("soilHeap", random(300, 1900), random(270, 1130), { scale: random(.75,1.35) });
    const points = [[500,1040],[820,1110],[1120,930],[1540,1060],[660,650],[1120,560],[1740,650],[1550,410]];
    points.forEach((p, i) => addHotspot(p[0], p[1], { rarity: i === 6 ? "rare" : i % 3 === 0 ? "good" : "common", documented: true }));
    addPatrol("tractor", [{x:350,y:320},{x:1850,y:320},{x:1850,y:540},{x:350,y:540}], { speed: 125, radius: 66, scale: 1.5 });
    addPatrol("farmer", [{x:1700,y:1120},{x:1550,y:890},{x:1900,y:720}], { speed: 66, vision: 160, condition: () => !world.runtime.permit });
    world.exit = { x: 2010, y: 170, radius: 58, label: "Odjezd z Chlumu" };
  }

  function buildLocenice() {
    world.runtime = { identified: 0, correct: 0, real: 0 };
    player.x = 180; player.y = 1200;
    for (let i = 0; i < 70; i++) {
      const x = random(40, 2160), y = random(30, 1360);
      if (Math.hypot(x - 900, y - 700) > 220) addProp("pine", x, y, { scale: random(1.05, 1.75), angle: random(-.08,.08) });
    }
    for (let i = 0; i < 24; i++) addProp("sandMound", random(230, 1950), random(190, 1210), { scale: random(.75,1.4), angle: random(-.25,.25) });
    for (let i = 0; i < 12; i++) addProp("sandPit", random(320, 1880), random(220, 1160), { width: random(85,170), height: random(45,90), angle: random(-.25,.25) });
    const samplePlan = [true,false,true,false,true,true,false,true,false,true];
    const positions = [[430,1050],[720,1160],[990,980],[1320,1120],[1710,980],[520,650],[850,520],[1210,690],[1600,520],[1900,370]];
    samplePlan.forEach((real, i) => addItem("sample", positions[i][0], positions[i][1], { hidden: true, sample: choose(SAMPLES.filter(s => s.real === real)) }));
    addPatrol("farmer", [{x:430,y:270},{x:1800,y:270},{x:1800,y:760},{x:430,y:760}], { speed: 70, vision: 145 });
    world.exit = { x: 2020, y: 150, radius: 58, label: "Lesní cesta" };
  }

  function buildNesmen() {
    world.runtime = { permit: false, dug: 0, filled: 0, open: 0 };
    player.x = 300; player.y = 1200;
    addNpc("ranger", "Lesník", 310, 1080);
    addProp("hut", 130, 1210, { scale: 1.05 });
    for (let i = 0; i < 60; i++) addProp(i % 3 === 0 ? "pine" : "tree", random(40,2160), random(30,1360), { scale: random(1.05,1.7) });
    for (let i = 0; i < 25; i++) addProp("fern", random(120,2050), random(130,1280), { scale: random(.8,1.25) });
    [[620,1040],[1120,900],[1580,690],[900,430]].forEach((p, i) => addHotspot(p[0], p[1], { profile: true, needsFill: true, revealed: false, documented: true, rarity: i === 3 ? "good" : "common" }));
    addPatrol("ranger", [{x:520,y:650},{x:960,y:300},{x:1700,y:480},{x:1570,y:1100},{x:720,y:1190}], { speed: 82, vision: 190, condition: () => !world.runtime.permit || world.runtime.open > 0 });
    world.exit = { x: 2020, y: 150, radius: 58, label: "Lesní výjezd" };
  }

  function buildBesednice() {
    world.runtime = { clues: 0, profileSpawned: false, stolen: false, bossDefeated: false };
    player.x = 210; player.y = 1210;
    for (let i = 0; i < 38; i++) {
      const x = random(20,2180), y = random(20,1380);
      if ((x < 300 || x > 1900 || y < 190) && Math.hypot(x-player.x,y-player.y)>230) addProp("pine", x, y, { scale: random(1.05,1.7) });
    }
    for (let i = 0; i < 19; i++) addProp("earthBank", random(320,1900), random(180,1210), { scale: random(.8,1.5), angle: random(-.28,.28) });
    for (let i = 0; i < 14; i++) addProp("minePit", random(360,1870), random(230,1160), { width: random(90,190), height: random(50,105), angle: random(-.25,.25) });
    addProp("excavator", 1220, 360, { scale: 1.45, angle: -.08 });
    addProp("excavator", 520, 790, { scale: 1.05, angle: .17 });
    addProp("workLamp", 1300, 390, { scale: 1.1 });
    addProp("workLamp", 590, 760, { scale: 1.05 });
    [[500,1030,"čerstvá hlína"],[1130,720,"otisk pásu bagru"],[1770,390,"zelený úlomek"]].forEach(v => addItem("clue", v[0], v[1], { hidden: true, label: v[2] }));
    addPatrol("digger", [{x:520,y:300},{x:1820,y:340},{x:1840,y:1120},{x:650,y:1160}], { speed: 88, vision: 185 });
    world.exit = { x: 2020, y: 150, radius: 58, label: "Výjezd z Besednice" };
  }

  function buildMalse() {
    world.runtime = { documents: 0, bossDefeated: false };
    player.x = 720; player.y = 1220;
    for (let y = 150; y < 1320; y += 150) { addProp("tree", 540, y, { scale: 1.45 }); addProp("lamp", 680, y); }
    addProp("bridge", 350, 560, { scale: 1.1 });
    addProp("slavia", 1790, 280, { scale: 1.28 });
    addProp("sign", 850, 1190, { text: "Zátkovo nábřeží" });
    [[820,980,"fotografie nálezů"],[1220,690,"souhlasy vlastníků"],[1570,470,"vážní protokol"]].forEach(v => addItem("document", v[0], v[1], { label: v[2] }));
    addPatrol("bike", [{x:650,y:920},{x:650,y:180}], { speed: 150, radius: 25 });
    addPatrol("car", [{x:1080,y:1240},{x:1080,y:170}], { speed: 185, radius: 31 });
    world.exit = { x: 1830, y: 365, radius: 70, label: "Vstup do KD Slávie" };
  }

  function levelObjective() {
    if (!world) return "";
    const r = world.runtime;
    if (world.id === "chlum") return r.permit ? `Vltavíny ${r.collected}/4` : "Promluv s Václavem";
    if (world.id === "locenice") return `Správně ${r.correct}/5 · pravé ${r.real}/3`;
    if (world.id === "nesmen") return r.permit ? `Profily ${r.dug}/3 · zahrabáno ${r.filled}/3` : "Promluv s lesníkem";
    if (world.id === "besednice") {
      if (r.bossDefeated) return "Besednický ježek je zpět";
      if (world.boss?.active) return world.boss.mode === "tired" ? "Karel je vyčerpaný · CHYŤ HO" : "Vyhni se světlu a dožeň Karla";
      if (r.stolen) return "Dožeň zloděje";
      if (r.clues < 3) return `Rozhlédni se · stopy ${r.clues}/3`;
      return "Vykopej ježkový profil";
    }
    if (world.id === "malse") {
      if (world.boss?.active) return world.boss.mode === "tired" ? "Franta je vyčerpaný · CHYŤ HO" : "Dožeň Frantu";
      return r.bossDefeated ? "Vstup do KD Slávie" : `Dokumentace ${r.documents}/3`;
    }
    return "Výprava";
  }

  function goalComplete() {
    if (!world) return false;
    const r = world.runtime;
    if (world.id === "chlum") return r.permit && r.collected >= 4;
    if (world.id === "locenice") return r.correct >= 5 && r.real >= 3;
    if (world.id === "nesmen") return r.permit && r.dug >= 3 && r.filled >= 3;
    if (world.id === "besednice") return r.bossDefeated;
    if (world.id === "malse") return r.documents >= 3 && r.bossDefeated;
    return false;
  }

  function updateHud() {
    if (!world) return;
    ui.levelNumber.textContent = state.levelIndex + 1;
    ui.levelName.textContent = LEVELS[state.levelIndex].name.toUpperCase();
    ui.objectiveText.textContent = levelObjective();
    ui.stoneCount.textContent = state.stones.length;
    ui.dangerFill.style.width = `${clamp(state.heat || 0, 0, 100)}%`;
    const heat = state.heat || 0;
    ui.dangerState.textContent = danger.active ? "ODHALENÍ" : heat >= 70 ? "KRITICKÉ" : heat >= 15 ? "POZOR" : "KLID";
    ui.dangerHud.classList.toggle("warning", heat >= 15 && heat < 70);
    ui.dangerHud.classList.toggle("critical", heat >= 70 || danger.active);
    const boss = world.boss;
    ui.bossHud.classList.toggle("is-hidden", !boss?.active);
    if (boss?.active) {
      ui.bossHudName.textContent = boss.displayName;
      ui.bossState.textContent = boss.mode === "tired" ? "VYČERPANÝ · TEĎ" : boss.phase >= 3 ? "ZUŘIVÝ SPRINT" : "UTÍKÁ";
      ui.bossFill.style.width = `${(boss.maxHits - boss.hits) / boss.maxHits * 100}%`;
    }
  }

  function showDialog(name, avatar, text, callback) {
    dialogCallback = callback || null;
    byId("dialogName").textContent = name;
    byId("dialogAvatar").textContent = avatar;
    byId("dialogText").textContent = text;
    mode = "dialog"; setPlaying(false); showScreen("dialog");
  }

  function closeDialog() {
    const callback = dialogCallback; dialogCallback = null;
    mode = "playing"; showScreen(null); setPlaying(true); callback?.(); updateHud(); saveGame();
  }

  function lookAround() {
    if (lookCooldown > 0) { toast(`Rozhlédnutí za ${Math.ceil(lookCooldown)} s`, "bad", 800); return; }
    lookCooldown = 1.2;
    music.sfx("look");
    let found = 0;
    const radius = 390;
    world.hotspots.forEach(h => { if (h.active && !h.revealed && distance(player,h) <= radius) { h.revealed = true; found++; } });
    world.items.forEach(i => { if (i.active && i.hidden && distance(player,i) <= radius) { i.hidden = false; found++; } });
    toast(found ? `Odhaleno objektů: ${found}` : "V okolí nic nového", found ? "good" : "bad");
  }

  function findNearest() {
    nearest = null;
    let best = Infinity;
    const consider = (kind, object, maxDistance) => {
      if (!object || object.active === false) return;
      const d = distance(player, object);
      if (d <= maxDistance && d < best) { best = d; nearest = { kind, object }; }
    };
    world.npcs.forEach(npc => consider("npc", npc, 78));
    world.hotspots.forEach(h => { if (h.active && h.revealed) consider("hotspot", h, 82); });
    world.items.forEach(item => { if (item.active && !item.hidden) consider(item.type === "hole" ? "hole" : "item", item, item.type === "hole" ? 94 : 70); });
    if (world.boss?.active) consider("boss", world.boss, world.boss.mode === "tired" ? 90 : 58);
    if (world.exit && goalComplete()) consider("exit", world.exit, 90);

    const buttonMap = {
      npc: ["!", "MLUVIT"], hotspot: ["⛏", "KOPAT"], item: ["◆", "SEBRAT"], hole: ["▨", "ZAHRABAT"],
      boss: ["✋", world.boss?.mode === "tired" ? "CHYTIT" : "DOHNAT"], exit: ["→", "ODEJÍT"]
    };
    if (nearest) {
      const [icon, label] = buttonMap[nearest.kind];
      ui.actionIcon.textContent = icon; ui.actionLabel.textContent = label;
      ui.actionButton.classList.add("ready");
      ui.actionButton.classList.toggle("danger-ready", nearest.kind === "boss" && world.boss?.mode === "tired");
    } else {
      ui.actionIcon.textContent = "◉";
      ui.actionLabel.textContent = lookCooldown > 0 ? String(Math.ceil(lookCooldown)) : "ROZHLÉDNOUT";
      ui.actionButton.classList.remove("ready", "danger-ready");
    }
  }

  function performAction() {
    if (mode !== "playing" || !world) return;
    findNearest();
    if (!nearest) { lookAround(); return; }
    const { kind, object } = nearest;
    if (kind === "npc") interactNpc(object);
    else if (kind === "hotspot") startDig(object);
    else if (kind === "item") collectItem(object);
    else if (kind === "hole") fillHole(object);
    else if (kind === "boss") hitBoss();
    else if (kind === "exit") finishLevel();
  }

  function interactNpc(npc) {
    if (npc.role === "farmer") {
      showDialog("VÁCLAV", "V", "Na poli můžeš hledat, ale drž se dál od traktoru a nenechávej po sobě nepořádek.", () => { world.runtime.permit = true; toast("Souhlas získán", "good"); });
    } else {
      showDialog("LESNÍK", "L", "Otevři jen malé obdélníkové profily a každý po vyzvednutí nálezu znovu zahrab.", () => { world.runtime.permit = true; world.hotspots.forEach(h => h.revealed = true); toast("Profily povoleny", "good"); });
    }
  }

  function startDig(hotspot) {
    if (world.id === "chlum" && !world.runtime.permit) { toast("Nejdřív promluv s Václavem", "bad"); return; }
    if (world.id === "nesmen" && !world.runtime.permit) { toast("Nejdřív promluv s lesníkem", "bad"); return; }
    currentDig = hotspot;
    digHits = 0; digMarker = random(.05,.95); digDirection = Math.random() < .5 ? 1 : -1;
    byId("digHits").textContent = "◇ ◇ ◇";
    byId("digTitle").textContent = hotspot.special === "hedgehog" ? "Ježkový profil" : hotspot.profile ? "Obdélníkový profil" : "Nálezové místo";
    mode = "dig"; setPlaying(false); showScreen("dig");
  }

  function updateDig(dt) {
    digMarker += digDirection * dt * 1.15;
    if (digMarker >= 1) { digMarker = 1; digDirection = -1; }
    if (digMarker <= 0) { digMarker = 0; digDirection = 1; }
    byId("digMarker").style.left = `calc(${digMarker * 100}% - 5px)`;
  }

  function digAttempt() {
    if (mode !== "dig" || !currentDig) return;
    music.sfx("dig");
    const success = digMarker >= .4 && digMarker <= .6;
    if (success) {
      digHits++;
      byId("digHits").textContent = `${digHits > 0 ? "◆" : "◇"} ${digHits > 1 ? "◆" : "◇"} ${digHits > 2 ? "◆" : "◇"}`;
      if (digHits >= 3) setTimeout(finishDig, 180);
    } else {
      state.heat = clamp((state.heat || 0) + 9, 0, 100);
      shake = Math.max(shake, 5); music.sfx("bad");
    }
  }

  function finishDig() {
    const h = currentDig; currentDig = null;
    h.active = false;
    mode = "playing"; showScreen(null); setPlaying(true);
    if (h.special === "hedgehog") {
      world.runtime.stolen = true;
      mode = "theft"; setPlaying(false); showScreen("theft");
      shake = 14; flash = .35; flashColor = "255,45,55"; music.sfx("alert"); vibrate([80,40,100]);
      updateHud();
      return;
    }
    const stone = createStone(LEVELS[state.levelIndex].name, h.rarity, h.documented !== false);
    addStone(stone, h.x, h.y);
    if (world.id === "chlum") world.runtime.collected++;
    if (world.id === "nesmen") {
      world.runtime.dug++; world.runtime.open++;
      addItem("hole", h.x, h.y, { profileWidth: h.width, profileHeight: h.height });
    }
    updateHud(); saveGame();
  }

  function startBossAfterTheft() {
    showScreen(null); mode = "playing"; setPlaying(true);
    spawnBoss("karel", 1120, 560);
    toast("Karel sprintuje. Chyť ho, až se zastaví!", "bad", 2200);
  }

  function spawnBoss(type, x, y) {
    const isKarel = type === "karel";
    world.boss = {
      type, displayName: isKarel ? "KRYSTALOVÝ KAREL" : "FETÁK FRANTA",
      x, y, r: 31, active: true, hits: 0, maxHits: isKarel ? 3 : 2, phase: 1,
      mode: "dash", timer: 1.35, speed: isKarel ? 245 : 230, target: randomBossTarget(), angle: 0,
      flashlight: isKarel, vision: isKarel ? 285 : 0, halfAngle: .5, invulnerable: 1.0, trail: []
    };
    music.sfx("alert"); updateHud();
  }

  function randomBossTarget() { return { x: random(320, world.width - 250), y: random(220, world.height - 220) }; }

  function hitBoss() {
    const boss = world.boss;
    if (!boss?.active) return;
    if (boss.mode !== "tired" || boss.invulnerable > 0) { toast("Počkej, až se po sprintu zastaví", "bad"); return; }
    boss.hits++; boss.phase = Math.min(3, boss.hits + 1); boss.invulnerable = .35;
    music.sfx("hit"); shake = 9; flash = .16; flashColor = "255,116,84"; burst(boss.x,boss.y,"#ff8b68",24); vibrate([35,35,50]);
    if (boss.hits >= boss.maxHits) {
      boss.active = false;
      world.runtime.bossDefeated = true;
      if (boss.type === "karel") addStone(createStone("Besednice", "hedgehog", true), boss.x, boss.y);
      else { state.score += 1800; music.sfx("win"); toast("Poslední certifikát je zpět", "good", 1800); }
    } else {
      boss.mode = "dash"; boss.timer = Math.max(.78, 1.25 - boss.hits * .14); boss.target = randomBossTarget(); boss.speed += 30; boss.vision += boss.flashlight ? 25 : 0;
      toast(`Zásah ${boss.hits}/${boss.maxHits} · boss zrychluje`, "good");
    }
    updateHud(); saveGame();
  }

  function collectItem(item) {
    if (item.type === "sample") { startIdentify(item); return; }
    item.active = false;
    if (item.type === "clue") {
      world.runtime.clues++;
      music.sfx("good"); toast(`Stopa: ${item.label}`, "good");
      if (world.runtime.clues >= 3 && !world.runtime.profileSpawned) {
        world.runtime.profileSpawned = true;
        addHotspot(1110, 650, { profile: true, special: "hedgehog", width: 112, height: 62, revealed: true, documented: true, rarity: "hedgehog" });
        toast("Ježkový profil odhalen", "good", 1900); music.sfx("rare");
      }
    } else if (item.type === "document") {
      world.runtime.documents++;
      music.sfx("good"); toast(`Dokument: ${item.label}`, "good");
      if (world.runtime.documents >= 3 && !world.boss) setTimeout(() => spawnBoss("franta", 1460, 430), 400);
    }
    updateHud(); saveGame();
  }

  function startIdentify(item) {
    currentSample = item;
    byId("sampleName").textContent = item.sample.name;
    byId("sampleText").textContent = item.sample.text;
    byId("sampleIcon").style.color = item.sample.real ? "#76e6bf" : "#69d998";
    mode = "identify"; setPlaying(false); showScreen("identify");
  }

  function identifySample(answerReal) {
    if (!currentSample) return;
    const item = currentSample; currentSample = null;
    const correct = answerReal === item.sample.real;
    item.active = false;
    world.runtime.identified++;
    if (correct) {
      world.runtime.correct++;
      if (item.sample.real) { world.runtime.real++; addStone(createStone("Ločenice", world.runtime.real >= 3 ? "good" : "common", true), item.x, item.y); }
      music.sfx("good"); toast("Správné určení", "good");
    } else {
      music.sfx("bad"); toast("Chybné určení · objeví se nový vzorek", "bad");
      const replacement = choose(SAMPLES);
      addItem("sample", clamp(item.x + random(-180,180),180,2020), clamp(item.y + random(-160,160),180,1240), { hidden: true, sample: replacement });
    }
    mode = "playing"; showScreen(null); setPlaying(true); updateHud(); saveGame();
  }

  function fillHole(hole) {
    hole.active = false;
    world.runtime.filled++; world.runtime.open = Math.max(0, world.runtime.open - 1);
    state.score += 180; music.sfx("good"); toast("Profil zahrabán", "good"); updateHud(); saveGame();
  }

  function createStone(locality, rarity = "common", documented = true) {
    const ranges = { common:[.5,1.8], good:[1.6,3.8], rare:[3.4,7.2], hedgehog:[5.8,10.8] };
    const names = { common:"Drobný vltavín", good:"Olivový splash", rare:"Výstavní celotvar", hedgehog:"Besednický ježek" };
    const [min,max] = ranges[rarity] || ranges.common;
    const weight = random(min,max);
    const quality = Math.round(random(rarity === "hedgehog" ? 86 : 68, rarity === "hedgehog" ? 99 : 96));
    const multiplier = rarity === "hedgehog" ? 4200 : rarity === "rare" ? 1900 : rarity === "good" ? 900 : 420;
    return { id:`s${Date.now()}${Math.random()}`, locality, rarity, documented, weight, quality, name:names[rarity], value:Math.round(weight*multiplier*(quality/75)) };
  }

  function addStone(stone, x, y) {
    state.stones.push(stone);
    state.score += Math.round(stone.value * .22);
    burst(x,y,stone.rarity === "hedgehog" || stone.rarity === "rare" ? "#f0c96e" : "#76e6bf", stone.rarity === "hedgehog" ? 32 : 18);
    music.sfx(stone.rarity === "rare" || stone.rarity === "hedgehog" ? "rare" : "good");
    toast(`${stone.name} · ${stone.weight.toFixed(2)} g`, stone.rarity === "hedgehog" ? "good" : "good", 1700);
    updateHud();
  }

  function finishLevel() {
    if (!goalComplete()) { toast(levelObjective(), "bad"); return; }
    state.completed[world.id] = true;
    state.score += 900;
    saveGame();
    if (state.levelIndex >= LEVELS.length - 1) { showJury(); return; }
    state.levelIndex++;
    showBrief(state.levelIndex);
  }

  function showJury() {
    mode = "jury"; setPlaying(false); music.pause(); jurySelection.clear();
    const list = byId("juryList"); list.innerHTML = "";
    [...state.stones].sort((a,b) => b.value - a.value).forEach(stone => {
      const button = document.createElement("button"); button.type = "button"; button.className = "stone-card";
      button.innerHTML = `<span>◆</span><div><strong>${escapeHtml(stone.name)}</strong><small>${escapeHtml(stone.locality)} · ${stone.weight.toFixed(2)} g · kvalita ${stone.quality}%${stone.documented ? " · doložený" : ""}</small></div>`;
      button.addEventListener("click", () => {
        if (jurySelection.has(stone.id)) { jurySelection.delete(stone.id); button.classList.remove("selected"); }
        else if (jurySelection.size < 3) { jurySelection.add(stone.id); button.classList.add("selected"); }
        byId("juryCount").textContent = `${jurySelection.size} / 3`;
        byId("judgeButton").disabled = jurySelection.size !== 3;
      });
      list.appendChild(button);
    });
    byId("juryCount").textContent = "0 / 3"; byId("judgeButton").disabled = true; showScreen("jury");
  }

  function judgeCollection() {
    const chosen = state.stones.filter(s => jurySelection.has(s.id));
    let jury = state.score;
    for (const stone of chosen) jury += stone.value * .5 + stone.quality * 22 + (stone.documented ? 900 : 0) + (stone.rarity === "hedgehog" ? 4500 : stone.rarity === "rare" ? 1800 : stone.rarity === "good" ? 600 : 120);
    jury = Math.round(jury + Math.max(0, 100 - state.caught * 12) * 18);
    let title = "Výstavní uznání";
    let text = "Sbírka dorazila do Slávie a získala uznání mezi vystavovateli.";
    if (jury >= 26000) { title = "Hlavní cena Na zelené vlně"; text = "Vzácná, kvalitní a doložená kolekce získala hlavní cenu večera."; }
    else if (jury >= 17000) { title = "Cena poroty"; text = "Vyvážená sbírka zaujala původem i kvalitou vybraných kamenů."; }
    byId("resultTitle").textContent = title; byId("resultScore").textContent = jury.toLocaleString("cs-CZ"); byId("resultText").textContent = text;
    byId("resultStats").innerHTML = `<div><span>KAMENY</span><strong>${state.stones.length}</strong></div><div><span>DOPADENÍ</span><strong>${state.caught}</strong></div><div><span>LOKALITY</span><strong>${Object.keys(state.completed).length}</strong></div>`;
    const records = JSON.parse(storage.get(RECORD_KEY) || "[]"); records.push({ score:jury, date:new Date().toISOString() }); records.sort((a,b) => b.score-a.score); storage.set(RECORD_KEY, JSON.stringify(records.slice(0,5)));
    storage.remove(SAVE_KEY); mode = "result"; showScreen("result");
  }

  function resetDangerFrame() { danger.active = false; danger.source = ""; danger.rate = 0; danger.catchAfter = Infinity; }

  function reportDanger(source, rate, catchAfter) {
    danger.active = true;
    if (rate >= danger.rate) danger.source = source;
    danger.rate = Math.max(danger.rate, rate);
    danger.catchAfter = Math.min(danger.catchAfter, catchAfter);
  }

  function resolveDanger(dt) {
    state.heat = state.heat || 0;
    if (danger.active) {
      danger.exposure += dt;
      state.heat = clamp(state.heat + danger.rate * dt, 0, 100);
      if (danger.exposure >= danger.catchAfter) caught(`${danger.source} tě odhalil`);
    } else {
      danger.exposure = Math.max(0, danger.exposure - dt * 2.6);
      state.heat = Math.max(0, state.heat - dt * 13);
    }
  }

  function pointInCone(observer, target, range, halfAngle) {
    const dx = target.x - observer.x, dy = target.y - observer.y;
    const d = Math.hypot(dx,dy);
    if (d > range || d < 1) return false;
    return Math.abs(angleDelta(Math.atan2(dy,dx), observer.angle)) <= halfAngle;
  }

  function caught(reason) {
    if (player.invulnerable > 0) return;
    player.invulnerable = 2;
    player.x = player.spawnX; player.y = player.spawnY;
    state.caught++; state.heat = 15; danger.exposure = 0;
    state.score = Math.max(0, state.score - 250);
    shake = 13; flash = .28; flashColor = "255,79,70"; music.sfx("alert"); vibrate([60,50,80]);
    toast(reason, "bad", 1600);
  }

  function update(dt) {
    if (mode === "dig") { updateDig(dt); return; }
    if (mode !== "playing" || !world) return;
    resetDangerFrame();
    lookCooldown = Math.max(0, lookCooldown - dt);
    player.invulnerable = Math.max(0, player.invulnerable - dt);
    shake = Math.max(0, shake - dt * 24); flash = Math.max(0, flash - dt * .9);

    updatePlayer(dt);
    updatePatrols(dt);
    updateBoss(dt);
    updateParticles(dt);
    resolveDanger(dt);
    findNearest(); updateHud(); updateCamera(dt);
  }

  function updatePlayer(dt) {
    const length = Math.hypot(input.x,input.y);
    player.moving = length > .05;
    if (!player.moving) return;
    const nx = input.x / Math.max(1,length), ny = input.y / Math.max(1,length);
    const speed = length > .78 ? 255 : 190;
    const nextX = clamp(player.x + nx * speed * dt, player.r, world.width - player.r);
    const nextY = clamp(player.y + ny * speed * dt, player.r, world.height - player.r);
    player.x = nextX; player.y = nextY;
    player.angle = Math.atan2(ny,nx); player.step += dt * (length > .78 ? 13 : 9);
  }

  function updatePatrols(dt) {
    for (const patrol of world.patrols) {
      if (!patrol.active || !patrol.path?.length) continue;
      const target = patrol.path[patrol.pathIndex];
      const dx = target.x - patrol.x, dy = target.y - patrol.y, d = Math.hypot(dx,dy);
      if (d < 10) patrol.pathIndex = (patrol.pathIndex + 1) % patrol.path.length;
      else { patrol.angle = Math.atan2(dy,dx); patrol.x += dx/d * patrol.speed * dt; patrol.y += dy/d * patrol.speed * dt; }
      if ((patrol.type === "tractor" || patrol.type === "car" || patrol.type === "bike") && distance(player,patrol) < player.r + patrol.radius) caught(patrol.type === "tractor" ? "Traktor tě srazil" : "Pozor na provoz");
      const condition = typeof patrol.condition === "function" ? patrol.condition() : true;
      if (patrol.vision > 0 && condition && player.invulnerable <= 0 && pointInCone(patrol,player,patrol.vision,patrol.halfAngle)) reportDanger(patrol.type === "ranger" ? "Lesník" : patrol.type === "farmer" ? "Majitel pole" : "Noční kopáč", 27, 2.25);
    }
  }

  function updateBoss(dt) {
    const boss = world.boss;
    if (!boss?.active) return;
    boss.invulnerable = Math.max(0, boss.invulnerable - dt);
    boss.timer -= dt;
    if (boss.mode === "dash") {
      const dx = boss.target.x - boss.x, dy = boss.target.y - boss.y, d = Math.hypot(dx,dy);
      boss.angle = Math.atan2(dy,dx);
      if (d > 8) { boss.x += dx/d * boss.speed * dt; boss.y += dy/d * boss.speed * dt; }
      boss.trail.unshift({x:boss.x,y:boss.y,life:.38}); boss.trail = boss.trail.slice(0,12);
      if (boss.flashlight && boss.invulnerable <= 0 && pointInCone(boss,player,boss.vision,boss.halfAngle)) reportDanger("Karlova svítilna", 34 + boss.phase * 4, 1.75);
      if (boss.timer <= 0 || d < 14) { boss.mode = "tired"; boss.timer = Math.max(.75, 1.25 - boss.phase * .1); boss.invulnerable = .08; toast("Boss je vyčerpaný · TEĎ!", "good", 800); }
    } else {
      if (boss.timer <= 0) { boss.mode = "dash"; boss.timer = Math.max(.75, 1.35 - boss.phase * .14); boss.target = randomBossTarget(); }
    }
    boss.trail.forEach(t => t.life -= dt); boss.trail = boss.trail.filter(t => t.life > 0);
  }

  function updateParticles(dt) {
    particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 35 * dt; p.life -= dt; });
    particles = particles.filter(p => p.life > 0);
  }

  function updateCamera(dt) {
    const targetX = clamp(player.x - viewport.width / 2, 0, Math.max(0, world.width - viewport.width));
    const targetY = clamp(player.y - viewport.height / 2, 0, Math.max(0, world.height - viewport.height));
    const factor = 1 - Math.pow(.001, dt);
    camera.x += (targetX - camera.x) * factor; camera.y += (targetY - camera.y) * factor;
  }

  function burst(x,y,color,count) {
    for (let i=0;i<count;i++) particles.push({x,y,vx:random(-120,120),vy:random(-150,-30),r:random(2,5),life:random(.45,.95),color});
  }

  function vibrate(pattern) { try { navigator.vibrate?.(pattern); } catch {} }

  function resize() {
    const rect = app.getBoundingClientRect();
    viewport.width = Math.max(1, rect.width); viewport.height = Math.max(1, rect.height);
    viewport.dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(viewport.width * viewport.dpr); canvas.height = Math.round(viewport.height * viewport.dpr);
    canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
  }

  function render() {
    context.setTransform(1,0,0,1,0,0);
    context.fillStyle = "#07120d"; context.fillRect(0,0,canvas.width,canvas.height);
    context.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);
    if (!world || !["playing","pause","dialog","dig","identify","theft"].includes(mode)) return;
    const shakeX = shake > 0 ? random(-shake,shake) : 0, shakeY = shake > 0 ? random(-shake,shake) : 0;
    context.save(); context.translate(-camera.x + shakeX, -camera.y + shakeY);
    drawBackground();
    drawProps();
    drawHotspotsAndItems();
    if (world.darkness) drawNightMask();
    drawVisionCones();
    drawPatrolsAndNpcs();
    drawBoss();
    drawPlayer();
    drawExit();
    drawParticles();
    context.restore();
    drawVignette();
    drawObjectiveArrow();
  }

  function drawBackground() {
    if (world.id === "chlum") drawChlumBackground();
    else if (world.id === "locenice") drawLoceniceBackground();
    else if (world.id === "nesmen") drawNesmenBackground();
    else if (world.id === "besednice") drawBesedniceBackground();
    else drawMalseBackground();
  }

  function drawChlumBackground() {
    const g = context.createLinearGradient(0,0,0,world.height); g.addColorStop(0,"#88b9dc"); g.addColorStop(.14,"#a9c9d9"); g.addColorStop(.15,"#668451"); g.addColorStop(.26,"#85704d"); g.addColorStop(1,"#4a3425");
    context.fillStyle=g; context.fillRect(0,0,world.width,world.height);
    context.fillStyle="#284630"; context.fillRect(0,150,world.width,90);
    for (let x=0;x<world.width;x+=130) { context.fillStyle=x%260?"#35573b":"#2d4d34"; context.beginPath(); context.moveTo(x,240); context.lineTo(x+60,170); context.lineTo(x+130,240); context.fill(); }
    for (let y=290;y<world.height+100;y+=115) { context.fillStyle=y%230?"#4a3525":"#513a28"; roundedRect(-20,y,world.width+40,70,32); context.fill(); context.strokeStyle="rgba(210,165,106,.18)"; context.lineWidth=2; for(let x=20;x<world.width;x+=45){context.beginPath();context.moveTo(x,y+7);context.lineTo(x+25,y+62);context.stroke();} }
  }

  function drawLoceniceBackground() {
    const g=context.createLinearGradient(0,0,0,world.height);g.addColorStop(0,"#637650");g.addColorStop(1,"#45573c");context.fillStyle=g;context.fillRect(0,0,world.width,world.height);
    for(let i=0;i<24;i++){const x=100+(i*181)%2050,y=80+(i*229)%1240;context.fillStyle=i%2?"rgba(222,202,158,.35)":"rgba(190,166,119,.28)";context.beginPath();context.ellipse(x,y,170+(i%3)*45,75+(i%4)*18,(i%5)*.13,0,Math.PI*2);context.fill();}
    context.strokeStyle="#cdb98b";context.lineWidth=94;context.lineCap="round";context.beginPath();context.moveTo(160,1300);context.bezierCurveTo(570,980,650,690,1020,720);context.bezierCurveTo(1480,750,1600,420,2040,140);context.stroke();
  }

  function drawNesmenBackground() {
    const g=context.createLinearGradient(0,0,0,world.height);g.addColorStop(0,"#536b46");g.addColorStop(1,"#35452f");context.fillStyle=g;context.fillRect(0,0,world.width,world.height);
    for(let i=0;i<260;i++){const x=(i*101)%world.width,y=(i*67)%world.height;context.fillStyle=i%3?"rgba(207,187,142,.12)":"rgba(30,57,36,.15)";context.fillRect(x,y,3+(i%3),3+(i%2));}
    context.strokeStyle="#917850";context.lineWidth=120;context.lineCap="round";context.beginPath();context.moveTo(180,1300);context.bezierCurveTo(580,990,620,660,1060,700);context.bezierCurveTo(1510,740,1600,370,2040,140);context.stroke();
    context.strokeStyle="rgba(232,215,180,.7)";context.lineWidth=70;context.stroke();
  }

  function drawBesedniceBackground() {
    const g=context.createLinearGradient(0,0,0,world.height);g.addColorStop(0,"#263c35");g.addColorStop(.18,"#485748");g.addColorStop(1,"#513a2b");context.fillStyle=g;context.fillRect(0,0,world.width,world.height);
    context.fillStyle="#263f32";context.fillRect(0,0,world.width,190);
    for(let i=0;i<18;i++){const x=170+(i*139)%1900,y=190+(i*173)%1050;context.fillStyle=i%2?"rgba(156,117,79,.34)":"rgba(98,70,49,.34)";context.beginPath();context.ellipse(x,y,145+(i%4)*42,68+(i%3)*22,(i%5)*.14,0,Math.PI*2);context.fill();}
    for(let y=260;y<1250;y+=145){context.strokeStyle="rgba(44,31,23,.34)";context.lineWidth=10;context.setLineDash([20,16]);context.beginPath();context.moveTo(250,y);context.lineTo(1950,y+random(-50,50));context.stroke();context.setLineDash([]);}
  }

  function drawMalseBackground() {
    context.fillStyle="#66746e";context.fillRect(0,0,world.width,world.height);
    const river=context.createLinearGradient(0,0,480,0);river.addColorStop(0,"#1b5263");river.addColorStop(1,"#4290a5");context.fillStyle=river;context.fillRect(0,0,480,world.height);
    for(let y=0;y<world.height;y+=36){context.fillStyle=y%72?"rgba(255,255,255,.05)":"rgba(190,227,233,.08)";context.fillRect(0,y,480,12);}
    context.fillStyle="#8b887e";context.fillRect(480,0,130,world.height);context.fillStyle="#bdb8a9";context.fillRect(610,0,420,world.height);context.fillStyle="#42464a";context.fillRect(1030,0,250,world.height);context.fillStyle="#a6a79f";context.fillRect(1280,0,920,world.height);
    context.strokeStyle="#eadfb8";context.lineWidth=5;context.setLineDash([30,28]);context.beginPath();context.moveTo(1155,0);context.lineTo(1155,world.height);context.stroke();context.setLineDash([]);
  }

  function drawProps() {
    const props=[...world.props].sort((a,b)=>a.y-b.y);
    props.forEach(drawProp);
  }

  function drawProp(p) {
    context.save(); context.translate(p.x,p.y); context.rotate(p.angle||0); context.scale(p.scale||1,p.scale||1);
    if (p.type === "tree" || p.type === "pine") drawTree(p.type === "pine");
    else if (p.type === "farm" || p.type === "hut") drawBuilding(p.type);
    else if (p.type === "fieldPit" || p.type === "sandPit" || p.type === "minePit") drawProfile(p.width||140,p.height||70,p.type);
    else if (p.type === "soilHeap" || p.type === "sandMound" || p.type === "earthBank") drawMound(p.type);
    else if (p.type === "fern") drawFern();
    else if (p.type === "excavator") drawExcavator();
    else if (p.type === "workLamp" || p.type === "lamp") drawLamp(p.type === "workLamp");
    else if (p.type === "bridge") drawBridge();
    else if (p.type === "slavia") drawSlavia();
    else if (p.type === "sign") drawSign(p.text || "");
    context.restore();
  }

  function drawTree(pine=false) {
    context.fillStyle="rgba(0,0,0,.22)";ellipse(0,25,36,12);
    context.fillStyle=pine?"#8b5738":"#64462f";roundedRect(-7,-54,14,82,5);context.fill();
    context.fillStyle=pine?"#2c5b3b":"#3f713f";
    const crowns=pine?[[0,-82,31],[0,-58,37],[0,-32,40]]:[[-18,-52,30],[18,-56,31],[0,-80,35],[0,-31,42]];
    crowns.forEach(([x,y,r])=>{context.beginPath();context.arc(x,y,r,0,Math.PI*2);context.fill();});
  }

  function drawBuilding(type) {
    context.fillStyle="rgba(0,0,0,.25)";ellipse(0,30,70,18);
    context.fillStyle=type==="farm"?"#d5c8ac":"#72543b";roundedRect(-58,-45,116,75,6);context.fill();
    context.fillStyle=type==="farm"?"#8e4934":"#7c3d31";context.beginPath();context.moveTo(-70,-45);context.lineTo(0,-91);context.lineTo(70,-45);context.closePath();context.fill();
    context.fillStyle="#49352b";context.fillRect(-13,-12,26,42);
  }

  function drawProfile(width,height,type="profile") {
    const lip=type==="sandPit"?"#d8c39a":type==="minePit"?"#9b704c":"#ad7b4f";
    const wall=type==="sandPit"?"#9d8861":type==="minePit"?"#684832":"#7d5437";
    context.fillStyle="rgba(0,0,0,.24)";context.beginPath();context.ellipse(0,16,width*.58,height*.46,0,0,Math.PI*2);context.fill();
    context.fillStyle=lip;roundedRect(-width/2-11,-height/2-9,width+22,height+18,12);context.fill();
    context.fillStyle=wall;context.beginPath();context.moveTo(-width/2,-height/2);context.lineTo(width/2,-height/2);context.lineTo(width/2-16,height/2);context.lineTo(-width/2+16,height/2);context.closePath();context.fill();
    context.fillStyle="#201711";context.beginPath();context.moveTo(-width/2+12,-height/2+10);context.lineTo(width/2-12,-height/2+10);context.lineTo(width/2-28,height/2-8);context.lineTo(-width/2+28,height/2-8);context.closePath();context.fill();
    context.strokeStyle="rgba(240,211,164,.8)";context.lineWidth=3;context.stroke();
    context.strokeStyle="rgba(255,255,255,.12)";context.lineWidth=2;context.beginPath();context.moveTo(-width/2+18,-height/2+18);context.lineTo(width/2-18,-height/2+18);context.stroke();
  }

  function drawMound(type) {
    context.fillStyle="rgba(0,0,0,.2)";ellipse(0,15,44,13);
    context.fillStyle=type==="sandMound"?"#c9b488":type==="earthBank"?"#9c7657":"#8a6848";
    context.beginPath();context.moveTo(-48,15);context.quadraticCurveTo(-17,-28,0,-14);context.quadraticCurveTo(25,-34,51,15);context.closePath();context.fill();
  }

  function drawFern(){context.strokeStyle="#347448";context.lineWidth=3;[-.8,-.45,-.1,.2,.55,.85].forEach(a=>{context.beginPath();context.moveTo(0,18);context.quadraticCurveTo(a*11,-2,a*18,-27);context.stroke();});}

  function drawExcavator(){
    context.fillStyle="rgba(0,0,0,.25)";ellipse(0,28,72,19);context.fillStyle="#39342f";roundedRect(-50,10,92,22,9);context.fill();
    context.strokeStyle="#5d584f";context.lineWidth=4;for(let x=-42;x<36;x+=15){context.beginPath();context.moveTo(x,13);context.lineTo(x+9,29);context.stroke();}
    context.fillStyle="#d4a52e";roundedRect(-32,-24,58,40,8);context.fill();context.fillStyle="#34434a";roundedRect(-17,-45,35,28,5);context.fill();
    context.fillStyle="rgba(198,229,238,.38)";context.fillRect(-12,-40,14,15);context.strokeStyle="#d4a52e";context.lineWidth=13;context.lineCap="round";context.beginPath();context.moveTo(24,-18);context.lineTo(62,-55);context.lineTo(98,-28);context.stroke();
    context.fillStyle="#6d5333";context.beginPath();context.moveTo(89,-37);context.lineTo(118,-24);context.lineTo(96,-7);context.closePath();context.fill();
  }

  function drawLamp(work=false){context.fillStyle="#3f4546";context.fillRect(-4,-62,8,78);context.fillStyle="#ffe7a4";context.beginPath();context.arc(0,-65,work?13:9,0,Math.PI*2);context.fill();if(work){const g=context.createRadialGradient(0,-65,5,0,-65,85);g.addColorStop(0,"rgba(255,229,153,.2)");g.addColorStop(1,"rgba(255,229,153,0)");context.fillStyle=g;context.beginPath();context.arc(0,-65,85,0,Math.PI*2);context.fill();}}
  function drawBridge(){context.fillStyle="#527681";roundedRect(-125,-30,250,60,16);context.fill();context.strokeStyle="#b9d7dc";context.lineWidth=4;context.beginPath();context.arc(0,28,113,Math.PI,0);context.stroke();}

  function drawSlavia(){
    context.fillStyle="rgba(0,0,0,.24)";ellipse(0,78,245,30);
    context.fillStyle="#fff";context.beginPath();context.moveTo(-235,-120);context.lineTo(-60,-120);context.lineTo(-25,-92);context.lineTo(-25,63);context.lineTo(-235,63);context.closePath();context.fill();
    context.fillStyle="rgba(160,210,219,.62)";context.beginPath();context.moveTo(-220,-4);context.lineTo(-47,-4);context.lineTo(-47,57);context.lineTo(-220,57);context.closePath();context.fill();
    context.strokeStyle="rgba(255,255,255,.72)";context.lineWidth=2;for(let x=-205;x<-50;x+=23){context.beginPath();context.moveTo(x,-4);context.lineTo(x,57);context.stroke();}
    context.fillStyle="#dedbd3";context.beginPath();context.moveTo(-10,-90);context.lineTo(195,-90);context.lineTo(215,-76);context.lineTo(215,63);context.lineTo(-10,63);context.closePath();context.fill();
    context.fillStyle="#eeeae2";context.beginPath();context.moveTo(-18,-90);context.lineTo(93,-152);context.lineTo(205,-90);context.closePath();context.fill();context.strokeStyle="#999";context.lineWidth=3;context.stroke();
    context.strokeStyle="#9d9d99";context.beginPath();context.moveTo(-2,-59);context.lineTo(197,-59);context.moveTo(-2,-17);context.lineTo(197,-17);context.stroke();
    context.fillStyle="#4d5a61";for(let yy=-75;yy<32;yy+=41)for(let xx=20;xx<=174;xx+=38){roundedRect(xx-8,yy,16,26,3);context.fill();}
    context.fillStyle="#46382e";roundedRect(82,13,32,50,3);context.fill();
    context.fillStyle="#36006f";roundedRect(-67,-139,130,22,5);context.fill();context.fillStyle="#7fe3bf";context.font="bold 11px sans-serif";context.textAlign="center";context.fillText("NA ZELENÉ VLNĚ",-2,-124);
  }

  function drawSign(text){context.fillStyle="#744e2f";context.fillRect(-5,-32,10,52);context.fillStyle="#ddd0aa";roundedRect(-52,-57,104,29,5);context.fill();context.fillStyle="#3b3024";context.textAlign="center";context.font="bold 10px sans-serif";context.fillText(text,0,-38);}

  function drawHotspotsAndItems() {
    world.hotspots.filter(h=>h.active&&h.revealed).forEach(drawHotspot);
    world.items.filter(i=>i.active&&!i.hidden).forEach(drawItem);
  }

  function drawHotspot(h) {
    context.save();context.translate(h.x,h.y);context.rotate(h.angle||0);
    if (h.profile || h.special) {
      context.strokeStyle=h.special?"#f0c96e":"#76e6bf";context.lineWidth=3;context.setLineDash([8,6]);roundedRect(-h.width/2-7,-h.height/2-7,h.width+14,h.height+14,9);context.stroke();context.setLineDash([]);drawProfile(h.width,h.height,h.special?"minePit":"profile");
    } else {
      const pulse=26+Math.sin(performance.now()*.006+h.x)*3;context.fillStyle="rgba(118,230,191,.12)";context.beginPath();context.arc(0,0,pulse,0,Math.PI*2);context.fill();context.strokeStyle="#76e6bf";context.lineWidth=3;context.setLineDash([7,6]);context.stroke();context.setLineDash([]);
    }
    context.restore();
  }

  function drawItem(item) {
    context.save();context.translate(item.x,item.y);context.fillStyle="rgba(0,0,0,.2)";ellipse(0,12,18,7);
    if(item.type==="hole") drawProfile(item.profileWidth||86,item.profileHeight||48,"profile");
    else if(item.type==="sample"){context.fillStyle=item.sample.real?"#54b77c":"#59c48a";gemPath(0,-4,17);context.fill();context.strokeStyle="rgba(255,255,255,.45)";context.stroke();}
    else if(item.type==="clue"){context.fillStyle="#f0c96e";roundedRect(-16,-20,32,30,7);context.fill();context.fillStyle="#624b25";context.font="bold 15px sans-serif";context.textAlign="center";context.fillText("?",0,1);}
    else if(item.type==="document"){context.fillStyle="#eee7d7";roundedRect(-18,-23,36,42,4);context.fill();context.fillStyle="#50677a";for(let y=-15;y<12;y+=8)context.fillRect(-11,y,22,3);}
    context.restore();
  }

  function drawNightMask() {
    context.save();context.fillStyle="rgba(1,7,6,.52)";context.fillRect(0,0,world.width,world.height);context.globalCompositeOperation="destination-out";
    const g=context.createRadialGradient(player.x,player.y,48,player.x,player.y,350);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(.55,"rgba(0,0,0,.78)");g.addColorStop(1,"rgba(0,0,0,0)");context.fillStyle=g;context.beginPath();context.arc(player.x,player.y,360,0,Math.PI*2);context.fill();context.restore();
  }

  function drawVisionCones() {
    world.patrols.forEach(p=>{if(p.active&&p.vision>0&&(typeof p.condition!=="function"||p.condition()))drawCone(p,p.vision,p.halfAngle,false);});
    if(world.boss?.active&&world.boss.flashlight&&world.boss.mode==="dash")drawCone(world.boss,world.boss.vision,world.boss.halfAngle,true);
  }

  function drawCone(observer,range,halfAngle,boss) {
    context.save();context.translate(observer.x,observer.y);context.rotate(observer.angle);const g=context.createRadialGradient(0,0,8,0,0,range);g.addColorStop(0,boss?"rgba(255,239,165,.55)":"rgba(255,215,110,.34)");g.addColorStop(1,"rgba(255,215,110,0)");context.fillStyle=g;context.beginPath();context.moveTo(0,0);context.arc(0,0,range,-halfAngle,halfAngle);context.closePath();context.fill();context.strokeStyle=boss?"rgba(255,236,152,.55)":"rgba(255,215,110,.3)";context.lineWidth=2;context.stroke();context.restore();
  }

  function drawPatrolsAndNpcs() {
    world.patrols.filter(p=>p.active).forEach(p=>{if(p.type==="tractor")drawTractor(p);else if(p.type==="car")drawCar(p);else if(p.type==="bike")drawBike(p);else drawActor(p.x,p.y,p.type,p.angle,true);});
    world.npcs.forEach(n=>drawActor(n.x,n.y,n.role,0,false));
  }

  function drawActor(x,y,type,angle=0,moving=false) {
    const colors={farmer:["#8a6544","#bc9868"],ranger:["#3f6847","#75a16f"],digger:["#6f3a36","#b76559"],player:["#4d9164","#9bd2ad"]};
    const [coat,trim]=colors[type]||colors.farmer;const t=performance.now()*.008+(x+y)*.002;const walk=moving?Math.sin(t)*5:0;
    context.save();context.translate(x,y);context.fillStyle="rgba(0,0,0,.24)";ellipse(0,18,21,8);context.rotate(angle+Math.PI/2);
    context.strokeStyle="#273740";context.lineWidth=8;context.lineCap="round";context.beginPath();context.moveTo(-5,2);context.lineTo(-9+walk,23);context.moveTo(5,2);context.lineTo(9-walk,23);context.stroke();
    context.fillStyle=coat;roundedRect(-17,-29,34,38,10);context.fill();context.fillStyle=trim;roundedRect(-12,-24,24,22,7);context.fill();context.strokeStyle=trim;context.lineWidth=6;context.beginPath();context.moveTo(-13,-17);context.lineTo(-19-walk,-1);context.moveTo(13,-17);context.lineTo(19+walk,-1);context.stroke();
    context.fillStyle="#d19a73";context.beginPath();context.arc(0,-42,12,0,Math.PI*2);context.fill();context.fillStyle="#20382a";context.beginPath();context.arc(0,-47,12,Math.PI,0);context.fill();roundedRect(-14,-53,28,8,4);context.fill();context.fillStyle="#fff";context.beginPath();context.arc(-4,-42,1.8,0,Math.PI*2);context.arc(4,-42,1.8,0,Math.PI*2);context.fill();context.fillStyle="#222";context.beginPath();context.arc(-4,-42,.8,0,Math.PI*2);context.arc(4,-42,.8,0,Math.PI*2);context.fill();context.restore();
  }

  function drawPlayer() {
    context.save();context.translate(player.x,player.y);if(world.darkness){const g=context.createRadialGradient(0,-10,5,0,-10,55);g.addColorStop(0,"rgba(216,255,232,.28)");g.addColorStop(1,"rgba(216,255,232,0)");context.fillStyle=g;context.beginPath();context.arc(0,-10,55,0,Math.PI*2);context.fill();}context.restore();
    context.globalAlpha=player.invulnerable>0&&Math.floor(player.invulnerable*10)%2===0?.45:1;drawActor(player.x,player.y,"player",player.angle,player.moving);context.globalAlpha=1;
    if(world.darkness){context.save();context.translate(player.x,player.y);context.strokeStyle="rgba(223,255,236,.65)";context.lineWidth=2;context.beginPath();context.arc(0,-11,25,0,Math.PI*2);context.stroke();context.restore();}
  }

  function drawBoss() {
    const boss=world.boss;if(!boss?.active)return;
    boss.trail.forEach(t=>{context.globalAlpha=clamp(t.life/.38,0,.35);context.fillStyle=boss.type==="karel"?"#f0c96e":"#ff7582";context.beginPath();context.arc(t.x,t.y,17,0,Math.PI*2);context.fill();});context.globalAlpha=1;
    context.save();context.translate(boss.x,boss.y);const pulse=1+Math.sin(performance.now()*.012)*.06;context.fillStyle=boss.mode==="tired"?"rgba(118,230,191,.34)":"rgba(240,201,110,.23)";context.beginPath();context.arc(0,-16,38*pulse,0,Math.PI*2);context.fill();context.restore();
    context.save();context.translate(boss.x,boss.y);context.scale(1.35,1.35);drawActor(0,0,"digger",boss.angle,true);context.restore();
    if(boss.mode==="tired"){context.fillStyle="#f0c96e";context.font="bold 18px sans-serif";context.textAlign="center";context.fillText("✦  ✦  ✦",boss.x,boss.y-76);}
    const w=Math.max(180,boss.displayName.length*9.5);context.fillStyle="rgba(27,10,10,.9)";roundedRect(boss.x-w/2,boss.y-112,w,32,10);context.fill();context.strokeStyle=boss.type==="karel"?"#f0c96e":"#ff7b87";context.lineWidth=2;context.stroke();context.fillStyle=boss.type==="karel"?"#ffe9b1":"#ffd3d9";context.textAlign="center";context.font="bold 18px sans-serif";context.fillText(boss.displayName,boss.x,boss.y-90);
  }

  function drawTractor(p){context.save();context.translate(p.x,p.y);context.rotate(p.angle);context.scale(p.scale||1.5,p.scale||1.5);context.fillStyle="rgba(0,0,0,.25)";ellipse(0,25,50,16);context.fillStyle="#b64b2c";roundedRect(-48,-20,76,38,9);context.fill();context.fillStyle="#db6a40";roundedRect(-46,-17,34,15,5);context.fill();context.fillStyle="#315563";roundedRect(-8,-40,34,27,5);context.fill();context.fillStyle="rgba(220,244,255,.28)";context.fillRect(-3,-35,13,13);context.fillRect(12,-35,9,13);context.fillStyle="#252525";context.beginPath();context.arc(-28,24,17,0,Math.PI*2);context.arc(25,22,12,0,Math.PI*2);context.fill();context.fillStyle="#f0d898";context.beginPath();context.arc(31,-2,5,0,Math.PI*2);context.fill();context.restore();}
  function drawCar(p){context.save();context.translate(p.x,p.y);context.rotate(p.angle);context.fillStyle="rgba(0,0,0,.22)";ellipse(0,12,30,11);context.fillStyle="#8a4742";roundedRect(-28,-15,56,30,9);context.fill();context.fillStyle="#2d4650";roundedRect(-10,-19,25,14,5);context.fill();context.restore();}
  function drawBike(p){context.save();context.translate(p.x,p.y);context.rotate(p.angle);context.strokeStyle="#263a40";context.lineWidth=3;context.beginPath();context.arc(-12,9,9,0,Math.PI*2);context.arc(12,9,9,0,Math.PI*2);context.stroke();context.beginPath();context.moveTo(-12,9);context.lineTo(0,-4);context.lineTo(12,9);context.moveTo(0,-4);context.lineTo(0,-16);context.stroke();context.fillStyle="#d1a16e";context.beginPath();context.arc(0,-12,7,0,Math.PI*2);context.fill();context.restore();}

  function drawExit(){if(!world.exit)return;context.save();context.translate(world.exit.x,world.exit.y);const active=goalComplete();context.fillStyle=active?"rgba(118,230,191,.2)":"rgba(255,255,255,.06)";context.beginPath();context.arc(0,0,world.exit.radius,0,Math.PI*2);context.fill();context.strokeStyle=active?"#76e6bf":"rgba(255,255,255,.25)";context.lineWidth=4;context.setLineDash([10,8]);context.stroke();context.setLineDash([]);context.fillStyle=active?"#d9ffed":"#bcc7c0";context.textAlign="center";context.font="bold 12px sans-serif";context.fillText(world.exit.label,0,4);context.restore();}
  function drawParticles(){particles.forEach(p=>{context.globalAlpha=clamp(p.life*1.4,0,1);context.fillStyle=p.color;context.beginPath();context.arc(p.x,p.y,p.r,0,Math.PI*2);context.fill();});context.globalAlpha=1;}

  function drawVignette(){const g=context.createRadialGradient(viewport.width/2,viewport.height/2,Math.min(viewport.width,viewport.height)*.22,viewport.width/2,viewport.height/2,Math.max(viewport.width,viewport.height)*.75);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.34)");context.fillStyle=g;context.fillRect(0,0,viewport.width,viewport.height);if(flash>0){context.fillStyle=`rgba(${flashColor},${flash})`;context.fillRect(0,0,viewport.width,viewport.height);}}

  function drawObjectiveArrow(){
    if(!world?.exit)return;let target=world.exit;
    if(!goalComplete()){
      const candidates=[];world.hotspots.forEach(h=>{if(h.active&&h.revealed)candidates.push(h);});world.items.forEach(i=>{if(i.active&&!i.hidden)candidates.push(i);});if(world.boss?.active)candidates.push(world.boss);if(candidates.length)target=candidates.sort((a,b)=>distance(player,a)-distance(player,b))[0];
    }
    const sx=target.x-camera.x,sy=target.y-camera.y;if(sx>45&&sy>105&&sx<viewport.width-45&&sy<viewport.height-115)return;
    const cx=viewport.width/2,cy=viewport.height/2,ang=Math.atan2(sy-cy,sx-cx),rad=Math.min(viewport.width,viewport.height)*.38;context.save();context.translate(cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad);context.rotate(ang);context.fillStyle=goalComplete()?"#76e6bf":"#f0c96e";context.beginPath();context.moveTo(17,0);context.lineTo(-11,-10);context.lineTo(-11,10);context.closePath();context.fill();context.restore();
  }

  function roundedRect(x,y,w,h,r){context.beginPath();context.roundRect(x,y,w,h,r);}
  function ellipse(x,y,rx,ry){context.beginPath();context.ellipse(x,y,rx,ry,0,0,Math.PI*2);context.fill();}
  function gemPath(x,y,r){context.beginPath();context.moveTo(x,y-r);context.lineTo(x+r*.8,y-r*.35);context.lineTo(x+r*.65,y+r*.7);context.lineTo(x,y+r);context.lineTo(x-r*.75,y+r*.35);context.lineTo(x-r*.8,y-r*.4);context.closePath();}

  function bindControls() {
    const zone=ui.joystick,knob=ui.joystickKnob;
    const movePointer=e=>{
      const rect=zone.getBoundingClientRect();const dx=e.clientX-(rect.left+rect.width/2),dy=e.clientY-(rect.top+rect.height/2);const max=rect.width*.33;const len=Math.hypot(dx,dy)||1;const scale=Math.min(1,max/len);const x=dx*scale,y=dy*scale;input.x=x/max;input.y=y/max;knob.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;
    };
    zone.addEventListener("pointerdown",e=>{e.preventDefault();joystickPointer=e.pointerId;zone.setPointerCapture?.(e.pointerId);movePointer(e);});
    zone.addEventListener("pointermove",e=>{if(e.pointerId===joystickPointer)movePointer(e);});
    const endJoystick=e=>{if(e.pointerId!==joystickPointer)return;joystickPointer=null;input.x=0;input.y=0;knob.style.transform="translate(-50%,-50%)";};
    zone.addEventListener("pointerup",endJoystick);zone.addEventListener("pointercancel",endJoystick);
    ui.actionButton.addEventListener("pointerdown",e=>{e.preventDefault();performAction();});
    addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="Space")performAction();if(e.code==="Escape")pauseGame();if(e.code==="KeyD"||e.code==="ArrowRight")input.x=1;if(e.code==="KeyA"||e.code==="ArrowLeft")input.x=-1;if(e.code==="KeyS"||e.code==="ArrowDown")input.y=1;if(e.code==="KeyW"||e.code==="ArrowUp")input.y=-1;});
    addEventListener("keyup",e=>{if(["KeyA","KeyD","ArrowLeft","ArrowRight"].includes(e.code))input.x=0;if(["KeyW","KeyS","ArrowUp","ArrowDown"].includes(e.code))input.y=0;});
  }

  function bindUi() {
    byId("newGameButton").addEventListener("click",startNewGame);
    byId("continueButton").addEventListener("click",continueGame);
    byId("howToButton").addEventListener("click",()=>showScreen("how"));
    byId("closeHowButton").addEventListener("click",()=>showScreen("menu"));
    byId("enterLevelButton").addEventListener("click",enterLevel);
    byId("dialogCloseButton").addEventListener("click",closeDialog);
    byId("digButton").addEventListener("click",digAttempt);
    byId("moldaviteButton").addEventListener("click",()=>identifySample(true));
    byId("glassButton").addEventListener("click",()=>identifySample(false));
    byId("theftContinueButton").addEventListener("click",startBossAfterTheft);
    byId("pauseButton").addEventListener("click",pauseGame);
    byId("resumeButton").addEventListener("click",resumeGame);
    byId("saveExitButton").addEventListener("click",saveAndExit);
    byId("musicButton").addEventListener("click",()=>{state.settings.music=music.toggle();byId("musicButton").textContent=music.enabled?"♫":"×";saveGame();});
    byId("judgeButton").addEventListener("click",judgeCollection);
    byId("restartButton").addEventListener("click",startNewGame);
    byId("reloadButton").addEventListener("click",()=>location.reload());
  }

  function preventZoom() {
    document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
    document.addEventListener("gesturechange",e=>e.preventDefault(),{passive:false});
    document.addEventListener("gestureend",e=>e.preventDefault(),{passive:false});
    document.addEventListener("touchmove",e=>{if(e.touches.length>1)e.preventDefault();},{passive:false});
  }

  function exposeDebug() {
    if (!(location.search.includes("debug=1") || location.protocol === "about:")) return;
    window.__GAME_DEBUG__ = {
      snapshot:()=>({mode,level:world?.id,objective:world?levelObjective():null,heat:state.heat||0,stones:state.stones.length,player:{x:player.x,y:player.y},boss:world?.boss?{active:world.boss.active,mode:world.boss.mode,hits:world.boss.hits,phase:world.boss.phase,x:world.boss.x,y:world.boss.y,angle:world.boss.angle,vision:world.boss.vision}:null,runtime:world?.runtime}),
      startLevel:index=>{state=createState();state.levelIndex=clamp(index,0,LEVELS.length-1);generateLevel(state.levelIndex);mode="playing";showScreen(null);setPlaying(true);music.pause();},
      revealAll:()=>{world?.hotspots.forEach(h=>h.revealed=true);world?.items.forEach(i=>i.hidden=false);},
      setPlayer:(x,y)=>{player.x=x;player.y=y;},
      triggerTheft:()=>{if(world?.id!=="besednice")return false;world.runtime.stolen=true;mode="theft";setPlaying(false);showScreen("theft");return true;},
      startKarel:()=>{if(world?.id!=="besednice")return false;mode="playing";showScreen(null);setPlaying(true);spawnBoss("karel",900,600);return true;},
      makeBossTired:()=>{if(!world?.boss)return false;world.boss.mode="tired";world.boss.timer=1;world.boss.invulnerable=0;player.x=world.boss.x-40;player.y=world.boss.y;findNearest();return true;},
      placeInBossLight:()=>{if(!world?.boss)return false;const b=world.boss;b.mode="dash";b.timer=2;b.invulnerable=0;player.invulnerable=0;player.x=b.x+Math.cos(b.angle)*Math.min(120,b.vision*.45);player.y=b.y+Math.sin(b.angle)*Math.min(120,b.vision*.45);return true;},
      hitBoss:()=>hitBoss(),
      completeCurrent:()=>{if(!world)return;const r=world.runtime;if(world.id==="chlum"){r.permit=true;r.collected=4;}if(world.id==="locenice"){r.correct=5;r.real=3;}if(world.id==="nesmen"){r.permit=true;r.dug=3;r.filled=3;}if(world.id==="besednice"){r.bossDefeated=true;}if(world.id==="malse"){r.documents=3;r.bossDefeated=true;}updateHud();},
      forceDanger:()=>{if(!world)return;state.heat=80;danger.active=true;updateHud();},
      finishLevel:()=>finishLevel(),
      seedCollection:()=>{state.stones=[createStone("Chlum","good",true),createStone("Nesměň","rare",true),createStone("Besednice","hedgehog",true),createStone("Ločenice","common",true)];updateHud();}
    };
  }

  function loop(now) {
    const dt=Math.min(.035,(now-lastTime)/1000||.016);lastTime=now;
    try { update(dt); render(); }
    catch(error){ showFatal(error); return; }
    requestAnimationFrame(loop);
  }

  function showFatal(error) {
    console.error(error);
    mode="error";setPlaying(false);byId("fatalText").textContent=error?.message||String(error);byId("fatalError").classList.remove("is-hidden");
  }

  function boot() {
    bindUi(); bindControls(); preventZoom(); resize(); refreshContinue(); exposeDebug();
    addEventListener("resize",()=>requestAnimationFrame(resize));
    visualViewport?.addEventListener("resize",()=>requestAnimationFrame(resize));
    document.addEventListener("visibilitychange",()=>{if(document.hidden&&mode==="playing")pauseGame();});
    showScreen("menu");
    requestAnimationFrame(loop);
  }

  window.addEventListener("error",event=>{if(event.error)showFatal(event.error);});
  boot();
})();
