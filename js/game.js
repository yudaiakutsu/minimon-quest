"use strict";
// ======================== ミニモンクエスト ゲーム本体 ========================

const cv = document.getElementById("screen");
const ctx = cv.getContext("2d");
ctx.imageSmoothingEnabled = false;
const W = 240, H = 160, TILE = 16;

// ---------- 入力 ----------
const Input = { held: new Set(), pressed: new Set() };
function inDown(b) { if (!Input.held.has(b)) Input.pressed.add(b); Input.held.add(b); }
function inUp(b) { Input.held.delete(b); }
const KEYMAP = {
  ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right",
  KeyZ: "a", Space: "a", KeyX: "b", Enter: "start",
};
addEventListener("keydown", e => { const b = KEYMAP[e.code]; if (b) { e.preventDefault(); inDown(b); } });
addEventListener("keyup", e => { const b = KEYMAP[e.code]; if (b) inUp(b); });
for (const [id, b] of [["btn-up", "up"], ["btn-down", "down"], ["btn-left", "left"], ["btn-right", "right"], ["btn-a", "a"], ["btn-b", "b"], ["btn-start", "start"]]) {
  const el = document.getElementById(id);
  el.addEventListener("pointerdown", e => { e.preventDefault(); el.setPointerCapture(e.pointerId); inDown(b); });
  el.addEventListener("pointerup", e => { e.preventDefault(); inUp(b); });
  el.addEventListener("pointercancel", () => inUp(b));
}
document.body.addEventListener("touchmove", e => e.preventDefault(), { passive: false });

// ---------- ユーティリティ ----------
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const randint = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
let waiters = [];
function waitFrames(n) { return new Promise(r => waiters.push({ n, r })); }

// ---------- スプライト ----------
const SPR = {};
function buildSprite(def, palOverride) {
  const c = document.createElement("canvas");
  c.width = 16; c.height = 16;
  const g = c.getContext("2d");
  const pal = Object.assign({}, def.pal, palOverride || {});
  def.g.forEach((row, y) => {
    for (let x = 0; x < 16 && x < row.length; x++) {
      const ch = row[x];
      if (ch === "." || !pal[ch]) continue;
      g.fillStyle = pal[ch];
      g.fillRect(x, y, 1, 1);
    }
  });
  return c;
}
function initSprites() {
  for (const k in PIXEL) SPR[k] = buildSprite(PIXEL[k]);
  const swaps = {
    prof: { C: "#e8e8e8", B: "#f8f8f8", P: "#607080", H: "#b0b0b0" },
    boy: { C: "#30a060", B: "#f0a030", P: "#806030" },
    lady: { C: "#d070b0", B: "#9050c0", P: "#703890", H: "#804020" },
    rival: { C: "#404048", B: "#c03030", P: "#282830", H: "#181818" },
  };
  for (const key in swaps) {
    for (const d of ["down", "up", "left"]) {
      SPR[key + "_" + d] = buildSprite(PIXEL["player_" + d], swaps[key]);
    }
  }
}
function drawSpr(key, x, y, flip, scale) {
  const s = SPR[key];
  if (!s) return;
  const sc = scale || 1;
  ctx.save();
  if (flip) { ctx.translate(x + 16 * sc, y); ctx.scale(-sc, sc); }
  else { ctx.translate(x, y); ctx.scale(sc, sc); }
  ctx.drawImage(s, 0, 0);
  ctx.restore();
}
function charSprKey(base, dir) {
  if (dir === "right") return [base + "_left", true];
  return [base + "_" + dir, false];
}

// ---------- タイル描画 ----------
let tick = 0;
function drawTileAt(t, mx, my, sx, sy) {
  const n = (mx * 7919 + my * 104729) % 4;
  const px = (ox, oy, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(sx + ox, sy + oy, w, h); };
  switch (t) {
    case ".": case ",": case "T":
      px(0, 0, 16, 16, "#88c870");
      px((n * 5) % 12 + 2, (n * 7) % 12 + 2, 2, 1, "#74b45e");
      px((n * 3) % 12 + 1, (n * 11) % 12 + 1, 1, 2, "#74b45e");
      if (t === ",") {
        px(4, 4, 3, 3, n % 2 ? "#f06060" : "#f0d040");
        px(10, 9, 3, 3, n % 2 ? "#f0d040" : "#f06060");
        px(5, 5, 1, 1, "#fff"); px(11, 10, 1, 1, "#fff");
      }
      if (t === "T") {
        px(0, 2, 16, 13, "#50a048");
        for (let i = 0; i < 4; i++) {
          px(i * 4, 3, 2, 5, "#2e7c2e");
          px(i * 4 + 2, 8, 2, 5, "#3c8c3c");
        }
        px(0, 14, 16, 2, "#388038");
      }
      break;
    case "P":
      px(0, 0, 16, 16, "#e0c890");
      px((n * 3) % 13 + 1, (n * 5) % 13 + 1, 2, 2, "#d0b478");
      px(0, 0, 16, 1, "#cdb377");
      break;
    case "R":
      px(0, 0, 16, 16, "#88c870");
      px(2, 10, 12, 5, "#231a10");
      px(6, 9, 4, 6, "#6a4426");
      px(1, 1, 14, 10, "#2e7c2e");
      px(2, 0, 12, 3, "#3c9444");
      px(3, 3, 4, 3, "#4cac54");
      px(9, 5, 4, 2, "#4cac54");
      break;
    case "W": {
      const wv = Math.floor(tick / 30) % 2;
      px(0, 0, 16, 16, "#4090e0");
      px(2 + wv * 2, 4, 5, 1, "#80c0f0");
      px(9 - wv * 2, 11, 5, 1, "#80c0f0");
      break;
    }
    case "r":
      px(0, 0, 16, 16, "#d05848");
      px(0, 4, 16, 1, "#a83828");
      px(0, 10, 16, 1, "#a83828");
      px(0, 15, 16, 1, "#882818");
      break;
    case "w":
      px(0, 0, 16, 16, "#f0e0c0");
      px(0, 0, 16, 2, "#d8c8a0");
      px(0, 14, 16, 2, "#d8c8a0");
      break;
    case "o":
      px(0, 0, 16, 16, "#f0e0c0");
      px(2, 3, 12, 10, "#1a1a1a");
      px(3, 4, 10, 8, "#90d0f0");
      px(7, 4, 2, 8, "#1a1a1a");
      break;
    case "D":
      px(0, 0, 16, 16, "#f0e0c0");
      px(2, 1, 12, 15, "#1a1a1a");
      px(3, 2, 10, 14, "#905030");
      px(10, 8, 2, 2, "#f0d040");
      break;
    case "S":
      px(0, 0, 16, 16, "#88c870");
      px(7, 9, 2, 6, "#6a4426");
      px(2, 2, 12, 8, "#a87848");
      px(3, 3, 10, 6, "#c89868");
      px(4, 5, 8, 1, "#705030");
      px(4, 7, 6, 1, "#705030");
      break;
    case "k":
      px(0, 0, 16, 16, "#a06840");
      px(1, 2, 14, 5, "#604020");
      px(2, 3, 3, 4, "#d04040"); px(6, 3, 3, 4, "#4060c0"); px(10, 3, 3, 4, "#40a060");
      px(1, 9, 14, 5, "#604020");
      px(2, 10, 3, 4, "#40a060"); px(6, 10, 3, 4, "#d0a040"); px(10, 10, 3, 4, "#d04040");
      break;
    case "f":
      px(0, 0, 16, 16, "#e8d8b0");
      px(0, 0, 1, 16, "#d8c498");
      px(0, 0, 16, 1, "#d8c498");
      break;
    case "t":
      px(0, 0, 16, 16, "#e8d8b0");
      px(1, 2, 14, 11, "#c09050");
      px(1, 2, 14, 2, "#d8a860");
      px(2, 13, 2, 2, "#805020"); px(12, 13, 2, 2, "#805020");
      break;
    case "e":
      px(0, 0, 16, 16, "#e8d8b0");
      px(1, 1, 14, 14, "#d04040");
      px(1, 1, 14, 4, "#f8f8f8");
      px(2, 6, 12, 8, "#e86060");
      break;
    case "M":
      px(0, 0, 16, 16, "#a06840");
      px(2, 2, 12, 12, "#60b080");
      px(4, 4, 8, 8, "#80d0a0");
      break;
    default:
      px(0, 0, 16, 16, "#88c870");
  }
}

