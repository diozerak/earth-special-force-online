// Пауэр-апы и баффы

import type { Entity, PickupType } from "./types";
import type { GameRoom } from "./Room";
import { WORLD_W, WORLD_H, PICKUP_TYPES, PICKUP_COLORS, PICKUP_DURATION } from "./constants";
import { addParticles } from "./effects";

export function spawnPickup(room: GameRoom, x: number, y: number, forceType?: PickupType): void {
  const type = forceType || PICKUP_TYPES[Math.floor(Math.random() * PICKUP_TYPES.length)];
  room.pickups.push({
    x: Math.max(40, Math.min(WORLD_W - 40, x)),
    y: Math.max(40, Math.min(WORLD_H - 40, y)),
    type, timer: 600
  });
}

export function applyPickup(room: GameRoom, e: Entity, type: PickupType): void {
  switch (type) {
    case "heal": e.hp = Math.min(e.maxHp, e.hp + Math.floor(e.maxHp * 0.5)); break;
    case "ki": e.ki = e.maxKi; break;
    case "power": e.buffPower = PICKUP_DURATION.power; break;
    case "speed": e.buffSpeed = PICKUP_DURATION.speed; break;
    case "shield": e.buffShield = PICKUP_DURATION.shield; break;
  }
  addParticles(room, e.x, e.y, PICKUP_COLORS[type], 14);
  if (!e.isBot) room.broadcastEvent({ kind: "pickup", pickup: type, name: e.name });
}

export function updatePickups(room: GameRoom): void {
  for (let i = room.pickups.length - 1; i >= 0; i--) {
    const p = room.pickups[i];
    p.timer--;
    if (p.timer <= 0) { room.pickups.splice(i, 1); continue; }
    for (const e of room.entities.values()) {
      if (e.hp <= 0) continue;
      if (Math.hypot(p.x - e.x, p.y - e.y) < e.radius + 18) {
        applyPickup(room, e, p.type);
        room.pickups.splice(i, 1);
        break;
      }
    }
  }
}
