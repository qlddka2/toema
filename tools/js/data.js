/* 퇴마 서바이벌 — 게임 데이터. 밸런스 숫자는 전부 여기서 고칩니다. */
(function (G) {
const D = {};
D.VERSION = '3.7.2';

/* ───── 주인공 ─────
   unlock: 해금 조건 (없으면 처음부터) */
D.HEROES = {
  daesung: { name: '대성', title: '하늘을 어지럽힌 원숭이 왕', cls: '근거리', hp: 130, armor: 2, speed: 100, weapon: 'staff', meleeMul: 1.2,
    desc: '여의봉을 크게 휘둘러 주변을 쓸어버립니다. 체력과 방어가 높아요.', trait: '근접 피해 +20%' },
  uchi: { name: '우치', title: '부적을 날리는 떠돌이 도사', cls: '원거리', hp: 110, armor: 1, speed: 106, weapon: 'talisman', cdMul: 0.95,
    desc: '가까운 적에게 부적을 날립니다. 발이 빠르고 술법이 빨라요.', trait: '공격 속도 +5%' },
  bari: { name: '바리', title: '저승길을 여는 무녀', cls: '지원', hp: 120, armor: 2, speed: 102, weapon: 'bell', regen: 0.8,
    desc: '방울 소리가 퍼지며 주변 적을 밀어내요. 스스로 상처를 치유합니다.', trait: '초당 체력 회복 +0.8', unlock: { k: 'clear', ch: 1, txt: '1장 클리어' } },
  gildong: { name: '길동', title: '바람처럼 사라지는 의적', cls: '기동', hp: 95, armor: 0, speed: 116, weapon: 'knives', goldMul: 1.2,
    desc: '가까운 적에게 비도를 부채꼴로 연달아 던져요. 가장 빠르고 금화를 더 줍습니다.', trait: '금화 +20%', unlock: { k: 'kills', n: 3000, txt: '누적 처치 3,000' } },
  gangrim: { name: '강림', title: '염라의 명을 받은 차사', cls: '술법', hp: 110, armor: 1, speed: 100, weapon: 'soulfire', xpMul: 1.1,
    desc: '혼불이 스스로 적을 쫓아가 터집니다. 성장이 빨라요.', trait: '경험치 +10%', unlock: { k: 'clear', ch: 2, txt: '2장 클리어' } },
  seolmun: { name: '설문', title: '섬을 빚은 거인 할망', cls: '수호', hp: 160, armor: 3, speed: 92, weapon: 'quake', areaMul: 1.15,
    desc: '땅을 울려 바위를 솟구치게 해요. 느리지만 가장 단단합니다.', trait: '공격 범위 +15%', unlock: { k: 'clear', ch: 3, txt: '3장 클리어' } },
  jungyeong: { name: '준경', title: '홀로 성을 무너뜨린 쌍검 무사', cls: '검객', hp: 112, armor: 1, speed: 108, weapon: 'twin', crit: 0.10,
    desc: '두 자루 검으로 가까운 적을 눈 깜짝할 새 여러 번 벱니다. 치명타가 잘 터지지만 몸은 약해요.', trait: '치명타 확률 +10%', unlock: { k: 'clear', ch: 4, txt: '4장 클리어' } },
  jacheongbi: { name: '자청비', title: '하늘 전쟁을 끝낸 여전사', cls: '궁수', hp: 100, armor: 0, speed: 108, weapon: 'bow', bowN: 1,
    desc: '가까운 적과 가장 단단한 적을 함께 노려 꿰뚫는 화살을 쏩니다. 멀리서 싸울수록 강해요.', trait: '화살 +1', unlock: { k: 'bosses', n: 15, txt: '우두머리 누적 처치 15' } },
  dudu: { name: '두두리', title: '장난을 좋아하는 도깨비', cls: '튕김', hp: 125, armor: 1, speed: 102, weapon: 'club', bounce: 1,
    desc: '방망이를 던지면 적과 적 사이를 튕겨 다녀요. 튼튼하고 무리 사냥에 강해요.', trait: '튕김 +1', unlock: { k: 'kills', n: 10000, txt: '누적 처치 10,000' } },
  musun: { name: '무선', title: '화약을 다스리는 장수', cls: '화기', hp: 115, armor: 2, speed: 98, weapon: 'hwacha', boom: 0.15,
    desc: '화차에서 불화살 로켓을 한꺼번에 쏘아 터뜨려요. 폭발이 넓습니다.', trait: '폭발 범위 +15%', unlock: { k: 'clear', ch: 5, txt: '5장 클리어' } },
  seolhwa: { name: '설화', title: '눈보라에서 태어난 정령', cls: '빙결', hp: 110, armor: 1, speed: 106, weapon: 'frost', frz: 0.2,
    desc: '서리 부적으로 주변을 얼려 적을 멈춰 세워요. 몸은 약하지만 적이 다가오지 못해요.', trait: '빙결 시간 +20%', unlock: { k: 'hclear', ch: 1, txt: '1장 어려움 클리어' } },
  yeonho: { name: '연호', title: '사람이 된 여우', cls: '흡수', hp: 105, armor: 1, speed: 110, weapon: 'foxbead', heal: 0.5,
    desc: '여우구슬이 적의 기운을 빨아들여 체력을 채워요. 빠르고 오래 버팁니다.', trait: '회복량 +50%', unlock: { k: 'runs', n: 25, txt: '25판 플레이' } },
  haemosu: { name: '해모수', title: '해를 타고 내려온 하늘의 아들', cls: '광선', hp: 120, armor: 2, speed: 102, weapon: 'feather', range: 0.2,
    desc: '삼족오 깃털로 일직선 광선을 쏘아 줄 선 적을 한 번에 꿰뚫어요.', trait: '사거리 +20%', unlock: { k: 'hclear', ch: 3, txt: '3장 어려움 클리어' } },
  cheonha: { name: '천하', title: '마을 어귀를 지키는 장승', cls: '방패', hp: 170, armor: 3, speed: 88, weapon: 'shield',
    desc: '등패가 몸 주위를 돌며 적을 치고 날아오는 탄을 막아요. 느리지만 쓰러지지 않아요.', trait: '방어 +2, 느림', unlock: { k: 'evo', n: 12, txt: '무기 12종 진화' } },
};

/* ───── 주인공 성장 (금화로 레벨업) ─────
   레벨마다 피해 +3%, 최대 체력 +4%. 5레벨·10레벨에 주인공 고유 특성이 열림.
   특성 mod: might 피해, area 범위, cd 공격 간격 감소, hp 최대 체력, armor 방어, regen 초당 회복, xp 경험치, gold 금화, crit 치명타, spd 이동 속도, startLv 시작 무기 레벨 */
D.HERO_LV = { max: 10, might: 0.03, hp: 0.04, cost: [200, 350, 550, 800, 1100, 1500, 2000, 2600, 3300] };
D.TALENT = {
  daesung: [{ lv: 5, name: '여의신통', desc: '공격 범위 +15%', mod: { area: 0.15 } }, { lv: 10, name: '제천대성', desc: '피해 +15%, 방어 +1', mod: { might: 0.15, armor: 1 } }],
  uchi:    [{ lv: 5, name: '속필', desc: '공격 속도 +8%', mod: { cd: 0.08 } }, { lv: 10, name: '도통', desc: '시작 무기 2레벨, 치명타 확률 +8%', mod: { startLv: 1, crit: 0.08 } }],
  bari:    [{ lv: 5, name: '생명수', desc: '초당 체력 회복 +0.5', mod: { regen: 0.5 } }, { lv: 10, name: '저승 길잡이', desc: '최대 체력 +20%, 방어 +1', mod: { hp: 0.2, armor: 1 } }],
  gildong: [{ lv: 5, name: '축지법', desc: '이동 속도 +10%', mod: { spd: 0.10 } }, { lv: 10, name: '활빈', desc: '금화 +20%, 치명타 확률 +5%', mod: { gold: 0.2, crit: 0.05 } }],
  gangrim: [{ lv: 5, name: '명부 열람', desc: '경험치 +10%', mod: { xp: 0.10 } }, { lv: 10, name: '저승차사', desc: '공격 속도 +10%, 피해 +5%', mod: { cd: 0.10, might: 0.05 } }],
  jungyeong: [{ lv: 5, name: '연환검', desc: '공격 속도 +8%', mod: { cd: 0.08 } }, { lv: 10, name: '만인적', desc: '치명타 피해 +50%, 피해 +5%', mod: { critDmg: 0.5, might: 0.05 } }],
  jacheongbi: [{ lv: 5, name: '천리 시위', desc: '투사체 속도·사거리 +15%', mod: { range: 0.15 } }, { lv: 10, name: '하늘의 화살', desc: '화살 +1, 피해 +10%', mod: { bowN: 1, might: 0.10 } }],
  seolmun: [{ lv: 5, name: '바위 피부', desc: '방어 +1, 최대 체력 +10%', mod: { armor: 1, hp: 0.1 } }, { lv: 10, name: '섬을 빚은 손', desc: '공격 범위 +15%, 피해 +10%', mod: { area: 0.15, might: 0.10 } }],
  dudu:    [{ lv: 5, name: '도깨비 장난', desc: '금화 +15%', mod: { gold: 0.15 } }, { lv: 10, name: '도깨비 왕', desc: '튕김 +1, 피해 +10%', mod: { bounce: 1, might: 0.10 } }],
  musun:   [{ lv: 5, name: '화약 개량', desc: '폭발 범위 +15%', mod: { boom: 0.15 } }, { lv: 10, name: '주화 장인', desc: '공격 속도 +10%, 피해 +5%', mod: { cd: 0.10, might: 0.05 } }],
  seolhwa: [{ lv: 5, name: '서리꽃', desc: '공격 범위 +10%', mod: { area: 0.10 } }, { lv: 10, name: '눈보라', desc: '빙결 시간 +20%, 피해 +10%', mod: { frz: 0.2, might: 0.10 } }],
  yeonho:  [{ lv: 5, name: '여우 홀림', desc: '이동 속도 +8%', mod: { spd: 0.08 } }, { lv: 10, name: '구미호 혈통', desc: '치명타 확률 +8%, 회복량 +30%', mod: { crit: 0.08, heal: 0.3 } }],
  haemosu: [{ lv: 5, name: '천손', desc: '경험치 +10%', mod: { xp: 0.10 } }, { lv: 10, name: '해의 아들', desc: '피해 +15%', mod: { might: 0.15 } }],
  cheonha: [{ lv: 5, name: '수호목', desc: '최대 체력 +15%', mod: { hp: 0.15 } }, { lv: 10, name: '천하대장군', desc: '방어 +2, 피해 +10%', mod: { armor: 2, might: 0.10 } }],
};
D.heroMods = (id, lv) => { const m = {}; for (const t of D.TALENT[id] || []) if (lv >= t.lv) for (const k in t.mod) m[k] = (m[k] || 0) + t.mod[k]; return m; };

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
      { dmg: 17, cd: 1.9, r: 115, kb: 240, slow: 0.2 },
      { dmg: 23, cd: 1.9, r: 125, kb: 260, slow: 0.2 },
      { dmg: 23, cd: 1.6, r: 140, kb: 280, slow: 0.3 },
      { dmg: 31, cd: 1.5, r: 155, kb: 300, slow: 0.3 },
      { dmg: 41, cd: 1.3, r: 170, kb: 340, slow: 0.4 } ],
    up: ['피해 +6, 범위 증가', '빨라짐, 둔화 증가', '피해 +8, 범위 증가', '피해 +10, 범위·빠르기 증가'],
    evo: { name: '천상무령', with: 'magnet', desc: '두 번 울리고 구슬까지 끌어와요', s: { dmg: 45, cd: 1.1, r: 215, kb: 400, slow: 0.5, twice: true } } },
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
  bow: { name: '신궁', icon: 'bow', desc: '가장 가까운 적과 가장 단단한 적을 노려 꿰뚫는 화살을 쏴요',
    lv: [
      { dmg: 28, cd: 1.1, n: 1, pierce: 2, spd: 640 },
      { dmg: 38, cd: 1.1, n: 1, pierce: 3, spd: 640 },
      { dmg: 38, cd: 1.0, n: 2, pierce: 3, spd: 680 },
      { dmg: 52, cd: 0.95, n: 2, pierce: 4, spd: 700 },
      { dmg: 66, cd: 0.85, n: 3, pierce: 5, spd: 720 } ],
    up: ['피해 +10, 관통 +1', '화살 +1, 빨라짐', '피해 +14, 관통 +1', '피해 +14, 화살 +1, 빨라짐'],
    evo: { name: '파천궁', with: 'farsight', desc: '하늘을 가르는 화살 4발이 끝없이 꿰뚫어요', s: { dmg: 100, cd: 0.8, n: 4, pierce: 99, spd: 820 } } },
  twin: { name: '쌍검', icon: 'twin', desc: '양손의 검으로 가장 가까운 적 쪽을 빠르게 연달아 베요 (이 무기는 치명타 확률 +10%)',
    lv: [
      { dmg: 11, cd: 0.62, n: 2, range: 62, arc: 100, crit: 0.10 },
      { dmg: 15, cd: 0.62, n: 2, range: 62, arc: 100, crit: 0.10 },
      { dmg: 15, cd: 0.56, n: 3, range: 66, arc: 110, crit: 0.12 },
      { dmg: 20, cd: 0.52, n: 3, range: 70, arc: 110, crit: 0.12 },
      { dmg: 26, cd: 0.48, n: 4, range: 74, arc: 120, crit: 0.15 } ],
    up: ['피해 +4', '베기 +1, 빨라짐', '피해 +5, 범위 증가', '피해 +6, 베기 +1, 빨라짐'],
    evo: { name: '쌍룡검', with: 'luck', desc: '검기가 앞뒤로 휘몰아치며 다섯 번 베어요 (치명타 확률 +20%)', s: { dmg: 34, cd: 0.42, n: 5, range: 92, arc: 140, crit: 0.20, back: true } } },
  gourd: { name: '호리병', icon: 'gourd', desc: '적이 몰린 곳에 소용돌이를 일으켜 빨아들여요',
    lv: [
      { dmg: 7, cd: 5.5, r: 70, dur: 2.2, pull: 70 },
      { dmg: 10, cd: 5.5, r: 75, dur: 2.2, pull: 75 },
      { dmg: 10, cd: 5.0, r: 85, dur: 2.6, pull: 85 },
      { dmg: 14, cd: 4.6, r: 95, dur: 2.8, pull: 90 },
      { dmg: 18, cd: 4.2, r: 105, dur: 3.0, pull: 100 } ],
    up: ['피해 +3', '범위 증가, 더 오래', '피해 +4, 빨라짐', '피해 +4, 범위 증가'],
    evo: { name: '자금홍호로', with: 'blood', desc: '거대한 소용돌이가 적을 삼킨 뒤 터뜨려요', s: { dmg: 24, cd: 3.6, r: 140, dur: 3.2, pull: 130, burst: 120 } } },
  /* ── v3.0 신규 12종 ── */
  hwando: { name: '환도', icon: 'hwando', desc: '칼을 던지면 멀리 날아갔다가 되돌아오며 두 번 베어요',
    lv: [
      { dmg: 16, cd: 1.4, n: 1, range: 170, spd: 360 },
      { dmg: 22, cd: 1.4, n: 1, range: 170, spd: 360 },
      { dmg: 22, cd: 1.3, n: 2, range: 180, spd: 370 },
      { dmg: 30, cd: 1.25, n: 2, range: 195, spd: 380 },
      { dmg: 38, cd: 1.15, n: 3, range: 205, spd: 390 } ],
    up: ['피해 +6', '칼 +1, 빨라짐', '피해 +8, 거리 증가', '피해 +8, 칼 +1'],
    evo: { name: '쌍월환도', with: 'swift', desc: '커다란 달빛 칼 네 자루가 사방으로 날았다 돌아와요', s: { dmg: 46, cd: 1.0, n: 4, range: 240, spd: 420, big: true } } },
  club: { name: '도깨비 방망이', icon: 'club', desc: '방망이가 적과 적 사이를 튕겨 다니며 때려요',
    lv: [
      { dmg: 20, cd: 1.2, n: 1, bounce: 3, spd: 440 },
      { dmg: 27, cd: 1.2, n: 1, bounce: 3, spd: 440 },
      { dmg: 27, cd: 1.1, n: 1, bounce: 4, spd: 460 },
      { dmg: 36, cd: 1.1, n: 1, bounce: 5, spd: 470 },
      { dmg: 45, cd: 1.0, n: 2, bounce: 6, spd: 480 } ],
    up: ['피해 +7', '튕김 +1, 빨라짐', '피해 +9, 튕김 +1', '피해 +9, 방망이 +1, 튕김 +1'],
    evo: { name: '금 나와라 뚝딱', with: 'might', desc: '방망이 3개가 8번씩 튕기고, 쓰러뜨린 적이 금화를 떨어뜨려요', s: { dmg: 56, cd: 0.85, n: 3, bounce: 8, spd: 520, coin: 0.08 } } },
  foxbead: { name: '여우구슬', icon: 'foxbead', desc: '구슬이 적을 쫓아가 기운을 빨아들여 체력을 채워요',
    lv: [
      { dmg: 14, cd: 1.2, n: 1, pierce: 2, spd: 240, heal: 0.5 },
      { dmg: 19, cd: 1.2, n: 1, pierce: 2, spd: 240, heal: 0.5 },
      { dmg: 19, cd: 1.1, n: 2, pierce: 2, spd: 250, heal: 0.5 },
      { dmg: 26, cd: 1.1, n: 2, pierce: 3, spd: 260, heal: 0.7 },
      { dmg: 32, cd: 1.0, n: 3, pierce: 3, spd: 270, heal: 0.7 } ],
    up: ['피해 +5', '구슬 +1, 빨라짐', '피해 +7, 관통 +1, 회복 증가', '피해 +6, 구슬 +1'],
    evo: { name: '구미호의 진주', with: 'blood', desc: '진주 5개가 적을 꿰뚫으며 체력을 크게 빨아들여요', s: { dmg: 40, cd: 0.9, n: 5, pierce: 4, spd: 300, heal: 1.0 } } },
  sinjang: { name: '신장 부적', icon: 'sinjang', desc: '부적에서 수호 신장이 나와 잠시 함께 싸워요',
    lv: [
      { dmg: 14, cd: 8, n: 1, dur: 6, r: 34 },
      { dmg: 19, cd: 8, n: 1, dur: 6, r: 34 },
      { dmg: 19, cd: 7.5, n: 2, dur: 6, r: 36 },
      { dmg: 25, cd: 7.5, n: 2, dur: 7, r: 38 },
      { dmg: 31, cd: 7, n: 3, dur: 7, r: 40 } ],
    up: ['피해 +5', '신장 +1, 빨라짐', '피해 +6, 더 오래', '피해 +6, 신장 +1'],
    evo: { name: '사천왕', with: 'essence', desc: '사방을 지키는 신장 넷이 거의 쉬지 않고 싸워요', s: { dmg: 42, cd: 6, n: 4, dur: 7, r: 46, big: true } } },
  jeung: { name: '제웅', icon: 'jeung', desc: '적에게 저주 표식을 붙여요. 표식이 붙은 적은 더 아프고, 쓰러지면 표식이 옆 적에게 옮아가요',
    lv: [
      { cd: 3, n: 2, amp: 0.15, dmg: 6, dur: 5, burst: 14 },
      { cd: 3, n: 2, amp: 0.15, dmg: 9, dur: 5, burst: 20 },
      { cd: 2.8, n: 3, amp: 0.20, dmg: 9, dur: 5, burst: 20 },
      { cd: 2.8, n: 4, amp: 0.20, dmg: 13, dur: 6, burst: 28 },
      { cd: 2.6, n: 5, amp: 0.25, dmg: 18, dur: 6, burst: 36 } ],
    up: ['저주 피해 증가', '표식 +1, 더 아프게', '표식 +1, 저주 피해 증가', '표식 +1, 더 아프게'],
    evo: { name: '만귀 저주', with: 'focus', desc: '표식이 쓰러질 때마다 둘로 번지며 터져요', s: { cd: 2.4, n: 8, amp: 0.35, dmg: 24, dur: 6, burst: 50, spread: 2 } } },
  chain: { name: '번개 사슬', icon: 'chain', desc: '번개가 가까운 적부터 차례로 옮겨 붙어요',
    lv: [
      { dmg: 20, cd: 1.5, n: 1, chain: 3 },
      { dmg: 26, cd: 1.5, n: 1, chain: 3 },
      { dmg: 26, cd: 1.4, n: 1, chain: 5 },
      { dmg: 34, cd: 1.4, n: 1, chain: 6 },
      { dmg: 42, cd: 1.25, n: 2, chain: 7 } ],
    up: ['피해 +6', '연쇄 +2, 빨라짐', '피해 +8, 연쇄 +1', '피해 +8, 사슬 +1, 연쇄 +1'],
    evo: { name: '뇌정 연쇄', with: 'luck', desc: '사슬 셋이 열두 번씩 옮겨 붙으며 적을 잠시 굳혀요', s: { dmg: 52, cd: 1.0, n: 3, chain: 12, stun: 0.3 } } },
  frost: { name: '설한부', icon: 'frost', desc: '주변에 냉기가 터져 적을 얼려 멈춰 세워요',
    lv: [
      { dmg: 20, cd: 3.2, r: 130, frz: 1.2 },
      { dmg: 27, cd: 3.2, r: 135, frz: 1.2 },
      { dmg: 27, cd: 2.9, r: 150, frz: 1.4 },
      { dmg: 36, cd: 2.9, r: 165, frz: 1.4 },
      { dmg: 48, cd: 2.6, r: 180, frz: 1.7 } ],
    up: ['피해 +7', '범위 증가, 빨라짐, 더 오래 얼림', '피해 +9, 범위 증가', '피해 +12, 범위 증가, 더 오래 얼림'],
    evo: { name: '한빙지옥', with: 'guard', desc: '거대한 냉기가 터지고 얼음 조각이 사방으로 튀어요', s: { dmg: 62, cd: 2.3, r: 220, frz: 2.2, shards: 12 } } },
  hwacha: { name: '화차', icon: 'hwacha', desc: '불화살 로켓을 한꺼번에 쏘아 맞은 자리를 터뜨려요',
    lv: [
      { dmg: 10, cd: 1.8, n: 4, r: 26, spd: 380 },
      { dmg: 13, cd: 1.8, n: 5, r: 26, spd: 380 },
      { dmg: 13, cd: 1.6, n: 6, r: 28, spd: 390 },
      { dmg: 17, cd: 1.6, n: 7, r: 30, spd: 400 },
      { dmg: 21, cd: 1.4, n: 9, r: 32, spd: 410 } ],
    up: ['로켓 +1, 피해 +3', '로켓 +1, 빨라짐', '로켓 +1, 피해 +4, 폭발 증가', '로켓 +2, 피해 +4, 빨라짐'],
    evo: { name: '신기전', with: 'clone', desc: '로켓 14발이 하늘을 덮으며 쏟아져요', s: { dmg: 26, cd: 1.2, n: 14, r: 36, spd: 440 } } },
  bomb: { name: '비격진천뢰', icon: 'bomb', desc: '적이 몰린 곳에 폭탄을 던져요. 잠시 뒤 크게 터져요',
    lv: [
      { dmg: 60, cd: 3.2, n: 1, r: 80, fuse: 1.0 },
      { dmg: 80, cd: 3.2, n: 1, r: 80, fuse: 1.0 },
      { dmg: 80, cd: 2.9, n: 2, r: 84, fuse: 1.0 },
      { dmg: 105, cd: 2.9, n: 2, r: 92, fuse: 0.95 },
      { dmg: 130, cd: 2.7, n: 3, r: 100, fuse: 0.9 } ],
    up: ['피해 +20', '폭탄 +1, 빨라짐', '피해 +25, 폭발 증가', '피해 +25, 폭탄 +1'],
    evo: { name: '진천뢰 연폭', with: 'dur', desc: '터진 자리에서 작은 폭탄 셋이 연달아 터져요', s: { dmg: 150, cd: 2.4, n: 3, r: 112, fuse: 0.85, chain: 3 } } },
  feather: { name: '삼족오 깃털', icon: 'feather', desc: '해의 빛줄기가 일직선으로 뻗어 줄 선 적을 모두 꿰뚫어요',
    lv: [
      { dmg: 34, cd: 2.0, n: 1, len: 300, w: 20 },
      { dmg: 46, cd: 2.0, n: 1, len: 300, w: 20 },
      { dmg: 46, cd: 1.8, n: 1, len: 320, w: 26 },
      { dmg: 62, cd: 1.8, n: 1, len: 340, w: 26 },
      { dmg: 78, cd: 1.6, n: 2, len: 360, w: 30 } ],
    up: ['피해 +12', '굵어짐, 길어짐, 빨라짐', '피해 +16, 길어짐', '피해 +16, 빛줄기 +1'],
    evo: { name: '금오 일격', with: 'farsight', desc: '세 줄기의 거대한 금빛 광선이 화면을 가로질러요', s: { dmg: 90, cd: 1.5, n: 3, len: 480, w: 40 } } },
  water: { name: '정화수', icon: 'water', desc: '지나간 자리에 맑은 물이 고여 적을 느리게 하고 피해를 줘요',
    lv: [
      { dmg: 6, cd: 0.5, r: 30, life: 2.5, slow: 0.3 },
      { dmg: 8, cd: 0.5, r: 30, life: 2.5, slow: 0.3 },
      { dmg: 8, cd: 0.45, r: 36, life: 3.0, slow: 0.35 },
      { dmg: 11, cd: 0.45, r: 38, life: 3.0, slow: 0.35 },
      { dmg: 14, cd: 0.4, r: 42, life: 3.5, slow: 0.4 } ],
    up: ['피해 +2', '웅덩이 커짐, 더 오래', '피해 +3', '피해 +3, 웅덩이 커짐, 더 오래'],
    evo: { name: '감로수', with: 'regen', desc: '웅덩이가 넓어지고, 그 위에 서 있으면 체력이 차올라요', s: { dmg: 18, cd: 0.4, r: 52, life: 4.0, slow: 0.45, heal: 2 } } },
  shield: { name: '등패', icon: 'shield', desc: '방패가 몸 주위를 돌며 적을 치고 날아오는 탄을 막아요',
    lv: [
      { dmg: 17, n: 1, rad: 50, rot: 2.6, hitcd: 0.5, kb: 60 },
      { dmg: 23, n: 1, rad: 50, rot: 2.6, hitcd: 0.5, kb: 60 },
      { dmg: 23, n: 2, rad: 54, rot: 2.8, hitcd: 0.45, kb: 70 },
      { dmg: 31, n: 2, rad: 58, rot: 3.0, hitcd: 0.45, kb: 80 },
      { dmg: 39, n: 3, rad: 62, rot: 3.2, hitcd: 0.4, kb: 90 } ],
    up: ['피해 +6', '방패 +1, 빨라짐', '피해 +8, 반경 증가', '피해 +8, 방패 +1'],
    evo: { name: '천하대장군', with: 'armor', desc: '큰 방패 넷이 돌며 막은 탄을 되받아쳐요', s: { dmg: 55, n: 4, rad: 68, rot: 3.4, hitcd: 0.35, kb: 120, big: true, reflect: true } } },
};
/* ───── 합격기: 진화한 두 무기를 함께 가진 채 보물 상자를 열면 하나로 합쳐짐 (칸 하나가 비어요) ───── */
D.UNIONS = {
  u_thunder: { name: '뇌정부', a: 'talisman', b: 'thunder', desc: '부적 8장이 꿰뚫고, 맞은 자리마다 벼락이 떨어져요',
    s: { dmg: 30, cd: 0.45, n: 8, pierce: 99, spd: 420, bolt: 40, br: 50 } },
  u_soul: { name: '백귀흡혼', a: 'soulfire', b: 'gourd', desc: '거대한 소용돌이가 적을 삼키며 혼불을 쉬지 않고 뿜어내요',
    s: { dmg: 28, cd: 3.5, r: 160, dur: 4, pull: 150, burst: 160, soul: 36, sr: 46 } },
  u_hwacha: { name: '신기전 대일제사', a: 'bow', b: 'hwacha', desc: '불화살 스무 발이 쏟아져 꿰뚫으며 터져요',
    s: { dmg: 40, cd: 1.0, n: 20, r: 34, spd: 560, pierce: 4 } },
  u_sword: { name: '칠성검무', a: 'twin', b: 'hwando', desc: '칠성검 일곱 자루가 사방으로 날았다 돌아오며 베어요',
    s: { dmg: 60, cd: 1.0, n: 7, range: 260, spd: 440, big: true } },
  u_bell: { name: '천상결계', a: 'bell', b: 'aura', desc: '넓은 금빛 결계 속에서 방울이 쉬지 않고 울려요. 적을 쓰러뜨리면 회복해요',
    s: { dmg: 22, tick: 0.3, r: 150, slow: 0.45, heal: 0.6, wcd: 1.0, wdmg: 50, wr: 240, kb: 420 } },
  u_quake: { name: '천근추', a: 'staff', b: 'quake', desc: '금고봉으로 땅을 내려찍어 사방을 휩쓸고 바위를 솟구치게 해요',
    s: { dmg: 80, cd: 1.2, range: 150, kb: 160, rock: 60, n: 16, r: 46, stun: 1.0 } },
};
for (const k in D.UNIONS) { const u = D.UNIONS[k]; D.WEAPONS[k] = { name: u.name, icon: k, desc: u.desc, union: [u.a, u.b], lv: [u.s], up: [], evo: { name: u.name, with: null, desc: u.desc, s: u.s } }; }
D.isUnion = id => !!(D.WEAPONS[id] && D.WEAPONS[id].union);

