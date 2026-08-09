// Логика живого игрока: ввод, движение, даш, телепорт, граб

import type { Entity, EntityState } from "./types";
import type { GameRoom } from "./Room";
import { END_STATE_MAP } from "./constants";
import { respawn, clampEntity } from "./entity";
import { fireKamehameha, fireMeleeCharge, fireKiBeam, fireCrescentSlash } from "./combat";
import { addParticles } from "./effects";

export function processPlayer(room: GameRoom, e: Entity): void {
  if (!Number.isFinite(e.stateTimer)) e.stateTimer = 0;
  if (!Number.isFinite(e.stunTimer)) e.stunTimer = 0;
  if (!Number.isFinite(e.invincible)) e.invincible = 0;
  if (!Number.isFinite(e.hitFlash)) e.hitFlash = 0;
  if (!Number.isFinite(e.ki)) e.ki = 0;
  if (!Number.isFinite(e.hp)) e.hp = 0;

  if (e.hp <= 0) { respawn(e); return; }
  if (e.invincible > 0) e.invincible--;
  if (e.hitFlash > 0) e.hitFlash--;

  if (e.stunTimer > 0) {
    e.stunTimer--;
    e.x += e.vx; e.y += e.vy;
    clampEntity(e);
    return;
  }

  if (e.stateTimer > 0) {
    e.stateTimer--;
    if (e.stateTimer === 0) {
      const next = END_STATE_MAP[e.state];
      if (next) {
        e.state = next;
        if (e.state === "IDLE") { e.vx *= 0.3; e.vy *= 0.3; e.comboCount = 0; }
      }
    }
    if (e.state === "KNOCKBACK") { e.vx *= 0.92; e.vy *= 0.92; }
    e.x += e.vx; e.y += e.vy;
    clampEntity(e);
    return;
  }

  // === TURBO (O) ===
  if (e.keys?.["O"] && !e.oPressed && !e.turbo && e.ki >= 15 &&
      (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || e.state === "DASH")) {
    e.turbo = true; e.turboTimer = 180; e.ki -= 7.5; e.oPressed = true;
  }
  if (!e.keys?.["O"]) e.oPressed = false;
  if (e.turbo) {
    e.turboTimer--;
    if (e.turboTimer <= 0 || e.ki <= 0) { e.turbo = false; e.turboTimer = 0; }
    else e.ki -= 0.3;
  }

  // === МЕЧ (L): зажатие — зарядка как кихамехамеха (до 450 тиков), во время зарядки летать нельзя ===
  // Отпускание/полный заряд → меч активен (столько тиков, сколько заряжали). Пока активен:
  // полёт, телепорт и все механики доступны; U — махи с разрезами; ки-бим на U недоступен.
  const SWORD_MAX_CHARGE = 450; // как kamehamehaMaxCharge
  const lHeld = !!e.keys?.["L"];
  const lPressed = lHeld && !e.lHeldPrev;
  e.lHeldPrev = lHeld;

  // таймер активного меча убывает в любом стейте
  if ((e.swordActiveTimer || 0) > 0) {
    e.swordActiveTimer--;
    if (e.swordActiveTimer <= 0) e.swordPower = 0;
  }

  // старт зарядки (нельзя перезаряжать, пока меч активен)
  if (lPressed && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP") && e.ki >= 4 && (e.swordActiveTimer || 0) <= 0) {
    e.ki -= 4;
    e.state = "SWORD"; e.stateTimer = 0;
    e.swordCharge = 0;
    e.swordPower = 0;
  }

  if (e.state === "SWORD") {
    // зарядка: L зажато, ки есть, не достигнут максимум
    if (lHeld && e.ki > 0.5 && (e.swordCharge || 0) < SWORD_MAX_CHARGE) {
      e.swordCharge = (e.swordCharge || 0) + 1;
      e.swordPower = e.swordCharge / SWORD_MAX_CHARGE;
      e.ki -= 0.15;
      e.vx *= 0.7; e.vy *= 0.7; // летать нельзя — тяжёлое замедление
      e.x += e.vx; e.y += e.vy;
      clampEntity(e);
      if (e.ki < e.maxKi) e.ki += 0.04;
      return;
    }
    // отпустили L / ки кончилось / полный заряд → активируем меч
    const charge = e.swordCharge || 0;
    e.swordCharge = undefined;
    if (charge >= 10) { // минимум ~0.33с
      e.swordActiveTimer = charge; // живёт столько, сколько заряжали
      e.swordPower = charge / SWORD_MAX_CHARGE;
      e.swordSwingCd = 0;
      e.swordUPrev = !!e.keys?.["U"]; // первый мах — только новым нажатием
    } else {
      e.swordActiveTimer = 0;
      e.swordPower = 0;
    }
    e.state = "IDLE";
  }

  if (e.state === "KAMEHAMEHA_CHARGE") {
    if (e.keys?.["U"] && e.ki > 1) {
      e.kamehamehaCharge++;
      e.ki -= 0.2;
      e.vx *= 0.1; e.vy *= 0.1;
      if (e.kamehamehaCharge >= e.kamehamehaMaxCharge) fireKamehameha(room, e);
    } else {
      fireKamehameha(room, e);
    }
    applyMovement(room, e);
    clampEntity(e);
    return;
  }

  if (e.state === "MELEE_CHARGE") {
    if (e.keys?.["K"] && e.ki > 0.5) {
      e.meleeCharge++;
      e.ki -= 0.25;
      e.vx *= 0.1; e.vy *= 0.1;

      // === GRAB: схватить противника или МЕЛКИЙ объект в упор ===
      if (!e.inGrab && !e.inGrabObj) {
        for (const t of room.entities.values()) {
          if (t.id === e.id || t.hp <= 0 || t.isBoss) continue;
          if (Math.hypot(t.x - e.x, t.y - e.y) < e.radius + t.radius + 14) {
            e.inGrab = true;
            e.grabTarget = t.id;
            break;
          }
        }
        if (!e.inGrab) {
          for (const o of room.spaceObjects) {
            if (o.grabbedBy || o.maxHp <= 1 || o.mass > 3) continue; // только мелкие: debris/comet
            if (Math.hypot(o.x - e.x, o.y - e.y) < e.radius + o.radius + 14) {
              e.inGrabObj = o.id;
              o.grabbedBy = e.id;
              if (o.type === "comet") { // комета обжигает при захвате
                damageEntity(room, e, 3, undefined);
                addParticles(room, e.x, e.y, "#fb923c", 6);
              }
              break;
            }
          }
        }
      }
      if (e.inGrab && e.grabTarget) {
        const target = room.entities.get(e.grabTarget);
        if (target && target.hp > 0) {
          target.state = "HIT";
          target.stunTimer = 8; // держим в оглушении
          target.vx = 0; target.vy = 0;
          target.x = e.x + e.facing.x * 40; // держим перед собой
          target.y = e.y + e.facing.y * 40;
          clampEntity(target);
        } else {
          e.inGrab = false; e.grabTarget = null;
        }
      }
      if (e.inGrabObj) {
        const obj = room.spaceObjects.find(o => o.id === e.inGrabObj);
        if (obj && obj.grabbedBy === e.id) {
          obj.x = e.x + e.facing.x * 42;
          obj.y = e.y + e.facing.y * 42;
          obj.vx = 0; obj.vy = 0; obj.rot += 0.1;
        } else {
          e.inGrabObj = null;
        }
      }

      if (room.tick % 3 === 0) {
        addParticles(room, e.x + (Math.random()-0.5)*20, e.y + (Math.random()-0.5)*20, e.colors.hair, 2);
      }
      if (e.meleeCharge >= e.meleeMaxCharge) fireMeleeCharge(room, e);
    } else {
      // отпустили K → мощный удар по захваченной цели/объекту
      e.inGrab = false; e.grabTarget = null;
      fireMeleeCharge(room, e);
    }
    applyMovement(room, e);
    clampEntity(e);
    return;
  }

  if (e.state === "KI_CHARGE") {
    if (e.keys?.["I"]) {
      e.vx *= 0.1; e.vy *= 0.1;
      if (e.ki < e.maxKi) e.ki += 0.9;
    } else {
      e.state = "IDLE";
    }
    e.x += e.vx; e.y += e.vy;
    clampEntity(e);
    return;
  }

  if (e.state === "KI_BEAM_CHARGE") {
    if (e.keys?.["J"] && e.ki > 1) {
      e.kiBlastCharge++;
      e.ki -= 0.12;
      e.vx *= 0.1; e.vy *= 0.1;
      if (e.kiBlastCharge >= e.kiBlastMaxCharge) fireKiBeam(room, e);
    } else {
      fireKiBeam(room, e);
    }
    applyMovement(room, e);
    clampEntity(e);
    return;
  }

  applyMovement(room, e);

  if (e.keys?.["DASH"] && (e.state === "IDLE" || e.state === "WALK")) {
    if (e.ki >= 5) {
      e.ki -= 5;
      e.state = "DASH"; e.stateTimer = 10;
      const sp = 22;
      const fl = Math.hypot(e.facing.x, e.facing.y);
      if (fl > 0.001) { e.vx = (e.facing.x / fl) * sp; e.vy = (e.facing.y / fl) * sp; }
    }
    e.keys["DASH"] = false;
  }

  if (e.keys?.["J"] && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP")) {
    e.heldTicks["J"] = (e.heldTicks["J"] || 0) + 1;
    if (e.heldTicks["J"] > 30) {
      e.kiBlastCharge = 0; e.state = "KI_BEAM_CHARGE";
    } else if (e.ki >= 5 && room.tick % 12 === 0) {
      e.ki -= 5;
      e.state = "KI_BLAST"; e.stateTimer = 6; // стейт для звука и позы (как у ботов)
      const fl = Math.hypot(e.facing.x, e.facing.y);
      const fx = fl > 0.001 ? e.facing.x / fl : 1;
      const fy = fl > 0.001 ? e.facing.y / fl : 0;
      room.projectiles.push({ x: e.x + fx * 25, y: e.y + fy * 25, vx: fx * 11, vy: fy * 11, life: 70, damage: 2, size: 7, color: e.colors.kameha, owner: e.id });
    }
  } else if (!e.keys?.["J"]) {
    e.heldTicks["J"] = 0;
  }

  if (e.keys?.["H"] && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP") && e.ki >= 10) {
    e.ki -= 10;
    e.state = "TELEPORT"; e.stateTimer = 20; e.invincible = 14;
    const sp = 22; // та же скорость, что у dash (22)
    const fl = Math.hypot(e.facing.x, e.facing.y);
    if (fl > 0.001) { e.vx = (e.facing.x / fl) * sp; e.vy = (e.facing.y / fl) * sp; }
    addParticles(room, e.x, e.y, e.colors.trail, 12); // эффект тот же
    e.keys["H"] = false;
  }

  if ((e.swordActiveTimer || 0) > 0) {
    // меч активен: U — махи с разрезами (ки-бим и камеха недоступны)
    const uHeld = !!e.keys?.["U"];
    const uEdge = uHeld && !e.swordUPrev;
    e.swordUPrev = uHeld;
    e.swordSwingCd = Math.max(0, (e.swordSwingCd || 0) - 1);
    if (uEdge && (e.swordSwingCd || 0) <= 0 && e.ki >= 6) {
      e.ki -= 6;
      e.swordSwingCd = 12;
      fireCrescentSlash(room, e, false, 1 + (e.swordPower || 0) * 1.5);
    }
  } else if (e.keys?.["U"] && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || e.state === "DASH")) {
    e.kamehamehaActive = true; e.kamehamehaCharge = 0; e.state = "KAMEHAMEHA_CHARGE";
  }

  if (e.keys?.["K"] && (e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || e.state === "DASH")) {
    e.meleeCharge = 0; e.state = "MELEE_CHARGE";
  }

  if (e.keys?.["I"] && (e.state === "IDLE" || e.state === "WALK")) {
    e.state = "KI_CHARGE";
  }

  clampEntity(e);
  if (e.ki < e.maxKi) e.ki += 0.06;
}

