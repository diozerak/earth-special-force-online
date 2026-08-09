// Общее состояние клиента (заменяет замыкание из старого монолитного скрипта)

export const S = {
  ws: null,
  myId: null,
  roomId: 'room-1',
  world: { w: 2000, h: 1500 },
  gameState: null,
  connected: false,
  W: 0, H: 0,
  camX: 0, camY: 0,
  localTick: 0,
  masterVolume: 0.6,
  bannerTimeout: null,
  // ввод
  keys: {},
  keyDownTimes: {},
  joyVector: { x: 0, y: 0 },
  joyActive: false,
  joyCenter: { x: 0, y: 0 },
  joyRadius: 60,
  joyKnobRadius: 25,
  lastDirKey: 'D',
  isTouchDevice: ('ontouchstart' in window || navigator.maxTouchPoints > 0),
  // звуки по изменению стейтов
  prevStates: new Map(),
  chargeTickCounters: new Map(),
};

export const PICKUP_INFO = {
  heal:  { emoji: '❤', color: '#22c55e', label: 'HEAL' },
  ki:    { emoji: '⚡', color: '#3b82f6', label: 'FULL KI' },
  power: { emoji: '💪', color: '#ef4444', label: 'POWER +60%' },
  speed: { emoji: '👟', color: '#fbbf24', label: 'SPEED +50%' },
  shield:{ emoji: '🛡', color: '#e2e8f0', label: 'SHIELD' }
};