/* ───── 패시브 (레벨당) ───── */
D.PASSIVES = {
  might:  { name: '근력', icon: 'might',  desc: '모든 피해 +10%',          per: 0.10 },
  haste:  { name: '단전', icon: 'haste',  desc: '공격 속도 +7%',            per: 0.07 },
  vigor:  { name: '체력', icon: 'vigor',  desc: '최대 체력 +15%',           per: 0.15 },
  swift:  { name: '경공', icon: 'swift',  desc: '이동 속도 +8%',            per: 0.08 },
  magnet: { name: '흡기', icon: 'magnet', desc: '구슬 흡수 범위 +30%',      per: 0.30 },
  regen:  { name: '회춘', icon: 'regen',  desc: '초당 체력 회복 +0.4',       per: 0.4 },
  armor:  { name: '철갑', icon: 'armor',  desc: '방어 +1',             per: 1 },
  luck:   { name: '행운', icon: 'luck',   desc: '치명타 확률 +6%',          per: 0.06 },
  farsight: { name: '천리안', icon: 'eye', desc: '투사체 속도·사거리 +12%',  per: 0.12 },
  blood:  { name: '혈기', icon: 'blood',  desc: '적을 처치할 때마다 체력 +0.25', per: 0.25 },
  clone:  { name: '분신술', icon: 'clone', desc: '공격 개수 +1 (4레벨에서 +2), 피해 +2%', per: 0.02 },
  focus:  { name: '집중', icon: 'focus', desc: '치명타 피해 +15%',          per: 0.15 },
  dur:    { name: '지속', icon: 'dur',   desc: '효과 지속 시간 +12%',        per: 0.12 },
  guard:  { name: '수호령', icon: 'guard', desc: '주기적으로 피해를 한 번 막는 보호막 (레벨마다 더 자주)', per: 1.5 },
  essence:{ name: '정기', icon: 'essence', desc: '경험치 +8%',              per: 0.08 },
  fortune:{ name: '재물운', icon: 'fortune', desc: '금화 +8%, 적이 보물 상자를 떨어뜨리기도 해요', per: 0.08 },
};
D.GUARD_CD = lv => 13 - 1.5 * lv;   // 수호령 보호막 재충전 (초)
/* 세트 효과: 같은 계열 무기를 함께 들면 보너스 (진화한 무기도 그대로 셈) */
D.SETS = {
  dosul:  { name: '도술', color: '#7fd8ff', ws: ['talisman', 'thunder', 'soulfire', 'gourd', 'chain', 'frost'],
            b: [{ n: 2, desc: '공격 속도 +8%', cd: 0.08 }, { n: 3, desc: '치명타 확률 +10%', crit: 0.10 }, { n: 4, desc: '피해 +15%', might: 0.15 }] },
  muye:   { name: '무예', color: '#ff9a6b', ws: ['staff', 'knives', 'quake', 'bow', 'twin', 'hwando'],
            b: [{ n: 2, desc: '피해 +10%', might: 0.10 }, { n: 3, desc: '넉백 +50%, 치명타 피해 +50%', kb: 0.5, critDmg: 0.5 }, { n: 4, desc: '공격 속도 +10%', cd: 0.10 }] },
  beopgu: { name: '법구', color: '#c9a7ff', ws: ['beads', 'aura', 'bell', 'fan', 'water', 'shield'],
            b: [{ n: 2, desc: '공격 범위 +10%', area: 0.10 }, { n: 3, desc: '초당 체력 회복 +1', regen: 1 }, { n: 4, desc: '받는 피해 -15%', guardDmg: 0.15 }] },
  gwimul: { name: '귀물', color: '#9be36b', ws: ['club', 'foxbead', 'sinjang', 'jeung'],
            b: [{ n: 2, desc: '경험치 +10%', xp: 0.10 }, { n: 3, desc: '적을 처치할 때마다 체력 +0.3', onKill: 0.3 }, { n: 4, desc: '피해 +15%', might: 0.15 }] },
  hwagi:  { name: '화기', color: '#ffcf4a', ws: ['hwacha', 'bomb', 'feather'],
            b: [{ n: 2, desc: '폭발 범위 +20%', boom: 0.20 }, { n: 3, desc: '피해 +15%, 공격 속도 +5%', might: 0.15, cd: 0.05 }] },
};
D.SET_OF = {}; for (const k in D.SETS) for (const w of D.SETS[k].ws) D.SET_OF[w] = k;
for (const k in D.UNIONS) D.SET_OF[k] = null;   // 합격기는 두 재료 무기의 세트에 모두 들어감 (core.recalc)
/* ───── 유물: 우두머리를 쓰러뜨리면 3개 중 하나 (한 판 최대 3개) ───── */
D.RELICS = {
  thunder: { name: '뇌령주',     icon: 'r_thunder', desc: '맞을 때마다 주변 적에게 낙뢰가 떨어져요' },
  coin:    { name: '저승 노잣돈', icon: 'r_coin',    desc: '금화 +40%, 받는 피해 +10%' },
  herb:    { name: '불사초',     icon: 'r_herb',    desc: '한 번 쓰러져도 체력 40%로 일어나요' },
  mirror:  { name: '흑요 거울',   icon: 'r_mirror',  desc: '치명타 확률 +10%, 치명타 피해 +30%' },
  bell:    { name: '산신의 방울', icon: 'r_bell',    desc: '20초마다 주변 적을 2초간 기절시켜요' },
  scale:   { name: '용의 비늘',   icon: 'r_scale',   desc: '우두머리에게 주는 피해 +30%' },
  shoes:   { name: '바람 신발',   icon: 'r_shoes',   desc: '이동 속도 +15%, 흡수 범위 +40%' },
  hat:     { name: '도깨비 감투', icon: 'r_hat',     desc: '맞은 뒤 0.8초 동안 무적' },
  sword:   { name: '칠성검',     icon: 'r_sword',   desc: '치명타가 터지면 가끔 그 자리에 벼락이 떨어져요' },
  horn:    { name: '해태 뿔',     icon: 'r_horn',    desc: '큰 피해를 한 번 막아요. 우두머리를 쓰러뜨리면 다시 채워져요' },
  pouch:   { name: '복주머니',    icon: 'r_pouch',   desc: '보물 상자 선택지 +1' },
  bronze:  { name: '청동 거울',   icon: 'r_bronze',  desc: '날아온 탄의 30%를 튕겨 돌려보내요' },
  ledger:  { name: '염라 장부',   icon: 'r_ledger',  desc: '이번 판 처치 1,000마다 피해 +4% (최대 +40%)' },
  ginseng: { name: '산삼',       icon: 'r_ginseng', desc: '최대 체력 +20%, 회복량 +30%' },
  thread:  { name: '삼신할미 실', icon: 'r_thread',  desc: '다시 일어설 때 3초 무적 + 주변을 크게 터뜨려요' },
  jangseung: { name: '장승 목각', icon: 'r_jangseung', desc: '멈춰 서 있으면 방어 +3' },
};
D.MAX_RELIC = 3;
/* ───── 진(眞) 각성: 주인공의 시작 무기를 진화시킨 뒤 25레벨 이상에서 보물 상자를 열면 (그 주인공 전용) ───── */
D.JIN = { dmg: 1.5, cd: 0.85, scale: 1.15, minLv: 25, desc: '주인 전용 2차 각성 · 피해 +50%, 공격 속도 +15%, 개수·범위 증가' };
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
/* 잡몹 겉모습: 행동·능력치는 그 종류 그대로, 그림만 여러 가지 중 무작위로 (이름은 도감·경고 문구용)
   [그림, 이름, 덧칠] — 덧칠을 생략하면 원래 색 그대로 */
