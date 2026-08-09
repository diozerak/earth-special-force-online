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

// ============ ВНЕШНОСТЬ (PARAMS фрагментов, как в редакторе) ============
const DEFAULT_LOOK = {
  colors: { hair: '#fbbf24', aura: '#3b82f6', kameha: '#3b82f6', trail: '#22d3ee', skin: '#f2c49b', headBack: '#f2c49b', cloth: '#1e293b' },
  hairLen: 1, fingers: 3, kamehaHands: 'right', beamSide: 'right', gap: 12, twoPalms: true,
  eyes: { count: 1, z: 36, style: 'rect', scale: 1, mid: { x: 0, y: 0, rot: 0 } },
  parts: {
    legL: { on: true, type: 'stub', x: 0, y: 0, rot: 0, z: 4, scale: 1 },
    legR: { on: true, type: 'stub', x: 0, y: 0, rot: 0, z: 4, scale: 1 },
    torso: { on: true, type: 'ellipse', x: 0, y: 0, rot: 0, z: 10, scale: 1 },
    armL: { on: true, x: 0, y: 0, rot: 0, z: 8, scale: 1 },
    armR: { on: true, x: 0, y: 0, rot: 0, z: 8, scale: 1 },
    handL: { on: true, type: 'fist', x: 0, y: 0, rot: 0, frot: 0, z: 15, scale: 1 },
    handR: { on: true, type: 'fist', x: 0, y: 0, rot: 0, frot: 0, z: 15, scale: 1 },
    shoulderL: { on: true, type: 'pauldron', x: 0, y: 0, rot: 0, z: 25, scale: 1 },
    shoulderR: { on: true, type: 'pauldron', x: 0, y: 0, rot: 0, z: 25, scale: 1 },
    chest: { on: true, x: 0, y: 0, rot: 0, z: 28, scale: 1 },
    head: { on: true, x: 0, y: 0, rot: 0, z: 30, scale: 1 },
    hairFront: { on: true, x: 0, y: 0, rot: 0, z: 32, scale: 1 },
    hairMid: { on: false, x: 0, y: 0, rot: 0, z: 32, scale: 1 },
    hairLong: { on: false, x: 0, y: 0, rot: 0, z: 32, scale: 1 },
    antennaL: { on: false, x: 0, y: 0, rot: 0, z: 33, scale: 1 },
    antennaR: { on: false, x: 0, y: 0, rot: 0, z: 33, scale: 1 },
    booTail: { on: false, x: 0, y: 0, rot: 0, z: 33, scale: 1 },
    earL: { on: false, type: 'human', color: '', x: 0, y: 0, rot: 0, z: 29, scale: 1 },
    earR: { on: false, type: 'human', color: '', x: 0, y: 0, rot: 0, z: 29, scale: 1 },
    fingerL1: { on: true, x: 0, y: 0, rot: 0, scale: 1 },
    fingerL2: { on: true, x: 0, y: 0, rot: 0, scale: 1 },
    fingerL3: { on: true, x: 0, y: 0, rot: 0, scale: 1 },
    fingerR1: { on: true, x: 0, y: 0, rot: 0, scale: 1 },
    fingerR2: { on: true, x: 0, y: 0, rot: 0, scale: 1 },
    fingerR3: { on: true, x: 0, y: 0, rot: 0, scale: 1 }
  },
  states: {
    MELEE: { handR: { type: 'fist' } },
    KI_CHARGE: { handL: { type: 'open' }, handR: { type: 'open' } },
    KI_BLAST: { handR: { type: 'open' } },
    KI_BEAM_CHARGE: { handR: { type: 'open' } },
    KAMEHAMEHA_CHARGE: { kamehaHands: 'right', handR: { type: 'cup', rot: 50, frot: -55 }, handL: { type: 'cup', rot: 5, frot: 55 } },
    SUPER_ATTACK: { twoPalms: true, gap: 12, handL: { type: 'cup', rot: -90, frot: -45 }, handR: { type: 'cup', rot: 90, frot: -45 } },
    SWORD: { handR: { type: 'open' } }
  }
};

// слияние внешности: дефолт + look сущности (боты присылают полный шаблон)
function mergeLook(look) {
  if (!look) return DEFAULT_LOOK;
  const P = {
    ...DEFAULT_LOOK, ...look,
    colors: { ...DEFAULT_LOOK.colors, ...(look.colors || {}) },
    eyes: { ...DEFAULT_LOOK.eyes, ...(look.eyes || {}), mid: { ...DEFAULT_LOOK.eyes.mid, ...(((look.eyes || {}).mid) || {}) } },
    parts: { ...DEFAULT_LOOK.parts },
    states: { ...DEFAULT_LOOK.states }
  };
  for (const k in look.parts) P.parts[k] = { ...(DEFAULT_LOOK.parts[k] || {}), ...look.parts[k] };
  for (const st in look.states) {
    P.states[st] = { ...(DEFAULT_LOOK.states[st] || {}) };
    for (const k in look.states[st]) {
      const a = (DEFAULT_LOOK.states[st] || {})[k];
      const b = look.states[st][k];
      P.states[st][k] = (a && b && typeof a === 'object' && typeof b === 'object' && !Array.isArray(a)) ? { ...a, ...b } : b;
    }
  }
  return P;
}

