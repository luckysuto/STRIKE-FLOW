
/*
 * STRIKE FLOW
 * Character & Move Data
 *
 * 時間の単位：秒
 * start    = 攻撃発生までの時間
 * active   = 攻撃判定の持続時間
 * recovery = 攻撃後の硬直時間
 */

export const ROSTER = [
  {
    id: "balance",
    name: "レイ",
    type: "バランス",
    color: "#53b8ff",
    hp: 110,
    attack: 6,
    defense: 6,
    speed: 6,
    combo: 6,
    passive: "適応力",
    action: "構え変更",
    skills: [
      "連迅拳",
      "旋風脚"
    ],
    supers: [
      "閃光一閃",
      "天衝破",
      "終焉烈破"
    ]
  },
  {
    id: "speed",
    name: "シオン",
    type: "スピード",
    color: "#59f0eb",
    hp: 85,
    attack: 4,
    defense: 3,
    speed: 10,
    combo: 8,
    passive: "軽快",
    action: "残影",
    skills: [
      "瞬歩撃",
      "飛燕撃"
    ],
    supers: [
      "雷影瞬殺",
      "紫電昇華",
      "神速・零閃"
    ]
  },
  {
    id: "power",
    name: "ガイア",
    type: "パワー",
    color: "#ff5969",
    hp: 125,
    attack: 10,
    defense: 5,
    speed: 3,
    combo: 3,
    passive: "剛腕",
    action: "溜め攻撃",
    skills: [
      "豪腕投げ",
      "破砕拳"
    ],
    supers: [
      "轟砕拳",
      "覇天撃",
      "滅界衝"
    ]
  },
  {
    id: "tank",
    name: "グラン",
    type: "タンク",
    color: "#7ed39b",
    hp: 155,
    attack: 4,
    defense: 10,
    speed: 2,
    combo: 2,
    passive: "堅牢",
    action: "鉄壁",
    skills: [
      "鉄壁突進",
      "震撃"
    ],
    supers: [
      "鉄獄突進",
      "震天崩",
      "絶対城壁・崩天"
    ]
  },
  {
    id: "tech",
    name: "クロウ",
    type: "テクニック",
    color: "#b49aff",
    hp: 95,
    attack: 5,
    defense: 4,
    speed: 7,
    combo: 10,
    passive: "連携",
    action: "見切り",
    skills: [
      "返し技",
      "連携突き"
    ],
    supers: [
      "無影穿",
      "空断連舞",
      "虚空終式"
    ]
  },
  {
    id: "rush",
    name: "レン",
    type: "ラッシュ",
    color: "#ffa45b",
    hp: 100,
    attack: 7,
    defense: 3,
    speed: 8,
    combo: 9,
    passive: "猛攻",
    action: "連撃態勢",
    skills: [
      "疾風連打",
      "乱舞脚"
    ],
    supers: [
      "狂乱連牙",
      "爆裂昇撃",
      "修羅百裂"
    ]
  },
  {
    id: "trick",
    name: "ゼノ",
    type: "トリッキー",
    color: "#d68aff",
    hp: 90,
    attack: 5,
    defense: 4,
    speed: 9,
    combo: 7,
    passive: "幻惑",
    action: "フェイント",
    skills: [
      "虚撃",
      "影渡り"
    ],
    supers: [
      "幻影零歩",
      "虚空転舞",
      "夢幻葬華"
    ],
    commands: [
      "逆襲歩",
      "幻影蹴",
      "空転撃"
    ]
  }
];

/*
 * 全キャラクター共通の基本技
 *
 * damage    = 基礎ダメージ
 * range     = 攻撃の届く距離
 * stun      = 相手の硬直
 * knockback = 吹き飛ばす速度
 * priority  = 同時攻撃時の優先度
 */

export const MOVES = {
  punch: {
    label: "打撃",
    damage: 5,
    start: 0.12,
    active: 0.08,
    recovery: 0.12,
    range: 66,
    stun: 0.26,
    knockback: 90,
    priority: 1
  },

  kick: {
    label: "蹴り",
    damage: 7,
    start: 0.18,
    active: 0.09,
    recovery: 0.17,
    range: 100,
    stun: 0.34,
    knockback: 150,
    priority: 2
  },

  grab: {
    label: "掴み",
    damage: 9,
    start: 0.24,
    active: 0.07,
    recovery: 0.30,
    range: 52,
    stun: 0.38,
    knockback: 200,
    priority: 3,
    grab: true
  },

  tackle: {
    label: "タックル",
    damage: 8,
    start: 0.22,
    active: 0.11,
    recovery: 0.24,
    range: 90,
    stun: 0.38,
    knockback: 240,
    priority: 3,
    advance: 260
  },

  upper: {
    label: "アッパー",
    damage: 7,
    start: 0.20,
    active: 0.10,
    recovery: 0.22,
    range: 72,
    stun: 0.42,
    knockback: 110,
    priority: 4,
    launch: true
  },

  air: {
    label: "空中攻撃",
    damage: 6,
    start: 0.16,
    active: 0.10,
    recovery: 0.18,
    range: 78,
    stun: 0.31,
    knockback: 140,
    priority: 2
  },

  /*
   * 固有技
   *
   * キャラクターごとの技名は
   * ROSTER.skills から取得する。
   */

  skill1: {
    label: "固有技1",
    damage: 9,
    start: 0.20,
    active: 0.12,
    recovery: 0.28,
    range: 115,
    stun: 0.45,
    knockback: 190,
    priority: 4,
    advance: 140
  },

  skill2: {
    label: "固有技2",
    damage: 12,
    start: 0.28,
    active: 0.12,
    recovery: 0.36,
    range: 125,
    stun: 0.50,
    knockback: 250,
    priority: 5,
    launch: true
  },

  /*
   * 必殺技
   *
   * super1 = 素早いコンボ始動
   * super2 = 打ち上げ
   * super3 = 高威力のフィニッシュ
   *
   * ゲージ・クールダウンなし。
   */

  super1: {
    label: "必殺技1",
    damage: 10,
    start: 0.17,
    active: 0.12,
    recovery: 0.25,
    range: 130,
    stun: 0.48,
    knockback: 160,
    priority: 5,
    advance: 190
  },

  super2: {
    label: "必殺技2",
    damage: 13,
    start: 0.27,
    active: 0.13,
    recovery: 0.32,
    range: 145,
    stun: 0.56,
    knockback: 180,
    priority: 6,
    launch: true
  },

  super3: {
    label: "必殺技3",
    damage: 20,
    start: 0.40,
    active: 0.16,
    recovery: 0.45,
    range: 165,
    stun: 0.65,
    knockback: 350,
    priority: 7,
    advance: 110
  }
};
