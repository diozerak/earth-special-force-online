// Ввод: клавиатура, джойстик, экранные кнопки

import { S } from "./state.js";
import * as dom from "./dom.js";
import { sendInput } from "./net.js";

export function initInput() {
  initZoomProtection();
  window.addEventListener('keydown', e => {
    const k = e.key.toUpperCase();
    if (!S.keys[k]) {
      S.keys[k] = true;
      S.keyDownTimes[k] = Date.now();
      if (['W', 'A', 'S', 'D'].includes(k)) S.lastDirKey = k;
      sendInput();
    }
  });
  window.addEventListener('keyup', e => {
    const k = e.key.toUpperCase();
    S.keys[k] = false;
    delete S.keyDownTimes[k];
    sendInput();
  });

  initJoystick();
  initActionButtons();

  dom.canvas.addEventListener('touchstart', e => e.preventDefault(), { passive: false });
  dom.canvas.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
}

// Защита от зума экрана при быстрых нажатиях на кнопки (двойной тап / pinch)
function initZoomProtection() {
  let lastTapEnd = 0;

  // двойной тап → зум: глушим второе касание серии
  document.addEventListener('touchend', e => {
    if (!S.connected) return; // в лобби не мешаем (поля ввода)
    const now = Date.now();
    if (now - lastTapEnd < 350) e.preventDefault();
    lastTapEnd = now;
  }, { passive: false });

  // pinch-зум (старый iOS Safari)
  document.addEventListener('gesturestart', e => {
    if (S.connected) e.preventDefault();
  });

  // двойной клик мышью/тачпадом
  document.addEventListener('dblclick', e => {
    if (S.connected) e.preventDefault();
  });
}

function initJoystick() {
  let joyTouchId = null;

  dom.joyZone.addEventListener('touchstart', e => {
    e.preventDefault();
    if (joyTouchId !== null) return;
    const t = e.changedTouches[0];
    joyTouchId = t.identifier;
    const rect = dom.joyZone.getBoundingClientRect();
    S.joyCenter = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    S.joyRadius = rect.width / 2 - 10;
    updateJoystick(t.clientX, t.clientY);
    const now = Date.now();
    if (now - (dom.joyZone._lastTap || 0) < 350) {
      S.keys['DASH'] = true; sendInput();
      setTimeout(() => { S.keys['DASH'] = false; sendInput(); }, 50);
    }
    dom.joyZone._lastTap = now;
    S.keyDownTimes['JOY'] = now;
  }, { passive: false });

  dom.joyZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        updateJoystick(e.changedTouches[i].clientX, e.changedTouches[i].clientY);
        break;
      }
    }
  }, { passive: false });

  dom.joyZone.addEventListener('touchend', e => {
    e.preventDefault();
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === joyTouchId) {
        joyTouchId = null; S.joyActive = false; S.joyVector = { x: 0, y: 0 };
        dom.joyKnob.style.transform = 'translate(0px,0px)';
        delete S.keyDownTimes['JOY']; sendInput(); break;
      }
    }
  }, { passive: false });
}

function updateJoystick(cx, cy) {
  let dx = cx - S.joyCenter.x, dy = cy - S.joyCenter.y;
  const d = Math.hypot(dx, dy);
  const maxDist = S.joyRadius - S.joyKnobRadius;
  if (d > maxDist) { dx = (dx / d) * maxDist; dy = (dy / d) * maxDist; }
  dom.joyKnob.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
  S.joyActive = true;
  S.joyVector = { x: dx / maxDist, y: dy / maxDist };
  if (d > 5) {
    if (Math.abs(S.joyVector.x) > Math.abs(S.joyVector.y)) S.lastDirKey = S.joyVector.x > 0 ? 'D' : 'A';
    else S.lastDirKey = S.joyVector.y > 0 ? 'S' : 'W';
  }
  sendInput();
}

function initActionButtons() {
  document.querySelectorAll('.act-btn').forEach(btn => {
    const key = btn.dataset.key;
    btn.addEventListener('touchstart', e => {
      e.preventDefault();
      S.keys[key] = true;
      S.keyDownTimes[key] = Date.now();
      btn.style.transform = 'scale(0.9)';
      btn.style.background = 'rgba(59,130,246,0.5)';
      sendInput();
    }, { passive: false });
    btn.addEventListener('touchend', e => {
      e.preventDefault();
      S.keys[key] = false;
      delete S.keyDownTimes[key];
      btn.style.transform = 'scale(1)';
      btn.style.background = 'rgba(30,41,59,0.7)';
      sendInput();
    }, { passive: false });
  });
}
