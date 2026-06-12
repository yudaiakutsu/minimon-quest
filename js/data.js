"use strict";
// ======================== ミニモンクエスト データ定義 ========================
// すべてオリジナルの創作データです(任天堂の素材・名称は使用していません)

const PLAYER_NAME = "ハル";
const RIVAL_NAME = "シン";

// ---------- タイプ相性表(攻撃側 → 防御側 → 倍率) ----------
const CHART = {
  "ほのお": { "くさ": 2, "むし": 2, "ほのお": 0.5, "みず": 0.5 },
  "みず":   { "ほのお": 2, "みず": 0.5, "くさ": 0.5 },
  "くさ":   { "みず": 2, "ほのお": 0.5, "くさ": 0.5, "ひこう": 0.5, "むし": 0.5 },
  "でんき": { "みず": 2, "ひこう": 2, "くさ": 0.5, "でんき": 0.5 },
  "ひこう": { "くさ": 2, "むし": 2, "でんき": 0.5 },
  "むし":   { "くさ": 2, "ほのお": 0.5, "ひこう": 0.5 },
  "ノーマル": {},
};
function typeMult(att, def) {
  const row = CHART[att];
  return row && def in row ? row[def] : 1;
}

// ---------- わざ ----------
const MOVES = {
  tackle:     { name: "たいあたり",        type: "ノーマル", power: 40, acc: 100 },
  scratch:    { name: "ひっかく",          type: "ノーマル", power: 40, acc: 100 },
  growl:      { name: "おたけび",          type: "ノーマル", power: 0,  acc: 100, effect: { stat: "atk", delta: -1, target: "foe" } },
  harden:     { name: "まもりがため",      type: "ノーマル", power: 0,  acc: 100, effect: { stat: "def", delta: 1, target: "self" } },
  ember:      { name: "ひのこ",            type: "ほのお",   power: 40, acc: 100 },
  flamewheel: { name: "かえんりんぶ",      type: "ほのお",   power: 60, acc: 100 },
  watergun:   { name: "みずはね",          type: "みず",     power: 40, acc: 100 },
  aquashot:   { name: "アクアショット",    type: "みず",     power: 60, acc: 100 },
  leafcut:    { name: "このはぎり",        type: "くさ",     power: 40, acc: 100 },
  greenslash: { name: "グリーンぎり",      type: "くさ",     power: 60, acc: 100 },
  peck:       { name: "つつく",            type: "ひこう",   power: 35, acc: 100 },
  winghit:    { name: "つばさアタック",    type: "ひこう",   power: 60, acc: 100 },
  stringshot: { name: "いとはき",          type: "むし",     power: 0,  acc: 95, effect: { stat: "spd", delta: -1, target: "foe" } },
  bugbite:    { name: "むしかじり",        type: "むし",     power: 60, acc: 100 },
  zap:        { name: "ビリビリ",          type: "でんき",   power: 40, acc: 100 },
  spark:      { name: "スパーク",          type: "でんき",   power: 65, acc: 100 },
};
const STATNAME = { atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ" };

// ---------- ミニモン図鑑 ----------
const SPECIES = {
  hibanaru: {
    name: "ヒバナル", type: "ほのお", sprite: "hibanaru",
    base: { hp: 44, atk: 52, def: 43, spd: 65 }, expBase: 62, catchRate: 45,
    learnset: [[1, "scratch"], [1, "growl"], [7, "ember"], [13, "flamewheel"]],
  },
  shizukun: {
    name: "シズクン", type: "みず", sprite: "shizukun",
    base: { hp: 50, atk: 48, def: 50, spd: 55 }, expBase: 62, catchRate: 45,
    learnset: [[1, "tackle"], [1, "growl"], [7, "watergun"], [13, "aquashot"]],
  },
  happami: {
    name: "ハッパミ", type: "くさ", sprite: "happami",
    base: { hp: 52, atk: 46, def: 52, spd: 50 }, expBase: 62, catchRate: 45,
    learnset: [[1, "tackle"], [1, "harden"], [7, "leafcut"], [13, "greenslash"]],
  },
  kotoris: {
    name: "コトリス", type: "ひこう", sprite: "kotoris",
    base: { hp: 40, atk: 45, def: 40, spd: 56 }, expBase: 50, catchRate: 255,
    learnset: [[1, "peck"], [9, "winghit"]],
  },
  mushimaru: {
    name: "ムシマル", type: "むし", sprite: "mushimaru",
    base: { hp: 45, atk: 40, def: 50, spd: 35 }, expBase: 45, catchRate: 255,
    learnset: [[1, "tackle"], [5, "stringshot"], [9, "bugbite"]],
  },
  denris: {
    name: "デンリス", type: "でんき", sprite: "denris",
    base: { hp: 38, atk: 55, def: 35, spd: 80 }, expBase: 65, catchRate: 120,
    learnset: [[1, "zap"], [11, "spark"]],
  },
};

// ライバルはこちらの御三家に有利なタイプを選ぶ
const RIVAL_COUNTER = { hibanaru: "shizukun", shizukun: "happami", happami: "hibanaru" };

// ---------- ドット絵(16x16 / '.'は透明) ----------
const PIXEL = {
  player_down: {
    pal: { K: "#1a1a1a", C: "#3868c8", S: "#f0c8a0", H: "#705030", B: "#d84040", P: "#3850a0", W: "#ffffff" },
    g: [
      "....KKKKK.......",
      "...KCCCCCK......",
      "..KCCCCCCCK.....",
      ".KCCCCCCCCCK....",
      ".KKKKKKKKKKK....",
      ".KHSSSSSSSHK....",
      ".KSKSSSSKSSK....",
      ".KSSSSSSSSSK....",
      "..KSSKKKSSK.....",
      "..KKBBBBBKK.....",
      ".KSBBBBBBBSK....",
      ".KSKBBBBBKSK....",
      "..KBBBBBBBK.....",
      "..KPPKKKPPK.....",
      "..KPPK.KPPK.....",
      "..KKK...KKK.....",
    ],
  },
  player_up: {
    pal: { K: "#1a1a1a", C: "#3868c8", S: "#f0c8a0", H: "#705030", B: "#d84040", P: "#3850a0" },
    g: [
      "....KKKKK.......",
      "...KCCCCCK......",
      "..KCCCCCCCK.....",
      ".KCCCCCCCCCK....",
      ".KCKKKKKKKCK....",
      ".KHHHHHHHHHK....",
      ".KHHHHHHHHHK....",
      ".KHHHHHHHHHK....",
      "..KHHHHHHHK.....",
      "..KKBBBBBKK.....",
      ".KSBBBBBBBSK....",
      ".KSKBBBBBKSK....",
      "..KBBBBBBBK.....",
      "..KPPKKKPPK.....",
      "..KPPK.KPPK.....",
      "..KKK...KKK.....",
    ],
  },
  player_left: {
    pal: { K: "#1a1a1a", C: "#3868c8", S: "#f0c8a0", H: "#705030", B: "#d84040", P: "#3850a0", W: "#ffffff" },
    g: [
      "....KKKKK.......",
      "...KCCCCCK......",
      "..KCCCCCCCK.....",
      ".KCCCCCCCCK.....",
      ".KKKKKKKKKK.....",
      ".KHSSSSSHHK.....",
      ".KSKWSSSHHK.....",
      ".KSSSSSSHHK.....",
      "..KSSSSSHK......",
      "..KKBBBBKK......",
      "..KSBBBBBK......",
      "..KSKBBBKK......",
      "..KBBBBBBK......",
      "..KPPKPPK.......",
      "..KPPKPPK.......",
      "..KKK.KKK.......",
    ],
  },
  capsule: {
    pal: { K: "#1a1a1a", T: "#3ac6a0", W: "#f8f8f8" },
    g: [
      "................",
      "................",
      "................",
      "................",
      ".....KKKKK......",
      "....KTTTTTK.....",
      "...KTTTTTTTK....",
      "...KTTTTTTTK....",
      "...KKKWWKKKK....",
      "...KWWWWWWWK....",
      "...KWWWWWWWK....",
      "....KWWWWWK.....",
      ".....KKKKK......",
      "................",
      "................",
      "................",
    ],
  },
  hibanaru: {
    pal: { K: "#1a1a1a", O: "#f08030", Y: "#ffd9a0", F: "#ffd000", R: "#ff3000", W: "#ffffff" },
    g: [
      "................",
      "...KK....KK.....",
      "..KOOK..KOOK....",
      "..KOOKKKKOOK....",
      ".KOOOOOOOOOOK...",
      ".KOKWOOOOWKOK...",
      ".KOOOOOOOOOOK...",
      ".KOOOYYYYOOOK...",
      "..KOYYYYYYOK....",
      "..KOYYYYYYOKKK..",
      ".KOOYYYYYYOKFFK.",
      ".KOKOYYYYOKFRFK.",
      ".KOKOOOOOOKKFK..",
      "..KOOKKKKOOK....",
      "..KK......KK....",
      "................",
    ],
  },
  shizukun: {
    pal: { K: "#1a1a1a", B: "#58a8f0", L: "#a0d8ff", W: "#ffffff" },
    g: [
      "................",
      ".......KK.......",
      "......KBBK......",
      ".....KBBBBK.....",
      "....KBLBBLBK....",
      "...KBBBBBBBBK...",
      "..KBBBBBBBBBBK..",
      ".KBKWBBBBBWKBK..",
      ".KBBBBBBBBBBBK..",
      ".KBBBKKKKBBBBK..",
      ".KBBBBBBBBBBBK..",
      "..KBBBBBBBBBK...",
      "..KLBBBBBBBLK...",
      "...KBBBBBBBK....",
      "....KKKKKKK.....",
      "................",
    ],
  },
  happami: {
    pal: { K: "#1a1a1a", G: "#78c850", D: "#4e8234", C: "#f8f0d0", W: "#ffffff" },
    g: [
      "......KKK.......",
      ".....KDDDK......",
      "....KDDDDDK.....",
      "......KDK.......",
      "....KKGGGKK.....",
      "..KKGGGGGGGKK...",
      ".KGGGGGGGGGGGK..",
      ".KGKWGGGGGWKGK..",
      ".KGGGGGGGGGGGK..",
      ".KGGCCCCCCCGGK..",
      ".KGCCCCCCCCCGK..",
      ".KGGCCCCCCGGK...",
      "..KGGGGGGGGK....",
      "..KGK....KGK....",
      "..KK......KK....",
      "................",
    ],
  },
  kotoris: {
    pal: { K: "#1a1a1a", N: "#c08040", C: "#f8e8c8", Y: "#f0a030", W: "#ffffff" },
    g: [
      "................",
      "................",
      ".....KKKK.......",
      "....KNNNNK......",
      "...KNKWNNNK.....",
      "..KYYNNNNNK.....",
      "...KNNNNNNNK....",
      "...KNCCCNNNNK...",
      "..KNCCCCNNNNK...",
      "..KNCCCCNNNK....",
      "..KNNCCNNNNK....",
      "...KNNNNNNK.....",
      "....KNNNNK......",
      ".....KYKYK......",
      "................",
      "................",
    ],
  },
  mushimaru: {
    pal: { K: "#1a1a1a", G: "#90c830", Y: "#e8e060", W: "#ffffff" },
    g: [
      "................",
      "...K......K.....",
      "....K....K......",
      "...KKGGGGKK.....",
      "..KGGGGGGGGK....",
      ".KGKWGGGGWKGK...",
      ".KGGGGGGGGGGK...",
      ".KGGKKKKKKGGK...",
      ".KYGYYYYYYGYK...",
      ".KGYYGGYYGGYK...",
      "..KGGGGGGGGK....",
      "..KGYGGYGGYK....",
      "...KKKKKKKK.....",
      "................",
      "................",
      "................",
    ],
  },
  denris: {
    pal: { K: "#1a1a1a", Y: "#f8d030", W: "#ffffff" },
    g: [
      "................",
      "..KK....KK..KKK.",
      ".KYYK..KYYK.KYYK",
      ".KYKK..KKYKKYYK.",
      "..KYYYYYYKKYYK..",
      ".KYYYYYYYYKYYK..",
      ".KYKWYYYYWKYYK..",
      ".KYYYYYYYYKYK...",
      ".KYYYKKYYYYK....",
      "..KYYYYYYYYK....",
      ".KYYYYYYYYYYK...",
      ".KYKYYYYYYKYK...",
      "..KYYK..KYYK....",
      "...KK....KK.....",
      "................",
      "................",
    ],
  },
};

// ---------- マップ ----------
// タイル: . 草地  , 花  P 道  T 草むら(エンカウント)  R 木  W 水
//         r 屋根  w 壁  o 窓  D ドア(ワープ)  S かんばん
//         k 本だな/かべ  f ゆか  t つくえ  e ベッド  M マット(ワープ)
const SOLID_TILES = new Set(["R", "W", "r", "w", "o", "S", "k", "t", "e"]);

const MAPS = {
  town: {
    name: "ハジマリタウン",
    grid: [
      "RRRRRRRRR.RRRRRRRRR",
      "R........P........R",
      "R.rrrrr..P...,....R",
      "R.rrrrr..P........R",
      "R.woDow..P.rrrr...R",
      "R...P....P.rrrr...R",
      "R,..P....P.woDw...R",
      "R...P....P...P....R",
      "R...PPPPPPPPPP....R",
      "R........P........R",
      "R..S.....P....,...R",
      "R........P........R",
      "R...,....P.....,..R",
      "R........P........R",
      "R.................R",
      "RRRRRRRRRRRRRRRRRRR",
    ],
    warps: [
      { x: 4, y: 4, to: { map: "lab", x: 5, y: 7, dir: "up" } },
      { x: 13, y: 6, to: { map: "house", x: 4, y: 5, dir: "up" } },
    ],
    edges: { n: { map: "route1", x: 9, y: 24 } },
    signs: { "3,10": "ハジマリタウン\n~ぼうけんの はじまりの ち~" },
    npcs: [
      {
        id: "blocker", x: 9, y: 1, spr: "boy", dir: "down",
        visible: f => !f.starterChosen,
        talk: async () => {
          await say("オカダはかせが きみを さがしていたよ!\nけんきゅうじょは ひだりうえの たてものだ。");
        },
      },
      {
        id: "boy2", x: 12, y: 9, spr: "boy", dir: "down",
        visible: f => !!f.starterChosen,
        talk: async () => {
          await say("くさむらでは やせいの ミニモンが でるぞ!\nよわらせてから モンカプセルを なげるんだ。");
        },
      },
      {
        id: "lady", x: 6, y: 11, spr: "lady", dir: "down",
        visible: () => true,
        talk: async () => {
          await say("ここは ハジマリタウン。\nのんびりした いいところよ。");
        },
      },
    ],
  },

  lab: {
    name: "オカダけんきゅうじょ",
    grid: [
      "kkkkkkkkkkk",
      "kfffffffffk",
      "kfftttttffk",
      "kfffffffffk",
      "kfffffffffk",
      "kfffffffffk",
      "kfffffffffk",
      "kfffffffffk",
      "kkkkkMkkkkk",
    ],
    warps: [{ x: 5, y: 8, to: { map: "town", x: 4, y: 5, dir: "down" } }],
    signs: {},
    objects: [
      { x: 4, y: 2, spr: "capsule", talk: async () => starterBall("hibanaru") },
      { x: 5, y: 2, spr: "capsule", talk: async () => starterBall("shizukun") },
      { x: 6, y: 2, spr: "capsule", talk: async () => starterBall("happami") },
    ],
    npcs: [
      {
        id: "prof", x: 8, y: 3, spr: "prof", dir: "left",
        visible: () => true,
        talk: async () => {
          if (!game.flags.starterChosen) {
            await say("オカダはかせ「おお きたか!\nつくえの うえに カプセルが 3つ ある」");
            await say("「なかの ミニモンから すきなこを\n1ぴき えらびなさい!」");
          } else {
            await say("オカダはかせ「そのこと いっしょに\nがんばるんだぞ!」");
          }
        },
      },
    ],
  },

  house: {
    name: "ハルのいえ",
    grid: [
      "kkkkkkkkk",
      "kffffffek",
      "kffffffek",
      "kfttffffk",
      "kfffffffk",
      "kfffffffk",
      "kkkkMkkkk",
    ],
    warps: [{ x: 4, y: 6, to: { map: "town", x: 13, y: 7, dir: "down" } }],
    signs: {},
    npcs: [
      {
        id: "mom", x: 2, y: 4, spr: "lady", dir: "right",
        visible: () => true,
        talk: async () => {
          await say("ママ「おかえり! つかれたでしょう。\nちょっと やすんでいきなさい」");
          game.party.forEach(m => { m.hp = m.maxHp; });
          await say("ミニモンたちは げんきいっぱいに なった!");
        },
      },
    ],
  },

  route1: {
    name: "1ばんルート",
    grid: [
      "RRRRRRRRRRRRRRRRRRR",
      "R.......SP........R",
      "R..TTTT..P..TTTT..R",
      "R..TTTT..P..TTTT..R",
      "R..TTTT..P..TTTT..R",
      "R........P........R",
      "R,.......P.....,..R",
      "R..TTT...P...TTT..R",
      "R..TTT...P...TTT..R",
      "R..TTT...P...TTT..R",
      "R........P........R",
      "R........P........R",
      "R...,....P....,...R",
      "R..TTTT..P..TTTT..R",
      "R..TTTT..P..TTTT..R",
      "R........P........R",
      "R.,......P......,.R",
      "R..TTT...P...TTT..R",
      "R..TTT...P...TTT..R",
      "R........P........R",
      "R........P........R",
      "R...,....P....,...R",
      "R..TT....P....TT..R",
      "R........P........R",
      "R........P........R",
      "RRRRRRRRR.RRRRRRRRR",
    ],
    warps: [],
    edges: { s: { map: "town", x: 9, y: 1 } },
    signs: { "8,1": "この さきは こうじちゅう!\nつづきは じかいさく…らしい。" },
    encounters: [
      { sp: "kotoris", w: 45, min: 2, max: 4 },
      { sp: "mushimaru", w: 40, min: 2, max: 4 },
      { sp: "denris", w: 15, min: 3, max: 5 },
    ],
    npcs: [
      {
        id: "rival", x: 9, y: 11, spr: "rival", dir: "down",
        visible: f => !f.rivalBeaten,
        talk: async () => rivalBattle(),
      },
    ],
  },
};