D.SKINS = {
  dog:    [['dog', '좀비 들개'], ['m_jackal', '좀비 승냥이'], ['m_rabbit', '뿔 토끼'], ['m_rat', '역병 쥐']],
  crow:   [['crow', '좀비 까마귀'], ['m_crow2', '송장 까마귀']],
  boar:   [['boar', '좀비 멧돼지'], ['m_boar2', '썩은 멧돼지']],
  bear:   [['bear', '좀비 곰'], ['m_bear2', '사슬 묶인 곰']],
  wolf:   [['wolf', '좀비 늑대'], ['m_fox', '좀비 여우'], ['m_weasel', '좀비 족제비'], ['m_tanuki', '좀비 너구리']],
  bat:    [['bat', '좀비 박쥐'], ['m_bat2', '흡혈 박쥐']],
  snake:  [['snake', '좀비 뱀'], ['m_cobra', '독사'], ['m_centi', '왕지네']],
  fwolf:  [['wolf', '서리 늑대', 'frost'], ['m_deer', '좀비 사슴'], ['m_wildcat', '좀비 살쾡이'], ['m_lcat', '좀비 삵']],
  fcrow:  [['crow', '얼음 까마귀', 'frost'], ['m_crow2', '송장 까마귀', 'frost']],
  fboar:  [['boar', '얼어붙은 멧돼지', 'frost'], ['m_goat', '좀비 염소']],
  fbear:  [['bear', '서리 곰', 'frost'], ['m_bear2', '사슬 묶인 곰', 'frost']],
  hdog:   [['dog', '불붙은 들개', 'fire'], ['m_rat', '역병 쥐'], ['m_hedgehog', '가시 고슴도치'], ['m_tanuki', '좀비 너구리']],
  hbat:   [['bat', '불박쥐', 'fire'], ['m_bat2', '흡혈 박쥐']],
  hcrow:  [['crow', '불까마귀', 'fire'], ['m_crow2', '송장 까마귀']],
  dsnake: [['snake', '물귀신 뱀', 'sea'], ['m_cobra', '독사'], ['m_centi', '왕지네'], ['m_spider', '독거미']],
  dwolf:  [['wolf', '물에 잠긴 늑대', 'sea'], ['m_otter', '좀비 수달'], ['m_toad', '독두꺼비'], ['m_weasel', '좀비 족제비']],
  dbat:   [['bat', '바다 박쥐', 'sea'], ['m_bat2', '흡혈 박쥐']],
  dbear:  [['bear', '익사한 곰', 'sea'], ['m_bear2', '사슬 묶인 곰', 'sea']],
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
  /* ── 백귀야행 전용 (v3.6) ── 중간 우두머리 4 + 최종 우두머리 4 */
  geuseundae: { name: '그슨대', sub: '어둠 속에서 자라나는 그림자', spr: 'geuseundae', hp: 5200, spd: 58, dmg: 18, r: 32, move: 'keep', gold: 80, night: true,
    atk: [{ t: 'rain', n: 5, r: 54, delay: 1.2, dmg: 24, k: 'shadow', pool: { life: 3.5, dmg: 7 }, cd: 2.2 }, { t: 'blink', dist: 150, n: 10, spd: 125, dmg: 13, k: 'shadow', cd: 2.4 }],
    rage: { mul: { n: 1.4, cd: 0.8 } } },
  eoduksini: { name: '어둑시니', sub: '쳐다볼수록 커지는 어둠', spr: 'eoduksini', hp: 7000, spd: 52, dmg: 20, r: 34, move: 'chase', gold: 100, night: true,
    atk: [{ t: 'ring', n: 12, spd: 115, dmg: 14, k: 'shadow', cd: 2.4 }, { t: 'homing', n: 2, spd: 90, turn: 1.4, dmg: 15, cd: 2.4 }],
    rage: { split: 2, mul: { cd: 0.85 } } },
  jangsanbeom: { name: '장산범', sub: '사람 목소리를 흉내 내는 흰 짐승', spr: 'jangsanbeom', hp: 8400, spd: 84, dmg: 20, r: 32, move: 'chase', gold: 120, night: true,
    atk: [{ t: 'ambush', r: 76, dmg: 28, fake: 1, cd: 0.6 }, { t: 'dash', aim: 0.8, spd: 440, dur: 0.5, rest: 0.6, cd: 1.8 }],
    rage: { mul: { cd: 0.85 }, atk: [{ t: 'ambush', r: 80, dmg: 28, fake: 2, cd: 0.6 }, { t: 'dash', aim: 0.7, spd: 460, dur: 0.5, rest: 0.5, cd: 1.4 }, { t: 'ambush', r: 80, dmg: 28, fake: 2, cd: 0.6 }, { t: 'dash', aim: 0.7, spd: 460, dur: 0.5, rest: 0.5, cd: 1.6 }] } },
  songaksi: { name: '손각시', sub: '시집 못 간 처녀의 한', spr: 'songaksi', hp: 13000, spd: 56, dmg: 18, r: 28, move: 'keep', gold: 160, night: true,
    atk: [{ t: 'wall', w: 560, gap: 110, spd: 95, dmg: 13, k: 'ghost', cd: 2.8 }, { t: 'homing', n: 2, spd: 90, turn: 1.5, dmg: 13, cd: 2.4 }, { t: 'ring', n: 12, spd: 115, dmg: 12, k: 'ghost', cd: 2.4 }],
    rage: { mul: { n: 1.35, cd: 0.8 } } },
  gangcheori: { name: '강철이', sub: '지나간 자리마다 가뭄이 드는 불의 용마', spr: 'gangcheori', hp: 38000, spd: 74, dmg: 22, r: 34, move: 'chase', gold: 360, night: true, trail: { r: 22, life: 2.4, dmg: 6 },
    atk: [{ t: 'breath', ang: 1.0, n: 9, waves: 4, spd: 230, dmg: 13, k: 'fire2', cd: 2.2 }, { t: 'dash', aim: 0.7, spd: 440, dur: 0.6, rest: 0.6, cd: 1.8, after: { t: 'ring', n: 10, spd: 125, dmg: 12, k: 'fire2' } }],
    rage: { mul: { n: 1.25, cd: 0.85 }, trail: { r: 28, life: 3.2, dmg: 8 } } },
  dueoksini: { name: '두억시니', sub: '머리를 짓누르는 사나운 귀신', spr: 'dueoksini', hp: 60000, spd: 58, dmg: 26, r: 38, move: 'chase', gold: 380, night: true,
    atk: [{ t: 'slam', len: 360, w: 70, delay: 0.9, dmg: 34, cd: 1.6, after: { t: 'spread', n: 7, ang: 0.9, spd: 180, dmg: 13, k: 'spike' } }, { t: 'stomp', r: 150, delay: 1.0, dmg: 32, cd: 2.0, after: { t: 'ring', n: 16, spd: 130, dmg: 13, k: 'spike' } }, { t: 'summon', type: 'hdog', n: 12, cd: 2.0 }],
    rage: { mul: { n: 1.3, cd: 0.8 }, extra: { t: 'ring', n: 10, spd: 120, dmg: 11, k: 'spike' } } },
  samdugumi: { name: '삼두구미', sub: '머리 셋, 꼬리 아홉의 땅속 괴물', spr: 'samdugumi', hp: 50000, spd: 78, dmg: 22, r: 36, move: 'chase', gold: 400, night: true,
    atk: [{ t: 'tri', n: 4, ang: 0.45, spd: 175, dmg: 14, k: 'shadow', waves: 3, cd: 1.6 }, { t: 'sweep', arms: 3, dur: 2.0, rate: 0.09, spd: 150, dmg: 12, k: 'shadow', cd: 2.0 }, { t: 'dash', aim: 0.6, spd: 460, dur: 0.5, rest: 0.6, cd: 1.8 }],
    rage: { mul: { n: 1.3, cd: 0.8 } } },
  yeomra: { name: '염라대왕', sub: '저승의 심판관', spr: 'yeomra', hp: 64000, spd: 60, dmg: 24, r: 34, move: 'keep', gold: 450, night: true,
    atk: [{ t: 'judge', r: 100, delay: 1.05, gap: 0.9, dmg: 32, k: 'ghost', cd: 2.6 }, { t: 'summon', type: 'dbat', n: 10, cd: 2.0 }, { t: 'ring', n: 18, spd: 130, dmg: 14, k: 'ghost', cd: 2.2 }],
    rage: { mul: { n: 1.3, cd: 0.8 }, extra: { t: 'homing', n: 2, spd: 95, turn: 1.6, dmg: 14 } } },
};

