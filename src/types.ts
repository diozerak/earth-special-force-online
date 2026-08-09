// Общие типы игры

export type Vec2 = { x: number; y: number };
export type TrailPoint = { x: number; y: number; life: number };

export type EntityState =
  | "IDLE" | "WALK" | "DASH" | "SWOOP" | "MELEE" | "MELEE_CHARGE"
  | "SLASH" | "SWORD" | "HIT" | "KI_CHARGE" | "KI_BLAST" | "TELEPORT"
  | "SUPER_ATTACK" | "KNOCKBACK" | "KAMEHAMEHA_CHARGE" | "KI_BEAM_CHARGE";

export interface SavedProfile {
  name: string;
  password: string;
  level: number;
  exp: number;
  expToNext: number;
  maxHp: number;
  maxKi: number;
}

export interface Entity {
  id: string;
  isBot: boolean;
  isBoss?: boolean;
  bossPhase?: number;
  bossTimer?: number;
  name: string;
  password?: string;
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  hp: number; maxHp: number;
  ki: number; maxKi: number;
  level: number;
  exp: number;
  expToNext: number;
  state: EntityState;
  stateTimer: number;
  facing: Vec2;
  comboCount: number;
  invincible: number;
  hitFlash: number;
  stunTimer: number;
  trail: TrailPoint[];
  colors: { hair: string; aura: string; kameha: string; trail: string };
  kiBlastCharge: number;
  kiBlastMaxCharge: number;
  kamehamehaCharge: number;
  kamehamehaActive: boolean;
  kamehamehaMaxCharge: number;
  meleeCharge: number;
  meleeMaxCharge: number;
  inGrab: boolean;
  grabTarget: string | null;
  spinAngle: number;
  grabOrbitRadius: number;
  heldTicks: Record<string, number>;
  ws?: WebSocket;
  keys?: Record<string, boolean>;
  joyVector?: Vec2;
  joyActive?: boolean;
  lastDirKey?: string;
  keyDownTimes?: Record<string, number>;
  botTimer?: number;
  botTarget?: string | null;
  botAction?: string;
  turbo: boolean;
  turboTimer: number;
  oPressed: boolean;
  buffPower?: number;
  buffSpeed?: number;
  buffShield?: number;
  hairLen?: number; // 0 — лысый, 1 — короткие, 2 — средние, 3 — длинные
  kamehaHands?: "right" | "left" | "both"; // чаши чарджа камехамехи
  beamSide?: "right" | "left"; // рука ки-бима / ки-бласта
  swordTimer?: number; // (устарело)
  look?: any; // внешность (PARAMS фрагментов), у ботов — рандомизированная
  lHeldPrev?: boolean;
  swordCharge?: number; // тики зарядки меча (зажато L)
  swordActiveTimer?: number; // оставшееся время активного меча
  swordPower?: number; // 0..1 — процент заряда (размер разрезов)
  swordSwingCd?: number; // перезарядка между махами
  swordUPrev?: boolean; // предыдущее состояние U (для махов)
  inGrabObj?: string | null; // захваченный spaceObject
  objHitCd?: number; // кулдаун урона от столкновений с объектами
  radTime?: number; // тики внутри радиации/гравитации (рост урона)
  radAfter?: number; // остаточные тики после выхода (1/3 урона)
}

export interface Projectile {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  damage: number;
  size: number;
  color: string;
  sizeMul?: number;   // множитель размера (разрезы меча)
  owner: string;
  homing?: boolean;   // управляемый шар
  targetId?: string;  // цель
  fuse?: number;      // тики до взрыва
}

export interface Effect {
  type: string;
  angle: number;
  x: number; y: number;
  timer: number;
  damage: number;
  length: number;
  thickness: number;
  color: string;
  owner: string;
  hitSet?: Record<string, boolean>;
  speed?: number; // скорость полёта эффекта (для slash)
}

export interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number;
  color: string;
  size: number;
}

export interface SpaceObject {
  id: string;
  type: "debris" | "asteroid" | "comet" | "anomaly" | "radfield";
  x: number; y: number;
  vx: number; vy: number;
  hp: number; maxHp: number;
  radius: number;
  rot: number; rotSpeed: number;
  life: number; // тики жизни (аномалии/поля исчезают)
  mass: number; // масса (толкание/захват)
  shed?: number; // сколько кусков уже откололось (mothership)
  thrownBy?: string; // кто запустил объект ударом
  thrownTtl?: number; // оставшиеся тики полёта-снаряда
  grabbedBy?: string; // кто держит объект
}

export type PickupType = "heal" | "ki" | "power" | "speed" | "shield";

export interface Pickup {
  x: number; y: number;
  type: PickupType;
  timer: number;
}
