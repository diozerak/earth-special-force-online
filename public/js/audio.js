// Звуки (WebAudio, синтез без ассетов)

import { S } from "./state.js";

const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  if (audioCtx.state === 'suspended') audioCtx.resume();
  return audioCtx;
}

export function playSound(type) {
  try {
    const ctx = getAudioCtx();
    const now = ctx.currentTime;
    const vol = S.masterVolume;

    switch (type) {
      case 'kamehamehaFire': {
        const o1 = ctx.createOscillator();
        const g1 = ctx.createGain();
        o1.type = 'sawtooth';
        o1.frequency.setValueAtTime(80, now);
        o1.frequency.exponentialRampToValueAtTime(600, now + 0.6);
        g1.gain.setValueAtTime(0.25 * vol, now);
        g1.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
        o1.connect(g1); g1.connect(ctx.destination);
        o1.start(now); o1.stop(now + 1.0);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'square';
        o2.frequency.setValueAtTime(40, now);
        o2.frequency.exponentialRampToValueAtTime(150, now + 0.8);
        g2.gain.setValueAtTime(0.18 * vol, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now); o2.stop(now + 1.2);
        break;
      }
      case 'kiCharge': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(520, now);
        o.frequency.linearRampToValueAtTime(780, now + 0.12);
        g.gain.setValueAtTime(0.12 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.25);
        break;
      }
      case 'kamehamehaCharge': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(70, now);
        o.frequency.linearRampToValueAtTime(130, now + 0.12);
        g.gain.setValueAtTime(0.1 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.22);
        break;
      }
      case 'meleeCharge': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(180, now);
        o.frequency.linearRampToValueAtTime(380, now + 0.1);
        g.gain.setValueAtTime(0.12 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.2);
        break;
      }
      case 'turbo': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(500, now);
        o.frequency.exponentialRampToValueAtTime(1400, now + 0.15);
        g.gain.setValueAtTime(0.2 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.35);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'triangle';
        o2.frequency.setValueAtTime(200, now);
        o2.frequency.exponentialRampToValueAtTime(50, now + 0.3);
        g2.gain.setValueAtTime(0.1 * vol, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now); o2.stop(now + 0.35);
        break;
      }
      case 'kiBlast': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(900, now);
        o.frequency.exponentialRampToValueAtTime(1400, now + 0.08);
        g.gain.setValueAtTime(0.12 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.18);
        break;
      }
      case 'pickup': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(660, now);
        o.frequency.setValueAtTime(990, now + 0.08);
        g.gain.setValueAtTime(0.15 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.3);
        break;
      }
      case 'bossSpawn': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(30, now + 1.2);
        g.gain.setValueAtTime(0.3 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 1.4);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 1.4);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'square';
        o2.frequency.setValueAtTime(55, now);
        o2.frequency.linearRampToValueAtTime(110, now + 0.5);
        g2.gain.setValueAtTime(0.15 * vol, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now); o2.stop(now + 1.2);
        break;
      }
      case 'bossDefeated': {
        [523, 659, 784, 1047].forEach((f, i) => {
          const o = ctx.createOscillator();
          const g = ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(f, now + i * 0.12);
          g.gain.setValueAtTime(0.15 * vol, now + i * 0.12);
          g.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.35);
          o.connect(g); g.connect(ctx.destination);
          o.start(now + i * 0.12); o.stop(now + i * 0.12 + 0.35);
        });
        break;
      }
      case 'phaseUp': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(150, now);
        o.frequency.exponentialRampToValueAtTime(600, now + 0.5);
        g.gain.setValueAtTime(0.2 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.6);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.6);
        break;
      }
      case 'meleeHit': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(120, now);
        o.frequency.exponentialRampToValueAtTime(25, now + 0.35);
        g.gain.setValueAtTime(0.3 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.45);

        const bufferSize = ctx.sampleRate * 0.12;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.18 * vol, now);
        ng.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
        noise.connect(ng); ng.connect(ctx.destination);
        noise.start(now);
        break;
      }
      case 'dash': {
        const bufferSize = Math.floor(ctx.sampleRate * 0.18);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.22 * vol, now);
        ng.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        noise.connect(ng); ng.connect(ctx.destination);
        noise.start(now);

        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(320, now);
        o.frequency.exponentialRampToValueAtTime(90, now + 0.15);
        g.gain.setValueAtTime(0.15 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.18);
        break;
      }
      case 'teleport': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'square';
        o.frequency.setValueAtTime(1400, now);
        o.frequency.exponentialRampToValueAtTime(180, now + 0.22);
        g.gain.setValueAtTime(0.14 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.25);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'sine';
        o2.frequency.setValueAtTime(2200, now);
        o2.frequency.exponentialRampToValueAtTime(600, now + 0.2);
        g2.gain.setValueAtTime(0.08 * vol, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now); o2.stop(now + 0.22);
        break;
      }
      case 'kiBeam': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(150, now);
        o.frequency.exponentialRampToValueAtTime(750, now + 0.3);
        g.gain.setValueAtTime(0.2 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.5);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'square';
        o2.frequency.setValueAtTime(60, now);
        o2.frequency.exponentialRampToValueAtTime(180, now + 0.35);
        g2.gain.setValueAtTime(0.12 * vol, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now); o2.stop(now + 0.5);
        break;
      }
      case 'slash': {
        const bufferSize = Math.floor(ctx.sampleRate * 0.2);
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * Math.sin((i / bufferSize) * Math.PI);
        const noise = ctx.createBufferSource();
        noise.buffer = buffer;
        const ng = ctx.createGain();
        ng.gain.setValueAtTime(0.2 * vol, now);
        ng.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        noise.connect(ng); ng.connect(ctx.destination);
        noise.start(now);

        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.setValueAtTime(900, now);
        o.frequency.exponentialRampToValueAtTime(250, now + 0.18);
        g.gain.setValueAtTime(0.12 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.2);
        break;
      }
      case 'grab': {
        const o = ctx.createOscillator();
        const g = ctx.createGain();
        o.type = 'sine';
        o.frequency.setValueAtTime(320, now);
        o.frequency.exponentialRampToValueAtTime(70, now + 0.28);
        g.gain.setValueAtTime(0.2 * vol, now);
        g.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
        o.connect(g); g.connect(ctx.destination);
        o.start(now); o.stop(now + 0.3);

        const o2 = ctx.createOscillator();
        const g2 = ctx.createGain();
        o2.type = 'sawtooth';
        o2.frequency.setValueAtTime(180, now);
        o2.frequency.linearRampToValueAtTime(240, now + 0.1);
        g2.gain.setValueAtTime(0.06 * vol, now);
        g2.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
        o2.connect(g2); g2.connect(ctx.destination);
        o2.start(now); o2.stop(now + 0.25);
        break;
      }
    }
  } catch (e) { /* audio blocked */ }
}