/* ───── 챕터 ─────
   waves: [시작초, 초당 스폰, {종류:가중치}]
   events: 정해진 시각의 엘리트·포위·보스 */
const W = (base, mix) => [[0, 1.7 * base, mix[0]], [60, 2.5 * base, mix[1]], [120, 3.4 * base, mix[2]], [180, 4.2 * base, mix[3]], [240, 4.6 * base, mix[3]], [300, 5.0 * base, mix[4]], [420, 6.2 * base, mix[4]], [540, 7.6 * base, mix[5]], [600, 1.2, mix[0]]];
const EV = (ring1, ring2, ring3, elite, mid, fin) => [[150, 'ring', ring1, 22], [200, 'elite', elite], [300, 'boss', mid], [380, 'ring', ring2, 30], [450, 'elite', elite], [500, 'ring', ring3, 36], [530, 'elite', elite], [600, 'boss', fin]];
D.CHAPTERS = [
  { id: 1, name: '버려진 산골', sub: '좀비가 된 짐승들이 마을을 덮쳤다', theme: 'grass', hpMul: 1.15, dmgMul: 1.05, clearGold: 110, firstGold: 300,
    waves: W(1, [{ dog: 1 }, { dog: 3, crow: 2 }, { dog: 3, crow: 2, boar: 1 }, { dog: 3, crow: 3, boar: 2 }, { dog: 3, crow: 3, boar: 3 }, { dog: 3, crow: 4, boar: 4 }]),
    events: EV('crow', 'dog', 'crow', 'bear', 'tiger', 'fox') },
  { id: 2, name: '썩은 늪', sub: '늪 깊은 곳에서 무언가 꿈틀댄다', theme: 'swamp', hpMul: 1.4, dmgMul: 1.15, clearGold: 200, firstGold: 500,
    waves: W(0.95, [{ wolf: 2, bat: 1 }, { wolf: 3, bat: 2 }, { wolf: 3, bat: 3, snake: 1 }, { wolf: 3, bat: 3, snake: 2 }, { wolf: 3, bat: 3, snake: 3 }, { wolf: 3, bat: 4, snake: 4 }]),
    events: EV('bat', 'wolf', 'bat', 'buffalo', 'bulga', 'imugi') },
  { id: 3, name: '얼어붙은 고개', sub: '서쪽 고개에 흰 범의 울음이 들린다', theme: 'snow', hpMul: 1.6, dmgMul: 1.22, clearGold: 290, firstGold: 700,
    waves: W(1, [{ fwolf: 2, fcrow: 1 }, { fwolf: 3, fcrow: 2 }, { fwolf: 3, fcrow: 2, fboar: 1 }, { fwolf: 3, fcrow: 3, fboar: 2 }, { fwolf: 3, fcrow: 3, fboar: 3 }, { fwolf: 3, fcrow: 4, fboar: 4 }]),
    events: EV('fcrow', 'fwolf', 'fcrow', 'fbear', 'haetae', 'baekho') },
  { id: 4, name: '불타는 산사', sub: '남쪽 하늘이 붉게 물들었다', theme: 'ash', hpMul: 1.85, dmgMul: 1.3, clearGold: 390, firstGold: 900,
    waves: W(1.05, [{ hdog: 2, hbat: 1 }, { hdog: 3, hbat: 2 }, { hdog: 3, hbat: 2, hcrow: 1 }, { hdog: 3, hbat: 3, hcrow: 2 }, { hdog: 3, hbat: 3, hcrow: 3 }, { hdog: 3, hbat: 4, hcrow: 4 }]),
    events: EV('hbat', 'hdog', 'hcrow', 'hbuff', 'hwaseo', 'jujak') },
  { id: 5, name: '검은 바다', sub: '이무기가 승천한 바다, 마지막 싸움', theme: 'sea', hpMul: 2.1, dmgMul: 1.38, clearGold: 530, firstGold: 1500,
    waves: W(1.1, [{ dwolf: 2, dbat: 1 }, { dwolf: 3, dbat: 2 }, { dwolf: 3, dbat: 2, dsnake: 1 }, { dwolf: 3, dbat: 3, dsnake: 2 }, { dwolf: 3, dbat: 3, dsnake: 3 }, { dwolf: 3, dbat: 4, dsnake: 4 }]),
    events: EV('dbat', 'dwolf', 'dbat', 'dbear', 'hyeonmu', 'cheongryong') },
];
/* 어려움 난이도: 해당 챕터 보통 클리어 시 열림 */
/* ───── 무한 모드: 백귀야행 (5장 클리어 후) ─────
   1~5장을 6분씩 차례로 지나며(3분 중간보스, 6분 최종보스) 우두머리 10마리를 모두 상대하고, 그 뒤로도 끝없이 이어짐.
   10분부터는 연장전처럼 1분마다 강해짐(속도 0.5배). 점수 = 생존 초×10 + 처치 + 우두머리 처치×2,000 */
