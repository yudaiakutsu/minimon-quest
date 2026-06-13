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
  blazeburst: { name: "ごうかえん",        type: "ほのお",   power: 90, acc: 95 },
  aquaburst:  { name: "だくりゅう",        type: "みず",     power: 90, acc: 95 },
  jungleslash:{ name: "ジャングルぎり",    type: "くさ",     power: 90, acc: 95 },
  powderstorm:{ name: "りんぷんあらし",    type: "むし",     power: 65, acc: 100 },
  sporeball:  { name: "ほうしだま",        type: "くさ",     power: 50, acc: 100 },
  slamrush:   { name: "ぶちかまし",        type: "ノーマル", power: 60, acc: 100 },
  needlepoke: { name: "はりつつき",        type: "むし",     power: 35, acc: 100 },
  windcut:    { name: "かぜきり",          type: "ひこう",   power: 65, acc: 100 },
  bite:       { name: "かみつく",          type: "ノーマル", power: 60, acc: 100 },
  quickhit:   { name: "すばやアタック",    type: "ノーマル", power: 40, acc: 100 },
  gust:       { name: "かまいたち",        type: "ひこう",   power: 50, acc: 100 },
  bubble:     { name: "あわ",              type: "みず",     power: 40, acc: 100, effect: { stat: "spd", delta: -1, target: "foe" } },
  vinewhip:   { name: "つるのムチ",        type: "くさ",     power: 45, acc: 100 },
  leer:       { name: "にらみつける",      type: "ノーマル", power: 0,  acc: 100, effect: { stat: "def", delta: -1, target: "foe" } },
  charge:     { name: "じゅうでん",        type: "でんき",   power: 0,  acc: 100, effect: { stat: "atk", delta: 1, target: "self" } },
};
const STATNAME = { atk: "こうげき", def: "ぼうぎょ", spd: "すばやさ" };

