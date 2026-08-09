// Боевая система: урон, убийства, удары ближнего боя, кихамехамеха, ки-луч

import type { Entity } from "./types";
import type { GameRoom } from "./Room";
import { BOSSES_EVERY_KILLS } from "./constants";
import { gainExp } from "./entity";
import { spawnPickup } from "./pickups";
import { addParticles } from "./effects";

export function damageEntity(room: GameRoom, target: Entity, amount: number, attacker?: Entity): void {
  if ((target.buffShield || 0) > 0) {
    addParticles(room, target.x, target.y, "#93c5fd", 3);
    return;
  }
  let dmg = amount;
  if (attacker && (attacker.buffPower || 0) > 0) dmg *= 1.6;
  target.hp -= dmg; target.hitFlash = 10;

  // EXP за КАЖДОЕ повреждение (будь то бот или игрок)
  if (attacker && !attacker.isBot && target.id !== attacker.id && dmg > 0) {
    const expGain = Math.max(1, Math.ceil(dmg * 0.8));
    gainExp(attacker, expGain);
  }

  if (target.hp <= 0) {
    target.hp = 0;
    onKill(room, attacker || null, target);
  }
  addParticles(room, target.x, target.y, "#ef4444", 5);
}

export function onKill(room: GameRoom, attacker: Entity | null, target: Entity): void {
  if (target.isBoss) {
    // Boss defeated: explosion of loot
    for (let i = 0; i < 4; i++) {
      spawnPickup(room, target.x + (Math.random() - 0.5) * 160, target.y + (Math.random() - 0.5) * 160);
    }
    spawnPickup(room, target.x, target.y, "heal");
    if (attacker && !attacker.isBot) gainExp(attacker, 500);
    room.broadcastEvent({ kind: "bossDefeated", name: target.name });
    addParticles(room, target.x, target.y, "#fbbf24", 80);
    room.entities.delete(target.id);
    return;
  }

  const playerKill = attacker && !attacker.isBot;
  if (playerKill || Math.random() < 0.25) {
    if (Math.random() < (playerKill ? 0.45 : 0.25)) spawnPickup(room, target.x, target.y);
  }

  if (playerKill) {
    room.botKills++;
    room.broadcastEvent({ kind: "kill", count: room.botKills, need: BOSSES_EVERY_KILLS });
    if (room.botKills >= BOSSES_EVERY_KILLS) {
      room.botKills = 0;
      room.spawnBoss();
    }
  }
}

export function meleeHit(room: GameRoom, attacker: Entity, damage: number, range: number, isSwoop: boolean): void {
  for (const t of room.entities.values()) {
    if (t.id === attacker.id || t.hp <= 0) continue;
    const dx = t.x - attacker.x; const dy = t.y - attacker.y; const d = Math.hypot(dx, dy); const dot = dx * attacker.facing.x + dy * attacker.facing.y;
    if (d < range && dot > 0) {
      damageEntity(room, t, damage, attacker);
      t.stunTimer = isSwoop ? 20 : 10;
      t.vx = attacker.facing.x * (isSwoop ? 10 : 4); t.vy = attacker.facing.y * (isSwoop ? 10 : 4);
      t.state = "KNOCKBACK"; t.stateTimer = isSwoop ? 20 : 10;
    }
  }
}