D.ENDLESS_SEG = 360;
D.ENDLESS = (() => {
  const L = D.ENDLESS_SEG, waves = [], events = [];
  D.CHAPTERS.forEach((c, i) => {
    for (const w of c.waves) if (w[0] < 600) waves.push([i * L + w[0] * L / 600, w[1], w[2]]);
    for (const e of c.events) events.push([i * L + (e[1] === 'boss' ? (e[0] >= 600 ? L : L / 2) : e[0] * L / 600), ...e.slice(1)]);
  });
  // 2~5구간의 중간 우두머리는 백귀야행 전용 요괴로 교체
  const MID = ['geuseundae', 'eoduksini', 'jangsanbeom', 'songaksi'];
  for (const e of events) if (e[1] === 'boss' && e[0] % L) { const i = Math.floor(e[0] / L); if (i >= 1) e[2] = MID[i - 1]; }
  events.sort((a, b) => a[0] - b[0]);
  // 30분 이후 2분마다: 백귀야행 전용 최종 우두머리 4종과 빠졌던 중간 우두머리가 번갈아 등장
  const otBosses = ['gangcheori', 'bulga', 'dueoksini', 'haetae', 'samdugumi', 'hwaseo', 'yeomra', 'hyeonmu'];
  return { id: 6, endless: true, name: '백귀야행', sub: '온갖 요괴가 밤길을 행진한다', theme: 'night', hpMul: 1.15, dmgMul: 1.05, clearGold: 0, firstGold: 0, waves, events, otBosses };
})();
D.escore = (t, kills, bosses) => 10 * t + kills + 2000 * bosses;
/* 랭킹 번호: 보통 백귀야행 1000+주, 어려움 백귀야행 5000+주 / 해금: 보통·어려움 3장 클리어 */
D.ekey = (hard, w = D.weekNo()) => (hard ? 5000 : 1000) + w;
D.ENDLESS_UNLOCK = 3;
/* 주간 조건: 매주 월요일에 바뀜. 주간 랭킹 번호 = 1000 + 주 번호 */
D.weekNo = (ms = Date.now()) => Math.floor((ms / 86400000 + 3) / 7);
D.WEEKLY = [
  { id: 'rush',   name: '질주',         desc: '적 이동 속도 +25%' },
  { id: 'hunger', name: '굶주림',       desc: '인삼이 나오지 않는 대신 금화 +30%' },
  { id: 'elite',  name: '정예 행진',     desc: '정예 몬스터가 두 배로 나와요' },
  { id: 'glass',  name: '유리 대포',     desc: '내 피해 +50%, 최대 체력 -40%' },
  { id: 'giant',  name: '철갑 행렬',     desc: '적 체력 +60%, 적 이동 속도 -20%' },
  { id: 'rage',   name: '분노한 우두머리', desc: '우두머리가 처음부터 분노 상태' },
  { id: 'feast',  name: '풍요',         desc: '경험치 +40%, 적 등장량 +30%' },
  { id: 'random', name: '무작위 비급',   desc: '시작 무기가 무작위로 바뀌어요' },
  { id: 'fog',    name: '안개',         desc: '앞이 잘 보이지 않는 대신 금화 +40%' },
  { id: 'mirror', name: '거울 세계',     desc: '좌우 조작이 뒤바뀌는 대신 경험치 +30%' },
  { id: 'blood',  name: '피의 달',       desc: '정예 몬스터 체력 +60%, 유물을 5개까지 가질 수 있어요' },
  { id: 'market', name: '도깨비 장터',   desc: '보물 상자가 두 배로 나오지만 레벨업 선택지가 2개뿐' },
];
// v3.0까지의 주는 예전 8개 순서 그대로(이미 쌓인 주간 랭킹 조건이 바뀌지 않게), 그 다음 주부터 12개로 돌아요
D.WEEK_V3 = 2962;
D.weekly = (w = D.weekNo()) => w <= D.WEEK_V3 ? D.WEEKLY[((w % 8) + 8) % 8] : D.WEEKLY[(w - D.WEEK_V3 + 7) % D.WEEKLY.length];

