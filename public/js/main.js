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

dom.startBtn.addEventListener('click', () => {
  S.roomId = dom.lobbyRoom.value.trim() || 'room-1';
  connect();
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
