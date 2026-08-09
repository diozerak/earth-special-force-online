// Лог, баннеры событий и HUD

import { S, PICKUP_INFO } from "./state.js";
import * as dom from "./dom.js";

export function log(msg, color = '#94a3b8') {
  const d = document.createElement('div');
  d.style.color = color;
  d.textContent = '> ' + msg;
  dom.logEl.appendChild(d);
  dom.logEl.scrollTop = dom.logEl.scrollHeight;
  if (dom.logEl.children.length > 30) dom.logEl.removeChild(dom.logEl.firstChild);
}

export function showBanner(text, color) {
  dom.eventBanner.textContent = text;
  dom.eventBanner.style.color = color || '#ef4444';
  dom.eventBanner.style.opacity = '1';
  if (S.bannerTimeout) clearTimeout(S.bannerTimeout);
  S.bannerTimeout = setTimeout(() => { dom.eventBanner.style.opacity = '0'; }, 2800);
}

export function updateHUD() {
  if (!S.gameState) return;
  const me = S.gameState.entities.find(p => p.id === S.myId);
  if (!me) return;

  dom.hpFill.style.width = (me.hp / me.maxHp * 100) + '%';
  dom.kiFill.style.width = (me.ki / me.maxKi * 100) + '%';
  dom.hpText.textContent = Math.ceil(me.hp) + '/' + me.maxHp;
  dom.kiText.textContent = Math.ceil(me.ki) + '/' + me.maxKi;
  dom.stateText.textContent = me.state;
  dom.levelText.textContent = me.level;

  const expRatio = Math.min(1, me.exp / me.expToNext);
  dom.expFill.style.width = (expRatio * 100) + '%';
  dom.expText.textContent = Math.floor(me.exp) + '/' + me.expToNext;

  // buff chips
  const chips = [
    [dom.buffPower, dom.buffPowerT, me.buffPower, 30],
    [dom.buffSpeed, dom.buffSpeedT, me.buffSpeed, 30],
    [dom.buffShield, dom.buffShieldT, me.buffShield, 30]
  ];
  for (const [el, tEl, val, rate] of chips) {
    if (val > 0) { el.style.display = 'block'; tEl.textContent = Math.ceil(val / rate) + 's'; }
    else el.style.display = 'none';
  }

  if (me.state === 'KAMEHAMEHA_CHARGE') {
    const ratio = Math.min(1, (me.kamehamehaCharge || 0) / 150);
    dom.chargeBar.style.display = 'block'; dom.chargeLabel.style.display = 'block';
    dom.chargeFill.style.width = (ratio * 100) + '%';
    dom.chargeFill.style.background = me.colors.kameha;
    dom.chargeLabel.style.color = me.colors.kameha;
    dom.chargeLabel.textContent = 'KAMEHAMEHA ' + Math.floor(ratio * 100) + '%';
  } else if (me.state === 'KI_BEAM_CHARGE') {
    const ratio = Math.min(1, (me.kiBlastCharge || 0) / (me.kiBlastMaxCharge || 120));
    dom.chargeBar.style.display = 'block'; dom.chargeLabel.style.display = 'block';
    dom.chargeFill.style.width = (ratio * 100) + '%';
    dom.chargeFill.style.background = me.colors.trail;
    dom.chargeLabel.style.color = me.colors.trail;
    dom.chargeLabel.textContent = 'KI BEAM ' + Math.floor(ratio * 100) + '%';
  } else if (me.state === 'MELEE_CHARGE') {
    const ratio = Math.min(1, (me.meleeCharge || 0) / 80);
    dom.chargeBar.style.display = 'block'; dom.chargeLabel.style.display = 'block';
    dom.chargeFill.style.width = (ratio * 100) + '%';
    dom.chargeFill.style.background = me.colors.hair;
    dom.chargeLabel.style.color = me.colors.hair;
    dom.chargeLabel.textContent = 'MELEE CHARGE ' + Math.floor(ratio * 100) + '%';
  } else {
    dom.chargeBar.style.display = 'none'; dom.chargeLabel.style.display = 'none';
  }

  const all = S.gameState.entities.filter(e => e.hp > 0).sort((a, b) => b.level - a.level || b.hp - a.hp);
  dom.lbBody.innerHTML = all.slice(0, 8).map(e => {
    const isMe = e.id === S.myId;
    return '<div class="lb-row ' + (isMe ? 'me' : '') + '"><span>' + (e.isBoss ? '👑' : e.isBot ? '🤖' : '👤') + ' ' + e.name + '</span><span>Lv.' + e.level + '</span></div>';
  }).join('');

  if (typeof S.gameState.botKills === 'number') {
    dom.bossProgress.textContent = '☠ Bots to boss: ' + S.gameState.botKills + '/10';
  }

  // boss bar
  const boss = S.gameState.entities.find(e => e.isBoss);
  if (boss) {
    dom.bossBarWrap.style.display = 'block';
    dom.bossBarName.textContent = '👑 ' + boss.name + ' — PHASE ' + (boss.bossPhase || 1);
    dom.bossBarFill.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + '%';
  } else {
    dom.bossBarWrap.style.display = 'none';
  }
}