// ---------- テキスト ----------
function wrapText(t, n = 21) {
  const out = [];
  for (const seg of String(t).split("\n")) {
    let s = seg;
    while (s.length > n) { out.push(s.slice(0, n)); s = s.slice(n); }
    out.push(s);
  }
  return out;
}
function paginate(t) {
  const lines = wrapText(t);
  const pages = [];
  for (let i = 0; i < lines.length; i += 2) pages.push(lines.slice(i, i + 2));
  return pages;
}
function drawBox(x, y, w, h) {
  ctx.fillStyle = "#303860";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = "#f8f8f8";
  ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
  ctx.fillStyle = "#9098c0";
  ctx.fillRect(x + 2, y + h - 3, w - 4, 1);
}
function drawText(str, x, y, color) {
  ctx.fillStyle = color || "#283030";
  ctx.font = '10px "Hiragino Kaku Gothic ProN", sans-serif';
  ctx.textBaseline = "top";
  ctx.fillText(str, x, y);
}

// ---------- シーン管理 ----------
let sceneStack = [];
function popScene(s) {
  const i = sceneStack.indexOf(s);
  if (i >= 0) sceneStack.splice(i, 1);
}

// 会話ウィンドウ
class DialogScene {
  constructor(text, res) {
    this.pages = paginate(text);
    this.pi = 0; this.ci = 0; this.res = res;
  }
  update() {
    const full = this.pages[this.pi].join("").length;
    if (this.ci < full) {
      this.ci += (Input.held.has("a") || Input.held.has("b")) ? 3 : 1;
      if (this.ci > full) this.ci = full;
    } else if (Input.pressed.has("a") || Input.pressed.has("b")) {
      this.pi++;
      this.ci = 0;
      if (this.pi >= this.pages.length) { popScene(this); this.res(); }
    }
  }
  draw() {
    drawBox(4, 112, 232, 44);
    let rest = this.ci;
    const lines = this.pages[this.pi];
    for (let i = 0; i < lines.length; i++) {
      const seg = lines[i].slice(0, Math.max(0, rest));
      rest -= lines[i].length;
      drawText(seg, 12, 120 + i * 16);
    }
    const full = lines.join("").length;
    if (this.ci >= full && Math.floor(tick / 20) % 2) drawText("▼", 220, 142, "#c03030");
  }
}
function say(text) {
  return new Promise(res => sceneStack.push(new DialogScene(text, res)));
}

// 選択ウィンドウ
class ChoiceScene {
  constructor(opts, res) {
    this.items = opts.items;
    this.cols = opts.cols || 1;
    this.cancel = opts.cancel !== false;
    this.prompt = opts.prompt || null;
    this.cur = 0;
    this.res = res;
    const rows = Math.ceil(this.items.length / this.cols);
    if (opts.rect) {
      this.x = opts.rect[0]; this.y = opts.rect[1];
      this.w = opts.rect[2];
      this.h = opts.rect[3] || rows * 14 + 10;
    } else {
      this.w = 110;
      this.h = rows * 14 + 10;
      this.x = W - 6 - this.w;
      this.y = 106 - this.h;
    }
  }
  update() {
    const n = this.items.length, c = this.cols;
    if (Input.pressed.has("down") && this.cur + c < n) this.cur += c;
    if (Input.pressed.has("up") && this.cur - c >= 0) this.cur -= c;
    if (c > 1) {
      if (Input.pressed.has("right") && this.cur % c < c - 1 && this.cur + 1 < n) this.cur++;
      if (Input.pressed.has("left") && this.cur % c > 0) this.cur--;
    }
    if (Input.pressed.has("a")) { popScene(this); this.res(this.cur); }
    else if (this.cancel && Input.pressed.has("b")) { popScene(this); this.res(-1); }
  }
  draw() {
    if (this.prompt) {
      drawBox(4, 112, 232, 44);
      const lines = wrapText(this.prompt);
      lines.slice(0, 2).forEach((l, i) => drawText(l, 12, 120 + i * 16));
    }
    drawBox(this.x, this.y, this.w, this.h);
    const colW = Math.floor((this.w - 14) / this.cols);
    this.items.forEach((it, i) => {
      const r = Math.floor(i / this.cols), c = i % this.cols;
      const tx = this.x + 14 + c * colW, ty = this.y + 6 + r * 14;
      drawText(it, tx, ty);
      if (i === this.cur) drawText("▶", tx - 11, ty, "#c03030");
    });
  }
}
function choice(opts) {
  return new Promise(res => sceneStack.push(new ChoiceScene(opts, res)));
}

