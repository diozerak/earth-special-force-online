// ИИ босса: фазы, сингулярность, ударная волна, телепорт-страйк, снаряды

import type { Entity } from "./types";
import type { GameRoom } from "./Room";
import { dist } from "./constants";
import { clampEntity } from "./entity";
import { meleeHit, fireKamehameha, fireMeleeCharge } from "./combat";
import { addParticles } from "./effects";

export function bossAI(room: GameRoom, b: Entity): void {
  if (b.hp <= 0) return; // удаляется через onKill
  if (b.invincible > 0) b.invincible--;
  if (b.hitFlash > 0) b.hitFlash--;
  b.ki = b.maxKi;

  const hpRatio = b.hp / b.maxHp;
  const phase = hpRatio > 0.66 ? 1 : hpRatio > 0.33 ? 2 : 3;
  if (phase !== b.bossPhase) {
    b.bossPhase = phase;
    b.invincible = 45;
    b.stunTimer = 0; b.state = "IDLE"; b.stateTimer = 0;
    room.broadcastEvent({ kind: "phaseUp", name: b.name, phase });
    addParticles(room, b.x, b.y, phase === 2 ? "#f97316" : "#a855f7", 50);
  }

  if (b.stunTimer > 0) { b.stunTimer--; b.x += b.vx; b.y += b.vy; clampEntity(b); return; }

  // charge states work like normal
  if (b.state === "KAMEHAMEHA_CHARGE") {
    if (b.kamehamehaCharge < b.kamehamehaMaxCharge) {
      b.kamehamehaCharge++;
      b.vx *= 0.1; b.vy *= 0.1;
      if (b.kamehamehaCharge >= b.kamehamehaMaxCharge || (Math.random() < 0.03 && b.kamehamehaCharge >= b.kamehamehaMaxCharge * 0.1)) fireKamehameha(room, b);
    } else fireKamehameha(room, b);
    b.x += b.vx; b.y += b.vy; clampEntity(b); return;
  }
  if (b.state === "MELEE_CHARGE") {
    fireMeleeCharge(room, b);
    b.x += b.vx; b.y += b.vy; clampEntity(b); return;
  }
  if (b.stateTimer > 0) {
    b.stateTimer--;
    if (b.stateTimer === 0) { b.state = "IDLE"; b.vx *= 0.3; b.vy *= 0.3; b.comboCount = 0; }
    if (b.state === "KNOCKBACK") { b.vx *= 0.92; b.vy *= 0.92; }
    b.x += b.vx; b.y += b.vy; clampEntity(b); return;
  }

  let nearest: Entity | null = null; let minD = Infinity;
  for (const t of room.entities.values()) {
    if (t.id === b.id || t.hp <= 0 || t.isBoss) continue;
    const d = dist(b, t);
    if (d < minD) { minD = d; nearest = t; }
  }
  if (!nearest) { b.vx *= 0.9; b.vy *= 0.9; return; }

  const dx = nearest.x - b.x, dy = nearest.y - b.y;
  const d = Math.hypot(dx, dy) || 1;
  b.facing = { x: dx / d, y: dy / d };
  const spMult = (b.buffSpeed || 0) > 0 ? 1.5 : 1;
  const speed = (2.4 + phase * 0.7) * spMult;

  // passive drift toward target
  b.vx += ((dx / d) * speed - b.vx) * 0.1;
  b.vy += ((dy / d) * speed - b.vy) * 0.1;
  if (Math.abs(b.vx) > 2 || Math.abs(b.vy) > 2) b.state = "WALK"; else b.state = "IDLE";

  b.bossTimer = (b.bossTimer ?? 0) - 1;
  if (b.bossTimer <= 0) {
    const r = Math.random();
    if (phase >= 2 && d > 220 && r < 0.3) {
      // SINGULARITY — gravity well pulls everyone in
      room.effects.push({ type: "singularity", angle: 0, x: b.x, y: b.y, timer: 90, damage: 0, length: 420, thickness: 0, color: "#a855f7", owner: b.id });
      room.broadcastEvent({ kind: "singularity", name: b.name });
      b.bossTimer = 240 - phase * 40;
    } else if (d < 170 && r < 0.65) {
      // SHOCKWAVE SLAM — expanding damage ring
      room.effects.push({ type: "shockwave", angle: 0, x: b.x, y: b.y, timer: 40, damage: 22 + phase * 9, length: 240 + phase * 50, thickness: 0, color: "#ef4444", owner: b.id });
      addParticles(room, b.x, b.y, "#ef4444", 30);
      b.state = "SUPER_ATTACK"; b.stateTimer = 30;
      b.bossTimer = 150 - phase * 25;
    } else if (phase >= 3 && d < 620 && r > 0.75) {
      // KAMEHAMEHA in phase 3
      b.kamehamehaActive = true; b.kamehamehaCharge = 0; b.state = "KAMEHAMEHA_CHARGE";
      b.bossTimer = 260;
    } else if (d < 260 && r > 0.55) {
      // TELEPORT STRIKE — blink behind target + heavy hit
      b.x = nearest.x - b.facing.x * 60;
      b.y = nearest.y - b.facing.y * 60;
      clampEntity(b);
      addParticles(room, b.x, b.y, b.colors.trail, 20);
      b.state = "MELEE"; b.stateTimer = 12;
      meleeHit(room, b, 14 + phase * 4, 110, true);
      b.bossTimer = 130 - phase * 20;
    } else if (phase >= 2 && d > 100 && r >= 0.35 && r < 0.55) {
      // SEEKER ORBS — управляемые энергошары: преследуют цель и взрываются
      const orbCount = 2 + phase;
      for (let i = 0; i < orbCount; i++) {
        const a = (i / orbCount) * Math.PI * 2;
        room.projectiles.push({
          x: b.x + Math.cos(a) * 44, y: b.y + Math.sin(a) * 44,
          vx: Math.cos(a) * 3.5, vy: Math.sin(a) * 3.5,
          life: 160, damage: 5 + phase * 3, size: 13, color: "#fb923c",
          owner: b.id, homing: true, targetId: nearest.id, fuse: 100
        });
      }
      addParticles(room, b.x, b.y, "#fb923c", 18);
      b.state = "KI_BLAST"; b.stateTimer = 12;
      b.bossTimer = 210 - phase * 30;
    } else {
      // RADIAL KI BARRAGE — bullet ring
      const count = 6 + phase * 4;
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2 + room.tick * 0.1;
        room.projectiles.push({ x: b.x + Math.cos(a) * 40, y: b.y + Math.sin(a) * 40, vx: Math.cos(a) * 8, vy: Math.sin(a) * 8, life: 80, damage: 3, size: 8, color: b.colors.kameha, owner: b.id });
      }
      b.state = "KI_BLAST"; b.stateTimer = 12;
      b.bossTimer = 170 - phase * 30;
    }
  }

  b.x += b.vx; b.y += b.vy;
  clampEntity(b);
  if (Math.abs(b.vx) > 4 || Math.abs(b.vy) > 4) {
    b.trail.push({ x: b.x, y: b.y, life: 10 });
  }
  b.trail = b.trail.filter(t => { t.life--; return t.life > 0; });
}
