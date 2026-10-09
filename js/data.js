/* 퇴마록: 서바이버(가제) — 게임 데이터. 밸런스 숫자는 전부 여기서 고칩니다. */
(function (G) {
const D = {};
D.VERSION = '1.0.0';

/* ───── 주인공 ─────
   unlock: 해금 조건 (없으면 처음부터) */
D.HEROES = {
  daesung: { name: '대성', title: '하늘을 어지럽힌 원숭이 왕', cls: '근거리', hp: 130, armor: 2, speed: 100, weapon: 'staff', meleeMul: 1.2,
    desc: '여의봉을 크게 휘둘러 주변을 쓸어버립니다. 체력과 방어가 높아요.', trait: '근접 피해 +20%' },
  uchi: { name: '우치', title: '부적을 날리는 떠돌이 도사', cls: '원거리', hp: 110, armor: 1, speed: 106, weapon: 'talisman', cdMul: 0.95,
    desc: '가까운 적에게 부적을 날립니다. 발이 빠르고 술법이 빨라요.', trait: '공격 간격 -5%' },
  bari: { name: '바리', title: '저승길을 여는 무녀', cls: '지원', hp: 105, armor: 1, speed: 102, weapon: 'bell', regen: 0.5,
    desc: '방울 소리가 퍼지며 주변 적을 밀어내요. 스스로 상처를 치유합니다.', trait: '초당 체력 회복 +0.5', unlock: { k: 'clear', ch: 1, txt: '1장 클리어' } },
  gildong: { name: '길동', title: '바람처럼 사라지는 의적', cls: '기동', hp: 95, armor: 0, speed: 116, weapon: 'knives', goldMul: 1.2,
    desc: '가까운 적에게 비도를 부채꼴로 연달아 던져요. 가장 빠르고 금화를 더 줍습니다.', trait: '금화 +20%', unlock: { k: 'kills', n: 3000, txt: '누적 처치 3,000' } },
  gangrim: { name: '강림', title: '염라의 명을 받은 차사', cls: '술법', hp: 110, armor: 1, speed: 100, weapon: 'soulfire', xpMul: 1.1,
    desc: '혼불이 스스로 적을 쫓아가 터집니다. 성장이 빨라요.', trait: '경험치 +10%', unlock: { k: 'clear', ch: 2, txt: '2장 클리어' } },
  seolmun: { name: '설문', title: '섬을 빚은 거인 할망', cls: '수호', hp: 160, armor: 3, speed: 92, weapon: 'quake', areaMul: 1.15,
    desc: '땅을 울려 바위를 솟구치게 해요. 느리지만 가장 단단합니다.', trait: '공격 범위 +15%', unlock: { k: 'clear', ch: 3, txt: '3장 클리어' } },
};

/* ───── 무기 (레벨 1~5 + 진화) ─────
   evo: 5레벨 + 짝 패시브를 가진 상태로 보물 상자를 열면 진화 */
D.WEAPONS = {
  staff: { name: '여의봉', icon: 'staff', desc: '가장 가까운 적 쪽을 반원으로 휩쓸어요',
    lv: [
      { dmg: 20, cd: 1.10, range: 74, arc: 150, back: false, kb: 70 },
      { dmg: 27, cd: 1.10, range: 74, arc: 150, back: false, kb: 70 },
      { dmg: 27, cd: 1.05, range: 78, arc: 150, back: true, kb: 80 },
      { dmg: 35, cd: 1.00, range: 92, arc: 160, back: true, kb: 90 },
      { dmg: 46, cd: 0.90, range: 98, arc: 170, back: true, kb: 100 } ],
    up: ['피해 +7', '뒤쪽도 함께 휩쓸기', '범위 +18%, 피해 +8', '피해 +11, 속도 증가'],
    evo: { name: '여의금고봉', with: 'might', desc: '봉이 커지며 사방을 한 번에 휩쓸어요', s: { dmg: 56, cd: 0.85, range: 130, arc: 360, back: false, kb: 140 } } },
  talisman: { name: '부적', icon: 'talisman', desc: '가장 가까운 적에게 부적을 날려요',
    lv: [
      { dmg: 12, cd: 0.75, n: 1, pierce: 1, spd: 320 },
      { dmg: 12, cd: 0.75, n: 2, pierce: 1, spd: 320 },
      { dmg: 17, cd: 0.70, n: 2, pierce: 2, spd: 340 },
      { dmg: 17, cd: 0.65, n: 3, pierce: 2, spd: 340 },
      { dmg: 23, cd: 0.58, n: 3, pierce: 3, spd: 360 } ],
    up: ['부적 +1장', '피해 +5, 관통 +1', '부적 +1장', '피해 +6, 관통 +1'],
    evo: { name: '천라지망부', with: 'haste', desc: '부적 6장이 끝없이 꿰뚫어요', s: { dmg: 24, cd: 0.45, n: 6, pierce: 99, spd: 400 } } },
  thunder: { name: '낙뢰부', icon: 'thunder', desc: '하늘에서 번개가 떨어져요',
    lv: [
      { dmg: 24, cd: 2.2, n: 2, r: 34 },
      { dmg: 24, cd: 2.2, n: 3, r: 34 },
      { dmg: 32, cd: 2.0, n: 3, r: 40 },
      { dmg: 32, cd: 1.8, n: 4, r: 40 },
      { dmg: 44, cd: 1.6, n: 5, r: 46 } ],
    up: ['번개 +1', '피해 +8, 범위 증가', '번개 +1, 빨라짐', '피해 +12, 번개 +1'],
    evo: { name: '뇌신강림', with: 'luck', desc: '번개 9줄기가 쉬지 않고 내려쳐요', s: { dmg: 48, cd: 1.1, n: 9, r: 56 } } },
  beads: { name: '염주', icon: 'beads', desc: '구슬이 몸 주위를 돌며 막아요',
    lv: [
      { dmg: 9, n: 2, rad: 56, rot: 3.0, hitcd: 0.5 },
      { dmg: 9, n: 3, rad: 56, rot: 3.0, hitcd: 0.5 },
      { dmg: 13, n: 3, rad: 62, rot: 3.4, hitcd: 0.45 },
      { dmg: 13, n: 4, rad: 66, rot: 3.6, hitcd: 0.45 },
      { dmg: 19, n: 5, rad: 72, rot: 4.0, hitcd: 0.4 } ],
    up: ['구슬 +1', '피해 +4, 빨라짐', '구슬 +1, 반경 증가', '피해 +6, 구슬 +1'],
    evo: { name: '백팔염주', with: 'vigor', desc: '큰 구슬 8알이 두 겹으로 돌아요', s: { dmg: 24, n: 8, rad: 84, rot: 4.4, hitcd: 0.35, big: true } } },
  aura: { name: '금강결계', icon: 'aura', desc: '주변의 적에게 계속 피해를 줘요',
    lv: [
      { dmg: 5, tick: 0.45, r: 48, slow: 0.15 },
      { dmg: 6, tick: 0.42, r: 56, slow: 0.15 },
      { dmg: 8, tick: 0.40, r: 62, slow: 0.20 },
      { dmg: 9, tick: 0.38, r: 70, slow: 0.20 },
      { dmg: 12, tick: 0.35, r: 80, slow: 0.25 } ],
    up: ['범위·피해 증가', '피해 +2, 둔화 증가', '범위 증가', '피해 +3, 범위 크게 증가'],
    evo: { name: '금강불괴', with: 'regen', desc: '결계가 넓어지고 적을 쓰러뜨릴 때마다 회복해요', s: { dmg: 14, tick: 0.3, r: 105, slow: 0.35, heal: 0.4 } } },
  fan: { name: '파초선', icon: 'fan', desc: '바람을 일으켜 적을 밀어내요',
    lv: [
      { dmg: 14, cd: 2.6, w: 70, range: 240, dirs: 1, kb: 560, stun: 0.3 },
      { dmg: 20, cd: 2.6, w: 70, range: 240, dirs: 1, kb: 560, stun: 0.3 },
      { dmg: 20, cd: 2.4, w: 80, range: 260, dirs: 2, kb: 630, stun: 0.3 },
      { dmg: 28, cd: 2.0, w: 90, range: 270, dirs: 2, kb: 630, stun: 0.3 },
      { dmg: 38, cd: 1.8, w: 110, range: 300, dirs: 2, kb: 770, stun: 0.3 } ],
    up: ['피해 +6', '뒤로도 바람', '피해 +8, 빨라짐', '피해 +10, 폭 증가'],
    evo: { name: '태풍선', with: 'swift', desc: '네 방향으로 거대한 바람이 휘몰아쳐요', s: { dmg: 44, cd: 1.5, w: 150, range: 360, dirs: 4, kb: 910, stun: 0.3 } } },
  bell: { name: '무령', icon: 'bell', desc: '방울 소리가 둥글게 퍼져 적을 밀어내요',
    lv: [
      { dmg: 14, cd: 2.0, r: 110, kb: 240, slow: 0.2 },
      { dmg: 19, cd: 2.0, r: 120, kb: 260, slow: 0.2 },
      { dmg: 19, cd: 1.7, r: 135, kb: 280, slow: 0.3 },
      { dmg: 26, cd: 1.6, r: 150, kb: 300, slow: 0.3 },
      { dmg: 34, cd: 1.4, r: 165, kb: 340, slow: 0.4 } ],
    up: ['피해 +5, 범위 증가', '빨라짐, 둔화 증가', '피해 +7, 범위 증가', '피해 +8, 범위·빠르기 증가'],
    evo: { name: '천상무령', with: 'magnet', desc: '두 번 울리고 구슬까지 끌어와요', s: { dmg: 37, cd: 1.2, r: 210, kb: 400, slow: 0.5, twice: true } } },
  knives: { name: '비도', icon: 'knives', desc: '가까운 적에게 단검을 부채꼴로 던져요',
    lv: [
      { dmg: 9, cd: 0.45, n: 1, pierce: 1, spd: 440 },
      { dmg: 9, cd: 0.42, n: 2, pierce: 1, spd: 440 },
      { dmg: 13, cd: 0.40, n: 2, pierce: 2, spd: 460 },
      { dmg: 13, cd: 0.36, n: 3, pierce: 2, spd: 460 },
      { dmg: 18, cd: 0.32, n: 4, pierce: 3, spd: 480 } ],
    up: ['단검 +1', '피해 +4, 관통 +1', '단검 +1, 빨라짐', '피해 +5, 단검 +1'],
    evo: { name: '만천화우', with: 'armor', desc: '사방팔방으로 단검이 쏟아져요', s: { dmg: 19, cd: 0.3, n: 8, pierce: 4, spd: 500, all: true } } },
  soulfire: { name: '혼불', icon: 'soulfire', desc: '혼불이 적을 쫓아가 터져요',
    lv: [
      { dmg: 16, cd: 1.6, n: 1, r: 26, spd: 170 },
      { dmg: 16, cd: 1.5, n: 2, r: 26, spd: 170 },
      { dmg: 22, cd: 1.4, n: 2, r: 32, spd: 185 },
      { dmg: 22, cd: 1.3, n: 3, r: 34, spd: 190 },
      { dmg: 30, cd: 1.2, n: 4, r: 40, spd: 200 } ],
    up: ['혼불 +1', '피해 +6, 폭발 범위 증가', '혼불 +1', '피해 +8, 혼불 +1'],
    evo: { name: '저승겁화', with: 'vigor', desc: '터진 자리에 저승불이 남아 타올라요', s: { dmg: 34, cd: 1.0, n: 5, r: 48, spd: 210, burn: true } } },
  quake: { name: '지진', icon: 'quake', desc: '주변 땅에서 바위가 솟구쳐요',
    lv: [
      { dmg: 22, cd: 2.4, n: 3, r: 30, area: 140 },
      { dmg: 22, cd: 2.2, n: 4, r: 30, area: 150 },
      { dmg: 30, cd: 2.1, n: 5, r: 34, area: 160 },
      { dmg: 30, cd: 1.9, n: 6, r: 36, area: 170 },
      { dmg: 40, cd: 1.7, n: 7, r: 40, area: 180 } ],
    up: ['바위 +1, 빨라짐', '피해 +8, 바위 +1', '바위 +1, 빨라짐', '피해 +10, 바위 +1'],
    evo: { name: '천지개벽', with: 'armor', desc: '바위 12개가 솟고 적을 잠시 기절시켜요', s: { dmg: 44, cd: 1.5, n: 12, r: 46, area: 220, stun: 0.8 } } },
};

/* ───── 패시브 (레벨당) ───── */
D.PASSIVES = {
  might:  { name: '근력', icon: 'might',  desc: '모든 피해 +10%',          per: 0.10 },
  haste:  { name: '단전', icon: 'haste',  desc: '공격 간격 -7%',            per: 0.07 },
  vigor:  { name: '체력', icon: 'vigor',  desc: '최대 체력 +15%',           per: 0.15 },
  swift:  { name: '경공', icon: 'swift',  desc: '이동 속도 +8%',            per: 0.08 },
  magnet: { name: '흡기', icon: 'magnet', desc: '구슬 흡수 범위 +30%',      per: 0.30 },
  regen:  { name: '회춘', icon: 'regen',  desc: '초당 체력 회복 +0.4',       per: 0.4 },
  armor:  { name: '철갑', icon: 'armor',  desc: '받는 피해 -1',             per: 1 },
  luck:   { name: '행운', icon: 'luck',   desc: '치명타 확률 +6%',          per: 0.06 },
};
/* 세트 효과: 같은 계열 무기를 함께 들면 보너스 (진화한 무기도 그대로 셈) */
D.SETS = {
  dosul:  { name: '도술', color: '#7fd8ff', ws: ['talisman', 'thunder', 'soulfire'],
            b: [{ n: 2, desc: '공격 간격 -8%', cd: 0.08 }, { n: 3, desc: '치명타 확률 +10%', crit: 0.10 }] },
  muye:   { name: '무예', color: '#ff9a6b', ws: ['staff', 'knives', 'quake'],
            b: [{ n: 2, desc: '피해 +10%', might: 0.10 }, { n: 3, desc: '넉백 +50%, 치명타 피해 +50%', kb: 0.5, critDmg: 0.5 }] },
  beopgu: { name: '법구', color: '#c9a7ff', ws: ['beads', 'aura', 'bell', 'fan'],
            b: [{ n: 2, desc: '공격 범위 +10%', area: 0.10 }, { n: 3, desc: '초당 체력 회복 +1', regen: 1 }] },
};
D.SET_OF = {}; for (const k in D.SETS) for (const w of D.SETS[k].ws) D.SET_OF[w] = k;
D.MAX_W = 4; D.MAX_P = 4; D.MAX_LV = 5;
D.CRIT_BASE = 0.05; D.CRIT_MUL = 2;

/* ───── 적 ─────
   ai: chase | charge(돌진) | fly(흔들며 비행) | zig(지그재그) / spr: 그림, tint: 색 덧칠 */
const E = (name, spr, hp, spd, dmg, xp, r, ai, mass, o = {}) => ({ name, spr, hp, spd, dmg, xp, r, ai, mass, ...o });
D.ENEMIES = {
  // 1장
  dog: E('좀비 들개', 'dog', 10, 62, 6, 1, 10, 'chase', 1),
  crow: E('좀비 까마귀', 'crow', 7, 86, 5, 1, 9, 'fly', 0.6),
  boar: E('좀비 멧돼지', 'boar', 28, 48, 10, 2, 13, 'charge', 2),
  bear: E('좀비 곰', 'bear', 240, 50, 16, 12, 21, 'chase', 6, { elite: true }),
  // 2장
  wolf: E('좀비 늑대', 'wolf', 16, 66, 8, 1, 11, 'chase', 1.2),
  bat: E('좀비 박쥐', 'bat', 6, 88, 5, 1, 8, 'fly', 0.5),
  snake: E('좀비 뱀', 'snake', 22, 56, 9, 2, 10, 'zig', 1),
  buffalo: E('좀비 물소', 'buffalo', 420, 46, 20, 14, 22, 'charge', 8, { elite: true }),
  // 3장 (서리)
  fwolf: E('서리 늑대', 'wolf', 16, 68, 8, 1, 11, 'chase', 1.2, { tint: 'frost' }),
  fcrow: E('얼음 까마귀', 'crow', 8, 90, 6, 1, 9, 'fly', 0.6, { tint: 'frost' }),
  fboar: E('얼어붙은 멧돼지', 'boar', 30, 50, 11, 2, 13, 'charge', 2, { tint: 'frost' }),
  fbear: E('서리 곰', 'bear', 300, 52, 18, 14, 22, 'chase', 7, { elite: true, tint: 'frost' }),
  // 4장 (불)
  hdog: E('불붙은 들개', 'dog', 12, 70, 7, 1, 10, 'chase', 1, { tint: 'fire' }),
  hbat: E('불박쥐', 'bat', 7, 94, 6, 1, 8, 'fly', 0.5, { tint: 'fire' }),
  hcrow: E('불까마귀', 'crow', 8, 90, 6, 1, 9, 'fly', 0.6, { tint: 'fire' }),
  hbuff: E('화염 물소', 'buffalo', 480, 50, 22, 16, 22, 'charge', 8, { elite: true, tint: 'fire' }),
  // 5장 (물)
  dsnake: E('물귀신 뱀', 'snake', 24, 60, 10, 2, 10, 'zig', 1, { tint: 'sea' }),
  dwolf: E('물에 잠긴 늑대', 'wolf', 18, 70, 9, 1, 11, 'chase', 1.2, { tint: 'sea' }),
  dbat: E('바다 박쥐', 'bat', 7, 94, 6, 1, 8, 'fly', 0.5, { tint: 'sea' }),
  dbear: E('익사한 곰', 'bear', 520, 52, 22, 16, 22, 'chase', 8, { elite: true, tint: 'sea' }),
};

/* ───── 보스 ─────
   move: chase | keep(거리 유지) | snake(뱀처럼) | fly(맴돌기)
   atk: 순서대로 반복하는 공격, rage: 체력 50% 이하에서 바뀌는 값 */
D.BOSSES = {
  tiger: { name: '검치호', sub: '고대의 송곳니', spr: 'tiger', hp: 2400, spd: 70, dmg: 14, r: 30, move: 'chase', gold: 40,
    atk: [{ t: 'dash', aim: 0.9, spd: 440, dur: 0.5, rest: 0.8, cd: 3.0 }],
    rage: { atk: [{ t: 'dash', aim: 0.7, spd: 440, dur: 0.5, rest: 0.6, cd: 0.4 }, { t: 'dash', aim: 0.6, spd: 440, dur: 0.5, rest: 0.8, cd: 2.2, after: { t: 'ring', n: 8, spd: 140, dmg: 12, k: 'shard' } }] } },
  fox: { name: '구미호', sub: '아홉 꼬리의 요녀', spr: 'fox', hp: 24000, spd: 62, dmg: 16, r: 28, move: 'keep', gold: 120,
    atk: [{ t: 'ring', n: 12, spd: 115, dmg: 14, cd: 2.5 }, { t: 'homing', n: 3, spd: 95, turn: 1.6, dmg: 15, cd: 2.5 }, { t: 'blink', dist: 130, n: 8, spd: 130, dmg: 14, cd: 2.2 }],
    rage: { mul: { n: 1.35, cd: 0.78 } } },
  bulga: { name: '철갑 코끼리', sub: '쇠를 두른 늪의 거상', spr: 'bulga', hp: 3800, spd: 44, dmg: 22, r: 36, move: 'chase', gold: 70,
    atk: [{ t: 'stomp', r: 125, delay: 1.0, dmg: 28, cd: 3.0, after: { t: 'spread', n: 5, ang: 0.8, spd: 190, dmg: 12, k: 'spike' } }],
    rage: { mul: { cd: 0.75 }, extra: { t: 'ring', n: 10, spd: 120, dmg: 10, k: 'spike' } } },
  imugi: { name: '이무기', sub: '용이 되지 못한 뱀', spr: 'imugi', hp: 30000, spd: 78, dmg: 15, r: 26, move: 'snake', segs: 14, segSpr: 'seg', gold: 200,
    atk: [{ t: 'spread', n: 5, ang: 0.8, spd: 150, dmg: 11, k: 'poison', cd: 2.8 }, { t: 'spread', n: 5, ang: 0.8, spd: 150, dmg: 11, k: 'poison', cd: 2.8 }, { t: 'charge', aim: 0.7, spd: 270, dur: 1.2, cd: 2.4 }],
    rage: { mul: { n: 1.4, cd: 0.8 } } },
  haetae: { name: '타락한 해태', sub: '시비를 가리던 신수', spr: 'haetae', hp: 5600, spd: 66, dmg: 18, r: 32, move: 'chase', gold: 90,
    atk: [{ t: 'dash', aim: 0.8, spd: 400, dur: 0.55, rest: 0.6, cd: 2.6 }, { t: 'ring', n: 14, spd: 120, dmg: 14, k: 'ice', cd: 2.2 }],
    rage: { mul: { n: 1.3, cd: 0.8 } } },
  baekho: { name: '백호', sub: '서쪽을 지키는 흰 범', spr: 'baekho', hp: 26000, spd: 80, dmg: 20, r: 32, move: 'chase', gold: 260,
    atk: [{ t: 'dash', aim: 0.7, spd: 470, dur: 0.45, rest: 0.3, cd: 0.4 }, { t: 'dash', aim: 0.6, spd: 470, dur: 0.45, rest: 0.6, cd: 1.6 }, { t: 'rain', n: 5, r: 46, delay: 1.0, dmg: 26, k: 'ice', cd: 2.4 }, { t: 'ring', n: 16, spd: 125, dmg: 14, k: 'ice', cd: 2.4 }],
    rage: { mul: { n: 1.4, cd: 0.8 } } },
  hwaseo: { name: '화서', sub: '불 속에 사는 쥐', spr: 'hwaseo', hp: 7000, spd: 80, dmg: 18, r: 26, move: 'chase', trail: { r: 26, life: 2.4, dmg: 6 }, gold: 110,
    atk: [{ t: 'spread', n: 7, ang: 1.2, spd: 200, dmg: 14, k: 'fire2', cd: 2.2 }, { t: 'dash', aim: 0.6, spd: 420, dur: 0.6, rest: 0.6, cd: 2.4 }],
    rage: { mul: { n: 1.3, cd: 0.8 } } },
  jujak: { name: '주작', sub: '남쪽을 지키는 붉은 새', spr: 'jujak', hp: 36000, spd: 100, dmg: 20, r: 34, move: 'fly', gold: 330,
    atk: [{ t: 'rain', n: 6, r: 50, delay: 1.0, dmg: 28, k: 'fire2', cd: 2.2 }, { t: 'spread', n: 9, ang: 1.4, spd: 210, dmg: 15, k: 'feather', cd: 2.0 }, { t: 'ring', n: 18, spd: 130, dmg: 14, k: 'fire2', cd: 2.4 }],
    rage: { mul: { n: 1.3, cd: 0.85 }, trail: { r: 28, life: 2.2, dmg: 7 } } },
  hyeonmu: { name: '현무', sub: '북쪽을 지키는 거북뱀', spr: 'hyeonmu', hp: 14000, spd: 38, dmg: 26, r: 42, move: 'chase', gold: 150,
    atk: [{ t: 'stomp', r: 150, delay: 1.1, dmg: 32, cd: 2.8, after: { t: 'ring', n: 16, spd: 130, dmg: 14, k: 'water' } }, { t: 'summon', type: 'dsnake', n: 8, cd: 2.4 }, { t: 'spread', n: 7, ang: 1.0, spd: 170, dmg: 14, k: 'water', cd: 2.4 }],
    rage: { mul: { n: 1.3, cd: 0.8 } } },
  cheongryong: { name: '청룡', sub: '마침내 승천한 용', spr: 'cheongryong', hp: 50000, spd: 92, dmg: 20, r: 30, move: 'snake', segs: 20, segSpr: 'segb', gold: 500,
    atk: [{ t: 'rain', n: 7, r: 44, delay: 0.9, dmg: 30, k: 'bolt', cd: 2.2 }, { t: 'spread', n: 7, ang: 1.0, spd: 180, dmg: 14, k: 'bolt2', cd: 2.2 }, { t: 'charge', aim: 0.6, spd: 300, dur: 1.2, cd: 2.0 }, { t: 'ring', n: 18, spd: 140, dmg: 14, k: 'bolt2', cd: 2.4 }],
    rage: { mul: { n: 1.35, cd: 0.8 } } },
};

/* ───── 챕터 ─────
   waves: [시작초, 초당 스폰, {종류:가중치}]
   events: 정해진 시각의 엘리트·포위·보스 */
const W = (base, mix) => [[0, 1.7 * base, mix[0]], [60, 2.5 * base, mix[1]], [120, 3.4 * base, mix[2]], [180, 4.2 * base, mix[3]], [240, 4.6 * base, mix[3]], [300, 5.0 * base, mix[4]], [420, 6.2 * base, mix[4]], [540, 7.6 * base, mix[5]], [600, 1.2, mix[0]]];
const EV = (ring1, ring2, ring3, elite, mid, fin) => [[150, 'ring', ring1, 22], [200, 'elite', elite], [300, 'boss', mid], [380, 'ring', ring2, 30], [450, 'elite', elite], [500, 'ring', ring3, 36], [530, 'elite', elite], [600, 'boss', fin]];
D.CHAPTERS = [
  { id: 1, name: '버려진 산골', sub: '좀비가 된 짐승들이 마을을 덮쳤다', theme: 'grass', hpMul: 1.15, dmgMul: 1.05, clearGold: 150, firstGold: 300,
    waves: W(1, [{ dog: 1 }, { dog: 3, crow: 2 }, { dog: 3, crow: 2, boar: 1 }, { dog: 3, crow: 3, boar: 2 }, { dog: 3, crow: 3, boar: 3 }, { dog: 3, crow: 4, boar: 4 }]),
    events: EV('crow', 'dog', 'crow', 'bear', 'tiger', 'fox') },
  { id: 2, name: '썩은 늪', sub: '늪 깊은 곳에서 무언가 꿈틀댄다', theme: 'swamp', hpMul: 1.4, dmgMul: 1.15, clearGold: 260, firstGold: 500,
    waves: W(0.95, [{ wolf: 2, bat: 1 }, { wolf: 3, bat: 2 }, { wolf: 3, bat: 3, snake: 1 }, { wolf: 3, bat: 3, snake: 2 }, { wolf: 3, bat: 3, snake: 3 }, { wolf: 3, bat: 4, snake: 4 }]),
    events: EV('bat', 'wolf', 'bat', 'buffalo', 'bulga', 'imugi') },
  { id: 3, name: '얼어붙은 고개', sub: '서쪽 고개에 흰 범의 울음이 들린다', theme: 'snow', hpMul: 1.6, dmgMul: 1.22, clearGold: 380, firstGold: 700,
    waves: W(1, [{ fwolf: 2, fcrow: 1 }, { fwolf: 3, fcrow: 2 }, { fwolf: 3, fcrow: 2, fboar: 1 }, { fwolf: 3, fcrow: 3, fboar: 2 }, { fwolf: 3, fcrow: 3, fboar: 3 }, { fwolf: 3, fcrow: 4, fboar: 4 }]),
    events: EV('fcrow', 'fwolf', 'fcrow', 'fbear', 'haetae', 'baekho') },
  { id: 4, name: '불타는 산사', sub: '남쪽 하늘이 붉게 물들었다', theme: 'ash', hpMul: 1.85, dmgMul: 1.3, clearGold: 520, firstGold: 900,
    waves: W(1.05, [{ hdog: 2, hbat: 1 }, { hdog: 3, hbat: 2 }, { hdog: 3, hbat: 2, hcrow: 1 }, { hdog: 3, hbat: 3, hcrow: 2 }, { hdog: 3, hbat: 3, hcrow: 3 }, { hdog: 3, hbat: 4, hcrow: 4 }]),
    events: EV('hbat', 'hdog', 'hcrow', 'hbuff', 'hwaseo', 'jujak') },
  { id: 5, name: '검은 바다', sub: '이무기가 승천한 바다, 마지막 싸움', theme: 'sea', hpMul: 2.1, dmgMul: 1.38, clearGold: 700, firstGold: 1500,
    waves: W(1.1, [{ dwolf: 2, dbat: 1 }, { dwolf: 3, dbat: 2 }, { dwolf: 3, dbat: 2, dsnake: 1 }, { dwolf: 3, dbat: 3, dsnake: 2 }, { dwolf: 3, dbat: 3, dsnake: 3 }, { dwolf: 3, dbat: 4, dsnake: 4 }]),
    events: EV('dbat', 'dwolf', 'dbat', 'dbear', 'hyeonmu', 'cheongryong') },
];
/* 어려움 난이도: 해당 챕터 보통 클리어 시 열림 */
D.HARD = { hpMul: 1.8, dmgMul: 1.45, spawnMul: 1.15, goldMul: 1.6, firstGold: 2 };
D.BOSS_TIME = 600;
D.ENEMY_CAP = 320;

/* 시간에 따른 적 강화: 10분에 체력 x6, 피해 x2.2 */
D.hpScale = t => 1 + Math.pow(Math.min(t, 600) / 600, 1.3) * 5;
D.dmgScale = t => 1 + Math.min(t, 600) / 600 * 1.2;
D.xpNeed = L => Math.round(5 + (L - 1) * 7 + Math.max(0, L - 15) * 6);

/* ───── 영구 강화(금화) ───── */
D.META = {
  atk:   { name: '기력', desc: '피해 +4%',           max: 5, per: 0.04, cost: [60, 120, 200, 300, 450] },
  hp:    { name: '체질', desc: '최대 체력 +6%',      max: 5, per: 0.06, cost: [60, 120, 200, 300, 450] },
  arm:   { name: '금강', desc: '받는 피해 -1',       max: 3, per: 1,    cost: [250, 600, 1200] },
  spd:   { name: '신법', desc: '이동 속도 +3%',      max: 5, per: 0.03, cost: [50, 100, 160, 240, 350] },
  mag:   { name: '흡인', desc: '구슬 흡수 범위 +10%', max: 5, per: 0.10, cost: [40, 80, 130, 200, 300] },
  xp:    { name: '오성', desc: '경험치 +5%',         max: 5, per: 0.05, cost: [70, 140, 230, 340, 500] },
  luck:  { name: '복덕', desc: '치명타 확률 +2%',     max: 5, per: 0.02, cost: [80, 160, 260, 380, 550] },
  greed: { name: '재물', desc: '금화 +8%',           max: 5, per: 0.08, cost: [100, 200, 350, 550, 800] },
  roll:  { name: '천운', desc: '다시 뽑기 +1회',     max: 3, per: 1,    cost: [150, 400, 900] },
  rev:   { name: '환생', desc: '광고 없이 부활 1회',  max: 1, per: 1,    cost: [2500] },
};

/* ───── 업적 ───── */
D.ACH = [
  { id: 'c1', name: '첫 퇴마', desc: '1장 클리어', gold: 200, test: s => s.clear[1] },
  { id: 'c2', name: '늪의 주인', desc: '2장 클리어', gold: 300, test: s => s.clear[2] },
  { id: 'c3', name: '흰 범 사냥', desc: '3장 클리어', gold: 450, test: s => s.clear[3] },
  { id: 'c4', name: '불새를 떨군 자', desc: '4장 클리어', gold: 600, test: s => s.clear[4] },
  { id: 'c5', name: '용을 넘어서', desc: '5장 클리어', gold: 1000, test: s => s.clear[5] },
  { id: 'h1', name: '산골의 악몽', desc: '1장 어려움 클리어', gold: 400, test: s => s.hclear[1] },
  { id: 'h2', name: '늪의 악몽', desc: '2장 어려움 클리어', gold: 600, test: s => s.hclear[2] },
  { id: 'h3', name: '고개의 악몽', desc: '3장 어려움 클리어', gold: 800, test: s => s.hclear[3] },
  { id: 'h4', name: '산사의 악몽', desc: '4장 어려움 클리어', gold: 1000, test: s => s.hclear[4] },
  { id: 'h5', name: '진정한 퇴마사', desc: '5장 어려움 클리어', gold: 2000, test: s => s.hclear[5] },
  { id: 'k1', name: '사냥꾼', desc: '누적 처치 1,000', gold: 100, test: s => s.stats.kills >= 1000 },
  { id: 'k2', name: '퇴마사', desc: '누적 처치 10,000', gold: 300, test: s => s.stats.kills >= 10000 },
  { id: 'k3', name: '백귀를 벤 자', desc: '누적 처치 50,000', gold: 800, test: s => s.stats.kills >= 50000 },
  { id: 'k4', name: '천귀를 벤 자', desc: '누적 처치 200,000', gold: 2000, test: s => s.stats.kills >= 200000 },
  { id: 'e1', name: '비급 입문', desc: '무기를 처음 진화', gold: 200, test: s => Object.keys(s.evo).length >= 1 },
  { id: 'e2', name: '비급 수집가', desc: '무기 5종 진화', gold: 500, test: s => Object.keys(s.evo).length >= 5 },
  { id: 'e3', name: '비급 완성', desc: '무기 10종 모두 진화', gold: 1500, test: s => Object.keys(s.evo).length >= 10 },
  { id: 'b1', name: '보스 사냥꾼', desc: '보스 10마리 처치', gold: 300, test: s => s.stats.bosses >= 10 },
  { id: 'b2', name: '신수 토벌', desc: '보스 50마리 처치', gold: 800, test: s => s.stats.bosses >= 50 },
  { id: 'l1', name: '득도', desc: '한 판에서 레벨 40 달성', gold: 400, test: s => s.stats.maxLv >= 40 },
  { id: 'n1', name: '불굴', desc: '부활 없이 3장 이상 클리어', gold: 500, test: s => s.stats.noRevClear >= 3 },
  { id: 'a1', name: '모두의 퇴마사', desc: '6명 모두로 1장 클리어', gold: 600, test: s => Object.keys(D.HEROES).every(h => s.heroClear[h]) },
  { id: 'g1', name: '부자', desc: '누적 금화 10,000 획득', gold: 500, test: s => s.stats.goldTotal >= 10000 },
  { id: 'r1', name: '꾸준함', desc: '30판 플레이', gold: 300, test: s => s.stats.runs >= 30 },
];

/* ───── 일일 임무 (매일 3개, 날짜로 정해짐) ───── */
D.DAILY = [
  { id: 'kill', txt: n => `몬스터 ${n.toLocaleString()}마리 처치`, n: [800, 1500, 2500], gold: [80, 120, 180] },
  { id: 'surv', txt: n => `한 판에서 ${n / 60}분 이상 생존`, n: [300, 420, 600], gold: [80, 120, 180] },
  { id: 'boss', txt: n => `보스 ${n}마리 처치`, n: [1, 2, 3], gold: [80, 120, 160] },
  { id: 'clear', txt: n => `아무 챕터나 ${n}번 클리어`, n: [1, 2], gold: [150, 250] },
  { id: 'gold', txt: n => `금화 ${n}개 모으기`, n: [150, 300, 500], gold: [60, 100, 150] },
  { id: 'lvl', txt: n => `한 판에서 레벨 ${n} 달성`, n: [20, 25, 30], gold: [80, 120, 160] },
  { id: 'runs', txt: n => `${n}판 플레이`, n: [2, 3, 5], gold: [60, 90, 140] },
  { id: 'evo', txt: n => `무기 ${n}번 진화`, n: [1, 2], gold: [150, 250] },
];
D.DAILY_BONUS = 150;
D.ATTEND = [50, 100, 150, 200, 250, 300, 600];

/* 랭킹 점수(서버와 같은 공식) */
D.score = (t, kills, mid, cleared, bossT) =>
  10 * Math.min(t, 600) + kills + (mid ? 1500 : 0) + (cleared ? 5000 + Math.max(0, 180 - bossT) * 20 : 0);

G.DATA = D;
if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