// ---------- ゲーム状態 ----------
const SAVEKEY = "mmq_save_v1";
const game = {
  mapId: "town", px: 9, py: 9, dir: "down",
  moving: false, prog: 0, tx: 0, ty: 0, walkFlip: false,
  party: [], box: [], bag: { capsule: 0, potion: 0 },
  money: 0,
  dex: { seen: {}, caught: {} },
  flags: {},
  fade: 0,
};
function dexSee(sp) { if (!game.dex) game.dex = { seen: {}, caught: {} }; game.dex.seen[sp] = true; }
function dexCatch(sp) { dexSee(sp); game.dex.caught[sp] = true; }

// バッジ一覧(章ごとに追加)
const BADGES = [
  { flag: "badge1", name: "もりのバッジ", town: "コカゲまち" },
];
function curMap() { return MAPS[game.mapId]; }
function tileAt(map, x, y) {
  if (y < 0 || y >= map.grid.length || x < 0 || x >= map.grid[0].length) return null;
  return map.grid[y][x];
}
function visibleNpcs(map) {
  return (map.npcs || []).filter(n => n.visible(game.flags));
}
function saveGame() {
  localStorage.setItem(SAVEKEY, JSON.stringify({
    party: game.party, box: game.box, bag: game.bag, money: game.money, dex: game.dex, flags: game.flags,
    mapId: game.mapId, px: game.px, py: game.py,
  }));
}
function loadGame() {
  const d = JSON.parse(localStorage.getItem(SAVEKEY));
  Object.assign(game, d, { moving: false, prog: 0, dir: "down", fade: 8 });
  if (!game.dex) game.dex = { seen: {}, caught: {} };
  if (game.money == null) game.money = 0;
  // 手持ち・ボックスは捕獲済みとして図鑑に反映
  game.party.concat(game.box).forEach(m => dexCatch(m.sp));
}

// ---------- ミニモン生成・計算 ----------
function expFor(l) { return l * l * l; }
function calcStats(m) {
  const b = SPECIES[m.sp].base;
  m.maxHp = Math.floor(2 * b.hp * m.level / 100) + m.level + 10;
  m.stats = {
    atk: Math.floor(2 * b.atk * m.level / 100) + 5,
    def: Math.floor(2 * b.def * m.level / 100) + 5,
    spd: Math.floor(2 * b.spd * m.level / 100) + 5,
  };
}
function makeMon(sp, level) {
  const s = SPECIES[sp];
  const m = { sp, name: s.name, type: s.type, level, exp: expFor(level), moves: [], stages: { atk: 0, def: 0, spd: 0 } };
  calcStats(m);
  m.hp = m.maxHp;
  for (const [lv, mv] of s.learnset) {
    if (lv <= level && !m.moves.includes(mv)) {
      m.moves.push(mv);
      if (m.moves.length > 4) m.moves.shift();
    }
  }
  return m;
}
function stageMul(s) { return s >= 0 ? (2 + s) / 2 : 2 / (2 - s); }
function calcDamage(att, def, mv) {
  const crit = Math.random() < 1 / 16;
  const a = att.stats.atk * (crit ? Math.max(1, stageMul(att.stages.atk)) : stageMul(att.stages.atk));
  const d = def.stats.def * (crit ? Math.min(1, stageMul(def.stages.def)) : stageMul(def.stages.def));
  let dmg = Math.floor(Math.floor(2 * att.level / 5 + 2) * mv.power * a / Math.max(1, d) / 50) + 2;
  if (crit) dmg *= 2;
  if (mv.type === att.type) dmg = Math.floor(dmg * 1.5);
  const eff = typeMult(mv.type, def.type);
  dmg = Math.floor(dmg * eff);
  dmg = Math.floor(dmg * (85 + Math.random() * 16) / 100);
  return { dmg: Math.max(eff > 0 ? 1 : 0, dmg), eff, crit };
}
function drawHPBar(x, y, w, ratio) {
  ctx.fillStyle = "#404840";
  ctx.fillRect(x - 1, y - 1, w + 2, 5);
  ctx.fillStyle = "#e8e8d8";
  ctx.fillRect(x, y, w, 3);
  const r = clamp(ratio, 0, 1);
  ctx.fillStyle = r > 0.5 ? "#40c048" : r > 0.2 ? "#f0c030" : "#e04038";
  ctx.fillRect(x, y, Math.round(w * r), 3);
}

// ---------- バッグ ----------
async function bagMenu(battle) {
  while (true) {
    const items = [`モンカプセル ×${game.bag.capsule}`, `キズぐすり  ×${game.bag.potion}`];
    const i = await choice({ items, prompt: `しょじきん  ${game.money}えん`, rect: [4, 112, 232, 44] });
    if (i < 0) return null;
    if (i === 0) {
      if (!battle) { await say("たたかいの ときに つかおう。"); continue; }
      if (!battle.wild) { await say("ひとさまの ミニモンに なげては いけない!"); continue; }
      if (game.bag.capsule <= 0) { await say("モンカプセルを もっていない!"); continue; }
      game.bag.capsule--;
      return { type: "capsule" };
    } else {
      if (game.bag.potion <= 0) { await say("キズぐすりを もっていない!"); continue; }
      let target;
      if (battle) target = battle.playerMon;
      else {
        const pi = await choice({ items: game.party.map(m => `${m.name} HP${m.hp}/${m.maxHp}`), rect: [12, 8, 216] });
        if (pi < 0) continue;
        target = game.party[pi];
      }
      if (target.hp >= target.maxHp) { await say("HPは まんたんだ!"); continue; }
      game.bag.potion--;
      target.hp = Math.min(target.maxHp, target.hp + 20);
      await say(`${target.name}の HPが かいふくした!`);
      if (battle) return { type: "item" };
    }
  }
}