// ===== ПОЗЫ: возвращает геометрию рук/кистей для стейта =====
// Результат: { armL:[x1,y1,x2,y2], armR:[...], handL:{x,y,ha,m}, handR:{...}, sword:bool }
function computePoseRaw(e, o) {
  const gap = (o.gap !== undefined ? o.gap : 12) / 2;
  switch (e.state) {
    case 'MELEE_CHARGE':
      if (e.grabTarget) return {
        armL: [5, -7, 27, -7], armR: null,
        handL: { x: 29, y: -7, ha: 0, m: -1 }, handR: { x: 4, y: 11, ha: 0.5, m: 1 }, sword: false
      };
      return {
        armL: null, armR: null,
        handL: { x: 4, y: -12, ha: 0.5, m: -1 }, handR: { x: 4, y: 11, ha: -0.5, m: 1 }, sword: false
      };
    case 'MELEE':
      return {
        armL: null, armR: [5, 6, 27, 6],
        handL: { x: 4, y: -12, ha: 0.5, m: -1 }, handR: { x: 29, y: 6, ha: 0, m: 1 }, sword: false
      };
    case 'KI_CHARGE':
      return {
        armL: [-9, -8, -3, -7], armR: [-9, 7, -3, 8],
        handL: { x: -4, y: -8, ha: -2.2, m: -1 }, handR: { x: -4, y: 7, ha: 2.2, m: 1 }, sword: false
      };
    case 'KAMEHAMEHA_CHARGE': {
      const r = { armL: null, armR: null, handL: null, handR: null, sword: false };
      if (o.kamehaHands === 'right' || o.kamehaHands === 'both') { r.armR = [2, 9, 12, 12]; r.handR = { x: 15, y: 13, ha: 0, m: 1 }; }
      if (o.kamehaHands === 'left' || o.kamehaHands === 'both') { r.armL = [2, -9, 12, -12]; r.handL = { x: 15, y: -13, ha: 0, m: -1 }; }
      return r;
    }
    case 'SUPER_ATTACK':
      if (o.kibeam) {
        const bs = o.beamSide === 'left' ? -1 : 1;
        if (bs === 1) return {
          armL: null, armR: [5, 4, 25, 4],
          handL: { x: 3, y: -12, ha: 0.5, m: -1 }, handR: { x: 26, y: 4, ha: 0, m: 1 }, sword: false
        };
        return {
          armL: [5, -6, 25, -6], armR: null,
          handL: { x: 26, y: -4, ha: 0, m: -1 }, handR: { x: 4, y: 11, ha: -0.5, m: 1 }, sword: false
        };
      }
      if (o.twoPalms) return {
        armL: [4, -9, 23, -2], armR: [4, 8, 23, 2],
        handL: { x: 26.5, y: -gap, ha: 0, m: -1 }, handR: { x: 26.5, y: gap, ha: 0, m: 1 }, sword: false
      };
      return null; // обычный SUPER_ATTACK — поза по умолчанию
    case 'KI_BEAM_CHARGE':
    case 'KI_BLAST': {
      const bs = o.beamSide === 'left' ? -1 : 1;
      if (bs === 1) return {
        armL: null, armR: [5, 4, 25, 4],
        handL: { x: 3, y: -12, ha: 0.5, m: -1 }, handR: { x: 26, y: 4, ha: 0, m: 1 }, sword: false
      };
      return {
        armL: [5, -6, 25, -6], armR: null,
        handL: { x: 26, y: -4, ha: 0, m: -1 }, handR: { x: 4, y: 11, ha: -0.5, m: 1 }, sword: false
      };
    }
    case 'SWORD':
      return {
        armL: null, armR: [5, 4, 25, 4],
        handL: { x: 3, y: -12, ha: 0.5, m: -1 }, handR: { x: 26, y: 4, ha: 0, m: 1 }, sword: true
      };
    case 'SLASH':
      return {
        armL: [14, 3, 14, -12], armR: null,
        handL: { x: 14.5, y: -14, ha: -Math.PI / 2, m: -1 }, handR: { x: 3, y: 11, ha: -0.5, m: 1 }, sword: false
      };
    default:
      return {
        armL: [-1, -13, 2, -9], armR: [-1, 9, 2, 13],
        handL: { x: 3.5, y: -12, ha: -Math.PI / 2, m: -1 }, handR: { x: 3.5, y: 11, ha: Math.PI / 2, m: 1 }, sword: false
      };
  }
}

function computePose(e, o) {
  return computePoseRaw(e, o);
}