D.HARD = { spawnMul: 1.15, goldMul: 1.6, firstGold: 2 };
/* ───── 난이도 단계 (v3.5) ─────
   일반 n장 = n단계, 어려움 n장 = n+2단계 (어려움 1장 = 일반 3장 세기 … 어려움 3장 = 일반 5장, 4·5장은 그 위)
   hp·dmg: 잡몹·우두머리 체력/피해 배율, boss: 우두머리 체력 추가 배율 (3장부터 '화력 체크' 벽)
   REC: 단계별 권장 투자 — 영구 강화에 쓴 금화(b)와 주인공 레벨(l). 권장 전투력은 이걸로 계산 */
D.TIER = { hp: [1.15, 1.4, 1.65, 1.9, 2.2, 2.6, 3.0], dmg: [1.05, 1.12, 1.2, 1.28, 1.36, 1.46, 1.56], boss: [1, 1.05, 1.3, 1.65, 1.85, 2.3, 2.7] };
D.tierOf = (ch, hard) => Math.min(D.TIER.hp.length - 1, ch - 1 + (hard ? 2 : 0));
D.REC = [{ b: 0, l: 1 }, { b: 600, l: 1 }, { b: 4000, l: 3 }, { b: 8000, l: 5 }, { b: 14000, l: 6 }, { b: 20000, l: 8 }, { b: 28000, l: 10 }];
/* 금화 b로 영구 강화를 고루 산다면 (권장 전투력·봇 측정용) */
D.metaPlan = b => {
  const m = {}, order = ['atk', 'hp', 'arm', 'luck', 'xp', 'greed', 'spd', 'mag']; let bought = true;
  while (bought) { bought = false; for (const k of order) { const M = D.META[k], lv = m[k] || 0; if (lv < M.max && M.cost[lv] <= b) { b -= M.cost[lv]; m[k] = lv + 1; bought = true; } } }
  return m;
};
/* 전투력: 영구 강화 + 주인공 레벨로 매긴 숫자 하나 (피해 × √체력 × 방어·치명·경험치·이동) */
D.power = (m, hl = 1) => { const L = hl - 1, a = 1 + (m.atk || 0) * D.META.atk.per + L * D.HERO_LV.might, h = 1 + (m.hp || 0) * D.META.hp.per + L * D.HERO_LV.hp;
  return Math.round(1000 * a * Math.sqrt(h) * (1 + 0.06 * (m.arm || 0)) * (1 + (m.luck || 0) * D.META.luck.per) * (1 + 0.01 * (m.xp || 0)) * (1 + 0.01 * (m.spd || 0))); };