// ---------- ショップ ----------
const SHOP_ITEMS = {
  capsule: { name: "モンカプセル", price: 200, key: "capsule" },
  potion:  { name: "キズぐすり",   price: 150, key: "potion" },
};
async function shopMenu(stock) {
  await say("いらっしゃい!\nなにを かって いくんだい?");
  while (true) {
    const items = stock.map(id => `${SHOP_ITEMS[id].name}  ${SHOP_ITEMS[id].price}えん`);
    items.push("やめる");
    const i = await choice({ items, prompt: `しょじきん  ${game.money}えん`, rect: [4, 112, 232, 44], cols: 1 });
    if (i < 0 || i === stock.length) {
      await say("毎度あり!\nまた きておくれ。");
      return;
    }
    const it = SHOP_ITEMS[stock[i]];
    const maxBuy = Math.min(99, Math.floor(game.money / it.price));
    if (maxBuy < 1) { await say("おかねが たりないようだね…"); continue; }
    // 個数えらび(上下で増減・A決定・Bキャンセル)
    const qty = await numberPicker(1, maxBuy, `${it.name}を いくつ?`, n => `${it.price * n}えん`);
    if (qty <= 0) continue;
    const cost = it.price * qty;
    game.money -= cost;
    game.bag[it.key] += qty;
    await say(`${it.name}を ${qty}こ かった!\n(${cost}えん)`);
  }
}
class NumberPicker {
  constructor(min, max, prompt, costFn, res) {
    this.min = min; this.max = max; this.val = min;
    this.prompt = prompt; this.costFn = costFn; this.res = res;
  }
  update() {
    if (Input.pressed.has("up")) this.val = Math.min(this.max, this.val + 1);
    if (Input.pressed.has("down")) this.val = Math.max(this.min, this.val - 1);
    if (Input.pressed.has("right")) this.val = Math.min(this.max, this.val + 10);
    if (Input.pressed.has("left")) this.val = Math.max(this.min, this.val - 10);
    if (Input.pressed.has("a")) { popScene(this); this.res(this.val); }
    else if (Input.pressed.has("b")) { popScene(this); this.res(0); }
  }
  draw() {
    drawBox(4, 112, 232, 44);
    drawText(this.prompt, 12, 118);
    drawText("▲▼ で こすう  " + this.costFn(this.val), 12, 134);
    drawBox(176, 108, 56, 22);
    drawText("× " + this.val, 186, 114);
  }
}
function numberPicker(min, max, prompt, costFn) {
  return new Promise(res => sceneStack.push(new NumberPicker(min, max, prompt, costFn, res)));
}

// ---------- バッジ画面 ----------
class BadgeScene {
  constructor(res) { this.res = res; }
  update() { if (Input.pressed.has("a") || Input.pressed.has("b")) { popScene(this); this.res(); } }
  draw() {
    ctx.fillStyle = "#283048"; ctx.fillRect(0, 0, W, H);
    drawBox(8, 6, W - 16, 18);
    drawText("ジムバッジ", 16, 10);
    const got = BADGES.filter(b => game.flags[b.flag]).length;
    drawText(`${got} / 8`, 196, 10, "#c08828");
    for (let i = 0; i < 8; i++) {
      const col = i % 4, row = Math.floor(i / 4);
      const x = 24 + col * 52, y = 36 + row * 56;
      const b = BADGES[i];
      const has = b && game.flags[b.flag];
      ctx.fillStyle = has ? "#f0c030" : "#3a4258";
      ctx.beginPath(); ctx.arc(x + 16, y + 14, 14, 0, Math.PI * 2); ctx.fill();
      if (has) {
        ctx.fillStyle = "#fff8d0";
        ctx.beginPath(); ctx.arc(x + 11, y + 9, 3, 0, Math.PI * 2); ctx.fill();
      }
      ctx.strokeStyle = "#1a1a1a"; ctx.lineWidth = 1; ctx.stroke();
      drawText(has ? b.name : "------", x - 6, y + 32, has ? "#f8f8f8" : "#70788c");
    }
    drawText("Aボタンで もどる", 80, 150, "#9098c0");
  }
}
function showBadges() { return new Promise(res => sceneStack.push(new BadgeScene(res))); }

// ---------- 図鑑画面 ----------
class DexScene {
  constructor(res) {
    this.res = res; this.cur = 0;
    this.list = Object.keys(SPECIES);
  }
  update() {
    const n = this.list.length;
    if (Input.pressed.has("down")) this.cur = (this.cur + 1) % n;
    if (Input.pressed.has("up")) this.cur = (this.cur + n - 1) % n;
    if (Input.pressed.has("a") || Input.pressed.has("b")) { popScene(this); this.res(); }
  }
  draw() {
    ctx.fillStyle = "#283048"; ctx.fillRect(0, 0, W, H);
    const caught = this.list.filter(sp => game.dex.caught[sp]).length;
    const seen = this.list.filter(sp => game.dex.seen[sp]).length;
    drawBox(6, 4, 150, 18);
    drawText("ミニモンずかん", 12, 8);
    drawText(`み:${seen} と:${caught}`, 162, 8, "#c08828");
    // リスト(7行ウィンドウ)
    const top = clamp(this.cur - 3, 0, Math.max(0, this.list.length - 7));
    for (let r = 0; r < 7 && top + r < this.list.length; r++) {
      const idx = top + r, sp = this.list[idx];
      const y = 28 + r * 16;
      const seenIt = game.dex.seen[sp], caughtIt = game.dex.caught[sp];
      if (idx === this.cur) drawText("▶", 8, y, "#f8d030");
      const no = String(idx + 1).padStart(2, "0");
      const nm = seenIt ? SPECIES[sp].name : "？？？？？";
      drawText(`No.${no} ${nm}`, 20, y, seenIt ? "#f8f8f8" : "#70788c");
      drawText(caughtIt ? "●" : seenIt ? "○" : "", 150, y, "#40c048");
    }
    // 選択中の絵
    const sp = this.list[this.cur];
    drawBox(170, 26, 64, 84);
    if (game.dex.seen[sp]) {
      drawSpr(SPECIES[sp].sprite, 178, 40, false, 3);
      drawText(SPECIES[sp].type, 178, 92, "#90c0e0");
    } else {
      drawText("？", 196, 60, "#70788c");
    }
    drawText("Aボタンで もどる", 80, 150, "#9098c0");
  }
}
function showDex() { return new Promise(res => sceneStack.push(new DexScene(res))); }

// ---------- メニュー ----------
async function openMenu() {
  while (true) {
    const i = await choice({ items: ["ミニモン", "ずかん", "バッグ", "バッジ", "レポート", "とじる"], rect: [132, 8, 100] });
    if (i < 0 || i === 5) return;
    if (i === 0) {
      if (!game.party.length) { await say("ミニモンを もっていない。"); continue; }
      while (true) {
        const pi = await choice({ items: game.party.map(m => `${m.name} Lv${m.level} HP${m.hp}/${m.maxHp}`), rect: [12, 8, 216] });
        if (pi < 0) break;
        const m = game.party[pi];
        await say(`${m.name} Lv${m.level} ${m.type}タイプ\nこうげき${m.stats.atk} ぼうぎょ${m.stats.def} すばやさ${m.stats.spd}`);
      }
    }
    if (i === 1) await showDex();
    if (i === 2) await bagMenu(null);
    if (i === 3) await showBadges();
    if (i === 4) { saveGame(); await say("レポートに しっかり かきのこした!"); }
  }
}

