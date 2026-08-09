// Снаряды, эффекты (лучи, ударные волны, сингулярности), частицы

import type { Entity } from "./types";
import type { GameRoom } from "./Room";
import { damageEntity } from "./combat";

export function addParticles(room: GameRoom, x: number, y: number, color: string, count: number): void {
  for (let i = 0; i < count; i++) {
    room.particles.push({ x: x + (Math.random() - 0.5) * 30, y: y + (Math.random() - 0.5) * 30, vx: (Math.random() - 0.5) * 6, vy: (Math.random() - 0.5) * 6, life: 20 + Math.random() * 10, color, size: Math.random() * 3 + 2 });
  }
}

export function updateProjectiles(room: GameRoom): void {
  for (let i = room.projectiles.length - 1; i >= 0; i--) {
    const p = room.projectiles[i];
    if (p.homing) {
      p.fuse = (p.fuse ?? 90) - 1;
      const target = room.entities.get(p.targetId || "");
      const tAlive = target && target.hp > 0;
      if (tAlive) {
        const dx = target.x - p.x, dy = target.y - p.y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = Math.min(7.5, 3 + (100 - Math.max(0, p.fuse)) * 0.05); // постепенно разгоняются
        p.vx += ((dx / d) * sp - p.vx) * 0.12;
        p.vy += ((dy / d) * sp - p.vy) * 0.12;
      }
      p.x += p.vx; p.y += p.vy;
      const boom = p.fuse <= 0 || (tAlive && Math.hypot(p.x - target.x, p.y - target.y) < target.radius + p.size + 6);
      if (boom) {
        const boomR = 95;
        const owner = room.entities.get(p.owner);
        for (const t of room.entities.values()) {
          if (t.id === p.owner || t.hp <= 0) continue;
          if (Math.hypot(p.x - t.x, p.y - t.y) < boomR + t.radius) {
            damageEntity(room, t, p.damage, owner || { id: p.owner } as Entity);
            const ang = Math.atan2(t.y - p.y, t.x - p.x);
            t.vx += Math.cos(ang) * 8; t.vy += Math.sin(ang) * 8;
            t.stunTimer = 10; t.state = "KNOCKBACK"; t.stateTimer = 14;
          }
        }
        addParticles(room, p.x, p.y, p.color, 26);
        room.projectiles.splice(i, 1);
        continue;
      }
      if (p.life-- <= 0) { room.projectiles.splice(i, 1); }
      continue;
    }
    p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) { room.projectiles.splice(i, 1); continue; }
    const owner = room.entities.get(p.owner);
    for (const t of room.entities.values()) {
      if (t.id === p.owner || t.hp <= 0) continue;
      if (Math.hypot(p.x - t.x, p.y - t.y) < t.radius + p.size + 5) { damageEntity(room, t, p.damage, owner || { id: p.owner } as Entity); room.projectiles.splice(i, 1); break; }
    }
  }
}

export function updateEffects(room: GameRoom): void {
  for (let i = room.effects.length - 1; i >= 0; i--) {
    const e = room.effects[i]; e.timer--;
    if (e.timer <= 0) { room.effects.splice(i, 1); continue; }
    if (e.type === "kamehameha") {
      const fx = Math.cos(e.angle), fy = Math.sin(e.angle);
      const owner = room.entities.get(e.owner);
      for (const t of room.entities.values()) {
        if (t.id === e.owner || t.hp <= 0) continue;
        const dx = t.x - e.x, dy = t.y - e.y;
        const proj = dx * fx + dy * fy; const perp = Math.abs(dx * fy - dy * fx);
        if (proj > 0 && proj < e.length && perp < e.thickness / 2 + t.radius) {
          damageEntity(room, t, e.damage / 26, owner || { id: e.owner } as Entity);
          t.vx += fx * 2.5; t.vy += fy * 2.5;
        }
      }
    } else if (e.type === "shockwave") {
      const progress = 1 - e.timer / 40;
      const r = e.length * progress;
      const owner = room.entities.get(e.owner);
      e.hitSet = e.hitSet || {};
      for (const t of room.entities.values()) {
        if (t.id === e.owner || t.hp <= 0) continue;
        const d = Math.hypot(t.x - e.x, t.y - e.y);
        if (Math.abs(d - r) < 34 && !e.hitSet[t.id]) {
          e.hitSet[t.id] = true;
          damageEntity(room, t, e.damage, owner || { id: e.owner } as Entity);
          const ang = Math.atan2(t.y - e.y, t.x - e.x);
          t.vx += Math.cos(ang) * 13; t.vy += Math.sin(ang) * 13;
          t.stunTimer = 14; t.state = "KNOCKBACK"; t.stateTimer = 22;
        }
      }
    } else if (e.type === "slash") {
      // полумесяц летит вперёд и поражает каждую цель один раз
      e.x += Math.cos(e.angle) * (e.speed || 9);
      e.y += Math.sin(e.angle) * (e.speed || 9);
      const owner = room.entities.get(e.owner);
      e.hitSet = e.hitSet || {};
      for (const t of room.entities.values()) {
        if (t.id === e.owner || t.hp <= 0 || e.hitSet[t.id]) continue;
        if (Math.hypot(t.x - e.x, t.y - e.y) < e.length + t.radius) {
          e.hitSet[t.id] = true;
          damageEntity(room, t, e.damage, owner || { id: e.owner } as Entity);
          const ang = Math.atan2(t.y - e.y, t.x - e.x);
          t.vx += Math.cos(ang) * 9; t.vy += Math.sin(ang) * 9;
          t.stunTimer = 10; t.state = "KNOCKBACK"; t.stateTimer = 14;
        }
      }
    } else if (e.type === "singularity") {
      for (const t of room.entities.values()) {
        if (t.id === e.owner || t.hp <= 0) continue;
        const dx = e.x - t.x, dy = e.y - t.y;
        const d = Math.hypot(dx, dy);
        if (d < 430 && d > 12) {
          const pull = 1.5;
          t.vx += (dx / d) * pull; t.vy += (dy / d) * pull;
          if (room.tick % 10 === 0) addParticles(room, t.x, t.y, "#a855f7", 1);
        }
      }
    }
  }
}

export function updateParticles(room: GameRoom): void {
  for (let i = room.particles.length - 1; i >= 0; i--) {
    const p = room.particles[i]; p.x += p.vx; p.y += p.vy; p.life--;
    if (p.life <= 0) room.particles.splice(i, 1);
  }
}