export function applyMovement(room: GameRoom, e: Entity): void {
  const isLocked = e.state === "MELEE_CHARGE" || e.state === "KAMEHAMEHA_CHARGE" || e.state === "KI_BEAM_CHARGE" || e.stateTimer > 0;
  const spMult = (e.buffSpeed || 0) > 0 ? 1.5 : 1;
  let dx = 0, dy = 0;
  if (e.keys?.["W"]) dy = -1;
  if (e.keys?.["S"]) dy = 1;
  if (e.keys?.["A"]) dx = -1;
  if (e.keys?.["D"]) dx = 1;
  if (e.joyActive && e.joyVector) { dx = e.joyVector.x; dy = e.joyVector.y; }
  if (!e.joyActive && dx !== 0 && dy !== 0) { const len = Math.hypot(dx, dy); dx /= len; dy /= len; }
  if (Math.abs(dx) > 0.01 || Math.abs(dy) > 0.01) {
    e.facing = { x: dx, y: dy };
    if (Math.abs(dx) > Math.abs(dy)) e.lastDirKey = dx > 0 ? "D" : "A";
    else e.lastDirKey = dy > 0 ? "S" : "W";
  }

  for (const k of ["W","A","S","D"]) { if (e.keys?.[k]) e.heldTicks[k] = (e.heldTicks[k] || 0) + 1; else e.heldTicks[k] = 0; }
  if (e.joyActive) e.heldTicks["JOY"] = (e.heldTicks["JOY"] || 0) + 1; else e.heldTicks["JOY"] = 0;

  const anyHeld = e.keys?.["W"] || e.keys?.["A"] || e.keys?.["S"] || e.keys?.["D"] || e.joyActive;
  let held = 0;
  for (const k of ["W","A","S","D","JOY"]) held = Math.max(held, e.heldTicks[k] || 0);

  const canSwoop = e.state === "IDLE" || e.state === "WALK" || e.state === "SWOOP" || isLocked;
  if (anyHeld && canSwoop) {
    if (held > 10 && e.ki > 0) {
      if (!isLocked) e.state = "SWOOP";
      e.ki -= e.turbo ? 0.4 : 0.2;
      const sp = (e.turbo ? 14 : 9) * spMult;
      if (e.joyActive && e.joyVector) { e.vx = e.joyVector.x * sp; e.vy = e.joyVector.y * sp; }
      else { e.vx = dx * sp; e.vy = dy * sp; }
    } else {
      if (!isLocked) e.state = "WALK";
      const sp = 3.5 * spMult;
      if (e.joyActive && e.joyVector) { e.vx = e.joyVector.x * sp; e.vy = e.joyVector.y * sp; }
      else { e.vx = dx * sp; e.vy = dy * sp; }
    }
  } else {
    if (e.state === "SWOOP" && !isLocked) e.state = "IDLE";
    e.vx *= 0.85; e.vy *= 0.85;
  }

  e.x += e.vx; e.y += e.vy;
  clampEntity(e);
  if (Math.abs(e.vx) > 4 || Math.abs(e.vy) > 4) {
    e.trail.push({ x: e.x, y: e.y, life: 10 });
  }
  e.trail = e.trail.filter(t => { t.life--; return t.life > 0; });
}