// ---------- イベント ----------
async function starterBall(sp) {
  if (game.flags.starterChosen) {
    await say("モンスターカプセルだ。\nのこりのこは はかせが そだてるらしい。");
    return;
  }
  const s = SPECIES[sp];
  await say(`${s.name}(${s.type}タイプ)が はいっている。`);
  const c = await choice({ items: ["なかまに する", "やめておく"] });
  if (c !== 0) return;
  game.party.push(makeMon(sp, 5));
  dexCatch(sp);
  game.flags.starterChosen = true;
  game.flags.starter = sp;
  await say(`${PLAYER_NAME}は ${s.name}を なかまに した!`);
  await say(`オカダはかせ「おお いい えらびかただ!\nこれも もっていきなさい」`);
  game.bag.capsule += 5;
  game.bag.potion += 3;
  await say("モンカプセル 5こと キズぐすり 3こを\nてにいれた!");
  await say("オカダはかせ「きたの 1ばんルートには\nやせいの ミニモンが たくさん いるぞ」");
  await say("「よわらせてから カプセルを なげれば\nなかまに できる。いってらっしゃい!」");
}

async function rivalBattle() {
  await say(`${RIVAL_NAME}「おっ ${PLAYER_NAME}!\nもう ミニモンを もらったんだな?」`);
  await say("「それなら オレと しょうぶだ!」");
  const sp = RIVAL_COUNTER[game.flags.starter] || "shizukun";
  const result = await startBattle({ trainer: { name: `ライバルの ${RIVAL_NAME}`, mon: makeMon(sp, 6) } });
  if (result === "win") {
    game.flags.rivalBeaten = true;
    await say(`${RIVAL_NAME}「くっそー! つぎは まけないからな!」`);
    await say(`${RIVAL_NAME}は まちへ かえっていった。`);
  } else if (result === "loss") {
    await whiteout();
  }
}

// データ定義(NPCのbattle / talk内)から呼ぶ汎用トレーナー戦
async function trainerBattleData(b) {
  if (b.intro) await say(b.intro);
  const team = b.team.map(([sp, lv]) => makeMon(sp, lv));
  const result = await startBattle({ trainer: { name: b.name, team } });
  if (result === "win") {
    if (b.flag) game.flags[b.flag] = true;
    if (b.win) await say(b.win);
    const topLv = Math.max(...team.map(m => m.level));
    const prize = b.prize != null ? b.prize : topLv * 80;
    if (prize > 0) {
      game.money += prize;
      await say(`${b.name}から\nおこづかい ${prize}えんを もらった!`);
    }
    const r = b.reward;
    if (r) {
      if (r.capsule) game.bag.capsule += r.capsule;
      if (r.potion) game.bag.potion += r.potion;
      if (r.badge) game.flags[r.badge] = true;
    }
    if (b.after) await b.after();
  } else if (result === "loss") {
    await whiteout();
  }
  return result;
}

function npcInteract(npc) {
  const opp = { up: "down", down: "up", left: "right", right: "left" };
  npc.dir = opp[game.dir];
  if (npc.battle) {
    if (game.flags[npc.battle.flag]) say(npc.battle.post || npc.battle.win || "…");
    else trainerBattleData(npc.battle);
    return;
  }
  if (npc.talk) npc.talk();
}

async function whiteout() {
  await say(`${PLAYER_NAME}は めのまえが まっくらに なった…`);
  game.party.forEach(m => { m.hp = m.maxHp; });
  game.mapId = "town";
  game.px = 9; game.py = 9; game.dir = "down";
  game.fade = 12;
  await say("いえに つれかえって もらったようだ。\nミニモンは げんきに なった!");
}

// ---------- ワールド ----------
const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