D.recPower = (ch, hard) => { const r = D.REC[D.tierOf(ch, hard)]; return D.power(D.metaPlan(r.b), r.l); };
D.BOSS_TIME = 600;
D.ENEMY_CAP = 320;

/* 시간에 따른 적 강화: 10분에 체력 x6, 피해 x2.2 */
D.hpScale = t => 1 + Math.pow(Math.min(t, 600) / 600, 1.3) * 5;
D.dmgScale = t => 1 + Math.min(t, 600) / 600 * 1.2;
D.xpNeed = L => Math.round(5 + (L - 1) * 7 + Math.max(0, L - 15) * 6);

/* ───── 영구 강화(금화) ───── */
D.META = {
  atk:   { name: '기력', desc: '피해 +6%',           max: 10, per: 0.06, cost: [60, 120, 200, 300, 450, 700, 1000, 1400, 1900, 2500] },
  hp:    { name: '체질', desc: '최대 체력 +8%',      max: 10, per: 0.08, cost: [60, 120, 200, 300, 450, 700, 1000, 1400, 1900, 2500] },
  arm:   { name: '금강', desc: '방어 +1',       max: 5,  per: 1,    cost: [250, 600, 1200, 2200, 3500] },
  spd:   { name: '신법', desc: '이동 속도 +3%',      max: 8,  per: 0.03, cost: [50, 100, 160, 240, 350, 550, 800, 1100] },
  mag:   { name: '흡인', desc: '구슬 흡수 범위 +10%', max: 8,  per: 0.10, cost: [40, 80, 130, 200, 300, 450, 650, 900] },
  xp:    { name: '오성', desc: '경험치 +5%',         max: 10, per: 0.05, cost: [70, 140, 230, 340, 500, 750, 1050, 1450, 1950, 2600] },
  luck:  { name: '복덕', desc: '치명타 확률 +2%',     max: 10, per: 0.02, cost: [80, 160, 260, 380, 550, 800, 1100, 1500, 2000, 2700] },
  greed: { name: '재물', desc: '금화 +8%',           max: 10, per: 0.08, cost: [100, 200, 350, 550, 800, 1150, 1600, 2200, 2900, 3800] },
  roll:  { name: '천운', desc: '다시 뽑기 +1회',     max: 3,  per: 1,    cost: [150, 400, 900] },
  rev:   { name: '환생', desc: '광고 없이 부활 1회',  max: 2,  per: 1,    cost: [2500, 7000] },
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
  { id: 'e3', name: '비급 완성', desc: '무기 10종 진화', gold: 1500, test: s => Object.keys(s.evo).length >= 10 },
  { id: 'e4', name: '비급 대가', desc: '무기 20종 진화', gold: 3000, test: s => Object.keys(s.evo).length >= 20 },
  { id: 'u1', name: '합격', desc: '합격기를 처음 완성', gold: 500, test: s => Object.keys(s.union || {}).length >= 1 },
  { id: 'u2', name: '합격의 달인', desc: '합격기 6종 모두 완성', gold: 2500, test: s => Object.keys(s.union || {}).length >= 6 },
  { id: 'b1', name: '보스 사냥꾼', desc: '보스 10마리 처치', gold: 300, test: s => s.stats.bosses >= 10 },
  { id: 'b2', name: '신수 토벌', desc: '보스 50마리 처치', gold: 800, test: s => s.stats.bosses >= 50 },
  { id: 'l1', name: '득도', desc: '한 판에서 레벨 40 달성', gold: 400, test: s => s.stats.maxLv >= 40 },
  { id: 'n1', name: '불굴', desc: '부활 없이 3장 이상 클리어', gold: 500, test: s => s.stats.noRevClear >= 3 },
  { id: 'a1', name: '모두의 퇴마사', desc: '모든 주인공으로 1장 클리어', gold: 600, test: s => Object.keys(D.HEROES).every(h => s.heroClear[h]) },
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
//   연장전(ot): 최종보스 처치 후 버틴 초 × 40
D.score = (t, kills, mid, cleared, bossT, ot = 0) =>
  10 * Math.min(t, 600) + kills + (mid ? 1500 : 0) + (cleared ? 5000 + Math.max(0, 180 - bossT) * 20 + 40 * ot : 0);

/* ───── 연장전 ─────
   최종보스를 잡은 뒤 계속 싸우면 1분마다 단계가 오름. 단계 n일 때 적 체력·피해·등장량 배율 */
D.OT = { hp: n => Math.pow(1.25, n) * (1 + 0.1 * n), dmg: n => Math.pow(1.18, n), spd: n => 1 + 0.03 * n, rate: n => 1 + 0.3 * n, gold: n => 15 + 5 * n,
  eliteEvery: 30, bossEvery: 120, bossHp: k => 1 + 0.6 * k,
  // 시작부터 긴박하게: 2단계에서 출발, 45초마다 단계 상승, 시작하자마자 포위 + 3초 뒤 정예, 75초에 첫 우두머리
  start: 2, step: 45, ring: 32, firstElite: 3, firstBoss: 75 };
/* 보옥: 무기·패시브를 다 올린 뒤 레벨업·상자에서 끝없이 나오는 작은 능력치 */
D.ORBS = {
  might: { name: '기력 보옥', icon: 'might', desc: '피해 +4%', v: 0.04 },
  vigor: { name: '생기 보옥', icon: 'vigor', desc: '최대 체력 +6%', v: 0.06 },
  haste: { name: '신속 보옥', icon: 'haste', desc: '공격 속도 +3%', v: 0.03 },
  luck:  { name: '행운 보옥', icon: 'luck', desc: '치명타 확률 +2%', v: 0.02 },
  swift: { name: '바람 보옥', icon: 'swift', desc: '이동 속도 +3%', v: 0.03 },
  regen: { name: '회춘 보옥', icon: 'regen', desc: '초당 체력 회복 +0.3', v: 0.3 },
};

G.DATA = D;
if (typeof module !== 'undefined') module.exports = D;
})(typeof window !== 'undefined' ? window : globalThis);