function drawEntity(ctx, e, isMe, tick) {
  // внешность: боты — свой look, игроки — классический вид
  const P = mergeLook(e.look);
  // интерполяция между тиками сервера (30 Гц → плавные 60 fps)
  const ialpha = Math.min(1, (performance.now() - (S.lastStateTime || 0)) / 33.3);
  const x = e.px !== undefined ? e.px + (e.x - e.px) * ialpha : e.x;
  const y = e.py !== undefined ? e.py + (e.y - e.py) * ialpha : e.y;
  const colors = e.colors || P.colors;
  const angle = Math.atan2(e.facing.y, e.facing.x);
  const bossScale = e.isBoss ? 1.9 : 1;
  const D = Math.PI / 180;

  // === ТРЕЙЛ / ТУРБО / АУРЫ БОССА / БАФФЫ (без изменений) ===
  if (e.trail && e.trail.length) {
    e.trail.forEach((t, i) => {
      ctx.globalAlpha = (i / e.trail.length) * 0.4;
      if (e.turbo) {
        ctx.fillStyle = colors.trail;
        const a = i > 0 ? Math.atan2(t.y - e.trail[i - 1].y, t.x - e.trail[i - 1].x) : Math.atan2(e.facing.y, e.facing.x);
        ctx.save(); ctx.translate(t.x, t.y); ctx.rotate(a);
        ctx.beginPath(); ctx.moveTo(0, -7); ctx.lineTo(6, 6); ctx.lineTo(-6, 6); ctx.closePath(); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = colors.trail;
        ctx.beginPath(); ctx.arc(t.x, t.y, 10 * bossScale, 0, Math.PI * 2); ctx.fill();
      }
    });
    ctx.globalAlpha = 1;
  }
  if (e.turbo || (e.isBoss && e.invincible > 0)) {
    ctx.save(); ctx.translate(x, y);
    for (let i = 0; i < 5; i++) {
      const a = tick * 0.3 + (i / 5) * Math.PI * 2;
      const r = (30 + Math.sin(tick * 0.15 + i * 2) * 6) * bossScale;
      ctx.save(); ctx.translate(Math.cos(a) * r, Math.sin(a) * r); ctx.rotate(a + Math.PI / 2);
      ctx.fillStyle = e.isBoss ? '#ef4444' : colors.trail;
      ctx.globalAlpha = 0.6 + Math.sin(tick * 0.2 + i) * 0.2;
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(5, 5); ctx.lineTo(-5, 5); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
    ctx.restore(); ctx.globalAlpha = 1;
  }
  if (e.isBoss) {
    const phaseColor = e.bossPhase === 3 ? '#a855f7' : e.bossPhase === 2 ? '#f97316' : '#ef4444';
    const pr = 40 * bossScale + Math.sin(tick * 0.15) * 10;
    ctx.fillStyle = rgba(phaseColor, 0.08);
    ctx.beginPath(); ctx.arc(x, y, pr + 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(phaseColor, 0.35); ctx.lineWidth = 3;
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

  // === АУРЫ ЧАРДЖЕЙ ===
  const skin = colors.skin || '#f2c49b';
  if (e.state === 'KI_CHARGE' || e.state === 'KAMEHAMEHA_CHARGE' || e.state === 'KI_BEAM_CHARGE' || e.state === 'MELEE_CHARGE') {
    let auraColor = colors.aura;
    let baseSize = 22 * bossScale;
    if (e.state === 'MELEE_CHARGE') {
      auraColor = colors.hair;
      const ratio = Math.min(1, (e.meleeCharge || 0) / 80);
      baseSize = (25 + ratio * 55) * bossScale;
      ctx.strokeStyle = rgba(auraColor, 0.2 + ratio * 0.5); ctx.lineWidth = 2 + ratio * 4;
      ctx.beginPath(); ctx.arc(x, y, baseSize + Math.sin(tick * 0.4) * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = rgba(auraColor, 0.15 + ratio * 0.35); ctx.lineWidth = 1 + ratio * 2;
      ctx.beginPath(); ctx.arc(x, y, baseSize * 0.65 + Math.sin(tick * 0.4) * 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = rgba(auraColor, 0.08 + ratio * 0.15);
      ctx.beginPath(); ctx.arc(x, y, baseSize * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (e.state === 'KAMEHAMEHA_CHARGE') {
      auraColor = colors.kameha;
      const ratio = Math.min(1, (e.kamehamehaCharge || 0) / (e.kamehamehaMaxCharge || 450));
      baseSize = (25 + ratio * 55) * bossScale;
      ctx.strokeStyle = rgba(auraColor, 0.2 + ratio * 0.5); ctx.lineWidth = 2 + ratio * 4;
      ctx.beginPath(); ctx.arc(x, y, baseSize + Math.sin(tick * 0.4) * 5, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = rgba(auraColor, 0.15 + ratio * 0.35); ctx.lineWidth = 1 + ratio * 2;
      ctx.beginPath(); ctx.arc(x, y, baseSize * 0.65 + Math.sin(tick * 0.4) * 2.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = rgba(auraColor, 0.08 + ratio * 0.15);
      ctx.beginPath(); ctx.arc(x, y, baseSize * 0.5, 0, Math.PI * 2); ctx.fill();
    } else if (e.state === 'KI_BEAM_CHARGE') {
      const ratio = Math.min(1, (e.kiBlastCharge || 0) / (e.kiBlastMaxCharge || 120));
      const c = colors.trail;
      const pulse = (13 + ratio * 16) * bossScale + Math.sin(tick * 0.2) * 4;
      ctx.fillStyle = rgba(c, 0.1 + ratio * 0.1);
      ctx.beginPath(); ctx.arc(x, y, pulse + 10, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(c, 0.3 + ratio * 0.3); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
    } else {
      const pulse = baseSize + Math.sin(tick * 0.12) * 8 + (e.kamehamehaCharge || 0) * 0.18;
      ctx.fillStyle = rgba(auraColor, 0.12);
      ctx.beginPath(); ctx.arc(x, y, pulse + 18, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = rgba(auraColor, 0.35); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, pulse, 0, Math.PI * 2); ctx.stroke();
    }
  }

  // шары камехамехи / сгусток ки-бима — позиции вычисляются после позы (см. ниже)

  // === СБОРКА ФРАГМЕНТОВ ===
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(bossScale, bossScale);
  if (e.invincible > 0 && Math.floor(tick / 3) % 2 === 0) ctx.globalAlpha = 0.4;
  if (e.hitFlash > 0) ctx.globalAlpha = 0.5;

  // активные лучи (для позы выстрела)
  const activeKameha = S.gameState && S.gameState.effects.some(f => f.type === 'kamehameha' && f.owner === e.id);
  const activeKibeam = S.gameState && S.gameState.effects.some(f => f.type === 'kibeam' && f.owner === e.id);
  // параметры частей: глобальные + оверлей текущего стейта
  const stO = P.states[e.state] || {};
  const part = id => ({ ...P.parts[id], ...((stO[id]) || {}) });

  const o = {
    kamehaHands: stO.kamehaHands || P.kamehaHands,
    beamSide: stO.beamSide || P.beamSide,
    gap: stO.gap !== undefined ? stO.gap : P.gap,
    twoPalms: activeKameha ? true : (stO.twoPalms !== undefined ? stO.twoPalms : P.twoPalms),
    kibeam: activeKibeam
  };
  const pose = computePose(e, o) || computePose({ ...e, state: 'IDLE' }, o);
  const handL = part('handL'), handR = part('handR');
  const armLp = part('armL'), armRp = part('armR');

  const parts = [];
  const push = (p, fn) => { if (p && p.on !== false && fn) parts.push({ z: p.z !== undefined ? p.z : 10, fn }); };

  // --- примитивы ---
  const drawArmSeg = (seg, p) => {
    if (!seg) return;
    // поворот сегмента вокруг плеча + сдвиг
    let [x1, y1, x2, y2] = seg;
    const r = (p.rot || 0) * D;
    if (r) {
      const c = Math.cos(r), s = Math.sin(r);
      const ex = x2 - x1, ey = y2 - y1;
      x2 = x1 + ex * c - ey * s; y2 = y1 + ex * s + ey * c;
    }
    x1 += p.x || 0; y1 += p.y || 0; x2 += p.x || 0; y2 += p.y || 0;
    const dx = x2 - x1, dy = y2 - y1;
    const len = Math.hypot(dx, dy) || 1;
    const a = Math.atan2(dy, dx);
    const sc = p.scale || 1;
    ctx.fillStyle = P.colors.cloth || '#1e293b';
    ctx.beginPath(); ctx.ellipse(x1 + dx * 0.32 * sc, y1 + dy * 0.32 * sc, len * 0.4 * sc, 3.2 * sc, a, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x1 + dx * 0.74 * sc, y1 + dy * 0.74 * sc, len * 0.32 * sc, 2.7 * sc, a, 0, Math.PI * 2); ctx.fill();
  };

  const drawPalm = (hp, p) => {
    if (!hp) return;
    const hx = hp.x + (p.x || 0), hy = hp.y + (p.y || 0);
    const sc = p.scale || 1;
    if (p.type === 'cup') drawCup(hx, hy, hp.m, (p.rot || 0) * D, (p.frot || 0) * D, sc);
    else drawHand(hx, hy, (hp.ha || 0) + (p.rot || 0) * D * (hp.m || 1), hp.m, p.type === 'open', (p.frot || 0) * D, sc);
  };

  const drawHand = (hx, hy, ha, m, open, frot, sc) => {
    const r = 4.2 * (sc || 1);
    const cs = Math.cos(ha), sn = Math.sin(ha);
    const fr = (frot || 0) * (m || 1);
    const fc = Math.cos(fr), fs = Math.sin(fr);
    const f = (dx, dy) => {
      const rx = dx * fc - dy * fs, ry = dx * fs + dy * fc;
      return [hx + rx * cs - ry * sn * m, hy + rx * sn + ry * cs * m];
    };
    ctx.fillStyle = skin;
    ctx.beginPath(); ctx.arc(hx, hy, r, 0, Math.PI * 2); ctx.fill();
    // палец-фрагмент: x/y/rot/scale/on; поворот и масштаб вокруг основания
    const fid = m < 0 ? 'fingerL' : 'fingerR'; // пальцы левой/правой руки — отдельные фрагменты
    const fingerTF = (i, base) => {
      const fp = part(fid + i) || P.parts['finger' + i] || {};
      const fr2 = (fp.rot || 0) * D * (m || 1);
      const c2 = Math.cos(fr2), s2 = Math.sin(fr2);
      const k2 = fp.scale || 1;
      return (pt) => {
        const dx = (pt[0] - base[0]) * k2, dy = (pt[1] - base[1]) * k2;
        const rx = dx * c2 - dy * s2, ry = dx * s2 + dy * c2;
        return f(base[0] + rx + (fp.x || 0), base[1] + ry + (fp.y || 0));
      };
    };
    if (open) {
      ctx.strokeStyle = skin;
      const cap = (a, b, w) => { ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); };
      const defs = [
        { b: [r * 0.6, -r * 0.28], m1: [r * 1.35, -r * 0.36], t: [r * 2.05, -r * 0.44], w: r * 0.55 },
        { b: [r * 0.5, r * 0.42], m1: [r * 1.2, r * 0.54], t: [r * 1.85, r * 0.66], w: r * 0.48 },
        { b: [-r * 0.1, r * 0.9], m1: [r * 0.2, r * 1.35], t: [r * 0.5, r * 1.75], w: r * 0.45 }
      ];
      const nF = Math.max(1, Math.min(3, P.fingers || 3));
      for (let i = 0; i < nF; i++) {
        const fp = part(fid + (i + 1)) || P.parts['finger' + (i + 1)] || {};
        if (fp.on === false) continue;
        const tf = fingerTF(i + 1, defs[i].b);
        const k2 = fp.scale || 1;
        cap(tf(defs[i].b), tf(defs[i].m1), defs[i].w * k2);
        cap(tf(defs[i].m1), tf(defs[i].t), defs[i].w * 0.85 * k2);
      }
    } else {
      // костяшки кулака — управляются теми же палец-фрагментами
      const bumps = [
        { c: [r * 1.05, -r * 0.5], br: r * 0.45, fi: 1 },
        { c: [r * 1.2, 0], br: r * 0.48, fi: 2 },
        { c: [r * 1.05, r * 0.5], br: r * 0.45, fi: 2 },
        { c: [-r * 0.1, r * 1.0], br: r * 0.48, fi: 3 }
      ];
      for (const bp of bumps) {
        const fp = part(fid + bp.fi) || P.parts['finger' + bp.fi] || {};
        if (fp.on === false) continue;
        const tf = fingerTF(bp.fi, bp.c);
        const k2 = fp.scale || 1;
        const ctr = tf(bp.c);
        ctx.beginPath();
        ctx.arc(ctr[0], ctr[1], bp.br * k2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawCup = (hx, hy, m, rot, frot, sc) => {
    const k = sc || 1;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(rot || 0);
    ctx.fillStyle = skin; ctx.strokeStyle = skin;
    ctx.lineWidth = 3.5 * k; ctx.lineCap = 'round';
    ctx.save();
    ctx.translate(2 * k, 0);
    ctx.rotate((frot || 0) * (m || 1));
    ctx.beginPath(); ctx.arc(0, 0, 5 * k, Math.PI - 0.8, Math.PI + 0.8); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(3 * k, 0, 4.5 * k, 2.8 * k, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6.5 * k, -2.6 * m * k, 2 * k, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };

  // --- фрагменты ---
  // тень
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.ellipse(0, 6, 14, 10, 0, 0, Math.PI * 2); ctx.fill();

  // ноги (левая и правая — по отдельности)
  const drawLeg = (p, dx) => {
    ctx.save();
    ctx.translate(dx + (p.x || 0), 14 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    if (p.type === 'stub') {
      ctx.fillStyle = P.colors.cloth || '#1e293b';
      ctx.beginPath(); ctx.ellipse(0, 2, 4, 6.5, 0.1, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'boots') {
      ctx.lineCap = 'round';
      ctx.strokeStyle = P.colors.cloth || '#1e293b';
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(1.5, 9); ctx.stroke();
    }
    ctx.restore();
  };
  push(part('legL'), () => drawLeg(part('legL'), -3.5));
  push(part('legR'), () => drawLeg(part('legR'), 3.5));

  // руки (сегменты)
  push(armLp, () => drawArmSeg(pose.armL, armLp));
  push(armRp, () => drawArmSeg(pose.armR, armRp));

  // торс
  push(part('torso'), () => {
    const p = part('torso');
    ctx.save();
    ctx.translate(p.x || 0, p.y || 0);
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = e.isBoss ? '#0f0f1a' : (P.colors.cloth || '#1e293b');
    if (p.type === 'rect') ctx.fillRect(-13, -12, 26, 24);
    else if (p.type === 'slim') { ctx.beginPath(); ctx.ellipse(0, 0, 12.5, 15.5, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(0, 0, 16, 14, 0, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
  });

  // кисти
  push(handL, () => drawPalm(pose.handL, handL));
  push(handR, () => drawPalm(pose.handR, handR));

  // меч: привязан к ПРАВОЙ ладони, вибрирует когда заряжен.
  // Длина клинка растёт с зарядом; виден в любом стейте, пока активен.
  if (pose.sword || (e.swordActiveTimer || 0) > 0) {
    parts.push({ z: 16, fn: () => {
      const chargeRatio = (e.swordCharge !== undefined && e.swordCharge !== null)
        ? Math.min(1, e.swordCharge / 450)
        : (e.swordPower || 0);
      const hp2 = pose.handR;
      const sx = (hp2 ? hp2.x : 24) + (handR.x || 0);
      const sy = (hp2 ? hp2.y : 0) + (handR.y || 0);
      const vib = (e.swordActiveTimer || 0) > 0 ? Math.sin(tick * 1.6) * 0.9 : 0;
      const pu = (1 + Math.sin(tick * 0.25) * 0.15) * (0.55 + chargeRatio * 1.7) * (handR.scale || 1);
      ctx.save();
      // клинок выступает вперёд от ладони (персонаж смотрит в +x)
      ctx.translate(sx + 6, sy + vib);
      ctx.rotate(vib * 0.05);
      ctx.shadowColor = colors.kameha; ctx.shadowBlur = 16;
      ctx.fillStyle = rgba(colors.kameha, 0.55);
      ctx.beginPath();
      ctx.moveTo(0, -4.5 * pu); ctx.lineTo(18 * pu, 0); ctx.lineTo(0, 4.5 * pu);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.75)';
      ctx.beginPath();
      ctx.moveTo(0, -1.8 * pu); ctx.lineTo(13 * pu, 0); ctx.lineTo(0, 1.8 * pu);
      ctx.closePath(); ctx.fill();
      ctx.restore();
    }});
  }

  // плечи
  const drawShoulder = (p, side) => {
    ctx.save();
    ctx.translate(2 + (p.x || 0), (side < 0 ? -10 : 9) + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = e.isBoss ? '#0f0f1a' : (P.colors.cloth || '#1e293b');
    if (p.type === 'plate') {
      ctx.beginPath();
      ctx.moveTo(-4, -6); ctx.lineTo(5, -4); ctx.lineTo(6, 3); ctx.lineTo(0, 7); ctx.lineTo(-6, 3);
      ctx.closePath(); ctx.fill();
    } else if (p.type === 'round') {
      ctx.beginPath(); ctx.arc(0, 0, 5, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(0, 0, 6.5, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  };
  push(part('shoulderL'), () => drawShoulder(part('shoulderL'), -1));
  push(part('shoulderR'), () => drawShoulder(part('shoulderR'), 1));

  // ромб ауры на груди
  push(part('chest'), () => {
    const p = part('chest');
    ctx.save();
    ctx.translate(p.x || 0, p.y || 0);
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = colors.aura;
    ctx.globalAlpha = 0.6;
    ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(4, -6); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();
  });

  // голова
  push(part('head'), () => {
    const p = part('head');
    ctx.save();
    ctx.translate(6 + (p.x || 0), -2 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = (P.hairLen > 0) ? (colors.headBack || skin) : skin;
    ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // волосы: три независимых фрагмента (длина 1 — передние, 2 — средние, 3 — длинные)
  push(part('hairLong'), () => {
    const p = part('hairLong');
    ctx.save();
    ctx.translate(6 + (p.x || 0), -2 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = colors.hair;
    const sway = Math.sin(tick * 0.08) * 2;
    ctx.beginPath();
    ctx.moveTo(-4, -8); ctx.lineTo(-20, -10 + sway); ctx.lineTo(-32, -2 + sway);
    ctx.lineTo(-24, 6 + sway); ctx.lineTo(-14, 11);
    ctx.closePath(); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-6, 8); ctx.lineTo(-18, 17 + sway); ctx.lineTo(-8, 14);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  });
  push(part('hairMid'), () => {
    const p = part('hairMid');
    ctx.save();
    ctx.translate(6 + (p.x || 0), -2 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.moveTo(-6, -8); ctx.lineTo(-18, -9); ctx.lineTo(-13, -3);
    ctx.lineTo(-20, 0); ctx.lineTo(-12, 5); ctx.lineTo(-16, 10); ctx.lineTo(-8, 10);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  });
  push(part('hairFront'), () => {
    const p = part('hairFront');
    ctx.save();
    ctx.translate(6 + (p.x || 0), -2 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.fillStyle = colors.hair;
    ctx.beginPath();
    ctx.moveTo(4, -6); ctx.lineTo(12, -12); ctx.lineTo(8, -2);
    ctx.lineTo(16, -4); ctx.lineTo(10, 2); ctx.lineTo(14, 8); ctx.lineTo(6, 6);
    ctx.lineTo(8, 14); ctx.lineTo(2, 8);
    ctx.closePath(); ctx.fill();
    ctx.restore();
  });

  // уши (левое/правое, типы: human — овал с мочкой-кругом, ovalCircle — овал с чёрным кругом, elf — треугольник+овал+круг)
  const drawEar = (p, side) => {
    ctx.save();
    ctx.translate((side < 0 ? 0 : 4) + (p.x || 0), (side < 0 ? -7 : 2) + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    const ec = p.color || skin;
    ctx.fillStyle = ec;
    if (p.type === 'ovalCircle') {
      ctx.beginPath(); ctx.ellipse(0, 0, 3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fill();
    } else if (p.type === 'elf') {
      ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(4.5, -1); ctx.lineTo(3, 3); ctx.lineTo(-1, 2); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0.5, 1.5, 2.5, 3.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#000';
      ctx.beginPath(); ctx.arc(0.5, 1, 1.2, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 0, 3, 4.5, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(0, 4.5, 1.8, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
  push(part('earL'), () => drawEar(part('earL'), -1));
  push(part('earR'), () => drawEar(part('earR'), 1));

  // антенны (как у пикколо) — левая и правая по отдельности
  const drawAntenna = (p, bx) => {
    ctx.save();
    ctx.translate(6 + (p.x || 0), -2 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.strokeStyle = colors.hair; ctx.fillStyle = colors.hair;
    ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(bx, -8);
    ctx.quadraticCurveTo(bx - 2, -14, bx - 3, -17);
    ctx.stroke();
    ctx.beginPath(); ctx.arc(bx - 3, -17.5, 1.9, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
  push(part('antennaL'), () => drawAntenna(part('antennaL'), -1));
  push(part('antennaR'), () => drawAntenna(part('antennaR'), 5));

  // отросток на голове (как у маджин буу)
  push(part('booTail'), () => {
    const p = part('booTail');
    ctx.save();
    ctx.translate(6 + (p.x || 0), -2 + (p.y || 0));
    ctx.rotate((p.rot || 0) * D);
    ctx.scale(p.scale || 1, p.scale || 1);
    ctx.strokeStyle = colors.hair; ctx.fillStyle = colors.hair;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(2, -9);
    ctx.quadraticCurveTo(6, -16, 4, -22);
    ctx.stroke();
    ctx.beginPath(); ctx.ellipse(4, -23.5, 3.2, 4.2, 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  });

  // глаза
  push({ z: P.eyes.z, on: true }, () => {
    const E = { ...P.eyes, ...(stO.eyes || {}) };
    if (E.on === false) return;
    const esc = E.scale || 1;
    const eyeCol = E.color || (e.isBoss ? '#ef4444' : '#000');
    const eye = (ex, ey, rot) => {
      ctx.save();
      ctx.translate(ex, ey);
      ctx.rotate((rot || 0) * D);
      ctx.scale(esc, esc);
      if (E.style === 'circle') {
        ctx.fillStyle = '#fff';
        ctx.beginPath(); ctx.arc(0, 0, 2.4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = eyeCol;
        ctx.beginPath(); ctx.arc(0.8, 0, 1.2, 0, Math.PI * 2); ctx.fill();
      } else if (E.style === 'angry') {
        ctx.fillStyle = eyeCol;
        ctx.beginPath();
        ctx.moveTo(-2.5, -2.5); ctx.lineTo(2.5, -1); ctx.lineTo(1.5, 2); ctx.lineTo(-2.5, 0.5);
        ctx.closePath(); ctx.fill();
      } else if (E.style === 'line') {
        ctx.fillStyle = eyeCol;
        ctx.fillRect(-2.7, -0.8, 5.5, 1.6);
      } else if (E.style === 'glow') {
        ctx.save();
        ctx.shadowColor = e.isBoss ? '#ef4444' : '#67e8f9';
        ctx.shadowBlur = 8;
        ctx.fillStyle = E.color || (e.isBoss ? '#ef4444' : '#a5f3fc');
        ctx.beginPath(); ctx.arc(0, 0, 1.9, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = eyeCol;
        ctx.fillRect(-2, -1.5, 4, 3);
      }
      ctx.restore();
    };
    if (E.count === 1) eye(10.5 + E.mid.x, -3.5 + E.mid.y, E.mid.rot);
    else if (E.count === 2) { eye(10.5 + E.mid.x, -6.2 + E.mid.y, E.mid.rot); eye(10.5 + E.mid.x, -0.8 + E.mid.y, E.mid.rot); }
    else { eye(10.5, -6.2); eye(10.5, -0.8); eye(10.5 + E.mid.x, -3.5 + E.mid.y, E.mid.rot); }
  });

  // трос захвата (как в игре)
  if (e.grabTarget && S.gameState) {
    const target = S.gameState.entities.find(en => en.id === e.grabTarget);
    if (target) {
      const dxw = target.x - x, dyw = target.y - y;
      const bs = bossScale || 1;
      const lx = (dxw * Math.cos(angle) + dyw * Math.sin(angle)) / bs;
      const ly = (-dxw * Math.sin(angle) + dyw * Math.cos(angle)) / bs;
      parts.push({ z: 90, fn: () => {
        ctx.save();
        ctx.strokeStyle = 'rgba(251,191,36,0.6)';
        ctx.lineWidth = 3;
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = -tick * 2;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(lx, ly); ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(251,191,36,0.8)';
        ctx.beginPath(); ctx.arc(lx, ly, 4 + Math.sin(tick * 0.5) * 1.5, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }});
    }
  }

  // === РЕНДЕР ПО Z ===
  parts.sort((a, b) => a.z - b.z);
  for (const p of parts) p.fn();

  ctx.restore();
  ctx.globalAlpha = 1;

  // === ЭФФЕКТЫ ПЕРЕД ЛИЦОМ (шары камехи / сгусток ки-бима) ===
  if (e.state === 'KAMEHAMEHA_CHARGE') {
    const ratio = (e.kamehamehaCharge || 0) / 150;
    const sz = (12 + ratio * 24) * bossScale;
    const cups = [];
    if (pose.handR) cups.push({ hx: pose.handR.x + (handR.x || 0), hy: pose.handR.y + (handR.y || 0), s: 1 });
    if (pose.handL) cups.push({ hx: pose.handL.x + (handL.x || 0), hy: pose.handL.y + (handL.y || 0), s: -1 });
    for (const c of cups) {
      const bx = x + ((c.hx + 1) * Math.cos(angle) - (c.hy - 9 * c.s) * Math.sin(angle)) * bossScale;
      const by = y + ((c.hx + 1) * Math.sin(angle) + (c.hy - 9 * c.s) * Math.cos(angle)) * bossScale;
      ctx.shadowColor = colors.kameha; ctx.shadowBlur = 25 + ratio * 25;
      ctx.fillStyle = rgba(colors.kameha, 0.85);
      ctx.beginPath(); ctx.arc(bx, by, sz, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, sz * 0.35, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  if (e.state === 'KI_BEAM_CHARGE') {
    const ratio = Math.min(1, (e.kiBlastCharge || 0) / (e.kiBlastMaxCharge || 120));
    const hp = o.beamSide === 'left' ? pose.handL : pose.handR;
    const pp = o.beamSide === 'left' ? handL : handR;
    if (hp) {
      const lx = hp.x + (pp.x || 0) + 6, ly = hp.y + (pp.y || 0);
      const bx = x + (lx * Math.cos(angle) - ly * Math.sin(angle)) * bossScale;
      const by = y + (lx * Math.sin(angle) + ly * Math.cos(angle)) * bossScale;
      const bs = (4 + ratio * 9) * bossScale;
      ctx.shadowColor = colors.trail; ctx.shadowBlur = 14;
      ctx.fillStyle = rgba(colors.trail, 0.85);
      ctx.beginPath(); ctx.arc(bx, by, bs, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(bx, by, bs * 0.4, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
  if (e.state === 'MELEE') {
    const hp = pose.handR;
    if (hp) {
      const hx2 = hp.x + (handR.x || 0), hy2 = hp.y + (handR.y || 0);
      const fx = x + (hx2 * Math.cos(angle) - hy2 * Math.sin(angle)) * bossScale;
      const fy = y + (hx2 * Math.sin(angle) + hy2 * Math.cos(angle)) * bossScale;
      ctx.strokeStyle = skin; ctx.lineWidth = 2;
      const fl = 8 + Math.sin(tick * 0.6) * 2;
      for (let i = 0; i < 4; i++) {
        const a2 = i * (Math.PI / 2) + tick * 0.1;
        ctx.beginPath();
        ctx.moveTo(fx + Math.cos(a2) * 5, fy + Math.sin(a2) * 5);
        ctx.lineTo(fx + Math.cos(a2) * fl, fy + Math.sin(a2) * fl);
        ctx.stroke();
      }
    }
  }

  // полоска HP + имя
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
    const k = e.sizeMul || 1; // крупность от процента заряда меча
    const progress = 1 - e.timer / 32;
    const alpha = Math.max(0, 1 - progress);
    ctx.save();
    ctx.translate(e.x, e.y);
    ctx.rotate(e.angle + progress * 0.6);
    ctx.globalAlpha = alpha;
    const r = (28 + progress * 12) * k;
    ctx.shadowColor = e.color;
    ctx.shadowBlur = 18 * k;
    ctx.strokeStyle = e.color;
    ctx.lineWidth = (10 * (1 - progress) + 3) * k;
    ctx.beginPath();
    ctx.arc(0, 0, r, -0.95, 0.95);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 3 * k;
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

function drawSpaceObject(ctx, o, tick) {
  ctx.save();
  ctx.translate(o.x, o.y);
  if (o.type === 'debris') {
    // обломок корабля
    ctx.rotate(o.rot);
    ctx.fillStyle = '#6b7280';
    ctx.strokeStyle = '#4b5563';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-o.radius, -4); ctx.lineTo(-2, -o.radius); ctx.lineTo(o.radius, -o.radius * 0.3);
    ctx.lineTo(o.radius * 0.5, o.radius); ctx.lineTo(-o.radius * 0.6, o.radius * 0.7);
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (o.type === 'asteroid') {
    ctx.rotate(o.rot * 0.3);
    ctx.fillStyle = '#8a6b4f';
    ctx.beginPath(); ctx.arc(0, 0, o.radius, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#6f543d';
    ctx.beginPath(); ctx.arc(-o.radius * 0.3, -o.radius * 0.2, o.radius * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.radius * 0.35, o.radius * 0.25, o.radius * 0.22, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(o.radius * 0.1, -o.radius * 0.45, o.radius * 0.16, 0, Math.PI * 2); ctx.fill();
  } else if (o.type === 'comet') {
    // комета: хвост + свечение
    const a = Math.atan2(o.vy, o.vx);
    ctx.save();
    ctx.rotate(a);
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#67e8f9';
    for (let i = 1; i <= 3; i++) {
      ctx.beginPath();
      ctx.moveTo(-o.radius - i * 8, -o.radius * 0.55 / i);
      ctx.lineTo(-o.radius - i * 15, 0);
      ctx.lineTo(-o.radius - i * 8, o.radius * 0.55 / i);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 18;
    ctx.fillStyle = '#a5f3fc';
    ctx.beginPath(); ctx.arc(0, 0, o.radius * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
  } else if (o.type === 'mothership') {
    // большой корабль: корпус + мигалки + трещины по мере урона
    ctx.rotate(o.rot * 0.15);
    ctx.fillStyle = '#475569';
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-o.radius, 0);
    ctx.quadraticCurveTo(-o.radius * 0.4, -o.radius * 0.75, o.radius * 0.7, -o.radius * 0.35);
    ctx.quadraticCurveTo(o.radius, 0, o.radius * 0.7, o.radius * 0.35);
    ctx.quadraticCurveTo(-o.radius * 0.4, o.radius * 0.75, -o.radius, 0);
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath(); ctx.ellipse(o.radius * 0.2, 0, o.radius * 0.4, o.radius * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    const blink = Math.sin(tick * 0.2) > 0;
    ctx.fillStyle = blink ? '#f87171' : '#7f1d1d';
    ctx.beginPath(); ctx.arc(-o.radius * 0.6, -o.radius * 0.3, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(-o.radius * 0.6, o.radius * 0.3, 3, 0, Math.PI * 2); ctx.fill();
    const dmgRatio = 1 - o.hp / o.maxHp;
    ctx.strokeStyle = 'rgba(15,23,42,0.8)';
    ctx.lineWidth = 2;
    for (let i = 0; i < Math.floor(dmgRatio * 5); i++) {
      ctx.beginPath();
      ctx.moveTo(-o.radius * 0.5 + i * 12, -o.radius * 0.3);
      ctx.lineTo(-o.radius * 0.3 + i * 12, o.radius * 0.25);
      ctx.stroke();
    }
  } else if (o.type === 'anomaly') {
    // гравитационная аномалия
    ctx.fillStyle = 'rgba(10,5,20,0.85)';
    ctx.beginPath(); ctx.arc(0, 0, 20, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(168,85,247,0.7)';
    ctx.lineWidth = 3;
    for (let i = 0; i < 3; i++) {
      const st = tick * 0.15 + i * 2.09;
      ctx.beginPath(); ctx.arc(0, 0, 20 + i * 9, st, st + Math.PI * 1.2); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(168,85,247,0.6)';
    ctx.beginPath(); ctx.arc(0, 0, 8 + Math.sin(tick * 0.4) * 3, 0, Math.PI * 2); ctx.fill();
  } else {
    // радиоактивное поле
    const pulse = 0.22 + Math.sin(tick * 0.1) * 0.08;
    ctx.fillStyle = 'rgba(74,222,128,' + pulse + ')';
    ctx.beginPath(); ctx.arc(0, 0, o.radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(74,222,128,0.5)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 8]);
    ctx.lineDashOffset = -tick;
    ctx.beginPath(); ctx.arc(0, 0, o.radius, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.font = '22px system-ui';
    ctx.textAlign = 'center';
    ctx.fillText('☢', 0, 8);
  }
  ctx.restore();
  // полоска HP разрушаемых объектов
  if (o.maxHp > 1 && o.hp < o.maxHp) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(o.x - 18, o.y - o.radius - 10, 36, 4);
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(o.x - 18, o.y - o.radius - 10, 36 * Math.max(0, o.hp / o.maxHp), 4);
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

  if (S.gameState.spaceObjects) S.gameState.spaceObjects.forEach(o => drawSpaceObject(ctx, o, S.localTick));
  if (S.gameState.pickups) S.gameState.pickups.forEach(p => drawPickup(ctx, p, S.localTick));

  S.gameState.effects.forEach(e => {
    if (e.type === 'kamehameha' || e.type === 'kibeam') drawKamehameha(ctx, e);
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