const world = {
  update() {
    if (game.fade > 0) { game.fade--; return; }
    if (game.moving) {
      game.prog += 2;
      if (game.prog >= TILE) {
        game.px = game.tx; game.py = game.ty;
        game.moving = false; game.prog = 0;
        game.walkFlip = !game.walkFlip;
        this.onArrive();
      }
      return;
    }
    let d = null;
    for (const dir of ["up", "down", "left", "right"]) if (Input.held.has(dir)) { d = dir; break; }
    if (d) this.tryMove(d);
    else if (Input.pressed.has("a")) this.interact();
    else if (Input.pressed.has("start")) openMenu();
  },

  tryMove(d) {
    game.dir = d;
    const map = curMap();
    const [dx, dy] = DIRV[d];
    const tx = game.px + dx, ty = game.py + dy;
    // マップ端 → 接続マップへ
    const edges = map.edges || {};
    if (ty < 0 && edges.n) return this.gotoMap(edges.n, d);
    if (ty >= map.grid.length && edges.s) return this.gotoMap(edges.s, d);
    const t = tileAt(map, tx, ty);
    if (t === null || SOLID_TILES.has(t)) return;
    if (visibleNpcs(map).some(n => n.x === tx && n.y === ty)) return;
    if ((map.objects || []).some(o => o.x === tx && o.y === ty)) return;
    game.tx = tx; game.ty = ty;
    game.moving = true; game.prog = 0;
  },

  gotoMap(dest, dir) {
    game.mapId = dest.map;
    game.px = dest.x; game.py = dest.y;
    game.dir = dir || game.dir;
    game.fade = 10;
  },

  onArrive() {
    const map = curMap();
    // ワープ(ドア・マット)
    const wp = (map.warps || []).find(w => w.x === game.px && w.y === game.py);
    if (wp) {
      game.mapId = wp.to.map;
      game.px = wp.to.x; game.py = wp.to.y;
      game.dir = wp.to.dir || game.dir;
      game.fade = 10;
      return;
    }
    // ライバル戦トリガー
    if (game.mapId === "route1" && !game.flags.rivalBeaten && game.px === 9 && game.py === 12) {
      rivalBattle();
      return;
    }
    // トレーナーの視線エンカウント
    for (const npc of visibleNpcs(map)) {
      if (!npc.sight || !npc.battle || game.flags[npc.battle.flag]) continue;
      const [sdx, sdy] = DIRV[npc.dir];
      for (let i = 1; i <= npc.sight; i++) {
        const cx = npc.x + sdx * i, cy = npc.y + sdy * i;
        const tt = tileAt(map, cx, cy);
        if (tt === null || SOLID_TILES.has(tt)) break;
        if (cx === game.px && cy === game.py) {
          npcInteract(npc);
          return;
        }
      }
    }
    // エンカウント
    const t = tileAt(map, game.px, game.py);
    if (t === "T" && map.encounters && game.party.some(m => m.hp > 0) && Math.random() < 0.15) {
      this.startWild(map.encounters);
    }
  },

  async startWild(table) {
    const total = table.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total, pick = table[0];
    for (const e of table) { r -= e.w; if (r <= 0) { pick = e; break; } }
    const mon = makeMon(pick.sp, randint(pick.min, pick.max));
    const result = await startBattle({ wild: mon });
    if (result === "loss") await whiteout();
  },

  interact() {
    const map = curMap();
    const [dx, dy] = DIRV[game.dir];
    const tx = game.px + dx, ty = game.py + dy;
    const npc = visibleNpcs(map).find(n => n.x === tx && n.y === ty);
    if (npc) {
      npcInteract(npc);
      return;
    }
    const obj = (map.objects || []).find(o => o.x === tx && o.y === ty);
    if (obj) { obj.talk(); return; }
    const sign = (map.signs || {})[tx + "," + ty];
    if (sign) say(sign);
  },

  draw() {
    const map = curMap();
    const mw = map.grid[0].length * TILE, mh = map.grid.length * TILE;
    let ppx = game.px * TILE, ppy = game.py * TILE;
    if (game.moving) {
      const [dx, dy] = DIRV[game.dir];
      ppx = (game.px * TILE) + dx * game.prog;
      ppy = (game.py * TILE) + dy * game.prog;
    }
    const camX = mw < W ? -(W - mw) / 2 : clamp(ppx + 8 - W / 2, 0, mw - W);
    const camY = mh < H ? -(H - mh) / 2 : clamp(ppy + 8 - H / 2, 0, mh - H);
    const x0 = Math.floor(camX / TILE), y0 = Math.floor(camY / TILE);
    for (let y = y0; y <= y0 + Math.ceil(H / TILE); y++) {
      for (let x = x0; x <= x0 + Math.ceil(W / TILE); x++) {
        const t = tileAt(map, x, y);
        if (t !== null) drawTileAt(t, x, y, x * TILE - camX, y * TILE - camY);
      }
    }
    // オブジェクト(カプセル等)
    for (const o of map.objects || []) {
      drawSpr(o.spr, o.x * TILE - camX, o.y * TILE - camY - 4);
    }
    // NPCとプレイヤーをy順に描画
    const ents = visibleNpcs(map).map(n => ({ y: n.y * TILE, draw: () => {
      const [k, f] = charSprKey(n.spr, n.dir);
      drawSpr(k, n.x * TILE - camX, n.y * TILE - camY - 2, f);
    } }));
    ents.push({ y: ppy, draw: () => {
      const [k, f] = charSprKey("player", game.dir);
      const bob = game.moving && game.prog >= 4 && game.prog < 12 ? 1 : 0;
      const flipWalk = (game.dir === "down" || game.dir === "up") && game.moving && game.walkFlip;
      drawSpr(k, ppx - camX, ppy - camY - 2 - bob, f !== flipWalk);
    } });
    ents.sort((a, b) => a.y - b.y).forEach(e => e.draw());
    // 場所名
    if (!game.moving && !sceneStack.some(s => s instanceof DialogScene)) {
      ctx.globalAlpha = 0.85;
      drawBox(4, 4, 90, 16);
      drawText(map.name, 10, 7);
      ctx.globalAlpha = 1;
    }
    if (game.fade > 0) {
      ctx.globalAlpha = game.fade / 12;
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.globalAlpha = 1;
    }
  },
};

// ---------- バトル ----------
function startBattle(opts) {
  return new Promise(res => {
    const b = new BattleScene(opts, res);
    sceneStack.push(b);
    b.start();
  });
}

class BattleScene {
  constructor(opts, res) {
    this.res = res;
    this.wild = opts.wild || null;
    this.trainer = opts.trainer || null;
    this.team = this.trainer && this.trainer.team ? this.trainer.team.slice() : null;
    this.enemy = this.wild || (this.team ? this.team[0] : this.trainer.mon);
    dexSee(this.enemy.sp);
    this.playerMon = game.party.find(m => m.hp > 0);
    this.playerMon.stages = { atk: 0, def: 0, spd: 0 };
    this.disp = { p: this.playerMon.hp, e: this.enemy.hp };
    this.runAttempts = 0;
    this.caught = false;
  }

  start() {
    this.script().then(result => { popScene(this); this.res(result); });
  }

  update() {
    for (const side of ["p", "e"]) {
      const mon = side === "p" ? this.playerMon : this.enemy;
      const target = mon.hp;
      const step = Math.max(0.4, mon.maxHp / 50);
      if (this.disp[side] > target) this.disp[side] = Math.max(target, this.disp[side] - step);
      else if (this.disp[side] < target) this.disp[side] = Math.min(target, this.disp[side] + step);
    }
  }

  async waitHP() {
    while (Math.abs(this.disp.p - this.playerMon.hp) > 0.01 || Math.abs(this.disp.e - this.enemy.hp) > 0.01) {
      await waitFrames(1);
    }
    await waitFrames(8);
  }

  effSpd(m) { return m.stats.spd * stageMul(m.stages.spd); }

  async pickSwitch(cancelable) {
    const cands = game.party.map((m, i) => ({ m, i })).filter(e => e.m.hp > 0 && e.m !== this.playerMon);
    if (!cands.length) { await say("ほかに たたかえる ミニモンが いない!"); return -1; }
    const c = await choice({ items: cands.map(e => `${e.m.name} Lv${e.m.level} HP${e.m.hp}/${e.m.maxHp}`), rect: [12, 8, 216], cancel: cancelable });
    if (c < 0) return -1;
    return cands[c].i;
  }

  switchTo(i) {
    this.playerMon = game.party[i];
    this.playerMon.stages = { atk: 0, def: 0, spd: 0 };
    this.disp.p = this.playerMon.hp;
  }

