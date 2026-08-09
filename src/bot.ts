// ИИ обычных ботов

import type { Entity } from "./types";
import type { GameRoom } from "./Room";
import { dist, END_STATE_MAP } from "./constants";
import { respawn, clampEntity } from "./entity";
import { damageEntity, fireKamehameha, fireMeleeCharge, fireCrescentSlash } from "./combat";
import { addParticles } from "./effects";

export function botAI(room: GameRoom, b: Entity): void {
  if (!Number.isFinite(b.stateTimer)) b.stateTimer = 0;
  if (!Number.isFinite(b.stunTimer)) b.stunTimer = 0;
  if (!Number.isFinite(b.invincible)) b.invincible = 0;
  if (!Number.isFinite(b.hitFlash)) b.hitFlash = 0;
  if (b.hp <= 0) { respawn(b); return; }
  if (b.invincible > 0) b.invincible--;
  if (b.hitFlash > 0) b.hitFlash--;
  if (b.stunTimer > 0) { b.stunTimer--; b.x += b.vx; b.y += b.vy; clampEntity(b); return; }
  if (b.stateTimer > 0) {
    b.stateTimer--;
    if (b.stateTimer === 0) {
      const next = END_STATE_MAP[b.state];
      if (next) { b.state = next; if (b.state === "IDLE") { b.vx *= 0.3; b.vy *= 0.3; b.comboCount = 0; } }
    }
    if (b.state === "KNOCKBACK") { b.vx *= 0.92; b.vy *= 0.92; }
    b.x += b.vx; b.y += b.vy; clampEntity(b); return;
  }

  // === BOT CHARGE STATES ===
  if (b.state === "KAMEHAMEHA_CHARGE") {
    if (b.kamehamehaCharge < b.kamehamehaMaxCharge && b.ki > 1) {
      b.kamehamehaCharge++;
      b.ki -= 0.25;
      b.vx *= 0.1; b.vy *= 0.1;
      if (b.kamehamehaCharge >= b.kamehamehaMaxCharge || (Math.random() < 0.04 && b.kamehamehaCharge >= b.kamehamehaMaxCharge * 0.1)) {
        fireKamehameha(room, b);
      }
    } else {
      fireKamehameha(room, b);
    }
    return;
  }

  if (b.state === "MELEE_CHARGE") {
    if (b.meleeCharge < b.meleeMaxCharge && b.ki > 0.5) {
      b.meleeCharge++;
      b.ki -= 0.25;
      b.vx *= 0.1; b.vy *= 0.1;

      // === GRAB: как у игроков — схватить жертву в упор и тащить за собой ===
      if (!b.inGrab) {
        for (const t of room.entities.values()) {
          if (t.id === b.id || t.hp <= 0 || t.isBoss) continue;
          if (Math.hypot(t.x - b.x, t.y - b.y) < b.radius + t.radius + 14) {
            b.inGrab = true;
            b.grabTarget = t.id;
            break;
          }
        }
      }
      if (b.inGrab && b.grabTarget) {
        const target = room.entities.get(b.grabTarget);
        if (target && target.hp > 0) {
          target.state = "HIT";
          target.stunTimer = 8;
          target.vx = 0; target.vy = 0;
          target.x = b.x + b.facing.x * 40;
          target.y = b.y + b.facing.y * 40;
          clampEntity(target);
        } else {
          b.inGrab = false; b.grabTarget = null;
        }
      }

      if (room.tick % 3 === 0) {
        addParticles(room, b.x + (Math.random()-0.5)*20, b.y + (Math.random()-0.5)*20, b.colors.hair, 2);
      }
      if (b.meleeCharge >= b.meleeMaxCharge || Math.random() < 0.06) {
        fireMeleeCharge(room, b); // сам разрывает inGrab/grabTarget
      }
    } else {
      b.inGrab = false; b.grabTarget = null;
      fireMeleeCharge(room, b);
    }
    return;
  }

  let nearest: Entity | null = null; let minD = Infinity;
  for (const t of room.entities.values()) { if (t.id === b.id || t.hp <= 0) continue; const d = dist(b, t); if (d < minD) { minD = d; nearest = t; } }
  if (!nearest) { b.vx *= 0.9; b.vy *= 0.9; b.state = "IDLE"; return; }
  b.botTarget = nearest.id;
  const dx = nearest.x - b.x; const dy = nearest.y - b.y; const d = Math.hypot(dx, dy);
  b.facing = { x: dx / d || 1, y: dy / d || 0 };
  b.botTimer = (b.botTimer || 0) + 1;
  if (b.botTimer % 8 === 0) {
    const r = Math.random();
    const wasCharging = b.botAction === "charge";
    b.botAction = "idle";
    // ки-пул: при малом ки бот заряжается, а не телепортируется бесконечно
    if (b.ki < 15 && r > 0.35) b.botAction = "charge";
    else if (wasCharging && b.ki < 50 && r > 0.3) b.botAction = "charge"; // дозаряжаемся минимум до половины
    else if (b.hp < 35 && b.ki >= 10 && r > 0.75) b.botAction = "teleport"; // телепорт стоит 10 ки
    else if (d < 70 && b.ki > 6 && r > 0.5) b.botAction = "meleeCharge";
    else if (d < 55 && b.ki > 5) b.botAction = r > 0.35 ? "melee" : "kiblast";
    else if (d >= 70 && d < 280 && b.ki > 12 && r > 0.75) b.botAction = "slash"; // удар-полумесяц (L)
    else if (d < 220 && b.ki > 10 && r > 0.3) b.botAction = "kiblast";
    else if (d < 500 && b.ki > 45 && r > 0.85) b.botAction = "kamehameha";
    else if (d > 150 && d < 350 && b.ki > 15 && r > 0.9) b.botAction = "swoop";
    else if (d > 80) b.botAction = "chase";
    else if (b.ki < 25 && r > 0.6) b.botAction = "charge";
  }
  const bSpMult = (b.buffSpeed || 0) > 0 ? 1.5 : 1;
  switch (b.botAction) {
    case "chase": { const sp = 3.4 * bSpMult; b.vx = (dx / d) * sp; b.vy = (dy / d) * sp; b.state = "WALK"; break; }
    case "melee": { b.state = "MELEE"; b.stateTimer = 10; b.comboCount++; const dmg = 2 + Math.min(b.comboCount, 3); for (const t of room.entities.values()) { if (t.id === b.id || t.hp <= 0) continue; const tx = t.x - b.x, ty = t.y - b.y; if (Math.hypot(tx, ty) < 50 && (tx * b.facing.x + ty * b.facing.y) > 0) { damageEntity(room, t, dmg, b); t.stunTimer = 10; t.vx = b.facing.x * 4; t.vy = b.facing.y * 4; } } break; }
    case "meleeCharge": { b.meleeCharge = 0; b.state = "MELEE_CHARGE"; break; }
    case "slash": { if (b.ki < 8) break; b.ki -= 8; fireCrescentSlash(room, b); break; }
    case "kiblast": { if (b.ki < 5) break; b.ki -= 5; b.state = "KI_BLAST"; b.stateTimer = 12; const fl = Math.hypot(b.facing.x, b.facing.y); const fx = fl > 0.001 ? b.facing.x / fl : 1; const fy = fl > 0.001 ? b.facing.y / fl : 0; room.projectiles.push({ x: b.x + fx * 25, y: b.y + fy * 25, vx: fx * 11, vy: fy * 11, life: 70, damage: 2, size: 7, color: b.colors.kameha, owner: b.id }); break; }
    case "kamehameha": { b.kamehamehaActive = true; b.kamehamehaCharge = 0; b.state = "KAMEHAMEHA_CHARGE"; break; }
    case "swoop": { b.state = "SWOOP"; b.ki -= 0.5; const sp = 11 * bSpMult; b.vx = b.facing.x * sp; b.vy = b.facing.y * sp; break; }
    case "teleport": { if (b.ki < 10) break; b.ki -= 10; b.state = "TELEPORT"; b.stateTimer = 6; b.invincible = 12; const ang = Math.random() * Math.PI * 2; b.x += Math.cos(ang) * 100; b.y += Math.sin(ang) * 100; clampEntity(b); addParticles(room, b.x, b.y, b.colors.trail, 10); break; }
    case "charge": { b.state = "KI_CHARGE"; b.vx *= 0.1; b.vy *= 0.1; if (b.ki < b.maxKi) b.ki += 0.9; break; }
    default: { b.vx *= 0.85; b.vy *= 0.85; b.state = "IDLE"; }
  }
  b.x += b.vx; b.y += b.vy; clampEntity(b);
  if (b.ki < b.maxKi) b.ki += 0.06;
}
