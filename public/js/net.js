// WebSocket: подключение, приём состояния, события, звуки по стейтам

import { S, PICKUP_INFO } from "./state.js";
import * as dom from "./dom.js";
import { log, showBanner } from "./hud.js";
import { playSound } from "./audio.js";

export function sendInput() {
  if (!S.connected || !S.ws || S.ws.readyState !== WebSocket.OPEN) return;
  S.ws.send(JSON.stringify({
    type: 'input',
    keys: S.keys,
    joyVector: S.joyVector,
    joyActive: S.joyActive,
    lastDirKey: S.lastDirKey,
    keyDownTimes: S.keyDownTimes
  }));
}

export function connect() {
  const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
  S.ws = new WebSocket(protocol + '//' + location.host + '/room/' + encodeURIComponent(S.roomId));

  S.ws.onopen = () => {
    const name = dom.lobbyName.value.trim() || 'Warrior';
    const password = dom.lobbyPassword.value.trim();
    const colors = {
      hair: dom.colHair.value,
      aura: dom.colAura.value,
      kameha: dom.colKameha.value,
      trail: dom.colTrail.value
    };
    S.ws.send(JSON.stringify({ type: 'join', name, colors, password }));
  };

  S.ws.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data);
      if (data.type === 'init') {
        S.myId = data.id;
        S.world = data.world;
        S.connected = true;
        dom.lobby.style.display = 'none';
        dom.canvas.style.display = 'block';
        dom.hud.style.display = 'flex';
        dom.stateBox.style.display = 'block';
        dom.leaderboard.style.display = 'block';
        dom.minimap.style.display = 'block';
        dom.settingsBtn.style.display = 'flex';
        if (S.isTouchDevice) { dom.joyZone.style.display = 'block'; dom.actionZone.style.display = 'block'; }
        log('Connected to ' + S.roomId, '#22d3ee');
      } else if (data.type === 'state') {
        handleStateSounds(data);
        S.gameState = data;
      } else if (data.type === 'playerList') {
        if (dom.lobby.style.display !== 'none') {
          dom.lobbyPlayers.innerHTML = '<div style="color:#fbbf24;font-weight:bold;margin-bottom:4px">In room:</div>' +
            data.list.map(p => '<div><span style="width:12px;height:12px;border-radius:50%;display:inline-block;background:' + p.colors.kameha + ';border:1px solid rgba(255,255,255,0.2);margin-right:6px"></span>' + p.name + '</div>').join('');
        }
      } else if (data.type === 'event') {
        if (data.kind === 'bossSpawn') {
          showBanner('☠ ' + data.name + ' HAS AWAKENED ☠', '#ef4444');
          playSound('bossSpawn');
          log('BOSS appeared: ' + data.name, '#ef4444');
        } else if (data.kind === 'bossDefeated') {
          showBanner('🏆 ' + data.name + ' DEFEATED! 🏆', '#fbbf24');
          playSound('bossDefeated');
          log('Boss defeated: ' + data.name + ' (+500 EXP, loot dropped)', '#fbbf24');
        } else if (data.kind === 'phaseUp') {
          showBanner(data.name + ' — PHASE ' + data.phase, data.phase === 2 ? '#f97316' : '#a855f7');
          playSound('phaseUp');
          log(data.name + ' entered phase ' + data.phase, '#f97316');
        } else if (data.kind === 'singularity') {
          showBanner('🌀 GRAVITY ANOMALY!', '#a855f7');
          log(data.name + ' created a singularity!', '#a855f7');
        } else if (data.kind === 'kill') {
          dom.bossProgress.textContent = '☠ Bots to boss: ' + data.count + '/' + data.need;
        } else if (data.kind === 'pickup' && data.name === dom.lobbyName.value.trim()) {
          const info = PICKUP_INFO[data.pickup];
          if (info) { log('Picked up: ' + info.label, info.color); playSound('pickup'); }
        }
      } else if (data.type === 'error') {
        log('Error: ' + data.message, '#ef4444');
      }
    } catch (e) { console.error(e); }
  };

  S.ws.onclose = () => { S.connected = false; log('Disconnected', '#ef4444'); };
  S.ws.onerror = () => { log('Connection error', '#ef4444'); };
}

export function handleStateSounds(data) {
  if (!data.entities) return;
  for (const e of data.entities) {
    const prev = S.prevStates.get(e.id);
    if (!prev) { S.prevStates.set(e.id, { state: e.state, turbo: e.turbo, grabTarget: e.grabTarget, tick: S.localTick }); continue; }

    if (prev.state === 'KAMEHAMEHA_CHARGE' && e.state === 'SUPER_ATTACK') {
      playSound('kamehamehaFire');
    }
    if (prev.state !== 'KI_BLAST' && e.state === 'KI_BLAST') {
      playSound('kiBlast');
    }
    if (prev.state === 'MELEE_CHARGE' && e.state === 'MELEE') {
      playSound('meleeHit');
    }
    if (!prev.turbo && e.turbo) {
      playSound('turbo');
    }
    if (prev.state !== 'DASH' && e.state === 'DASH') {
      playSound('dash');
    }
    if (prev.state !== 'TELEPORT' && e.state === 'TELEPORT') {
      playSound('teleport');
    }
    if (prev.state === 'KI_BEAM_CHARGE' && e.state === 'SUPER_ATTACK') {
      playSound('kiBeam');
    }
    if (prev.state !== 'SLASH' && e.state === 'SLASH') {
      playSound('slash');
    }
    if (!prev.grabTarget && e.grabTarget) {
      playSound('grab');
    }

    let ct = S.chargeTickCounters.get(e.id) || 0;
    if (e.state === 'KI_CHARGE') {
      ct++; if (ct >= 18) { playSound('kiCharge'); ct = 0; }
    } else if (e.state === 'KAMEHAMEHA_CHARGE') {
      ct++; if (ct >= 14) { playSound('kamehamehaCharge'); ct = 0; }
    } else if (e.state === 'MELEE_CHARGE') {
      ct++; if (ct >= 14) { playSound('meleeCharge'); ct = 0; }
    } else if (e.state === 'KI_BEAM_CHARGE') {
      ct++; if (ct >= 10) { playSound('kiCharge'); ct = 0; }
    } else {
      ct = 0;
    }
    S.chargeTickCounters.set(e.id, ct);

    S.prevStates.set(e.id, { state: e.state, turbo: e.turbo, grabTarget: e.grabTarget, tick: S.localTick });
  }
  const ids = new Set(data.entities.map(e => e.id));
  for (const id of S.prevStates.keys()) { if (!ids.has(id)) { S.prevStates.delete(id); S.chargeTickCounters.delete(id); } }
}