  async doMove(att, def, moveId, defSide) {
    const mv = MOVES[moveId];
    await say(`${att.name}の ${mv.name}!`);
    if (Math.random() * 100 >= mv.acc) { await say("しかし はずれてしまった!"); return; }
    if (mv.power) {
      const { dmg, eff, crit } = calcDamage(att, def, mv);
      def.hp = Math.max(0, def.hp - dmg);
      await this.waitHP();
      if (crit) await say("きゅうしょに あたった!");
      if (eff > 1) await say("こうかは ばつぐんだ!");
      else if (eff > 0 && eff < 1) await say("こうかは いまひとつの ようだ…");
      else if (eff === 0) await say("こうかが ない みたいだ…");
    } else if (mv.effect) {
      const tgt = mv.effect.target === "self" ? att : def;
      const st = mv.effect.stat;
      const before = tgt.stages[st];
      tgt.stages[st] = clamp(before + mv.effect.delta, -6, 6);
      if (tgt.stages[st] === before) await say("しかし へんかは なかった!");
      else await say(`${tgt.name}の ${STATNAME[st]}が ${mv.effect.delta > 0 ? "あがった" : "さがった"}!`);
    }
  }

  enemyMove() {
    const ms = this.enemy.moves;
    return ms[Math.floor(Math.random() * ms.length)];
  }

  async gainExp() {
    const pm = this.playerMon;
    const exp = Math.floor(SPECIES[this.enemy.sp].expBase * this.enemy.level / 7 * (this.trainer ? 1.5 : 1));
    pm.exp += exp;
    await say(`${pm.name}は けいけんち ${exp}を もらった!`);
    while (pm.exp >= expFor(pm.level + 1)) {
      pm.level++;
      const oldMax = pm.maxHp;
      calcStats(pm);
      pm.hp += pm.maxHp - oldMax;
      this.disp.p = pm.hp;
      await say(`${pm.name}は レベル${pm.level}に あがった!`);
      for (const [lv, mv] of SPECIES[pm.sp].learnset) {
        if (lv === pm.level && !pm.moves.includes(mv)) {
          if (pm.moves.length < 4) {
            pm.moves.push(mv);
            await say(`${pm.name}は あたらしく\n${MOVES[mv].name}を おぼえた!`);
          } else {
            const old = pm.moves.shift();
            pm.moves.push(mv);
            await say(`${pm.name}は ${MOVES[old].name}を わすれて\n${MOVES[mv].name}を おぼえた!`);
          }
        }
      }
    }
    const ev = SPECIES[pm.sp].evolve;
    if (ev && pm.level >= ev.lv) await this.evolveMon(pm, ev.to);
  }

  async evolveMon(m, toSp) {
    await say(`おや…?\n${m.name}の ようすが…!`);
    const oldName = m.name;
    const s = SPECIES[toSp];
    m.sp = toSp; m.name = s.name; m.type = s.type;
    const oldMax = m.maxHp;
    calcStats(m);
    m.hp += m.maxHp - oldMax;
    this.disp.p = m.hp;
    await say(`${oldName}は ${s.name}に しんかした!`);
    for (const [lv, mv] of s.learnset) {
      if (lv <= m.level && !m.moves.includes(mv)) {
        if (m.moves.length < 4) m.moves.push(mv);
        else { m.moves.shift(); m.moves.push(mv); }
      }
    }
  }

  async enemyFainted() {
    await say(`${this.enemy.name}は たおれた!`);
    await this.gainExp();
    if (this.team) {
      const idx = this.team.indexOf(this.enemy);
      const next = this.team[idx + 1];
      if (next) {
        this.enemy = next;
        this.disp.e = next.hp;
        next.stages = { atk: 0, def: 0, spd: 0 };
        dexSee(next.sp);
        await say(`${this.trainer.name}は\n${next.name}を くりだした!`);
        return null;
      }
    }
    if (this.trainer) await say(`${this.trainer.name}との しょうぶに かった!`);
    return "win";
  }

  async handlePlayerFaint() {
    await say(`${this.playerMon.name}は たおれてしまった!`);
    if (!game.party.some(m => m.hp > 0)) return "loss";
    const i = await this.pickSwitch(false);
    this.switchTo(i);
    await say(`ゆけっ! ${this.playerMon.name}!`);
    return null;
  }

  async tryCatch() {
    await say(`${PLAYER_NAME}は モンカプセルを なげた!`);
    const e = this.enemy;
    const a = Math.max(1, Math.floor((3 * e.maxHp - 2 * e.hp) * SPECIES[e.sp].catchRate * 1.5 / (3 * e.maxHp)));
    const ok = a >= 255 || Math.random() * 255 < a;
    await say("カプセルは ゆら…ゆら… ゆれている…");
    if (!ok) {
      await say(`ああー! ${e.name}は カプセルから\nとびだしてしまった!`);
      return false;
    }
    this.caught = true;
    dexCatch(e.sp);
    await say(`やったー!\n${e.name}を つかまえた!`);
    e.stages = { atk: 0, def: 0, spd: 0 };
    if (game.party.length < 6) {
      game.party.push(e);
      await say(`${e.name}は なかまに くわわった!`);
    } else {
      game.box.push(e);
      await say(`てもちが いっぱいなので\n${e.name}は ボックスへ おくられた!`);
    }
    return true;
  }

