// Отрисовка: мир, сущности, снаряды, эффекты, миникарта

import { S, PICKUP_INFO } from "./state.js";
import * as dom from "./dom.js";
import { updateHUD } from "./hud.js";

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgba(hex, a) {
  const c = hexToRgb(hex);
  return 'rgba(' + c.r + ',' + c.g + ',' + c.b + ',' + a + ')';
}

function drawEntity(ctx, e, isMe, tick) {
  const x = e.x, y = e.y;
  const colors = e.colors || { hair: '#fbbf24', aura: '#3b82f6', kameha: '#3b82f6', trail: '#22d3ee' };
  const angle = Math.atan2(e.facing.y, e.facing.x);
  const bossScale = e.isBoss ? 1.9 : 1;

  if (e.trail && e.trail.length) {
    e.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / e.trail.length) * 0.4;
      if (e.turbo) {
        ctx.fillStyle = colors.trail;
        const a = i > 0 ? Math.atan2(t.y - e.trail[i - 1].y, t.x - e.trail[i - 1].x) : Math.atan2(e.facing.y, e.facing.x);
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(a);
        ctx.beginPath();
        ctx.moveTo(0, -7);
        ctx.lineTo(6, 6);
        ctx.lineTo(-6, 6);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = colors.trail;
        ctx.beginPath(); ctx.arc(t.x, t.y, 10 * bossScale, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }

  if (e.turbo || (e.isBoss && e.invincible > 0)) {
    ctx.save();
    ctx.translate(x, y);
    for (let i = 0; i < 5; i++) {
      const a = tick * 0.3 + (i / 5) * Math.PI * 2;
      const r = (30 + Math.sin(tick * 0.15 + i * 2) * 6) * bossScale;
      ctx.save();
      ctx.translate(Math.cos(a) * r, Math.sin(a) * r);
      ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = e.isBoss ? '#ef4444' : colors.trail;
      ctx.globalAlpha = 0.6 + Math.sin(tick * 0.2 + i) * 0.2;
      ctx.beginPath();
      ctx.moveTo(0, -6);
      ctx.lineTo(5, 5);
      ctx.lineTo(-5, 5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  // boss phase aura
  if (e.isBoss) {
    const phaseColor = e.bossPhase === 3 ? '#a855f7' : e.bossPhase === 2 ? '#f97316' : '#ef4444';
    const pr = 40 * bossScale + Math.sin(tick * 0.15) * 10;
    ctx.fillStyle = rgba(phaseColor, 0.08);
    ctx.beginPath(); ctx.arc(x, y, pr + 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(phaseColor, 0.35);
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, pr, 0, Math.PI * 2); ctx.stroke();
  }

  if ((e.buffShield || 0) > 0) {
    ctx.strokeStyle = 'rgba(147,197,253,' + (0.4 + Math.sin(tick * 0.3) * 0.2) + ')';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(x, y, 26 * bossScale, 0, Math.PI * 2); ctx.stroke();
  }
  if ((e.buffPower || 0) > 0) {
    ctx.strokeStyle = 'rgba(239,68,68,' + (0.3 + Math.sin(tick * 0.25) * 0.15) + ')';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 30 * bossScale, 0, Math.PI * 2); ctx.stroke();
  }

  if (e.state === 'KI_CHARGE' || e.state === 'KAMEHAMEHA_CHARGE' || e.state === 'KI_BEAM_CHARGE' || e.state === 'MELEE_CHARGE') {
    let auraColor = colors.aura;
    let baseSize = 22 * bossScale;
    if (e.state === 'MELEE_CHARGE') {
      auraColor = colors.hair;
      const ratio = Math.min(1, (e.meleeCharge || 0) / 80);
      baseSize = (25 + ratio * 55) * bossScale;
      ctx.strokeStyle = rgba(auraColor, 0.2 + ratio * 0.5);
      ctx.lineWidth = 2 + ratio * 4;
      ctx.beginPath(); ctx.arc(x, y, baseSize + Math.sin(tick * 0.4) * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = rgba(auraColor, 0.15 + ratio * 0.35);
      ctx.lineWidth = 1 + ratio * 2;
      ctx.beginPath(); ctx.arc(x, y, baseSize * 0.65 + Math.sin(tick * 0.4) * 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = rgba(auraColor, 0.08 + ratio * 0.15);
      ctx.beginPath(); ctx.arc(x, y, baseSize * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (e.state === 'KI_BEAM_CHARGE') {
      // маленький эффект зарядки ки-бима
      const ratio = Math.min(1, (e.kiBlastCharge || 0) / (e.kiBlastMaxCharge || 120));
      const c = colors.trail;
      const pulse = (13 + ratio * 16) * bossScale + Math.sin(tick * 0.2) * 4;
      ctx.fillStyle = rgba(c, 0.1 + ratio * 0.1);
      ctx.beginPath(); ctx.arc(x, y, pulse + 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(c, 0.3 + ratio * 0.3);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
      // сгусток энергии перед рукой
      const bx = x + Math.cos(angle) * 30 * bossScale;
      const by = y + Math.sin(angle) * 30 * bossScale;
      const bs = (4 + ratio * 9) * bossScale;
      ctx.shadowColor = c;
      ctx.shadowBlur = 14;
      ctx.fillStyle = rgba(c, 0.85);
      ctx.beginPath(); ctx.arc(bx, by, bs, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, bs * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      const pulse = baseSize + Math.sin(tick * 0.12) * 8 + (e.kamehamehaCharge || 0) * 0.18;
      ctx.fillStyle = rgba(auraColor, 0.12);
      ctx.beginPath(); ctx.arc(x, y, pulse + 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(auraColor, 0.35);
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
    }
  }

  if (e.state === 'KAMEHAMEHA_CHARGE') {
    const ratio = (e.kamehamehaCharge || 0) / 150;
    const bx = x + Math.cos(angle) * 38 * bossScale;
    const by = y + Math.sin(angle) * 38 * bossScale;
    const sz = (12 + ratio * 24) * bossScale;
    ctx.shadowColor = colors.kameha;
    ctx.shadowBlur = 25 + ratio * 25;
    ctx.fillStyle = rgba(colors.kameha, 0.85);
    ctx.beginPath(); ctx.arc(bx, by, sz, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(bx, by, sz * 0.35, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  }

  // Эффект захвата: энергетическая связь с жертвой (держим K)
  if (e.grabTarget) {
    const target = S.gameState.entities.find(en => en.id === e.grabTarget);
    if (target) {
      ctx.save();
      ctx.strokeStyle = 'rgba(251,191,36,0.6)';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#fbbf24';
      ctx.shadowBlur = 12;
      ctx.setLineDash([8, 6]);
      ctx.lineDashOffset = -tick * 2;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(target.x, target.y); ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(251,191,36,0.8)';
      ctx.beginPath(); ctx.arc(target.x, target.y, 4 + Math.sin(tick * 0.5) * 1.5, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
    }
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(bossScale, bossScale);
  if (e.invincible > 0 && Math.floor(tick / 3) % 2 === 0) ctx.globalAlpha = 0.4;
  if (e.hitFlash > 0) ctx.globalAlpha = 0.5;

  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 6, 14, 10, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = e.isBoss ? '#0f0f1a' : '#1e293b';
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = colors.hair;
  ctx.beginPath(); ctx.arc(6, -2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(10, -8); ctx.lineTo(18, -14); ctx.lineTo(14, -4);
  ctx.lineTo(22, -6); ctx.lineTo(16, 0);
  ctx.lineTo(20, 6); ctx.lineTo(12, 4);
  ctx.lineTo(14, 12); ctx.lineTo(8, 6);
  ctx.closePath(); ctx.fill();

  ctx.fillStyle = e.isBoss ? '#ef4444' : '#000';
  ctx.fillRect(10, -4, 4, 3);

  ctx.fillStyle = colors.aura;
  ctx.globalAlpha = 0.6;
  ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = colors.hair;
  if (e.state === 'MELEE' || e.state === 'MELEE_CHARGE') {
    ctx.fillRect(14, -6, 14, 5); ctx.fillRect(14, 1, 14, 5);
  } else if (e.state === 'KI_CHARGE' || e.state === 'KAMEHAMEHA_CHARGE') {
    ctx.fillRect(-8, -10, 6, 5); ctx.fillRect(-8, 5, 6, 5);
  } else if (e.state === 'KI_BLAST') {
    ctx.fillRect(13, -5, 14, 4); // вытянутая вперёд рука
  } else if (e.state === 'SLASH') {
    ctx.fillRect(12, -13, 5, 16); // поднятая для взмаха
  } else {
    ctx.fillRect(-2, -14, 5, 6); ctx.fillRect(-2, 8, 5, 6);
  }
  ctx.restore();
  ctx.globalAlpha = 1;

  const barW = e.isBoss ? 90 : 52;
  ctx.fillStyle = 'rgba(0,0,0,0.6)';
  ctx.fillRect(x - barW / 2, y - 42 * bossScale - 10, barW, 5);
  const hpRatio = Math.max(0, e.hp / e.maxHp);
  ctx.fillStyle = e.isBoss ? '#dc2626' : (hpRatio > 0.3 ? '#ef4444' : '#f87171');
  ctx.fillRect(x - barW / 2, y - 42 * bossScale - 10, barW * hpRatio, 5);

  ctx.fillStyle = isMe ? '#fbbf24' : (e.isBoss ? '#ef4444' : '#e2e8f0');
  ctx.font = 'bold ' + (e.isBoss ? 13 : 10) + 'px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText((e.isBoss ? '👑 ' : e.isBot ? '🤖 ' : '') + (e.name || '???'), x, y - 42 * bossScale - 14);
}

function drawProjectile(ctx, p) {
  const pulse = p.homing ? 1 + 0.3 * Math.sin(((p.fuse ?? 0) + performance.now() * 0.01) * 0.6) : 1;
  const sz = p.size * pulse;
  ctx.shadowColor = p.color; ctx.shadowBlur = p.homing ? 22 : 12;
  ctx.fillStyle = p.color;
  ctx.beginPath(); ctx.arc(p.x, p.y, sz, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.beginPath(); ctx.arc(p.x, p.y, sz * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
}

function drawKamehameha(ctx, e) {
  ctx.save();
  ctx.globalAlpha = e.timer / 40;
  ctx.translate(e.x, e.y);
  ctx.rotate(e.angle);
  ctx.shadowColor = e.color;
  ctx.shadowBlur = 25 + (e.thickness - 25);
  ctx.fillStyle = rgba(e.color, 0.55);
  ctx.fillRect(0, -e.thickness / 2, e.length, e.thickness);
  ctx.fillStyle = rgba(e.color, 0.9);
  ctx.fillRect(0, -e.thickness * 0.15, e.length, e.thickness * 0.3);
  ctx.restore();
}

function drawEffect(ctx, e, tick) {
  if (e.type === 'shockwave') {
    const progress = 1 - e.timer / 40;
    const r = e.length * progress;
    ctx.save();
    ctx.globalAlpha = 1 - progress;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 10 * (1 - progress) + 2;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(e.x, e.y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(e.x, e.y, Math.max(1, r - 16), 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  } else if (e.type === 'slash') {
    // энергетический полумесяц: летит, вращается и исчезает по мере движения
    const progress = 1 - e.timer / 32;
    const alpha = Math.max(0, 1 - progress);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle + progress * 0.6);
    ctx.globalAlpha = alpha;
    const r = 28 + progress * 12;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = 10 * (1 - progress) + 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, -0.95, 0.95);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, r, -0.7, 0.7);
    ctx.stroke();
    ctx.restore();
  } else if (e.type === 'singularity') {
    const alpha = Math.min(1, e.timer / 30);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(e.x, e.y);
    ctx.fillStyle = 'rgba(10,5,20,0.85)';
    ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(e.color, 0.7);
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const start = tick * 0.15 + i * (Math.PI * 2 / 3);
      ctx.beginPath(); ctx.arc(0, 0, 34 + i * 14, start, start + Math.PI * 1.2); ctx.stroke();
    }
    ctx.fillStyle = rgba(e.color, 0.5);
    ctx.beginPath(); ctx.arc(0, 0, 12 + Math.sin(tick * 0.4) * 4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
}

function drawPickup(ctx, p, tick) {
  const info = PICKUP_INFO[p.type] || { emoji: '?', color: '#fff' };
  const bob = Math.sin(tick * 0.12 + p.x * 0.1) * 4;
  const y = p.y + bob;
  const fade = Math.min(1, p.timer / 60);
  ctx.save();
  ctx.globalAlpha = fade;
  ctx.shadowColor = info.color;
  ctx.shadowBlur = 18;
  ctx.fillStyle = 'rgba(15,23,42,0.9)';
  ctx.beginPath(); ctx.arc(p.x, y, 15, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = info.color;
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(p.x, y, 15, 0, Math.PI * 2); ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '14px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(info.emoji, p.x, y + 1);
  ctx.restore();
  ctx.textBaseline = 'alphabetic';
}

export function draw() {
  if (!S.gameState) return;
  const me = S.gameState.entities.find(p => p.id === S.myId);
  if (!me) return;
  S.localTick++;

  const ctx = dom.ctx;
  const world = S.world;
  const W = S.W, H = S.H;

  const targetCamX = me.x - W / 2;
  const targetCamY = me.y - H / 2;
  S.camX += (targetCamX - S.camX) * 0.12;
  S.camY += (targetCamY - S.camY) * 0.12;
  const cx = Math.max(0, Math.min(world.w - W, S.camX));
  const cy = Math.max(0, Math.min(world.h - H, S.camY));

  ctx.fillStyle = '#0a0a1a';
  ctx.fillRect(0, 0, W, H);
  ctx.save();
  ctx.translate(-cx, -cy);

  ctx.strokeStyle = 'rgba(59,130,246,0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < world.w; x += 60) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, world.h); ctx.stroke(); }
  for (let y = 0; y < world.h; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(world.w, y); ctx.stroke(); }

  ctx.strokeStyle = 'rgba(59,130,246,0.08)';
  ctx.beginPath(); ctx.arc(world.w / 2, world.h / 2, 200, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(world.w / 2, world.h / 2, 400, 0, Math.PI * 2); ctx.stroke();

  ctx.strokeStyle = 'rgba(239,68,68,0.25)';
  ctx.lineWidth = 3;
  ctx.strokeRect(0, 0, world.w, world.h);

  if (S.gameState.pickups) S.gameState.pickups.forEach(p => drawPickup(ctx, p, S.localTick));

  S.gameState.effects.forEach(e => {
    if (e.type === 'kamehameha') drawKamehameha(ctx, e);
    else drawEffect(ctx, e, S.localTick);
  });
  S.gameState.projectiles.forEach(p => drawProjectile(ctx, p));

  S.gameState.particles.forEach(p => {
    ctx.globalAlpha = Math.max(0, p.life / 20);
    ctx.fillStyle = p.color;
    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
  });
  ctx.globalAlpha = 1;

  S.gameState.entities.filter(e => e.isBot).forEach(e => drawEntity(ctx, e, e.id === S.myId, S.localTick));
  S.gameState.entities.filter(e => !e.isBot).forEach(e => drawEntity(ctx, e, e.id === S.myId, S.localTick));

  ctx.strokeStyle = 'rgba(34,211,238,0.3)';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(me.x, me.y); ctx.lineTo(me.x + me.facing.x * 30, me.y + me.facing.y * 30); ctx.stroke();

  ctx.restore();

  // миникарта
  const mmCtx = dom.mmCtx;
  const mmW = 120, mmH = 90;
  dom.minimap.width = mmW; dom.minimap.height = mmH;
  mmCtx.fillStyle = 'rgba(5,5,16,0.9)';
  mmCtx.fillRect(0, 0, mmW, mmH);
  const sx = mmW / world.w, sy = mmH / world.h;
  mmCtx.fillStyle = 'rgba(59,130,246,0.3)';
  mmCtx.fillRect(cx * sx, cy * sy, W * sx, H * sy);
  if (S.gameState.pickups) S.gameState.pickups.forEach(p => {
    const info = PICKUP_INFO[p.type] || { color: '#fff' };
    mmCtx.fillStyle = info.color;
    mmCtx.beginPath(); mmCtx.arc(p.x * sx, p.y * sy, 1.5, 0, Math.PI * 2); mmCtx.fill();
  });
  S.gameState.entities.forEach(e => {
    mmCtx.fillStyle = e.isBoss ? '#ef4444' : e.isBot ? '#a855f7' : (e.id === S.myId ? '#fbbf24' : '#22d3ee');
    mmCtx.beginPath(); mmCtx.arc(e.x * sx, e.y * sy, e.isBoss ? 4 : e.id === S.myId ? 3 : 2, 0, Math.PI * 2); mmCtx.fill();
  });

  updateHUD();
}
