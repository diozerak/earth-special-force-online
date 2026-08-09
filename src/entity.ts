// Сущности: создание, респавн, опыт, границы мира

import type { Entity, SavedProfile } from "./types";
import { WORLD_W, WORLD_H, BOT_NAMES, BOT_COLORS } from "./constants";

export function createEntity(id: string, isBot: boolean, name?: string, colors?: any, profile?: SavedProfile): Entity {
  const c = colors || BOT_COLORS[Math.floor(Math.random() * BOT_COLORS.length)];
  const n = name || (isBot ? BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)] + " " + Math.floor(Math.random()*99) : "Warrior");
  const level = profile?.level ?? 1;
  const exp = profile?.exp ?? 0;
  const expToNext = profile?.expToNext ?? 100;
  const maxHp = profile?.maxHp ?? 100;
  const maxKi = profile?.maxKi ?? 100;
  return {
    id, isBot, name: n,
    x: 200 + Math.random() * (WORLD_W - 400),
    y: 200 + Math.random() * (WORLD_H - 400),
    vx: 0, vy: 0, radius: 18,
    hp: maxHp, maxHp, ki: maxKi, maxKi, level,
    exp, expToNext,
    state: "IDLE", stateTimer: 0,
    facing: { x: Math.random() > 0.5 ? 1 : -1, y: 0 },
    comboCount: 0, invincible: 0, hitFlash: 0, stunTimer: 0,
    trail: [], colors: c,
    kamehamehaCharge: 0, kamehamehaActive: false, kamehamehaMaxCharge: 450,
    kiBlastCharge: 0, kiBlastMaxCharge: 120,
    meleeCharge: 0, meleeMaxCharge: 80,
    inGrab: false, grabTarget: null, spinAngle: 0, grabOrbitRadius: 45,
    heldTicks: {},
    keys: {}, joyVector: { x: 0, y: 0 }, joyActive: false, lastDirKey: "D", keyDownTimes: {},
    botTimer: 0, botTarget: null, botAction: "idle",
    turbo: false, turboTimer: 0, oPressed: false,
    buffPower: 0, buffSpeed: 0, buffShield: 0,
  };
}

export function respawn(e: Entity): void {
  e.hp = e.maxHp; e.ki = e.maxKi;
  e.x = 200 + Math.random() * (WORLD_W - 400);
  e.y = 200 + Math.random() * (WORLD_H - 400);
  e.vx = 0; e.vy = 0; e.state = "IDLE"; e.stateTimer = 0;
  e.inGrab = false; e.grabTarget = null;
  e.turbo = false; e.turboTimer = 0;
  e.buffPower = 0; e.buffSpeed = 0; e.buffShield = 0;
}

export function gainExp(e: Entity, amount: number): void {
  e.exp += amount;
  while (e.exp >= e.expToNext) {
    e.exp -= e.expToNext;
    e.level++;
    e.maxHp = Math.floor(e.maxHp * 1.01);
    e.maxKi = Math.floor(e.maxKi * 1.01);
    e.hp = Math.min(e.hp + Math.floor(e.maxHp * 0.3), e.maxHp);
    e.ki = Math.min(e.ki + Math.floor(e.maxKi * 0.3), e.maxKi);
    e.expToNext = Math.floor(e.expToNext * 1.2);
  }
}

export function clampEntity(e: Entity): void {
  e.x = Math.max(e.radius, Math.min(WORLD_W - e.radius, e.x));
  e.y = Math.max(e.radius, Math.min(WORLD_H - e.radius, e.y));
}