  async script() {
    if (this.wild) await say(`あっ! やせいの ${this.enemy.name}が\nとびだしてきた!`);
    else await say(`${this.trainer.name}が しょうぶを\nしかけてきた!`);
    await say(`ゆけっ! ${this.playerMon.name}!`);

    while (true) {
      // --- プレイヤーの行動選択 ---
      let act = null;
      while (!act) {
        const c = await choice({
          items: ["たたかう", "バッグ", "ミニモン", "にげる"],
          cols: 2, rect: [108, 112, 128, 44], cancel: false,
          prompt: `${this.playerMon.name}は どうする?`,
        });
        if (c === 0) {
          const mv = await choice({
            items: this.playerMon.moves.map(id => MOVES[id].name),
            cols: 2, rect: [4, 112, 232, 44],
          });
          if (mv >= 0) act = { type: "move", move: this.playerMon.moves[mv] };
        } else if (c === 1) {
          const r = await bagMenu(this);
          if (r) act = r;
        } else if (c === 2) {
          const i = await this.pickSwitch(true);
          if (i >= 0) act = { type: "switch", i };
        } else {
          if (!this.wild) await say("トレーナーせんから にげては いけない!");
          else act = { type: "run" };
        }
      }

      // --- にげる ---
      if (act.type === "run") {
        this.runAttempts++;
        const f = Math.floor(this.effSpd(this.playerMon) * 128 / Math.max(1, this.effSpd(this.enemy))) + 30 * this.runAttempts;
        if (f >= 256 || Math.random() * 256 < f) {
          await say("うまく にげきれた!");
          return "run";
        }
        await say("にげられなかった!");
        await this.doMove(this.enemy, this.playerMon, this.enemyMove(), "p");
        if (this.playerMon.hp <= 0) {
          const r = await this.handlePlayerFaint();
          if (r) return r;
        }
        continue;
      }

      // --- カプセル ---
      if (act.type === "capsule") {
        if (await this.tryCatch()) return "caught";
        await this.doMove(this.enemy, this.playerMon, this.enemyMove(), "p");
        if (this.playerMon.hp <= 0) {
          const r = await this.handlePlayerFaint();
          if (r) return r;
        }
        continue;
      }

      // --- どうぐ・いれかえ(敵の攻撃を受ける) ---
      if (act.type === "item" || act.type === "switch") {
        if (act.type === "switch") {
          await say(`もどれ! ${this.playerMon.name}!`);
          this.switchTo(act.i);
          await say(`ゆけっ! ${this.playerMon.name}!`);
        }
        await this.doMove(this.enemy, this.playerMon, this.enemyMove(), "p");
        if (this.playerMon.hp <= 0) {
          const r = await this.handlePlayerFaint();
          if (r) return r;
        }
        continue;
      }

      // --- わざ(すばやさ順) ---
      const pSpd = this.effSpd(this.playerMon), eSpd = this.effSpd(this.enemy);
      const pFirst = pSpd > eSpd || (pSpd === eSpd && Math.random() < 0.5);
      const order = pFirst ? ["p", "e"] : ["e", "p"];
      let turnEnd = false;
      for (const side of order) {
        if (turnEnd) break;
        if (side === "p") await this.doMove(this.playerMon, this.enemy, act.move, "e");
        else await this.doMove(this.enemy, this.playerMon, this.enemyMove(), "p");
        if (this.enemy.hp <= 0) {
          const r = await this.enemyFainted();
          if (r) return r;
          turnEnd = true;
        }
        if (this.playerMon.hp <= 0) {
          const r = await this.handlePlayerFaint();
          if (r) return r;
          turnEnd = true;
        }
      }
    }
  }

  draw() {
    // 背景
    ctx.fillStyle = "#d8f0c8";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#c0e0a8";
    ctx.fillRect(0, 96, W, 64);
    // 足場
    ctx.fillStyle = "#a8cc90";
    ctx.beginPath(); ctx.ellipse(178, 66, 38, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(56, 112, 42, 10, 0, 0, Math.PI * 2); ctx.fill();
    // スプライト
    if (!this.caught) drawSpr(SPECIES[this.enemy.sp].sprite, 154, 18, false, 3);
    drawSpr(SPECIES[this.playerMon.sp].sprite, 32, 66, true, 3);
    // 敵ステータス
    drawBox(6, 6, 106, 28);
    drawText(this.enemy.name, 12, 9);
    drawText("Lv" + this.enemy.level, 78, 9);
    drawHPBar(28, 25, 70, this.disp.e / this.enemy.maxHp);
    drawText("HP", 12, 21, "#c08828");
    // 自分ステータス
    drawBox(128, 70, 106, 38);
    drawText(this.playerMon.name, 134, 73);
    drawText("Lv" + this.playerMon.level, 200, 73);
    drawHPBar(150, 89, 70, this.disp.p / this.playerMon.maxHp);
    drawText("HP", 134, 85, "#c08828");
    drawText(`${Math.ceil(this.disp.p)}/${this.playerMon.maxHp}`, 160, 95);
    // テキスト枠(上に会話・選択シーンが重なる)
    drawBox(4, 112, 232, 44);
  }
}

// ---------- タイトル ----------
class TitleScene {
  constructor() {
    this.cur = 0;
    this.has = !!localStorage.getItem(SAVEKEY);
    this.items = this.has ? ["つづきから", "はじめから"] : ["はじめから"];
  }
  update() {
    if (Input.pressed.has("down")) this.cur = Math.min(this.items.length - 1, this.cur + 1);
    if (Input.pressed.has("up")) this.cur = Math.max(0, this.cur - 1);
    if (Input.pressed.has("a") || Input.pressed.has("start")) {
      const pick = this.items[this.cur];
      popScene(this);
      sceneStack.push(world);
      if (pick === "つづきから") loadGame();
      else newGame();
    }
  }
  draw() {
    ctx.fillStyle = "#283060";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#384890";
    ctx.fillRect(0, 110, W, 50);
    ctx.font = 'bold 26px "Hiragino Kaku Gothic ProN", sans-serif';
    ctx.fillStyle = "#182048";
    ctx.textBaseline = "top";
    ctx.fillText("ミニモンクエスト", 22, 32);
    ctx.fillStyle = "#f8d030";
    ctx.fillText("ミニモンクエスト", 20, 30);
    drawSpr("capsule", 104, 62, false, 2);
    drawBox(70, 100, 100, this.items.length * 16 + 12);
    this.items.forEach((it, i) => {
      drawText(it, 92, 107 + i * 16);
      if (i === this.cur) drawText("▶", 80, 107 + i * 16, "#f8d030");
    });
    ctx.font = '8px sans-serif';
    ctx.fillStyle = "#8898c8";
    ctx.fillText("オリジナルじさくゲーム  ver 1.0", 60, 148);
  }
}

function newGame() {
  game.mapId = "town"; game.px = 9; game.py = 9; game.dir = "down";
  game.party = []; game.box = [];
  game.bag = { capsule: 0, potion: 0 };
  game.money = 3000;
  game.dex = { seen: {}, caught: {} };
  game.flags = {};
  game.fade = 12;
  (async () => {
    await say(`オカダはかせ「やあ ${PLAYER_NAME}!\nきょうから きみも ミニモントレーナーだ」`);
    await say("「わたしの けんきゅうじょで まっているぞ。\nまちの ひだりうえの たてものだ!」");
  })();
}

// ---------- メインループ ----------
function loop() {
  tick++;
  waiters = waiters.filter(w => { if (--w.n <= 0) { w.r(); return false; } return true; });
  const top = sceneStack[sceneStack.length - 1];
  if (top && top.update) top.update();
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, W, H);
  for (const s of sceneStack) if (s.draw) s.draw();
  Input.pressed.clear();
  requestAnimationFrame(loop);
}

initSprites();
sceneStack.push(new TitleScene());
loop();