export function fireMeleeCharge(room: GameRoom, e: Entity): void {
  const charge = Math.max(1, e.meleeCharge || 0);
  const ratio = Math.min(1, charge / e.meleeMaxCharge);
  const damage = Math.floor(Math.min(60, 5 + charge * 0.9));
  const range = Math.min(90, 45 + charge * 0.6);
  const knockback = 5 + ratio * 12;
  e.state = "MELEE";
  e.stateTimer = 10;
  e.meleeCharge = 0;
  e.inGrab = false; e.grabTarget = null; // разорвать захват
  let hit = false;
  for (const t of room.entities.values()) {
    if (t.id === e.id || t.hp <= 0) continue;
    const dx = t.x - e.x, dy = t.y - e.y;
    if (Math.hypot(dx, dy) < range && (dx * e.facing.x + dy * e.facing.y) > 0) {
      hit = true;
      damageEntity(room, t, damage, e);
      t.stunTimer = 15 + Math.floor(ratio * 15);
      t.vx = e.facing.x * knockback; t.vy = e.facing.y * knockback;
      t.state = "KNOCKBACK"; t.stateTimer = 20 + Math.floor(ratio * 15);
      addParticles(room, t.x, t.y, ratio > 0.7 ? "#ef4444" : "#fbbf24", 20);
    }
  }
  if (!hit) addParticles(room, e.x + e.facing.x * 30, e.y + e.facing.y * 30, "#94a3b8", 8);
  else addParticles(room, e.x, e.y, e.colors.hair, 15);
}

export function fireKamehameha(room: GameRoom, e: Entity): void {
  // выстрел возможен только при заряде >= 10% — иначе отмена без выстрела
  const rawCharge = e.kamehamehaCharge || 0;
  if (rawCharge < e.kamehamehaMaxCharge * 0.1) {
    e.kamehamehaCharge = 0;
    e.kamehamehaActive = false;
    e.state = "IDLE";
    return;
  }
  const charge = Math.max(1, rawCharge);
  const damage = Math.floor(Math.min(320, 25 + charge * 0.85));
  const thickness = Math.min(180, 30 + charge * 0.45);
  const length = Math.min(1140, 360 + charge * 2.64); // +20% длина
  const angle = Math.atan2(e.facing.y, e.facing.x);
  // луч живёт 90 тиков, но игрок выходит из оглушения через 20
  e.state = "SUPER_ATTACK"; e.stateTimer = 20;
  e.kamehamehaActive = false; e.kamehamehaCharge = 0;
  room.effects.push({ type: "kamehameha", angle, x: e.x, y: e.y, timer: 90, damage, length, thickness, color: e.colors.kameha, owner: e.id });
  addParticles(room, e.x, e.y, e.colors.kameha, 45);
}

export function fireKiBeam(room: GameRoom, e: Entity): void {
  // выстрел возможен только при заряде >= 10% — иначе отмена без выстрела
  const rawCharge = e.kiBlastCharge || 0;
  if (rawCharge < e.kiBlastMaxCharge * 0.1) {
    e.kiBlastCharge = 0;
    e.state = "IDLE";
    return;
  }
  const charge = Math.max(1, rawCharge);
  const ratio = Math.min(1, charge / e.kiBlastMaxCharge);
  const damage = Math.floor(Math.min(100, 6 + charge * 0.6));
  const thickness = Math.min(80, 12 + charge * 0.4);
  const length = Math.min(672, 192 + charge * 2.88); // +20% длина
  const angle = Math.atan2(e.facing.y, e.facing.x);
  const beamTimer = 25 + Math.floor(ratio * 25);
  e.state = "SUPER_ATTACK"; e.stateTimer = 8 + Math.floor(ratio * 8);
  e.kiBlastCharge = 0;
  room.effects.push({ type: "kamehameha", angle, x: e.x, y: e.y, timer: beamTimer, damage, length, thickness, color: e.colors.trail, owner: e.id });
  addParticles(room, e.x, e.y, e.colors.trail, 20);
}

// Удар рукой (кнопка L): энергетический полумесяц, летящий вперёд и исчезающий по мере движения
export function fireCrescentSlash(room: GameRoom, e: Entity): void {
  const angle = Math.atan2(e.facing.y, e.facing.x);
  e.state = "SLASH";
  e.stateTimer = 12;
  room.effects.push({
    type: "slash", angle,
    x: e.x + Math.cos(angle) * 30, y: e.y + Math.sin(angle) * 30,
    timer: 32, damage: 14, length: 46, thickness: 0,
    color: e.colors.kameha, owner: e.id, speed: 9
  });
}
