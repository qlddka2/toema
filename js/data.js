/* 퇴마 서바이버(가제) — 게임 데이터. 밸런스 숫자는 전부 여기서 고칩니다. */
(function (G) {
const D = {};

/* ───── 주인공 ───── */
D.HEROES = {
  daesung: { name: '대성', title: '하늘을 어지럽힌 원숭이 왕', cls: '근거리', hp: 120, armor: 2, speed: 100, weapon: 'staff',
    desc: '여의봉을 크게 휘둘러 주변을 쓸어버립니다. 체력과 방어가 높아요.', color: '#e8a33c' },
  uchi:    { name: '우치', title: '부적을 날리는 떠돌이 도사', cls: '원거리', hp: 110, armor: 1, speed: 106, weapon: 'talisman',
    desc: '가까운 적에게 부적을 날립니다. 몸은 약하지만 발이 빠르고 술법이 빨라요.', color: '#5aa7e8', cdMul: 0.95 },
};

/* ───── 무기 (레벨 1~5) ─────
   lv 배열: 해당 레벨의 '전체' 수치 */
D.WEAPONS = {
  staff: { name: '여의봉', icon: 'staff', desc: '앞쪽을 반원으로 휩쓸어요',
    lv: [
      { dmg: 20, cd: 1.10, range: 74, arc: 150, back: false, kb: 70 },
      { dmg: 27, cd: 1.10, range: 74, arc: 150, back: false, kb: 70 },
      { dmg: 27, cd: 1.05, range: 78, arc: 150, back: true,  kb: 80 },
      { dmg: 35, cd: 1.00, range: 92, arc: 160, back: true,  kb: 90 },
      { dmg: 46, cd: 0.90, range: 98, arc: 170, back: true,  kb: 100 } ],
    up: ['피해 +7', '뒤쪽도 함께 휩쓸기', '범위 +18%, 피해 +8', '피해 +11, 속도 증가'] },
  talisman: { name: '부적', icon: 'talisman', desc: '가장 가까운 적에게 부적을 날려요',
    lv: [
      { dmg: 12, cd: 0.75, n: 1, pierce: 1, spd: 320 },
      { dmg: 12, cd: 0.75, n: 2, pierce: 1, spd: 320 },
      { dmg: 17, cd: 0.70, n: 2, pierce: 2, spd: 340 },
      { dmg: 17, cd: 0.65, n: 3, pierce: 2, spd: 340 },
      { dmg: 23, cd: 0.58, n: 3, pierce: 3, spd: 360 } ],
    up: ['부적 +1장', '피해 +5, 관통 +1', '부적 +1장', '피해 +6, 관통 +1'] },
  thunder: { name: '낙뢰부', icon: 'thunder', desc: '하늘에서 번개가 떨어져요',
    lv: [
      { dmg: 24, cd: 2.2, n: 2, r: 34 },
      { dmg: 24, cd: 2.2, n: 3, r: 34 },
      { dmg: 32, cd: 2.0, n: 3, r: 40 },
      { dmg: 32, cd: 1.8, n: 4, r: 40 },
      { dmg: 44, cd: 1.6, n: 5, r: 46 } ],
    up: ['번개 +1', '피해 +8, 범위 증가', '번개 +1, 빨라짐', '피해 +12, 번개 +1'] },
  beads: { name: '염주', icon: 'beads', desc: '구슬이 몸 주위를 돌며 막아요',
    lv: [
      { dmg: 9,  n: 2, rad: 56, rot: 3.0, hitcd: 0.5 },
      { dmg: 9,  n: 3, rad: 56, rot: 3.0, hitcd: 0.5 },
      { dmg: 13, n: 3, rad: 62, rot: 3.4, hitcd: 0.45 },
      { dmg: 13, n: 4, rad: 66, rot: 3.6, hitcd: 0.45 },
      { dmg: 19, n: 5, rad: 72, rot: 4.0, hitcd: 0.4 } ],
    up: ['구슬 +1', '피해 +4, 빨라짐', '구슬 +1, 반경 증가', '피해 +6, 구슬 +1'] },
  aura: { name: '금강결계', icon: 'aura', desc: '주변의 적에게 계속 피해를 줘요',
    lv: [
      { dmg: 5, tick: 0.45, r: 48, slow: 0.15 },
      { dmg: 6, tick: 0.42, r: 56, slow: 0.15 },
      { dmg: 8, tick: 0.40, r: 62, slow: 0.20 },
      { dmg: 9, tick: 0.38, r: 70, slow: 0.20 },
      { dmg: 12, tick: 0.35, r: 80, slow: 0.25 } ],
    up: ['범위·피해 증가', '피해 +2, 둔화 증가', '범위 증가', '피해 +3, 범위 크게 증가'] },
  fan: { name: '파초선', icon: 'fan', desc: '바람을 일으켜 적을 밀어내요',
    lv: [
      { dmg: 14, cd: 2.6, w: 70, range: 240, back: false, kb: 160 },
      { dmg: 20, cd: 2.6, w: 70, range: 240, back: false, kb: 160 },
      { dmg: 20, cd: 2.4, w: 80, range: 260, back: true,  kb: 180 },
      { dmg: 28, cd: 2.0, w: 90, range: 270, back: true,  kb: 180 },
      { dmg: 38, cd: 1.8, w: 110, range: 300, back: true, kb: 220 } ],
    up: ['피해 +6', '뒤로도 바람', '피해 +8, 빨라짐', '피해 +10, 폭 증가'] },
};

/* ───── 패시브 (레벨당) ───── */
D.PASSIVES = {
  might:  { name: '근력',  icon: 'might',  desc: '모든 피해 +10%',        per: 0.10 },
  haste:  { name: '단전',  icon: 'haste',  desc: '공격 간격 -7%',          per: 0.07 },
  vigor:  { name: '체력',  icon: 'vigor',  desc: '최대 체력 +15%',         per: 0.15 },
  swift:  { name: '경공',  icon: 'swift',  desc: '이동 속도 +8%',          per: 0.08 },
  magnet: { name: '흡기',  icon: 'magnet', desc: '구슬 흡수 범위 +30%',    per: 0.30 },
  regen:  { name: '회춘',  icon: 'regen',  desc: '초당 체력 회복 +0.4',     per: 0.4 },
};
D.MAX_W = 4; D.MAX_P = 4; D.MAX_LV = 5;

/* ───── 적 ─────
   ai: chase | charge(돌진) | fly(흔들며 비행) | zig(지그재그) */
D.ENEMIES = {
  dog:    { name: '좀비 들개',   hp: 10,  spd: 62,  dmg: 6,  xp: 1, r: 10, ai: 'chase', mass: 1 },
  crow:   { name: '좀비 까마귀', hp: 7,   spd: 86,  dmg: 5,  xp: 1, r: 9,  ai: 'fly',   mass: 0.6 },
  boar:   { name: '좀비 멧돼지', hp: 28,  spd: 48,  dmg: 10, xp: 2, r: 13, ai: 'charge', mass: 2 },
  bear:   { name: '좀비 곰',     hp: 240, spd: 50,  dmg: 16, xp: 12, r: 21, ai: 'chase', mass: 6, elite: true },
  wolf:   { name: '좀비 늑대',   hp: 16,  spd: 66,  dmg: 8,  xp: 1, r: 11, ai: 'chase', mass: 1.2 },
  snake:  { name: '좀비 뱀',     hp: 22,  spd: 56,  dmg: 9,  xp: 2, r: 10, ai: 'zig',   mass: 1 },
  bat:    { name: '좀비 박쥐',   hp: 6,   spd: 88, dmg: 5,  xp: 1, r: 8,  ai: 'fly',   mass: 0.5 },
  buffalo:{ name: '좀비 물소',   hp: 420, spd: 46,  dmg: 20, xp: 14, r: 22, ai: 'charge', mass: 8, elite: true },
};

/* ───── 보스 ───── */
D.BOSSES = {
  tiger: { name: '검치호', sub: '고대의 송곳니', hp: 2400, spd: 70, dmg: 14, r: 30, kind: 'tiger', gold: 40 },
  fox:   { name: '구미호', sub: '아홉 꼬리의 요녀', hp: 14000, spd: 62, dmg: 16, r: 28, kind: 'fox', gold: 120 },
  bulga: { name: '불가사리', sub: '쇠를 먹는 괴수', hp: 3800, spd: 44, dmg: 22, r: 36, kind: 'bulga', gold: 70 },
  imugi: { name: '이무기', sub: '용이 되지 못한 뱀', hp: 16000, spd: 78, dmg: 15, r: 26, kind: 'imugi', gold: 200 },
};

/* ───── 챕터 ─────
   waves: [시작초, 초당 스폰, {종류:가중치}]
   events: 정해진 시각의 엘리트·포위·보스 */
D.CHAPTERS = [
  { id: 1, name: '버려진 산골', sub: '좀비가 된 짐승들이 마을을 덮쳤다', ground: ['#2f4a2c', '#36542f', '#3d5d33'], deco: 'grass',
    hpMul: 1, dmgMul: 1, clearGold: 150,
    waves: [
      [0,   1.7, { dog: 1 }],
      [60,  2.5, { dog: 3, crow: 2 }],
      [120, 3.4, { dog: 3, crow: 2, boar: 1 }],
      [180, 4.2, { dog: 3, crow: 3, boar: 2 }],
      [240, 4.6, { dog: 2, crow: 3, boar: 2 }],
      [300, 5.0, { dog: 3, crow: 3, boar: 3 }],
      [420, 6.2, { dog: 3, crow: 4, boar: 3 }],
      [540, 7.6, { dog: 3, crow: 4, boar: 4 }],
      [600, 1.2, { dog: 2, crow: 2 }] ],
    events: [
      [150, 'ring', 'crow', 22], [200, 'elite', 'bear'], [300, 'boss', 'tiger'],
      [380, 'ring', 'dog', 30], [450, 'elite', 'bear'], [500, 'ring', 'crow', 36], [530, 'elite', 'bear'],
      [600, 'boss', 'fox'] ] },
  { id: 2, name: '썩은 늪', sub: '늪 깊은 곳에서 무언가 꿈틀댄다', ground: ['#2a3a3a', '#2f4440', '#36493f'], deco: 'swamp',
    hpMul: 1.3, dmgMul: 1.15, clearGold: 260,
    waves: [
      [0,   1.6, { wolf: 2, bat: 1 }],
      [60,  2.8, { wolf: 3, bat: 2 }],
      [120, 3.6, { wolf: 3, bat: 3, snake: 1 }],
      [180, 4.5, { wolf: 3, bat: 3, snake: 2 }],
      [240, 4.9, { wolf: 2, bat: 3, snake: 3 }],
      [300, 5.3, { wolf: 3, bat: 3, snake: 3 }],
      [420, 6.4, { wolf: 3, bat: 4, snake: 3 }],
      [540, 7.8, { wolf: 3, bat: 4, snake: 4 }],
      [600, 1.4, { wolf: 2, bat: 2 }] ],
    events: [
      [140, 'ring', 'bat', 26], [200, 'elite', 'buffalo'], [300, 'boss', 'bulga'],
      [370, 'ring', 'wolf', 30], [440, 'elite', 'buffalo'], [500, 'ring', 'bat', 40], [530, 'elite', 'buffalo'],
      [600, 'boss', 'imugi'] ] },
];
D.BOSS_TIME = 600;          // 최종보스 등장 시각(초)
D.ENEMY_CAP = 320;

/* 시간에 따른 적 강화: 10분에 체력 x6, 피해 x2.2 */
D.hpScale = t => 1 + Math.pow(Math.min(t, 600) / 600, 1.3) * 5;
D.dmgScale = t => 1 + Math.min(t, 600) / 600 * 1.2;

/* 레벨업 필요 경험치 */
D.xpNeed = L => Math.round(5 + (L - 1) * 7 + Math.max(0, L - 15) * 6);

/* ───── 영구 강화(금화) ───── */
D.META = {
  atk:   { name: '기력', desc: '피해 +4%',          max: 5, per: 0.04, cost: [60, 120, 200, 300, 450] },
  hp:    { name: '체질', desc: '최대 체력 +6%',     max: 5, per: 0.06, cost: [60, 120, 200, 300, 450] },
  spd:   { name: '신법', desc: '이동 속도 +3%',     max: 5, per: 0.03, cost: [50, 100, 160, 240, 350] },
  mag:   { name: '흡인', desc: '구슬 흡수 범위 +10%', max: 5, per: 0.10, cost: [40, 80, 130, 200, 300] },
  xp:    { name: '오성', desc: '경험치 +5%',        max: 5, per: 0.05, cost: [70, 140, 230, 340, 500] },
  roll:  { name: '천운', desc: '다시 뽑기 +1회',    max: 2, per: 1,    cost: [150, 400] },
};

/* 랭킹 점수(서버와 같은 공식) */
D.score = (t, kills, mid, cleared, bossT) =>
  10 * Math.min(t, 600) + kills + (mid ? 1500 : 0) + (cleared ? 5000 + Math.max(0, 180 - bossT) * 20 : 0);

G.DATA = D;
if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
