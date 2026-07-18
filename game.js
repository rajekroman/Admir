(() => {
  "use strict";

  const $ = id => document.getElementById(id);
  const canvas = $("game");
  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  const app = $("app");
  const hud = $("hud");
  const controls = $("controls");

  const screens = {
    title: $("titleScreen"), brief: $("briefScreen"), dig: $("digScreen"), identify: $("identifyScreen"),
    dialog: $("dialogScreen"), perk: $("perkScreen"), jury: $("juryScreen"), result: $("resultScreen"),
    pause: $("pauseScreen"), how: $("howScreen"), records: $("recordsScreen")
  };

  const ui = {
    missionNumber: $("missionNumber"), place: $("placeLabel"), objective: $("objectiveLabel"), bag: $("bagValue"),
    heat: $("heatFill"), combo: $("combo"), hint: $("hint"), toast: $("toast"),
    actionIcon: $("actionIcon"), actionText: $("actionText")
  };

  const SAVE_KEY = "lovecVltavinuRebornSaveV4_2";
  const RECORD_KEY = "lovecVltavinuRebornRecordsV4_2";
  const isTouch = navigator.maxTouchPoints > 0 || "ontouchstart" in window || matchMedia("(pointer: coarse)").matches;
  const storage = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } },
    remove(k) { try { localStorage.removeItem(k); } catch {} }
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[ch]);

  const LEVELS = [
    {
      id: "chlum", name: "Chlum", title: "Chlum po bouřce", theme: "field",
      text: "Déšť omyl tmavou ornici. V brázdách leží první zelené záblesky, ale traktor už znovu vyráží do pole.",
      goal: "Získej souhlas Václava a odnes 4 pravé kameny.", music: "field"
    },
    {
      id: "locenice", name: "Ločenice", title: "Štěrková hrana", theme: "meadow",
      text: "Erozní rýha odkryla vltavíny i lahvové střepy. Tentokrát rozhoduje rychlé oko, ne síla lopaty.",
      goal: "Správně urči 5 vzorků a najdi 3 pravé kusy.", music: "meadow"
    },
    {
      id: "nesmen", name: "Nesměň", title: "Lesní profily", theme: "forest",
      text: "Mělké jílové profily jsou povolené, pokud po sobě nezůstane ani jedna otevřená jáma.",
      goal: "Vykopej a zasyp 3 profily bez zbytečného hluku.", music: "forest"
    },
    {
      id: "besednice", name: "Besednice", title: "Ježková noc", theme: "night",
      text: "Tři stopy vedou k ježkové vrstvě. Ve tmě se ale pohybuje rival, který čeká na cizí nález.",
      goal: "Najdi 3 stopy, vykopej ježek a dostaň ho zpět od Karla.", music: "night"
    },
    {
      id: "malse", name: "Malše", title: "Cesta ke Slávii", theme: "city",
      text: "Podél Malše vede poslední úsek. Dokumentace se rozsypala mezi promenádou, lávkou a provozem před Slávií.",
      goal: "Seber 3 složky, dožeň Frantu a vstup do Slávie.", music: "city"
    }
  ];

  const PERKS = [
    { id: "boots", icon: "↟", name: "Lehké boty", text: "+12 % rychlost pohybu", max: 3 },
    { id: "scanner", icon: "◉", name: "Bystrý rozhled", text: "větší dosah rozhlédnutí a kratší čekání", max: 3 },
    { id: "shovel", icon: "⛏", name: "Přesná lopatka", text: "širší zelené pole při kopání", max: 3 },
    { id: "quiet", icon: "◌", name: "Tichý postup", text: "méně pozornosti za chyby", max: 3 },
    { id: "case", icon: "▣", name: "Pevné pouzdro", text: "při dopadení neztratíš nejlepší kus", max: 2 },
    { id: "eye", icon: "◉", name: "Zkušené oko", text: "vyšší kvalita správně určených kusů", max: 3 }
  ];

  const SAMPLES = [
    { real: true, title: "Olivový úlomek", text: "Matný povrch, nepravidelné hrany a drobné podélné bubliny." },
    { real: false, title: "Jasně zelený střep", text: "Dokonale hladký povrch, ostrý rovný lom a nepřirozeně sytá barva." },
    { real: true, title: "Hnědozelený splash", text: "Proměnlivá barva, zvlněná skulptace a nestejná tloušťka." },
    { real: false, title: "Lesklý odlitek", text: "Stejnoměrná barva, kulaté hrany a opakující se povrchový vzor." },
    { real: true, title: "Drobný celotvar", text: "Přirozeně leptaný povrch a jemná průsvitnost proti světlu." },
    { real: false, title: "Lahvové sklo", text: "Ploché stěny, pravidelná tloušťka a hladké průmyslové plochy." }
  ];

  class AudioEngine {
    constructor() {
      this.ctx = null; this.master = null; this.musicGain = null; this.sfxGain = null;
      this.enabled = true; this.timer = 0; this.step = 0; this.theme = "field";
      this.nextNote = 0; this.ambienceTimer = 0;
      this.themes = {
        field: { scale:[146.8,164.8,196,220,246.9,293.7], melody:[0,2,3,2, 1,2,4,2, 0,2,3,4, 3,2,1,null], bass:[0,null,3,null, 4,null,2,null, 0,null,4,null, 3,null,1,null], tempo:.54, pad:[3,4,2,3] },
        meadow:{ scale:[130.8,146.8,174.6,196,220,261.6], melody:[0,1,3,4, 3,1,2,3, 4,3,1,0, 1,2,3,null], bass:[0,null,2,null, 3,null,1,null, 4,null,3,null, 2,null,0,null], tempo:.5, pad:[2,3,4,2] },
        forest:{ scale:[110,130.8,146.8,164.8,196,220], melody:[0,2,3,2, 0,1,2,4, 3,2,1,0, 2,3,4,null], bass:[0,null,2,null, 3,null,1,null, 4,null,2,null, 1,null,0,null], tempo:.58, pad:[2,3,1,2] },
        night: { scale:[98,110,130.8,146.8,174.6,196], melody:[0,2,4,2, 3,2,1,2, 0,2,3,4, 2,1,0,null], bass:[0,null,3,null, 2,null,1,null, 4,null,2,null, 1,null,0,null], tempo:.62, pad:[3,2,4,1] },
        city:  { scale:[130.8,146.8,174.6,196,220,261.6], melody:[0,2,4,3, 2,1,2,4, 3,2,1,0, 2,3,4,null], bass:[0,null,3,null, 4,null,2,null, 1,null,3,null, 4,null,0,null], tempo:.5, pad:[4,3,2,4] }
      };
    }
    start() {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        this.master.gain.value = .42;
        this.musicGain.gain.value = .15;
        this.sfxGain.gain.value = .6;
        this.musicGain.connect(this.master); this.sfxGain.connect(this.master); this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
      this.nextNote = this.ctx.currentTime + .08;
    }
    setTheme(theme) { this.theme = theme; this.step = 0; this.timer = 0; this.ambienceTimer = 0; }
    toggle() { this.enabled = !this.enabled; if (this.master && this.ctx) this.master.gain.setTargetAtTime(this.enabled ? .42 : 0, this.ctx.currentTime, .03); return this.enabled; }
    tone(freq, dur=.1, type="triangle", vol=.16, when=0, slide=0) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(freq, t); if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30,freq+slide), t+dur);
      gain.gain.setValueAtTime(.0001,t); gain.gain.linearRampToValueAtTime(vol,t+.008); gain.gain.exponentialRampToValueAtTime(.0001,t+dur);
      osc.connect(gain); gain.connect(this.sfxGain); osc.start(t); osc.stop(t+dur+.03);
    }
    musicTone(freq, dur=.28, type="triangle", vol=.025, when=0) {
      if (!this.enabled || !this.ctx) return;
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator(); const gain = this.ctx.createGain(); const filter = this.ctx.createBiquadFilter();
      osc.type = type; osc.frequency.setValueAtTime(freq, t); filter.type = "lowpass"; filter.frequency.value = type === "square" ? 1400 : 1900;
      gain.gain.setValueAtTime(.0001, t); gain.gain.linearRampToValueAtTime(vol, t + .03); gain.gain.exponentialRampToValueAtTime(.0001, t + dur);
      osc.connect(filter); filter.connect(gain); gain.connect(this.musicGain); osc.start(t); osc.stop(t + dur + .03);
    }
    noise(dur=.08, vol=.08, cutoff=1200) {
      if (!this.enabled || !this.ctx) return;
      const n=Math.floor(this.ctx.sampleRate*dur), b=this.ctx.createBuffer(1,n,this.ctx.sampleRate), d=b.getChannelData(0);
      for(let i=0;i<n;i++) d[i]=(Math.random()*2-1)*(1-i/n);
      const src=this.ctx.createBufferSource(), filter=this.ctx.createBiquadFilter(), g=this.ctx.createGain();
      src.buffer=b; filter.type="lowpass"; filter.frequency.value=cutoff; g.gain.value=vol;
      src.connect(filter); filter.connect(g); g.connect(this.sfxGain); src.start();
    }
    sfx(name) {
      const f = {
        scan:()=>{this.tone(260,.18,"sine",.08,0,420);this.tone(520,.22,"sine",.05,.08,260);},
        dig:()=>{this.noise(.11,.13,800);this.tone(82,.12,"triangle",.06);},
        good:()=>{this.tone(620,.12,"triangle",.11);this.tone(930,.15,"sine",.08,.07);},
        rare:()=>[523,659,784,1047].forEach((x,i)=>this.tone(x,.25,"triangle",.08,i*.06)),
        bad:()=>{this.tone(180,.22,"square",.07,0,-70);this.noise(.09,.08,600);},
        catch:()=>{this.tone(95,.28,"sawtooth",.1);this.noise(.16,.13,900);},
        paper:()=>{this.tone(420,.08,"square",.06);this.tone(620,.1,"triangle",.06,.06);},
        win:()=>[392,494,587,784].forEach((x,i)=>this.tone(x,.36,"triangle",.1,i*.1)),
        click:()=>this.tone(360,.05,"square",.04),
        step:()=>this.noise(.025,.025,500)
      }; f[name]?.();
    }
    update(dt, active) {
      if (!this.enabled || !this.ctx || !active) return;
      this.timer -= dt; this.ambienceTimer -= dt;
      const theme = this.themes[this.theme] || this.themes.field;
      if (this.timer <= 0) {
        const index = this.step % theme.melody.length;
        const toneIndex = theme.melody[index];
        const bassIndex = theme.bass[index];
        const padIndex = theme.pad[Math.floor(index / 4) % theme.pad.length];
        if (toneIndex !== null && toneIndex !== undefined) {
          const freq = theme.scale[toneIndex];
          this.musicTone(freq, .38, "triangle", .028);
          if (index % 2 === 0) this.musicTone(freq * 2, .19, "sine", .009, .12);
        }
        if (bassIndex !== null && bassIndex !== undefined) this.musicTone(theme.scale[bassIndex] / 2, .34, "triangle", .018, .02);
        if (index % 4 === 0 && padIndex !== null && padIndex !== undefined) {
          const root = theme.scale[padIndex];
          this.musicTone(root, .92, "triangle", .012, .01);
          this.musicTone(root * 1.5, .84, "sine", .007, .03);
        }
        this.step = (this.step + 1) % theme.melody.length;
        this.timer = theme.tempo;
      }
      if (this.ambienceTimer <= 0) {
        if (this.theme === "night") this.noise(.14, .006, 1400);
        else if (this.theme === "forest") this.noise(.1, .004, 1900);
        this.ambienceTimer = 4.5 + Math.random() * 4;
      }
    }
  }
  const audio = new AudioEngine();

  function freshState() {
    return {
      version:"4.2.0", levelIndex:0, score:0, stones:[], heat:0, combo:1, comboTimer:0, caught:0,
      perks:{boots:0,scanner:0,shovel:0,quiet:0,case:0,eye:0}, stats:{digs:0,correct:0,misses:0,rare:0}, sound:true
    };
  }

  let state = freshState();
  let mode = "menu";
  let viewport = {w:innerWidth,h:innerHeight,dpr:1};
  let world = null;
  let player = {x:0,y:0,r:17,angle:0,step:0,invuln:0};
  let camera = {x:0,y:0};
  let input = {x:0,y:0,pressed:false};
  let nearest = null;
  let last = performance.now();
  let scanCooldown = 0;
  let scanPulse = 0;
  let toastTimer = 0;
  let currentDig = null;
  let currentSample = null;
  let digMarker = 0;
  let digDir = 1;
  let digHits = 0;
  let jurySelection = new Set();
  let dialogueCallback = null;
  let shake = 0;
  let flash = 0;
  let flashColor = "255,255,255";

  function save() { storage.set(SAVE_KEY, JSON.stringify(state)); refreshContinue(); }
  function load() {
    try {
      const data=JSON.parse(storage.get(SAVE_KEY)||"null");
      if(!data || !Array.isArray(data.stones)) return false;
      state={...freshState(),...data,perks:{...freshState().perks,...(data.perks||{})},stats:{...freshState().stats,...(data.stats||{})}};
      audio.enabled=state.sound!==false; return true;
    } catch { return false; }
  }
  function refreshContinue(){ $("continueButton").classList.toggle("hidden",!storage.get(SAVE_KEY)); }
  function getRecords(){try{return JSON.parse(storage.get(RECORD_KEY)||"[]");}catch{return[];}}
  function addRecord(score,title){const rows=getRecords();rows.push({score,title,stones:state.stones.length,date:new Date().toISOString()});rows.sort((a,b)=>b.score-a.score);storage.set(RECORD_KEY,JSON.stringify(rows.slice(0,10)));}

  function showOnly(screen){Object.values(screens).forEach(s=>s.classList.remove("visible"));if(screen)screen.classList.add("visible");}
  function setPlaying(on){hud.classList.toggle("hidden",!on);controls.classList.toggle("hidden",!on||!isTouch);app.classList.toggle("playing",on);}
  function toast(text,type="",duration=1500){clearTimeout(toastTimer);ui.toast.textContent=text;ui.toast.className=`toast show ${type}`;toastTimer=setTimeout(()=>ui.toast.className="toast",duration);}
  function showHint(text){ui.hint.textContent=text;ui.hint.classList.remove("hidden");}
  function hideHint(){ui.hint.classList.add("hidden");}

  function resize(){
    const rect=app.getBoundingClientRect();
    const w=Math.max(1,Math.round(rect.width||document.documentElement.clientWidth||innerWidth));
    const h=Math.max(1,Math.round(rect.height||innerHeight));
    const dpr=Math.min(devicePixelRatio||1,2);
    viewport={w,h,dpr};
    canvas.width=Math.round(w*dpr);
    canvas.height=Math.round(h*dpr);
    canvas.style.width="100%";
    canvas.style.height="100%";
    ctx.setTransform(dpr,0,0,dpr,0,0);
    ctx.imageSmoothingEnabled=true;
  }

  function addProp(type,x,y,o={}){world.props.push({type,x,y,...o});}
  function addObstacle(x,y,w,h,o={}){world.obstacles.push({x,y,w,h,...o});}
  function addHotspot(x,y,o={}){const profile=Boolean(o.needsFill||o.special==="hedgehog");world.hotspots.push({x,y,r:profile?42:24,w:profile?74:0,h:profile?42:0,angle:profile?rand(-.22,.22):0,revealed:Boolean(o.revealed),active:true,ttl:0,...o});}
  function addItem(type,x,y,o={}){world.items.push({type,x,y,r:20,active:true,...o});}
  function addPatrol(type,points,o={}){const p=points[0];world.patrols.push({type,x:p.x,y:p.y,points,index:1,speed:o.speed||80,vision:o.vision||180,angle:0,active:true,...o});}

  function generateLevel(index){
    const level=LEVELS[index];
    world={id:level.id,theme:level.theme,w:1800,h:1200,props:[],obstacles:[],hotspots:[],items:[],patrols:[],hazards:[],particles:[],exit:null,runtime:{},rain:level.theme==="field"?1:0};
    if(level.id==="chlum") generateChlum();
    if(level.id==="locenice") generateLocenice();
    if(level.id==="nesmen") generateNesmen();
    if(level.id==="besednice") generateBesednice();
    if(level.id==="malse") generateMalse();
    camera.x=player.x-viewport.w/2;camera.y=player.y-viewport.h/2;nearest=null;scanCooldown=0;scanPulse=0;
    state.heat=0;state.combo=1;state.comboTimer=0;audio.setTheme(level.music);updateHUD(true);
  }

  function generateChlum(){
    world.runtime={permit:false,collected:0}; player.x=360;player.y=1070;
    addProp("farm",150,1050,{scale:1.05}); addProp("npc",280,990,{name:"Václav",avatar:"V",role:"farmer"});
    for(let y=180;y<1050;y+=125) for(let x=120;x<1720;x+=240) if(Math.random()<.58)addProp("puddle",x+rand(-40,40),y+rand(-25,25),{r:rand(18,40)});
    for(let i=0;i<22;i++)addProp("tree",rand(30,1770),rand(20,150),{scale:rand(.8,1.35)});
    for(const p of [[500,840],[820,910],[1120,760],[1440,900],[620,480],[1040,420],[1500,500]]) addHotspot(p[0],p[1],{rarity:Math.random()<.18?"rare":"common",documented:true});
    addItem("stone",440,690,{rarity:"common",documented:true}); addItem("stone",1250,640,{rarity:"good",documented:true});
    addPatrol("tractor",[{x:350,y:300},{x:1570,y:300},{x:1570,y:470},{x:350,y:470}],{speed:115,vision:0});
    addPatrol("farmer",[{x:1580,y:920},{x:1480,y:650},{x:1660,y:520}],{speed:65,vision:140,requires:"permit"});
    world.exit={x:1650,y:150,r:54,label:"Odjezd"};
  }

  function generateLocenice(){
    world.runtime={correct:0,real:0,identified:0};player.x=160;player.y=1040;
    for(let i=0;i<36;i++) addProp(Math.random()<.65?"bush":"tree",rand(20,1780),rand(20,1180),{scale:rand(.65,1.05)});
    for(let i=0;i<18;i++)addProp("rock",rand(310,1470),rand(150,1050),{scale:rand(.5,1.1)});
    addProp("sign",220,1010,{text:"Ločenice"});
    const samples=[...SAMPLES,...SAMPLES].sort(()=>Math.random()-.5).slice(0,9);
    const pts=[[420,850],[660,950],[910,820],[1210,950],[1480,820],[520,520],[840,410],[1180,560],[1510,390]];
    samples.forEach((s,i)=>addItem("sample",pts[i][0],pts[i][1],{sample:s}));
    addPatrol("farmer",[{x:400,y:250},{x:1500,y:250},{x:1500,y:690},{x:400,y:690}],{speed:72,vision:150});
    world.exit={x:1650,y:150,r:54,label:"Pokračovat"};
  }

  function generateNesmen(){
    world.runtime={permit:false,dug:0,filled:0,open:0};player.x=360;player.y=1050;
    addProp("npc",290,980,{name:"Lesník",avatar:"L",role:"owner"}); addProp("hut",120,1060,{scale:.9});
    for(let i=0;i<62;i++){const x=rand(30,1770),y=rand(30,1170);if(Math.hypot(x-900,y-650)>180)addProp("tree",x,y,{scale:rand(.75,1.45)});}
    for(let i=0;i<18;i++)addProp("pine",rand(40,1760),rand(40,1160),{scale:rand(.7,1.2)});
    for(let i=0;i<24;i++)addProp("bush",rand(30,1770),rand(30,1170),{scale:rand(.6,1)});
    for(let i=0;i<22;i++)addProp("fern",rand(80,1720),rand(90,1100),{scale:rand(.7,1.15)});
    for(let i=0;i<30;i++)addProp("grass",rand(90,1710),rand(110,1110),{scale:rand(.7,1.25)});
    for(let i=0;i<10;i++)addProp("stump",rand(160,1650),rand(180,1060),{scale:rand(.8,1.2)});
    for(let i=0;i<6;i++)addProp("log",rand(220,1580),rand(210,990),{scale:rand(.8,1.2),angle:rand(-.6,.6)});
    [[520,880],[930,860],[1290,740],[720,390]].forEach((p,i)=>addHotspot(p[0],p[1],{rarity:i===3?"good":"common",documented:true,needsFill:true,marked:true}));
    addPatrol("ranger",[{x:420,y:560},{x:840,y:300},{x:1420,y:470},{x:1320,y:980},{x:650,y:1030}],{speed:82,vision:190});
    world.exit={x:1650,y:150,r:54,label:"Lesní cesta"};
  }

  function generateBesednice(){
    world.runtime={clues:0,hedgehog:false,bossStarted:false,bossHits:0,bossDefeated:false};player.x=150;player.y=1030;
    for(let i=0;i<72;i++){const x=rand(20,1780),y=rand(20,1180);if(Math.hypot(x-900,y-600)>170)addProp("pine",x,y,{scale:rand(.75,1.35)});}
    for(let i=0;i<12;i++)addProp("pit",rand(300,1500),rand(240,990),{r:rand(22,38)});
    [[440,850],[930,580],[1420,330]].forEach((p,i)=>addItem("clue",p[0],p[1],{hidden:true,label:["čerstvá hlína","otisk krumpáče","zelený úlomek"][i]}));
    addPatrol("digger",[{x:500,y:250},{x:1450,y:280},{x:1480,y:880},{x:640,y:930}],{speed:88,vision:175});
    world.exit={x:1650,y:150,r:54,label:"Výjezd"};
  }

  function generateMalse(){
    world.runtime={papers:0,bossStarted:false,bossHits:0,bossDefeated:false};player.x=640;player.y=1040;
    for(let y=150;y<1100;y+=145){addProp("tree",510,y,{scale:1.05});addProp("lamp",650,y);}
    addProp("bridge",330,520,{scale:1}); addProp("slavie",1450,210,{scale:1.15}); addProp("sign",780,1000,{text:"Zátkovo nábřeží"});
    [[760,860],[1040,560],[1280,360]].forEach((p,i)=>addItem("paper",p[0],p[1],{label:["fotografie nálezů","souhlasy vlastníků","vážní protokol"][i]}));
    addPatrol("bike",[{x:620,y:1020},{x:620,y:180}],{speed:155,vision:0});
    addPatrol("car",[{x:970,y:1080},{x:970,y:160}],{speed:190,vision:0});
    addPatrol("police",[{x:1180,y:980},{x:1220,y:260}],{speed:92,vision:190});
    world.exit={x:1450,y:250,r:66,label:"KD Slávie"};
  }

  function startNew(){
    audio.start();audio.sfx("click");state=freshState();storage.remove(SAVE_KEY);showBrief(0);
  }
  function continueGame(){audio.start();if(!load()){startNew();return;}showBrief(state.levelIndex);}
  function showBrief(index){
    state.levelIndex=index;mode="brief";setPlaying(false);const l=LEVELS[index];
    $("briefKicker").textContent=`LOKALITA ${index+1} / ${LEVELS.length}`;$("briefTitle").textContent=l.title;$("briefText").textContent=l.text;$("briefGoal").textContent=l.goal;
    showOnly(screens.brief);
  }
  function enterLevel(){generateLevel(state.levelIndex);mode="playing";showOnly(null);setPlaying(true);audio.start();save();}

  function levelGoal(){
    const r=world.runtime;
    if(world.id==="chlum")return r.permit?`Kameny ${r.collected}/4`:`Promluv s Václavem`;
    if(world.id==="locenice")return `Správně ${r.correct}/5 · pravé ${r.real}/3`;
    if(world.id==="nesmen")return r.permit?`Profily ${r.dug}/3 · zahrabáno ${r.filled}/3`:`Získej souhlas lesníka`;
    if(world.id==="besednice")return r.bossStarted?(r.bossDefeated?"Ježek je v bezpečí":"Dostaň ježek zpět"):r.clues<3?`Stopy ${r.clues}/3`:`Vykopej ježkový profil`;
    if(world.id==="malse")return r.bossStarted?(r.bossDefeated?"Vstup do Slávie":"Dožeň Frantu"): `Dokumenty ${r.papers}/3`;
    return "Výprava";
  }
  function goalComplete(){
    const r=world.runtime;
    if(world.id==="chlum")return r.permit&&r.collected>=4;
    if(world.id==="locenice")return r.correct>=5&&r.real>=3;
    if(world.id==="nesmen")return r.permit&&r.dug>=3&&r.filled>=3;
    if(world.id==="besednice")return r.bossDefeated;
    if(world.id==="malse")return r.papers>=3&&r.bossDefeated;
    return false;
  }

  function updateHUD(force=false){
    if(!world)return;ui.missionNumber.textContent=state.levelIndex+1;ui.place.textContent=LEVELS[state.levelIndex].name.toUpperCase();ui.objective.textContent=levelGoal();
    ui.bag.textContent=state.stones.length;ui.heat.style.width=`${clamp(state.heat,0,100)}%`;
    ui.combo.textContent=`KOMBO ×${state.combo}`;ui.combo.classList.toggle("hidden",state.combo<=1);
  }

  function playerSpeed(){return 185*(1+state.perks.boots*.12);}
  function blocked(x,y){
    if(x<24||y<24||x>world.w-24||y>world.h-24)return true;
    for(const o of world.obstacles){if(x+player.r>o.x-o.w/2&&x-player.r<o.x+o.w/2&&y+player.r>o.y-o.h/2&&y-player.r<o.y+o.h/2)return true;}
    return false;
  }

  function lookAround(){
    if(scanCooldown>0){toast(`Znovu se můžeš rozhlédnout za ${scanCooldown.toFixed(1)} s`,"",700);return;}
    const radius=260+state.perks.scanner*55;scanPulse=.01;scanCooldown=Math.max(2.1,5-state.perks.scanner*.7);audio.sfx("scan");state.heat=clamp(state.heat+1.5,0,100);
    let count=0;
    for(const h of world.hotspots){if(h.active&&dist(player,h)<=radius){h.revealed=true;h.ttl=9;count++;}}
    for(const item of world.items){if(item.active&&item.hidden&&dist(player,item)<=radius){item.hidden=false;count++;}}
    toast(count?`Rozhlédnutí odhalilo ${count} stop${count===1?"u":"y"}`:"Tady nic není",count?"good":"",900);
  }

  function performAction(){
    if(mode!=="playing")return;
    findNearest();
    if(nearest){
      if(nearest.kind==="npc")talkNpc(nearest.ref);
      else if(nearest.kind==="hotspot")startDig(nearest.ref);
      else if(nearest.kind==="item")interactItem(nearest.ref);
      else if(nearest.kind==="hole")fillHole(nearest.ref);
      else if(nearest.kind==="rival")hitRival();
      else if(nearest.kind==="exit")tryExit();
    }else lookAround();
  }

  function talkNpc(npc){
    if(world.id==="chlum"&&!world.runtime.permit){showDialog("Václav","V","Sbírej jen v holých brázdách a před odjezdem nic nerozjeď. Pak jsme domluvení.",()=>{world.runtime.permit=true;npc.used=true;toast("Souhlas získán","good");});return;}
    if(world.id==="nesmen"&&!world.runtime.permit){showDialog("Lesník","L","Tři obdélníkové profily jsou povolené. Každý po prohlédnutí hned zahrab.",()=>{world.runtime.permit=true;npc.used=true;toast("Profily jsou povolené","good");});return;}
    showDialog(npc.name,npc.avatar,"Drž se úkolu a sleduj okolí.");
  }
  function showDialog(name,avatar,text,callback=null){mode="dialog";setPlaying(false);$("dialogName").textContent=name.toUpperCase();$("dialogAvatar").textContent=avatar;$("dialogText").textContent=text;dialogueCallback=callback;showOnly(screens.dialog);}
  function closeDialog(){screens.dialog.classList.remove("visible");dialogueCallback?.();dialogueCallback=null;mode="playing";setPlaying(true);updateHUD(true);}

  function startDig(h){
    if(!h.active)return;if(world.id==="chlum"&&!world.runtime.permit){state.heat=clamp(state.heat+15,0,100);toast("Nejdřív získej souhlas","bad");return;}
    currentDig=h;digMarker=Math.random();digDir=Math.random()<.5?-1:1;digHits=0;mode="dig";setPlaying(false);$("digHits").textContent="◇ ◇ ◇";$("digTitle").textContent=h.special==="hedgehog"?"Ježkový profil":"Drž rytmus lopaty";
    const width=18+state.perks.shovel*6;$("sweetZone").style.left=`${50-width/2}%`;$("sweetZone").style.width=`${width}%`;showOnly(screens.dig);
  }
  function digAttempt(){
    if(mode!=="dig")return;audio.sfx("dig");const width=.18+state.perks.shovel*.06;const good=Math.abs(digMarker-.5)<=width/2;
    if(good){shake=Math.max(shake,2.5);digHits++;audio.sfx("good");$("digHits").textContent=[0,1,2].map(i=>i<digHits?"◆":"◇").join(" ");if(digHits>=3)setTimeout(finishDig,160);}
    else{shake=Math.max(shake,7);flash=.12;flashColor="255,105,96";state.stats.misses++;state.heat=clamp(state.heat+Math.max(4,10-state.perks.quiet*2),0,100);audio.sfx("bad");toast("Hlučný úder","bad",650);}
  }
  function finishDig(){
    if(!currentDig)return;const h=currentDig;h.active=false;state.stats.digs++;screens.dig.classList.remove("visible");mode="playing";setPlaying(true);
    if(h.needsFill){
      world.runtime.dug++;
      world.runtime.open=(world.runtime.open||0)+1;
      const hole={type:"hole",x:h.x,y:h.y,r:46,w:h.w||74,h:h.h||42,angle:h.angle||0,active:true};
      world.items.push(hole);
      nearest={kind:"hole",ref:hole,x:hole.x,y:hole.y};
      toast("Profil je otevřený – klepni ZAHRABAT","bad",1700);
    }
    if(h.special==="hedgehog"){
      world.runtime.hedgehog=true;startRival("karel",h.x+120,h.y-80);toast("Ježek! Karel ho bere!","rare",1800);audio.sfx("rare");
    }else{
      const stone=makeStone(LEVELS[state.levelIndex].name,h.rarity||"common",h.documented!==false);addStone(stone,h.x,h.y);
      if(world.id==="chlum")world.runtime.collected++;
    }
    currentDig=null;findNearest();updateHUD(true);
  }

  function makeStone(locality,rarity="common",documented=true,qualityBonus=0){
    const bases={common:[.5,1.8],good:[1.5,3.8],rare:[3.2,7.2],hedgehog:[5.5,10.5]};const b=bases[rarity]||bases.common;
    const weight=+rand(b[0],b[1]).toFixed(2);const quality=clamp(Math.round(rand(58,92)+qualityBonus+state.perks.eye*2),45,100);
    const names={common:"Drobný vltavín",good:"Olivový splash",rare:"Výstavní celotvar",hedgehog:"Besednický ježek"};
    return{id:`s${Date.now()}${Math.random()}`,locality,rarity,weight,quality,documented,name:names[rarity],value:Math.round(weight*(rarity==="hedgehog"?4200:rarity==="rare"?1900:rarity==="good"?900:420)*(quality/75))};
  }
  function addStone(stone,x=player.x,y=player.y){
    state.stones.push(stone);state.stats.rare+=stone.rarity==="rare"||stone.rarity==="hedgehog"?1:0;
    const mult=stone.rarity==="hedgehog"?6:stone.rarity==="rare"?3:stone.rarity==="good"?1.6:1;state.score+=Math.round(stone.value*.18*state.combo*mult);
    boostCombo(stone.rarity==="rare"||stone.rarity==="hedgehog"?2:1);burst(x,y,stone.rarity==="rare"||stone.rarity==="hedgehog"?"#f2cb72":"#63e49b",stone.rarity==="hedgehog"?28:15);
    if(stone.rarity==="rare"||stone.rarity==="hedgehog"){shake=Math.max(shake,6);flash=.16;flashColor="242,203,114";}audio.sfx(stone.rarity==="rare"||stone.rarity==="hedgehog"?"rare":"good");toast(`${stone.name} · ${stone.weight.toFixed(2)} g`,stone.rarity==="rare"||stone.rarity==="hedgehog"?"rare":"good",1300);
  }
  function boostCombo(amount=1){state.combo=clamp(state.combo+amount,1,6);state.comboTimer=12;}
  function breakCombo(){state.combo=1;state.comboTimer=0;}

  function interactItem(item){
    if(!item.active)return;
    if(item.type==="stone"){
      item.active=false;const stone=makeStone(LEVELS[state.levelIndex].name,item.rarity||"common",item.documented!==false);addStone(stone,item.x,item.y);if(world.id==="chlum")world.runtime.collected++;return;
    }
    if(item.type==="sample"){currentSample=item;mode="identify";setPlaying(false);$("sampleTitle").textContent=item.sample.title;$("sampleDescription").textContent=item.sample.text;$("sampleGem").style.color=item.sample.real?"#70d999":"#33f48b";showOnly(screens.identify);return;}
    if(item.type==="clue"){
      item.active=false;world.runtime.clues++;audio.sfx("paper");toast(`Stopa: ${item.label}`,"good");boostCombo();if(world.runtime.clues>=3){addHotspot(980,520,{rarity:"hedgehog",documented:true,special:"hedgehog",revealed:true,marked:true});toast("Ježkový profil odhalen","rare",1700);}return;
    }
    if(item.type==="paper"){
      item.active=false;world.runtime.papers++;audio.sfx("paper");toast(`Nalezena: ${item.label}`,"good");boostCombo();if(world.runtime.papers>=3&&!world.runtime.bossStarted){setTimeout(()=>startRival("franta",1120,300),450);}return;
    }
  }
  function resolveSample(choice){
    if(!currentSample)return;const correct=choice===currentSample.sample.real;currentSample.active=false;world.runtime.identified++;screens.identify.classList.remove("visible");mode="playing";setPlaying(true);
    if(correct){world.runtime.correct++;state.stats.correct++;boostCombo();state.score+=220*state.combo;audio.sfx("good");toast("Správně","good");if(currentSample.sample.real){world.runtime.real++;addStone(makeStone("Ločenice",Math.random()<.2?"good":"common",true,state.perks.eye*3),currentSample.x,currentSample.y);}}
    else{state.heat=clamp(state.heat+12-state.perks.quiet*2,0,100);breakCombo();audio.sfx("bad");toast("Špatné určení","bad");}
    currentSample=null;updateHUD(true);
  }

  function fillHole(hole){
    if(!hole||!hole.active)return;
    hole.active=false;
    world.runtime.filled++;
    world.runtime.open=Math.max(0,(world.runtime.open||0)-1);
    state.score+=160*state.combo;
    boostCombo();
    audio.sfx("dig");
    burst(hole.x,hole.y,"#9a744c",12);
    toast("Profil zahrabán","good");
    nearest=null;
    findNearest();
    updateHUD(true);
    save();
  }

  function startRival(name,x,y){
    world.runtime.bossStarted=true;world.rival={name,x,y,r:24,hits:0,maxHits:name==="karel"?3:2,speed:name==="karel"?155:170,angle:0,target:{x:rand(250,1550),y:rand(220,950)},throwTimer:1.2,active:true};
    toast(name==="karel"?"Krystalový Karel utíká s ježkem!":"Franta bere poslední certifikát!","bad",1900);
  }
  function hitRival(){
    const r=world.rival;if(!r||!r.active)return;r.hits++;audio.sfx("catch");burst(r.x,r.y,"#ff8a72",18);r.target={x:rand(180,1620),y:rand(160,1020)};
    if(r.hits>=r.maxHits){r.active=false;world.runtime.bossDefeated=true;state.stats.rare++;if(r.name==="karel")addStone(makeStone("Besednice","hedgehog",true,8),r.x,r.y);else{state.score+=1800;toast("Certifikát je zpět","rare");audio.sfx("win");} }
    else toast(`Dostal jsi ho ${r.hits}/${r.maxHits}`,"good",750);
  }

  function tryExit(){if(!goalComplete()){toast(levelGoal(),"bad");return;}finishLevel();}
  function finishLevel(){
    mode="transition";setPlaying(false);state.score+=700+state.combo*120;save();
    if(state.levelIndex>=LEVELS.length-1){showJury();return;}
    showPerks();
  }
  function showPerks(){
    const candidates=PERKS.filter(p=>(state.perks[p.id]||0)<p.max).sort(()=>Math.random()-.5).slice(0,3);const list=$("perkList");list.innerHTML="";
    candidates.forEach(p=>{const b=document.createElement("button");b.type="button";b.className="perk-option";b.innerHTML=`<b>${p.icon}</b><span><strong>${p.name}</strong><small>${p.text}</small></span>`;b.addEventListener("click",()=>{audio.sfx("click");state.perks[p.id]++;state.levelIndex++;save();showBrief(state.levelIndex);});list.append(b);});
    showOnly(screens.perk);
  }

  function showJury(){mode="jury";jurySelection.clear();setPlaying(false);const list=$("juryList");list.innerHTML="";
    [...state.stones].sort((a,b)=>b.value-a.value).forEach(s=>{const b=document.createElement("button");b.type="button";b.className="stone-card";b.innerHTML=`<span>◆</span><div><strong>${escapeHtml(s.name)}</strong><small>${escapeHtml(s.locality)} · ${s.weight.toFixed(2)} g · stav ${s.quality}%${s.documented?" · doložený":""}</small></div>`;b.addEventListener("click",()=>{if(jurySelection.has(s.id)){jurySelection.delete(s.id);b.classList.remove("selected");}else if(jurySelection.size<3){jurySelection.add(s.id);b.classList.add("selected");}$("juryCount").textContent=`${jurySelection.size} / 3`;$("juryButton").disabled=jurySelection.size!==3;});list.append(b);});
    $("juryCount").textContent="0 / 3";$("juryButton").disabled=true;showOnly(screens.jury);
  }
  function judge(){
    const chosen=state.stones.filter(s=>jurySelection.has(s.id));let jury=0;for(const s of chosen){jury+=s.value*.45+s.quality*18+(s.documented?700:0)+(s.rarity==="hedgehog"?3800:s.rarity==="rare"?1700:s.rarity==="good"?500:100);}jury=Math.round(jury+state.score+Math.max(0,100-state.caught*12)*18);
    let title="Sbírka byla přijata",text="Výprava dorazila do Slávie a našla své místo mezi vystavovateli.";
    if(jury>=25000){title="Hlavní cena Zelené vlny";text="Pestrá, doložená a dobře zvolená kolekce získala hlavní ocenění večera.";}
    else if(jury>=17500){title="Výstavní uznání";text="Porota ocenila kvalitu kamenů i cestu napříč jihočeskými lokalitami.";}
    state.score=jury;addRecord(jury,title);storage.remove(SAVE_KEY);audio.sfx("win");
    $("resultTitle").textContent=title;$("resultScore").textContent=jury.toLocaleString("cs-CZ");$("resultText").textContent=text;
    $("resultStats").innerHTML=`<div><span>KAMENY</span><strong>${state.stones.length}</strong></div><div><span>VZÁCNÉ</span><strong>${state.stats.rare}</strong></div><div><span>DOPADENÍ</span><strong>${state.caught}</strong></div>`;showOnly(screens.result);mode="result";
  }

  function caught(reason){
    if(player.invuln>0)return;player.invuln=2;shake=12;flash=.22;flashColor="255,90,80";state.caught++;state.heat=20;breakCombo();audio.sfx("catch");
    let lost=null;if(state.stones.length){const sorted=[...state.stones].sort((a,b)=>a.value-b.value);lost=state.perks.case>0&&sorted.length>1?sorted[0]:pick(sorted.slice(0,Math.min(2,sorted.length)));state.stones=state.stones.filter(s=>s.id!==lost.id);}
    player.x=world.id==="malse"?640:world.id==="chlum"?360:world.id==="nesmen"?360:170;player.y=world.id==="malse"?1040:world.id==="chlum"?1070:world.id==="nesmen"?1050:1030;toast(`${reason}${lost?` · ztracen ${lost.name}`:""}`,"bad",1800);updateHUD(true);
  }

  function update(dt){
    audio.update(dt,mode==="playing");
    if(mode==="dig"){digMarker+=digDir*dt*1.4;if(digMarker>=1){digMarker=1;digDir=-1;}if(digMarker<=0){digMarker=0;digDir=1;}$("digMarker").style.left=`calc(${digMarker*100}% - 5px)`;return;}
    if(mode!=="playing"||!world)return;
    scanCooldown=Math.max(0,scanCooldown-dt);player.invuln=Math.max(0,player.invuln-dt);shake=Math.max(0,shake-dt*24);flash=Math.max(0,flash-dt*.9);state.heat=Math.max(0,state.heat-dt*4.2);state.comboTimer=Math.max(0,state.comboTimer-dt);if(state.comboTimer<=0&&state.combo>1){state.combo--;state.comboTimer=5;}
    const len=Math.hypot(input.x,input.y);if(len>.04){const nx=input.x/Math.max(1,len),ny=input.y/Math.max(1,len);const speed=playerSpeed()*(len>.78?1.28:1);const x=player.x+nx*speed*dt,y=player.y+ny*speed*dt;if(!blocked(x,player.y))player.x=x;if(!blocked(player.x,y))player.y=y;player.angle=Math.atan2(ny,nx);player.step+=dt*(len>.78?13:9);if(Math.floor(player.step*2)%4===0&&Math.random()<.08)audio.sfx("step");}
    updateHotspots(dt);updatePatrols(dt);updateRival(dt);updateParticles(dt);findNearest();
    camera.x=lerp(camera.x,clamp(player.x-viewport.w/2,0,Math.max(0,world.w-viewport.w)),1-Math.exp(-5*dt));camera.y=lerp(camera.y,clamp(player.y-viewport.h/2,0,Math.max(0,world.h-viewport.h)),1-Math.exp(-5*dt));
    if(scanPulse>0){scanPulse+=dt*1.4;if(scanPulse>1)scanPulse=0;}
    if(state.heat>=100)caught("Hlídka tě zastavila");updateHUD();
  }

  function updateHotspots(dt){for(const h of world.hotspots){if(!h.active)continue;if(h.revealed){h.ttl-=dt;if(h.ttl<=0&&!h.marked)h.revealed=false;}}}
  function updatePatrols(dt){
    for(const p of world.patrols){if(!p.active)continue;const target=p.points[p.index],dx=target.x-p.x,dy=target.y-p.y,d=Math.hypot(dx,dy)||1;p.x+=dx/d*p.speed*dt;p.y+=dy/d*p.speed*dt;p.angle=Math.atan2(dy,dx);if(d<12)p.index=(p.index+1)%p.points.length;
      if(p.type==="tractor"||p.type==="bike"||p.type==="car"){const rr=p.type==="tractor"?42:25;if(Math.hypot(p.x-player.x,p.y-player.y)<rr+player.r)caught(p.type==="tractor"?"Traktor tě srazil":"Pozor na provoz");continue;}
      let suspicious=true;if(p.requires==="permit"&&world.runtime.permit)suspicious=false;if(p.type==="ranger"&&world.runtime.open<=0)suspicious=false;if(p.type==="police"&&world.runtime.papers>=3&&!world.rival?.active)suspicious=false;
      if(!suspicious||!p.vision)continue;const vx=player.x-p.x,vy=player.y-p.y,dd=Math.hypot(vx,vy);const dot=(vx/dd)*Math.cos(p.angle)+(vy/dd)*Math.sin(p.angle);if(dd<p.vision&&dot>.52){state.heat=clamp(state.heat+dt*34,0,100);}
    }
  }
  function updateRival(dt){
    const r=world.rival;
    if(r&&r.active){const dx=r.target.x-r.x,dy=r.target.y-r.y,d=Math.hypot(dx,dy)||1;r.x+=dx/d*r.speed*dt;r.y+=dy/d*r.speed*dt;r.angle=Math.atan2(dy,dx);if(d<28)r.target={x:rand(170,1630),y:rand(150,1040)};
      r.throwTimer-=dt;if(r.throwTimer<=0){r.throwTimer=1.1+Math.random()*.8;world.hazards.push({type:"clod",x:r.x,y:r.y,vx:Math.cos(r.angle+Math.PI)*150,vy:Math.sin(r.angle+Math.PI)*150,life:2,r:10});}}
    for(const h of world.hazards){if(h.type!=="clod")continue;h.x+=h.vx*dt;h.y+=h.vy*dt;h.life-=dt;if(h.life>0&&Math.hypot(h.x-player.x,h.y-player.y)<h.r+player.r){h.life=0;state.heat=clamp(state.heat+15,0,100);toast("Zásah hroudou","bad",650);}}
    world.hazards=world.hazards.filter(h=>h.life>0);
  }
  function updateParticles(dt){for(const p of world.particles){p.life-=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=20*dt;}world.particles=world.particles.filter(p=>p.life>0);}

  function findNearest(){
    nearest=null;let best=100;const check=(kind,ref,x,y,range=68)=>{const d=Math.hypot(x-player.x,y-player.y);if(d<range&&d<best){best=d;nearest={kind,ref,x,y};}};
    for(const p of world.props)if(p.type==="npc"&&!p.used)check("npc",p,p.x,p.y);
    for(const h of world.hotspots)if(h.active&&h.revealed)check("hotspot",h,h.x,h.y);
    for(const i of world.items)if(i.active&&!i.hidden)check(i.type==="hole"?"hole":"item",i,i.x,i.y,i.type==="hole"?98:68);
    if(world.rival?.active)check("rival",world.rival,world.rival.x,world.rival.y);
    if(world.exit)check("exit",world.exit,world.exit.x,world.exit.y,88);
    if(nearest){const map={npc:["!","MLUVIT"],hotspot:["⛏","KOPAT"],item:["◆","SEBRAT"],hole:["▨","ZAHRABAT"],rival:["✋","CHYTIT"],exit:["→","ODEJÍT"]};const m=map[nearest.kind]||["◎","AKCE"];ui.actionIcon.textContent=m[0];ui.actionText.textContent=m[1];$("actionButton").classList.add("ready");showHint(nearest.kind==="exit"?nearest.ref.label:m[1]);}
    else{ui.actionIcon.textContent="◉";ui.actionText.textContent=scanCooldown>0?`${Math.ceil(scanCooldown)}`:"ROZHLÉDNOUT";$("actionButton").classList.remove("ready");hideHint();}
  }

  function burst(x,y,color,count=14){for(let i=0;i<count;i++)world.particles.push({x,y,vx:rand(-90,90),vy:rand(-120,-30),life:rand(.45,.9),color,r:rand(2,5)});}

  function render(){
    ctx.setTransform(viewport.dpr,0,0,viewport.dpr,0,0);ctx.clearRect(0,0,viewport.w,viewport.h);
    if(!world){drawMenuBackdrop();return;}
    ctx.save();const sx=shake?(Math.random()-.5)*shake:0,sy=shake?(Math.random()-.5)*shake:0;ctx.translate(sx-camera.x,sy-camera.y);drawGround();drawWorldObjects();drawEffects();ctx.restore();drawScreenVignette();drawObjectiveArrow();
  }

  function drawMenuBackdrop(){const g=ctx.createLinearGradient(0,0,0,viewport.h);g.addColorStop(0,"#142a35");g.addColorStop(.52,"#2b4633");g.addColorStop(1,"#3b2d22");ctx.fillStyle=g;ctx.fillRect(0,0,viewport.w,viewport.h);}

  function drawGround(){
    if(world.theme==="field")drawField();
    else if(world.theme==="meadow")drawMeadow();
    else if(world.theme==="forest"||world.theme==="night")drawForest();
    else drawCity();
  }
  function drawField(){ctx.fillStyle="#493526";ctx.fillRect(0,0,world.w,world.h);for(let y=150;y<world.h;y+=118){ctx.fillStyle=y%236===0?"#5b412d":"#3c2d22";roundRect(ctx,50,y,1700,54,28);ctx.fill();ctx.strokeStyle="rgba(218,170,108,.12)";ctx.lineWidth=2;for(let x=80;x<1740;x+=55){ctx.beginPath();ctx.moveTo(x,y+8);ctx.lineTo(x+28,y+44);ctx.stroke();}}ctx.fillStyle="#253b2c";ctx.fillRect(0,0,world.w,150);}
  function drawMeadow(){ctx.fillStyle="#4f6b39";ctx.fillRect(0,0,world.w,world.h);for(let i=0;i<180;i++){const x=(i*97)%world.w,y=(i*53)%world.h;ctx.fillStyle=i%3?"rgba(202,222,142,.18)":"rgba(44,72,42,.2)";ctx.fillRect(x,y,3,9);}ctx.strokeStyle="#8c7b58";ctx.lineWidth=130;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(260,1110);ctx.bezierCurveTo(470,740,830,760,940,530);ctx.bezierCurveTo(1110,230,1400,390,1630,100);ctx.stroke();ctx.strokeStyle="rgba(218,209,166,.32)";ctx.lineWidth=4;ctx.stroke();}
  function drawForest(){
    const night = world.theme === "night";
    const sandy = world.id === "nesmen";
    ctx.fillStyle = night ? "#203329" : (sandy ? "#4f5f3d" : "#3a4930");
    ctx.fillRect(0,0,world.w,world.h);
    if (sandy) {
      for (let i=0;i<12;i++) {
        const x = 130 + (i*147)%1550;
        const y = 100 + (i*193)%960;
        const w = 180 + (i%4)*36;
        const h = 90 + (i%3)*22;
        ctx.fillStyle = i%2 ? "rgba(201,176,121,.15)" : "rgba(227,204,154,.12)";
        ctx.beginPath(); ctx.ellipse(x,y,w,h,(i%5)*.22,0,Math.PI*2); ctx.fill();
      }
      for (let i=0;i<260;i++) {
        const x=(i*97)%world.w, y=(i*67)%world.h;
        ctx.fillStyle = i%3 ? "rgba(92,77,49,.18)" : "rgba(224,198,149,.16)";
        ctx.fillRect(x,y,2+(i%3),2+(i%2));
      }
      for (let i=0;i<120;i++) {
        const x=(i*151)%world.w, y=(i*89)%world.h;
        ctx.strokeStyle = i%2 ? "rgba(109,86,58,.18)" : "rgba(86,70,48,.14)";
        ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x,y); ctx.lineTo(x+12,y+4); ctx.lineTo(x+18,y+10); ctx.stroke();
      }
    } else {
      for(let i=0;i<210;i++){const x=(i*113)%world.w,y=(i*71)%world.h;ctx.fillStyle=i%2?"rgba(93,77,48,.22)":"rgba(25,53,34,.25)";ctx.beginPath();ctx.arc(x,y,2+(i%7),0,Math.PI*2);ctx.fill();}
    }
    ctx.strokeStyle=night?"#2f3024":(sandy?"#8f7650":"#6d563a");
    ctx.lineWidth=night?105:112;ctx.lineCap="round";ctx.beginPath();ctx.moveTo(150,1100);ctx.bezierCurveTo(500,900,520,580,890,620);ctx.bezierCurveTo(1250,660,1330,330,1660,130);ctx.stroke();
    if (sandy) {
      ctx.strokeStyle = "rgba(226,208,171,.58)"; ctx.lineWidth = 68; ctx.beginPath(); ctx.moveTo(150,1100);ctx.bezierCurveTo(500,900,520,580,890,620);ctx.bezierCurveTo(1250,660,1330,330,1660,130);ctx.stroke();
      ctx.strokeStyle = "rgba(186,158,110,.34)"; ctx.lineWidth = 92; ctx.setLineDash([10,20]); ctx.beginPath(); ctx.moveTo(150,1100);ctx.bezierCurveTo(500,900,520,580,890,620);ctx.bezierCurveTo(1250,660,1330,330,1660,130);ctx.stroke(); ctx.setLineDash([]);
    }
  }
  function drawCity(){ctx.fillStyle="#46514b";ctx.fillRect(0,0,world.w,world.h);ctx.fillStyle="#315e67";ctx.fillRect(0,0,420,world.h);for(let y=0;y<world.h;y+=42){ctx.fillStyle=y%84?"rgba(255,255,255,.04)":"rgba(179,224,230,.05)";ctx.fillRect(0,y,420,20);}ctx.fillStyle="#7b786d";ctx.fillRect(420,0,120,world.h);ctx.fillStyle="#b2ad9f";ctx.fillRect(540,0,340,world.h);ctx.fillStyle="#3e4145";ctx.fillRect(880,0,210,world.h);ctx.strokeStyle="#e3dcbf";ctx.setLineDash([28,25]);ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(985,0);ctx.lineTo(985,world.h);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle="#85877f";ctx.fillRect(1090,0,710,world.h);}

  function drawWorldObjects(){
    const drawables=[];world.props.forEach(o=>drawables.push({y:o.y,kind:"prop",o}));world.items.filter(o=>o.active&&!o.hidden).forEach(o=>drawables.push({y:o.y,kind:"item",o}));world.hotspots.filter(o=>o.active&&o.revealed).forEach(o=>drawables.push({y:o.y,kind:"hotspot",o}));world.patrols.filter(o=>o.active).forEach(o=>drawables.push({y:o.y,kind:"patrol",o}));if(world.rival?.active)drawables.push({y:world.rival.y,kind:"rival",o:world.rival});drawables.push({y:player.y,kind:"player",o:player});drawables.sort((a,b)=>a.y-b.y);
    for(const d of drawables){if(d.kind==="prop")drawProp(d.o);else if(d.kind==="item")drawItem(d.o);else if(d.kind==="hotspot")drawHotspot(d.o);else if(d.kind==="patrol")drawPatrol(d.o);else if(d.kind==="rival")drawActor(d.o.x,d.o.y,"rival",d.o.angle,d.o.name);else drawPlayer();}
    if(world.exit)drawExit(world.exit);
  }

  function drawProp(p){ctx.save();ctx.translate(p.x,p.y);const s=p.scale||1;ctx.scale(s,s);
    if(p.type==="tree"||p.type==="pine"){ctx.fillStyle="rgba(0,0,0,.25)";ellipse(0,17,35,13);ctx.fillStyle="#5b4029";roundRect(ctx,-8,-12,16,48,7);ctx.fill();const col=p.type==="pine"?(world.theme==="night"?"#173527":"#285c39"):"#3e713d";ctx.fillStyle=col;for(const q of p.type==="pine"?[[0,-55,32],[0,-30,38],[0,-5,42]]:[[-16,-35,28],[14,-38,30],[0,-58,34],[0,-18,38]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill();}}
    else if(p.type==="bush"){ctx.fillStyle="rgba(0,0,0,.2)";ellipse(0,12,28,10);ctx.fillStyle="#3c743c";for(const q of [[-14,-2,17],[10,-8,20],[0,-20,19]]){ctx.beginPath();ctx.arc(q[0],q[1],q[2],0,Math.PI*2);ctx.fill();}}
    else if(p.type==="fern"){ctx.strokeStyle="#2b6a3f";ctx.lineWidth=3;for(const a of [-.85,-.45,-.1,.2,.55,.9]){ctx.beginPath();ctx.moveTo(0,16);ctx.quadraticCurveTo(a*10,-2,a*16,-24);ctx.stroke();}}
    else if(p.type==="grass"){ctx.strokeStyle="#88a864";ctx.lineWidth=2;for(const a of [-7,-3,0,4,8]){ctx.beginPath();ctx.moveTo(a,14);ctx.quadraticCurveTo(a*.4,-2,a*1.2,-18-(Math.abs(a)%3));ctx.stroke();}}
    else if(p.type==="stump"){ctx.fillStyle="rgba(0,0,0,.2)";ellipse(0,12,18,7);ctx.fill();ctx.fillStyle="#6d4d32";roundRect(ctx,-14,-8,28,24,6);ctx.fill();ctx.fillStyle="#c7a06a";ctx.beginPath();ctx.ellipse(0,-8,14,7,0,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#8f6d45";ctx.lineWidth=2;ctx.stroke();}
    else if(p.type==="log"){ctx.rotate(p.angle||0);ctx.fillStyle="#6a4b31";roundRect(ctx,-30,-8,60,16,7);ctx.fill();ctx.fillStyle="#5a3f2b";ctx.beginPath();ctx.arc(-24,0,7,0,Math.PI*2);ctx.arc(24,0,7,0,Math.PI*2);ctx.fill();}
    else if(p.type==="puddle"){ctx.fillStyle="rgba(99,151,153,.46)";ellipse(0,0,p.r||28,(p.r||28)*.45);ctx.strokeStyle="rgba(214,242,238,.25)";ctx.stroke();}
    else if(p.type==="rock"){ctx.fillStyle="rgba(0,0,0,.22)";ellipse(0,12,20,8);ctx.fillStyle="#767465";ctx.beginPath();ctx.moveTo(-18,10);ctx.lineTo(-12,-11);ctx.lineTo(5,-18);ctx.lineTo(21,1);ctx.lineTo(12,16);ctx.closePath();ctx.fill();}
    else if(p.type==="farm"||p.type==="hut"){ctx.fillStyle="rgba(0,0,0,.25)";ellipse(0,22,58,15);ctx.fillStyle=p.type==="farm"?"#d7c7a7":"#74543a";roundRect(ctx,-47,-38,94,60,5);ctx.fill();ctx.fillStyle="#7c392f";ctx.beginPath();ctx.moveTo(-57,-38);ctx.lineTo(0,-78);ctx.lineTo(57,-38);ctx.closePath();ctx.fill();ctx.fillStyle="#49342a";ctx.fillRect(-12,-12,24,34);}
    else if(p.type==="npc")drawActor(0,0,p.role==="owner"?"ranger":"farmer",0,p.name,true);
    else if(p.type==="pit"){ctx.fillStyle="rgba(0,0,0,.4)";ellipse(0,0,p.r||28,(p.r||28)*.65);ctx.strokeStyle="#6e5138";ctx.lineWidth=7;ctx.stroke();}
    else if(p.type==="sign"){ctx.fillStyle="#744e2f";ctx.fillRect(-4,-30,8,50);ctx.fillStyle="#d5c49d";roundRect(ctx,-42,-52,84,28,5);ctx.fill();ctx.fillStyle="#3f3427";ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillText(p.text||"",0,-34);}
    else if(p.type==="lamp"){ctx.fillStyle="#3c4344";ctx.fillRect(-3,-55,6,70);ctx.fillStyle="#ffe6a0";ctx.beginPath();ctx.arc(0,-57,8,0,Math.PI*2);ctx.fill();}
    else if(p.type==="bridge"){ctx.fillStyle="#4f6f78";roundRect(ctx,-115,-28,230,56,16);ctx.fill();ctx.strokeStyle="#a8cad0";ctx.lineWidth=4;ctx.beginPath();ctx.arc(0,25,105,Math.PI,0);ctx.stroke();}
    else if(p.type==="slavie"){ctx.fillStyle="rgba(0,0,0,.25)";ellipse(0,40,125,20);ctx.fillStyle="#ded8c7";roundRect(ctx,-120,-95,240,135,5);ctx.fill();ctx.fillStyle="#e8e1cf";ctx.beginPath();ctx.moveTo(-128,-95);ctx.lineTo(0,-145);ctx.lineTo(128,-95);ctx.closePath();ctx.fill();ctx.fillStyle="#3b5964";for(let yy=-75;yy<10;yy+=38)for(let xx=-92;xx<=92;xx+=46)roundRect(ctx,xx-11,yy,22,25,8),ctx.fill();ctx.fillStyle="#5b3928";roundRect(ctx,-15,5,30,35,4);ctx.fill();ctx.fillStyle="#2e6e4c";roundRect(ctx,-55,-125,110,19,5);ctx.fill();ctx.fillStyle="#e7f5ea";ctx.font="bold 10px sans-serif";ctx.textAlign="center";ctx.fillText("NA ZELENÉ VLNĚ",0,-112);}
    ctx.restore();
  }

  function drawActor(x,y,type,angle=0,name="",local=false){
    ctx.save(); if(!local)ctx.translate(x,y); ctx.rotate(0);
    const styles = {
      farmer:{coat:"#8b6242",trim:"#a77a52",pants:"#31424a",skin:"#cc9570",hair:"#7d5f39",hat:"#927245"},
      ranger:{coat:"#446749",trim:"#60895d",pants:"#2a3940",skin:"#c9936d",hair:"#33412f",hat:"#223628"},
      police:{coat:"#325f8a",trim:"#4d86b3",pants:"#273742",skin:"#cb9470",hair:"#24394d",hat:"#21384b"},
      digger:{coat:"#6e3a35",trim:"#955148",pants:"#32252a",skin:"#bb815e",hair:"#302624",hat:"#2b2524"},
      rival:{coat:"#73403a",trim:"#b26f61",pants:"#34272a",skin:"#be8562",hair:"#302624",hat:"#2b2524"},
      player:{coat:"#3d754e",trim:"#61a173",pants:"#25343a",skin:"#c88e67",hair:"#183526",hat:"#163728"}
    };
    const s = styles[type] || styles.farmer;
    ctx.fillStyle="rgba(0,0,0,.28)"; ellipse(0,16,20,8);
    ctx.fillStyle=s.pants; roundRect(ctx,-12,2,9,21,4); ctx.fill(); roundRect(ctx,3,2,9,21,4); ctx.fill();
    ctx.fillStyle="#1c2327"; ctx.fillRect(-13,21,11,4); ctx.fillRect(2,21,11,4);
    ctx.fillStyle=s.coat; roundRect(ctx,-17,-28,34,36,10); ctx.fill();
    ctx.fillStyle=s.trim; roundRect(ctx,-12,-23,24,24,6); ctx.fill();
    ctx.fillStyle="#2f2118"; ctx.fillRect(-4,-8,8,7);
    ctx.strokeStyle=s.trim; ctx.lineWidth=5; ctx.beginPath(); ctx.moveTo(-15,-18); ctx.lineTo(-20,-2); ctx.moveTo(15,-18); ctx.lineTo(20,-2); ctx.stroke();
    ctx.fillStyle=s.skin; ctx.beginPath(); ctx.arc(-20,0,3.2,0,Math.PI*2); ctx.arc(20,0,3.2,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=s.skin; ctx.fillRect(-3,-31,6,5); ctx.beginPath(); ctx.arc(0,-41,11,0,Math.PI*2); ctx.fill();
    ctx.fillStyle=s.hair; ctx.beginPath(); ctx.arc(0,-45,11,Math.PI,0); ctx.fill();
    ctx.fillStyle=s.hat; roundRect(ctx,-13,-51,26,8,4); ctx.fill(); ctx.fillRect(-8,-54,16,4);
    ctx.fillStyle=s.skin; ctx.beginPath(); ctx.arc(-4.2,-41,1.2,0,Math.PI*2); ctx.arc(4.2,-41,1.2,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle="rgba(70,40,28,.75)"; ctx.lineWidth=1.4; ctx.beginPath(); ctx.moveTo(-3,-35); ctx.quadraticCurveTo(0,-33,3,-35); ctx.stroke();
    if(type==="rival"||type==="digger"){ctx.strokeStyle="#8b633d";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(15,-18);ctx.lineTo(26,18);ctx.stroke();}
    if(type==="player"){ctx.fillStyle="#6c4a2f";roundRect(ctx,-12,-22,24,21,5);ctx.fill();ctx.strokeStyle="#8a5d35";ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(14,-20);ctx.lineTo(23,18);ctx.stroke();}
    ctx.restore();
  }
  function drawPlayer(){
    ctx.save();ctx.translate(player.x,player.y);const blink=player.invuln>0&&Math.floor(player.invuln*10)%2===0;ctx.globalAlpha=blink?.4:1;
    drawActor(0,0,"player",0,"",true);
    ctx.fillStyle="rgba(122,183,148,.16)";roundRect(ctx,-18,-28,36,37,12);ctx.strokeStyle="rgba(255,255,255,.08)";ctx.lineWidth=2;ctx.stroke();
    ctx.restore();
  }
  function drawPatrol(p){if(p.vision){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle=p.type==="police"?"rgba(80,145,255,.11)":"rgba(255,213,104,.09)";ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,p.vision,-.57,.57);ctx.closePath();ctx.fill();ctx.restore();}if(p.type==="tractor"){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);ctx.fillStyle="#b94c2f";roundRect(ctx,-32,-19,64,38,8);ctx.fill();ctx.fillStyle="#26343b";ctx.fillRect(-8,-29,28,23);ctx.fillStyle="#171717";for(const q of [[-25,-22],[-25,22],[25,-22],[25,22]]){ctx.beginPath();ctx.arc(q[0],q[1],10,0,Math.PI*2);ctx.fill();}ctx.restore();return;}if(p.type==="car"||p.type==="bike"){ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle);if(p.type==="car"){ctx.fillStyle="#8a4742";roundRect(ctx,-24,-13,48,26,8);ctx.fill();ctx.fillStyle="#273f48";ctx.fillRect(-9,-16,22,12);}else{ctx.strokeStyle="#263a40";ctx.lineWidth=3;ctx.beginPath();ctx.arc(-10,8,8,0,Math.PI*2);ctx.arc(10,8,8,0,Math.PI*2);ctx.stroke();ctx.fillStyle="#d1a16e";ctx.beginPath();ctx.arc(0,-10,7,0,Math.PI*2);ctx.fill();}ctx.restore();return;}drawActor(p.x,p.y,p.type,p.angle,p.type);}
  function drawItem(i){ctx.save();ctx.translate(i.x,i.y);const bob=Math.sin(performance.now()*.005+i.x)*4;if(i.type==="stone"||i.type==="sample"){ctx.translate(0,bob);ctx.fillStyle="rgba(64,230,135,.15)";ctx.beginPath();ctx.arc(0,0,24,0,Math.PI*2);ctx.fill();ctx.fillStyle=i.type==="sample"?"#43f58a":"#5bd98d";gemPath(0,0,13);ctx.fill();}else if(i.type==="clue"){ctx.fillStyle="#74adff";ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle="#d6e7ff";ctx.lineWidth=3;ctx.stroke();}else if(i.type==="paper"){ctx.fillStyle="#e7dfbd";ctx.rotate(-.12);ctx.fillRect(-14,-18,28,36);ctx.strokeStyle="#607b8f";ctx.strokeRect(-14,-18,28,36);ctx.fillStyle="#6f8798";ctx.fillRect(-8,-8,16,3);ctx.fillRect(-8,0,14,3);}else if(i.type==="hole"){ctx.rotate(i.angle||0);ctx.fillStyle="#8b6847";roundRect(ctx,-(i.w||72)/2-7,-(i.h||42)/2-7,(i.w||72)+14,(i.h||42)+14,8);ctx.fill();ctx.fillStyle="#17120e";roundRect(ctx,-(i.w||72)/2,-(i.h||42)/2,i.w||72,i.h||42,5);ctx.fill();ctx.strokeStyle="#b28a5a";ctx.lineWidth=3;ctx.stroke();ctx.fillStyle="#d0aa70";ctx.font="bold 17px sans-serif";ctx.textAlign="center";ctx.fillText("↶",0,6);}ctx.restore();}
  function drawHotspot(h){ctx.save();ctx.translate(h.x,h.y);const pulse=1+Math.sin(performance.now()*.006+h.x)*.08;ctx.scale(pulse,pulse);ctx.rotate(h.angle||0);ctx.strokeStyle=h.special?"#f2cb72":"#72e5a1";ctx.lineWidth=3;ctx.setLineDash([7,6]);if(h.needsFill||h.special==="hedgehog"){roundRect(ctx,-(h.w||74)/2,-(h.h||42)/2,h.w||74,h.h||42,6);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=h.special?"rgba(242,203,114,.12)":"rgba(114,229,161,.1)";roundRect(ctx,-(h.w||74)/2+5,-(h.h||42)/2+5,(h.w||74)-10,(h.h||42)-10,4);ctx.fill();}else{ctx.beginPath();ctx.arc(0,0,27,0,Math.PI*2);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle=h.special?"rgba(242,203,114,.12)":"rgba(114,229,161,.1)";ctx.beginPath();ctx.arc(0,0,22,0,Math.PI*2);ctx.fill();}ctx.restore();}
  function drawExit(e){ctx.save();ctx.translate(e.x,e.y);const pulse=1+Math.sin(performance.now()*.004)*.08;ctx.scale(pulse,pulse);ctx.fillStyle=goalComplete()?"rgba(99,228,155,.19)":"rgba(255,255,255,.05)";ctx.beginPath();ctx.arc(0,0,e.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle=goalComplete()?"#63e49b":"rgba(255,255,255,.25)";ctx.lineWidth=4;ctx.stroke();ctx.fillStyle="#fff";ctx.font="bold 12px sans-serif";ctx.textAlign="center";ctx.fillText(e.label,0,4);ctx.restore();}
  function drawEffects(){if(scanPulse>0){const radius=260+state.perks.scanner*55,ang=player.angle-Math.PI+scanPulse*Math.PI*2;ctx.save();ctx.translate(player.x,player.y);ctx.rotate(ang);ctx.fillStyle=`rgba(106,236,163,${(1-scanPulse)*.16})`;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,radius,-.34,.34);ctx.closePath();ctx.fill();ctx.strokeStyle=`rgba(142,245,185,${1-scanPulse})`;ctx.lineWidth=3;ctx.beginPath();ctx.arc(0,0,radius*.72,-.34,.34);ctx.stroke();ctx.restore();}for(const h of world.hazards){ctx.fillStyle="#7b5635";ctx.beginPath();ctx.arc(h.x,h.y,h.r,0,Math.PI*2);ctx.fill();}for(const p of world.particles){ctx.globalAlpha=clamp(p.life*1.4,0,1);ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill();ctx.globalAlpha=1;}if(world.theme==="night"){ctx.save();ctx.fillStyle="rgba(2,7,6,.56)";ctx.fillRect(camera.x,camera.y,viewport.w,viewport.h);ctx.globalCompositeOperation="destination-out";const g=ctx.createRadialGradient(player.x,player.y,45,player.x,player.y,285);g.addColorStop(0,"rgba(0,0,0,1)");g.addColorStop(1,"rgba(0,0,0,0)");ctx.fillStyle=g;ctx.beginPath();ctx.arc(player.x,player.y,295,0,Math.PI*2);ctx.fill();ctx.restore();}}
  function drawScreenVignette(){const g=ctx.createRadialGradient(viewport.w/2,viewport.h/2,Math.min(viewport.w,viewport.h)*.25,viewport.w/2,viewport.h/2,Math.max(viewport.w,viewport.h)*.72);g.addColorStop(0,"rgba(0,0,0,0)");g.addColorStop(1,"rgba(0,0,0,.26)");ctx.fillStyle=g;ctx.fillRect(0,0,viewport.w,viewport.h);if(world?.theme==="field"){ctx.strokeStyle="rgba(190,225,229,.15)";ctx.lineWidth=1;const t=performance.now()*.18;for(let i=0;i<28;i++){const x=(i*83+t)% (viewport.w+80)-40;const y=(i*47+t*.7)% (viewport.h+60)-30;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x-8,y+18);ctx.stroke();}}if(flash>0){ctx.fillStyle=`rgba(${flashColor},${flash})`;ctx.fillRect(0,0,viewport.w,viewport.h);}if(state.heat>65){ctx.strokeStyle=`rgba(255,90,80,${(state.heat-65)/90})`;ctx.lineWidth=16;ctx.strokeRect(0,0,viewport.w,viewport.h);}}
  function drawObjectiveArrow(){if(!world||!world.exit)return;let target=world.exit;if(!goalComplete()){const candidates=[];for(const h of world.hotspots)if(h.active&&h.revealed)candidates.push(h);for(const i of world.items)if(i.active&&!i.hidden)candidates.push(i);if(candidates.length)target=candidates.sort((a,b)=>dist(player,a)-dist(player,b))[0];}const sx=target.x-camera.x,sy=target.y-camera.y;if(sx>40&&sy>70&&sx<viewport.w-40&&sy<viewport.h-100)return;const cx=viewport.w/2,cy=viewport.h/2,ang=Math.atan2(sy-cy,sx-cx),rad=Math.min(viewport.w,viewport.h)*.38;ctx.save();ctx.translate(cx+Math.cos(ang)*rad,cy+Math.sin(ang)*rad);ctx.rotate(ang);ctx.fillStyle=goalComplete()?"#63e49b":"#f2cb72";ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(-10,-9);ctx.lineTo(-10,9);ctx.closePath();ctx.fill();ctx.restore();}

  function roundRect(c,x,y,w,h,r){c.beginPath();c.roundRect(x,y,w,h,r);}
  function ellipse(x,y,rx,ry){ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
  function gemPath(x,y,r){ctx.beginPath();ctx.moveTo(x,y-r);ctx.lineTo(x+r*.8,y-r*.35);ctx.lineTo(x+r*.65,y+r*.7);ctx.lineTo(x,y+r);ctx.lineTo(x-r*.75,y+r*.35);ctx.lineTo(x-r*.8,y-r*.4);ctx.closePath();}

  function loop(now){const dt=Math.min(.035,(now-last)/1000||.016);last=now;update(dt);render();requestAnimationFrame(loop);}

  function setupControls(){
    const zone=$("moveZone"),stick=$("stick");let pid=null;
    const move=e=>{const r=zone.getBoundingClientRect(),dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2),max=r.width*.33,len=Math.hypot(dx,dy)||1,s=Math.min(1,max/len),x=dx*s,y=dy*s;input.x=x/max;input.y=y/max;stick.style.transform=`translate(calc(-50% + ${x}px),calc(-50% + ${y}px))`;};
    zone.addEventListener("pointerdown",e=>{pid=e.pointerId;zone.setPointerCapture(pid);move(e);});zone.addEventListener("pointermove",e=>{if(e.pointerId===pid)move(e);});
    const end=e=>{if(e.pointerId!==pid)return;pid=null;input.x=input.y=0;stick.style.transform="translate(-50%,-50%)";};zone.addEventListener("pointerup",end);zone.addEventListener("pointercancel",end);
    const action=$("actionButton");action.addEventListener("pointerdown",e=>{e.preventDefault();action.classList.add("active");performAction();});const stop=()=>action.classList.remove("active");action.addEventListener("pointerup",stop);action.addEventListener("pointercancel",stop);
    addEventListener("keydown",e=>{if(["ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(e.code))e.preventDefault();if(e.code==="Space")performAction();if(e.code==="Escape"&&mode==="playing")pause();const x=(e.code==="KeyD"||e.code==="ArrowRight")?1:(e.code==="KeyA"||e.code==="ArrowLeft")?-1:0;const y=(e.code==="KeyS"||e.code==="ArrowDown")?1:(e.code==="KeyW"||e.code==="ArrowUp")?-1:0;if(x)input.x=x;if(y)input.y=y;});
    addEventListener("keyup",e=>{if(["KeyA","KeyD","ArrowLeft","ArrowRight"].includes(e.code))input.x=0;if(["KeyW","KeyS","ArrowUp","ArrowDown"].includes(e.code))input.y=0;});
  }

  function pause(){if(mode!=="playing")return;mode="pause";setPlaying(false);showOnly(screens.pause);}
  function resume(){screens.pause.classList.remove("visible");mode="playing";setPlaying(true);last=performance.now();}
  function toMenu(){save();mode="menu";world=null;setPlaying(false);showOnly(screens.title);refreshContinue();}
  function showRecords(){const list=$("recordsList"),rows=getRecords();list.innerHTML="";if(!rows.length){list.innerHTML="<li><span>–</span><div>Zatím žádná dokončená výprava</div></li>";}else rows.forEach((r,i)=>{const li=document.createElement("li");li.innerHTML=`<b>${i+1}.</b><div><strong>${escapeHtml(r.title)}</strong><small>${r.stones} kamenů · ${new Date(r.date).toLocaleDateString("cs-CZ")}</small></div><strong>${Number(r.score).toLocaleString("cs-CZ")}</strong>`;list.append(li);});showOnly(screens.records);}

  function bindUI(){
    $("playButton").addEventListener("click",startNew);$("continueButton").addEventListener("click",continueGame);$("briefButton").addEventListener("click",enterLevel);
    $("digButton").addEventListener("click",digAttempt);$("realButton").addEventListener("click",()=>resolveSample(true));$("glassButton").addEventListener("click",()=>resolveSample(false));$("dialogButton").addEventListener("click",closeDialog);
    $("juryButton").addEventListener("click",judge);$("againButton").addEventListener("click",()=>{state=freshState();world=null;mode="menu";showOnly(screens.title);refreshContinue();});
    $("pauseButton").addEventListener("click",pause);$("resumeButton").addEventListener("click",resume);$("menuButton").addEventListener("click",toMenu);
    $("soundButton").addEventListener("click",()=>{state.sound=audio.toggle();$("soundButton").textContent=state.sound?"♫":"×";save();});
    $("howButton").addEventListener("click",()=>showOnly(screens.how));$("closeHowButton").addEventListener("click",()=>showOnly(screens.title));
    $("recordsButton").addEventListener("click",showRecords);$("resultRecordsButton").addEventListener("click",showRecords);$("closeRecordsButton").addEventListener("click",()=>showOnly(mode==="result"?screens.result:screens.title));
  }

  function lockPageGestures(){
    const prevent=e=>e.preventDefault();
    document.addEventListener("gesturestart",prevent,{passive:false});
    document.addEventListener("gesturechange",prevent,{passive:false});
    document.addEventListener("gestureend",prevent,{passive:false});
    document.addEventListener("touchmove",e=>{if(e.touches&&e.touches.length>1)e.preventDefault();},{passive:false});
  }

  function boot(){resize();lockPageGestures();setupControls();bindUI();refreshContinue();addEventListener("resize",()=>requestAnimationFrame(resize));addEventListener("orientationchange",()=>setTimeout(resize,120));visualViewport?.addEventListener("resize",()=>requestAnimationFrame(resize));document.addEventListener("visibilitychange",()=>{if(document.hidden&&mode==="playing")pause();});if("serviceWorker"in navigator&&location.protocol.startsWith("http"))addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));requestAnimationFrame(loop);}
  try{boot();}catch(error){console.error(error);$("playButton").disabled=true;$("playButton").innerHTML="<span>CHYBA SPUŠTĚNÍ</span><small>obnov stránku</small>";}
})();