// ---------- ミニモン図鑑 ----------
const SPECIES = {
  hibanaru: {
    name: "ヒバナル", type: "ほのお", sprite: "hibanaru",
    base: { hp: 44, atk: 52, def: 43, spd: 65 }, expBase: 62, catchRate: 45,
    learnset: [[1, "scratch"], [1, "growl"], [7, "ember"], [13, "flamewheel"]],
    evolve: { lv: 14, to: "enhibana" },
  },
  shizukun: {
    name: "シズクン", type: "みず", sprite: "shizukun",
    base: { hp: 50, atk: 48, def: 50, spd: 55 }, expBase: 62, catchRate: 45,
    learnset: [[1, "tackle"], [1, "growl"], [7, "watergun"], [13, "aquashot"]],
    evolve: { lv: 14, to: "shizukuga" },
  },
  happami: {
    name: "ハッパミ", type: "くさ", sprite: "happami",
    base: { hp: 52, atk: 46, def: 52, spd: 50 }, expBase: 62, catchRate: 45,
    learnset: [[1, "tackle"], [1, "harden"], [7, "leafcut"], [13, "greenslash"]],
    evolve: { lv: 14, to: "happard" },
  },
  kotoris: {
    name: "コトリス", type: "ひこう", sprite: "kotoris",
    base: { hp: 40, atk: 45, def: 40, spd: 56 }, expBase: 50, catchRate: 255,
    learnset: [[1, "peck"], [1, "leer"], [6, "gust"], [9, "winghit"], [13, "windcut"]],
  },
  mushimaru: {
    name: "ムシマル", type: "むし", sprite: "mushimaru",
    base: { hp: 45, atk: 40, def: 50, spd: 35 }, expBase: 45, catchRate: 255,
    learnset: [[1, "tackle"], [5, "stringshot"], [9, "bugbite"]],
    evolve: { lv: 10, to: "choumaru" },
  },
  denris: {
    name: "デンリス", type: "でんき", sprite: "denris",
    base: { hp: 38, atk: 55, def: 35, spd: 80 }, expBase: 65, catchRate: 120,
    learnset: [[1, "zap"], [1, "quickhit"], [8, "charge"], [11, "spark"]],
  },
  norinezu: {
    name: "ノリネズ", type: "ノーマル", sprite: "norinezu",
    base: { hp: 48, atk: 50, def: 42, spd: 58 }, expBase: 52, catchRate: 255,
    learnset: [[1, "tackle"], [1, "leer"], [6, "quickhit"], [12, "bite"], [18, "slamrush"]],
  },
  enhibana: {
    name: "エンヒバナ", type: "ほのお", sprite: "enhibana",
    base: { hp: 60, atk: 72, def: 58, spd: 85 }, expBase: 142, catchRate: 45,
    learnset: [[1, "scratch"], [1, "growl"], [7, "ember"], [13, "flamewheel"], [22, "blazeburst"]],
  },
  shizukuga: {
    name: "シズクーガ", type: "みず", sprite: "shizukuga",
    base: { hp: 68, atk: 65, def: 68, spd: 70 }, expBase: 142, catchRate: 45,
    learnset: [[1, "tackle"], [1, "growl"], [7, "watergun"], [13, "aquashot"], [22, "aquaburst"]],
  },
  happard: {
    name: "ハッパード", type: "くさ", sprite: "happard",
    base: { hp: 70, atk: 62, def: 72, spd: 62 }, expBase: 142, catchRate: 45,
    learnset: [[1, "tackle"], [1, "harden"], [7, "leafcut"], [13, "greenslash"], [22, "jungleslash"]],
  },
  choumaru: {
    name: "チョウマル", type: "むし", sprite: "choumaru",
    base: { hp: 60, atk: 55, def: 50, spd: 65 }, expBase: 120, catchRate: 120,
    learnset: [[1, "bugbite"], [1, "stringshot"], [15, "powderstorm"], [20, "windcut"]],
  },
  kinokomo: {
    name: "キノコモ", type: "くさ", sprite: "kinokomo",
    base: { hp: 55, atk: 45, def: 60, spd: 25 }, expBase: 55, catchRate: 190,
    learnset: [[1, "tackle"], [1, "harden"], [6, "vinewhip"], [12, "sporeball"], [18, "greenslash"]],
  },
  kodanupon: {
    name: "コダヌポン", type: "ノーマル", sprite: "kodanupon",
    base: { hp: 55, atk: 52, def: 45, spd: 48 }, expBase: 58, catchRate: 220,
    learnset: [[1, "tackle"], [5, "growl"], [10, "bite"], [12, "slamrush"]],
  },
  hachibun: {
    name: "ハチブン", type: "むし", sprite: "hachibun",
    base: { hp: 40, atk: 58, def: 38, spd: 62 }, expBase: 60, catchRate: 180,
    learnset: [[1, "needlepoke"], [1, "quickhit"], [10, "bugbite"], [16, "windcut"]],
  },
  yorufuku: {
    name: "ヨルフク", type: "ひこう", sprite: "yorufuku",
    base: { hp: 52, atk: 50, def: 48, spd: 66 }, expBase: 70, catchRate: 120,
    learnset: [[1, "peck"], [8, "winghit"], [14, "windcut"]],
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
  enhibana: {
    pal: { K: "#1a1a1a", O: "#e86820", Y: "#ffd9a0", F: "#ffd000", R: "#ff3000", W: "#ffffff" },
    g: [
      "....KK..KK......",
      "...KFFKKFFK.....",
      "..KFRFFFFRFK....",
      "..KFFOOOOFFK....",
      ".KOOOOOOOOOOK...",
      ".KOKWOOOOWKOK...",
      ".KOOOOOOOOOOK...",
      ".KOOYYYYYYOOK...",
      ".KOYYYYYYYYOK...",
      ".KOYYYYYYYYOKKK.",
      ".KOYYYYYYYYOKFFK",
      ".KOKYYYYYYKOKRFK",
      ".KOKOOOOOOOKKFK.",
      ".KOOOKKKKOOOK...",
      ".KKK......KKK...",
      "................",
    ],
  },
  shizukuga: {
    pal: { K: "#1a1a1a", B: "#3888d8", L: "#a0d8ff", W: "#ffffff" },
    g: [
      "......KKK.......",
      ".....KBBBK......",
      "....KBBBBBK.....",
      "..KKBBLBBLBKK...",
      ".KBBBBBBBBBBBK..",
      ".KBKWBBBBBWKBK..",
      "KBBBBBBBBBBBBBK.",
      "KBBBKKKKKBBBBBK.",
      "KBBBBBBBBBBBBK..",
      "KLBBBBBBBBBBLK..",
      ".KBBBBBBBBBBK...",
      ".KLBBBBBBBLK....",
      "..KBBBBBBBK.....",
      "..KBKKKKKBK.....",
      "...KK...KK......",
      "................",
    ],
  },
  happard: {
    pal: { K: "#1a1a1a", G: "#58a838", D: "#3a6826", C: "#f8f0d0", W: "#ffffff" },
    g: [
      ".....KKKK.......",
      "....KDDDDK......",
      "..KKDDDDDDKK....",
      ".KDDDKDDKDDDK...",
      "...KKGGGGKK.....",
      ".KKGGGGGGGGKK...",
      ".KGGGGGGGGGGK...",
      ".KGKWGGGGWKGK...",
      ".KGGGGGGGGGGK...",
      ".KGCCCCCCCCGK...",
      ".KGCCCCCCCCGK...",
      ".KGGCCCCCCGGK...",
      ".KGGGGGGGGGGK...",
      ".KGGK....KGGK...",
      ".KKK......KKK...",
      "................",
    ],
  },
  choumaru: {
    pal: { K: "#1a1a1a", G: "#90c830", P: "#f0a0d0", W: "#ffffff" },
    g: [
      "..KKK......KKK..",
      ".KPPPK....KPPPK.",
      "KPPPPPK..KPPPPPK",
      "KPWPPPPKKPPPPWPK",
      "KPPPPPKGGKPPPPPK",
      ".KPPPKGGGGKPPPK.",
      "..KKKGKWWKGKKK..",
      "..KPPGGGGGGPPK..",
      ".KPPPKGGGGKPPPK.",
      "KPPPPKGGGGKPPPPK",
      "KPPPKGGGGGGKPPPK",
      "KPPK..KGGK..KPPK",
      ".KK...KGGK...KK.",
      "......KKKK......",
      "................",
      "................",
    ],
  },
  kinokomo: {
    pal: { K: "#1a1a1a", R: "#d04040", C: "#f0e0c0", W: "#ffffff" },
    g: [
      ".....KKKKK......",
      "...KKRRRRRKK....",
      "..KRRWRRRWRRK...",
      ".KRRRRRRRRRRRK..",
      ".KRWRRRRRRWRRK..",
      ".KKKKKKKKKKKKK..",
      "..KCCCCCCCCCK...",
      "..KCKWCCCWKCK...",
      "..KCCCCCCCCCK...",
      "..KCCKKKKKCCK...",
      "..KCCCCCCCCCK...",
      "...KCCCCCCCK....",
      "...KCK...KCK....",
      "...KK.....KK....",
      "................",
      "................",
    ],
  },
  kodanupon: {
    pal: { K: "#1a1a1a", N: "#a07040", C: "#f0e0c0", M: "#5a4028", W: "#ffffff" },
    g: [
      "...KK....KK.....",
      "..KNNK..KNNK....",
      "..KNNNKKNNNK....",
      ".KNNNNNNNNNNK...",
      ".KMMKNNNNKMMK...",
      ".KMKWNNNNWKMK...",
      ".KNNNNNNNNNNK...",
      ".KNNCCCCCCNNK...",
      ".KNCCCCCCCCNK...",
      ".KNCCCCCCCCNK...",
      ".KNNCCCCCCNNK...",
      "..KNNNNNNNNK....",
      "..KNK....KNK....",
      "..KK......KK....",
      "................",
      "................",
    ],
  },
  hachibun: {
    pal: { K: "#1a1a1a", Y: "#f8d030", W: "#e8f0f8" },
    g: [
      "....KK..KK......",
      "...KWWKKWWK.....",
      "..KWWWKKWWWK....",
      "..KWWKYYKWWK....",
      "...KKYYYYKK.....",
      "..KYKWYYWKYK....",
      "..KYYYYYYYYK....",
      "..KKKKKKKKKK....",
      "..KYYYYYYYYK....",
      "..KKKKKKKKKK....",
      "..KYYYYYYYYK....",
      "...KYYYYYYK.....",
      "....KYYYYK......",
      ".....KKKK.......",
      "......KK........",
      "................",
    ],
  },
  norinezu: {
    pal: { K: "#1a1a1a", N: "#b08858", C: "#f0e0c0", P: "#f0a0b0", W: "#ffffff" },
    g: [
      "..K..........K..",
      ".KNK........KNK.",
      ".KNNKKKKKKKKNNK.",
      ".KNNNNNNNNNNNNK.",
      ".KNKWNNNNNNWKNK.",
      ".KNNNNNNNNNNNNK.",
      ".KNNNNPPPPNNNNK.",
      ".KNNNPCCCCPNNNK.",
      ".KNCCCCCCCCCCNK.",
      ".KNCCCCCCCCCCNK.",
      ".KNNCCCCCCCCNNK.",
      "..KNNNNNNNNNNK..",
      "...KNK....KNK...",
      "....KNNNNNNK....",
      ".....KK..KK.....",
      "................",
    ],
  },
  yorufuku: {
    pal: { K: "#1a1a1a", N: "#8a6a4a", C: "#f0e0c0", Y: "#f0a030", W: "#ffffff" },
    g: [
      "...KK......KK...",
      "..KNNKKKKKKNNK..",
      ".KNNNNNNNNNNNNK.",
      ".KNKWWKNNKWWKNK.",
      ".KNWKWWNNWWKWNK.",
      ".KNKWWKYYKWWKNK.",
      ".KNNNNKYYKNNNNK.",
      ".KNNNNNNNNNNNNK.",
      ".KNCCCCCCCCCCNK.",
      ".KNCCCCCCCCCCNK.",
      ".KNNCCCCCCCCNNK.",
      "..KNNNNNNNNNNK..",
      "...KNNK..KNNK...",
      "....KYK..KYK....",
      "....KK....KK....",
      "................",
    ],
  },
};

// ---------- マップ ----------
// タイル: . 草地  , 花  P 道  T 草むら(エンカウント)  R 木  W 水
//         r 屋根  w 壁  o 窓  D ドア(ワープ)  S かんばん
//         k 本だな/かべ  f ゆか  t つくえ  e ベッド  M マット(ワープ)
const SOLID_TILES = new Set(["R", "W", "r", "w", "o", "S", "k", "t", "e", "b"]);

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
      "RRRRRRRRR.RRRRRRRRR",
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
    edges: { s: { map: "town", x: 9, y: 1 }, n: { map: "route2", x: 9, y: 22 } },
    signs: { "8,1": "↑ 2ばんルート\nコカゲのもり ほうめん" },
    encounters: [
      { sp: "norinezu", w: 35, min: 2, max: 4 },
      { sp: "kotoris", w: 30, min: 2, max: 4 },
      { sp: "mushimaru", w: 25, min: 2, max: 4 },
      { sp: "denris", w: 10, min: 3, max: 5 },
    ],
    npcs: [
      {
        id: "rival", x: 9, y: 11, spr: "rival", dir: "down",
        visible: f => !f.rivalBeaten,
        talk: async () => rivalBattle(),
      },
    ],
  },

  route2: {
    name: "2ばんルート",
    grid: [
      "RRRRRRRRR.RRRRRRRRR",
      "R........P........R",
      "R..TTT...P...TTT..R",
      "R..TTT...P...TTT..R",
      "R........P........R",
      "R...PPPPPP........R",
      "R...P....RRRR.....R",
      "R...P....RRRR..,..R",
      "R...P....RRRR.....R",
      "R...PPPPPPPPPP....R",
      "R..TTT...R...P.TT.R",
      "R..TTT...R...P.TT.R",
      "R........R...P....R",
      "R....RRRRR...P....R",
      "R....R...PPPPP....R",
      "R....R...P...RR...R",
      "R.,..R...P....R.,.R",
      "R..TTTT..P..TTTT..R",
      "R..TTTT..P..TTTT..R",
      "R........P........R",
      "R........P........R",
      "R..TT....P....TT..R",
      "R........P........R",
      "RRRRRRRRR.RRRRRRRRR",
    ],
    warps: [],
    edges: { s: { map: "route1", x: 9, y: 1 }, n: { map: "kokage", x: 9, y: 14 } },
    signs: { "8,1": "↑ コカゲまち\nもりの こかげで ひとやすみ" },
    encounters: [
      { sp: "kinokomo", w: 28, min: 5, max: 8 },
      { sp: "kodanupon", w: 25, min: 5, max: 8 },
      { sp: "hachibun", w: 22, min: 6, max: 8 },
      { sp: "norinezu", w: 12, min: 6, max: 9 },
      { sp: "yorufuku", w: 8, min: 6, max: 9 },
      { sp: "mushimaru", w: 5, min: 7, max: 8 },
    ],
    npcs: [
      {
        id: "bugboy", x: 4, y: 5, spr: "boy", dir: "down", sight: 3,
        visible: () => true,
        battle: {
          name: "むしとりしょうねんの タケト",
          team: [["mushimaru", 7], ["hachibun", 8]],
          flag: "t_route2_bugboy",
          intro: "タケト「ぼくの むしミニモンは\nもりで きたえた さいきょうなんだ!」",
          win: "タケト「ぼくの むしたちが…!\nまだまだ きたえなおしだ!」",
          post: "タケト「もりの おくには もっと\nつよい トレーナーが いるよ。」",
          reward: { capsule: 2 },
        },
      },
      {
        id: "picnic", x: 13, y: 14, spr: "lady", dir: "left", sight: 3,
        visible: () => true,
        battle: {
          name: "ピクニックがおの ミナ",
          team: [["kinokomo", 8], ["kodanupon", 8]],
          flag: "t_route2_picnic",
          intro: "ミナ「あら かわいい ミニモン!\nでも まけないわよ?」",
          win: "ミナ「つよいのね…\nコカゲまちは すぐ そこよ。」",
          post: "ミナ「コカゲまちの ほこらには\nもりびとの ヤナギさんが いるわ。」",
          reward: { potion: 1 },
        },
      },
      {
        id: "hiker", x: 9, y: 17, spr: "boy", dir: "down", sight: 3,
        visible: () => true,
        battle: {
          name: "やまおとこの ゴウ",
          team: [["kodanupon", 9], ["norinezu", 9], ["mushimaru", 10]],
          flag: "t_route2_hiker",
          intro: "ゴウ「もりを ぬけるには\nおれを たおしてからだ!」",
          win: "ゴウ「ぬはは! いい きあいだ!\nもりびとに よろしくな!」",
          post: "ゴウ「もりの くさむらは\nレベルあげに もってこいだぞ。」",
        },
      },
    ],
  },

  kokage: {
    name: "コカゲまち",
    grid: [
      "RRRRRRRRRRRRRRRRRRR",
      "R........P........R",
      "R...rrrrrrrrr.....R",
      "R...rrrrrrrrr.....R",
      "R...rrrrrDrrr.....R",
      "R........P........R",
      "R.,......P......,.R",
      "R........P........R",
      "R..rrrr......rrrr.R",
      "R..rrrr......rrrr.R",
      "R..wwww......wwww.R",
      "R........P........R",
      "R...,....P....,...R",
      "R........P........R",
      "RRRRRRRRR.RRRRRRRRR",
    ],
    warps: [
      { x: 9, y: 4, to: { map: "shrine1", x: 6, y: 8, dir: "up" } },
    ],
    edges: { s: { map: "route2", x: 9, y: 1 } },
    signs: { "9,5": "コカゲまち ほこら\n~もりの まもり ヤナギ~" },
    npcs: [
      {
        id: "nurse", x: 4, y: 7, spr: "lady", dir: "right",
        visible: () => true,
        talk: async () => {
          await say("ヒーラー「ようこそ コカゲまちへ。\nミニモンを やすめていって。」");
          game.party.forEach(m => { m.hp = m.maxHp; });
          await say("ミニモンたちは げんきいっぱいに なった!");
          if (!game.flags.badge1) {
            await say("ヒーラー「きたの ほこらで\nヤナギさんが まってるわよ。」");
          }
        },
      },
      {
        id: "townboy", x: 13, y: 7, spr: "boy", dir: "left",
        visible: () => true,
        talk: async () => {
          if (game.flags.badge1) {
            await say("おとこのこ「ヤナギさんに かったんだ!?\nすごいや、きみ つよいんだね!");
          } else {
            await say("おとこのこ「ほこらの ヤナギさんは\nむしタイプの めいじんなんだ。");
          }
        },
      },
      {
        id: "shop", x: 13, y: 11, spr: "prof", dir: "down",
        visible: () => true,
        talk: async () => {
          await shopMenu(["capsule", "potion"]);
        },
      },
      {
        id: "shopinfo", x: 5, y: 12, spr: "boy", dir: "down",
        visible: () => true,
        talk: async () => {
          await say("みせの ひと「モンカプセルや キズぐすりは\nトレーナーせんの しょうきんで かえるよ。");
        },
      },
    ],
  },

  shrine1: {
    name: "コカゲのほこら",
    grid: [
      "kkkkkkkkkkkkk",
      "kfffffffffffk",
      "kfffffffffffk",
      "kfftffffftffk",
      "kfffffffffffk",
      "kfffffffffffk",
      "kfffffffffffk",
      "kfffffffffffk",
      "kfffffffffffk",
      "kkkkkkMkkkkkk",
    ],
    warps: [
      { x: 6, y: 9, to: { map: "kokage", x: 9, y: 5, dir: "down" } },
    ],
    signs: {},
    npcs: [
      {
        id: "guard", x: 3, y: 5, spr: "boy", dir: "right", sight: 4,
        visible: () => true,
        battle: {
          name: "ほこらの みならい",
          team: [["mushimaru", 8], ["kinokomo", 9]],
          flag: "t_shrine1_guard",
          intro: "みならい「ヤナギさまに あうには\nまず ぼくを たおさないと!」",
          win: "みならい「みごと…!\nヤナギさまは おくに おられます。」",
          post: "みならい「ヤナギさまは おくだ。\nがんばって!」",
        },
      },
      {
        id: "yanagi", x: 6, y: 2, spr: "lady", dir: "down",
        visible: () => true,
        talk: async () => {
          if (game.flags.badge1) {
            await say("ヤナギ「きみの むしへの あいは ほんもの。\nこれからの たびも きを つけてな。」");
            return;
          }
          await say("ヤナギ「わたしが もりびとの ヤナギ。\nこの ほこらを まもる ものです。」");
          await say("ヤナギ「むしタイプの こわさ、\nその みで あじわいなさい!」");
          await trainerBattleData({
            name: "もりびとの ヤナギ",
            team: [["hachibun", 10], ["yorufuku", 9], ["choumaru", 12]],
            flag: "t_shrine1_yanagi",
            win: "ヤナギ「…まいりました。\nきみには ほんものの ちからが ある。」",
            reward: { badge: "badge1", capsule: 3, potion: 2 },
            after: async () => {
              await say("ヤナギから 「もりのバッジ」を\nうけとった!");
              await say("ヤナギ「これで きみは せいしきな\nトレーナーへ いっぽ ちかづいた。」");
              await say("ヤナギ「…そういえば。きみの けんきゅうじょの\nオカダはかせ。むかし この ほこらを\nしらべに きた ことが あったよ。」");
            },
          });
        },
      },
    ],
  },
};
