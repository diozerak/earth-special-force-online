// Точка входа клиента: ресайз, лобби, настройки, игровой цикл

import { S } from "./state.js";
import * as dom from "./dom.js";
import { log } from "./hud.js";
import { connect } from "./net.js";
import { initInput } from "./input.js";
import { draw } from "./render.js";

function resize() {
  S.W = window.innerWidth;
  S.H = window.innerHeight;
  dom.canvas.width = S.W;
  dom.canvas.height = S.H;
}
window.addEventListener('resize', resize);
resize();

// CHARACTER SELECT: после лобби — экран настройки персонажа
let pendingLook = null;

function openCharSelect() {
  pendingLook = null;
  dom.csStatus.textContent = 'Customize your character, then press "Use this character" in the editor';
  dom.csFight.disabled = true;
  dom.charselect.style.display = 'flex';
}
function closeCharSelect() {
  dom.charselect.style.display = 'none';
}

window.addEventListener('message', e => {
  if (e.data && e.data.type === 'esf-look') {
    pendingLook = e.data.look;
    dom.csStatus.textContent = '✓ Character look loaded — press FIGHT';
    dom.csFight.disabled = false;
  }
});

dom.startBtn.addEventListener('click', () => {
  S.roomId = dom.lobbyRoom.value.trim() || 'room-1';
  openCharSelect();
});

dom.csFight.addEventListener('click', () => { closeCharSelect(); connect(pendingLook); });
dom.csSkip.addEventListener('click', () => { closeCharSelect(); connect(null); });
dom.csClose.addEventListener('click', () => closeCharSelect());
dom.csRandom.addEventListener('click', () => {
  if (dom.csFrame.contentWindow) dom.csFrame.contentWindow.postMessage({ type: 'esf-randomize' }, '*');
});

dom.botAdd.addEventListener('click', () => {
  if (S.connected && S.ws && S.ws.readyState === WebSocket.OPEN) {
    S.ws.send(JSON.stringify({ type: 'botControl', action: 'add' }));
    log('+ Bot added', '#22c55e');
  } else {
    log('Not connected to a room', '#ef4444');
  }
});

dom.botRemove.addEventListener('click', () => {
  if (S.connected && S.ws && S.ws.readyState === WebSocket.OPEN) {
    S.ws.send(JSON.stringify({ type: 'botControl', action: 'remove' }));
    log('- Bot removed', '#f97316');
  } else {
    log('Not connected to a room', '#ef4444');
  }
});

initInput();

// Настройки
dom.settingsBtn.addEventListener('click', () => {
  dom.settingsPanel.style.display = dom.settingsPanel.style.display === 'block' ? 'none' : 'block';
});
dom.toggleLog.addEventListener('click', () => {
  const showing = dom.logEl.style.display !== 'none';
  dom.logEl.style.display = showing ? 'none' : 'block';
  dom.toggleLog.textContent = showing ? 'OFF' : 'ON';
  dom.toggleLog.classList.toggle('active', !showing);
});
dom.volSlider.addEventListener('input', () => {
  S.masterVolume = parseInt(dom.volSlider.value) / 100;
});

function loop() {
  try { draw(); } catch (err) { console.error('draw error:', err); }
  requestAnimationFrame(loop);
}
loop();
